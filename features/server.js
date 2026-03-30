const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const Groq = require("groq-sdk"); // Groq kütüphanesi

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- GROQ API YAPILANDIRMASI ---
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "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"
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Analiz Endpoint'i
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length < 80) {
      return res.status(400).json({ error: "Lütfen en az 80 karakterlik akademik bir metin girin." });
    }

    console.log("[Sistem] Groq Llama-3 ile analiz başlatılıyor...");

    // Groq API Çağrısı (Işık hızında!)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an academic English assistant. Return ONLY valid JSON."
        },
        {
          role: "user",
          content: `Analyze the following text and return a JSON object with this exact schema:
          {
            "summary": ["exactly 5 bullet sentences in simple A2-B1 English"],
            "terms": [{"term": "technical word", "meaning": "simple definition"}],
            "quiz": [{"question": "text", "options": ["A", "B", "C", "D"], "answer": "correct_option_text"}]
          }
          Constraints: Exactly 5 bullets for summary, 5 terms, and 3 quiz questions.
          Text: ${text}`
        }
      ],
      model: "llama-3.3-70b-versatile", // Groq'un en iyi ve hızlı modeli
      response_format: { type: "json_object" } // JSON garantisi
    });

    const responseContent = chatCompletion.choices[0].message.content;
    const parsedData = JSON.parse(responseContent);

    console.log("[Sistem] Analiz başarıyla tamamlandı.");
    
    return res.json({
      ...parsedData,
      source: "groq-ai"
    });

  } catch (error) {
    console.error("Groq API Hatası:", error.message);
    return res.status(500).json({ 
      error: "Yapay zeka şu an meşgul, lütfen tekrar deneyin.",
      detail: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Uni-English AI Coach GROQ ile port ${port} üzerinde uçuyor! 🚀`);
});
