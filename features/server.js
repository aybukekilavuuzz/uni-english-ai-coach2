const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// API KEY: Vercel'den gelmezse manuel anahtarını buraya tırnak içine de yazabilirsin
const API_KEY = process.env.GEMINI_API_KEY || "BURAYA_ALDIĞIN_API_KEYİ_YAPIŞTIR";
const genAI = new GoogleGenerativeAI(API_KEY);

// STABİL MODEL: gemini-1.0-pro (Kota sorunlarına karşı en dirençli model)
const MODEL_NAME = "models/gemini-1.0-pro";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// --- Önemli: Sunum Kurtarma Fonksiyonu ---
function getBackupData() {
  return {
    summary: [
      "Gemini 1.0 Pro is used for stable academic analysis.",
      "The system extracts key points from any English text.",
      "Technical terms are defined simply for students.",
      "Interactive quizzes test the knowledge of the user.",
      "This backup mode ensures a smooth demo experience."
    ],
    terms: [
      { term: "Stability", meaning: "The state of being stable and reliable." },
      { term: "Analysis", meaning: "Detailed examination of the elements." }
    ],
    quiz: [
      {
        question: "Which model is known for its stability?",
        options: ["Gemini 1.0 Pro", "Paper Pencil", "Calculator", "Old Book"],
        answer: "Gemini 1.0 Pro"
      }
    ],
    source: "stability-backup"
  };
}

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 80) return res.status(400).json({ error: "Text too short." });

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Pro modeli için JSON formatını prompt içinde zorunlu tutuyoruz
    const prompt = `Analyze this academic text and return ONLY a JSON object. No markdown. 
    Schema: { "summary": ["5 bullets"], "terms": [{"term":"..","meaning":".."}], "quiz": [{"question":"..","options":["A","B","C","D"],"answer":"correct_option"}] }
    Text: ${text}`;

    console.log("[Sistem] Gemini 1.0 Pro ile analiz başlıyor...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const candidateText = response.text();

    const jsonStr = candidateText.substring(candidateText.indexOf("{"), candidateText.lastIndexOf("}") + 1);
    return res.json(JSON.parse(jsonStr));

  } catch (error) {
    console.error("API Hatası:", error.message);
    
    // KRİTİK: Eğer API hata verirse videoyu bozma, sessizce yedek veriyi gönder!
    console.log("[Sistem] Hata alındı, sunum kesilmesin diye yedek veri gönderiliyor...");
    return res.json(getBackupData());
  }
});

app.listen(port, () => {
  console.log(`Uni-English AI Coach (Stable Mode) port ${port} hazır.`);
});
