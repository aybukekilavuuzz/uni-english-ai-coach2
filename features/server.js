const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const os = require("os");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const geminiApiKey = process.env.GEMINI_API_KEY;
/**
 * Sıra: env ile tek model zorlanabilir; yoksa önce sürümlü/latest adlar (çıplak `gemini-1.5-flash` çoğu projede 404).
 * 429 kotası olan model atlanıp sıradaki denenir (ör. `gemini-2.0-flash` limit 0 iken `flash-lite` çalışabilir).
 */
const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash",
  "gemini-2.5-pro-preview-05-06",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-002",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash"
];

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

let cachedListModelIds = null;
let cachedListModelIdsAt = 0;
const LIST_MODELS_TTL_MS = 10 * 60 * 1000;

function dedupeModelNames(names) {
  return names.filter((name, i, arr) => name && arr.indexOf(name) === i);
}

/**
 * Bu API anahtarı için gerçekten var olan ve generateContent destekleyen modeller (REST ListModels).
 */
async function fetchGeneratableModelIds(apiKey) {
  const ver = process.env.GEMINI_API_VERSION === "v1" ? "v1" : "v1beta";
  const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url);
    const bodyText = await res.text();
    if (!res.ok) {
      console.error("ListModels HTTP", res.status, bodyText.slice(0, 500));
      return [];
    }
    const data = JSON.parse(bodyText);
    const models = Array.isArray(data.models) ? data.models : [];
    return models
      .filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes("generateContent")
      )
      .map((m) => String(m.name || "").replace(/^models\//, ""))
      .filter(Boolean);
  } catch (e) {
    console.error("ListModels failed:", e);
    return [];
  }
}

async function buildGeminiModelCandidates(apiKey) {
  const now = Date.now();
  if (!cachedListModelIds || now - cachedListModelIdsAt > LIST_MODELS_TTL_MS) {
    cachedListModelIds = await fetchGeneratableModelIds(apiKey);
    cachedListModelIdsAt = now;
    if (cachedListModelIds.length) {
      console.log(
        "Gemini ListModels (generateContent), first IDs:",
        cachedListModelIds.slice(0, 12).join(", ") + (cachedListModelIds.length > 12 ? " …" : "")
      );
    } else {
      console.warn("Gemini ListModels returned no generateContent models (or ListModels failed).");
    }
  }
  const envModel = process.env.GEMINI_MODEL;
  return dedupeModelNames([envModel, ...cachedListModelIds, ...DEFAULT_GEMINI_MODELS]);
}

/** İsteğe bağlı: GEMINI_API_VERSION=v1 | v1beta (varsayılan: SDK = v1beta, yani ikinci argüman verilmez). */
function getGeminiModel(modelName) {
  const ver = process.env.GEMINI_API_VERSION;
  if (ver && ver !== "v1beta") {
    return genAI.getGenerativeModel({ model: modelName }, { apiVersion: ver });
  }
  return genAI.getGenerativeModel({ model: modelName });
}

/** 404: model yok; 429: kota — sıradaki modele geç. */
function shouldTryNextGeminiModel(error) {
  const status = error?.status;
  if (status === 404 || status === 429) return true;
  const msg = String(error?.message || error || "").toLowerCase();
  return (
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("resource exhausted")
  );
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function buildPrompt(text) {
  return `
Analyze the following academic English text and return ONLY JSON.

Rules:
- Cevabi SADECE saf JSON formatinda ver.
- Basina veya sonuna markdown (ör. \`\`\`json veya \`\`\`) EKLEME.
- Output valid JSON only, no markdown fences.
- Keep language very simple (A2-B1 CEFR level) for the summary so beginners can easily understand it.
- Randomize the positions of correct answers in the quiz.
- Follow this schema exactly:
{
  "summary": ["...", "...", "...", "...", "..."],
  "terms": [
    { "term": "...", "meaning": "..." }
  ],
  "quiz": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A"
    }
  ]
}

Constraints:
- summary: exactly 5 bullet sentences.
- terms: exactly 5 technical terms from the text.
- quiz: exactly 3 multiple-choice questions.
- For each quiz item provide 4 options and 1 correct answer.

Text:
${text}
  `.trim();
}

function extractJsonText(candidate) {
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return candidate.slice(firstBrace, lastBrace + 1);
}

function sanitizeJsonText(candidate) {
  if (!candidate || typeof candidate !== "string") return null;

  let text = candidate.trim();

  // Handle ```json ... ``` and ``` ... ``` wrappers.
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) text = fencedMatch[1].trim();

  // Handle leading "json" token the model sometimes emits.
  text = text.replace(/^\s*json\s*/i, "").trim();

  // Try parsing as-is after basic trimming.
  try {
    JSON.parse(text);
    return text;
  } catch {
    // Continue sanitization steps.
  }

  // Remove common trailing-comma issue: { "a": 1, } -> { "a": 1 }
  const fixTrailingCommas = (jsonLike) =>
    jsonLike.replace(/,\s*([}\]])/g, "$1");

  // Try to extract an object or array substring.
  const objectText = extractJsonText(text);
  if (objectText) {
    const fixed = fixTrailingCommas(objectText);
    try {
      JSON.parse(fixed);
      return fixed;
    } catch {
      // fallthrough
    }
  }

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const arrayText = text.slice(firstBracket, lastBracket + 1);
    const fixed = fixTrailingCommas(arrayText);
    try {
      JSON.parse(fixed);
      return fixed;
    } catch {
      // fallthrough
    }
  }

  return null;
}

function normalizeOutput(data) {
  const safeSummary = Array.isArray(data.summary) ? data.summary.slice(0, 5) : [];
  const safeTerms = Array.isArray(data.terms) ? data.terms.slice(0, 5) : [];
  const safeQuiz = Array.isArray(data.quiz) ? data.quiz.slice(0, 3) : [];

  return {
    summary: safeSummary.map((item) => String(item)),
    terms: safeTerms.map((item) => ({
      term: String(item.term || ""),
      meaning: String(item.meaning || "")
    })),
    quiz: safeQuiz.map((item) => ({
      question: String(item.question || ""),
      options: Array.isArray(item.options) ? item.options.slice(0, 4).map((v) => String(v)) : [],
      answer: String(item.answer || "")
    }))
  };
}

function mockResponse() {
  return {
    summary: [
      "The text explains a core academic concept with practical examples.",
      "It compares previous research and current findings.",
      "It highlights methods used to evaluate the topic.",
      "It discusses key results and their implications.",
      "It suggests areas for future work and improvement."
    ],
    terms: [
      { term: "Hypothesis", meaning: "A testable statement about expected outcomes." },
      { term: "Methodology", meaning: "The systematic approach used in a study." },
      { term: "Variable", meaning: "A factor that can change and be measured." },
      { term: "Findings", meaning: "The main results obtained from analysis." },
      { term: "Implication", meaning: "A possible effect or meaning of the result." }
    ],
    quiz: [
      {
        question: "What is the main purpose of the text?",
        options: ["To tell a personal story", "To analyze an academic topic", "To advertise a product", "To give travel tips"],
        answer: "To analyze an academic topic"
      },
      {
        question: "Which part usually describes how a study was conducted?",
        options: ["Conclusion", "References", "Methodology", "Appendix"],
        answer: "Methodology"
      },
      {
        question: "What do findings represent in an academic text?",
        options: ["Unrelated opinions", "Formatting rules", "Study results", "Author biography"],
        answer: "Study results"
      }
    ]
  };
}

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length < 80) {
      return res.status(400).json({ error: "Please enter at least 80 characters of academic text." });
    }

    if (!geminiApiKey) {
      return res.json({
        ...mockResponse(),
        source: "mock",
        note: "GEMINI_API_KEY is missing. Mock response returned."
      });
    }

    const prompt = buildPrompt(text.trim());

    const modelCandidates = await buildGeminiModelCandidates(geminiApiKey);
    let candidate = "";
    let lastError;
    let saw404 = false;
    let saw429 = false;
    const apiLabel = process.env.GEMINI_API_VERSION || "v1beta (SDK default)";
    for (const modelName of modelCandidates) {
      try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContent(prompt);
        candidate = result?.response?.text?.() || "";
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (error?.status === 404) saw404 = true;
        if (error?.status === 429) saw429 = true;
        if (!shouldTryNextGeminiModel(error)) throw error;
        const reason = error?.status === 429 ? "429 quota" : "404 / not usable";
        console.error(`Gemini ${reason} for model "${modelName}" (API: ${apiLabel}):`, error);
      }
    }
    if (lastError && !candidate) {
      const mockFallback = process.env.MOCK_ON_GEMINI_FAILURE === "true" || process.env.MOCK_ON_GEMINI_FAILURE === "1";
      if (mockFallback) {
        return res.json({
          ...mockResponse(),
          source: "mock",
          note:
            "Gemini failed across all models (404 and/or quota exceeded). A mock response was returned since MOCK_ON_GEMINI_FAILURE is enabled. For a new API key, billing, or quota: https://aistudio.google.com/apikey"
        });
      }
      if (saw429) {
        return res.status(429).json({
          error:
            "Quota exceeded for at least one Gemini model, or the free tier limit is 0. Please enable billing, try an API key from a different Google project, or check your rate limits.",
          detail: lastError.message,
          saw404,
          docs: "https://ai.google.dev/gemini-api/docs/rate-limits"
        });
      }
      return res.status(502).json({
        error:
          "No Gemini models are accessible with this API key (404: models not granted). Please generate a new key in AI Studio or specify the exact model name under GEMINI_MODEL.",
        detail: lastError.message,
        docs: "https://aistudio.google.com/apikey"
      });
    }

    // Gemini'den dönen ham metni (JSON parse/sanitize öncesi) loglayalım.
    console.log("Gemini raw candidate text:", candidate);

    const jsonText = sanitizeJsonText(candidate);

    if (!jsonText) {
      console.error("Gemini response is not valid JSON after sanitize.", candidate);
      return res.status(500).json({ error: "AI response could not be parsed as JSON." });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      console.error("JSON.parse failed. jsonText:", jsonText);
      return res.status(500).json({ error: "AI returned invalid JSON format." });
    }

    return res.json({
      ...normalizeOutput(parsed),
      source: "gemini"
    });
  } catch (error) {
    console.error("Unexpected server error in /analyze:", error);
    if (error?.status === 429) {
      return res.status(429).json({
        error:
          "Gemini API quota exceeded. Please try again later or check your limits at https://ai.google.dev/gemini-api/docs/rate-limits.",
        detail: error.message
      });
    }
    return res.status(500).json({
      error: "Unexpected server error.",
      detail: error.message
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Uni-English AI Coach running on http://localhost:${port}`);
  
  const nets = os.networkInterfaces();
  console.log("\nTo test from a tablet or phone, connect to the same Wi-Fi network and access one of the following addresses:");
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`=> http://${net.address}:${port}`);
      }
    }
  }
  console.log("");
});
