const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const os = require("os");
const Groq = require("groq-sdk");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const groqApiKey = process.env.GROQ_API_KEY;

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// SADECE llama-3.3-70b-versatile SABİTLENDİ
const GROQ_MODEL_NAME = "llama-3.3-70b-versatile";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function buildPrompt(text) {
  return `
You are an expert English teacher. Analyze the academic text below and return ONLY a valid JSON object.

CRITICAL INSTRUCTIONS:
1. SUMMARY: Provide EXACTLY 5 bullet points summarizing the text in very simple English (A2-B1 CEFR level).
2. TERMS: Extract EXACTLY 5 technical/academic terms from the text and provide their meanings.
3. QUIZ: Create EXACTLY 3 multiple-choice questions to test understanding.
   - Provide EXACTLY 4 options per question.
   - ⚠️ CRITICAL ⚠️: The correct answer MUST NOT always be the first option. You MUST randomize the position of the correct answer across the 4 options for each question!
   - The 'answer' field MUST exactly match the text of the correct option.
4. FORMAT: Output MUST be pure, raw JSON. NO markdown fences (\`\`\`json), NO extra text before or after.

JSON SCHEMA:
{
  "summary": ["string", "string", "string", "string", "string"],
  "terms": [
    { "term": "string", "meaning": "string" },
    { "term": "string", "meaning": "string" },
    { "term": "string", "meaning": "string" },
    { "term": "string", "meaning": "string" },
    { "term": "string", "meaning": "string" }
  ],
  "quiz": [
    {
      "question": "string",
      "options": ["Random Option 1", "Random Option 2", "Random Option 3", "Random Option 4"],
      "answer": "Exact text of the correct option"
    }
  ]
}

Text to analyze:
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
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) text = fencedMatch[1].trim();
  text = text.replace(/^\s*json\s*/i, "").trim();

  try {
    JSON.parse(text);
    return text;
  } catch (e) {}

  const fixTrailingCommas = (jsonLike) => jsonLike.replace(/,\s*([}\]])/g, "$1");
  const objectText = extractJsonText(text);
  if (objectText) {
    const fixed = fixTrailingCommas(objectText);
    try {
      JSON.parse(fixed);
      return fixed;
    } catch (e) {}
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

    if (!groqApiKey) {
      return res.json({
        ...mockResponse(),
        source: "mock",
        note: "GROQ_API_KEY is missing. Mock response returned."
      });
    }

    const prompt = buildPrompt(text.trim());

    console.log("[Groq] Istek Gonderiliyor: " + GROQ_MODEL_NAME);
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      model: GROQ_MODEL_NAME,
      response_format: { type: "json_object" }
    });

    const candidate = completion.choices[0]?.message?.content || "";

    console.log("Groq raw candidate text:", candidate);

    const jsonText = sanitizeJsonText(candidate);
    if (!jsonText) {
      console.error("Groq response is not valid JSON after sanitize.", candidate);
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
      source: "groq"
    });

  } catch (error) {
    console.error("Groq API Error:", error);

    if (error?.status === 429 || error?.message?.toLowerCase().includes("rate limit") || error?.message?.toLowerCase().includes("quota")) {
      return res.status(429).json({
        error: "Groq API rate limit exceeded. Please try again later.",
        detail: error.message
      });
    }

    if (error?.status === 404 || error?.message?.toLowerCase().includes("not found")) {
      return res.status(404).json({
        error: "Model 'llama-3.3-70b-versatile' is not accessible. Please check your Groq API settings.",
        detail: error.message
      });
    }

    if (error?.status === 400 || error?.message?.toLowerCase().includes("bad request")) {
        return res.status(400).json({
          error: "API request was rejected by Groq (Bad Request). Check constraints, parameters, or formatting.",
          detail: error.message
        });
    }

    return res.status(500).json({
      error: "Unexpected server error while contacting Groq.",
      detail: error.message
    });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Uni-English AI Coach running on http://localhost:${port} with Groq`);
    
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
}

// Vercel Serverless Function için dışa aktar (FUNCTION_INVOCATION_FAILED engeller)
module.exports = app;
