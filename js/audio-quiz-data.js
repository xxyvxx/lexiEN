/**
 * Звуки английского + пары похожих написаний для тренажёра «На слух».
 */
window.LexiAudioQuiz = {
  /** Сколько верных ответов по звуку = 100% прогресса карточки */
  GOAL: 8,

  sounds: [
    {
      id: "ae",
      ipa: "æ",
      title: "a",
      example: "cat",
      group: "vowels",
      items: [
        { answer: "cat", decoy: "cut", ru: "кот" },
        { answer: "hat", decoy: "hot", ru: "шляпа" },
        { answer: "bad", decoy: "bed", ru: "плохой" },
        { answer: "man", decoy: "men", ru: "мужчина" },
        { answer: "bag", decoy: "bug", ru: "сумка" },
        { answer: "apple", decoy: "people", ru: "яблоко" },
      ],
    },
    {
      id: "e",
      ipa: "e",
      title: "e",
      example: "bed",
      group: "vowels",
      items: [
        { answer: "bed", decoy: "bad", ru: "кровать" },
        { answer: "pen", decoy: "pan", ru: "ручка" },
        { answer: "red", decoy: "rid", ru: "красный" },
        { answer: "leg", decoy: "log", ru: "нога" },
        { answer: "ten", decoy: "tin", ru: "десять" },
        { answer: "head", decoy: "had", ru: "голова" },
      ],
    },
    {
      id: "i-short",
      ipa: "ɪ",
      title: "i",
      example: "sit",
      group: "vowels",
      items: [
        { answer: "sit", decoy: "seat", ru: "сидеть" },
        { answer: "ship", decoy: "sheep", ru: "корабль" },
        { answer: "bit", decoy: "beat", ru: "кусочек" },
        { answer: "fill", decoy: "feel", ru: "наполнять" },
        { answer: "live", decoy: "leave", ru: "жить" },
        { answer: "rich", decoy: "reach", ru: "богатый" },
      ],
    },
    {
      id: "i-long",
      ipa: "iː",
      title: "ee",
      example: "sheep",
      group: "vowels",
      items: [
        { answer: "sheep", decoy: "ship", ru: "овца" },
        { answer: "seat", decoy: "sit", ru: "сиденье" },
        { answer: "feel", decoy: "fill", ru: "чувствовать" },
        { answer: "leave", decoy: "live", ru: "уходить" },
        { answer: "beach", decoy: "beech", ru: "пляж" },
        { answer: "cheap", decoy: "chip", ru: "дешёвый" },
      ],
    },
    {
      id: "uh",
      ipa: "ʌ",
      title: "u",
      example: "cup",
      group: "vowels",
      items: [
        { answer: "cup", decoy: "cap", ru: "чашка" },
        { answer: "cut", decoy: "cat", ru: "резать" },
        { answer: "bus", decoy: "boss", ru: "автобус" },
        { answer: "luck", decoy: "lock", ru: "удача" },
        { answer: "hut", decoy: "hat", ru: "хижина" },
        { answer: "fun", decoy: "fan", ru: "веселье" },
      ],
    },
    {
      id: "ah",
      ipa: "ɑ",
      title: "o",
      example: "hot",
      group: "vowels",
      items: [
        { answer: "hot", decoy: "hat", ru: "горячий" },
        { answer: "not", decoy: "net", ru: "не" },
        { answer: "dog", decoy: "dug", ru: "собака" },
        { answer: "box", decoy: "bucks", ru: "коробка" },
        { answer: "rock", decoy: "rack", ru: "скала" },
        { answer: "shop", decoy: "ship", ru: "магазин" },
      ],
    },
    {
      id: "ay",
      ipa: "eɪ",
      title: "ay",
      example: "day",
      group: "vowels",
      items: [
        { answer: "day", decoy: "die", ru: "день" },
        { answer: "say", decoy: "see", ru: "сказать" },
        { answer: "make", decoy: "mike", ru: "делать" },
        { answer: "late", decoy: "let", ru: "поздний" },
        { answer: "wait", decoy: "wet", ru: "ждать" },
        { answer: "name", decoy: "numb", ru: "имя" },
      ],
    },
    {
      id: "th",
      ipa: "θ",
      title: "th",
      example: "think",
      group: "consonants",
      items: [
        { answer: "think", decoy: "sink", ru: "думать" },
        { answer: "three", decoy: "tree", ru: "три" },
        { answer: "thin", decoy: "tin", ru: "тонкий" },
        { answer: "thank", decoy: "tank", ru: "благодарить" },
        { answer: "bath", decoy: "bat", ru: "ванна" },
        { answer: "path", decoy: "pat", ru: "тропа" },
      ],
    },
    {
      id: "sh",
      ipa: "ʃ",
      title: "sh",
      example: "ship",
      group: "consonants",
      items: [
        { answer: "ship", decoy: "sheep", ru: "корабль" },
        { answer: "shop", decoy: "chop", ru: "магазин" },
        { answer: "she", decoy: "sea", ru: "она" },
        { answer: "fish", decoy: "fix", ru: "рыба" },
        { answer: "wash", decoy: "watch", ru: "мыть" },
        { answer: "shoe", decoy: "sue", ru: "туфля" },
      ],
    },
  ],

  getSound(id) {
    return this.sounds.find((s) => s.id === id) || null;
  },

  allItems() {
    return this.sounds.flatMap((s) =>
      s.items.map((item) => ({ ...item, soundId: s.id }))
    );
  },

  itemsForSound(id) {
    const sound = this.getSound(id);
    if (!sound) return [];
    return sound.items.map((item) => ({ ...item, soundId: sound.id }));
  },

  shuffle(list) {
    const pool = list.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  },

  /**
   * @param {{ soundId?: string|null, count?: number }} opts
   */
  pickRound({ soundId = null, count = 12 } = {}) {
    const n = Math.min(20, Math.max(4, Number(count) || 12));
    let pool = soundId ? this.itemsForSound(soundId) : this.allItems();
    if (!pool.length) return [];
    pool = this.shuffle(pool);
    // Если заданий мало — повторяем с перемешиванием
    while (pool.length < n) {
      pool = pool.concat(this.shuffle(pool.slice(0, Math.min(pool.length, n - pool.length))));
    }
    return pool.slice(0, n);
  },
};
