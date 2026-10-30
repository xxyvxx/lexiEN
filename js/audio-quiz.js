(() => {
  const progressEl = document.querySelector("[data-audio-progress]");
  const countEl = document.querySelector("[data-audio-count]");
  const statusEl = document.querySelector("[data-audio-status]");
  const playBtn = document.querySelector("[data-audio-play]");
  const playLabel = document.querySelector("[data-audio-play-label]");
  const choiceBtns = [...document.querySelectorAll("[data-choice]")];
  const feedbackEl = document.querySelector("[data-audio-feedback]");
  const body = document.querySelector(".audio-body");
  const titleEl = document.querySelector("[data-audio-title]");

  if (!window.LexiAudioQuiz || !choiceBtns.length) return;

  const params = new URLSearchParams(location.search);
  const soundId = params.get("sound") || null;
  const modeAll = params.get("mode") === "all" || !soundId;
  const count = Math.min(20, Math.max(4, Number(params.get("count")) || (modeAll ? 12 : 8)));
  const sound = soundId ? LexiAudioQuiz.getSound(soundId) : null;

  if (soundId && !sound) {
    body.innerHTML = `
      <div class="lesson-complete">
        <h1>Звук не найден</h1>
        <a class="btn btn--primary" href="practice-audio.html">К звукам</a>
      </div>`;
    return;
  }

  if (titleEl) {
    titleEl.textContent = sound ? `${sound.ipa} · ${sound.example}` : "Общий тест";
  }

  const closeLink = document.querySelector(".lesson-close");
  if (closeLink) closeLink.setAttribute("href", "practice-audio.html");

  const round = LexiAudioQuiz.pickRound({
    soundId: modeAll ? null : soundId,
    count,
  });
  const total = round.length;

  let index = 0;
  let correct = 0;
  let locked = false;
  function shuffleTwo(a, b) {
    return Math.random() < 0.5 ? [a, b] : [b, a];
  }

  function speak(word, fromUser = false) {
    if (!window.LexiSpeak?.isSupported?.() && !window.speechSynthesis) {
      if (statusEl) statusEl.textContent = "Озвучка недоступна — выбери написание на слух по памяти.";
      return;
    }
    if (window.LexiSpeak?.isSupported?.()) {
      const ok = window.LexiSpeak.speak(word, { rate: 0.9, fromUser });
      if (!ok && statusEl) {
        statusEl.textContent = "Нажми «Слушать»";
      } else if (statusEl && fromUser) {
        statusEl.textContent = "Слушай и выбери написание";
      }
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  function updateChrome() {
    const left = Math.max(0, total - index);
    if (countEl) countEl.textContent = String(left);
    if (progressEl) {
      const pct = total ? Math.round((index / total) * 100) : 0;
      progressEl.style.width = `${pct}%`;
    }
  }

  function current() {
    return round[index] || null;
  }

  function paint() {
    const item = current();
    if (!item) return finish();
    locked = false;
    if (feedbackEl) {
      feedbackEl.hidden = true;
      feedbackEl.textContent = "";
      feedbackEl.className = "audio-feedback muted";
    }
    if (statusEl) statusEl.textContent = "Слушай и выбери написание";
    if (playLabel) playLabel.textContent = "Слушать";

    const opts = shuffleTwo(item.answer, item.decoy);
    choiceBtns.forEach((btn, i) => {
      btn.disabled = false;
      btn.className = "audio-choice";
      btn.textContent = opts[i];
      btn.dataset.word = opts[i];
    });

    updateChrome();
    window.setTimeout(() => {
      if (window.LexiSpeak?.isUnlocked?.()) speak(item.answer, false);
      else if (statusEl) statusEl.textContent = "Нажми «Слушать»";
    }, 220);
  }

  function finish() {
    locked = true;
    if (window.LexiSpeak?.cancel) window.LexiSpeak.cancel();
    else window.speechSynthesis?.cancel();
    if (progressEl) progressEl.style.width = "100%";
    if (countEl) countEl.textContent = "0";
    const againHref = sound
      ? `audio.html?sound=${encodeURIComponent(sound.id)}&count=8`
      : "audio.html?mode=all&count=12";
    if (body) {
      body.innerHTML = `
        <div class="lesson-complete">
          <img src="../assets/08_happy.svg" alt="" />
          <h1>Раунд завершён</h1>
          <p class="muted">Верно: <strong>${correct} из ${total}</strong>${
            sound ? ` · звук ${sound.ipa}` : ""
          }</p>
          <a class="btn btn--primary" href="${againHref}">Ещё раз</a>
          <a class="btn btn--secondary" href="practice-audio.html">К звукам</a>
        </div>`;
    }
  }

  function onChoose(word) {
    if (locked) return;
    const item = current();
    if (!item) return;
    locked = true;
    const ok = word === item.answer;
    const sid = item.soundId || soundId;

    if (sid && window.LexiStore?.recordAudioAnswer) {
      LexiStore.recordAudioAnswer(sid, ok);
    }

    choiceBtns.forEach((btn) => {
      btn.disabled = true;
      const w = btn.dataset.word;
      if (w === item.answer) btn.classList.add("is-correct");
      else if (w === word && !ok) btn.classList.add("is-wrong");
    });

    if (ok) {
      correct += 1;
      if (feedbackEl) {
        feedbackEl.hidden = false;
        feedbackEl.className = "audio-feedback audio-feedback--ok";
        feedbackEl.textContent = item.ru ? `Верно · ${item.ru}` : "Верно";
      }
    } else if (feedbackEl) {
      feedbackEl.hidden = false;
      feedbackEl.className = "audio-feedback audio-feedback--bad";
      feedbackEl.textContent = `Правильно: ${item.answer}${item.ru ? ` · ${item.ru}` : ""}`;
    }

    window.setTimeout(() => {
      index += 1;
      paint();
    }, ok ? 750 : 1100);
  }

  playBtn?.addEventListener("click", () => {
    const item = current();
    if (!item) return;
    if (playLabel) playLabel.textContent = "Ещё раз";
    speak(item.answer, true);
  });

  choiceBtns.forEach((btn) => {
    btn.addEventListener("click", () => onChoose(btn.dataset.word));
  });

  if (!window.LexiSpeak?.isSupported?.() && !window.speechSynthesis && statusEl) {
    statusEl.textContent = "Браузер без озвучки — всё равно можно выбирать написание.";
  } else if (statusEl && window.LexiSpeak && !window.LexiSpeak.isUnlocked?.()) {
    statusEl.textContent = "Нажми «Слушать»";
  }

  if (!total) {
    body.innerHTML = `
      <div class="lesson-complete">
        <h1>Нет заданий</h1>
        <a class="btn btn--primary" href="practice-audio.html">Назад</a>
      </div>`;
    return;
  }

  paint();
})();
