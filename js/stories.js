(() => {
  const body = document.querySelector("[data-story-body]");
  const titleEl = document.querySelector("[data-story-title]");
  const metaEl = document.querySelector("[data-story-meta]");
  if (!body || !window.LexiStories) return;

  const params = new URLSearchParams(location.search);
  const story = LexiStories.getStory(params.get("id") || "");

  if (!story) {
    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/04_sleeping.svg" alt="" />
        <h1>Рассказ не найден</h1>
        <a class="btn btn--primary" href="practice-stories.html">К темам</a>
      </div>`;
    return;
  }

  if (titleEl) titleEl.textContent = story.title;
  if (metaEl) {
    metaEl.textContent = [
      LexiStories.topicTitle(story.topic),
      story.level,
      `≈${story.minutes || 2} мин`,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function normalize(raw) {
    return String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[’‘]/g, "'");
  }

  function lookup(raw) {
    const key = normalize(raw);
    const gloss = story.glossary || {};
    if (gloss[key]) return { en: key, ru: gloss[key] };
    // простые формы
    for (const form of [key, key.replace(/ies$/, "y"), key.replace(/es$/, ""), key.replace(/s$/, ""), key.replace(/ed$/, ""), key.replace(/ing$/, "")]) {
      if (form && gloss[form]) return { en: form, ru: gloss[form] };
    }
    const fromVocab = window.LexiVocab?.lookup?.(raw);
    if (fromVocab?.ru) return fromVocab;
    return { en: key || normalize(raw), ru: "" };
  }

  function tapify(sentence) {
    return String(sentence || "").replace(/([A-Za-z]+(?:'[A-Za-z]+)?)/g, (raw) => {
      const info = lookup(raw);
      return `<span class="tap-word" role="button" tabindex="0" data-en="${escapeAttr(
        info.en || raw.toLowerCase()
      )}" data-ru="${escapeAttr(info.ru || "")}">${escapeHtml(raw)}</span>`;
    });
  }

  let wordPop = null;
  function ensurePop() {
    if (wordPop) return wordPop;
    wordPop = document.createElement("div");
    wordPop.className = "word-pop";
    wordPop.hidden = true;
    wordPop.innerHTML = `
      <div class="word-pop__en" data-pop-en></div>
      <div class="word-pop__ru" data-pop-ru></div>
      <div class="word-pop__actions">
        <button type="button" class="btn btn--secondary" data-pop-speak>▶ Слушать</button>
        <button type="button" class="btn btn--secondary" data-pop-save>В повторить</button>
      </div>`;
    document.querySelector(".story-shell")?.appendChild(wordPop) || document.body.appendChild(wordPop);

    wordPop.querySelector("[data-pop-speak]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const en = wordPop.dataset.en || "";
      if (!en) return;
      if (window.LexiSpeak?.speak) window.LexiSpeak.speak(en, { rate: 0.9, fromUser: true });
      else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(en);
        u.lang = "en-US";
        window.speechSynthesis.speak(u);
      }
    });

    wordPop.querySelector("[data-pop-save]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const en = wordPop.dataset.en || "";
      const ru = wordPop.dataset.ru || "";
      if (!en) return;
      LexiStore?.addReviewWord?.({ word: en, translation: ru || "—" });
      const btn = wordPop.querySelector("[data-pop-save]");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Уже в повторить";
      }
    });
    return wordPop;
  }

  function closePop() {
    if (wordPop) wordPop.hidden = true;
  }

  function placePop(pop, anchor) {
    const host =
      document.querySelector(".story-body") ||
      document.querySelector(".lesson-body") ||
      document.querySelector(".story-shell") ||
      document.body;
    if (pop.parentElement !== host) host.appendChild(pop);
    if (getComputedStyle(host).position === "static") host.style.position = "relative";

    const hostRect = host.getBoundingClientRect();
    const rect = anchor.getBoundingClientRect();
    const popW = Math.min(260, host.clientWidth - 24);
    let left =
      rect.left - hostRect.left + host.scrollLeft + rect.width / 2 - popW / 2;
    left = Math.min(
      Math.max(host.scrollLeft + 8, left),
      host.scrollLeft + host.clientWidth - popW - 8
    );
    let top = rect.bottom - hostRect.top + host.scrollTop + 8;

    pop.style.position = "absolute";
    pop.style.width = `${popW}px`;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.hidden = false;

    requestAnimationFrame(() => {
      const h = pop.offsetHeight || 0;
      if (hostRect.bottom - rect.bottom < h + 12) {
        top = rect.top - hostRect.top + host.scrollTop - h - 8;
        pop.style.top = `${Math.max(host.scrollTop + 8, top)}px`;
      }
    });
  }

  function openPop(anchor) {
    const en = anchor.dataset.en || normalize(anchor.textContent);
    const fresh = lookup(en) || lookup(anchor.textContent);
    const ru = (fresh?.ru || anchor.dataset.ru || "").trim();
    if (ru) anchor.dataset.ru = ru;
    const pop = ensurePop();
    pop.dataset.en = en;
    pop.dataset.ru = ru;
    pop.querySelector("[data-pop-en]").textContent = en;
    pop.querySelector("[data-pop-ru]").textContent = ru || "Перевод пока не найден";
    const saveBtn = pop.querySelector("[data-pop-save]");
    if (saveBtn) {
      const saved = LexiStore?.hasReviewWord?.(en);
      saveBtn.hidden = false;
      saveBtn.disabled = Boolean(saved);
      saveBtn.textContent = saved ? "Уже в повторить" : "В повторить";
    }
    placePop(pop, anchor);
  }

  function translationHtml() {
    return (story.translation || [])
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");
  }

  function ensureTranslateModal() {
    let el = document.querySelector("[data-story-translate-modal]");
    if (el) return el;
    el = document.createElement("div");
    el.className = "lexi-modal";
    el.hidden = true;
    el.setAttribute("data-story-translate-modal", "");
    el.innerHTML = `
      <div class="lexi-modal__backdrop" data-close-translate></div>
      <div class="lexi-modal__panel story-translate-panel" role="dialog" aria-modal="true" aria-labelledby="story-tr-title">
        <button type="button" class="lexi-modal__close" data-close-translate aria-label="Закрыть">×</button>
        <h2 id="story-tr-title" class="lexi-modal__title">Перевод рассказа</h2>
        <div class="story-translate-body" data-translate-body></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-translate]")) {
        el.hidden = true;
        document.body.classList.remove("modal-open");
      }
    });
    return el;
  }

  function openTranslate() {
    const modal = ensureTranslateModal();
    modal.querySelector("[data-translate-body]").innerHTML = translationHtml();
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  let quizAnswers = {};
  let quizDone = false;
  let quizXpGiven = false;

  function allAnswered() {
    const quiz = story.quiz || [];
    return quiz.length > 0 && quiz.every((_, qi) => quizAnswers[qi] != null && quizAnswers[qi] !== "");
  }

  function updateCheckBtn() {
    const checkBtn = body.querySelector("[data-quiz-check]");
    if (!checkBtn || quizDone) return;
    const ready = allAnswered();
    checkBtn.disabled = !ready;
    checkBtn.title = ready ? "Проверить ответы" : "Сначала ответь на все вопросы";
  }

  function renderQuiz() {
    const quiz = story.quiz || [];
    if (!quiz.length) return "";
    return `
      <section class="story-quiz" data-story-quiz>
        <h2 class="story-quiz__title">Проверь себя</h2>
        <p class="muted">Ответь на все вопросы.</p>
        <div class="story-quiz__list">
          ${quiz
            .map(
              (q, qi) => `
            <article class="story-quiz__item" data-qi="${qi}">
              <p class="story-quiz__q">${qi + 1}. ${escapeHtml(q.question)}</p>
              <div class="choice-list">
                ${q.options
                  .map(
                    (o) =>
                      `<button type="button" class="choice" data-qi="${qi}" data-val="${escapeAttr(o)}">${escapeHtml(
                        o
                      )}</button>`
                  )
                  .join("")}
              </div>
            </article>`
            )
            .join("")}
        </div>
        <button type="button" class="btn btn--primary btn--wide" data-quiz-check disabled>Проверить</button>
        <div class="story-quiz__result" data-quiz-result hidden></div>
      </section>`;
  }

  function resetQuiz() {
    quizAnswers = {};
    quizDone = false;
    const quizRoot = body.querySelector("[data-story-quiz]");
    if (!quizRoot) return;
    // перерисовать только блок теста
    const wrap = document.createElement("div");
    wrap.innerHTML = renderQuiz();
    const next = wrap.firstElementChild;
    quizRoot.replaceWith(next);
    updateCheckBtn();
    next.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function paint() {
    body.innerHTML = `
      <div class="story-toolbar">
        <button type="button" class="btn btn--secondary" data-open-translate>Перевод текста</button>
      </div>
      <article class="story-article">
        ${(story.paragraphs || []).map((p) => `<p class="story-p">${tapify(p)}</p>`).join("")}
      </article>
      <p class="muted story-hint">Тап по слову — перевод и звук.</p>
      ${renderQuiz()}
    `;
    updateCheckBtn();
  }

  paint();

  body.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-translate]")) {
      openTranslate();
      return;
    }

    const tap = e.target.closest(".tap-word");
    if (tap) {
      e.preventDefault();
      openPop(tap);
      return;
    }

    if (e.target.closest("[data-quiz-retry]")) {
      resetQuiz();
      return;
    }

    const choice = e.target.closest(".story-quiz .choice");
    if (choice && !quizDone) {
      const qi = choice.dataset.qi;
      const item = body.querySelector(`.story-quiz__item[data-qi="${qi}"]`);
      item?.querySelectorAll(".choice").forEach((c) => c.classList.remove("is-selected"));
      choice.classList.add("is-selected");
      quizAnswers[qi] = choice.dataset.val;
      updateCheckBtn();
      return;
    }

    if (e.target.closest("[data-quiz-check]") && !quizDone) {
      if (!allAnswered()) {
        updateCheckBtn();
        return;
      }
      const quiz = story.quiz || [];
      let ok = 0;
      quiz.forEach((q, qi) => {
        const item = body.querySelector(`.story-quiz__item[data-qi="${qi}"]`);
        const given = quizAnswers[qi];
        item?.querySelectorAll(".choice").forEach((btn) => {
          btn.disabled = true;
          if (btn.dataset.val === q.answer) btn.classList.add("is-correct");
          if (btn.dataset.val === given && given !== q.answer) btn.classList.add("is-wrong");
        });
        if (given === q.answer) ok += 1;
      });
      quizDone = true;
      const result = body.querySelector("[data-quiz-result]");
      const checkBtn = body.querySelector("[data-quiz-check]");
      if (checkBtn) checkBtn.hidden = true;
      if (result) {
        result.hidden = false;
        result.innerHTML = `
          <p>Верно: <strong>${ok}</strong> из <strong>${quiz.length}</strong></p>
          <div class="story-quiz__result-actions">
            <button type="button" class="btn btn--primary btn--wide" data-quiz-retry>Повторить тест</button>
            <a class="btn btn--secondary btn--wide" href="practice-stories.html">К рассказам</a>
          </div>`;
      }
      if (!quizXpGiven) {
        quizXpGiven = true;
        if (ok === quiz.length) LexiStore?.addXp?.(8);
        else if (ok > 0) LexiStore?.addXp?.(3);
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (wordPop && !wordPop.hidden && !e.target.closest(".word-pop") && !e.target.closest(".tap-word")) {
      closePop();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePop();
  });
})();
