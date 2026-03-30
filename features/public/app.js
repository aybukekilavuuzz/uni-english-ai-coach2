const inputText = document.getElementById("inputText");
const analyzeBtn = document.getElementById("analyzeBtn");
const statusText = document.getElementById("statusText");
const results = document.getElementById("results");
const summaryList = document.getElementById("summaryList");
const termsList = document.getElementById("termsList");
const quizList = document.getElementById("quizList");
const loadingState = document.getElementById("loadingState");
const btnLabel = document.getElementById("btnLabel");

// Skor takibi için global değişkenler
let currentQuizData = [];
let userScore = 0;
let answeredQuestions = 0;

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function toggleLoading(isLoading) {
  analyzeBtn.disabled = isLoading || inputText.value.trim().length < 80;
  if (btnLabel) btnLabel.classList.toggle("hidden", isLoading);
  if (loadingState) {
    loadingState.classList.toggle("hidden", !isLoading);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderSummary(summary) {
  summaryList.innerHTML = "";
  summary.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    summaryList.appendChild(li);
  });
}

function renderTerms(terms) {
  termsList.innerHTML = "";
  terms.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="term-name">${escapeHtml(String(item.term || ""))}:</span> ${escapeHtml(String(item.meaning || ""))}`;
    termsList.appendChild(li);
  });
}

// Şıklardaki A) B) gibi önekleri temizler
function stripOptionPrefix(s) {
  return String(s || "").replace(/^[A-D][\.\)\-\:]\s*/i, "").trim();
}

// Cevap Kontrolü: Tıklama anında ikonları ve renkleri yönetir
function handleAnswer(event) {
  const btn = event.currentTarget;
  const optionsContainer = btn.parentElement;
  
  // Eğer soruya zaten cevap verildiyse işlem yapma
  if (optionsContainer.dataset.answered === "true") return;
  optionsContainer.dataset.answered = "true";

  const qIndex = parseInt(btn.dataset.qindex, 10);
  const optIndex = parseInt(btn.dataset.optindex, 10);
  const questionData = currentQuizData[qIndex];
  const isCorrect = questionData.options[optIndex].isCorrect;

  if (isCorrect) {
    userScore++;
  }
  answeredQuestions++;

  // Tüm butonları devre dışı bırak ve doğru/yanlış renklerini/ikonlarını ekle
  const buttons = optionsContainer.querySelectorAll(".quiz-option-btn");
  questionData.options.forEach((opt, i) => {
    buttons[i].disabled = true;
    const iconSpan = buttons[i].querySelector(".opt-icon");
    
    if (opt.isCorrect) {
      // Doğru şık her zaman yeşil olur
      buttons[i].classList.add("correct");
      iconSpan.innerHTML = "&#10003;"; // ✓
    } else if (i === optIndex && !isCorrect) {
      // Eğer kullanıcı yanlış şıkka tıkladıysa o kırmızı olur
      buttons[i].classList.add("wrong");
      iconSpan.innerHTML = "&#10007;"; // ✕
    }
  });

  // Quiz bittiyse o havalı yeşil skor kartını göster
  if (answeredQuestions === currentQuizData.length) {
    showScoreCard();
  }
}

function showScoreCard() {
  // Eski skor kartı varsa temizle
  const oldCard = document.querySelector(".score-card");
  if (oldCard) oldCard.remove();

  const scoreCard = document.createElement("div");
  scoreCard.className = "score-card";
  scoreCard.innerHTML = `<h3 class="score-title">General Score: ${userScore} / ${currentQuizData.length}</h3>`;
  quizList.appendChild(scoreCard);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function displayQuiz(quiz) {
  quizList.innerHTML = "";
  userScore = 0;
  answeredQuestions = 0;
  
  currentQuizData = quiz.map((item, qIndex) => {
    const rawOptions = Array.isArray(item.options) ? item.options : [];
    const rawAnswer = String(item.answer || "").trim();
    
    // Doğru şıkkı bul ve işaretle
    let optionsObjects = rawOptions.map(optText => ({
      text: stripOptionPrefix(optText),
      isCorrect: stripOptionPrefix(optText).toLowerCase() === stripOptionPrefix(rawAnswer).toLowerCase()
    }));

    // Eğer hiçbir şık eşleşmediyse (hata önleyici), ilk şıkkı doğru kabul et
    if (!optionsObjects.some(o => o.isCorrect)) optionsObjects[0].isCorrect = true;

    // Şıkları karıştır
    optionsObjects = shuffleArray(optionsObjects);

    return { question: item.question, options: optionsObjects };
  });

  // Soruları ekrana bas
  currentQuizData.forEach((qData, qIndex) => {
    const block = document.createElement("div");
    block.className = "quiz-item";

    const qText = document.createElement("p");
    qText.className = "quiz-item__q";
    qText.textContent = qData.question;
    block.appendChild(qText);

    const optionsGrid = document.createElement("div");
    optionsGrid.className = "quiz-options";

    const letters = ["A", "B", "C", "D"];
    qData.options.forEach((opt, optIndex) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option-btn";
      btn.dataset.qindex = qIndex;
      btn.dataset.optindex = optIndex;
      
      btn.innerHTML = `
        <span class="opt-text">${letters[optIndex]}) ${opt.text}</span>
        <span class="opt-icon"></span>
      `;
      
      btn.addEventListener("click", handleAnswer);
      optionsGrid.appendChild(btn);
    });

    block.appendChild(optionsGrid);
    quizList.appendChild(block);
  });
}

function normalizeClientData(data) {
  return {
    summary: Array.isArray(data.summary) ? data.summary : [],
    terms: Array.isArray(data.terms) ? data.terms : [],
    quiz: Array.isArray(data.quiz) ? data.quiz : []
  };
}

inputText.addEventListener("input", () => {
  const enoughLength = inputText.value.trim().length >= 80;
  analyzeBtn.disabled = !enoughLength;
  setStatus(enoughLength ? "" : "Please enter at least 80 characters.");
});

analyzeBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();
  if (text.length < 80) return;

  try {
    toggleLoading(true);
    setStatus("");
    results.classList.add("hidden");

    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");

    const parsed = normalizeClientData(data);
    renderSummary(parsed.summary);
    renderTerms(parsed.terms);
    displayQuiz(parsed.quiz);

    results.classList.remove("hidden");
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    toggleLoading(false);
  }
});
