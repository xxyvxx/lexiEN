(() => {
  const stage = document.querySelector("[data-cards-stage]");
  const card = document.querySelector("[data-flash-card]");
  const inner = document.querySelector("[data-card-inner]");
  const frontText = document.querySelector("[data-front-text]");
  const backText = document.querySelector("[data-back-text]");
  const frontLang = document.querySelector("[data-front-lang]");
  const backLang = document.querySelector("[data-back-lang]");
  const progressEl = document.querySelector("[data-cards-progress]");
  const countEl = document.querySelector("[data-cards-count]");
  const dirBtn = document.querySelector("[data-flip-dir]");
  const noBtn = document.querySelector("[data-card-no]");
  const knowBtn = document.querySelector("[data-card-yes]");
  const titleEl = document.querySelector("[data-level-title]");

  if (!card || !window.LexiStore || !window.LexiVocabPacks) return;

  const levelId = new URLSearchParams(location.search).get("level") || "";
  const level = LexiVocabPacks.getLevel(levelId);

  if (!level) {
    document.querySelector(".cards-body").innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/04_sleeping.svg" alt="" />
        <h1>Уровень не найден</h1>
        <p class="muted">Выбери тему на экране изучения слов.</p>
        <a class="btn btn--primary" href="practice-vocab.html">К уровням</a>
      </div>`;
    return;
  }

  if (titleEl) titleEl.textContent = level.title;

  const totalInTheme = level.words.length;
  const knownSet = new Set(LexiStore.getVocabKnown(level.id));

  /** Только ещё не «знаю» — это колода текущего захода. */
  let queue = level.words
    .filter((w) => !knownSet.has(String(w.en).toLowerCase()))
    .map((w) => ({ en: w.en, ru: w.ru }));

  const sessionTotal = queue.length;
  let enFirst = true;
  let flipped = false;
  let busy = false;

  function updateChrome() {
    const left = queue.length;
    if (countEl) countEl.textContent = String(left);
    if (progressEl) {
      // Сколько осталось в этой колоде (не «освоение темы»)
      const pct = sessionTotal
        ? Math.min(100, Math.round(((sessionTotal - left) / sessionTotal) * 100))
        : 100;
      progressEl.style.width = `${pct}%`;
    }
  }

  function paintCard() {
    const item = queue[0];
    if (!item) return finish();
    flipped = false;
    card.classList.remove("is-flipped", "is-gone-left", "is-gone-right", "is-dragging");
    card.style.transform = "";
    card.style.transition = "";
    card.style.opacity = "1";
    if (inner) inner.style.transform = "";

    const front = enFirst ? item.en : item.ru;
    const back = enFirst ? item.ru : item.en;
    if (frontText) frontText.textContent = front;
    if (backText) backText.textContent = back;
    if (frontLang) frontLang.textContent = enFirst ? "EN" : "RU";
    if (backLang) backLang.textContent = enFirst ? "RU" : "EN";
    updateChrome();
  }

  function restartLevel() {
    LexiStore.clearVocabLevel?.(level.id);
    location.href = `vocab-cards.html?level=${encodeURIComponent(level.id)}`;
  }

  function finish() {
    busy = true;
    const { known, total, percent } = LexiStore.getVocabProgress(level.id, totalInTheme);
    const done = percent >= 100;
    const bodyEl = document.querySelector(".cards-body");
    bodyEl.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/${done ? "08_happy" : "03_winking"}.svg" alt="" />
        <h1>${done ? "Тема освоена!" : "Карточки просмотрены"}</h1>
        <p class="muted">В теме «${level.title}»: <strong>${known} из ${total}</strong> слов со статусом «знаю».</p>
        ${
          done
            ? `<button type="button" class="btn btn--primary" data-vocab-restart>Пройти заново</button>
               <a class="btn btn--secondary" href="practice-vocab.html">К темам</a>`
            : `<a class="btn btn--primary" href="vocab-cards.html?level=${encodeURIComponent(level.id)}">Учить дальше</a>
               <a class="btn btn--secondary" href="practice-vocab.html">К темам</a>
               <button type="button" class="btn btn--ghost" data-vocab-restart>Сбросить и заново</button>`
        }
        <p class="muted" style="margin-top:0.85rem">«Не знаю» по-прежнему уходит в «Повторить».</p>
      </div>`;
    bodyEl.querySelector("[data-vocab-restart]")?.addEventListener("click", restartLevel);
    if (progressEl) progressEl.style.width = "100%";
    if (countEl) countEl.textContent = "0";
  }

  function toggleFlip() {
    if (busy || !queue.length) return;
    flipped = !flipped;
    card.classList.toggle("is-flipped", flipped);
  }

  function setDirection(nextEnFirst) {
    if (busy) return;
    enFirst = nextEnFirst;
    if (dirBtn) dirBtn.textContent = enFirst ? "EN → RU" : "RU → EN";
    paintCard();
  }

  function settle(dx) {
    card.style.transition = "transform 0.28s ease, opacity 0.28s ease";
    if (dx > 0) {
      card.classList.add("is-gone-right");
      card.style.transform = "translateX(120%) rotate(12deg)";
    } else {
      card.classList.add("is-gone-left");
      card.style.transform = "translateX(-120%) rotate(-12deg)";
    }
    card.style.opacity = "0";
  }

  function remember(knows) {
    if (busy || !queue.length) return;
    busy = true;
    settle(knows ? 1 : -1);

    window.setTimeout(() => {
      const current = queue.shift();
      if (current) {
        if (knows) {
          LexiStore.markVocabKnown(level.id, current.en);
          LexiStore.addDictionaryWord?.({
            word: current.en,
            translation: current.ru,
            source: "vocab-study",
            status: "ok",
          });
        } else {
          // В «Повторить», из этой колоды уходит — следующее слово сразу
          LexiStore.addReviewWord({ word: current.en, translation: current.ru });
        }
      }
      busy = false;
      if (!queue.length) {
        finish();
        return;
      }
      paintCard();
    }, 280);
  }

  dirBtn?.addEventListener("click", () => setDirection(!enFirst));
  knowBtn?.addEventListener("click", () => remember(true));
  noBtn?.addEventListener("click", () => remember(false));

  if (window.LexiCardGestures) {
    LexiCardGestures.bind({
      card,
      stage,
      isBusy: () => busy,
      hasCard: () => queue.length > 0,
      onFlip: toggleFlip,
      onAnswer: remember,
    });
  }

  if (!queue.length) {
    finish();
    return;
  }

  setDirection(true);
})();
