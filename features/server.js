const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- KRİTİK AYAR: API KEY ---
// Vercel'deki değişken çalışmıyorsa, BURAYA tırnak içine yeni aldığın Key'i yapıştır.
const API_KEY = process.env.GEMINI_API_KEY || "BURAYA_ALDIĞIN_API_KEYİ_YAPIŞTIR";

const genAI = new GoogleGenerativeAI(API_KEY);

// Hata mesajındaki öneriye göre "models/" ön eki eklendi
const MODEL_NAME = "models/gemini-1.5-flash";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Analiz Fonksiyonu
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length < 80) {
      return res.status(400).json({ error: "Lütfen en az 80 karakterlik bir metin girin." });
    }

    // Modeli en temel haliyle çağırıyoruz
    const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Analyze this academic text and return ONLY a JSON object with "summary" (5 bullets), "terms" (5 words+meanings), and "quiz" (3 questions with randomized options A-D). Text: ${text}`;

    console.log("[Sistem] Analiz başlatılıyor: " + MODEL_NAME);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const candidateText = response.text();

    // JSON temizleme (Markdown işaretlerini kaldırır)
    const jsonStr = candidateText.substring(
        candidateText.indexOf("{"), 
        candidateText.lastIndexOf("}") + 1
    );

    return res.json(JSON.parse(jsonStr));

  } catch (error) {
    console.error("Detaylı Hata:", error);
    return res.status(500).json({ 
        error: "Sistem şu an meşgul veya API hatası oluştu.",
        message: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda hazır.`);
});
