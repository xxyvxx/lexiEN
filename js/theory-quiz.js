(() => {
  const params = new URLSearchParams(location.search);
  const topicId = params.get("topic") || "present-simple";
  const topic = window.LexiTheory?.get?.(topicId);
  const questions = window.LexiTheoryQuiz?.get?.(topicId);

  const body = document.querySelector("[data-quiz-body]");
  const progressEl = document.querySelector("[data-quiz-progress]");
  const metaEl = document.querySelector("[data-quiz-meta]");
  const feedbackEl = document.querySelector("[data-feedback]");
  const checkBtn = document.querySelector("[data-check]");
  const closeLink = document.querySelector("[data-quiz-close]");

  if (!body || !checkBtn) return;

  const backHref = `topic.html?id=${encodeURIComponent(topicId)}`;
  if (closeLink) closeLink.setAttribute("href", backHref);

  if (!topic || !questions?.length) {
    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/07_shocked.svg" alt="" />
        <h1>Тест пока не готов</h1>
        <p class="muted">Для этой темы ещё нет вопросов.</p>
        <a class="btn btn--primary" href="${backHref}">К теории</a>
      </div>`;
    return;
  }

  if (topic.color) {
    document.documentElement.style.setProperty("--unit", topic.color.main);
    document.documentElement.style.setProperty("--unit-deep", topic.color.deep);
  }

  document.title = `Тест: ${topic.title} — Лэкси EN`;
  if (metaEl) metaEl.textContent = "📝";

  let index = 0;
  let correctCount = 0;
  let phase = "answer";
  let lastCorrect = false;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateProgress() {
    const pct = Math.min(100, Math.round((index / questions.length) * 100));
    if (progressEl) progressEl.style.width = `${pct}%`;
  }

  function showFeedback(ok, text) {
    feedbackEl.hidden = false;
    feedbackEl.className = `feedback ${ok ? "feedback--ok" : "feedback--bad"}`;
    feedbackEl.textContent = text;
    feedbackEl.classList.remove("feedback--in");
    void feedbackEl.offsetWidth;
    feedbackEl.classList.add("feedback--in");
    checkBtn.hidden = false;
    checkBtn.disabled = false;
    checkBtn.textContent = "ДАЛЕЕ";
    checkBtn.classList.toggle("btn--danger-solid", !ok);
    phase = "feedback";
    lastCorrect = ok;
  }

  function hideFeedback() {
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    checkBtn.classList.remove("btn--danger-solid");
    checkBtn.hidden = true;
    checkBtn.disabled = true;
    phase = "answer";
  }

  function finish() {
    if (progressEl) progressEl.style.width = "100%";
    hideFeedback();
    checkBtn.hidden = false;
    checkBtn.disabled = false;
    checkBtn.textContent = "К ТЕОРИИ";
    phase = "complete";
    const pct = Math.round((correctCount / questions.length) * 100);
    const passed = pct >= 70;
    LexiStore?.setTheoryQuizResult?.(topicId, {
      passed,
      percent: pct,
      correct: correctCount,
      total: questions.length,
    });
    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/${passed ? "08_happy" : "05_detective"}.svg" alt="" />
        <h1>${passed ? "Тема закреплена!" : "Ещё чуть-чуть"}</h1>
        <p class="muted"><strong>${topic.title}</strong>: верно ${correctCount} из ${questions.length} (${pct}%)</p>
        <div class="btn-row" style="justify-content:center;margin-top:1rem">
          <a class="btn btn--secondary" href="${backHref}">К теории</a>
          <a class="btn btn--primary" href="../trainer/index.html?topic=${encodeURIComponent(topicId)}">В тренажёр</a>
        </div>
      </div>`;
  }

  function render() {
    hideFeedback();
    if (index >= questions.length) {
      finish();
      return;
    }
    updateProgress();
    const q = questions[index];
    if (q.kind === "true-false") {
      body.innerHTML = `
        <p class="lesson-label">тест · ${escapeHtml(topic.title)}</p>
        <h1 class="lesson-prompt">${escapeHtml(q.question)}</h1>
        <div class="tf-actions" data-choices>
          <button type="button" class="choice tf-btn" data-val="true">Верно</button>
          <button type="button" class="choice tf-btn" data-val="false">Неверно</button>
        </div>
      `;
    } else {
      body.innerHTML = `
        <p class="lesson-label">тест · ${escapeHtml(topic.title)}</p>
        <h1 class="lesson-prompt">${escapeHtml(q.question)}</h1>
        <div class="choice-list" data-choices>
          ${q.options
            .map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`)
            .join("")}
        </div>
      `;
    }

    body.querySelectorAll("[data-choices] .choice, [data-choices] .tf-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (phase !== "answer") return;
        body.querySelectorAll(".choice, .tf-btn").forEach((b) => {
          b.classList.remove("is-selected");
          b.disabled = true;
        });
        btn.classList.add("is-selected");

        let ok = false;
        if (q.kind === "true-false") {
          ok = (btn.dataset.val === "true") === Boolean(q.answer);
        } else {
          ok = btn.dataset.val === q.answer;
        }

        if (ok) {
          correctCount += 1;
          showFeedback(true, "Верно!");
        } else {
          const right =
            q.kind === "true-false" ? (q.answer ? "Верно" : "Неверно") : q.answer;
          showFeedback(false, `Неверно. Правильно: ${right}`);
        }
      });
    });
  }

  checkBtn.addEventListener("click", () => {
    if (phase === "complete") {
      location.href = backHref;
      return;
    }
    if (phase === "feedback") {
      index += 1;
      render();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.repeat) return;
    if (checkBtn.hidden || checkBtn.disabled) return;
    if (phase !== "feedback" && phase !== "complete") return;
    e.preventDefault();
    checkBtn.click();
  });

  render();
})();
