const inputText = document.getElementById("inputText");
const analyzeBtn = document.getElementById("analyzeBtn");
const statusText = document.getElementById("statusText");
const results = document.getElementById("results");
const summaryList = document.getElementById("summaryList");
const termsList = document.getElementById("termsList");
const quizList = document.getElementById("quizList");
const loadingState = document.getElementById("loadingState");
const btnLabel = document.getElementById("btnLabel");

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function toggleLoading(isLoading) {
  analyzeBtn.disabled = isLoading || inputText.value.trim().length < 80;
  analyzeBtn.classList.toggle("is-loading", isLoading);
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

let currentQuizData = [];
let userScore = 0;
let answeredQuestions = 0;

function stripOptionPrefix(s) {
  return String(s || "").replace(/^[A-D][\.\)\-\:]\s*/i, "").trim();
}

function normalizeAnswer(s) {
  return stripOptionPrefix(s).toLowerCase();
}

function showScoreCard() {
  const scoreCard = document.createElement("div");
  scoreCard.className = "score-card";
  scoreCard.innerHTML = `
    <h3 class="score-title">General Score: ${userScore}/${currentQuizData.length}</h3>
  `;
  quizList.appendChild(scoreCard);
}

function handleAnswer(event) {
  const btn = event.currentTarget;
  const optionsEl = btn.parentElement;
  
  if (!optionsEl || optionsEl.dataset.answered === "1") return;
  optionsEl.dataset.answered = "1";

  const qIndex = parseInt(btn.dataset.qindex, 10);
  const optIndex = parseInt(btn.dataset.optindex, 10);

  const questionData = currentQuizData[qIndex];
  const clickedOption = questionData.options[optIndex];
  const isCorrect = clickedOption.isCorrect;

  console.log(`[handleAnswer] Soru Index: ${qIndex}, Şık Index: ${optIndex}, Seçilen Doğru mu: ${isCorrect}`, clickedOption);

  if (isCorrect) {
    userScore++;
  }
  answeredQuestions++;

  console.log(`[Skor] Güncel Skor: ${userScore}/${currentQuizData.length}, Cevaplanan Soru: ${answeredQuestions}`);

  const buttons = optionsEl.querySelectorAll(".quiz-option-btn");
  questionData.options.forEach((optData, i) => {
    buttons[i].disabled = true;
    
    if (optData.isCorrect) {
      buttons[i].classList.add("correct");
    } else if (i === optIndex && !isCorrect) {
      buttons[i].classList.add("wrong");
    }
  });

  if (answeredQuestions === currentQuizData.length && currentQuizData.length > 0) {
    showScoreCard();
  }
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function displayQuiz(quiz) {
  quizList.innerHTML = "";
  
  userScore = 0;
  answeredQuestions = 0;
  
  currentQuizData = quiz.map(item => {
    const originalOptions = item.options || [];
    let correctIndex = -1;
    const rawAnswer = String(item.answer || "").trim().toUpperCase();
    
    // İlk olarak cevabın sadece 'A', 'B' gibi bir harf olup olmadığını kontrol et
    const letterMatch = rawAnswer.match(/^[A-D]/);
    if (letterMatch && rawAnswer.length <= 3) {
      correctIndex = letterMatch[0].charCodeAt(0) - 65; 
    }
    
    // Harf değilse veya eşleşemiyorsa tam metin ile eşleştirmeyi dene
    if (correctIndex < 0 || correctIndex >= originalOptions.length) {
      const normalizedCorrect = normalizeAnswer(item.answer);
      correctIndex = originalOptions.findIndex(optText => normalizeAnswer(optText) === normalizedCorrect);
    }
    
    // Bulunamazsa güvenlik amacıyla ilk şıkkı (0) doğru kabul et
    if (correctIndex < 0 || correctIndex >= originalOptions.length) {
      correctIndex = 0;
    }
    
    // Şık objelerine, karıştırmadan ÖNCE doğru cevabı kalıcı olarak mühürle
    let optionsObjects = originalOptions.map((optText, i) => {
      return {
        text: stripOptionPrefix(optText),
        isCorrect: i === correctIndex
      };
    });
    
    // Objeleri tamamen rastgele karıştır, 'isCorrect' true etiketi rastgele bir yere taşınsın
    optionsObjects = shuffleArray(optionsObjects);

    return {
      question: item.question || "",
      options: optionsObjects
    };
  });

  currentQuizData.forEach((qData, qIndex) => {
    const block = document.createElement("div");
    block.className = "quiz-question";

    const q = document.createElement("p");
    q.className = "quiz-q";
    q.textContent = qData.question;
    block.appendChild(q);

    const optionsEl = document.createElement("div");
    optionsEl.className = "quiz-options";
    optionsEl.dataset.qindex = qIndex;

    const letters = ["A", "B", "C", "D"];

    qData.options.forEach((optData, optIndex) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option-btn";
      
      const letter = letters[optIndex] || "*";
      btn.textContent = `${letter}) ${optData.text}`;
      
      btn.dataset.qindex = qIndex;
      btn.dataset.optindex = optIndex;
      
      btn.addEventListener("click", handleAnswer);
      optionsEl.appendChild(btn);
    });

    block.appendChild(optionsEl);
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
  if (!enoughLength) {
    setStatus("Please enter at least 80 characters.");
  } else {
    setStatus("");
  }
});

analyzeBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();
  if (text.length < 80) {
    setStatus("Please enter at least 80 characters of academic text.", true);
    return;
  }

  try {
    toggleLoading(true);
    setStatus(""); // Clear previous errors if any
    results.classList.add("hidden");

    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.detail ? `${data.error} (${data.detail})` : (data.error || "Request failed.");
      throw new Error(errMsg);
    }

    const parsed = normalizeClientData(data);
    renderSummary(parsed.summary);
    renderTerms(parsed.terms);
    displayQuiz(parsed.quiz);

    results.classList.remove("hidden");
    setStatus(""); 
  } catch (error) {
    setStatus(error.message || "Unexpected error happened.", true);
  } finally {
    toggleLoading(false);
  }
});
