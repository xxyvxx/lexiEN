(() => {
  const params = new URLSearchParams(location.search);
  const topicId = params.get("topic") || "present-simple";
  const level = Number(params.get("level") || 1);
  const kindHint = location.pathname.includes("dialogue")
    ? "dialogue"
    : location.pathname.includes("final")
      ? "final"
      : location.pathname.includes("mistakes")
        ? "mistakes"
        : "lesson";

  const body = document.querySelector("[data-lesson-body]");
  const progressEl = document.querySelector("[data-lesson-progress]");
  const livesEl = document.querySelector("[data-lesson-lives]");
  const feedbackEl = document.querySelector("[data-feedback]");
  const checkBtn = document.querySelector("[data-check]");
  const hintBtn = document.querySelector("[data-hint]");
  const hintCountEls = document.querySelectorAll("[data-hint-count]");
  const closeLink = document.querySelector("[data-lesson-close]");

  if (!body || !checkBtn || !window.LexiLessons) return;

  const lesson = LexiLessons.getLesson(topicId, level, kindHint);
  const isMistakesQuiz = lesson.mode === "mistakes";
  /** Подсказки только в уровнях пути, не в практике/ошибках */
  const hintsEnabled = !isMistakesQuiz;
  const profileHref = isMistakesQuiz ? "practice-mistakes.html" : "../profile/index.html";

  if (closeLink) {
    closeLink.setAttribute(
      "href",
      isMistakesQuiz ? profileHref : `index.html?topic=${encodeURIComponent(topicId)}`
    );
  }

  const queue = lesson.exercises.map((ex) => ({ ...ex, failCount: 0 }));
  let index = 0;
  let doneCount = 0;
  const totalInitial = queue.length || 1;
  let lives = lesson.lives ?? null;
  let phase = "answer"; // answer | feedback | complete | failed
  let lastCorrect = false;
  let lastXpGain = 0;
  let sessionXp = 0;
  let clearedMistakes = 0;
  /** Сколько заданий не вышли со второй попытки (обычные уровни / история) */
  let hardFails = 0;
  const HARD_FAIL_LIMIT = 3;
  let state = {};
  /** На текущем задании уже жгли подсказку — меньше XP */
  let usedHintOnCurrent = false;
  // повтор уже пройденного урока — XP не начисляем
  const replayNoXp = !isMistakesQuiz && Boolean(LexiStore?.isLevelDone?.(topicId, level));

  if (isMistakesQuiz && !queue.length) {
    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/08_happy.svg" alt="" />
        <h1>Ошибок нет</h1>
        <p class="muted">Пока пусто — возвращайся после занятий.</p>
        <a class="btn btn--primary" href="${profileHref}">К профилю</a>
      </div>`;
    checkBtn.hidden = true;
    return;
  }

  const topicColor = LexiTheory?.get?.(topicId)?.color;
  if (topicColor) {
    document.documentElement.style.setProperty("--unit", topicColor.main);
    document.documentElement.style.setProperty("--unit-deep", topicColor.deep);
  }

  function hintsLeft() {
    return Math.max(0, Number(LexiStore?.getHints?.()) || 0);
  }

  function xpLeft() {
    return Math.max(0, Number(LexiStore?.getXp?.()) || 0);
  }

  function updateHintUi() {
    const n = hintsLeft();
    hintCountEls.forEach((el) => {
      el.textContent = String(n);
    });
    if (!hintBtn || !hintsEnabled) {
      if (hintBtn) hintBtn.hidden = true;
      return;
    }
    const show = phase === "answer";
    hintBtn.hidden = !show;
    hintBtn.disabled = !show;
    const label = hintBtn.querySelector("[data-hint-label]");
    if (label) label.textContent = n < 1 ? "Купить" : "Подсказка";
    hintBtn.title =
      n < 1 ? "Нет подсказок — купи за XP" : `Подсказка (−1). На счету: ${n}`;
    hintBtn.classList.toggle("lesson-hint-btn--buy", n < 1);
  }

  function ensureHintShop() {
    if (document.querySelector("[data-hint-shop]")) return;
    const el = document.createElement("div");
    el.className = "lexi-modal";
    el.hidden = true;
    el.setAttribute("data-hint-shop", "");
    el.innerHTML = `
      <div class="lexi-modal__backdrop" data-hint-shop-close></div>
      <div class="lexi-modal__panel" role="dialog" aria-modal="true" aria-labelledby="hint-shop-title">
        <button type="button" class="lexi-modal__close" data-hint-shop-close aria-label="Закрыть">×</button>
        <h2 id="hint-shop-title" class="lexi-modal__title">Подсказки</h2>
        <p class="muted" data-hint-shop-balance></p>
        <div class="hint-pack-list" data-hint-shop-packs></div>
        <p class="form-error" data-hint-shop-error hidden></p>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-hint-shop-close]")) {
        closeHintShop();
        return;
      }
      const btn = e.target.closest("[data-buy-pack]");
      if (!btn || btn.disabled) return;
      const err = el.querySelector("[data-hint-shop-error]");
      const result = LexiStore?.buyHintPack?.(btn.getAttribute("data-buy-pack"));
      if (!result?.ok) {
        if (err) {
          err.hidden = false;
          err.textContent = result?.error || "Не удалось купить";
        }
        renderHintShop();
        return;
      }
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      renderHintShop();
      updateHintUi();
      updateChrome();
    });
  }

  function renderHintShop() {
    const el = document.querySelector("[data-hint-shop]");
    if (!el) return;
    const bal = el.querySelector("[data-hint-shop-balance]");
    const packsRoot = el.querySelector("[data-hint-shop-packs]");
    const xp = xpLeft();
    const hints = hintsLeft();
    if (bal) {
      bal.innerHTML = `На счету: <strong>${hints}</strong> подсказок · <strong>${xp}</strong> XP`;
    }
    const packs = LexiStore?.HINT_PACKS || [];
    if (packsRoot) {
      packsRoot.innerHTML = packs
        .map((pack) => {
          const can = xp >= pack.xp;
          return `
          <button type="button" class="hint-pack ${can ? "" : "is-disabled"}" data-buy-pack="${pack.id}" ${
            can ? "" : "disabled"
          }>
            <span class="hint-pack__title">${escapeHtml(pack.title)}</span>
            <span class="hint-pack__price">${pack.xp} XP</span>
          </button>`;
        })
        .join("");
    }
  }

  function openHintShop() {
    ensureHintShop();
    renderHintShop();
    const el = document.querySelector("[data-hint-shop]");
    if (!el) return;
    el.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeHintShop() {
    const el = document.querySelector("[data-hint-shop]");
    if (el) el.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function updateChrome() {
    const pct = Math.min(100, Math.round((doneCount / totalInitial) * 100));
    if (progressEl) progressEl.style.width = `${pct}%`;
    if (livesEl) {
      if (lives == null) {
        livesEl.innerHTML = `<span class="lesson-xp" title="Опыт за урок">⚡ ${sessionXp}</span>`;
        livesEl.setAttribute("aria-label", `Опыт за урок: ${sessionXp}`);
      } else {
        const left = Math.max(0, lives);
        livesEl.innerHTML = `<span class="lesson-hearts" title="Ошибки до провала">${"♥".repeat(left)}${left < 3 ? "♡".repeat(3 - left) : ""}</span>`;
        livesEl.setAttribute("aria-label", `Осталось попыток: ${left} из 3`);
      }
    }
    updateHintUi();
  }

  function scrollLessonBottom() {
    requestAnimationFrame(() => {
      body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
    });
  }

  function saveExerciseToDictionary(ex) {
    if (!ex || !LexiStore?.addDictionaryWord) return;
    if (ex.type === "type-word") {
      const word = canonicalAnswer(ex.answer);
      const translation = String(ex.source || "").trim() || "—";
      if (word) LexiStore.addDictionaryWord({ word, translation, source: "type-word", status: "ok" });
      return;
    }
    if (ex.type === "meaning") {
      const word = String(ex.highlight || "").trim();
      const translation = String(ex.answer || "").trim() || "—";
      if (word) LexiStore.addDictionaryWord({ word, translation, source: "meaning", status: "ok" });
    }
  }

  function saveMatchPairToDictionary(ex, pairIndex) {
    const pair = ex?.pairs?.[pairIndex];
    if (!pair || !LexiStore?.addDictionaryWord) return;
    const left = String(pair.left || "").trim();
    const right = String(pair.right || "").trim();
    if (!left || !right) return;
    // в контенте left — RU, right — EN
    const looksEn = /[A-Za-z]/.test(right) && !/[A-Za-z]/.test(left);
    const word = looksEn ? right : /[A-Za-z]/.test(left) ? left : right;
    const translation = word === right ? left : right;
    LexiStore.addDictionaryWord({ word, translation, source: "match", status: "ok" });
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
    if (ok) saveExerciseToDictionary(current());
    updateHintUi();
    scrollLessonBottom();
  }

  function awardXp(amount) {
    if (replayNoXp) {
      lastXpGain = 0;
      return;
    }
    let gain = Number(amount) || 0;
    if (usedHintOnCurrent && gain > 0) gain = Math.min(gain, 2);
    lastXpGain = gain;
    if (gain > 0) {
      sessionXp += gain;
      LexiStore?.addXp?.(gain);
      updateChrome();
    }
  }

  function mistakeSummary(ex) {
    if (!ex) return "Задание";
    if (ex.prompt) return ex.prompt;
    if (ex.source) return ex.source;
    if (ex.statement) return ex.statement;
    return ex.type || "Задание";
  }

  function hideFeedback() {
    if (window.LexiSpeak?.cancel) window.LexiSpeak.cancel();
    else window.speechSynthesis?.cancel();
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    feedbackEl.classList.remove("feedback--in");
    checkBtn.classList.remove("btn--danger-solid");
    checkBtn.hidden = true;
    checkBtn.disabled = true;
    checkBtn.textContent = "ПРОВЕРИТЬ";
    phase = "answer";
    closeWordPop();
  }

  function showCheckButton() {
    checkBtn.hidden = false;
    checkBtn.disabled = true;
    checkBtn.textContent = "ПРОВЕРИТЬ";
    updateHintUi();
  }

  function hintTranslate() {
    const expected = state.expected || [];
    let i = 0;
    while (i < state.answer.length && i < expected.length && state.answer[i].text === expected[i]) i += 1;
    state.answer = state.answer.slice(0, i);
    if (i >= expected.length) {
      paintTranslate();
      checkBtn.disabled = false;
      return;
    }
    const need = expected[i];
    const word = state.bank.find(
      (w) => w.text === need && !state.answer.some((a) => a.id === w.id)
    );
    if (word) state.answer.push(word);
    paintTranslate();
    checkBtn.disabled = state.answer.length === 0;
  }

  function hintType() {
    const ex = current();
    const input = body.querySelector("[data-type-input]");
    if (!input || !ex) return;
    const ans = canonicalAnswer(ex.answer);
    input.value = ans;
    state.typed = ans;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    checkBtn.disabled = false;
  }

  function hintChoice() {
    const expected = state.expected;
    const btn = [...body.querySelectorAll("[data-choices] .choice")].find(
      (b) => b.dataset.val === String(expected)
    );
    if (btn && !btn.disabled) btn.click();
  }

  function hintTrueFalse() {
    const ex = current();
    if (!ex) return;
    if (state.step === "fix") {
      hintChoice();
      return;
    }
    const verdict = Boolean(ex.isCorrect);
    const btn = body.querySelector(`[data-tf-actions] [data-verdict="${verdict}"]`);
    if (btn && !btn.disabled) btn.click();
  }

  function hintSpotError() {
    const ex = current();
    if (!ex) return;
    if (state.step === "fix") {
      hintChoice();
      return;
    }
    const chip = body.querySelector(`.token-chip[data-i="${ex.errorIndex}"]`);
    if (chip && !chip.disabled) chip.click();
  }

  function hintMatch() {
    if (!state?.left || !state.matched) return;
    const nextId = state.left.map((x) => x.id).find((id) => !state.matched.has(id));
    if (nextId == null) return;
    const leftBtn = body.querySelector(`.match-tile[data-side="left"][data-id="${nextId}"]`);
    const rightBtn = body.querySelector(`.match-tile[data-side="right"][data-id="${nextId}"]`);
    if (!leftBtn || !rightBtn) return;
    leftBtn.classList.add("is-matched");
    rightBtn.classList.add("is-matched");
    state.matched.add(nextId);
    state.selected = null;
    saveMatchPairToDictionary(current(), nextId);
    body.querySelectorAll(".match-tile.is-selected").forEach((el) => el.classList.remove("is-selected"));
    if (state.matched.size === state.total) {
      showFeedback(true, successMessage(current()).replace("Верно!", "Отлично! Все пары собраны."));
    }
  }

  function hintOrder() {
    const ex = current();
    if (!ex?.lines || !state.order) return;
    state.order = ex.lines.map((l) => ({ ...l }));
    state.selected = null;
    paintOrder();
    checkBtn.disabled = false;
  }

  function applyHint() {
    if (!hintsEnabled || phase !== "answer") return;
    if (hintsLeft() < 1) {
      openHintShop();
      return;
    }
    const ex = current();
    if (!ex || ex.type === "story-read") return;

    const spent = LexiStore?.spendHint?.();
    if (!spent?.ok) {
      updateHintUi();
      return;
    }
    usedHintOnCurrent = true;
    updateHintUi();

    switch (ex.type) {
      case "translate":
      case "listen-translate":
      case "compose-en":
        hintTranslate();
        break;
      case "type-word":
      case "type-blank":
      case "story-blank":
        hintType();
        break;
      case "meaning":
      case "odd-one":
      case "pattern":
      case "story-quiz":
        hintChoice();
        break;
      case "spot-error":
        hintSpotError();
        break;
      case "true-false":
        hintTrueFalse();
        break;
      case "match":
        hintMatch();
        break;
      case "order-lines":
        hintOrder();
        break;
      default:
        break;
    }
  }

  function current() {
    return queue[index];
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

  function lookupWord(raw) {
    const info = window.LexiVocab?.lookup?.(raw);
    if (info?.ru) return info;
    const en = String(raw || "").toLowerCase();
    return en ? { en, ru: "" } : null;
  }

  /** Любое английское слово → пунктир + тап (перевод, если есть в словаре) */
  function tapifyEnglish(sentence, highlightWord) {
    const hl = highlightWord ? String(highlightWord).toLowerCase() : "";
    return String(sentence || "").replace(/([A-Za-z]+(?:'[A-Za-z]+)?)/g, (raw) => {
      const info = lookupWord(raw);
      const isHl = hl && raw.toLowerCase() === hl;
      const en = info?.en || raw.toLowerCase();
      const ru = info?.ru || "";
      const cls = ["tap-word", isHl ? "hl" : ""].filter(Boolean).join(" ");
      return `<span class="${cls}" role="button" tabindex="0" data-en="${escapeAttr(en)}" data-ru="${escapeAttr(ru)}">${escapeHtml(raw)}</span>`;
    });
  }

  function highlightSentence(sentence, word) {
    return tapifyEnglish(sentence, word);
  }

  let wordPopEl = null;

  function ensureWordPop() {
    if (wordPopEl) return wordPopEl;
    wordPopEl = document.createElement("div");
    wordPopEl.className = "word-pop";
    wordPopEl.hidden = true;
    wordPopEl.innerHTML = `
      <div class="word-pop__en" data-pop-en></div>
      <div class="word-pop__ru" data-pop-ru></div>
      <button type="button" class="btn btn--secondary btn--wide word-pop__save" data-pop-save>В повторить</button>
    `;
    const shell = document.querySelector(".lesson-shell");
    if (shell) shell.appendChild(wordPopEl);
    else document.body.appendChild(wordPopEl);

    wordPopEl.querySelector("[data-pop-save]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const en = wordPopEl.dataset.en || "";
      const ru = wordPopEl.dataset.ru || "";
      if (!en) return;
      LexiStore?.addReviewWord?.({ word: en, translation: ru || "—" });
      closeWordPop();
    });
    return wordPopEl;
  }

  function closeWordPop() {
    if (!wordPopEl) return;
    wordPopEl.hidden = true;
  }

  function placeWordPop(pop, anchor) {
    const host = body;
    if (!host) return;
    if (pop.parentElement !== host) host.appendChild(pop);
    if (getComputedStyle(host).position === "static") host.style.position = "relative";

    const hostRect = host.getBoundingClientRect();
    const rect = anchor.getBoundingClientRect();
    const popW = Math.min(240, host.clientWidth - 24);
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
      const spaceBelow = hostRect.bottom - rect.bottom;
      if (spaceBelow < h + 12) {
        top = rect.top - hostRect.top + host.scrollTop - h - 8;
        pop.style.top = `${Math.max(host.scrollTop + 8, top)}px`;
      }
    });
  }

  function openWordPop(anchor) {
    const en = anchor.dataset.en || anchor.textContent.trim();
    // свежий lookup — на случай, если словарь обновили
    const fresh = lookupWord(en) || lookupWord(anchor.textContent.trim());
    const ru = (fresh?.ru || anchor.dataset.ru || "").trim();
    if (!en) return;
    if (ru) anchor.dataset.ru = ru;
    const pop = ensureWordPop();
    pop.dataset.en = en;
    pop.dataset.ru = ru;
    pop.querySelector("[data-pop-en]").textContent = en;
    pop.querySelector("[data-pop-ru]").textContent = ru || "Перевод пока не найден";
    const saveBtn = pop.querySelector("[data-pop-save]");
    const saved = LexiStore?.hasReviewWord?.(en);
    if (saveBtn) {
      // можно сохранить даже без перевода — чтобы слово не терялось
      saveBtn.hidden = false;
      saveBtn.disabled = Boolean(saved);
      saveBtn.textContent = saved ? "Уже в повторить" : "В повторить";
    }
    placeWordPop(pop, anchor);
  }

  document.addEventListener("click", (e) => {
    const tap = e.target.closest(".tap-word");
    if (tap) {
      e.preventDefault();
      e.stopPropagation();
      openWordPop(tap);
      return;
    }
    if (wordPopEl && !wordPopEl.hidden && !e.target.closest(".word-pop")) {
      closeWordPop();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && wordPopEl && !wordPopEl.hidden) {
      e.preventDefault();
      closeWordPop();
      return;
    }
    if (e.key !== "Enter" && e.key !== " ") return;
    const tap = e.target.closest?.(".tap-word");
    if (!tap) return;
    e.preventDefault();
    openWordPop(tap);
  });

  /* ---------- renderers ---------- */
  function renderMatch(ex) {
    const left = LexiLessons.shuffle(ex.pairs.map((p, i) => ({ id: i, text: p.left, side: "left" })));
    const right = LexiLessons.shuffle(ex.pairs.map((p, i) => ({ id: i, text: p.right, side: "right" })));
    state = { selected: null, matched: new Set(), left, right, total: ex.pairs.length };
    body.innerHTML = `
      <p class="lesson-label">пары слов</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      <div class="match-board" data-match>
        <div class="match-col" data-col="left">${left.map(tile).join("")}</div>
        <div class="match-col" data-col="right">${right.map(tile).join("")}</div>
      </div>
    `;
    function tile(item) {
      return `<button type="button" class="match-tile" data-id="${item.id}" data-side="${item.side}">${escapeHtml(item.text)}</button>`;
    }
    checkBtn.disabled = true;
    checkBtn.hidden = true;

    body.querySelector("[data-match]").addEventListener("click", (e) => {
      if (phase === "feedback") return;
      const btn = e.target.closest(".match-tile");
      if (!btn || btn.classList.contains("is-matched") || btn.classList.contains("is-disabled")) return;
      const id = Number(btn.dataset.id);
      const side = btn.dataset.side;

      if (!state.selected) {
        state.selected = { id, side, el: btn };
        btn.classList.add("is-selected");
        return;
      }

      if (state.selected.side === side) {
        state.selected.el.classList.remove("is-selected");
        state.selected = { id, side, el: btn };
        btn.classList.add("is-selected");
        return;
      }

      const a = state.selected;
      const b = { id, side, el: btn };
      a.el.classList.remove("is-selected");

      if (a.id === b.id) {
        a.el.classList.add("is-matched");
        b.el.classList.add("is-matched");
        state.matched.add(a.id);
        state.selected = null;
        saveMatchPairToDictionary(current(), a.id);
        if (state.matched.size === state.total) {
          showFeedback(true, successMessage(current()).replace("Верно!", "Отлично! Все пары собраны."));
        }
      } else {
        a.el.classList.add("is-wrong");
        b.el.classList.add("is-wrong");
        setTimeout(() => {
          a.el.classList.remove("is-wrong");
          b.el.classList.remove("is-wrong");
        }, 450);
        state.selected = null;
        // ошибка пары — только подсветка, задание не уходит в конец
      }
    });
  }

  function renderMeaning(ex) {
    state = { choice: null };
    body.innerHTML = `
      <p class="lesson-label">${escapeHtml(ex.label || "новое слово")}</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      <div class="speech-row">
        <div class="speech-avatar"><img class="emoji-dog" src="${exerciseAvatar(ex.heroPack)}" alt="" /></div>
        <div class="speech-bubble">${highlightSentence(ex.sentence, ex.highlight)}</div>
      </div>
      <div class="choice-list" data-choices>
        ${ex.options.map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
      </div>
    `;
    wireChoices(ex.answer);
  }

  function renderPattern(ex) {
    state = { choice: null };
    body.innerHTML = `
      <p class="lesson-label">${escapeHtml(ex.label || "новая конструкция")}</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      <div class="pattern-box">
        ${ex.examples
          .map(
            (exm) =>
              `<div class="pattern-line">${highlightSentence(exm.text, exm.highlight)}</div>`
          )
          .join("")}
        <div class="pattern-line pattern-line--task">
          ${tapifyEnglish(ex.blankBefore)}<span class="blank-slot" data-blank>&nbsp;</span>${tapifyEnglish(ex.blankAfter)}
        </div>
      </div>
      <div class="choice-list" data-choices>
        ${ex.options.map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
      </div>
    `;
    wireChoices(ex.answer, (val) => {
      const blank = body.querySelector("[data-blank]");
      if (blank) {
        blank.textContent = val || "\u00a0";
        blank.classList.toggle("blank-slot--filled", Boolean(val));
      }
    });
  }

  function heroSrc(ex) {
    if (ex.hero) {
      const h = String(ex.hero);
      // Брендовая собака из /assets/ в заданиях не используем
      if (/^assets\//i.test(h) || /\/assets\//i.test(h)) {
        return window.LexiCharacters?.pick?.(ex.heroPack) || "../corgi_emotions/02_smile.svg";
      }
      return h.startsWith("../") || h.startsWith("http") ? h : `../${h}`;
    }
    return window.LexiCharacters?.pick?.(ex.heroPack) || "../corgi_emotions/02_smile.svg";
  }

  function castAvatar(who, avatar, map) {
    if (window.LexiCharacters?.dialogueAvatar) {
      return window.LexiCharacters.dialogueAvatar(who, avatar, map);
    }
    return window.LexiCharacters?.pick?.() || "../corgi_emotions/02_smile.svg";
  }

  function exerciseAvatar(preferPack) {
    return window.LexiCharacters?.pick?.(preferPack) || "../corgi_emotions/02_smile.svg";
  }

  function speakEnglish(text, opts) {
    if (window.LexiSpeak?.isSupported?.()) {
      window.LexiSpeak.speak(text, { rate: 0.92, ...(opts || {}) });
      return;
    }
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  }

  function renderTranslate(ex) {
    const isListen = ex.type === "listen-translate" || ex.listen;
    const isComposeEn = ex.type === "compose-en";
    const sourceLang = isListen ? "en" : isComposeEn ? "ru" : ex.sourceLang || "en";
    const bank = LexiLessons.shuffle((ex.bank || []).map((w, i) => ({ id: i, text: w })));
    state = {
      bank,
      answer: [],
      expected: ex.answer,
      dragFrom: null,
      speakText: sourceLang === "en" ? ex.source : null,
    };

    const label = isListen ? "на слух" : isComposeEn ? "собери на английском" : "перевод";
    const prompt =
      ex.prompt ||
      (isListen
        ? "Послушай и собери перевод"
        : isComposeEn
          ? "Составь предложение на английском"
          : "Переведи предложение");
    const bubbleText =
      sourceLang === "ru" ? escapeHtml(ex.source) : isListen ? escapeHtml(ex.source) : tapifyEnglish(ex.source);

    body.innerHTML = `
      <p class="lesson-label">${label}</p>
      <h1 class="lesson-prompt">${escapeHtml(prompt)}</h1>
      <div class="speech-row speech-row--hero">
        <div class="speech-avatar speech-avatar--hero"><img class="emoji-dog" src="${heroSrc(ex)}" alt="" /></div>
        <div class="speech-stack">
          ${
            isListen || sourceLang === "en"
              ? `<button type="button" class="speak-btn" data-speak aria-label="Прослушать">
                   <span aria-hidden="true">▶</span> Слушать
                 </button>`
              : ""
          }
          <div class="speech-bubble">${bubbleText}</div>
        </div>
      </div>
      <div class="answer-slot answer-slot--active" data-answer-line aria-label="Твой ответ"></div>
      <div class="word-bank" data-bank></div>
    `;
    paintTranslate();
    showCheckButton();

    const speakBtn = body.querySelector("[data-speak]");
    if (speakBtn && state.speakText) {
      speakBtn.addEventListener("click", () => speakEnglish(state.speakText, { fromUser: true }));
      // Автоозвучка — только если уже был тап (на iPhone без жеста звук блокируется).
      if (isListen) {
        window.setTimeout(() => {
          if (window.LexiSpeak?.isUnlocked?.()) speakEnglish(state.speakText, { fromUser: false });
        }, 280);
      }
    }
  }

  function normalizeTyped(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[.?!,;:]+$/g, "");
  }

  function typedAnswersMatch(got, answer) {
    const variants = Array.isArray(answer) ? answer : [answer];
    const normalized = normalizeTyped(got);
    return variants.some((v) => normalizeTyped(v) === normalized);
  }

  function canonicalAnswer(answer) {
    const variants = Array.isArray(answer) ? answer : [answer];
    return String(variants[0] || "").trim();
  }

  function wrongTypedMessage(answer) {
    return `Неверно. Правильно: ${canonicalAnswer(answer)}`;
  }

  function wireTypeInput() {
    showCheckButton();
    const input = body.querySelector("[data-type-input]");
    if (!input) return;
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    window.LexiViewport?.sync?.();
    input.addEventListener("input", () => {
      if (phase !== "answer") return;
      state.typed = input.value;
      checkBtn.disabled = normalizeTyped(input.value).length === 0;
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      if (phase === "feedback" || phase === "complete") {
        checkBtn.click();
        return;
      }
      if (phase === "answer" && !checkBtn.disabled && !checkBtn.hidden) checkAnswer();
    });
  }

  function reviewTargetFromExercise(ex) {
    if (!ex) return null;
    if (ex.type === "type-word") {
      const word = canonicalAnswer(ex.answer);
      if (!word) return null;
      return { word, translation: String(ex.source || "").trim() || "—" };
    }
    if (ex.type === "type-blank" || ex.type === "story-blank") {
      const word = canonicalAnswer(ex.answer);
      if (!word || String(word).includes(" ")) return null;
      const ru = window.LexiVocab?.lookup?.(word)?.ru || "—";
      return { word, translation: ru };
    }
    return null;
  }

  function reviewSaveButtonHtml(ex) {
    const target = reviewTargetFromExercise(ex);
    if (!target) return "";
    const saved = Boolean(LexiStore?.hasReviewWord?.(target.word));
    return `
      <div class="type-review-bar">
        <button
          type="button"
          class="btn btn--secondary btn--wide"
          data-save-review
          data-word="${escapeAttr(target.word)}"
          data-ru="${escapeAttr(target.translation)}"
          ${saved ? "disabled" : ""}
        >${saved ? "Уже в повторить" : "В повторить"}</button>
      </div>`;
  }

  function renderTypeWord(ex) {
    state = { typed: "" };
    body.innerHTML = `
      <p class="lesson-label">написание</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt || "Напиши перевод на английский")}</h1>
      <div class="speech-row">
        <div class="speech-avatar"><img class="emoji-dog" src="${exerciseAvatar(ex.heroPack)}" alt="" /></div>
        <div class="speech-bubble speech-bubble--word">${escapeHtml(ex.source)}</div>
      </div>
      <label class="type-field">
        <span class="muted">Твой перевод</span>
        <input
          class="type-input"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="Введи слово…"
          data-type-input
        />
      </label>
      ${reviewSaveButtonHtml(ex)}
    `;
    wireTypeInput();
  }

  function splitBlankSentence(ex) {
    if (ex.before != null || ex.after != null) {
      return { before: ex.before || "", after: ex.after || "" };
    }
    const raw = String(ex.sentence || "");
    const parts = raw.split("______");
    return { before: parts[0] || "", after: parts.slice(1).join("______") || "" };
  }

  function renderTypeBlank(ex) {
    state = { typed: "" };
    const { before, after } = splitBlankSentence(ex);
    body.innerHTML = `
      <p class="lesson-label">впиши слово</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt || "Впиши подходящее слово")}</h1>
      <div class="type-blank-card">
        <p class="type-blank-sentence">
          <span>${tapifyEnglish(before)}</span><span class="blank-slot blank-slot--live" data-blank>&nbsp;</span><span>${tapifyEnglish(after)}</span>
        </p>
        <label class="type-field">
          <span class="muted">Ответ</span>
          <input
            class="type-input"
            type="text"
            inputmode="text"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            placeholder="Например: is, are, do…"
            data-type-input
          />
        </label>
      </div>
      ${reviewSaveButtonHtml(ex)}
    `;
    const blank = body.querySelector("[data-blank]");
    wireTypeInput();
    const input = body.querySelector("[data-type-input]");
    if (input && blank) {
      input.addEventListener("input", () => {
        const val = input.value.trim();
        blank.textContent = val || "\u00a0";
        blank.classList.toggle("blank-slot--filled", Boolean(val));
      });
    }
  }

  function paintTranslate() {
    const line = body.querySelector("[data-answer-line]");
    const bank = body.querySelector("[data-bank]");
    if (!line || !bank) return;

    line.innerHTML = state.answer.length
      ? state.answer
          .map(
            (w, i) =>
              `<button type="button" class="chip chip--placed" data-answer-i="${i}" draggable="true">${escapeHtml(w.text)}</button>`
          )
          .join("")
      : `<span class="muted">Собери ответ из слов</span>`;

    bank.innerHTML = state.bank
      .map((w) => {
        const used = state.answer.some((a) => a.id === w.id);
        return used
          ? `<span class="chip chip--ghost" aria-hidden="true">${escapeHtml(w.text)}</span>`
          : `<button type="button" class="chip" data-bank-id="${w.id}" draggable="true">${escapeHtml(w.text)}</button>`;
      })
      .join("");

    if (!checkBtn.hidden && checkBtn.textContent === "ПРОВЕРИТЬ") {
      checkBtn.disabled = state.answer.length === 0;
    }

    bank.querySelectorAll("[data-bank-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.bankId);
        const word = state.bank.find((w) => w.id === id);
        if (!word) return;
        state.answer.push(word);
        paintTranslate();
      });
      btn.addEventListener("dragstart", (e) => {
        state.dragFrom = { place: "bank", id: Number(btn.dataset.bankId) };
        e.dataTransfer.setData("text/plain", "bank");
      });
    });

    line.querySelectorAll("[data-answer-i]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.answerI);
        state.answer.splice(i, 1);
        paintTranslate();
      });
      btn.addEventListener("dragstart", (e) => {
        state.dragFrom = { place: "answer", index: Number(btn.dataset.answerI) };
        e.dataTransfer.setData("text/plain", "answer");
      });
      btn.addEventListener("dragover", (e) => e.preventDefault());
      btn.addEventListener("drop", (e) => {
        e.preventDefault();
        const to = Number(btn.dataset.answerI);
        moveWord(to);
      });
    });

    line.addEventListener("dragover", (e) => e.preventDefault());
    line.addEventListener("drop", (e) => {
      if (e.target.closest("[data-answer-i]")) return;
      e.preventDefault();
      moveWord(state.answer.length);
    });
  }

  function moveWord(toIndex) {
    const from = state.dragFrom;
    if (!from) return;
    let word;
    if (from.place === "bank") {
      word = state.bank.find((w) => w.id === from.id);
      if (!word || state.answer.some((a) => a.id === word.id)) return;
      state.answer.splice(toIndex, 0, word);
    } else {
      word = state.answer.splice(from.index, 1)[0];
      const adj = from.index < toIndex ? toIndex - 1 : toIndex;
      state.answer.splice(adj, 0, word);
    }
    state.dragFrom = null;
    paintTranslate();
  }

  function renderSpotError(ex) {
    state = {
      step: "find",
      pickedIndex: null,
      choice: null,
      expectedFix: ex.answer,
      errorIndex: ex.errorIndex,
    };
    body.innerHTML = `
      <p class="lesson-label">найди ошибку</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      <div class="token-row" data-tokens>
        ${ex.tokens
          .map(
            (t, i) =>
              `<button type="button" class="token-chip" data-i="${i}">${escapeHtml(t)}</button>`
          )
          .join("")}
      </div>
      <div data-fix-area hidden></div>
    `;

    body.querySelector("[data-tokens]").addEventListener("click", (e) => {
      if (phase === "feedback" || state.step !== "find") return;
      const btn = e.target.closest(".token-chip");
      if (!btn) return;
      const i = Number(btn.dataset.i);
      body.querySelectorAll(".token-chip").forEach((c) => c.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      state.pickedIndex = i;

      if (i !== ex.errorIndex) {
        btn.classList.add("is-wrong");
        failAndRecycle("Неверно. В следующий раз получится!");
        return;
      }

      state.step = "fix";
      body.querySelectorAll(".token-chip").forEach((c) => {
        c.classList.toggle("is-error-found", Number(c.dataset.i) === i);
        c.disabled = true;
      });
      const area = body.querySelector("[data-fix-area]");
      area.hidden = false;
      area.innerHTML = `
        <p class="lesson-subprompt">${escapeHtml(ex.fixPrompt || "Как правильно?")}</p>
        <div class="choice-list" data-choices>
          ${ex.options.map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
        </div>
      `;
      wireChoices(ex.answer, (val) => {
        btn.textContent = val;
      });
    });
  }

  function renderOddOne(ex) {
    state = { choice: null };
    body.innerHTML = `
      <p class="lesson-label">что лишнее?</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      ${ex.hint ? `<p class="muted" style="margin-top:-0.5rem">${escapeHtml(ex.hint)}</p>` : ""}
      <div class="choice-list" data-choices>
        ${ex.options.map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
      </div>
    `;
    wireChoices(ex.answer);
  }

  function renderOrderLines(ex) {
    const shuffled = LexiLessons.shuffle(ex.lines.map((l) => ({ ...l })));
    state = {
      order: shuffled,
      expected: ex.lines.map((l) => l.id),
    };
    body.innerHTML = `
      <p class="lesson-label">порядок реплик</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      <p class="muted" style="margin-top:-0.35rem">Тапни реплику, затем стрелки — вверх или вниз</p>
      <div class="order-list" data-order></div>
    `;
    paintOrder();
    showCheckButton();
    checkBtn.disabled = false;
  }

  function paintOrder() {
    const root = body.querySelector("[data-order]");
    if (!root) return;
    const speakerMap = window.LexiCharacters?.assignSpeakers?.(state.order.map((l) => l.who)) || {};
    root.innerHTML = state.order
      .map(
        (line, i) => `
      <div class="order-item ${state.selected === i ? "is-selected" : ""}" data-order-i="${i}">
        <div class="speech-avatar"><img class="emoji-dog" src="${castAvatar(line.who, line.avatar, speakerMap)}" alt="" /></div>
        <div class="order-item__text">
          <div class="order-item__who">
            <strong>${escapeHtml(line.who)}</strong>
            ${lineSpeakBtn(line.text)}
          </div>
          <span>${tapifyEnglish(line.text)}</span>
        </div>
        <div class="order-item__controls">
          <button type="button" class="order-move" data-dir="up" data-i="${i}" aria-label="Выше">↑</button>
          <button type="button" class="order-move" data-dir="down" data-i="${i}" aria-label="Ниже">↓</button>
        </div>
      </div>`
      )
      .join("");

    root.querySelectorAll("[data-order-i]").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest(".order-move") || e.target.closest(".tap-word") || e.target.closest("[data-line-speak]")) return;
        state.selected = Number(row.dataset.orderI);
        paintOrder();
      });
    });
    root.querySelectorAll(".order-move").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const i = Number(btn.dataset.i);
        const dir = btn.dataset.dir;
        const j = dir === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= state.order.length) return;
        const tmp = state.order[i];
        state.order[i] = state.order[j];
        state.order[j] = tmp;
        state.selected = j;
        paintOrder();
      });
    });
  }

  function renderTrueFalse(ex) {
    state = {
      step: "judge",
      verdict: null,
      choice: null,
      isCorrect: ex.isCorrect,
      expectedFix: ex.answer,
    };
    body.innerHTML = `
      <p class="lesson-label">верно или нет</p>
      <h1 class="lesson-prompt">${escapeHtml(ex.prompt)}</h1>
      <div class="tf-statement">${tapifyEnglish(ex.statement)}</div>
      <div class="tf-actions" data-tf-actions>
        <button type="button" class="choice tf-btn" data-verdict="true">Верно</button>
        <button type="button" class="choice tf-btn" data-verdict="false">Неверно</button>
      </div>
      <div data-fix-area hidden></div>
    `;

    body.querySelector("[data-tf-actions]").addEventListener("click", (e) => {
      if (phase === "feedback" || state.step !== "judge") return;
      const btn = e.target.closest("[data-verdict]");
      if (!btn) return;
      const verdict = btn.dataset.verdict === "true";
      state.verdict = verdict;
      body.querySelectorAll(".tf-btn").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");

      const judgedOk = verdict === ex.isCorrect;
      if (!judgedOk) {
        failAndRecycle("Неверно. В следующий раз получится!");
        return;
      }

      if (ex.isCorrect) {
        showFeedback(true, successMessage(current()).replace("Верно!", "Да, всё верно!"));
        return;
      }

      // неверно и ученик это заметил → выбор исправления
      state.step = "fix";
      body.querySelectorAll(".tf-btn").forEach((b) => {
        b.disabled = true;
      });
      const area = body.querySelector("[data-fix-area]");
      area.hidden = false;
      area.innerHTML = `
        <p class="lesson-subprompt">${escapeHtml(ex.fixPrompt || "Как правильно?")}</p>
        <div class="choice-list" data-choices>
          ${ex.options.map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
        </div>
      `;
      wireChoices(ex.answer);
    });
  }

  const storyShown = new Set();
  /** Кто из персонажей (корги/мопс/овчарка) за какую роль в истории */
  let storySpeakerMap = {};
  const isStoryLesson = lesson.mode === "story";

  function ensureStoryShell() {
    if (body.querySelector("[data-story-shell]")) return;
    body.innerHTML = `
      <div data-story-shell>
        <p class="lesson-label">история</p>
        <div class="dialogue-thread" data-story-log></div>
        <div class="story-task" data-story-task></div>
      </div>
    `;
  }

  function speakableLineText(raw) {
    return String(raw || "")
      .replace(/_+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function lineSpeakBtn(raw) {
    const speakText = speakableLineText(raw);
    if (!speakText || !/[a-zA-Z]/.test(speakText)) return "";
    return `<button type="button" class="line-speak-btn" data-line-speak="${escapeAttr(
      speakText
    )}" aria-label="Прослушать реплику"><span aria-hidden="true">▶</span></button>`;
  }

  function lineHtml(line, { asBlank } = {}) {
    const raw = String(line.text || "");
    let text;
    if (asBlank && raw.includes("______")) {
      const parts = raw.split("______");
      text =
        tapifyEnglish(parts[0] || "") +
        '<span class="blank-slot" data-active-blank>&nbsp;</span>' +
        tapifyEnglish(parts.slice(1).join("______") || "");
    } else {
      text = tapifyEnglish(raw);
    }
    storySpeakerMap = window.LexiCharacters?.assignSpeakers?.([line.who], storySpeakerMap) || storySpeakerMap;
    const avatarSrc = castAvatar(line.who, line.avatar, storySpeakerMap);
    return `
      <div class="dialogue-line story-line-in">
        <div class="speech-avatar"><img class="emoji-dog" src="${avatarSrc}" alt="" /></div>
        <div class="speech-bubble speech-bubble--lined">
          <div class="speech-bubble__head">
            ${line.who ? `<strong>${escapeHtml(line.who)}</strong>` : "<span></span>"}
            ${lineSpeakBtn(raw)}
          </div>
          <div class="speech-bubble__text">${text}</div>
        </div>
      </div>`;
  }

  function fillActiveBlank(val) {
    const blank = body.querySelector("[data-active-blank]");
    if (!blank) return;
    blank.textContent = val;
    blank.classList.add("blank-slot--filled");
  }

  function resetActiveBlank() {
    const blank = body.querySelector("[data-active-blank]");
    if (!blank) return;
    blank.textContent = "\u00a0";
    blank.classList.remove("blank-slot--filled");
  }

  function commitActiveBlank() {
    const blank = body.querySelector("[data-active-blank]");
    if (!blank) return;
    blank.removeAttribute("data-active-blank");
    blank.classList.add("blank-slot--filled");
  }

  function appendStoryLines(lines, opts) {
    const log = body.querySelector("[data-story-log]");
    if (!log || !lines?.length) return;
    const wrap = document.createElement("div");
    wrap.className = "story-chunk";
    wrap.innerHTML = lines.map((line) => lineHtml(line, opts)).join("");
    log.appendChild(wrap);
    scrollLessonBottom();
  }

  function paintStoryStep(ex) {
    ensureStoryShell();
    const task = body.querySelector("[data-story-task]");
    task.innerHTML = "";
    state = { choice: null };

    const firstShow = !storyShown.has(ex.id);
    if (firstShow && ex.lines?.length) {
      appendStoryLines(ex.lines, { asBlank: ex.type === "story-blank" });
      storyShown.add(ex.id);
    } else if (!firstShow && ex.type === "story-blank") {
      resetActiveBlank();
    }

    if (ex.type === "story-read") {
      checkBtn.hidden = false;
      checkBtn.disabled = false;
      checkBtn.textContent = "ДАЛЕЕ";
      phase = "feedback";
      lastCorrect = true;
      lastXpGain = 0;
      scrollLessonBottom();
      return;
    }

    if (ex.type === "story-blank") {
      task.innerHTML = `
        <h2 class="story-task__prompt">${escapeHtml(ex.prompt || "Complete the next phrase")}</h2>
        ${ex.question ? `<p class="lesson-subprompt">${escapeHtml(ex.question)}</p>` : ""}
        <div class="choice-list choice-list--wrap" data-choices>
          ${ex.options.map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
        </div>
      `;
      wireChoices(ex.answer, (val) => {
        fillActiveBlank(val);
        scrollLessonBottom();
      });
      scrollLessonBottom();
      return;
    }

    if (ex.type === "story-quiz") {
      task.innerHTML = `
        <h2 class="story-task__prompt">${escapeHtml(ex.prompt || "Итог")}</h2>
        ${ex.summary ? `<div class="theory-box">${escapeHtml(ex.summary)}</div>` : ""}
        <p class="lesson-subprompt">${escapeHtml(ex.question || "")}</p>
        <div class="choice-list" data-choices>
          ${ex.options.map((o) => `<button type="button" class="choice" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
        </div>
      `;
      wireChoices(ex.answer, () => scrollLessonBottom());
      scrollLessonBottom();
    }
  }

  function wireChoices(answer, onPick) {
    // одиночный выбор — сразу проверка, кнопки «Проверить» нет
    phase = "answer";
    state.expected = answer;
    body.querySelectorAll("[data-choices] .choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (phase === "feedback") return;
        body.querySelectorAll(".choice").forEach((c) => {
          c.classList.remove("is-selected");
          c.disabled = true;
        });
        btn.classList.add("is-selected");
        state.choice = btn.dataset.val;
        onPick?.(state.choice);
        const ok = state.choice === state.expected;
        if (ok) showFeedback(true, successMessage(current()));
        else showFeedback(false, wrongMessage(current()));
      });
    });
  }

  function wrongMessage(ex) {
    const soft = [
      "Неверно. В следующий раз получится!",
      "Почти! Попробуешь ещё раз позже.",
      "Упс, мимо. Не переживай — будет второй шанс.",
    ];
    return soft[(ex?.failCount || 0) % soft.length];
  }

  function render() {
    hideFeedback();
    usedHintOnCurrent = false;
    window.LexiViewport?.reset?.();
    const ex = current();
    if (!ex) return finishLesson();

    // обычные уроки очищают экран; история копит реплики
    const storyTypes = ["story-read", "story-blank", "story-quiz"];
    if (!storyTypes.includes(ex.type) || !isStoryLesson) {
      if (!storyTypes.includes(ex.type)) {
        storyShown.clear();
        storySpeakerMap = {};
      }
    }

    switch (ex.type) {
      case "match":
        renderMatch(ex);
        break;
      case "meaning":
        renderMeaning(ex);
        break;
      case "translate":
      case "listen-translate":
      case "compose-en":
        renderTranslate(ex);
        break;
      case "type-word":
        renderTypeWord(ex);
        break;
      case "type-blank":
        renderTypeBlank(ex);
        break;
      case "pattern":
        renderPattern(ex);
        break;
      case "spot-error":
        renderSpotError(ex);
        break;
      case "odd-one":
        renderOddOne(ex);
        break;
      case "order-lines":
        renderOrderLines(ex);
        break;
      case "true-false":
        renderTrueFalse(ex);
        break;
      case "story-read":
      case "story-blank":
      case "story-quiz":
        paintStoryStep(ex);
        break;
      default:
        body.innerHTML = `<p>Неизвестный тип: ${escapeHtml(ex.type)}</p>`;
    }

    if (ex.isMistakeReview || ex.sectionLabel === "ошибки") {
      const label = body.querySelector(".lesson-label");
      if (label) label.textContent = "ошибки";
    } else if (ex.isReview || ex.sectionLabel === "повторение") {
      const label = body.querySelector(".lesson-label");
      if (label) label.textContent = "повторение";
    }
    updateHintUi();
  }

  function successMessage(ex) {
    const retry = (ex?.failCount || 0) > 0;
    awardXp(retry ? 5 : 10);
    return retry ? "Верно! Справился со второй попытки." : "Верно!";
  }

  function checkAnswer() {
    const ex = current();
    if (!ex) return;

    if (ex.type === "match") return;

    if (ex.type === "translate" || ex.type === "listen-translate" || ex.type === "compose-en") {
      const got = state.answer.map((w) => w.text);
      const ok = got.length === state.expected.length && got.every((w, i) => w === state.expected[i]);
      if (ok) showFeedback(true, successMessage(ex));
      else showFeedback(false, wrongMessage(ex));
      return;
    }

    if (ex.type === "type-word" || ex.type === "type-blank") {
      const input = body.querySelector("[data-type-input]");
      const got = input ? input.value : state.typed;
      const ok = typedAnswersMatch(got, ex.answer);
      if (input) input.disabled = true;
      if (ok) {
        const blank = body.querySelector("[data-blank]");
        if (blank) {
          blank.textContent = canonicalAnswer(ex.answer);
          blank.classList.add("blank-slot--filled");
        }
        showFeedback(true, successMessage(ex));
      } else {
        showFeedback(false, wrongTypedMessage(ex.answer));
      }
      return;
    }

    if (ex.type === "order-lines") {
      const got = state.order.map((l) => l.id);
      const ok = got.length === state.expected.length && got.every((id, i) => id === state.expected[i]);
      if (ok) showFeedback(true, successMessage(ex).replace("Верно!", "Верно! Диалог в порядке."));
      else showFeedback(false, wrongMessage(ex));
      return;
    }

    if (ex.type === "story-read") {
      lastXpGain = 0;
      advance(true);
      return;
    }

    const ok = state.choice === state.expected;
    if (ok) showFeedback(true, successMessage(ex));
    else showFeedback(false, wrongMessage(ex));
  }

  function failAndRecycle(msg) {
    showFeedback(false, msg || wrongMessage(current()));
    lastCorrect = false;
  }

  function resolveWrong(ex) {
    if (isMistakesQuiz) {
      // в тесте ошибок: неверное остаётся в списке ошибок, из сессии просто уходим дальше
      queue.splice(index, 1);
      doneCount += 1;
      return "kept";
    }

    // Финал: жизни. Обычные уровни — без жизней.
    if (lives != null) {
      lives -= 1;
      if (lives <= 0) {
        updateChrome();
        failLevel("Слишком много ошибок. Пройди финал ещё раз — ты справишься!");
        return "dead";
      }
    }

    const item = queue.splice(index, 1)[0];
    item.failCount = (item.failCount || 0) + 1;

    // Первая ошибка — только в конец очереди. В «Ошибки» НЕ кладём.
    if (item.failCount < 2) {
      queue.push(item);
      return "recycled";
    }

    // Вторая ошибка по тому же заданию — в практику «Ошибки».
    LexiStore?.addMistake?.({
      id: item.id,
      topicId,
      level: lesson.mode === "final" ? "final" : lesson.mode === "story" ? "dialogue" : level,
      type: item.type,
      prompt: mistakeSummary(item),
      preview:
        item.source ||
        item.statement ||
        item.sentence ||
        item.question ||
        (item.lines && item.lines[0]?.text) ||
        mistakeSummary(item),
      summary: "Не вышло со второй попытки — повторим в «Ошибках»",
      raw: { ...item, level: lesson.mode === "final" ? "final" : lesson.mode === "story" ? "dialogue" : level },
    });
    doneCount += 1;
    hardFails += 1;

    // Обычный уровень / история: 3 задания не вышли со 2-й попытки → уровень не засчитан
    if (lives == null && hardFails >= HARD_FAIL_LIMIT) {
      updateChrome();
      failLevel(
        "Три задания не вышли со второй попытки. Уровень не засчитан — пройди его ещё раз."
      );
      return "dead";
    }

    return "mistaken";
  }

  function clearMistakeRecord(ex) {
    if (!ex) return;
    if (ex.mistakeId) {
      LexiStore?.removeMistakeById?.(ex.mistakeId);
      return;
    }
    if (ex.isReview || ex.isMistakeReview) {
      LexiStore?.removeMistakeByPrompt?.(ex.topicId || topicId, ex.prompt, ex.type);
    }
  }

  function advance(forceCorrect) {
    const ok = forceCorrect ?? lastCorrect;
    const ex = current();

    if (ok) {
      commitActiveBlank();
      // XP уже начислен в successMessage / match; story-read без XP
      if (forceCorrect === true && ex?.type === "story-read") {
        /* skip xp */
      } else if (forceCorrect === true && lastXpGain === 0 && ex && ex.type !== "story-read") {
        const xp = (ex.failCount || 0) > 0 ? 5 : 10;
        awardXp(xp);
      }
      // Верно со 2-й попытки: в «Ошибки» не кладём (туда только failCount >= 2)
      if (ex?.isReview || ex?.isMistakeReview || isMistakesQuiz) {
        clearMistakeRecord(ex);
        if (isMistakesQuiz) clearedMistakes += 1;
      }
      doneCount += 1;
      queue.splice(index, 1);
    } else {
      resetActiveBlank();
      const result = resolveWrong(ex);
      if (result === "dead") return;
    }

    lastXpGain = 0;
    updateChrome();
    if (!queue.length) return finishLesson();
    if (index >= queue.length) index = 0;
    render();
  }

  function retryHref() {
    const page =
      kindHint === "dialogue" ? "dialogue.html" : kindHint === "final" ? "final.html" : "lesson.html";
    return `${page}?topic=${encodeURIComponent(topicId)}&level=${level}`;
  }

  function failLevel(message) {
    // Уровень не засчитываем (completeLevel не вызываем)
    phase = "failed";
    if (progressEl) progressEl.style.width = "100%";
    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/06_crying.svg" alt="" />
        <h1>Уровень не засчитан</h1>
        <p class="muted">${escapeHtml(
          message || "Слишком много ошибок. Пройди уровень ещё раз — ты справишься!"
        )}</p>
        <a class="btn btn--primary" href="${retryHref()}">Пройти снова</a>
        <a class="btn btn--secondary" href="index.html?topic=${encodeURIComponent(topicId)}">К карте</a>
      </div>`;
    checkBtn.hidden = true;
    checkBtn.disabled = true;
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
    updateHintUi();
  }

  function finishLesson() {
    if (phase === "failed") return;
    if (!isMistakesQuiz) {
      LexiStore?.completeLevel?.(topicId, level, { xpGain: 0 });
    }
    if (progressEl) progressEl.style.width = "100%";

    body.innerHTML = isMistakesQuiz
      ? `
      <div class="lesson-complete">
        <img src="../assets/08_happy.svg" alt="" />
        <h1>Тест по ошибкам завершён</h1>
        <p class="muted">Исправлено: <strong>${clearedMistakes}</strong> · XP за сессию: <strong>+${sessionXp}</strong></p>
      </div>`
      : `
      <div class="lesson-complete">
        <img src="../assets/08_happy.svg" alt="" />
        <h1>Ты прошёл уровень!</h1>
        <p class="muted">${
          replayNoXp
            ? "Это повтор — XP за урок уже был начислен раньше."
            : `Супер! За урок: <strong>+${sessionXp} XP</strong>`
        }</p>
      </div>`;
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
    checkBtn.hidden = false;
    checkBtn.disabled = false;
    checkBtn.textContent = "ДАЛЕЕ";
    checkBtn.classList.remove("btn--danger-solid");
    phase = "complete";
    updateHintUi();
  }

  checkBtn.addEventListener("click", () => {
    if (phase === "complete") {
      location.href = isMistakesQuiz ? profileHref : `index.html?topic=${encodeURIComponent(topicId)}`;
      return;
    }
    if (phase === "feedback") {
      advance();
      return;
    }
    checkAnswer();
  });

  hintBtn?.addEventListener("click", () => {
    if (hintsLeft() < 1) openHintShop();
    else applyHint();
  });

  // Озвучка реплик в истории — только по нажатию (без автозапуска).
  body.addEventListener("click", (e) => {
    const saveBtn = e.target.closest("[data-save-review]");
    if (saveBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (saveBtn.disabled) return;
      const word = saveBtn.getAttribute("data-word") || "";
      const ru = saveBtn.getAttribute("data-ru") || "—";
      if (!word) return;
      LexiStore?.addReviewWord?.({ word, translation: ru || "—" });
      saveBtn.disabled = true;
      saveBtn.textContent = "Уже в повторить";
      return;
    }

    const btn = e.target.closest("[data-line-speak]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const text = btn.getAttribute("data-line-speak");
    if (text) speakEnglish(text, { fromUser: true });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (e.repeat || e.isComposing) return;
    if (checkBtn.hidden || checkBtn.disabled) return;
    // В полях ввода свой обработчик Enter — не дублируем
    if (phase === "answer" && e.target?.closest?.("input, textarea, [contenteditable='true']")) return;
    if (phase !== "answer" && phase !== "feedback" && phase !== "complete") return;
    e.preventDefault();
    checkBtn.click();
  });

  updateChrome();
  render();
})();
