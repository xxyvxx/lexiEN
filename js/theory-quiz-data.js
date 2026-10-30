/**
 * Тесты для закрепления теории (по теме).
 * kind: choice | true-false
 */
window.LexiTheoryQuiz = {
  quizzes: {
    "present-simple": [
      {
        kind: "choice",
        question: "Present Simple чаще всего описывает…",
        options: ["привычки и факты", "действие прямо сейчас", "действие вчера", "планы на будущее"],
        answer: "привычки и факты",
      },
      {
        kind: "choice",
        question: "Выбери верную форму: She ___ football.",
        options: ["play", "plays", "playing", "played"],
        answer: "plays",
      },
      {
        kind: "choice",
        question: "Для he / she / it в вопросе ставим…",
        options: ["Do", "Does", "Are", "Did"],
        answer: "Does",
      },
      {
        kind: "true-false",
        question: "В отрицании после doesn't глагол идёт без -s: She doesn't like tea.",
        answer: true,
      },
      {
        kind: "choice",
        question: "Какое слово-маркер типично для Present Simple?",
        options: ["now", "yesterday", "every day", "at the moment"],
        answer: "every day",
      },
      {
        kind: "choice",
        question: "Верный вопрос:",
        options: ["Does they like pizza?", "Do she like pizza?", "Do they like pizza?", "Does they likes pizza?"],
        answer: "Do they like pizza?",
      },
      {
        kind: "true-false",
        question: "Глагол be (am/is/are) в Present Simple тоже всегда требует do/does.",
        answer: false,
      },
      {
        kind: "choice",
        question: "«Никогда» по-английски:",
        options: ["always", "usually", "often", "never"],
        answer: "never",
      },
    ],

    "to-be": [
      {
        kind: "choice",
        question: "С I используем форму…",
        options: ["am", "is", "are", "be"],
        answer: "am",
      },
      {
        kind: "choice",
        question: "She ___ my sister.",
        options: ["am", "is", "are", "be"],
        answer: "is",
      },
      {
        kind: "choice",
        question: "They ___ at school.",
        options: ["am", "is", "are", "be"],
        answer: "are",
      },
      {
        kind: "true-false",
        question: "Вопрос с to be: Is she ready?",
        answer: true,
      },
      {
        kind: "choice",
        question: "Отрицание для he/she/it:",
        options: ["am not", "isn't", "aren't", "don't"],
        answer: "isn't",
      },
      {
        kind: "choice",
        question: "Выбери верное:",
        options: ["He are happy.", "He is happy.", "He am happy.", "He be happy."],
        answer: "He is happy.",
      },
      {
        kind: "true-false",
        question: "To be помогает сказать, кто ты, какой он и где вы находитесь.",
        answer: true,
      },
      {
        kind: "choice",
        question: "«Усталый» по-английски:",
        options: ["happy", "hungry", "tired", "ready"],
        answer: "tired",
      },
    ],

    "there-is-are": [
      {
        kind: "choice",
        question: "There is / There are используют, чтобы сказать…",
        options: ["кто что умеет", "что где есть / находится", "что было вчера", "как часто мы что-то делаем"],
        answer: "что где есть / находится",
      },
      {
        kind: "choice",
        question: "Перед единственным числом:",
        options: ["There are", "There is", "There am", "There be"],
        answer: "There is",
      },
      {
        kind: "choice",
        question: "There ___ two books on the table.",
        options: ["is", "are", "am", "be"],
        answer: "are",
      },
      {
        kind: "true-false",
        question: "There is a pen in the bag. — верно для одного предмета.",
        answer: true,
      },
      {
        kind: "choice",
        question: "Отрицание в ед. числе:",
        options: ["There aren't", "There isn't", "There don't", "There no"],
        answer: "There isn't",
      },
      {
        kind: "choice",
        question: "Верный вопрос:",
        options: ["Is there a park near here?", "Are there a park near here?", "There is a park?", "Do there a park?"],
        answer: "Is there a park near here?",
      },
      {
        kind: "true-false",
        question: "There are всегда используется и с one book, и с two books.",
        answer: false,
      },
    ],

    "present-continuous": [
      {
        kind: "choice",
        question: "Present Continuous описывает действие…",
        options: ["каждый день", "прямо сейчас / вокруг сейчас", "вчера", "всегда и навсегда"],
        answer: "прямо сейчас / вокруг сейчас",
      },
      {
        kind: "choice",
        question: "Формула утверждения:",
        options: ["am/is/are + V-ing", "do/does + V", "did + V", "have + V"],
        answer: "am/is/are + V-ing",
      },
      {
        kind: "choice",
        question: "She ___ reading now.",
        options: ["am", "is", "are", "does"],
        answer: "is",
      },
      {
        kind: "true-false",
        question: "Маркеры now / at the moment часто идут с Present Continuous.",
        answer: true,
      },
      {
        kind: "choice",
        question: "Отрицание:",
        options: ["She don't reading.", "She isn't reading.", "She not reads.", "She doesn't reading."],
        answer: "She isn't reading.",
      },
      {
        kind: "choice",
        question: "Верный вопрос:",
        options: ["Are you watching TV?", "Do you watching TV?", "Is you watching TV?", "You are watching TV?"],
        answer: "Are you watching TV?",
      },
      {
        kind: "true-false",
        question: "I am play football now. — грамматически верно.",
        answer: false,
      },
    ],

    "past-simple": [
      {
        kind: "choice",
        question: "Past Simple нужен для действий…",
        options: ["сейчас", "в прошлом", "всегда", "завтра"],
        answer: "в прошлом",
      },
      {
        kind: "choice",
        question: "Правильные глаголы в Past Simple часто получают…",
        options: ["-ing", "-s", "-ed", "-er"],
        answer: "-ed",
      },
      {
        kind: "choice",
        question: "Отрицание в Past Simple:",
        options: ["don't + V", "doesn't + V", "didn't + V", "isn't + V"],
        answer: "didn't + V",
      },
      {
        kind: "true-false",
        question: "После didn't глагол стоит в первой форме: I didn't go.",
        answer: true,
      },
      {
        kind: "choice",
        question: "Вопрос в Past Simple начинается с…",
        options: ["Do", "Does", "Did", "Are"],
        answer: "Did",
      },
      {
        kind: "choice",
        question: "Выбери верное:",
        options: ["She goed home.", "She went home.", "She go home yesterday.", "She did went home."],
        answer: "She went home.",
      },
      {
        kind: "true-false",
        question: "Yesterday — типичный маркер Past Simple.",
        answer: true,
      },
    ],

    articles: [
      {
        kind: "choice",
        question: "a / an обычно значат…",
        options: ["этот самый", "один какой-то (впервые)", "много", "никогда"],
        answer: "один какой-то (впервые)",
      },
      {
        kind: "choice",
        question: "Перед гласным звуком ставим…",
        options: ["a", "an", "the", "ничего"],
        answer: "an",
      },
      {
        kind: "choice",
        question: "I have ___ dog. ___ dog is black.",
        options: ["a / The", "the / A", "an / The", "a / A"],
        answer: "a / The",
      },
      {
        kind: "true-false",
        question: "the часто ставят, когда уже понятно, о ком/чём речь.",
        answer: true,
      },
      {
        kind: "choice",
        question: "___ apple",
        options: ["a", "an", "the — всегда", "нужен do"],
        answer: "an",
      },
      {
        kind: "choice",
        question: "She is ___ teacher.",
        options: ["a", "an", "the", "—"],
        answer: "a",
      },
      {
        kind: "true-false",
        question: "Перед university всегда an, потому что слово начинается на u.",
        answer: false,
      },
    ],

    can: [
      {
        kind: "choice",
        question: "can выражает…",
        options: ["только прошлое", "умение / возможность / разрешение", "только артикли", "привычку каждый день"],
        answer: "умение / возможность / разрешение",
      },
      {
        kind: "choice",
        question: "После can глагол идёт…",
        options: ["с to", "без to", "с -ing", "с -ed"],
        answer: "без to",
      },
      {
        kind: "choice",
        question: "Отрицание:",
        options: ["don't can", "can't", "isn't can", "doesn't can"],
        answer: "can't",
      },
      {
        kind: "true-false",
        question: "Can you help me? — правильный вопрос.",
        answer: true,
      },
      {
        kind: "choice",
        question: "Выбери верное:",
        options: ["She can to swim.", "She can swim.", "She cans swim.", "She can swimming."],
        answer: "She can swim.",
      },
      {
        kind: "choice",
        question: "«Умею говорить»:",
        options: ["I can speak", "I can to speak", "I cans speak", "I am can speak"],
        answer: "I can speak",
      },
      {
        kind: "true-false",
        question: "can меняется по лицам: he cans, they can.",
        answer: false,
      },
    ],

    "school-words": [
      {
        kind: "choice",
        question: "lesson значит…",
        options: ["перемена", "урок", "пенал", "учитель"],
        answer: "урок",
      },
      {
        kind: "choice",
        question: "homework — это…",
        options: ["расписание", "домашнее задание", "одноклассник", "физкультура"],
        answer: "домашнее задание",
      },
      {
        kind: "choice",
        question: "Перемена по-английски:",
        options: ["break", "subject", "timetable", "classmate"],
        answer: "break",
      },
      {
        kind: "true-false",
        question: "PE — это физкультура.",
        answer: true,
      },
      {
        kind: "choice",
        question: "favourite subject — это…",
        options: ["любимый предмет", "трудный урок", "длинная перемена", "новый учитель"],
        answer: "любимый предмет",
      },
      {
        kind: "choice",
        question: "timetable значит…",
        options: ["пенал", "расписание", "одноклассник", "домашка"],
        answer: "расписание",
      },
      {
        kind: "true-false",
        question: "classmate — это учитель.",
        answer: false,
      },
      {
        kind: "choice",
        question: "«Можно одолжить ручку?» ближе всего к:",
        options: ["Can I borrow a pen?", "I have PE on Fridays.", "The break is ten minutes.", "Open the window."],
        answer: "Can I borrow a pen?",
      },
    ],
  },

  get(topicId) {
    return this.quizzes[topicId] || null;
  },
};
