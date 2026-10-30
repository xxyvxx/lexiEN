/**
 * Рассказы для практики чтения.
 * glossary — доп. переводы слов, которых может не быть в общем словаре.
 */
window.LexiStories = {
  topics: [
    { id: "school", title: "Школа", desc: "Уроки, друзья, первый день" },
    { id: "home", title: "Дом и семья", desc: "Утро, семья, привычки" },
    { id: "city", title: "Город", desc: "Прогулки, транспорт, места" },
    { id: "animals", title: "Животные", desc: "Питомцы и природа" },
  ],

  stories: [
    {
      id: "first-day",
      topic: "school",
      title: "My first day at school",
      level: "A1",
      minutes: 2,
      paragraphs: [
        "Today is my first day at school. I get up early and put on my new clothes.",
        "I take the bus with my mum. The school is big and friendly.",
        "My teacher smiles and says hello. I meet a girl. Her name is Mia.",
        "We like English class. After school I tell my family about my day.",
      ],
      translation: [
        "Сегодня мой первый день в школе. Я встаю рано и надеваю новую одежду.",
        "Я еду на автобусе с мамой. Школа большая и дружелюбная.",
        "Моя учительница улыбается и говорит «привет». Я знакомлюсь с девочкой. Её зовут Миа.",
        "Нам нравится урок английского. После школы я рассказываю семье о своём дне.",
      ],
      glossary: {
        clothes: "одежда",
        friendly: "дружелюбный",
        smiles: "улыбается",
        meet: "знакомлюсь / встречаю",
        tell: "рассказывать",
        family: "семья",
      },
      quiz: [
        {
          question: "When does the story happen?",
          options: ["At night", "On the first day at school", "In the summer holidays"],
          answer: "On the first day at school",
        },
        {
          question: "How does the student go to school?",
          options: ["By bus", "By bike", "On foot"],
          answer: "By bus",
        },
        {
          question: "Who does the student meet?",
          options: ["A boy named Tom", "A girl named Mia", "The head teacher"],
          answer: "A girl named Mia",
        },
      ],
    },
    {
      id: "english-class",
      topic: "school",
      title: "In English class",
      level: "A1–A2",
      minutes: 2,
      paragraphs: [
        "Our English lesson starts at nine. We open our books and listen to the teacher.",
        "Today we learn new words about school. I write them in my notebook.",
        "Then we work in pairs. I ask my friend: \"Do you like reading?\" He says yes.",
        "At the end we play a short game. I feel happy because I understand a lot.",
      ],
      translation: [
        "Наш урок английского начинается в девять. Мы открываем книги и слушаем учителя.",
        "Сегодня мы учим новые слова про школу. Я записываю их в тетрадь.",
        "Потом мы работаем в парах. Я спрашиваю друга: «Тебе нравится читать?» Он говорит «да».",
        "В конце мы играем в короткую игру. Я чувствую себя счастливым, потому что многое понимаю.",
      ],
      glossary: {
        lesson: "урок",
        notebook: "тетрадь",
        pairs: "пары",
        reading: "чтение",
        understand: "понимать",
        because: "потому что",
      },
      quiz: [
        {
          question: "What time does the lesson start?",
          options: ["At eight", "At nine", "At ten"],
          answer: "At nine",
        },
        {
          question: "Where does the student write new words?",
          options: ["On the board", "In a notebook", "On a phone"],
          answer: "In a notebook",
        },
        {
          question: "How does the student feel at the end?",
          options: ["Bored", "Angry", "Happy"],
          answer: "Happy",
        },
      ],
    },
    {
      id: "sunday-morning",
      topic: "home",
      title: "Sunday morning",
      level: "A1",
      minutes: 2,
      paragraphs: [
        "On Sunday I do not go to school. I sleep longer and then have breakfast with my family.",
        "My dad makes tea. My little brother watches cartoons.",
        "After breakfast I help my mum. We clean the kitchen together.",
        "In the afternoon I call my friend. We talk about our plans for the week.",
      ],
      translation: [
        "В воскресенье я не иду в школу. Я сплю дольше, а потом завтракаю с семьёй.",
        "Папа готовит чай. Мой младший брат смотрит мультики.",
        "После завтрака я помогаю маме. Мы вместе убираем кухню.",
        "Днём я звоню другу. Мы говорим о планах на неделю.",
      ],
      glossary: {
        sunday: "воскресенье",
        longer: "дольше",
        breakfast: "завтрак",
        cartoons: "мультики",
        clean: "убирать / чистить",
        kitchen: "кухня",
        afternoon: "день (после полудня)",
        plans: "планы",
        week: "неделя",
      },
      quiz: [
        {
          question: "Does the student go to school on Sunday?",
          options: ["Yes", "No", "Only in the morning"],
          answer: "No",
        },
        {
          question: "Who makes tea?",
          options: ["Mum", "Dad", "The brother"],
          answer: "Dad",
        },
        {
          question: "What do they clean?",
          options: ["The kitchen", "The garden", "The classroom"],
          answer: "The kitchen",
        },
      ],
    },
    {
      id: "bus-to-park",
      topic: "city",
      title: "A trip to the park",
      level: "A2",
      minutes: 3,
      paragraphs: [
        "After school I take the bus to the city park. The bus is full, but I find a seat near the window.",
        "I look at the streets and shops. Many people walk quickly. Some wait at the traffic lights.",
        "In the park I meet my cousin. We sit on a bench and eat an apple.",
        "Before I go home, we take photos near the fountain. It is a nice quiet evening.",
      ],
      translation: [
        "После школы я еду на автобусе в городской парк. Автобус полный, но я нахожу место у окна.",
        "Я смотрю на улицы и магазины. Многие люди идут быстро. Некоторые ждут у светофора.",
        "В парке я встречаю двоюродного брата/сестру. Мы сидим на скамейке и едим яблоко.",
        "Перед тем как идти домой, мы фотографируемся у фонтана. Это тихий приятный вечер.",
      ],
      glossary: {
        trip: "поездка / прогулка",
        park: "парк",
        full: "полный",
        seat: "место (сиденье)",
        streets: "улицы",
        shops: "магазины",
        quickly: "быстро",
        traffic: "дорожное движение",
        lights: "огни / светофор",
        cousin: "двоюродный брат / сестра",
        bench: "скамейка",
        apple: "яблоко",
        photos: "фотографии",
        fountain: "фонтан",
        quiet: "тихий",
        evening: "вечер",
      },
      quiz: [
        {
          question: "Where does the student go?",
          options: ["To the library", "To the city park", "To the cinema"],
          answer: "To the city park",
        },
        {
          question: "Who does the student meet in the park?",
          options: ["A teacher", "A cousin", "A neighbour"],
          answer: "A cousin",
        },
        {
          question: "What do they eat?",
          options: ["An apple", "A sandwich", "Ice cream"],
          answer: "An apple",
        },
      ],
    },
    {
      id: "my-dog",
      topic: "animals",
      title: "My dog Leo",
      level: "A1",
      minutes: 2,
      paragraphs: [
        "I have a dog. His name is Leo. He is small and brown.",
        "Every morning Leo waits by the door. He wants to go for a walk.",
        "In the park he runs and plays with a ball. Sometimes he swims in the lake.",
        "At home Leo sleeps near my bed. He is my best friend.",
      ],
      translation: [
        "У меня есть собака. Его зовут Лео. Он маленький и коричневый.",
        "Каждое утро Лео ждёт у двери. Он хочет пойти на прогулку.",
        "В парке он бегает и играет с мячом. Иногда он плавает в озере.",
        "Дома Лео спит рядом с моей кроватью. Он мой лучший друг.",
      ],
      glossary: {
        brown: "коричневый",
        waits: "ждёт",
        door: "дверь",
        walk: "прогулка",
        runs: "бегает",
        ball: "мяч",
        swims: "плавает",
        lake: "озеро",
        sleeps: "спит",
        near: "рядом",
        bed: "кровать",
        best: "лучший",
      },
      quiz: [
        {
          question: "What is the dog's name?",
          options: ["Max", "Leo", "Rex"],
          answer: "Leo",
        },
        {
          question: "What does Leo want every morning?",
          options: ["Food only", "A walk", "A bath"],
          answer: "A walk",
        },
        {
          question: "Where does Leo sleep?",
          options: ["In the garden", "Near the bed", "In the kitchen"],
          answer: "Near the bed",
        },
      ],
    },
  ],

  getTopics() {
    return this.topics || [];
  },

  getStory(id) {
    return (this.stories || []).find((s) => s.id === id) || null;
  },

  getStoriesByTopics(topicIds) {
    const all = this.stories || [];
    if (!topicIds || !topicIds.length) return all;
    const set = new Set(topicIds);
    return all.filter((s) => set.has(s.topic));
  },

  topicTitle(id) {
    return this.topics.find((t) => t.id === id)?.title || id;
  },
};
