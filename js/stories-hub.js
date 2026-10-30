(() => {
  const topicsRoot = document.querySelector("[data-story-topics]");
  const listRoot = document.querySelector("[data-story-list]");
  const emptyEl = document.querySelector("[data-story-empty]");
  if (!topicsRoot || !listRoot || !window.LexiStories) return;

  const selected = new Set(LexiStories.getTopics().map((t) => t.id));

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTopics() {
    topicsRoot.innerHTML = LexiStories.getTopics()
      .map((t) => {
        const on = selected.has(t.id);
        return `
        <button type="button" class="story-topic-chip${on ? " is-active" : ""}" data-topic="${escapeHtml(t.id)}" aria-pressed="${on}">
          ${escapeHtml(t.title)}
        </button>`;
      })
      .join("");
  }

  function renderList() {
    const stories = LexiStories.getStoriesByTopics([...selected]);
    if (!stories.length) {
      listRoot.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    listRoot.innerHTML = stories
      .map((s) => {
        const topic = LexiStories.topicTitle(s.topic);
        return `
        <a class="story-card" href="story.html?id=${encodeURIComponent(s.id)}">
          <span class="story-card__badge">${escapeHtml(s.level || "")}</span>
          <strong class="story-card__title">${escapeHtml(s.title)}</strong>
          <span class="story-card__meta">${escapeHtml(topic)} · ${escapeHtml(s.level || "")}</span>
        </a>`;
      })
      .join("");
  }

  topicsRoot.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-topic]");
    if (!btn) return;
    const id = btn.dataset.topic;
    if (selected.has(id)) {
      if (selected.size === 1) return; // хотя бы одна тема
      selected.delete(id);
    } else {
      selected.add(id);
    }
    renderTopics();
    renderList();
  });

  renderTopics();
  renderList();
})();
