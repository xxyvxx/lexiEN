/**
 * Персонажи заданий: корги, мопс, овчарка.
 * Брендовая собака из /assets/ — только для оформления сайта (лого, empty-states), не в диалогах.
 */
window.LexiCharacters = {
  packs: [
    {
      id: "corgi",
      folder: "corgi_emotions",
      files: [
        "01_astonishment.svg",
        "02_smile.svg",
        "03_isTouched.svg",
        "03_winks.svg",
        "04_cry.svg",
        "05_happy.svg",
        "06_love.svg",
      ],
    },
    {
      id: "pug",
      folder: "pug_emotions",
      files: [
        "01_excited.svg",
        "02_suspicious.svg",
        "03_confused.svg",
        "04_play_bow.svg",
        "05_grin.svg",
        "06_sad.svg",
        "07_dazed.svg",
        "08_sleeping.svg",
        "09_pleading.svg",
      ],
    },
    {
      id: "shepherd",
      folder: "shepherd_emotions",
      files: ["01_astonishment.svg", "02_sad.svg", "03_angry.svg", "04_love.svg"],
    },
  ],

  /** Эмоции по паку (для диалогов и реплик). */
  moods: {
    corgi: {
      happy: "05_happy.svg",
      smile: "02_smile.svg",
      wink: "03_winks.svg",
      love: "06_love.svg",
      cry: "04_cry.svg",
      shock: "01_astonishment.svg",
      soft: "03_isTouched.svg",
      think: "02_smile.svg",
      sleep: "03_isTouched.svg",
      angry: "04_cry.svg",
      default: "02_smile.svg",
    },
    pug: {
      happy: "05_grin.svg",
      smile: "01_excited.svg",
      wink: "04_play_bow.svg",
      love: "09_pleading.svg",
      cry: "06_sad.svg",
      shock: "03_confused.svg",
      soft: "09_pleading.svg",
      think: "02_suspicious.svg",
      sleep: "08_sleeping.svg",
      angry: "07_dazed.svg",
      default: "01_excited.svg",
    },
    shepherd: {
      happy: "04_love.svg",
      smile: "01_astonishment.svg",
      wink: "04_love.svg",
      love: "04_love.svg",
      cry: "02_sad.svg",
      shock: "01_astonishment.svg",
      soft: "04_love.svg",
      think: "01_astonishment.svg",
      sleep: "02_sad.svg",
      angry: "03_angry.svg",
      default: "01_astonishment.svg",
    },
  },

  /** Старые имена эмоций брендовой собаки → mood. */
  legacyMood(avatar) {
    const a = String(avatar || "").toLowerCase();
    if (/happy|winking|grin|wink/.test(a)) return "happy";
    if (/in_love|love/.test(a)) return "love";
    if (/sleep/.test(a)) return "sleep";
    if (/angry/.test(a)) return "angry";
    if (/shock|astonish|disgust/.test(a)) return "shock";
    if (/cry|sad|crying/.test(a)) return "cry";
    if (/detective|suspicious|confus/.test(a)) return "think";
    return "default";
  },

  packById(id) {
    return this.packs.find((p) => p.id === id) || this.packs[0];
  },

  /** Путь к SVG персонажа. */
  src(packId, mood) {
    const pack = this.packById(packId);
    const table = this.moods[pack.id] || {};
    const file = table[mood] || table.default || pack.files[0];
    return `../${pack.folder}/${file}`;
  },

  /** Случайный герой задания (без брендовой собаки). */
  pick(preferPackId) {
    const packs = this.packs.filter((p) => p.files?.length);
    if (!packs.length) return "../corgi_emotions/02_smile.svg";
    let pack = packs.find((p) => p.id === preferPackId);
    if (!pack) pack = packs[Math.floor(Math.random() * packs.length)];
    const file = pack.files[Math.floor(Math.random() * pack.files.length)];
    return `../${pack.folder}/${file}`;
  },

  /**
   * Разным говорящим — разные паки (по порядку появления).
   * @param {string[]} names
   * @param {Record<string,string>} [existing]
   */
  assignSpeakers(names, existing = {}) {
    const map = { ...existing };
    const ids = this.packs.map((p) => p.id);
    const used = new Set(Object.values(map));
    for (const name of names) {
      const who = String(name || "").trim();
      if (!who || map[who]) continue;
      const free = ids.find((id) => !used.has(id));
      const pick = free || ids[Object.keys(map).length % ids.length];
      map[who] = pick;
      used.add(pick);
    }
    return map;
  },

  dialogueAvatar(who, avatar, speakerMap) {
    const pack =
      (speakerMap && speakerMap[who]) ||
      this.assignSpeakers([who])[who] ||
      "corgi";
    return this.src(pack, this.legacyMood(avatar));
  },
};
