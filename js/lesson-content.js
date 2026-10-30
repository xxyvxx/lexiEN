/**
 * Контент уроков по темам и уровням.
 * Present Simple — уровни 1–3, история, финал.
 * To be — пока уровни 1–2.
 */
window.LexiLessons = {
  uid: 0,
  id(prefix) {
    this.uid += 1;
    return `${prefix}-${this.uid}`;
  },

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /**
   * Случайный набор заданий: тасуем пул, стараемся не ставить подряд один тип.
   */
  pickRandom(pool, count = 10) {
    if (!pool.length) return [];
    const deck = this.shuffle(pool.map((ex) => ({ ...ex })));
    const picked = [];
    const leftover = [];

    deck.forEach((ex) => {
      const last = picked[picked.length - 1];
      if (last && last.type === ex.type && leftover.length + picked.length < deck.length) {
        leftover.push(ex);
        return;
      }
      picked.push(ex);
    });

    this.shuffle(leftover).forEach((ex) => picked.push(ex));

    // Если заданий меньше count — добираем перемешанными копиями
    let guard = 0;
    while (picked.length < count && deck.length && guard < count * 3) {
      const extra = this.shuffle(deck.map((ex) => ({ ...ex })));
      for (const ex of extra) {
        if (picked.length >= count) break;
        const last = picked[picked.length - 1];
        if (last && last.type === ex.type && extra.length > 1) continue;
        picked.push({ ...ex });
      }
      guard += 1;
    }

    return this.shuffle(picked).slice(0, count);
  },

  poolFromBucket(bucket) {
    if (!bucket) return [];
    const typed = (arr, type) => (arr || []).map((x) => ({ ...x, type }));
    return [
      ...typed(bucket.match, "match"),
      ...typed(bucket.meaning, "meaning"),
      ...typed(bucket.translate, "translate"),
      ...typed(bucket.listenTranslate, "listen-translate"),
      ...typed(bucket.composeEn, "compose-en"),
      ...typed(bucket.typeWord, "type-word"),
      ...typed(bucket.typeBlank, "type-blank"),
      ...typed(bucket.pattern, "pattern"),
      ...typed(bucket.spotError, "spot-error"),
      ...typed(bucket.oddOne, "odd-one"),
      ...typed(bucket.orderLines, "order-lines"),
      ...typed(bucket.trueFalse, "true-false"),
    ];
  },

  buildRegular(topicId, level) {
    const pack = this.packs[topicId] || this.packs["present-simple"];
    const key = String(level);
    const bucket = pack.levels?.[key] || pack.levels?.["1"] || pack;
    const pool = this.poolFromBucket(bucket);
    return this.pickRandom(pool, 10).map((ex, i) => ({
      ...ex,
      id: this.id(`${topicId}-${level}-${i}`),
    }));
  },

  buildStory(topicId) {
    const story = (this.packs[topicId] || this.packs["present-simple"]).story;
    return story.steps.map((step, i) => ({
      ...step,
      type: step.type === "read" ? "story-read" : step.type,
      id: this.id(`${topicId}-story-${i}`),
      storyTitle: story.title,
    }));
  },

  /** Ошибки из профиля/гостя → задания «Повторение» в финале */
  buildReview(topicId) {
    const list = window.LexiStore?.getMistakes?.(topicId) || [];
    return list
      .slice(0, 5)
      .map((m, i) => {
        const raw = m.raw && typeof m.raw === "object" ? { ...m.raw } : null;
        if (!raw || !raw.type) return null;
        delete raw.failCount;
        return {
          ...raw,
          id: this.id(`${topicId}-review-${i}`),
          mistakeId: m.id,
          isReview: true,
          sectionLabel: "повторение",
          prompt: raw.prompt || m.prompt || "Повторение",
        };
      })
      .filter(Boolean);
  },

  /** Тест по разделу «Ошибки»: все / тема / уровень / одно задание */
  buildMistakesQuiz() {
    const params = new URLSearchParams(location.search);
    const onlyId = params.get("id");
    const onlyTopic = params.get("topic");
    const onlyLevel = params.get("level");

    let list = window.LexiStore?.getMistakes?.() || [];
    if (onlyId) {
      list = list.filter((m) => m.id === onlyId);
    } else {
      if (onlyTopic) list = list.filter((m) => m.topicId === onlyTopic);
      if (onlyLevel != null && onlyLevel !== "") {
        list = list.filter((m) => String(m.level || m.raw?.level || "") === String(onlyLevel));
      }
      list = this.shuffle(list).slice(0, 20);
    }

    return list
      .map((m, i) => {
        const raw = m.raw && typeof m.raw === "object" ? { ...m.raw } : null;
        if (!raw || !raw.type) return null;
        if (raw.type === "story-read") return null;
        delete raw.failCount;
        delete raw.isReview;
        delete raw.isMistakeReview;
        return {
          ...raw,
          id: this.id(`mistakes-quiz-${i}`),
          mistakeId: m.id,
          isMistakeReview: true,
          sectionLabel: "ошибки",
          prompt: raw.prompt || m.prompt || "Ошибка",
        };
      })
      .filter(Boolean);
  },

  buildFinal(topicId) {
    const pack = this.packs[topicId] || this.packs["present-simple"];
    const bucket = pack.levels?.final || pack.levels?.["3"] || pack.levels?.["1"];
    const main = this.pickRandom(this.poolFromBucket(bucket), 8).map((ex, i) => ({
      ...ex,
      id: this.id(`${topicId}-final-${i}`),
    }));
    const review = this.buildReview(topicId);
    return [...review, ...main];
  },

  getLesson(topicId, level, kind) {
    if (kind === "dialogue") return { mode: "story", exercises: this.buildStory(topicId) };
    if (kind === "final") return { mode: "final", lives: 3, exercises: this.buildFinal(topicId) };
    if (kind === "mistakes") return { mode: "mistakes", lives: null, exercises: this.buildMistakesQuiz() };
    return { mode: "lesson", exercises: this.buildRegular(topicId, level) };
  },

  packs: {
    "present-simple": {
      levels: {
        "1": {
          match: [
            {
              prompt: "Нажми на пары слов",
              pairs: [
                { left: "всегда", right: "always" },
                { left: "обычно", right: "usually" },
                { left: "иногда", right: "sometimes" },
                { left: "никогда", right: "never" },
                { left: "часто", right: "often" },
              ],
            },
            {
              prompt: "Нажми на пары слов",
              pairs: [
                { left: "каждый день", right: "every day" },
                { left: "по утрам", right: "in the morning" },
                { left: "в школе", right: "at school" },
                { left: "дома", right: "at home" },
                { left: "на выходных", right: "at weekends" },
              ],
            },
          ],
          meaning: [
            {
              label: "новое слово",
              prompt: "«Always» значит…",
              sentence: "I always brush my teeth.",
              highlight: "always",
              options: ["иногда", "всегда", "никогда"],
              answer: "всегда",
            },
            {
              label: "новое слово",
              prompt: "«Every day» значит…",
              sentence: "We go to school every day.",
              highlight: "every day",
              options: ["каждый день", "каждую неделю", "иногда"],
              answer: "каждый день",
            },
          ],
          translate: [
            {
              prompt: "Переведи предложение",
              source: "I like music.",
              sourceLang: "en",
              bank: ["Я", "люблю", "музыку", "он", "школа"],
              answer: ["Я", "люблю", "музыку"],
            },
            {
              prompt: "Переведи предложение",
              source: "Она читает книги.",
              sourceLang: "ru",
              bank: ["She", "reads", "books", "read", "They"],
              answer: ["She", "reads", "books"],
            },
            {
              prompt: "Составьте вопрос",
              source: "Ты любишь спорт?",
              sourceLang: "ru",
              bank: ["Do", "you", "like", "sport", "Does", "likes"],
              answer: ["Do", "you", "like", "sport"],
            },
          ],
          listenTranslate: [
            {
              prompt: "Послушай и собери перевод",
              source: "I like music.",
              bank: ["Я", "люблю", "музыку", "мы", "школа"],
              answer: ["Я", "люблю", "музыку"],
              heroPack: "corgi",
            },
            {
              prompt: "Послушай и собери перевод",
              source: "We go to school.",
              bank: ["Мы", "ходим", "в", "школу", "они", "дом"],
              answer: ["Мы", "ходим", "в", "школу"],
              heroPack: "pug",
            },
          ],
          composeEn: [
            {
              prompt: "Составь предложение на английском",
              source: "Я люблю спорт.",
              bank: ["I", "like", "sport", "likes", "She"],
              answer: ["I", "like", "sport"],
              heroPack: "shepherd",
            },
            {
              prompt: "Составь предложение на английском",
              source: "Они читают книги.",
              bank: ["They", "read", "books", "reads", "We"],
              answer: ["They", "read", "books"],
              heroPack: "corgi",
            },
          ],
          typeWord: [
            { prompt: "Напиши перевод на английский", source: "всегда", answer: "always" },
            { prompt: "Напиши перевод на английский", source: "каждый день", answer: ["every day", "everyday"] },
            { prompt: "Напиши перевод на английский", source: "любить", answer: "like" },
          ],
          typeBlank: [
            { prompt: "Впиши слово по смыслу", before: "She ", after: " my friend.", answer: "is" },
            { prompt: "Впиши слово по смыслу", before: "They ", after: " at school.", answer: "are" },
            { prompt: "Впиши слово по смыслу", before: "", after: " you like music?", answer: "Do" },
          ],
          pattern: [
            {
              label: "новая конструкция",
              prompt: "Заполните пропуск",
              examples: [
                { text: "I play football.", highlight: "play" },
                { text: "She plays football.", highlight: "plays" },
              ],
              blankBefore: "He ",
              blankAfter: " tennis.",
              options: ["play", "plays"],
              answer: "plays",
            },
          ],
          spotError: [
            {
              prompt: "Найди ошибку в предложении",
              tokens: ["She", "like", "cats."],
              errorIndex: 1,
              fixPrompt: "Как правильно?",
              options: ["likes", "liking", "liked"],
              answer: "likes",
            },
          ],
          oddOne: [
            {
              prompt: "Что здесь лишнее?",
              options: ["always", "usually", "yesterday", "often"],
              answer: "yesterday",
              hint: "Три слова — маркеры Present Simple.",
            },
          ],
          orderLines: [
            {
              prompt: "Расставь реплики по порядку",
              lines: [
                { id: "a", who: "Mia", avatar: "05_detective", text: "Do you like school?" },
                { id: "b", who: "Ben", avatar: "08_happy", text: "Yes, I like English." },
                { id: "c", who: "Mia", avatar: "03_winking", text: "Me too!" },
              ],
            },
          ],
          trueFalse: [
            {
              prompt: "Верно или нет?",
              statement: "He play football every day.",
              isCorrect: false,
              fixPrompt: "Как правильно?",
              options: ["He plays football every day.", "He playing football every day.", "He play football every days."],
              answer: "He plays football every day.",
            },
            {
              prompt: "Верно или нет?",
              statement: "I usually get up at seven.",
              isCorrect: true,
            },
          ],
        },

        "2": {
          match: [
            {
              prompt: "Нажми на пары слов",
              pairs: [
                { left: "любить", right: "like" },
                { left: "смотреть", right: "watch" },
                { left: "играть", right: "play" },
                { left: "ходить / ездить", right: "go" },
                { left: "есть", right: "eat" },
              ],
            },
          ],
          meaning: [
            {
              label: "грамматика",
              prompt: "Зачем здесь «Does»?",
              sentence: "Does she watch TV?",
              highlight: "Does",
              options: ["чтобы спросить про he/she/it", "это значит «делает спорт»", "это прошедшее время"],
              answer: "чтобы спросить про he/she/it",
            },
            {
              label: "новое слово",
              prompt: "«Never» значит…",
              sentence: "I never drink coffee.",
              highlight: "never",
              options: ["часто", "никогда", "обычно"],
              answer: "никогда",
            },
          ],
          translate: [
            {
              prompt: "Переведи предложение",
              source: "They don't like tea.",
              sourceLang: "en",
              bank: ["Они", "не", "любят", "чай", "мы", "пьём"],
              answer: ["Они", "не", "любят", "чай"],
            },
            {
              prompt: "Составьте вопрос",
              source: "Он смотрит фильмы?",
              sourceLang: "ru",
              bank: ["Does", "he", "watch", "films", "Do", "watches"],
              answer: ["Does", "he", "watch", "films"],
            },
            {
              prompt: "Переведи предложение",
              source: "We go to school on Mondays.",
              sourceLang: "en",
              bank: ["Мы", "ходим", "в", "школу", "по", "понедельникам", "воскресеньям"],
              answer: ["Мы", "ходим", "в", "школу", "по", "понедельникам"],
            },
          ],
          listenTranslate: [
            {
              prompt: "Послушай и собери перевод",
              source: "They don't like tea.",
              bank: ["Они", "не", "любят", "чай", "мы", "кофе"],
              answer: ["Они", "не", "любят", "чай"],
              heroPack: "pug",
            },
            {
              prompt: "Послушай и собери перевод",
              source: "I never drink coffee.",
              bank: ["Я", "никогда", "не", "пью", "кофе", "всегда"],
              answer: ["Я", "никогда", "не", "пью", "кофе"],
              heroPack: "shepherd",
            },
          ],
          composeEn: [
            {
              prompt: "Составь предложение на английском",
              source: "Он смотрит фильмы.",
              bank: ["He", "watches", "films", "watch", "She"],
              answer: ["He", "watches", "films"],
              heroPack: "corgi",
            },
            {
              prompt: "Составь предложение на английском",
              source: "Мы обычно гуляем.",
              bank: ["We", "usually", "walk", "walks", "They"],
              answer: ["We", "usually", "walk"],
              heroPack: "pug",
            },
          ],
          typeWord: [
            { prompt: "Напиши перевод на английский", source: "никогда", answer: "never" },
            { prompt: "Напиши перевод на английский", source: "обычно", answer: "usually" },
            { prompt: "Напиши перевод на английский", source: "смотреть", answer: "watch" },
          ],
          typeBlank: [
            { prompt: "Впиши слово по смыслу", before: "", after: " he watch TV?", answer: "Does" },
            { prompt: "Впиши слово по смыслу", before: "I ", after: " like tea.", answer: ["don't", "do not"] },
            { prompt: "Впиши слово по смыслу", before: "She ", after: " like coffee.", answer: ["doesn't", "does not"] },
          ],
          pattern: [
            {
              label: "отрицание",
              prompt: "Заполните пропуск",
              examples: [
                { text: "I don't like milk.", highlight: "don't" },
                { text: "She doesn't like milk.", highlight: "doesn't" },
              ],
              blankBefore: "He ",
              blankAfter: " like coffee.",
              options: ["don't", "doesn't"],
              answer: "doesn't",
            },
            {
              label: "вопрос",
              prompt: "Заполните пропуск",
              examples: [
                { text: "Do you play chess?", highlight: "Do" },
                { text: "Does she play chess?", highlight: "Does" },
              ],
              blankBefore: "",
              blankAfter: " they play chess?",
              options: ["Do", "Does"],
              answer: "Do",
            },
          ],
          spotError: [
            {
              prompt: "Найди ошибку в предложении",
              tokens: ["Does", "they", "like", "pizza?"],
              errorIndex: 0,
              fixPrompt: "Как правильно?",
              options: ["Do", "Is", "Are"],
              answer: "Do",
            },
            {
              prompt: "Найди ошибку в предложении",
              tokens: ["She", "don't", "watch", "TV."],
              errorIndex: 1,
              fixPrompt: "Как правильно?",
              options: ["doesn't", "didn't", "isn't"],
              answer: "doesn't",
            },
          ],
          oddOne: [
            {
              prompt: "Что здесь лишнее?",
              options: ["like", "watch", "apple", "play"],
              answer: "apple",
              hint: "Три слова — глаголы.",
            },
          ],
          orderLines: [
            {
              prompt: "Расставь реплики по порядку",
              lines: [
                { id: "a", who: "Sam", avatar: "03_winking", text: "What do you do after school?" },
                { id: "b", who: "Lina", avatar: "02_in_love", text: "I usually play football." },
                { id: "c", who: "Sam", avatar: "08_happy", text: "Cool! I watch films." },
              ],
            },
          ],
          trueFalse: [
            {
              prompt: "Верно или нет?",
              statement: "She doesn't likes pizza.",
              isCorrect: false,
              fixPrompt: "Как правильно?",
              options: ["She doesn't like pizza.", "She don't like pizza.", "She not likes pizza."],
              answer: "She doesn't like pizza.",
            },
            {
              prompt: "Верно или нет?",
              statement: "Do you go to school every day?",
              isCorrect: true,
            },
          ],
        },

        "3": {
          match: [
            {
              prompt: "Нажми на пары слов",
              pairs: [
                { left: "вставать", right: "get up" },
                { left: "делать уроки", right: "do homework" },
                { left: "слушать", right: "listen" },
                { left: "говорить", right: "speak" },
                { left: "жить", right: "live" },
              ],
            },
          ],
          meaning: [
            {
              label: "конструкция",
              prompt: "«Everyone likes…» — почему likes?",
              sentence: "Everyone likes ice cream.",
              highlight: "likes",
              options: ["everyone = he/she (ед. число)", "это прошедшее время", "ошибка, нужно like"],
              answer: "everyone = he/she (ед. число)",
            },
            {
              label: "новое слово",
              prompt: "«Often» значит…",
              sentence: "We often visit grandma.",
              highlight: "often",
              options: ["редко", "часто", "завтра"],
              answer: "часто",
            },
          ],
          translate: [
            {
              prompt: "Переведи предложение",
              source: "My brother doesn't speak French.",
              sourceLang: "en",
              bank: ["Мой", "брат", "не", "говорит", "по-французски", "сестра", "читает"],
              answer: ["Мой", "брат", "не", "говорит", "по-французски"],
            },
            {
              prompt: "Составьте вопрос",
              source: "Где ты живёшь?",
              sourceLang: "ru",
              bank: ["Where", "do", "you", "live", "does", "lives"],
              answer: ["Where", "do", "you", "live"],
            },
            {
              prompt: "Переведи предложение",
              source: "Она всегда делает уроки вечером.",
              sourceLang: "ru",
              bank: ["She", "always", "does", "homework", "in", "the", "evening", "do"],
              answer: ["She", "always", "does", "homework", "in", "the", "evening"],
            },
          ],
          listenTranslate: [
            {
              prompt: "Послушай и собери перевод",
              source: "My brother doesn't speak French.",
              bank: ["Мой", "брат", "не", "говорит", "по-французски", "сестра"],
              answer: ["Мой", "брат", "не", "говорит", "по-французски"],
              heroPack: "shepherd",
            },
          ],
          composeEn: [
            {
              prompt: "Составь предложение на английском",
              source: "Где ты живёшь?",
              bank: ["Where", "do", "you", "live", "does", "lives"],
              answer: ["Where", "do", "you", "live"],
              heroPack: "corgi",
            },
            {
              prompt: "Составь предложение на английском",
              source: "Я часто делаю уроки.",
              bank: ["I", "often", "do", "homework", "does", "She"],
              answer: ["I", "often", "do", "homework"],
              heroPack: "pug",
            },
          ],
          typeWord: [
            { prompt: "Напиши перевод на английский", source: "часто", answer: "often" },
            { prompt: "Напиши перевод на английский", source: "делать уроки", answer: ["do homework", "does homework"] },
            { prompt: "Напиши перевод на английский", source: "жить", answer: "live" },
          ],
          typeBlank: [
            { prompt: "Впиши слово по смыслу", before: "", after: " do you live?", answer: "Where" },
            { prompt: "Впиши слово по смыслу", before: "Everyone ", after: " happy.", answer: "is" },
            { prompt: "Впиши местоимение", before: "", after: " always does homework in the evening.", answer: "She" },
          ],
          pattern: [
            {
              label: "everyone",
              prompt: "Заполните пропуск",
              examples: [
                { text: "I like this song.", highlight: "like" },
                { text: "Everyone likes this song.", highlight: "likes" },
              ],
              blankBefore: "Everyone ",
              blankAfter: " happy.",
              options: ["is", "are"],
              answer: "is",
            },
            {
              label: "маркер времени",
              prompt: "Заполните пропуск",
              examples: [
                { text: "I always walk to school.", highlight: "always" },
                { text: "She never walks to school.", highlight: "never" },
              ],
              blankBefore: "We ",
              blankAfter: " play chess after school.",
              options: ["often", "yesterday", "ago"],
              answer: "often",
            },
          ],
          spotError: [
            {
              prompt: "Найди ошибку в предложении",
              tokens: ["Where", "does", "you", "live?"],
              errorIndex: 1,
              fixPrompt: "Как правильно?",
              options: ["do", "is", "are"],
              answer: "do",
            },
          ],
          oddOne: [
            {
              prompt: "Что здесь лишнее?",
              options: ["always", "often", "last year", "usually"],
              answer: "last year",
              hint: "Три — про регулярные действия.",
            },
          ],
          orderLines: [
            {
              prompt: "Расставь реплики по порядку",
              lines: [
                { id: "a", who: "Nora", avatar: "05_detective", text: "Does Tom live near school?" },
                { id: "b", who: "Omar", avatar: "08_happy", text: "No, he lives far away." },
                { id: "c", who: "Nora", avatar: "07_shocked", text: "How does he get to school?" },
                { id: "d", who: "Omar", avatar: "03_winking", text: "He usually takes the bus." },
              ],
            },
          ],
          trueFalse: [
            {
              prompt: "Верно или нет?",
              statement: "Everyone are ready.",
              isCorrect: false,
              fixPrompt: "Как правильно?",
              options: ["Everyone is ready.", "Everyone be ready.", "Everyone am ready."],
              answer: "Everyone is ready.",
            },
            {
              prompt: "Верно или нет?",
              statement: "She always does her homework.",
              isCorrect: true,
            },
          ],
        },

        final: {
          match: [
            {
              prompt: "Нажми на пары слов",
              pairs: [
                { left: "обычно", right: "usually" },
                { left: "никогда", right: "never" },
                { left: "делать", right: "do / does" },
                { left: "жить", right: "live" },
                { left: "смотреть", right: "watch" },
              ],
            },
          ],
          meaning: [
            {
              label: "финал",
              prompt: "Выбери верный смысл",
              sentence: "He doesn't play computer games.",
              highlight: "doesn't",
              options: ["он не играет", "он всегда играет", "он играл вчера"],
              answer: "он не играет",
            },
          ],
          translate: [
            {
              prompt: "Составьте вопрос",
              source: "Она часто ходит в кино?",
              sourceLang: "ru",
              bank: ["Does", "she", "often", "go", "to", "the", "cinema", "Do", "goes"],
              answer: ["Does", "she", "often", "go", "to", "the", "cinema"],
            },
            {
              prompt: "Переведи предложение",
              source: "We never eat junk food at home.",
              sourceLang: "en",
              bank: ["Мы", "никогда", "не", "едим", "фастфуд", "дома", "всегда"],
              answer: ["Мы", "никогда", "не", "едим", "фастфуд", "дома"],
            },
          ],
          listenTranslate: [
            {
              prompt: "Послушай и собери перевод",
              source: "We never eat junk food at home.",
              bank: ["Мы", "никогда", "не", "едим", "фастфуд", "дома", "всегда"],
              answer: ["Мы", "никогда", "не", "едим", "фастфуд", "дома"],
              heroPack: "pug",
            },
          ],
          composeEn: [
            {
              prompt: "Составь предложение на английском",
              source: "Она часто ходит в кино.",
              bank: ["She", "often", "goes", "to", "the", "cinema", "go", "Does"],
              answer: ["She", "often", "goes", "to", "the", "cinema"],
              heroPack: "shepherd",
            },
          ],
          typeWord: [
            { prompt: "Напиши перевод на английский", source: "кино", answer: ["cinema", "the cinema", "movie theater", "movie theatre"] },
            { prompt: "Напиши перевод на английский", source: "фастфуд", answer: ["junk food", "fast food"] },
            { prompt: "Напиши перевод на английский", source: "родители", answer: "parents" },
          ],
          typeBlank: [
            { prompt: "Впиши слово по смыслу", before: "", after: " she often go to the cinema?", answer: "Does" },
            { prompt: "Впиши слово по смыслу", before: "My parents ", after: " the news.", answer: "watch" },
            { prompt: "Впиши местоимение", before: "", after: " never eat junk food at home.", answer: "We" },
          ],
          pattern: [
            {
              label: "финальная проверка",
              prompt: "Заполните пропуск",
              examples: [
                { text: "Do your friends like pizza?", highlight: "Do" },
                { text: "Does your friend like pizza?", highlight: "Does" },
              ],
              blankBefore: "",
              blankAfter: " your sister like pizza?",
              options: ["Do", "Does"],
              answer: "Does",
            },
          ],
          spotError: [
            {
              prompt: "Найди ошибку в предложении",
              tokens: ["My", "parents", "watches", "the", "news."],
              errorIndex: 2,
              fixPrompt: "Как правильно?",
              options: ["watch", "watching", "watched"],
              answer: "watch",
            },
          ],
          oddOne: [
            {
              prompt: "Что здесь лишнее?",
              options: ["do", "does", "did", "don't"],
              answer: "did",
              hint: "Три связаны с Present Simple.",
            },
          ],
          orderLines: [
            {
              prompt: "Расставь реплики по порядку",
              lines: [
                { id: "a", who: "Eva", avatar: "02_in_love", text: "What time does the lesson start?" },
                { id: "b", who: "Max", avatar: "05_detective", text: "It starts at nine." },
                { id: "c", who: "Eva", avatar: "08_happy", text: "Perfect. See you there!" },
              ],
            },
          ],
          trueFalse: [
            {
              prompt: "Верно или нет?",
              statement: "Does she lives in Moscow?",
              isCorrect: false,
              fixPrompt: "Как правильно?",
              options: ["Does she live in Moscow?", "Do she live in Moscow?", "Does she living in Moscow?"],
              answer: "Does she live in Moscow?",
            },
          ],
        },
      },

      story: {
        title: "Утро в школе",
        steps: [
          {
            type: "story-read",
            prompt: "Прочитай диалог",
            lines: [
              { who: "Maya", avatar: "05_detective", text: "Hi, Leo! Do you always get up early?" },
              { who: "Leo", avatar: "04_sleeping", text: "Yes… I usually get up at seven." },
            ],
          },
          {
            type: "story-blank",
            prompt: "Заполни пропуск",
            lines: [{ who: "Maya", avatar: "05_detective", text: "______ you walk to school?" }],
            options: ["Do", "Does", "Are", "Is"],
            answer: "Do",
          },
          {
            type: "story-read",
            prompt: "Продолжение",
            lines: [
              { who: "Leo", avatar: "08_happy", text: "No, I don't. I take the bus." },
              { who: "Maya", avatar: "03_winking", text: "I never take the bus. I like walking!" },
            ],
          },
          {
            type: "story-blank",
            prompt: "Что сказала Maya?",
            lines: [{ who: "Maya", avatar: "03_winking", text: "I never take the bus." }],
            question: "Выбери перевод",
            options: [
              "Я никогда не езжу на автобусе",
              "Я всегда езжу на автобусе",
              "Я иногда опаздываю",
            ],
            answer: "Я никогда не езжу на автобусе",
          },
          {
            type: "story-blank",
            prompt: "Заполни пропуск",
            lines: [{ who: "Leo", avatar: "07_shocked", text: "Really? Everyone ______ the bus on rainy days!" }],
            options: ["takes", "take", "taking", "took"],
            answer: "takes",
          },
          {
            type: "story-read",
            prompt: "Финал сцены",
            lines: [
              { who: "Maya", avatar: "08_happy", text: "Haha. Okay, see you in English class!" },
              { who: "Leo", avatar: "02_in_love", text: "See you! English is my favourite." },
            ],
          },
          {
            type: "story-quiz",
            prompt: "О чём была история?",
            summary: "Maya и Leo говорят про утро: кто как добирается до школы и что любят.",
            question: "Как Leo обычно добирается до школы?",
            options: ["на автобусе", "пешком", "на велосипеде"],
            answer: "на автобусе",
          },
          {
            type: "story-quiz",
            prompt: "Уточним",
            question: "Какой любимый предмет у Leo?",
            options: ["английский", "математика", "физкультура"],
            answer: "английский",
          },
        ],
      },
    },

    "to-be": {
      levels: {
        "1": {
          match: [
            {
              prompt: "Нажми на пары слов",
              pairs: [
                { left: "я есть", right: "I am" },
                { left: "он / она есть", right: "he / she is" },
                { left: "мы / они есть", right: "we / they are" },
                { left: "счастливый", right: "happy" },
                { left: "усталый", right: "tired" },
              ],
            },
          ],
          meaning: [
            {
              label: "to be",
              prompt: "Выбери верную форму",
              sentence: "She ___ my sister.",
              highlight: "___",
              options: ["am", "is", "are"],
              answer: "is",
            },
            {
              label: "новое слово",
              prompt: "«Ready» значит…",
              sentence: "We are ready for school.",
              highlight: "ready",
              options: ["готовы", "голодны", "далеки"],
              answer: "готовы",
            },
          ],
          translate: [
            {
              prompt: "Переведи предложение",
              source: "I am a student.",
              sourceLang: "en",
              bank: ["Я", "ученик", "учитель", "он", "дом"],
              answer: ["Я", "ученик"],
            },
            {
              prompt: "Составьте предложение",
              source: "Они дома.",
              sourceLang: "ru",
              bank: ["They", "are", "at", "home", "is", "school"],
              answer: ["They", "are", "at", "home"],
            },
            {
              prompt: "Составьте вопрос",
              source: "Ты счастлив?",
              sourceLang: "ru",
              bank: ["Are", "you", "happy", "Is", "am"],
              answer: ["Are", "you", "happy"],
            },
          ],
          listenTranslate: [
            {
              prompt: "Послушай и собери перевод",
              source: "I am a student.",
              bank: ["Я", "ученик", "учитель", "он", "усталый"],
              answer: ["Я", "ученик"],
              heroPack: "corgi",
            },
          ],
          composeEn: [
            {
              prompt: "Составь предложение на английском",
              source: "Они дома.",
              bank: ["They", "are", "at", "home", "is", "school"],
              answer: ["They", "are", "at", "home"],
              heroPack: "pug",
            },
            {
              prompt: "Составь предложение на английском",
              source: "Ты счастлив?",
              bank: ["Are", "you", "happy", "Is", "am"],
              answer: ["Are", "you", "happy"],
              heroPack: "shepherd",
            },
          ],
          typeWord: [
            { prompt: "Напиши перевод на английский", source: "счастливый", answer: "happy" },
            { prompt: "Напиши перевод на английский", source: "усталый", answer: "tired" },
            { prompt: "Напиши перевод на английский", source: "ученик", answer: ["student", "a student", "pupil"] },
          ],
          typeBlank: [
            { prompt: "Впиши слово по смыслу", before: "I ", after: " a student.", answer: "am" },
            { prompt: "Впиши слово по смыслу", before: "He ", after: " my friend.", answer: "is" },
            { prompt: "Впиши слово по смыслу", before: "", after: " you happy?", answer: "Are" },
          ],
          pattern: [
            {
              label: "am / is / are",
              prompt: "Заполните пропуск",
              examples: [
                { text: "I am tired.", highlight: "am" },
                { text: "She is tired.", highlight: "is" },
              ],
              blankBefore: "They ",
              blankAfter: " tired.",
              options: ["am", "is", "are"],
              answer: "are",
            },
          ],
          spotError: [
            {
              prompt: "Найди ошибку в предложении",
              tokens: ["He", "are", "my", "friend."],
              errorIndex: 1,
              fixPrompt: "Как правильно?",
              options: ["is", "am", "be"],
              answer: "is",
            },
          ],
          oddOne: [
            {
              prompt: "Что здесь лишнее?",
              options: ["am", "is", "are", "do"],
              answer: "do",
              hint: "Три формы — глагол be.",
            },
          ],
          orderLines: [
            {
              prompt: "Расставь реплики по порядку",
              lines: [
                { id: "a", who: "Kim", avatar: "08_happy", text: "Hi! Are you new here?" },
                { id: "b", who: "Dan", avatar: "05_detective", text: "Yes, I am. I'm Dan." },
                { id: "c", who: "Kim", avatar: "03_winking", text: "Nice to meet you, Dan!" },
              ],
            },
          ],
          trueFalse: [
            {
              prompt: "Верно или нет?",
              statement: "I is happy.",
              isCorrect: false,
              fixPrompt: "Как правильно?",
              options: ["I am happy.", "I are happy.", "I be happy."],
              answer: "I am happy.",
            },
            {
              prompt: "Верно или нет?",
              statement: "They are at school.",
              isCorrect: true,
            },
          ],
        },

        "2": {
          match: [
            {
              prompt: "Нажми на пары слов",
              pairs: [
                { left: "это есть", right: "this is" },
                { left: "там / вот", right: "there" },
                { left: "холодный", right: "cold" },
                { left: "интересный", right: "interesting" },
                { left: "из…", right: "from" },
              ],
            },
          ],
          meaning: [
            {
              label: "отрицание",
              prompt: "«isn't» значит…",
              sentence: "It isn't cold today.",
              highlight: "isn't",
              options: ["не есть / не является", "был", "будет"],
              answer: "не есть / не является",
            },
            {
              label: "вопрос",
              prompt: "Как начать вопрос с he?",
              sentence: "___ he your brother?",
              highlight: "___",
              options: ["Is", "Are", "Am"],
              answer: "Is",
            },
          ],
          translate: [
            {
              prompt: "Переведи предложение",
              source: "She isn't at home.",
              sourceLang: "en",
              bank: ["Она", "не", "дома", "в", "школе", "он"],
              answer: ["Она", "не", "дома"],
            },
            {
              prompt: "Составьте вопрос",
              source: "Это твой учитель?",
              sourceLang: "ru",
              bank: ["Is", "this", "your", "teacher", "Are", "these"],
              answer: ["Is", "this", "your", "teacher"],
            },
            {
              prompt: "Переведи предложение",
              source: "Мы из Москвы.",
              sourceLang: "ru",
              bank: ["We", "are", "from", "Moscow", "is", "London"],
              answer: ["We", "are", "from", "Moscow"],
            },
          ],
          listenTranslate: [
            {
              prompt: "Послушай и собери перевод",
              source: "She isn't at home.",
              bank: ["Она", "не", "дома", "в", "школе", "он"],
              answer: ["Она", "не", "дома"],
              heroPack: "shepherd",
            },
          ],
          composeEn: [
            {
              prompt: "Составь предложение на английском",
              source: "Мы из Москвы.",
              bank: ["We", "are", "from", "Moscow", "is", "London"],
              answer: ["We", "are", "from", "Moscow"],
              heroPack: "corgi",
            },
          ],
          typeWord: [
            { prompt: "Напиши перевод на английский", source: "голодный", answer: "hungry" },
            { prompt: "Напиши перевод на английский", source: "готовый", answer: "ready" },
            { prompt: "Напиши перевод на английский", source: "из Москвы", answer: ["from Moscow", "from moscow"] },
          ],
          typeBlank: [
            { prompt: "Впиши слово по смыслу", before: "They ", after: " hungry.", answer: ["aren't", "are not"] },
            { prompt: "Впиши слово по смыслу", before: "", after: " she ready?", answer: "Is" },
            { prompt: "Впиши местоимение", before: "", after: " are from Moscow.", answer: "We" },
          ],
          pattern: [
            {
              label: "отрицание to be",
              prompt: "Заполните пропуск",
              examples: [
                { text: "I'm not hungry.", highlight: "I'm not" },
                { text: "She isn't hungry.", highlight: "isn't" },
              ],
              blankBefore: "They ",
              blankAfter: " hungry.",
              options: ["aren't", "isn't", "am not"],
              answer: "aren't",
            },
          ],
          spotError: [
            {
              prompt: "Найди ошибку в предложении",
              tokens: ["Are", "she", "ready?"],
              errorIndex: 0,
              fixPrompt: "Как правильно?",
              options: ["Is", "Am", "Be"],
              answer: "Is",
            },
          ],
          oddOne: [
            {
              prompt: "Что здесь лишнее?",
              options: ["happy", "tired", "ready", "plays"],
              answer: "plays",
              hint: "Три слова — состояния после to be.",
            },
          ],
          orderLines: [
            {
              prompt: "Расставь реплики по порядку",
              lines: [
                { id: "a", who: "Olga", avatar: "02_in_love", text: "Is the film interesting?" },
                { id: "b", who: "Ivan", avatar: "08_happy", text: "Yes, it is!" },
                { id: "c", who: "Olga", avatar: "07_shocked", text: "Great. I'm ready to watch it." },
              ],
            },
          ],
          trueFalse: [
            {
              prompt: "Верно или нет?",
              statement: "We isn't late.",
              isCorrect: false,
              fixPrompt: "Как правильно?",
              options: ["We aren't late.", "We am not late.", "We isn't late."],
              answer: "We aren't late.",
            },
            {
              prompt: "Верно или нет?",
              statement: "Is it cold outside?",
              isCorrect: true,
            },
          ],
        },
      },
      story: {
        title: "Новый ученик",
        steps: [
          {
            type: "story-read",
            prompt: "Прочитай диалог",
            lines: [
              { who: "Anna", avatar: "08_happy", text: "Hi! Are you new?" },
              { who: "Tim", avatar: "05_detective", text: "Yes, I am. I'm Tim." },
            ],
          },
          {
            type: "story-blank",
            prompt: "Заполни пропуск",
            lines: [{ who: "Anna", avatar: "03_winking", text: "______ you from London?" }],
            options: ["Are", "Is", "Am", "Do"],
            answer: "Are",
          },
          {
            type: "story-quiz",
            prompt: "О чём диалог?",
            summary: "Anna знакомится с новым учеником Tim.",
            question: "Как зовут нового ученика?",
            options: ["Tim", "Tom", "Anna"],
            answer: "Tim",
          },
        ],
      },
    },
  },
};
