/**
 * Пул заданий для «Как на контрольной» из прогресса тренажёров.
 * Кнопка на практике — только если доступно ≥ MIN заданий.
 */
window.LexiExamPool = {
  MIN: 5,

  LEVELS: [
    {
      id: "beginner",
      title: "Для начинающих",
      desc: "Простые слова и задания с пройденных первых уровней",
      count: 8,
      minutes: 6,
    },
    {
      id: "medium",
      title: "Средний",
      desc: "Смесь ошибок, слов на повторение и теории",
      count: 10,
      minutes: 8,
    },
    {
      id: "hard",
      title: "Сложный",
      desc: "Сложнее формулировки, продвинутые слова и темы",
      count: 12,
      minutes: 10,
    },
    {
      id: "review",
      title: "Повторение",
      desc: "Только ошибки и слова из «Повторить»",
      count: 10,
      minutes: 8,
    },
  ],

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  dedupe(list) {
    const seen = new Set();
    const out = [];
    list.forEach((item) => {
      if (!item?.id || seen.has(item.id)) return;
      seen.add(item.id);
      out.push(item);
    });
    return out;
  },

  getDonePathKeys() {
    const user = window.LexiStore?.currentUser?.();
    const path = LexiStore.mergePath?.(
      user?.path || LexiStore.getGuestPath?.() || LexiStore.progressDefaults?.().path || {}
    );
    return Object.keys(path || {}).filter((k) => path[k] === "done");
  },

  getLessonsDone() {
    const user = window.LexiStore?.currentUser?.();
    if (user) return Number(user.lessonsDone) || 0;
    return Number(LexiStore.getGuestStats?.()?.lessonsDone) || 0;
  },

  /** Ошибки → задания контрольной */
  fromMistakes() {
    const list = (LexiStore.getMistakes?.() || []).filter((m) => m.raw?.type || m.type);
    return list
      .map((m, i) => {
        const raw = m.raw || {};
        const type = m.type || raw.type || "";
        const base = {
          id: `m-${m.id || i}`,
          origin: "mistakes",
          difficulty: "review",
          topicId: m.topicId || "",
        };

        if (type === "type-word" || type === "translate" || type === "compose-en" || type === "listen-translate") {
          // chip-задания в контрольную как набор слов неудобны — пропускаем, если нет простого ответа-строки
          const answer = raw.answer || raw.expected || raw.target;
          const question = raw.source || raw.prompt || m.prompt;
          if (!answer || !question) return null;
          if (Array.isArray(answer)) {
            return {
              ...base,
              kind: "type",
              prompt: type === "compose-en" ? "Напиши предложение на английском" : "Напиши перевод",
              question: String(question),
              answer: answer.join(" "),
            };
          }
          return {
            ...base,
            kind: "type",
            prompt: "Напиши на английском",
            question: String(question),
            answer,
          };
        }

        if (type === "type-blank" || type === "story-blank") {
          const answer = raw.answer;
          if (!answer) return null;
          const question = `${raw.before || ""}______${raw.after || ""}` || raw.sentence || m.prompt;
          return {
            ...base,
            kind: "type",
            prompt: "Впиши слово",
            question: String(question),
            answer,
          };
        }

        if (type === "true-false" || (type === "story-quiz" && typeof raw.answer === "boolean")) {
          if (typeof raw.answer !== "boolean") return null;
          return {
            ...base,
            kind: "true-false",
            prompt: "Верно или нет?",
            question: raw.statement || raw.question || m.prompt || "",
            answer: raw.answer,
          };
        }

        if (
          ["meaning", "odd-one", "pattern", "spot-error", "story-quiz"].includes(type) &&
          Array.isArray(raw.options) &&
          raw.answer != null
        ) {
          return {
            ...base,
            kind: "choice",
            prompt:
              type === "odd-one"
                ? "Что лишнее?"
                : type === "pattern"
                  ? "Заполни пропуск"
                  : "Выбери ответ",
            question: raw.sentence || raw.question || raw.hint || m.prompt || "",
            options: raw.options,
            answer: raw.answer,
          };
        }

        // запасной вариант: перевод из preview
        if (raw.word && raw.translation) {
          return {
            ...base,
            kind: "type",
            prompt: "Напиши перевод на английский",
            question: raw.translation,
            answer: raw.word,
          };
        }
        return null;
      })
      .filter(Boolean);
  },

  fromReviewWords() {
    return (LexiStore.getReviewWords?.() || [])
      .filter((w) => w.word && w.translation)
      .map((w, i) => ({
        id: `rw-${String(w.word).toLowerCase()}-${i}`,
        origin: "review",
        difficulty: "beginner",
        kind: "type",
        prompt: "Напиши перевод на английский",
        question: w.translation,
        answer: w.word,
      }));
  },

  fromVocabKnown() {
    const packs = window.LexiVocabPacks?.levels || [];
    const out = [];
    packs.forEach((level) => {
      const known = new Set(LexiStore.getVocabKnown?.(level.id) || []);
      const hard = ["hard", "diplomacy"].includes(level.id);
      level.words.forEach((w) => {
        if (!known.has(String(w.en).toLowerCase())) return;
        out.push({
          id: `vk-${level.id}-${String(w.en).toLowerCase()}`,
          origin: "vocab",
          difficulty: hard ? "hard" : level.id === "basic" || level.id === "school" ? "beginner" : "medium",
          kind: "type",
          prompt: "Напиши перевод на английский",
          question: w.ru,
          answer: w.en,
        });
      });
    });
    return out;
  },

  fromAudioProgress() {
    const sounds = window.LexiAudioQuiz?.sounds || [];
    const out = [];
    sounds.forEach((sound) => {
      const { attempts } = LexiStore.getAudioSoundStats?.(sound.id) || { attempts: 0 };
      if (!attempts) return;
      (sound.items || []).forEach((item, i) => {
        out.push({
          id: `au-${sound.id}-${i}-${item.answer}`,
          origin: "audio",
          difficulty: "medium",
          soundId: sound.id,
          kind: "choice",
          prompt: `На слух · звук ${sound.ipa} — выбери написание`,
          question: item.ru ? `(${item.ru})` : "Как пишется услышанное слово?",
          options: [item.answer, item.decoy],
          answer: item.answer,
          speak: item.answer,
        });
      });
    });
    return out;
  },

  fromTheoryProgress() {
    const quizzes = window.LexiTheoryQuiz?.quizzes || {};
    const out = [];
    Object.keys(quizzes).forEach((topicId) => {
      const result = LexiStore.getTheoryQuizResult?.(topicId);
      if (!result) return;
      const list = quizzes[topicId] || [];
      list.forEach((q, i) => {
        out.push({
          id: `th-${topicId}-${i}`,
          origin: "theory",
          difficulty: result.status === "failed" ? "review" : "medium",
          topicId,
          kind: q.kind === "true-false" ? "true-false" : "choice",
          prompt: q.kind === "true-false" ? "Верно или нет?" : "Выбери ответ",
          question: q.question,
          options: q.options,
          answer: q.answer,
        });
      });
    });
    return out;
  },

  fromDoneLessons() {
    const packs = window.LexiLessons?.packs || {};
    const doneKeys = this.getDonePathKeys();
    // Дефолт нового аккаунта: только present-simple-1 = done — это не считаем прогрессом
    const seedOnly = doneKeys.length === 1 && doneKeys[0] === "present-simple-1";
    if (seedOnly && this.getLessonsDone() <= 0) return [];
    if (!doneKeys.length) return [];
    const out = [];

    doneKeys.forEach((key) => {
      const m = key.match(/^(.+)-(\d+)$/);
      if (!m) return;
      const topicId = m[1];
      const levelNum = Number(m[2]);
      const pack = packs[topicId];
      if (!pack) return;
      const bucket = pack.levels?.[String(levelNum)];
      if (!bucket) return;

      let difficulty = "beginner";
      if (levelNum >= 4) difficulty = "hard";
      else if (levelNum >= 2) difficulty = "medium";

      (bucket.typeWord || []).forEach((ex, i) => {
        out.push({
          id: `tw-${key}-${i}-${ex.source}`,
          origin: "path",
          difficulty,
          topicId,
          kind: "type",
          prompt: ex.prompt || "Напиши перевод на английский",
          question: ex.source,
          answer: ex.answer,
        });
      });
      (bucket.typeBlank || []).forEach((ex, i) => {
        out.push({
          id: `tb-${key}-${i}`,
          origin: "path",
          difficulty,
          topicId,
          kind: "type",
          prompt: ex.prompt || "Впиши слово",
          question: `${ex.before || ""}______${ex.after || ""}`,
          answer: ex.answer,
        });
      });
      (bucket.oddOne || []).forEach((ex, i) => {
        out.push({
          id: `oo-${key}-${i}`,
          origin: "path",
          difficulty,
          topicId,
          kind: "choice",
          prompt: ex.prompt || "Что лишнее?",
          question: ex.hint || "",
          options: ex.options,
          answer: ex.answer,
        });
      });
      (bucket.meaning || []).forEach((ex, i) => {
        out.push({
          id: `mn-${key}-${i}`,
          origin: "path",
          difficulty,
          topicId,
          kind: "choice",
          prompt: ex.prompt || "Выбери значение",
          question: ex.sentence || "",
          options: ex.options,
          answer: ex.answer,
        });
      });
      (bucket.trueFalse || []).forEach((ex, i) => {
        out.push({
          id: `tf-${key}-${i}`,
          origin: "path",
          difficulty,
          topicId,
          kind: "true-false",
          prompt: "Верно или нет?",
          question: ex.statement || ex.question || "",
          answer: ex.answer,
        });
      });
    });
    return out;
  },

  /** Весь доступный материал пользователя */
  collectAll() {
    return this.dedupe([
      ...this.fromMistakes(),
      ...this.fromReviewWords(),
      ...this.fromVocabKnown(),
      ...this.fromAudioProgress(),
      ...this.fromTheoryProgress(),
      ...this.fromDoneLessons(),
    ]);
  },

  getUnlockCount() {
    return this.collectAll().length;
  },

  isUnlocked() {
    return this.getUnlockCount() >= this.MIN;
  },

  filterForLevel(levelId, all) {
    const list = all || this.collectAll();
    if (levelId === "review") {
      return list.filter(
        (q) =>
          q.origin === "mistakes" ||
          q.origin === "review" ||
          q.difficulty === "review" ||
          (q.origin === "theory" && q.difficulty === "review")
      );
    }
    if (levelId === "beginner") {
      return list.filter(
        (q) =>
          q.difficulty === "beginner" ||
          q.origin === "review" ||
          (q.origin === "vocab" && q.difficulty === "beginner") ||
          (q.origin === "path" && q.difficulty === "beginner")
      );
    }
    if (levelId === "hard") {
      const hard = list.filter((q) => q.difficulty === "hard" || q.origin === "theory" || q.origin === "audio");
      // если мало сложных — добираем средними
      if (hard.length >= this.MIN) return hard;
      return this.dedupe([...hard, ...list.filter((q) => q.difficulty === "medium")]);
    }
    // medium — всё, с приоритетом смеси
    return list;
  },

  pickForLevel(levelId, count) {
    const level = this.LEVELS.find((l) => l.id === levelId) || this.LEVELS[1];
    const n = Math.max(this.MIN, Number(count) || level.count);
    const filtered = this.filterForLevel(levelId);
    if (filtered.length < this.MIN) {
      // добор из общего пула, если уровень узкий
      const all = this.collectAll();
      return this.shuffle(this.dedupe([...filtered, ...all])).slice(0, Math.min(n, all.length));
    }
    return this.shuffle(filtered).slice(0, Math.min(n, filtered.length));
  },

  levelAvailability(levelId) {
    const filtered = this.filterForLevel(levelId);
    const count = filtered.length;
    if (levelId === "review" || levelId === "beginner") {
      return { count, ready: count >= this.MIN };
    }
    // medium / hard могут добирать из общего пула при старте
    const total = this.getUnlockCount();
    return { count, ready: total >= this.MIN };
  },
};
