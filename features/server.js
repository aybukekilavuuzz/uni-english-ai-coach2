const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// --- SUNUM MODU (MOCK DATA) ---
// API yoğunluğu olduğunda videoyu kurtaracak hazır veri seti
function getMockResponse() {
  return {
    summary: [
      "Artificial Intelligence (AI) is transforming how we process complex information.",
      "Academic researchers use AI tools to summarize long articles quickly.",
      "The system identifies key technical terms and provides simple meanings.",
      "Interactive quizzes help students test their understanding of the text.",
      "Modern UI designs improve the overall learning experience for students."
    ],
    terms: [
      { term: "Neural Networks", meaning: "A series of algorithms that mimic the human brain." },
      { term: "Data Mining", meaning: "The process of discovering patterns in large data sets." },
      { term: "Algorithm", meaning: "A set of rules to be followed in calculations." },
      { term: "Machine Learning", meaning: "AI that allows systems to learn from data." },
      { term: "Automation", meaning: "The use of technology to perform tasks without human help." }
    ],
    quiz: [
      {
        question: "What is the primary benefit of using AI for academic research?",
        options: ["Slower reading", "Saving time on summaries", "Deleting old files", "Printing more paper"],
        answer: "Saving time on summaries"
      },
      {
        question: "Which term describes AI learning from data patterns?",
        options: ["Hard Drive", "Software Update", "Machine Learning", "Manual Entry"],
        answer: "Machine Learning"
      },
      {
        question: "What is the role of Neural Networks?",
        options: ["Miming the brain", "Cleaning the keyboard", "Cooking food", "Playing music"],
        answer: "Miming the brain"
      }
    ],
    source: "demo-mode",
    note: "Sunum modu aktif: Kesintisiz demo performansı için hazır veri kullanılıyor."
  };
}

// Analiz Endpoint'i (Doğrudan Hazır Veri Döndürür)
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length < 80) {
      return res.status(400).json({ error: "Lütfen analiz için yeterli uzunlukta bir metin girin." });
    }

    // Bekleme efekti yaratmak için 1.5 saniye gecikme (Opsiyonel, daha gerçekçi durur)
    setTimeout(() => {
      return res.json(getMockResponse());
    }, 1500);

  } catch (error) {
    return res.status(500).json({ error: "Sunucu hatası oluştu." });
  }
});

app.listen(port, () => {
  console.log(`Uni-English AI Coach (Sunum Modu) port ${port} üzerinde hazır.`);
});
