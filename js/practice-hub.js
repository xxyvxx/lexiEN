/**
 * Списки «Ошибки» и «Повторить» для вкладки практики в тренажёре.
 */
window.LexiPracticeHub = {
  escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  mistakeTypeLabel(type) {
    const map = {
      match: "Составь пары",
      meaning: "Выбери значение",
      translate: "Переведи предложение",
      "listen-translate": "На слух · перевод",
      "compose-en": "Собери на английском",
      "type-word": "Напиши перевод",
      "type-blank": "Впиши слово",
      pattern: "Заполни пропуск",
      "spot-error": "Найди ошибку",
      "odd-one": "Лишнее слово",
      "order-lines": "Порядок реплик",
      "true-false": "Верно или нет",
      "story-blank": "Дополни фразу",
      "story-quiz": "Вопрос по истории",
    };
    return map[type] || "Задание";
  },

  mistakePreview(m) {
    const raw = m.raw || {};
    return (
      m.preview ||
      raw.source ||
      raw.statement ||
      raw.sentence ||
      raw.question ||
      (Array.isArray(raw.lines) && raw.lines[0]?.text) ||
      m.prompt ||
      "Задание"
    );
  },

  topicTitle(topicId) {
    if (topicId === "dictionary") return "Словарь";
    const t = window.LexiTheory?.get?.(topicId) || window.LexiTheory?.topics?.find((x) => x.id === topicId);
    return t?.title || topicId || "Без темы";
  },

  wordForm(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  },

  renderMistakes() {
    const store = window.LexiStore;
    const listEl = document.querySelector("[data-mistakes-list]");
    const emptyEl = document.querySelector("[data-mistakes-empty]");
    const actionsEl = document.querySelector("[data-mistakes-actions]");
    if (!listEl || !emptyEl || !store) return;
    const mistakes = (store.getMistakes?.() || []).filter((m) => m.raw?.type);
    if (!mistakes.length) {
      listEl.innerHTML = "";
      listEl.hidden = true;
      emptyEl.hidden = false;
      if (actionsEl) actionsEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    listEl.hidden = false;
    if (actionsEl) actionsEl.hidden = false;

    const topicOrder = (window.LexiTheory?.topics || []).map((t) => t.id);
    const byTopic = new Map();
    mistakes.forEach((m) => {
      const key = m.topicId || "_other";
      if (!byTopic.has(key)) byTopic.set(key, []);
      byTopic.get(key).push(m);
    });

    const orderedTopics = [
      ...topicOrder.filter((id) => byTopic.has(id)),
      ...[...byTopic.keys()].filter((id) => !topicOrder.includes(id)),
    ];

    listEl.innerHTML = orderedTopics
      .map((topicId) => {
        const items = byTopic.get(topicId) || [];
        const topicHref =
          topicId && topicId !== "_other"
            ? `mistakes.html?topic=${encodeURIComponent(topicId)}`
            : "mistakes.html";

        const rows = items
          .map(
            (m) => `
          <article class="mistake-row">
            <span class="mistake-row__type">${this.escapeHtml(
              this.mistakeTypeLabel(m.type || m.raw?.type)
            )}</span>
            <p class="mistake-row__text">${this.escapeHtml(this.mistakePreview(m))}</p>
            <a class="btn btn--ghost mistake-row__go" href="mistakes.html?id=${encodeURIComponent(
              m.id
            )}">Пройти</a>
          </article>`
          )
          .join("");

        return `
          <section class="mistake-topic">
            <header class="mistake-topic__head">
              <div>
                <h2 class="mistake-topic__title">${this.escapeHtml(
                  this.topicTitle(topicId === "_other" ? "" : topicId)
                )}</h2>
                <p class="mistake-topic__meta muted">${items.length} ${this.wordForm(
                  items.length,
                  "задание",
                  "задания",
                  "заданий"
                )}</p>
              </div>
              <a class="btn btn--primary" href="${topicHref}">Пройти тему</a>
            </header>
            <div class="mistake-topic__list">${rows}</div>
          </section>`;
      })
      .join("");
  },

  renderReview() {
    const store = window.LexiStore;
    const listEl = document.querySelector("[data-review-list]");
    const emptyEl = document.querySelector("[data-review-empty]");
    const actionsEl = document.querySelector("[data-review-actions]");
    if (!listEl || !emptyEl || !store) return;
    const words = store.getReviewWords?.() || [];
    if (!words.length) {
      listEl.innerHTML = "";
      listEl.hidden = true;
      emptyEl.hidden = false;
      if (actionsEl) actionsEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    listEl.hidden = false;
    if (actionsEl) actionsEl.hidden = false;
    const repeated = words.filter((w) => w.repeated);
    const clearBtn = repeated.length
      ? `<div class="review-clear-bar">
          <button type="button" class="btn btn--secondary btn--wide" data-clear-repeated>
            Убрать в словарь (${repeated.length})
          </button>
        </div>`
      : "";

    listEl.innerHTML =
      clearBtn +
      words
        .map((w) => {
          const done = !!w.repeated;
          return `
      <div class="word-row${done ? " word-row--done" : ""}" data-word="${this.escapeHtml(w.word)}">
        <div class="word-row__text">
          <strong>${this.escapeHtml(w.word)}</strong>
          <small>${this.escapeHtml(w.translation)}</small>
          ${done ? `<span class="word-row__badge">Повторено</span>` : ""}
        </div>
        <div class="word-row__actions">
          <button type="button" class="btn btn--secondary word-row__dict" data-to-dict>В словарь</button>
          <button type="button" class="btn btn--ghost" data-remove-word aria-label="Убрать">×</button>
        </div>
      </div>`;
        })
        .join("");

    listEl.querySelector("[data-clear-repeated]")?.addEventListener("click", () => {
      store.moveRepeatedReviewToDictionary?.();
      this.renderReview();
    });

    listEl.querySelectorAll("[data-to-dict]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest("[data-word]");
        const word = row?.dataset.word;
        const item = (store.getReviewWords?.() || []).find(
          (w) => String(w.word || "").toLowerCase() === String(word || "").toLowerCase()
        );
        if (!item) return;
        // всегда status ok: снимает «не пройдено» и чистит ошибку теста словаря
        store.addDictionaryWord?.({
          word: item.word,
          translation: item.translation,
          source: "review",
          status: "ok",
        });
        store.removeReviewWord?.(item.word);
        this.renderReview();
      });
    });

    listEl.querySelectorAll("[data-remove-word]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest("[data-word]");
        store.removeReviewWord?.(row?.dataset.word);
        this.renderReview();
      });
    });
  },

  renderAll() {
    this.renderMistakes();
    this.renderReview();
  },
};
