const inputText = document.getElementById("inputText");
const analyzeBtn = document.getElementById("analyzeBtn");
const statusText = document.getElementById("statusText");
const results = document.getElementById("results");
const summaryList = document.getElementById("summaryList");
const termsList = document.getElementById("termsList");
const quizList = document.getElementById("quizList");
const loadingState = document.getElementById("loadingState");

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function toggleLoading(isLoading) {
  analyzeBtn.disabled = isLoading || inputText.value.trim().length < 80;
  analyzeBtn.classList.toggle("is-loading", isLoading);
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

function normalizeAnswer(s) {
  return String(s || "").trim();
}

function showScoreCard(quizState) {
  const scoreCard = document.createElement("div");
  scoreCard.className = "score-card";
  scoreCard.innerHTML = `
    <h3 class="score-title">Genel Skor</h3>
    <div class="score-value"><span>${quizState.score}</span> / ${quizState.total}</div>
  `;
  quizList.appendChild(scoreCard);
}

function onQuizOptionClick(btn, item, chosen, optionsEl, quizState) {
  if (optionsEl.dataset.answered === "1") return;
  optionsEl.dataset.answered = "1";

  const correctVal = normalizeAnswer(item.answer);
  const isCorrect = normalizeAnswer(chosen) === correctVal;

  if (isCorrect) quizState.score++;
  quizState.answeredCount++;

  optionsEl.querySelectorAll(".quiz-option-btn").forEach((b) => {
    b.disabled = true;
    const label = normalizeAnswer(b.textContent);
    if (label === correctVal) {
      b.classList.add("is-correct");
    } else if (b === btn && !isCorrect) {
      b.classList.add("is-wrong");
    }
  });

  if (quizState.answeredCount === quizState.total && quizState.total > 0) {
    showScoreCard(quizState);
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

function renderQuiz(quiz) {
  quizList.innerHTML = "";
  const quizState = { score: 0, answeredCount: 0, total: quiz.length };

  quiz.forEach((item) => {
    const block = document.createElement("div");
    block.className = "quiz-question";

    const q = document.createElement("p");
    q.className = "quiz-q";
    q.textContent = item.question || "";
    block.appendChild(q);

    const optionsEl = document.createElement("div");
    optionsEl.className = "quiz-options";

    const shuffledOptions = shuffleArray(item.options || []);

    shuffledOptions.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => onQuizOptionClick(btn, item, opt, optionsEl, quizState));
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
    setStatus("Analyzing text...");
    results.classList.add("hidden");

    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    const parsed = normalizeClientData(data);
    renderSummary(parsed.summary);
    renderTerms(parsed.terms);
    renderQuiz(parsed.quiz);

    results.classList.remove("hidden");
    const source = data.source === "gemini" ? "Gemini" : "Mock";
    setStatus(`Done. Response source: ${source}.`);
  } catch (error) {
    setStatus(error.message || "Unexpected error happened.", true);
  } finally {
    toggleLoading(false);
  }
});
