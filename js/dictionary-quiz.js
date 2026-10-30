(() => {
  const body = document.querySelector("[data-lesson-body]");
  const progressEl = document.querySelector("[data-lesson-progress]");
  const feedbackEl = document.querySelector("[data-feedback]");
  const checkBtn = document.querySelector("[data-check]");
  if (!body || !checkBtn || !window.LexiStore) return;

  const words = (LexiStore.getDictionary?.() || [])
    .map((w) => ({
      en: String(w.word || "").trim(),
      ru: String(w.translation || "").trim(),
    }))
    .filter((w) => w.en && w.ru);

  if (!words.length) {
    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/04_sleeping.svg" alt="" />
        <h1>Словарь пока пуст</h1>
        <p class="muted">Выучи слова в уровнях или перенеси их из «Повторить».</p>
        <a class="btn btn--primary" href="practice-dictionary.html">К словарю</a>
      </div>`;
    return;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

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
      .replace(/\s+/g, " ");
  }

  function vocabPool(side) {
    const map = window.LexiVocab?.map || {};
    return Object.entries(map).map(([en, ru]) => (side === "en" ? en : ru));
  }

  function pickOptions(correct, side, count = 4) {
    const fromWords = words.map((w) => (side === "en" ? w.en : w.ru));
    const pool = shuffle([...new Set([...fromWords, ...vocabPool(side)])]).filter(
      (x) => normalizeTyped(x) !== normalizeTyped(correct)
    );
    const opts = shuffle([correct, ...pool.slice(0, Math.max(0, count - 1))]);
    return opts.slice(0, count);
  }

  function buildQueue() {
    const base = shuffle(words);
    return base.slice(0, Math.min(12, Math.max(base.length, 1))).map((w, i) => {
      const roll = Math.random();
      if (roll < 0.34) {
        return {
          id: `type-${i}`,
          kind: "type",
          wordEn: w.en,
          wordRu: w.ru,
          prompt: "Напиши перевод на английский",
          promptWord: w.ru,
          answer: w.en,
        };
      }
      if (roll < 0.67) {
        return {
          id: `choice-ru-${i}`,
          kind: "choice",
          wordEn: w.en,
          wordRu: w.ru,
          prompt: "Выбери перевод",
          promptWord: w.en,
          answer: w.ru,
          options: pickOptions(w.ru, "ru"),
        };
      }
      return {
        id: `choice-en-${i}`,
        kind: "choice",
        wordEn: w.en,
        wordRu: w.ru,
        prompt: "Выбери перевод",
        promptWord: w.ru,
        answer: w.en,
        options: pickOptions(w.en, "en"),
      };
    });
  }

  const queue = buildQueue();
  let index = 0;
  let correctCount = 0;
  let failedCount = 0;
  let phase = "answer";
  let lastCorrect = false;
  let state = {};

  function onWrong(ex) {
    if (!ex?.wordEn) return;
    LexiStore.markDictionaryStatus?.(ex.wordEn, "failed");
    LexiStore.addMistake?.({
      id: `dict-${ex.wordEn.toLowerCase()}`,
      topicId: "dictionary",
      type: "type-word",
      prompt: "Напиши перевод на английский",
      preview: ex.wordRu || ex.wordEn,
      summary: "Ошибка в тесте словаря",
      raw: {
        type: "type-word",
        prompt: "Напиши перевод на английский",
        source: ex.wordRu || "—",
        answer: ex.wordEn,
      },
    });
  }

  function markResult(ex, ok) {
    if (!ex?.wordEn) return;
    if (ok) {
      // status ok + чистка dict-ошибки внутри addDictionaryWord
      LexiStore.addDictionaryWord?.({
        word: ex.wordEn,
        translation: ex.wordRu || "—",
        source: "dictionary-quiz",
        status: "ok",
      });
    } else {
      onWrong(ex);
    }
  }

  function updateProgress() {
    const pct = Math.min(100, Math.round((index / queue.length) * 100));
    if (progressEl) progressEl.style.width = `${pct}%`;
  }

  function scrollBottom() {
    requestAnimationFrame(() => {
      body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
    });
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
    scrollBottom();
  }

  function hideFeedback() {
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    feedbackEl.classList.remove("feedback--in");
    checkBtn.classList.remove("btn--danger-solid");
    checkBtn.hidden = true;
    checkBtn.disabled = true;
    checkBtn.textContent = "ПРОВЕРИТЬ";
    phase = "answer";
  }

  function finish() {
    if (progressEl) progressEl.style.width = "100%";
    hideFeedback();
    checkBtn.hidden = false;
    checkBtn.disabled = false;
    checkBtn.textContent = "К СЛОВАРЮ";
    checkBtn.classList.remove("btn--danger-solid");
    phase = "complete";

    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/${failedCount ? "07_shocked" : "08_happy"}.svg" alt="" />
        <h1>Тест словаря готов!</h1>
        <p class="muted">Верно: <strong>${correctCount}</strong> из <strong>${queue.length}</strong></p>
        ${
          failedCount
            ? `<p class="muted">Ошибок: <strong>${failedCount}</strong> — слова помечены красным и попали в «Ошибки».</p>`
            : `<p class="muted">Все слова на месте — так держать!</p>`
        }
        <a class="btn btn--primary btn--wide" href="practice-dictionary.html">К словарю</a>
        <a class="btn btn--secondary btn--wide" href="practice-mistakes.html">К ошибкам</a>
      </div>`;
  }

  function renderType(ex) {
    state = { typed: "" };
    body.innerHTML = `
      <p class="lesson-label">словарь</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      <div class="speech-row">
        <div class="speech-avatar"><img class="emoji-dog" src="../assets/08_happy.svg" alt="" /></div>
        <div class="speech-bubble speech-bubble--word">${escapeHtml(ex.promptWord)}</div>
      </div>
      <label class="type-field">
        <span class="muted">Твой перевод</span>
        <input class="type-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Введи слово…" data-type-input />
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
      state.typed = input.value;
      checkBtn.disabled = normalizeTyped(input.value).length === 0;
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      if (phase === "feedback" || phase === "complete") {
        checkBtn.click();
        return;
      }
      if (phase === "answer" && !checkBtn.disabled) checkAnswer();
    });
  }

  function renderChoice(ex) {
    state = { choice: null };
    body.innerHTML = `
      <p class="lesson-label">словарь</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      <div class="speech-row">
        <div class="speech-avatar"><img class="emoji-dog" src="../assets/03_winking.svg" alt="" /></div>
        <div class="speech-bubble speech-bubble--word">${escapeHtml(ex.promptWord)}</div>
      </div>
      <div class="choice-list" data-choices>
        ${ex.options
          .map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`)
          .join("")}
      </div>
    `;
    checkBtn.hidden = true;
    body.querySelectorAll("[data-choices] .choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (phase !== "answer") return;
        body.querySelectorAll(".choice").forEach((c) => {
          c.classList.remove("is-selected");
          c.disabled = true;
        });
        btn.classList.add("is-selected");
        state.choice = btn.dataset.val;
        const ok = normalizeTyped(state.choice) === normalizeTyped(ex.answer);
        markResult(ex, ok);
        if (ok) {
          correctCount += 1;
          btn.classList.add("is-correct");
          showFeedback(true, "Верно!");
        } else {
          failedCount += 1;
          const right = [...body.querySelectorAll(".choice")].find(
            (c) => normalizeTyped(c.dataset.val) === normalizeTyped(ex.answer)
          );
          right?.classList.add("is-correct");
          btn.classList.add("is-wrong");
          showFeedback(false, `Неверно. Правильно: ${ex.answer}`);
        }
      });
    });
  }

  function render() {
    hideFeedback();
    window.LexiViewport?.reset?.();
    if (index >= queue.length) {
      finish();
      return;
    }
    updateProgress();
    const ex = queue[index];
    if (ex.kind === "type") renderType(ex);
    else renderChoice(ex);
  }

  function checkAnswer() {
    const ex = queue[index];
    if (!ex || ex.kind !== "type") return;
    const input = body.querySelector("[data-type-input]");
    const got = input ? input.value : state.typed;
    if (input) input.disabled = true;
    const ok = normalizeTyped(got) === normalizeTyped(ex.answer);
    markResult(ex, ok);
    if (ok) {
      correctCount += 1;
      input?.classList.add("is-correct");
      showFeedback(true, "Верно!");
    } else {
      failedCount += 1;
      input?.classList.add("is-wrong");
      showFeedback(false, `Неверно. Правильно: ${ex.answer}`);
    }
  }

  function advance() {
    index += 1;
    render();
  }

  checkBtn.addEventListener("click", () => {
    if (phase === "complete") {
      location.href = "practice-dictionary.html";
      return;
    }
    if (phase === "feedback") {
      advance();
      return;
    }
    checkAnswer();
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
