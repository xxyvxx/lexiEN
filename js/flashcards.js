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

  if (!card || !window.LexiStore) return;

  const source = (LexiStore.getReviewWords?.() || [])
    .map((w) => ({
      en: String(w.word || "").trim(),
      ru: String(w.translation || "").trim(),
    }))
    .filter((w) => w.en && w.ru);

  if (!source.length) {
    document.querySelector(".cards-body").innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/04_sleeping.svg" alt="" />
        <h1>Нет карточек</h1>
        <p class="muted">Добавь слова в «Повторить» из урока.</p>
        <a class="btn btn--primary" href="practice-review.html">К повторению</a>
      </div>`;
    return;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  let queue = source.map((w) => ({ ...w }));
  const totalStart = queue.length;
  let known = 0;
  let enFirst = true;
  let flipped = false;
  let busy = false;
  /** @type {Map<string, {en:string, ru:string}>} */
  const repeatedNow = new Map();

  function markResult(item, ok) {
    if (!item?.en) return;
    LexiStore.markReviewWordRepeated?.(item.en, ok);
    if (ok) {
      repeatedNow.set(item.en.toLowerCase(), { en: item.en, ru: item.ru || "" });
    } else {
      repeatedNow.delete(item.en.toLowerCase());
    }
  }

  function updateChrome() {
    if (countEl) countEl.textContent = `${known}/${totalStart}`;
    if (progressEl) {
      const pct = Math.min(100, Math.round((known / totalStart) * 100));
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

  function finish() {
    busy = true;
    if (progressEl) progressEl.style.width = "100%";
    if (countEl) countEl.textContent = `${totalStart}/${totalStart}`;

    const body = document.querySelector(".cards-body");
    if (!body) return;

    const done = [...repeatedNow.values()];
    const doneBlock = done.length
      ? `<div class="review-done-list" data-done-list>
          <p class="muted" style="margin:0 0 0.35rem">Эти слова отмечены зелёным — можно убрать из «Повторить»:</p>
          ${done
            .map(
              (w) => `
            <div class="review-done-chip" data-done-word="${escapeHtml(w.en)}">
              <div>
                <strong>${escapeHtml(w.en)}</strong>
                <small>${escapeHtml(w.ru)}</small>
              </div>
              <button type="button" class="btn btn--ghost" data-remove-one aria-label="Убрать">×</button>
            </div>`
            )
            .join("")}
          <button type="button" class="btn btn--secondary btn--wide" data-remove-all style="margin-top:0.35rem">
            Убрать в словарь (${done.length})
          </button>
        </div>`
      : `<p class="muted">Пока нет отмеченных слов — вернись и отметь «помню».</p>`;

    body.innerHTML = `
      <div class="lesson-complete">
        <img src="../assets/08_happy.svg" alt="" />
        <h1>Карточки пройдены!</h1>
        <p class="muted">Помню: <strong>${known}</strong> из <strong>${totalStart}</strong></p>
        ${doneBlock}
        <a class="btn btn--primary" href="practice-review.html" style="margin-top:1rem">К повторению</a>
      </div>`;

    body.querySelectorAll("[data-remove-one]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const chip = btn.closest("[data-done-word]");
        const word = chip?.dataset.doneWord;
        if (!word) return;
        const item = repeatedNow.get(String(word).toLowerCase());
        LexiStore.addDictionaryWord?.({
          word,
          translation: item?.ru || "—",
          source: "review",
          status: "ok",
        });
        LexiStore.removeReviewWord?.(word);
        repeatedNow.delete(word.toLowerCase());
        chip.remove();
        const list = body.querySelector("[data-done-list]");
        const left = list?.querySelectorAll("[data-done-word]").length || 0;
        const allBtn = list?.querySelector("[data-remove-all]");
        if (!left) {
          list?.remove();
        } else if (allBtn) {
          allBtn.textContent = `Убрать в словарь (${left})`;
        }
      });
    });

    body.querySelector("[data-remove-all]")?.addEventListener("click", () => {
      [...repeatedNow.keys()].forEach((key) => {
        const item = repeatedNow.get(key);
        if (!item) return;
        LexiStore.addDictionaryWord?.({
          word: item.en,
          translation: item.ru || "—",
          source: "review",
          status: "ok",
        });
        LexiStore.removeReviewWord?.(item.en);
      });
      repeatedNow.clear();
      body.querySelector("[data-done-list]")?.remove();
    });
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
      if (current) markResult(current, !!knows);
      if (knows) {
        known += 1;
      } else if (current) {
        queue.push(current);
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

  setDirection(true);
})();
