(() => {
  const params = new URLSearchParams(location.search);
  const levelId = params.get("level") || "medium";
  const levelMeta = window.LexiExamPool?.LEVELS?.find((l) => l.id === levelId);
  const minutes = Math.min(
    15,
    Math.max(3, Number(params.get("minutes") || levelMeta?.minutes || 8))
  );
  const wantCount = Math.min(20, Math.max(5, Number(params.get("count") || levelMeta?.count || 10)));

  const body = document.querySelector("[data-exam-body]");
  const progressEl = document.querySelector("[data-exam-progress]");
  const timerEl = document.querySelector("[data-exam-timer]");
  const feedbackEl = document.querySelector("[data-feedback]");
  const checkBtn = document.querySelector("[data-check]");
  if (!body || !checkBtn || !window.LexiExamPool) return;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeTyped(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[’‘']/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[.?!,;:]+$/g, "");
  }

  function answersMatch(got, answer) {
    const variants = Array.isArray(answer) ? answer : [answer];
    const n = normalizeTyped(got);
    return variants.some((v) => normalizeTyped(v) === n);
  }

  function canonicalAnswer(answer) {
    if (typeof answer === "boolean") return answer ? "Верно" : "Неверно";
    const variants = Array.isArray(answer) ? answer : [answer];
    return String(variants[0] || "").trim();
  }

  if (!LexiExamPool.isUnlocked()) {
    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/04_sleeping.svg" alt="" />
        <h1>Пока рано</h1>
        <p class="muted">Нужно хотя бы ${LexiExamPool.MIN} заданий из прогресса тренажёров.</p>
        <a class="btn btn--primary" href="practice-exam.html">Назад</a>
      </div>`;
    return;
  }

  const paper = LexiExamPool.pickForLevel(levelId, wantCount);
  if (paper.length < LexiExamPool.MIN) {
    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/07_shocked.svg" alt="" />
        <h1>Мало заданий для уровня</h1>
        <p class="muted">Выбери другой уровень или накопи ещё прогресс.</p>
        <a class="btn btn--primary" href="practice-exam.html">К уровням</a>
      </div>`;
    return;
  }

  let index = 0;
  let correctCount = 0;
  let phase = "answer";
  let remaining = minutes * 60;
  let timerId = null;
  let finished = false;
  const results = [];
  function speakWord(word, fromUser = false) {
    if (!word) return;
    if (window.LexiSpeak?.isSupported?.()) {
      window.LexiSpeak.speak(word, { rate: 0.92, fromUser });
      return;
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(word));
    u.lang = "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateTimer() {
    if (timerEl) {
      timerEl.textContent = formatTime(remaining);
      timerEl.classList.toggle("exam-timer--low", remaining <= 60);
    }
  }

  function updateProgress() {
    const pct = Math.min(100, Math.round((index / paper.length) * 100));
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
  }

  function hideFeedback() {
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    checkBtn.classList.remove("btn--danger-solid");
    checkBtn.hidden = true;
    checkBtn.disabled = true;
    checkBtn.textContent = "ПРОВЕРИТЬ";
    phase = "answer";
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (window.LexiSpeak?.cancel) window.LexiSpeak.cancel();
    else window.speechSynthesis?.cancel();
  }

  function finish(reason) {
    if (finished) return;
    finished = true;
    stopTimer();
    hideFeedback();
    if (progressEl) progressEl.style.width = "100%";

    const totalAsked = results.length || index;
    const pct = totalAsked ? Math.round((correctCount / totalAsked) * 100) : 0;
    const wrong = results.filter((r) => !r.ok);
    const levelTitle = levelMeta?.title || "Контрольная";

    const saved = LexiStore?.recordExamResult?.(levelId, {
      percent: pct,
      correct: correctCount,
      total: totalAsked,
    });
    const best = saved?.best ?? pct;

    const wrongHtml = wrong.length
      ? `<div class="exam-review">
          <h2>Разбор ошибок</h2>
          ${wrong
            .map(
              (r) => `
            <article class="exam-review__item">
              <p class="exam-review__q">${escapeHtml(r.q.question || r.q.prompt)}</p>
              <p class="muted">Твой ответ: <strong>${escapeHtml(r.given || "—")}</strong></p>
              <p>Верно: <strong>${escapeHtml(canonicalAnswer(r.q.answer))}</strong></p>
            </article>`
            )
            .join("")}
        </div>`
      : `<p class="muted" style="margin-top:1rem">Ошибок нет — отличная работа!</p>`;

    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/${pct >= 70 ? "08_happy" : "05_detective"}.svg" alt="" />
        <h1>${reason === "time" ? "Время вышло" : "Контрольная сдана"}</h1>
        <p class="muted">${escapeHtml(levelTitle)} · верно <strong>${correctCount}</strong> из <strong>${totalAsked}</strong> (${pct}%)</p>
        <p class="muted">Лучший результат уровня: <strong>${best}%</strong>${best >= 70 ? " · зачёт" : ""}</p>
        ${wrongHtml}
        <div class="btn-row" style="justify-content:center;margin-top:1.25rem">
          <a class="btn btn--secondary" href="practice-exam.html">К уровням</a>
          <a class="btn btn--primary" href="index.html?tab=practice">К практике</a>
        </div>
      </div>`;
    checkBtn.hidden = true;
  }

  function recordAndFeedback(ok, given, q) {
    results.push({ q, ok, given });
    if (ok) correctCount += 1;
    if (ok) showFeedback(true, "Верно!");
    else showFeedback(false, `Неверно. Правильно: ${canonicalAnswer(q.answer)}`);
  }

  function shuffleOptions(opts) {
    return LexiExamPool.shuffle([...(opts || [])]);
  }

  function render() {
    if (finished) return;
    hideFeedback();
    window.LexiViewport?.reset?.();
    if (index >= paper.length) {
      finish("done");
      return;
    }
    updateProgress();
    const q = paper[index];
    const label = `контрольная · ${levelMeta?.title || levelId} · ${index + 1}/${paper.length}`;

    if (q.kind === "true-false") {
      body.innerHTML = `
        <p class="lesson-label">${escapeHtml(label)}</p>
        <h1 class="lesson-prompt">${escapeHtml(q.prompt)}</h1>
        <p class="lesson-subprompt">${escapeHtml(q.question)}</p>
        <div class="tf-actions" data-choices>
          <button type="button" class="choice tf-btn" data-val="true">Верно</button>
          <button type="button" class="choice tf-btn" data-val="false">Неверно</button>
        </div>
      `;
      body.querySelectorAll("[data-choices] .tf-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (phase !== "answer" || finished) return;
          body.querySelectorAll(".tf-btn").forEach((b) => {
            b.disabled = true;
            b.classList.remove("is-selected");
          });
          btn.classList.add("is-selected");
          const given = btn.dataset.val === "true";
          const ok = given === Boolean(q.answer);
          recordAndFeedback(ok, given ? "Верно" : "Неверно", q);
        });
      });
      return;
    }

    if (q.kind === "choice") {
      const options = shuffleOptions(q.options);
      body.innerHTML = `
        <p class="lesson-label">${escapeHtml(label)}</p>
        <h1 class="lesson-prompt">${escapeHtml(q.prompt)}</h1>
        ${q.question ? `<p class="lesson-subprompt">${escapeHtml(q.question)}</p>` : ""}
        ${
          q.speak
            ? `<button type="button" class="btn btn--secondary" data-exam-speak>▶ Слушать</button>`
            : ""
        }
        <div class="choice-list" data-choices>
          ${options
            .map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`)
            .join("")}
        </div>
      `;
      if (q.speak) {
        const speakBtn = body.querySelector("[data-exam-speak]");
        speakBtn?.addEventListener("click", () => speakWord(q.speak, true));
        window.setTimeout(() => {
          if (window.LexiSpeak?.isUnlocked?.()) speakWord(q.speak, false);
        }, 250);
      }
      body.querySelectorAll("[data-choices] .choice").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (phase !== "answer" || finished) return;
          body.querySelectorAll(".choice").forEach((b) => {
            b.disabled = true;
            b.classList.remove("is-selected");
          });
          btn.classList.add("is-selected");
          const given = btn.dataset.val;
          const ok = given === q.answer;
          recordAndFeedback(ok, given, q);
        });
      });
      return;
    }

    body.innerHTML = `
      <p class="lesson-label">${escapeHtml(label)}</p>
      <h1 class="lesson-prompt">${escapeHtml(q.prompt)}</h1>
      <div class="speech-row">
        <div class="speech-avatar"><img class="emoji-dog" src="${window.LexiCharacters?.pick?.() || "../corgi_emotions/02_smile.svg"}" alt="" /></div>
        <div class="speech-bubble speech-bubble--word">${escapeHtml(q.question)}</div>
      </div>
      <label class="type-field">
        <span class="muted">Ответ</span>
        <input class="type-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Введи ответ…" data-type-input />
      </label>
    `;
    checkBtn.hidden = false;
    checkBtn.disabled = true;
    checkBtn.textContent = "ПРОВЕРИТЬ";
    const input = body.querySelector("[data-type-input]");
    try {
      input?.focus({ preventScroll: true });
    } catch {
      input?.focus();
    }
    window.LexiViewport?.sync?.();
    input?.addEventListener("input", () => {
      if (phase !== "answer") return;
      checkBtn.disabled = normalizeTyped(input.value).length === 0;
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      if (phase === "feedback") {
        checkBtn.click();
        return;
      }
      if (phase === "answer" && !checkBtn.disabled) checkTyped();
    });
  }

  function checkTyped() {
    const q = paper[index];
    if (!q || q.kind !== "type" || phase !== "answer" || finished) return;
    const input = body.querySelector("[data-type-input]");
    const given = input ? input.value : "";
    if (input) input.disabled = true;
    const ok = answersMatch(given, q.answer);
    recordAndFeedback(ok, given.trim() || "—", q);
  }

  checkBtn.addEventListener("click", () => {
    if (finished) return;
    if (phase === "feedback") {
      index += 1;
      render();
      return;
    }
    checkTyped();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.repeat || finished) return;
    if (checkBtn.hidden || checkBtn.disabled) return;
    if (phase !== "feedback") return;
    e.preventDefault();
    checkBtn.click();
  });

  updateTimer();
  timerId = setInterval(() => {
    remaining -= 1;
    updateTimer();
    if (remaining <= 0) finish("time");
  }, 1000);

  render();
})();
