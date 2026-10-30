/**
 * Аккаунты и прогресс в localStorage.
 * Демо: admin / 1234 — пустой; demo / 1234 — с прогрессом.
 * Тренажёр — только после входа; теория доступна без аккаунта.
 */
window.LexiStore = {
  USERS_KEY: "lexi-users-v1",
  SESSION_KEY: "lexi-session-v1",
  /** Версия заготовки demo — при смене перезапишет демо-аккаунт. */
  DEMO_FILLED_VERSION: 1,
  /** Версия пустого admin — сброс прогресса демо-аккаунта. */
  ADMIN_SEED_VERSION: 2,

  progressDefaults() {
    const topicIds = [
      "present-simple",
      "to-be",
      "there-is-are",
      "present-continuous",
      "past-simple",
      "articles",
      "can",
      "school-words",
    ];
    const path = {};
    topicIds.forEach((topicId, tIndex) => {
      for (let i = 1; i <= 5; i++) {
        const key = `${topicId}-${i}`;
        // Новый аккаунт: только первый уровень открыт, ничего не пройдено
        if (tIndex === 0 && i === 1) path[key] = "current";
        else path[key] = "locked";
      }
    });
    return {
      xp: 0,
      streak: 0,
      lessonsDone: 0,
      hints: 0,
      accuracy: null,
      mistakes: [],
      learned: [],
      /** Личный словарь: [{ word, translation, status, source, at }] */
      dictionary: [],
      theoryQuiz: {},
      /** { [levelId]: string[] } — известные EN-слова по уровню изучения */
      vocabStudy: {},
      /** { [soundId]: { correct: number, attempts: number } } — прогресс «На слух» */
      audioSounds: {},
      /** { [levelId]: { best, attempts, lastPercent, lastCorrect, lastTotal, at } } */
      examProgress: {},
      path,
    };
  },

  /** Пресеты аватаров-собак (id файла без .svg) */
  DOG_AVATARS: [
    { id: "08_happy", label: "Радостный" },
    { id: "03_winking", label: "Подмигивает" },
    { id: "02_in_love", label: "Влюблённый" },
    { id: "05_detective", label: "Детектив" },
    { id: "07_shocked", label: "Удивлённый" },
    { id: "04_sleeping", label: "Спит" },
    { id: "01_angry", label: "Злой" },
    { id: "06_crying", label: "Грустный" },
    { id: "09_disgusted", label: "Фу!" },
  ],

  DEFAULT_AVATAR: { kind: "dog", id: "08_happy" },

  dogAvatarSrc(id, base = "../assets") {
    const safe = String(id || "08_happy").replace(/[^\w-]/g, "");
    return `${base}/${safe}.svg`;
  },

  normalizeAvatar(raw) {
    if (!raw || typeof raw !== "object") return { ...this.DEFAULT_AVATAR };
    if (raw.kind === "upload" && typeof raw.src === "string" && raw.src.startsWith("data:image/")) {
      return { kind: "upload", src: raw.src };
    }
    if (raw.kind === "dog" && raw.id) {
      return { kind: "dog", id: String(raw.id).replace(/[^\w-]/g, "") || "08_happy" };
    }
    return { ...this.DEFAULT_AVATAR };
  },

  avatarSrc(avatar, base = "../assets") {
    const a = this.normalizeAvatar(avatar);
    if (a.kind === "upload") return a.src;
    return this.dogAvatarSrc(a.id, base);
  },

  userDefaults(extra = {}) {
    return {
      login: "",
      password: "",
      name: "",
      age: "",
      grade: "",
      level: "A1",
      avatar: { ...this.DEFAULT_AVATAR },
      ...this.progressDefaults(),
      ...extra,
    };
  },

  /** Заполненный демо-путь: 2 темы целиком + часть третьей. */
  buildDemoPath() {
    const topics = [
      "present-simple",
      "to-be",
      "there-is-are",
      "present-continuous",
      "past-simple",
      "articles",
      "can",
      "school-words",
    ];
    const path = {};
    topics.forEach((topicId) => {
      for (let i = 1; i <= 5; i++) path[`${topicId}-${i}`] = "locked";
    });
    // Present Simple + To be — полностью
    ["present-simple", "to-be"].forEach((topicId) => {
      for (let i = 1; i <= 5; i++) path[`${topicId}-${i}`] = "done";
    });
    // There is/are — 1–3 пройдены, 4 текущий
    path["there-is-are-1"] = "done";
    path["there-is-are-2"] = "done";
    path["there-is-are-3"] = "done";
    path["there-is-are-4"] = "current";
    return path;
  },

  buildFilledDemoUser() {
    const at = "2026-10-20T10:00:00.000Z";
    const at2 = "2026-10-22T15:30:00.000Z";
    const at3 = "2026-10-28T09:12:00.000Z";

    const rawAlways = {
      type: "type-word",
      prompt: "Напиши перевод на английский",
      source: "всегда",
      answer: "always",
    };
    const rawDoes = {
      type: "meaning",
      label: "грамматика",
      prompt: "Зачем здесь «Does»?",
      sentence: "Does she watch TV?",
      highlight: "Does",
      options: ["чтобы спросить про he/she/it", "это значит «делает спорт»", "это прошедшее время"],
      answer: "чтобы спросить про he/she/it",
    };
    const rawThere = {
      type: "type-blank",
      prompt: "Впиши слово по смыслу",
      before: "There ",
      after: " a book on the table.",
      answer: "is",
    };

    return this.userDefaults({
      login: "demo",
      password: "1234",
      name: "Лера",
      age: "13",
      grade: "7",
      level: "A2",
      avatar: { kind: "dog", id: "03_winking" },
      demoSeedVersion: this.DEMO_FILLED_VERSION,
      xp: 740,
      streak: 6,
      lessonsDone: 13,
      hints: 5,
      accuracy: 87,
      path: this.buildDemoPath(),
      learned: [
        { id: "w-always", word: "always", translation: "всегда", at, repeated: true, repeatedAt: at2 },
        { id: "w-usually", word: "usually", translation: "обычно", at, repeated: true, repeatedAt: at3 },
        { id: "w-sometimes", word: "sometimes", translation: "иногда", at: at2 },
        { id: "w-never", word: "never", translation: "никогда", at: at2 },
        { id: "w-friend", word: "friend", translation: "друг", at: at3 },
        { id: "w-homework", word: "homework", translation: "домашнее задание", at: at3 },
      ],
      dictionary: [
        { id: "d-always", word: "always", translation: "всегда", status: "ok", source: "type-word", at, firstAt: at },
        { id: "d-usually", word: "usually", translation: "обычно", status: "ok", source: "type-word", at, firstAt: at },
        { id: "d-like", word: "like", translation: "любить", status: "ok", source: "type-word", at: at2, firstAt: at2 },
        { id: "d-play", word: "play", translation: "играть", status: "ok", source: "match", at: at2, firstAt: at2 },
        { id: "d-read", word: "read", translation: "читать", status: "ok", source: "match", at: at2, firstAt: at2 },
        { id: "d-hello", word: "hello", translation: "привет", status: "ok", source: "vocab", at: at3, firstAt: at3 },
        { id: "d-please", word: "please", translation: "пожалуйста", status: "ok", source: "vocab", at: at3, firstAt: at3 },
        { id: "d-teacher", word: "teacher", translation: "учитель", status: "ok", source: "vocab", at: at3, firstAt: at3 },
        { id: "d-because", word: "because", translation: "потому что", status: "failed", source: "dictionary-quiz", at: at3, firstAt: at2 },
        { id: "d-already", word: "already", translation: "уже", status: "failed", source: "dictionary-quiz", at: at3, firstAt: at2 },
        { id: "d-there", word: "there", translation: "там / есть", status: "ok", source: "type-word", at: at3, firstAt: at3 },
        { id: "d-school", word: "school", translation: "школа", status: "ok", source: "review", at: at3, firstAt: at3 },
      ],
      mistakes: [
        {
          id: "m-demo-always",
          topicId: "present-simple",
          level: "2",
          type: "type-word",
          prompt: "Напиши перевод на английский",
          at: at3,
          raw: rawAlways,
        },
        {
          id: "m-demo-does",
          topicId: "present-simple",
          level: "3",
          type: "meaning",
          prompt: "Зачем здесь «Does»?",
          at: at3,
          raw: rawDoes,
        },
        {
          id: "m-demo-there",
          topicId: "there-is-are",
          level: "2",
          type: "type-blank",
          prompt: "Впиши слово по смыслу",
          at: at3,
          raw: rawThere,
        },
        {
          id: "dict-because",
          topicId: "dictionary",
          level: "",
          type: "type-word",
          prompt: "because",
          at: at3,
          raw: {
            type: "type-word",
            prompt: "Напиши перевод на английский",
            source: "потому что",
            answer: "because",
            sectionLabel: "словарь",
          },
        },
        {
          id: "dict-already",
          topicId: "dictionary",
          level: "",
          type: "type-word",
          prompt: "already",
          at: at3,
          raw: {
            type: "type-word",
            prompt: "Напиши перевод на английский",
            source: "уже",
            answer: "already",
            sectionLabel: "словарь",
          },
        },
      ],
      theoryQuiz: {
        "present-simple": {
          status: "passed",
          percent: 90,
          correct: 9,
          total: 10,
          at,
        },
        "to-be": {
          status: "passed",
          percent: 80,
          correct: 8,
          total: 10,
          at: at2,
        },
        "there-is-are": {
          status: "failed",
          percent: 50,
          correct: 5,
          total: 10,
          at: at3,
        },
      },
      vocabStudy: {
        basic: ["hello", "goodbye", "please", "thank you", "yes", "no", "friend", "home", "water"],
        school: ["homework", "lesson", "teacher", "student"],
      },
      audioSounds: {
        ae: { correct: 6, attempts: 8 },
        th: { correct: 4, attempts: 7 },
        sh: { correct: 8, attempts: 9 },
      },
      examProgress: {
        beginner: {
          best: 88,
          attempts: 2,
          lastPercent: 88,
          lastCorrect: 7,
          lastTotal: 8,
          at: at3,
        },
      },
    });
  },

  seedDemo() {
    const users = this.getUsers();
    let changed = false;
    if (!users.admin || users.admin.adminSeedVersion !== this.ADMIN_SEED_VERSION) {
      users.admin = this.userDefaults({
        login: "admin",
        password: "1234",
        name: "Админ",
        age: "12",
        grade: "6",
        level: "A1",
        adminSeedVersion: this.ADMIN_SEED_VERSION,
      });
      changed = true;
    }
    if (!users.demo || users.demo.demoSeedVersion !== this.DEMO_FILLED_VERSION) {
      users.demo = this.buildFilledDemoUser();
      changed = true;
    }
    if (changed) this.saveUsers(users);
  },

  isLoggedIn() {
    const login = this.getSessionLogin();
    if (!login) return false;
    const users = this.getUsers();
    return Boolean(users[login]);
  },

  /** URL возврата в тренажёр после входа (относительно profile/). */
  trainerReturnUrl() {
    const path = String(location.pathname || "").replace(/\\/g, "/");
    const file = path.split("/").pop() || "index.html";
    return `../trainer/${file}${location.search || ""}`;
  },

  profileAuthUrl(nextFromProfile) {
    const next = nextFromProfile || "../trainer/index.html";
    const path = String(location.pathname || "").replace(/\\/g, "/");
    const q = `auth=1&next=${encodeURIComponent(next)}`;
    if (path.includes("/trainer/") || path.includes("/theory/") || path.includes("/profile/")) {
      return `../profile/index.html?${q}`;
    }
    return `profile/index.html?${q}`;
  },

  /**
   * Тренажёр только для вошедших. Гостей отправляем на вход/регистрацию.
   * @returns {boolean} true — можно оставаться на странице
   */
  requireTrainerAuth() {
    this.seedDemo();
    if (this.isLoggedIn()) return true;
    const next = this.trainerReturnUrl();
    location.replace(`../profile/index.html?auth=1&next=${encodeURIComponent(next)}`);
    return false;
  },

  getUsers() {
    try {
      const raw = localStorage.getItem(this.USERS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  getSessionLogin() {
    return localStorage.getItem(this.SESSION_KEY);
  },

  setSession(login) {
    if (login) localStorage.setItem(this.SESSION_KEY, login);
    else localStorage.removeItem(this.SESSION_KEY);
  },

  mergePath(path = {}) {
    const defaults = this.progressDefaults().path;
    const merged = { ...defaults };
    Object.keys(defaults).forEach((key) => {
      if (path[key]) merged[key] = path[key];
    });
    return merged;
  },

  currentUser() {
    this.seedDemo();
    const login = this.getSessionLogin();
    if (!login) return null;
    const users = this.getUsers();
    if (!users[login]) return null;
    const user = { ...this.userDefaults(), ...users[login] };
    user.path = this.mergePath(user.path);
    user.avatar = this.normalizeAvatar(user.avatar);
    return user;
  },

  saveUser(user) {
    const users = this.getUsers();
    users[user.login] = user;
    this.saveUsers(users);
  },

  login(login, password) {
    this.seedDemo();
    const key = String(login || "").trim().toLowerCase();
    const users = this.getUsers();
    const user = users[key];
    if (!user || user.password !== String(password || "")) {
      return { ok: false, error: "Неверный логин или пароль" };
    }
    this.setSession(key);
    return { ok: true, user };
  },

  register({ login, password, name, age, grade, level }) {
    this.seedDemo();
    const key = String(login || "").trim().toLowerCase();
    if (!key || !password || !name || !age || !grade || !level) {
      return { ok: false, error: "Заполни все поля" };
    }
    if (key.length < 3) {
      return { ok: false, error: "Логин — минимум 3 символа" };
    }
    if (String(password).length < 4) {
      return { ok: false, error: "Пароль — минимум 4 символа" };
    }

    const users = this.getUsers();
    if (users[key]) {
      return { ok: false, error: "Такой логин уже занят" };
    }

    const user = this.userDefaults({
      login: key,
      password: String(password),
      name: String(name).trim(),
      age: String(age).trim(),
      grade: String(grade).trim(),
      level: String(level),
    });
    users[key] = user;
    this.saveUsers(users);
    this.setSession(key);
    return { ok: true, user };
  },

  updateProfile(fields) {
    const user = this.currentUser();
    if (!user) return { ok: false, error: "Нужно войти" };
    const next = {
      ...user,
      name: String(fields.name ?? user.name).trim(),
      age: String(fields.age ?? user.age).trim(),
      grade: String(fields.grade ?? user.grade).trim(),
      level: String(fields.level ?? user.level),
      avatar: fields.avatar !== undefined ? this.normalizeAvatar(fields.avatar) : this.normalizeAvatar(user.avatar),
    };
    if (!next.name || !next.age || !next.grade || !next.level) {
      return { ok: false, error: "Заполни все поля" };
    }
    this.saveUser(next);
    return { ok: true, user: next };
  },

  setAvatar(avatar) {
    const user = this.currentUser();
    if (!user) return { ok: false, error: "Нужно войти" };
    const next = {
      ...user,
      avatar: this.normalizeAvatar(avatar),
    };
    this.saveUser(next);
    return { ok: true, user: next };
  },

  logout() {
    this.setSession(null);
  },

  GUEST_PATH_KEY: "lexi-guest-path-v1",
  GUEST_STATS_KEY: "lexi-guest-stats-v1",

  getGuestPath() {
    try {
      const raw = localStorage.getItem(this.GUEST_PATH_KEY);
      if (!raw) return null;
      return this.mergePath(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  getGuestStats() {
    try {
      return JSON.parse(localStorage.getItem(this.GUEST_STATS_KEY) || "null") || {
        xp: 0,
        hints: 0,
        mistakes: [],
        learned: [],
        dictionary: [],
        theoryQuiz: {},
        vocabStudy: {},
        audioSounds: {},
        examProgress: {},
      };
    } catch {
      return {
        xp: 0,
        hints: 0,
        mistakes: [],
        learned: [],
        dictionary: [],
        theoryQuiz: {},
        vocabStudy: {},
        audioSounds: {},
        examProgress: {},
      };
    }
  },

  saveGuestStats(stats) {
    localStorage.setItem(this.GUEST_STATS_KEY, JSON.stringify(stats));
  },

  addXp(amount) {
    const n = Number(amount) || 0;
    if (!n) return 0;
    const user = this.currentUser();
    if (user) {
      user.xp = (user.xp || 0) + n;
      this.saveUser(user);
      return user.xp;
    }
    const stats = this.getGuestStats();
    stats.xp = (stats.xp || 0) + n;
    this.saveGuestStats(stats);
    return stats.xp;
  },

  getXp() {
    const user = this.currentUser();
    if (user) return Number(user.xp) || 0;
    return Number(this.getGuestStats().xp) || 0;
  },

  getHints() {
    const user = this.currentUser();
    if (user) return Math.max(0, Number(user.hints) || 0);
    return Math.max(0, Number(this.getGuestStats().hints) || 0);
  },

  /** Пакеты подсказок за XP (опыт с уровней). */
  HINT_PACKS: [
    { id: "h1", hints: 1, xp: 40, title: "1 подсказка" },
    { id: "h3", hints: 3, xp: 100, title: "3 подсказки" },
    { id: "h5", hints: 5, xp: 150, title: "5 подсказок" },
    { id: "h10", hints: 10, xp: 280, title: "10 подсказок" },
  ],

  /**
   * Потратить одну подсказку (только из уроков уровней).
   * @returns {{ ok: boolean, error?: string, hints?: number }}
   */
  spendHint() {
    const user = this.currentUser();
    if (user) {
      const n = Math.max(0, Number(user.hints) || 0);
      if (n < 1) return { ok: false, error: "Нет подсказок", hints: 0 };
      user.hints = n - 1;
      this.saveUser(user);
      return { ok: true, hints: user.hints };
    }
    const stats = this.getGuestStats();
    const n = Math.max(0, Number(stats.hints) || 0);
    if (n < 1) return { ok: false, error: "Нет подсказок", hints: 0 };
    stats.hints = n - 1;
    this.saveGuestStats(stats);
    return { ok: true, hints: stats.hints };
  },

  /**
   * Купить пакет подсказок за XP.
   * @returns {{ ok: boolean, error?: string, hints?: number, xp?: number }}
   */
  buyHintPack(packId) {
    const pack = (this.HINT_PACKS || []).find((p) => p.id === packId);
    if (!pack) return { ok: false, error: "Пакет не найден" };
    const cost = Number(pack.xp) || 0;
    const gain = Number(pack.hints) || 0;
    if (cost <= 0 || gain <= 0) return { ok: false, error: "Неверный пакет" };

    const user = this.currentUser();
    if (user) {
      const xp = Number(user.xp) || 0;
      if (xp < cost) return { ok: false, error: `Нужно ${cost} XP, у тебя ${xp}` };
      user.xp = xp - cost;
      user.hints = (Number(user.hints) || 0) + gain;
      this.saveUser(user);
      return { ok: true, hints: user.hints, xp: user.xp };
    }
    const stats = this.getGuestStats();
    const xp = Number(stats.xp) || 0;
    if (xp < cost) return { ok: false, error: `Нужно ${cost} XP, у тебя ${xp}` };
    stats.xp = xp - cost;
    stats.hints = (Number(stats.hints) || 0) + gain;
    this.saveGuestStats(stats);
    return { ok: true, hints: stats.hints, xp: stats.xp };
  },

  /**
   * Заглушка под раздел «Ошибки» в профиле.
   * Позже сюда подключим повтор этих заданий.
   */
  addMistake(entry) {
    const raw = entry.raw && typeof entry.raw === "object" ? { ...entry.raw } : null;
    if (raw) {
      delete raw.failCount;
      delete raw.isReview;
      delete raw.isMistakeReview;
    }
    const levelRaw = entry.level ?? raw?.level;
    const level =
      levelRaw === "final" || levelRaw === "dialogue" || levelRaw === "story"
        ? String(levelRaw)
        : levelRaw != null && String(levelRaw).trim() !== ""
          ? String(levelRaw)
          : "";
    const item = {
      id: entry.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      topicId: entry.topicId || "",
      level,
      type: entry.type || raw?.type || "",
      prompt: entry.prompt || raw?.prompt || "",
      summary: entry.summary || "",
      preview: entry.preview || "",
      at: new Date().toISOString(),
      raw,
    };
    const user = this.currentUser();
    if (user) {
      user.mistakes = Array.isArray(user.mistakes) ? user.mistakes : [];
      // не дублируем один и тот же тип+prompt
      user.mistakes = user.mistakes.filter(
        (m) => !(m.topicId === item.topicId && m.prompt === item.prompt && m.type === item.type)
      );
      user.mistakes.unshift(item);
      user.mistakes = user.mistakes.slice(0, 50);
      this.saveUser(user);
      return item;
    }
    const stats = this.getGuestStats();
    stats.mistakes = Array.isArray(stats.mistakes) ? stats.mistakes : [];
    stats.mistakes = stats.mistakes.filter(
      (m) => !(m.topicId === item.topicId && m.prompt === item.prompt && m.type === item.type)
    );
    stats.mistakes.unshift(item);
    stats.mistakes = stats.mistakes.slice(0, 50);
    this.saveGuestStats(stats);
    return item;
  },

  getMistakes(topicId) {
    const user = this.currentUser();
    const list = user
      ? Array.isArray(user.mistakes)
        ? user.mistakes
        : []
      : this.getGuestStats().mistakes || [];
    if (!topicId) return list;
    return list.filter((m) => m.topicId === topicId || !m.topicId);
  },

  removeMistakeByPrompt(topicId, prompt, type) {
    const filterFn = (m) =>
      !(m.topicId === topicId && m.prompt === prompt && (!type || m.type === type));
    const user = this.currentUser();
    if (user) {
      user.mistakes = (user.mistakes || []).filter(filterFn);
      this.saveUser(user);
      return;
    }
    const stats = this.getGuestStats();
    stats.mistakes = (stats.mistakes || []).filter(filterFn);
    this.saveGuestStats(stats);
  },

  removeMistakeById(id) {
    if (!id) return;
    const filterFn = (m) => m.id !== id;
    const user = this.currentUser();
    if (user) {
      user.mistakes = (user.mistakes || []).filter(filterFn);
      this.saveUser(user);
      return;
    }
    const stats = this.getGuestStats();
    stats.mistakes = (stats.mistakes || []).filter(filterFn);
    this.saveGuestStats(stats);
  },

  /** Слова для раздела «Повторить» (word → translation). */
  getReviewWords() {
    const user = this.currentUser();
    const list = user
      ? Array.isArray(user.learned)
        ? user.learned
        : []
      : Array.isArray(this.getGuestStats().learned)
        ? this.getGuestStats().learned
        : [];
    return list;
  },

  addReviewWord({ word, translation }) {
    const en = String(word || "").trim();
    const ru = String(translation || "").trim();
    if (!en || !ru) return null;
    const item = {
      id: `w-${en.toLowerCase()}`,
      word: en,
      translation: ru,
      at: new Date().toISOString(),
    };
    const dedupe = (list) => {
      const next = (Array.isArray(list) ? list : []).filter(
        (w) => String(w.word || "").toLowerCase() !== en.toLowerCase()
      );
      next.unshift(item);
      return next.slice(0, 100);
    };
    const user = this.currentUser();
    if (user) {
      user.learned = dedupe(user.learned);
      this.saveUser(user);
      return item;
    }
    const stats = this.getGuestStats();
    stats.learned = dedupe(stats.learned);
    this.saveGuestStats(stats);
    return item;
  },

  hasReviewWord(word) {
    const key = String(word || "").toLowerCase();
    return this.getReviewWords().some((w) => String(w.word || "").toLowerCase() === key);
  },

  removeReviewWord(word) {
    const key = String(word || "").toLowerCase();
    const filterFn = (w) => String(w.word || "").toLowerCase() !== key;
    const user = this.currentUser();
    if (user) {
      user.learned = (user.learned || []).filter(filterFn);
      this.saveUser(user);
      return;
    }
    const stats = this.getGuestStats();
    stats.learned = (stats.learned || []).filter(filterFn);
    this.saveGuestStats(stats);
  },

  /** Пометить слово как успешно повторённое в тесте (зелёный статус в списке). */
  markReviewWordRepeated(word, ok = true) {
    const key = String(word || "").toLowerCase();
    if (!key) return;
    const patch = (list) =>
      (Array.isArray(list) ? list : []).map((w) => {
        if (String(w.word || "").toLowerCase() !== key) return w;
        if (ok) {
          return {
            ...w,
            repeated: true,
            repeatedAt: new Date().toISOString(),
          };
        }
        const next = { ...w, repeated: false };
        delete next.repeatedAt;
        return next;
      });
    const user = this.currentUser();
    if (user) {
      user.learned = patch(user.learned);
      this.saveUser(user);
      return;
    }
    const stats = this.getGuestStats();
    stats.learned = patch(stats.learned);
    this.saveGuestStats(stats);
  },

  removeRepeatedReviewWords() {
    const filterFn = (w) => !w?.repeated;
    const user = this.currentUser();
    if (user) {
      user.learned = (user.learned || []).filter(filterFn);
      this.saveUser(user);
      return;
    }
    const stats = this.getGuestStats();
    stats.learned = (stats.learned || []).filter(filterFn);
    this.saveGuestStats(stats);
  },

  /** Перенести повторённые из «Повторить» в личный словарь и убрать из списка. */
  moveRepeatedReviewToDictionary() {
    const repeated = (this.getReviewWords() || []).filter((w) => w?.repeated);
    repeated.forEach((w) => {
      this.addDictionaryWord({
        word: w.word,
        translation: w.translation,
        source: "review",
        status: "ok",
      });
    });
    this.removeRepeatedReviewWords();
    return repeated.length;
  },

  /** Личный словарь выученных слов. */
  getDictionary() {
    const user = this.currentUser();
    const list = user
      ? Array.isArray(user.dictionary)
        ? user.dictionary
        : []
      : Array.isArray(this.getGuestStats().dictionary)
        ? this.getGuestStats().dictionary
        : [];
    return list;
  },

  hasDictionaryWord(word) {
    const key = String(word || "").toLowerCase();
    return this.getDictionary().some((w) => String(w.word || "").toLowerCase() === key);
  },

  addDictionaryWord({ word, translation, source = "lesson", status } = {}) {
    const en = String(word || "").trim();
    const ru = String(translation || "").trim() || "—";
    if (!en) return null;
    const merge = (list) => {
      const prev = (Array.isArray(list) ? list : []).find(
        (w) => String(w.word || "").toLowerCase() === en.toLowerCase()
      );
      const rest = (Array.isArray(list) ? list : []).filter(
        (w) => String(w.word || "").toLowerCase() !== en.toLowerCase()
      );
      let nextStatus = "ok";
      if (status === "ok" || status === "failed") nextStatus = status;
      else if (prev?.status === "failed") nextStatus = "failed";
      const item = {
        id: `d-${en.toLowerCase()}`,
        word: en,
        translation: ru !== "—" ? ru : prev?.translation || "—",
        status: nextStatus,
        source: String(source || prev?.source || "lesson"),
        at: new Date().toISOString(),
        firstAt: prev?.firstAt || prev?.at || new Date().toISOString(),
      };
      rest.unshift(item);
      return rest.slice(0, 300);
    };
    const user = this.currentUser();
    let saved;
    if (user) {
      user.dictionary = merge(user.dictionary);
      this.saveUser(user);
      saved = user.dictionary[0];
    } else {
      const stats = this.getGuestStats();
      stats.dictionary = merge(stats.dictionary);
      this.saveGuestStats(stats);
      saved = stats.dictionary[0];
    }
    // если слово снова «ок» — убрать хвост из ошибок теста словаря
    if (saved?.status === "ok") {
      this.removeMistakeById(`dict-${en.toLowerCase()}`);
    }
    return saved;
  },

  markDictionaryStatus(word, status) {
    const key = String(word || "").toLowerCase();
    if (!key || (status !== "ok" && status !== "failed")) return;
    const patch = (list) =>
      (Array.isArray(list) ? list : []).map((w) => {
        if (String(w.word || "").toLowerCase() !== key) return w;
        return { ...w, status, at: new Date().toISOString() };
      });
    const user = this.currentUser();
    if (user) {
      user.dictionary = patch(user.dictionary);
      this.saveUser(user);
      return;
    }
    const stats = this.getGuestStats();
    stats.dictionary = patch(stats.dictionary);
    this.saveGuestStats(stats);
  },

  removeDictionaryWord(word) {
    const key = String(word || "").toLowerCase();
    const filterFn = (w) => String(w.word || "").toLowerCase() !== key;
    const user = this.currentUser();
    if (user) {
      user.dictionary = (user.dictionary || []).filter(filterFn);
      this.saveUser(user);
      return;
    }
    const stats = this.getGuestStats();
    stats.dictionary = (stats.dictionary || []).filter(filterFn);
    this.saveGuestStats(stats);
  },

  /** Слово из словаря снова в «Повторить». */
  moveDictionaryWordToReview(word) {
    const key = String(word || "").toLowerCase();
    const item = this.getDictionary().find((w) => String(w.word || "").toLowerCase() === key);
    if (!item) return null;
    return this.addReviewWord({ word: item.word, translation: item.translation || "—" });
  },

  getDictionaryStats() {
    const list = this.getDictionary();
    const failed = list.filter((w) => w.status === "failed").length;
    return { total: list.length, failed, ok: Math.max(0, list.length - failed) };
  },

  /** Прогресс изучения слов по уровням: { [levelId]: string[] } */
  getVocabStudyMap() {
    const user = this.currentUser();
    const map = user
      ? user.vocabStudy && typeof user.vocabStudy === "object"
        ? user.vocabStudy
        : {}
      : this.getGuestStats().vocabStudy && typeof this.getGuestStats().vocabStudy === "object"
        ? this.getGuestStats().vocabStudy
        : {};
    return map;
  },

  getVocabKnown(levelId) {
    const list = this.getVocabStudyMap()[levelId];
    return Array.isArray(list) ? list.map((w) => String(w).toLowerCase()) : [];
  },

  isVocabKnown(levelId, word) {
    const key = String(word || "")
      .trim()
      .toLowerCase();
    return this.getVocabKnown(levelId).includes(key);
  },

  markVocabKnown(levelId, word) {
    const id = String(levelId || "").trim();
    const key = String(word || "")
      .trim()
      .toLowerCase();
    if (!id || !key) return false;
    const apply = (map) => {
      const next = { ...(map && typeof map === "object" ? map : {}) };
      const set = new Set(
        (Array.isArray(next[id]) ? next[id] : []).map((w) => String(w).toLowerCase())
      );
      const before = set.size;
      set.add(key);
      next[id] = [...set];
      return { map: next, added: set.size > before };
    };
    const user = this.currentUser();
    if (user) {
      const { map, added } = apply(user.vocabStudy);
      user.vocabStudy = map;
      this.saveUser(user);
      return added;
    }
    const stats = this.getGuestStats();
    const { map, added } = apply(stats.vocabStudy);
    stats.vocabStudy = map;
    this.saveGuestStats(stats);
    return added;
  },

  /** Снять «знаю» — уровень снова неполный, пока слово не отметят снова. */
  unmarkVocabKnown(levelId, word) {
    const id = String(levelId || "").trim();
    const key = String(word || "")
      .trim()
      .toLowerCase();
    if (!id || !key) return false;
    const apply = (map) => {
      const next = { ...(map && typeof map === "object" ? map : {}) };
      const list = (Array.isArray(next[id]) ? next[id] : []).map((w) => String(w).toLowerCase());
      const filtered = list.filter((w) => w !== key);
      next[id] = filtered;
      return { map: next, removed: filtered.length < list.length };
    };
    const user = this.currentUser();
    if (user) {
      const { map, removed } = apply(user.vocabStudy);
      user.vocabStudy = map;
      this.saveUser(user);
      return removed;
    }
    const stats = this.getGuestStats();
    const { map, removed } = apply(stats.vocabStudy);
    stats.vocabStudy = map;
    this.saveGuestStats(stats);
    return removed;
  },

  getVocabProgress(levelId, totalWords) {
    const total = Math.max(0, Number(totalWords) || 0);
    const known = this.getVocabKnown(levelId).length;
    const capped = total ? Math.min(known, total) : known;
    const percent = total ? Math.min(100, Math.round((capped / total) * 100)) : 0;
    return { known: capped, total, percent };
  },

  /** Сбросить «знаю» по уровню — чтобы пройти тему заново. */
  clearVocabLevel(levelId) {
    const id = String(levelId || "").trim();
    if (!id) return false;
    const user = this.currentUser();
    if (user) {
      const map = { ...(user.vocabStudy && typeof user.vocabStudy === "object" ? user.vocabStudy : {}) };
      if (!Object.prototype.hasOwnProperty.call(map, id)) return false;
      delete map[id];
      user.vocabStudy = map;
      this.saveUser(user);
      return true;
    }
    const stats = this.getGuestStats();
    const map = { ...(stats.vocabStudy && typeof stats.vocabStudy === "object" ? stats.vocabStudy : {}) };
    if (!Object.prototype.hasOwnProperty.call(map, id)) return false;
    delete map[id];
    stats.vocabStudy = map;
    this.saveGuestStats(stats);
    return true;
  },

  getAudioSoundsMap() {
    const user = this.currentUser();
    const map = user
      ? user.audioSounds && typeof user.audioSounds === "object"
        ? user.audioSounds
        : {}
      : this.getGuestStats().audioSounds && typeof this.getGuestStats().audioSounds === "object"
        ? this.getGuestStats().audioSounds
        : {};
    return map;
  },

  getAudioSoundStats(soundId) {
    const raw = this.getAudioSoundsMap()[soundId];
    const correct = Math.max(0, Number(raw?.correct) || 0);
    const attempts = Math.max(0, Number(raw?.attempts) || 0);
    return { correct, attempts };
  },

  recordAudioAnswer(soundId, isCorrect) {
    const id = String(soundId || "").trim();
    if (!id) return null;
    const apply = (map) => {
      const next = { ...(map && typeof map === "object" ? map : {}) };
      const cur = next[id] || { correct: 0, attempts: 0 };
      const correct = Math.max(0, Number(cur.correct) || 0) + (isCorrect ? 1 : 0);
      const attempts = Math.max(0, Number(cur.attempts) || 0) + 1;
      next[id] = { correct, attempts };
      return next;
    };
    const user = this.currentUser();
    if (user) {
      user.audioSounds = apply(user.audioSounds);
      this.saveUser(user);
      return user.audioSounds[id];
    }
    const stats = this.getGuestStats();
    stats.audioSounds = apply(stats.audioSounds);
    this.saveGuestStats(stats);
    return stats.audioSounds[id];
  },

  getAudioSoundProgress(soundId, goal = 8) {
    const g = Math.max(1, Number(goal) || 8);
    const { correct, attempts } = this.getAudioSoundStats(soundId);
    const percent = Math.min(100, Math.round((correct / g) * 100));
    return { correct, attempts, goal: g, percent };
  },

  getExamProgressMap() {
    const user = this.currentUser();
    const map = user
      ? user.examProgress && typeof user.examProgress === "object"
        ? user.examProgress
        : {}
      : this.getGuestStats().examProgress && typeof this.getGuestStats().examProgress === "object"
        ? this.getGuestStats().examProgress
        : {};
    return map;
  },

  getExamLevelProgress(levelId) {
    const raw = this.getExamProgressMap()[levelId] || {};
    const best = Math.min(100, Math.max(0, Number(raw.best) || 0));
    const attempts = Math.max(0, Number(raw.attempts) || 0);
    const lastPercent = Math.min(100, Math.max(0, Number(raw.lastPercent) || 0));
    const lastCorrect = Math.max(0, Number(raw.lastCorrect) || 0);
    const lastTotal = Math.max(0, Number(raw.lastTotal) || 0);
    const passed = best >= 70;
    return {
      best,
      attempts,
      lastPercent,
      lastCorrect,
      lastTotal,
      at: raw.at || null,
      passed,
      percent: best,
    };
  },

  recordExamResult(levelId, { percent, correct, total } = {}) {
    const id = String(levelId || "").trim();
    if (!id) return null;
    const pct = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
    const write = (holder) => {
      const map = {
        ...(holder.examProgress && typeof holder.examProgress === "object" ? holder.examProgress : {}),
      };
      const prev = map[id] || {};
      map[id] = {
        best: Math.max(Number(prev.best) || 0, pct),
        attempts: (Number(prev.attempts) || 0) + 1,
        lastPercent: pct,
        lastCorrect: Math.max(0, Number(correct) || 0),
        lastTotal: Math.max(0, Number(total) || 0),
        at: new Date().toISOString(),
      };
      holder.examProgress = map;
      return map[id];
    };
    const user = this.currentUser();
    if (user) {
      const item = write(user);
      this.saveUser(user);
      return item;
    }
    const stats = this.getGuestStats();
    const item = write(stats);
    this.saveGuestStats(stats);
    return item;
  },

  getExamOverallProgress(levelIds = ["beginner", "medium", "hard", "review"]) {
    const ids = Array.isArray(levelIds) ? levelIds : [];
    let sum = 0;
    let passed = 0;
    ids.forEach((id) => {
      const p = this.getExamLevelProgress(id);
      sum += p.best;
      if (p.passed) passed += 1;
    });
    const total = ids.length || 1;
    return {
      passed,
      total,
      percent: Math.round(sum / total),
    };
  },

  /** Результат теста по теории: { status: 'passed'|'failed', percent, correct, total, at } */
  getTheoryQuizResult(topicId) {
    const user = this.currentUser();
    const map = user
      ? user.theoryQuiz && typeof user.theoryQuiz === "object"
        ? user.theoryQuiz
        : {}
      : this.getGuestStats().theoryQuiz && typeof this.getGuestStats().theoryQuiz === "object"
        ? this.getGuestStats().theoryQuiz
        : {};
    return map[topicId] || null;
  },

  setTheoryQuizResult(topicId, { passed, percent, correct, total }) {
    if (!topicId) return null;
    const item = {
      status: passed ? "passed" : "failed",
      percent: Number(percent) || 0,
      correct: Number(correct) || 0,
      total: Number(total) || 0,
      at: new Date().toISOString(),
    };
    const user = this.currentUser();
    if (user) {
      user.theoryQuiz = user.theoryQuiz && typeof user.theoryQuiz === "object" ? user.theoryQuiz : {};
      user.theoryQuiz[topicId] = item;
      this.saveUser(user);
      return item;
    }
    const stats = this.getGuestStats();
    stats.theoryQuiz = stats.theoryQuiz && typeof stats.theoryQuiz === "object" ? stats.theoryQuiz : {};
    stats.theoryQuiz[topicId] = item;
    this.saveGuestStats(stats);
    return item;
  },

  isLevelDone(topicId, levelIndex) {
    const key = `${topicId}-${Number(levelIndex)}`;
    const user = this.currentUser();
    const path = this.mergePath(
      user?.path || this.getGuestPath() || this.progressDefaults().path
    );
    return path[key] === "done";
  },

  /** Прогресс по всему курсу: доля уровней со статусом done. */
  getCourseProgress() {
    const user = this.currentUser();
    const path = this.mergePath(
      user?.path || this.getGuestPath() || this.progressDefaults().path
    );
    const keys = Object.keys(path);
    const total = keys.length || 1;
    const done = keys.filter((k) => path[k] === "done").length;
    return {
      done,
      total,
      percent: Math.round((done / total) * 100),
    };
  },

  /** Отметить уровень пройденным и открыть следующий (аккаунт или гость). */
  completeLevel(topicId, levelIndex, { xpGain = 0 } = {}) {
    const key = `${topicId}-${Number(levelIndex)}`;
    const allTopics = [
      "present-simple",
      "to-be",
      "there-is-are",
      "present-continuous",
      "past-simple",
      "articles",
      "can",
      "school-words",
    ];

    const apply = (path) => {
      const rebuilt = this.mergePath(path);
      rebuilt[key] = "done";

      const topicKeys = Object.keys(rebuilt)
        .filter((k) => k.startsWith(`${topicId}-`))
        .sort((a, b) => Number(a.split("-").pop()) - Number(b.split("-").pop()));

      let opened = false;
      topicKeys.forEach((k) => {
        if (rebuilt[k] === "done") return;
        rebuilt[k] = opened ? "locked" : "current";
        opened = true;
      });

      if (!opened) {
        const nextTopic = allTopics[allTopics.indexOf(topicId) + 1];
        if (nextTopic && rebuilt[`${nextTopic}-1`] !== "done") {
          rebuilt[`${nextTopic}-1`] = "current";
        }
      }
      return rebuilt;
    };

    const user = this.currentUser();
    if (user) {
      const alreadyDone = this.mergePath(user.path)[key] === "done";
      user.path = apply(user.path);
      if (!alreadyDone) {
        user.xp = (user.xp || 0) + xpGain;
        user.lessonsDone = (user.lessonsDone || 0) + 1;
      }
      this.saveUser(user);
      return user;
    }

    const currentPath = this.mergePath(this.getGuestPath() || this.progressDefaults().path);
    const alreadyDone = currentPath[key] === "done";
    const path = apply(currentPath);
    localStorage.setItem(this.GUEST_PATH_KEY, JSON.stringify(path));
    if (!alreadyDone) {
      const stats = this.getGuestStats();
      if (xpGain) stats.xp = (stats.xp || 0) + xpGain;
      stats.lessonsDone = (Number(stats.lessonsDone) || 0) + 1;
      this.saveGuestStats(stats);
    }
    return { path, guest: true, alreadyDone };
  },
};

/** Авто-защита страниц тренажёра: без входа — на профиль. */
(() => {
  try {
    const path = String(location.pathname || "").replace(/\\/g, "/");
    if (!/\/trainer\//.test(path)) return;
    window.LexiStore.requireTrainerAuth();
  } catch {
    /* ignore */
  }
})();
