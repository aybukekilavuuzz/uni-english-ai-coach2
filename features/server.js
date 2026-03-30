const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// API KEY: Vercel'deki değişkeni okur, yoksa manuel yazdığını okur.
const API_KEY = process.env.GEMINI_API_KEY || "YENI_ALDIĞIN_API_KEYI_BURAYA_YAZ";
const genAI = new GoogleGenerativeAI(API_KEY);

// Model ismini 'models/' ön ekiyle yazmak en güvenlisidir
const MODEL_NAME = "models/gemini-1.5-flash";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 80) return res.status(400).json({ error: "Text too short." });

    const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Analyze this academic English text and return ONLY a JSON object.
    Required Schema: { "summary": ["5 bullets"], "terms": [{"term":"word","meaning":"definition"}], "quiz": [{"question":"q","options":["A","B","C","D"],"answer":"correct_answer_text"}] }
    Text: ${text}`;

    console.log("[Sistem] Gerçek AI Analizi Başlatılıyor...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const candidateText = response.text();
    
    // JSON Temizleme (Markdown işaretlerini siler)
    const jsonStr = candidateText.substring(candidateText.indexOf("{"), candidateText.lastIndexOf("}") + 1);
    
    return res.json(JSON.parse(jsonStr));

  } catch (error) {
    console.error("API Hatası:", error.message);
    return res.status(500).json({ 
        error: "Yapay zeka şu an yanıt veremiyor.",
        detail: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Uni-English AI Coach gerçek AI modunda ${port} portunda çalışıyor.`);
});
