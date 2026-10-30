/**
 * Темы теории. Прогресс берётся из тренажёра (LexiStore) — пока заглушка 0%.
 */
window.LexiTheory = {
  topics: [
    {
      id: "present-simple",
      color: { main: "#12a88f", deep: "#0b7d6a", soft: "#d4f4ec" },
      title: "Present Simple",
      short: "Привычки, факты и расписание: do / does, -s у глагола.",
      sections: [
        {
          id: "when",
          title: "Когда используем",
          html: `
            <p>Present Simple — это время «сейчас в общем», а не «прямо в эту секунду».</p>
            <ul>
              <li><strong>Привычки:</strong> I walk to school every day.</li>
              <li><strong>Факты:</strong> The Sun rises in the east.</li>
              <li><strong>Расписание:</strong> The lesson starts at 9 o'clock.</li>
            </ul>
            <p>Частые слова-подсказки: <em>always, usually, often, sometimes, never, every day, on Mondays</em>.</p>
          `,
        },
        {
          id: "form",
          title: "Формула",
          html: `
            <div class="theory-box">
              <p><strong>Утверждение</strong></p>
              <p>I / you / we / they + <strong>V</strong> → They play football.</p>
              <p>he / she / it + <strong>V<span class="accent">s</span></strong> → She play<span class="accent">s</span> football.</p>
            </div>
            <div class="theory-box">
              <p><strong>Отрицание</strong></p>
              <p>I / you / we / they + <strong>don't</strong> + V</p>
              <p>he / she / it + <strong>doesn't</strong> + V (без -s!)</p>
              <p>He doesn't like tea.</p>
            </div>
            <div class="theory-box">
              <p><strong>Вопрос</strong></p>
              <p><strong>Do</strong> I / you / we / they + V?</p>
              <p><strong>Does</strong> he / she / it + V?</p>
              <p>Does she like music? — Yes, she does. / No, she doesn't.</p>
            </div>
          `,
        },
        {
          id: "examples",
          title: "Примеры",
          html: `
            <ul class="example-list">
              <li><span class="en">I get up at seven.</span> <span class="ru">Я встаю в семь.</span></li>
              <li><span class="en">She likes this movie.</span> <span class="ru">Ей нравится этот фильм.</span></li>
              <li><span class="en">We don't watch TV in the morning.</span> <span class="ru">Мы не смотрим ТВ утром.</span></li>
              <li><span class="en">Does he play football?</span> <span class="ru">Он играет в футбол?</span></li>
              <li><span class="en">Everyone is ready.</span> <span class="ru">Все готовы. (to be — отдельно!)</span></li>
            </ul>
            <p class="theory-note">Осторожно: глагол <strong>be</strong> (am / is / are) в Present Simple работает без do/does.</p>
          `,
        },
        {
          id: "words",
          title: "Слова к теме",
          html: `
            <div class="word-chips">
              <span><strong>always</strong> — всегда</span>
              <span><strong>usually</strong> — обычно</span>
              <span><strong>often</strong> — часто</span>
              <span><strong>sometimes</strong> — иногда</span>
              <span><strong>never</strong> — никогда</span>
              <span><strong>every day</strong> — каждый день</span>
              <span><strong>like</strong> — нравиться</span>
              <span><strong>play</strong> — играть</span>
              <span><strong>go</strong> — идти / ехать</span>
              <span><strong>watch</strong> — смотреть</span>
            </div>
          `,
        },
      ],
    },
    {
      id: "to-be",
      color: { main: "#2f97d4", deep: "#1a6f9c", soft: "#dff1fb" },
      title: "To be: am / is / are",
      short: "Самый важный глагол: кто ты, какой он, где мы.",
      sections: [
        {
          id: "when",
          title: "Когда используем",
          html: `
            <p>Глагол <strong>be</strong> помогает сказать:</p>
            <ul>
              <li>кто ты / кто это: I am a student. This is my friend.</li>
              <li>какой человек или предмет: The book is interesting.</li>
              <li>где кто-то находится: They are at school.</li>
            </ul>
          `,
        },
        {
          id: "form",
          title: "Формула",
          html: `
            <div class="theory-box">
              <p>I → <strong>am</strong></p>
              <p>he / she / it → <strong>is</strong></p>
              <p>you / we / they → <strong>are</strong></p>
            </div>
            <div class="theory-box">
              <p><strong>Отрицание:</strong> I'm not, isn't, aren't</p>
              <p><strong>Вопрос:</strong> Am I…? Is she…? Are they…?</p>
            </div>
          `,
        },
        {
          id: "examples",
          title: "Примеры",
          html: `
            <ul class="example-list">
              <li><span class="en">I am happy.</span> <span class="ru">Я счастлив(а).</span></li>
              <li><span class="en">She is my sister.</span> <span class="ru">Она моя сестра.</span></li>
              <li><span class="en">We are ready.</span> <span class="ru">Мы готовы.</span></li>
              <li><span class="en">Is it cold today?</span> <span class="ru">Сегодня холодно?</span></li>
            </ul>
          `,
        },
        {
          id: "words",
          title: "Слова к теме",
          html: `
            <div class="word-chips">
              <span><strong>happy</strong> — счастливый</span>
              <span><strong>tired</strong> — усталый</span>
              <span><strong>ready</strong> — готовый</span>
              <span><strong>at home</strong> — дома</span>
              <span><strong>at school</strong> — в школе</span>
              <span><strong>friend</strong> — друг</span>
            </div>
          `,
        },
      ],
    },
    {
      id: "there-is-are",
      color: { main: "#6c63ff", deep: "#4f48c9", soft: "#ebe9ff" },
      title: "There is / There are",
      short: "Как сказать, что что-то есть (или нет) в месте.",
      sections: [
        {
          id: "when",
          title: "Когда используем",
          html: `
            <p>Нужно описать, что находится в комнате, городе, сумке — бери <strong>there is / there are</strong>.</p>
            <ul>
              <li><strong>There is</strong> — один предмет (или неисчисляемое): There is a book on the table.</li>
              <li><strong>There are</strong> — несколько: There are two windows in the room.</li>
            </ul>
          `,
        },
        {
          id: "form",
          title: "Формула",
          html: `
            <div class="theory-box">
              <p>There is + a/an + существительное в ед. числе</p>
              <p>There are + существительное во мн. числе</p>
            </div>
            <div class="theory-box">
              <p><strong>Отрицание:</strong> There isn't… / There aren't…</p>
              <p><strong>Вопрос:</strong> Is there…? / Are there…?</p>
            </div>
          `,
        },
        {
          id: "examples",
          title: "Примеры",
          html: `
            <ul class="example-list">
              <li><span class="en">There is a cat in the garden.</span> <span class="ru">В саду есть кошка.</span></li>
              <li><span class="en">There are five chairs.</span> <span class="ru">Есть пять стульев.</span></li>
              <li><span class="en">Is there any milk?</span> <span class="ru">Есть молоко?</span></li>
              <li><span class="en">There aren't any apples.</span> <span class="ru">Яблок нет.</span></li>
            </ul>
          `,
        },
        {
          id: "words",
          title: "Слова к теме",
          html: `
            <div class="word-chips">
              <span><strong>a book</strong> — книга</span>
              <span><strong>a window</strong> — окно</span>
              <span><strong>a chair</strong> — стул</span>
              <span><strong>garden</strong> — сад</span>
              <span><strong>any</strong> — какой-либо (в вопросах/отрицаниях)</span>
            </div>
          `,
        },
      ],
    },
    {
      id: "present-continuous",
      color: { main: "#f0a202", deep: "#c78912", soft: "#fff1d2" },
      title: "Present Continuous",
      short: "Что происходит прямо сейчас: am/is/are + -ing.",
      sections: [
        {
          id: "when",
          title: "Когда используем",
          html: `
            <p>Present Continuous — про действие <strong>в момент речи</strong> или временную ситуацию.</p>
            <ul>
              <li>Look! It is raining.</li>
              <li>I am doing my homework now.</li>
              <li>She is staying with friends this week.</li>
            </ul>
            <p>Подсказки: <em>now, at the moment, Look!, Listen!</em></p>
          `,
        },
        {
          id: "form",
          title: "Формула",
          html: `
            <div class="theory-box">
              <p>am / is / are + <strong>Ving</strong></p>
              <p>I am reading. · He is playing. · They are talking.</p>
            </div>
            <div class="theory-box">
              <p><strong>Отрицание:</strong> I'm not / isn't / aren't + Ving</p>
              <p><strong>Вопрос:</strong> Are you listening? Is she sleeping?</p>
            </div>
          `,
        },
        {
          id: "examples",
          title: "Примеры",
          html: `
            <ul class="example-list">
              <li><span class="en">I am writing a message.</span> <span class="ru">Я пишу сообщение.</span></li>
              <li><span class="en">They aren't watching TV.</span> <span class="ru">Они не смотрят ТВ.</span></li>
              <li><span class="en">What are you doing?</span> <span class="ru">Что ты делаешь?</span></li>
            </ul>
            <p class="theory-note">Не путай с Present Simple: I play football (вообще) ≠ I am playing football (сейчас).</p>
          `,
        },
        {
          id: "words",
          title: "Слова к теме",
          html: `
            <div class="word-chips">
              <span><strong>now</strong> — сейчас</span>
              <span><strong>at the moment</strong> — в данный момент</span>
              <span><strong>reading</strong> — читаю</span>
              <span><strong>writing</strong> — пишу</span>
              <span><strong>listening</strong> — слушаю</span>
            </div>
          `,
        },
      ],
    },
    {
      id: "past-simple",
      color: { main: "#e85d5d", deep: "#c13d3d", soft: "#ffe3e3" },
      title: "Past Simple",
      short: "Что было вчера и в прошлом: -ed и неправильные глаголы.",
      sections: [
        {
          id: "when",
          title: "Когда используем",
          html: `
            <p>Past Simple — про законченные действия в прошлом.</p>
            <ul>
              <li>I visited my grandma yesterday.</li>
              <li>We went to the cinema last weekend.</li>
            </ul>
            <p>Подсказки: <em>yesterday, last week, ago, in 2020</em>.</p>
          `,
        },
        {
          id: "form",
          title: "Формула",
          html: `
            <div class="theory-box">
              <p><strong>Правильные:</strong> V + <strong>ed</strong> → played, watched, visited</p>
              <p><strong>Неправильные:</strong> go → went, see → saw, have → had</p>
            </div>
            <div class="theory-box">
              <p><strong>Отрицание:</strong> didn't + V (без -ed!)</p>
              <p><strong>Вопрос:</strong> Did you…? Did she…?</p>
            </div>
          `,
        },
        {
          id: "examples",
          title: "Примеры",
          html: `
            <ul class="example-list">
              <li><span class="en">I played tennis yesterday.</span> <span class="ru">Вчера я играл в теннис.</span></li>
              <li><span class="en">She didn't go to school.</span> <span class="ru">Она не ходила в школу.</span></li>
              <li><span class="en">Did you see that film?</span> <span class="ru">Ты видел этот фильм?</span></li>
            </ul>
          `,
        },
        {
          id: "words",
          title: "Слова к теме",
          html: `
            <div class="word-chips">
              <span><strong>yesterday</strong> — вчера</span>
              <span><strong>last week</strong> — на прошлой неделе</span>
              <span><strong>ago</strong> — назад</span>
              <span><strong>went</strong> — ходил / ездил</span>
              <span><strong>saw</strong> — видел</span>
              <span><strong>did</strong> — делал / вспомог. глагол</span>
            </div>
          `,
        },
      ],
    },
    {
      id: "articles",
      color: { main: "#00a8a8", deep: "#0e7f7f", soft: "#d7f4f4" },
      title: "Артикли a / an / the",
      short: "Когда ставить a, an и the — коротко и по делу.",
      sections: [
        {
          id: "when",
          title: "Когда используем",
          html: `
            <p><strong>a / an</strong> — «один какой-то» (впервые упоминаем).</p>
            <p><strong>the</strong> — «этот самый» (уже понятно, о ком/чём речь), или уникальные вещи: the Sun.</p>
          `,
        },
        {
          id: "form",
          title: "Правила",
          html: `
            <div class="theory-box">
              <p><strong>a</strong> перед согласным звуком: a book, a university (звук «ю»)</p>
              <p><strong>an</strong> перед гласным звуком: an apple, an hour</p>
            </div>
            <div class="theory-box">
              <p>I have <strong>a</strong> dog. <strong>The</strong> dog is black.</p>
            </div>
          `,
        },
        {
          id: "examples",
          title: "Примеры",
          html: `
            <ul class="example-list">
              <li><span class="en">She is a teacher.</span> <span class="ru">Она учительница.</span></li>
              <li><span class="en">Open the window, please.</span> <span class="ru">Открой окно, пожалуйста.</span></li>
              <li><span class="en">An elephant is big.</span> <span class="ru">Слон большой.</span></li>
            </ul>
          `,
        },
        {
          id: "words",
          title: "На заметку",
          html: `
            <div class="word-chips">
              <span><strong>a / an</strong> — один, неконкретный</span>
              <span><strong>the</strong> — конкретный / известный</span>
              <span><strong>zero article</strong> — без артикля: I like music</span>
            </div>
          `,
        },
      ],
    },
    {
      id: "can",
      color: { main: "#ff7a59", deep: "#d95a3b", soft: "#ffe6df" },
      title: "Can / Can't",
      short: "Умею, могу, разрешено — и как спросить вежливо.",
      sections: [
        {
          id: "when",
          title: "Когда используем",
          html: `
            <ul>
              <li><strong>Умение:</strong> I can swim.</li>
              <li><strong>Возможность:</strong> We can meet tomorrow.</li>
              <li><strong>Разрешение:</strong> Can I open the window?</li>
            </ul>
          `,
        },
        {
          id: "form",
          title: "Формула",
          html: `
            <div class="theory-box">
              <p>can + V (без to!) → She can dance.</p>
              <p>can't / cannot + V → He can't drive.</p>
              <p>Can you help me?</p>
            </div>
          `,
        },
        {
          id: "examples",
          title: "Примеры",
          html: `
            <ul class="example-list">
              <li><span class="en">I can speak English.</span> <span class="ru">Я умею говорить по-английски.</span></li>
              <li><span class="en">She can't come today.</span> <span class="ru">Она не может прийти сегодня.</span></li>
              <li><span class="en">Can you repeat, please?</span> <span class="ru">Можешь повторить, пожалуйста?</span></li>
            </ul>
          `,
        },
        {
          id: "words",
          title: "Слова к теме",
          html: `
            <div class="word-chips">
              <span><strong>swim</strong> — плавать</span>
              <span><strong>dance</strong> — танцевать</span>
              <span><strong>help</strong> — помогать</span>
              <span><strong>speak</strong> — говорить</span>
              <span><strong>please</strong> — пожалуйста</span>
            </div>
          `,
        },
      ],
    },
    {
      id: "school-words",
      color: { main: "#5b8def", deep: "#3d6bc7", soft: "#e5eefc" },
      title: "Слова: школа и день",
      short: "Предметы, расписание и фразы, которые реально нужны в школе.",
      sections: [
        {
          id: "when",
          title: "Зачем эта тема",
          html: `
            <p>Лексика про школу помогает говорить о своём дне, уроках и друзьях — без «эээ… как это сказать?».</p>
          `,
        },
        {
          id: "form",
          title: "Полезные фразы",
          html: `
            <div class="theory-box">
              <p>What lessons do you have today?</p>
              <p>My favourite subject is English.</p>
              <p>I have homework in maths.</p>
              <p>Let's meet after school.</p>
            </div>
          `,
        },
        {
          id: "examples",
          title: "Примеры",
          html: `
            <ul class="example-list">
              <li><span class="en">I have PE on Fridays.</span> <span class="ru">У меня физкультура по пятницам.</span></li>
              <li><span class="en">The break is ten minutes.</span> <span class="ru">Перемена — десять минут.</span></li>
              <li><span class="en">Can I borrow a pen?</span> <span class="ru">Можно одолжить ручку?</span></li>
            </ul>
          `,
        },
        {
          id: "words",
          title: "Слова",
          html: `
            <div class="word-chips">
              <span><strong>lesson</strong> — урок</span>
              <span><strong>subject</strong> — предмет</span>
              <span><strong>homework</strong> — домашка</span>
              <span><strong>break</strong> — перемена</span>
              <span><strong>timetable</strong> — расписание</span>
              <span><strong>classmate</strong> — одноклассник</span>
              <span><strong>teacher</strong> — учитель</span>
              <span><strong>PE</strong> — физкультура</span>
              <span><strong>maths</strong> — математика</span>
              <span><strong>pencil case</strong> — пенал</span>
            </div>
          `,
        },
      ],
    },
  ],

  get(id) {
    return this.topics.find((t) => t.id === id) || null;
  },

  /** Прогресс темы по пройденным уровням тренажёра (0–100). */
  getProgress(topicId) {
    try {
      const store = window.LexiStore;
      if (!store) return 0;
      const user = store.currentUser?.();
      const raw = user?.path || store.getGuestPath?.() || {};
      const path = store.mergePath ? store.mergePath(raw) : raw;
      const prefix = `${topicId}-`;
      const keys = Object.keys(path).filter((k) => k.startsWith(prefix));
      if (!keys.length) return 0;
      const done = keys.filter((k) => path[k] === "done").length;
      return Math.round((done / keys.length) * 100);
    } catch {
      return 0;
    }
  },
};
