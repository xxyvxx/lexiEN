/**
 * Уровни тренажёра по темам.
 * status: done | current | locked — берём из LexiStore.path
 */
window.LexiTrainer = {
  /** Сколько уровней в каждой теме (последний = финал) */
  LEVELS_PER_TOPIC: 5,

  lessonHref(topicId, levelIndex, kind) {
    if (kind === "dialogue") return `dialogue.html?topic=${topicId}&level=${levelIndex}`;
    if (kind === "final") return `final.html?topic=${topicId}&level=${levelIndex}`;
    return `lesson.html?topic=${topicId}&level=${levelIndex}`;
  },

  levelKind(index, total) {
    if (index === total) return "final";
    if (index === total - 1) return "dialogue";
    return "lesson";
  },

  levelKey(topicId, index) {
    return `${topicId}-${index}`;
  },

  buildDefaultPath(topicIds) {
    const path = {};
    topicIds.forEach((topicId, tIndex) => {
      for (let i = 1; i <= this.LEVELS_PER_TOPIC; i++) {
        const key = this.levelKey(topicId, i);
        if (tIndex === 0 && i === 1) path[key] = "current";
        else path[key] = "locked";
      }
    });
    return path;
  },

  getPath() {
    const user = window.LexiStore?.currentUser?.();
    if (user?.path) return window.LexiStore.mergePath(user.path);
    // Без входа тренажёр закрыт — гостевой путь не показываем
    const topics = window.LexiTheory?.topics?.map((t) => t.id) || [];
    return this.buildDefaultPath(topics);
  },

  getStatus(topicId, index) {
    const path = this.getPath();
    return path[this.levelKey(topicId, index)] || "locked";
  },

  /** Тема с уровнем current; иначе последняя с прогрессом. */
  getCurrentTopicId() {
    const units = this.getUnits();
    const withCurrent = units.find((u) => u.levels.some((l) => l.status === "current"));
    if (withCurrent) return withCurrent.id;
    let lastDone = null;
    units.forEach((u) => {
      if (u.levels.some((l) => l.status === "done")) lastDone = u.id;
    });
    return lastDone || units[0]?.id || null;
  },

  getUnits() {
    const topics = window.LexiTheory?.topics || [];
    return topics.map((topic) => {
      const levels = [];
      for (let i = 1; i <= this.LEVELS_PER_TOPIC; i++) {
        const kind = this.levelKind(i, this.LEVELS_PER_TOPIC);
        const status = this.getStatus(topic.id, i);
        levels.push({
          index: i,
          key: this.levelKey(topic.id, i),
          kind,
          status,
          label: kind === "final" ? "★" : String(i),
          href: this.lessonHref(topic.id, i, kind),
        });
      }
      return {
        id: topic.id,
        title: topic.title,
        short: topic.short,
        color: topic.color || { main: "#12a88f", deep: "#0b7d6a", soft: "#d4f4ec" },
        theoryHref: `../theory/topic.html?id=${topic.id}`,
        levels,
      };
    });
  },
};
