(() => {
  const store = window.LexiStore;
  if (!store) return;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    const listEl = document.querySelector("[data-dict-list]");
    const emptyEl = document.querySelector("[data-dict-empty]");
    const actionsEl = document.querySelector("[data-dict-actions]");
    const statsEl = document.querySelector("[data-dict-stats]");
    if (!listEl || !emptyEl) return;

    const words = store.getDictionary?.() || [];
    const stats = store.getDictionaryStats?.() || { total: 0, ok: 0, failed: 0 };

    const totalEl = document.querySelector("[data-dict-total]");
    const okEl = document.querySelector("[data-dict-ok]");
    const failedEl = document.querySelector("[data-dict-failed]");
    if (totalEl) totalEl.textContent = String(stats.total);
    if (okEl) okEl.textContent = String(stats.ok);
    if (failedEl) failedEl.textContent = String(stats.failed);

    if (!words.length) {
      listEl.innerHTML = "";
      listEl.hidden = true;
      emptyEl.hidden = false;
      if (actionsEl) actionsEl.hidden = true;
      if (statsEl) statsEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    listEl.hidden = false;
    if (actionsEl) actionsEl.hidden = false;
    if (statsEl) statsEl.hidden = false;

    listEl.innerHTML = words
      .map((w) => {
        const failed = w.status === "failed";
        const inReview = store.hasReviewWord?.(w.word);
        return `
      <div class="word-row${failed ? " word-row--failed" : ""}" data-word="${escapeHtml(w.word)}">
        <div class="word-row__text">
          <strong>${escapeHtml(w.word)}</strong>
          <small>${escapeHtml(w.translation || "—")}</small>
          ${failed ? `<span class="word-row__badge word-row__badge--fail">Не пройдено</span>` : ""}
        </div>
        <div class="word-row__actions">
          <button type="button" class="btn btn--secondary word-row__dict" data-to-review ${
            inReview ? "disabled" : ""
          }>${inReview ? "Уже в повторить" : "В повторить"}</button>
          <button type="button" class="btn btn--ghost" data-remove-dict aria-label="Убрать">×</button>
        </div>
      </div>`;
      })
      .join("");

    listEl.querySelectorAll("[data-to-review]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest("[data-word]");
        store.moveDictionaryWordToReview?.(row?.dataset.word);
        render();
      });
    });

    listEl.querySelectorAll("[data-remove-dict]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest("[data-word]");
        store.removeDictionaryWord?.(row?.dataset.word);
        render();
      });
    });
  }

  render();
})();
