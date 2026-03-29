const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const os = require("os");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- DİKKAT: API KEY AYARI ---
// Vercel'deki Environment Variable çalışmazsa, tırnak içine yeni aldığın Key'i yazabilirsin.
// Eğer Vercel çalışıyorsa process.env.GEMINI_API_KEY kısmına dokunma.
const geminiApiKey = process.env.GEMINI_API_KEY || "BURAYA_ALDIĞIN_YENİ_KEYİ_YAPIŞTIRABİLİRSİN";

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// MODEL SADECE gemini-1.5-flash OLARAK SABİTLENDİ
const GEMINI_MODEL_NAME = "gemini-1.5-flash";

function getGeminiModel() {
  if (!genAI) return null;
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    generationConfig: { responseMimeType: "application/json" }
  });
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Prompt Yapılandırması (A2-B1 Seviyesi Özet)
function buildPrompt(text) {
  return `Analyze the following academic English text and return ONLY JSON.
Rules:
- Output valid JSON only, no markdown fences.
- Keep summary simple (A2-B1 CEFR level).
- IMPORTANT: Randomize the positions of correct answers in the quiz.
{
  "summary": ["sent1", "sent2", "sent3", "sent4", "sent5"],
  "terms": [{ "term": "...", "meaning": "..." }],
  "quiz": [{ "question": "...", "options": ["A", "B", "C", "D"], "answer": "A" }]
}
Text: ${text}`.trim();
}

// Analiz Endpoint'i
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || text.length < 80) {
      return res.status(400).json({ error: "Please enter at least 80 characters." });
    }

    if (!genAI) {
      return res.status(500).json({ error: "API Key is missing!" });
    }

    const model = getGeminiModel();
    const prompt = buildPrompt(text);
    
    console.log("[Gemini] Requesting: " + GEMINI_MODEL_NAME);
    const result = await model.generateContent(prompt);
    const candidate = result.response.text();

    // JSON temizleme ve gönderme
    const jsonText = candidate.substring(candidate.indexOf("{"), candidate.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText);

    return res.json({ ...parsed, source: "gemini" });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(error.status || 500).json({ 
        error: "Gemini Error: " + error.message 
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Uni-English AI Coach running on http://localhost:${port}`);
});
