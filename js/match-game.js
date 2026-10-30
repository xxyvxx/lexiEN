(() => {
  const params = new URLSearchParams(location.search);
  const narrow = window.matchMedia("(max-width: 720px)").matches;

  let CELLS = Number(params.get("cards") || (narrow ? 9 : 12));
  if (CELLS !== 9 && CELLS !== 12) CELLS = narrow ? 9 : 12;
  // на очень узком экране принудительно 9, чтобы карточки были крупнее
  if (window.matchMedia("(max-width: 520px)").matches) CELLS = 9;

  const COLS = CELLS === 12 ? 4 : 3;
  const TARGET_SCORE = Math.min(30, Math.max(4, Number(params.get("pairs") || 12)));
  const minutes = Math.min(5, Math.max(1, Number(params.get("minutes") || 2)));

  const boardEl = document.querySelector("[data-match-board]");
  const scoreEl = document.querySelector("[data-match-score]");
  const goalEl = document.querySelector("[data-match-goal]");
  const statusEl = document.querySelector("[data-match-status]");
  const timerEl = document.querySelector("[data-match-timer]");
  const progressEl = document.querySelector("[data-match-progress]");
  const hintEl = document.querySelector("[data-match-hint]");
  const bodyWrap = document.querySelector("[data-match-body]");
  if (!boardEl) return;

  if (goalEl) goalEl.textContent = String(TARGET_SCORE);
  if (hintEl) {
    hintEl.hidden = true;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function buildPairPool() {
    const list = [];
    const push = (en, ru) => {
      const e = String(en || "").trim().toLowerCase();
      const r = String(ru || "").trim();
      if (!e || !r) return;
      if (e.split(/\s+/).length > 3) return;
      const ruShort = r.split("/")[0].trim();
      if (!ruShort || ruShort.length > 24) return;
      list.push({ en: e, ru: ruShort });
    };

    (window.LexiStore?.getReviewWords?.() || []).forEach((w) => push(w.word, w.translation));

    const map = window.LexiVocab?.map || {};
    const preferred = [
      "always", "usually", "often", "sometimes", "never", "happy", "tired", "hungry", "ready",
      "school", "home", "friend", "book", "music", "sport", "tea", "coffee", "bus", "cinema",
      "like", "play", "watch", "go", "eat", "drink", "read", "live", "walk", "take",
      "morning", "evening", "today", "tomorrow", "yesterday", "lesson", "homework", "teacher",
      "student", "parents", "sister", "brother", "english", "football", "chess", "pizza",
      "swim", "dance", "help", "speak", "break", "subject", "timetable", "classmate",
    ];
    preferred.forEach((en) => {
      if (map[en]) push(en, map[en]);
    });
    Object.entries(map).forEach(([en, ru]) => {
      if (en.length <= 12) push(en, ru);
    });

    const seen = new Set();
    const unique = [];
    list.forEach((p) => {
      if (seen.has(p.en)) return;
      seen.add(p.en);
      unique.push({ id: `p-${p.en}`, en: p.en, ru: p.ru });
    });
    return shuffle(unique);
  }

  const pool = buildPairPool();
  if (pool.length < 8) {
    boardEl.innerHTML = `<p class="muted">Мало слов для игры. Добавь слова в «Повторить» или открой уроки.</p>`;
    return;
  }

  /** @type {Array<null|{pairId:string,side:'en'|'ru',text:string,uid:string}>} */
  let cells = Array(CELLS).fill(null);
  let selected = [];
  let score = 0;
  let busy = false;
  let finished = false;
  let uidSeq = 0;
  let remaining = minutes * 60;
  let timerId = null;

  function makeCard(pair, side) {
    uidSeq += 1;
    return {
      pairId: pair.id,
      side,
      text: side === "en" ? pair.en : pair.ru,
      uid: `c-${uidSeq}`,
    };
  }

  function pairById(id) {
    return pool.find((p) => p.id === id);
  }

  function hasMatchablePair() {
    const map = {};
    cells.forEach((c) => {
      if (!c) return;
      (map[c.pairId] ||= new Set()).add(c.side);
    });
    return Object.values(map).some((set) => set.has("en") && set.has("ru"));
  }

  function orphans() {
    const map = {};
    cells.forEach((c, i) => {
      if (!c) return;
      (map[c.pairId] ||= { en: null, ru: null });
      map[c.pairId][c.side] = i;
    });
    return Object.entries(map)
      .filter(([, v]) => (v.en != null) !== (v.ru != null))
      .map(([pairId, v]) => ({
        pairId,
        missing: v.en == null ? "en" : "ru",
        presentIndex: v.en != null ? v.en : v.ru,
      }));
  }

  function cardsOnBoardTexts() {
    return new Set(cells.filter(Boolean).map((c) => `${c.pairId}:${c.side}`));
  }

  function pickCardForSlot() {
    const onBoard = cardsOnBoardTexts();
    const orphanList = orphans();

    if (orphanList.length && Math.random() < 0.55) {
      const o = orphanList[Math.floor(Math.random() * orphanList.length)];
      const pair = pairById(o.pairId);
      if (pair && !onBoard.has(`${pair.id}:${o.missing}`)) {
        return makeCard(pair, o.missing);
      }
    }

    const candidates = shuffle(pool).flatMap((p) => {
      const out = [];
      if (!onBoard.has(`${p.id}:en`)) out.push({ pair: p, side: "en" });
      if (!onBoard.has(`${p.id}:ru`)) out.push({ pair: p, side: "ru" });
      return out;
    });

    if (candidates.length) {
      const pick = candidates[0];
      return makeCard(pick.pair, pick.side);
    }

    const p = pool[Math.floor(Math.random() * pool.length)];
    return makeCard(p, Math.random() < 0.5 ? "en" : "ru");
  }

  function ensureMatchable() {
    if (hasMatchablePair()) return;

    const orphanList = orphans();
    if (orphanList.length) {
      const o = orphanList[0];
      const pair = pairById(o.pairId);
      if (!pair) return;
      const replaceable = cells
        .map((c, i) => ({ c, i }))
        .filter(({ c, i }) => c && i !== o.presentIndex && c.pairId !== o.pairId);
      const target = replaceable.length
        ? replaceable[Math.floor(Math.random() * replaceable.length)].i
        : cells.findIndex((c, i) => c && i !== o.presentIndex);
      if (target >= 0) cells[target] = makeCard(pair, o.missing);
      if (hasMatchablePair()) return;
    }

    const pair = pool[Math.floor(Math.random() * pool.length)];
    const idxs = shuffle(cells.map((_, i) => i)).slice(0, 2);
    cells[idxs[0]] = makeCard(pair, "en");
    cells[idxs[1]] = makeCard(pair, "ru");
  }

  function seedBoard() {
    cells = Array(CELLS).fill(null);
    const pairs = shuffle(pool);

    cells[0] = makeCard(pairs[0], "en");
    cells[1] = makeCard(pairs[0], "ru");
    if (pairs[1]) {
      cells[2] = makeCard(pairs[1], "en");
      cells[3] = makeCard(pairs[1], "ru");
    }

    for (let i = 0; i < CELLS; i++) {
      if (cells[i]) continue;
      const p = pairs[(i + 2) % pairs.length];
      const side = Math.random() < 0.5 ? "en" : "ru";
      if (cells.some((c) => c && c.pairId === p.id && c.side === side)) {
        const q = pairs[(i + 7) % pairs.length];
        cells[i] = makeCard(q, side === "en" ? "ru" : "en");
      } else {
        cells[i] = makeCard(p, side);
      }
    }

    cells = shuffle(cells);
    ensureMatchable();
  }

  function updateProgress() {
    if (progressEl) {
      progressEl.style.width = `${Math.min(100, Math.round((score / TARGET_SCORE) * 100))}%`;
    }
  }

  function updateChrome() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (statusEl) {
      statusEl.textContent = hasMatchablePair()
        ? "Найди пару: английский ↔ русский"
        : "Подселяем перевод…";
    }
    updateProgress();
  }

  function updateTimer() {
    if (!timerEl) return;
    timerEl.textContent = formatTime(remaining);
    timerEl.classList.toggle("exam-timer--low", remaining <= 30);
  }

  function paint() {
    boardEl.style.setProperty("--match-cols", String(COLS));
    boardEl.classList.toggle("match-game-board--12", CELLS === 12);
    boardEl.classList.toggle("match-game-board--9", CELLS === 9);
    boardEl.innerHTML = cells
      .map((c, i) => {
        if (!c) return `<div class="match-cell match-cell--empty" data-i="${i}"></div>`;
        const sel = selected.includes(i) ? " is-selected" : "";
        const lang = c.side === "en" ? "EN" : "RU";
        return `
          <button type="button" class="match-cell match-cell--${c.side}${sel}" data-i="${i}" data-uid="${c.uid}">
            <span class="match-cell__lang">${lang}</span>
            <span class="match-cell__text">${escapeHtml(c.text)}</span>
          </button>`;
      })
      .join("");
    updateChrome();
  }

  function clearSelection() {
    selected = [];
    paint();
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function finish(reason) {
    if (finished) return;
    finished = true;
    busy = true;
    stopTimer();

    const won = score >= TARGET_SCORE;
    let xpGain = 0;
    if (won) {
      if (minutes <= 1) xpGain = 20;
      else if (minutes <= 2) xpGain = 15;
      else xpGain = 10;
      LexiStore?.addXp?.(xpGain);
    } else if (score >= Math.ceil(TARGET_SCORE * 0.5)) {
      xpGain = 5;
      LexiStore?.addXp?.(xpGain);
    }

    if (progressEl) progressEl.style.width = won ? "100%" : progressEl.style.width;

    if (bodyWrap) {
      bodyWrap.innerHTML = `
        <div class="lesson-complete">
          <img src="../assets/${won ? "08_happy" : "06_crying"}.svg" alt="" />
          <h1>${won ? "Успел!" : reason === "time" ? "Время вышло" : "Раунд окончен"}</h1>
          <p class="muted">Пар: <strong>${score}</strong> из <strong>${TARGET_SCORE}</strong>${
            xpGain ? ` · <strong>+${xpGain} XP</strong>` : ""
          }</p>
          <div class="btn-row" style="justify-content:center;margin-top:1rem">
            <a class="btn btn--secondary" href="practice-match.html">Настройки</a>
            <a class="btn btn--primary" href="match.html?cards=${CELLS}&pairs=${TARGET_SCORE}&minutes=${minutes}">Ещё раз</a>
          </div>
        </div>`;
    }
  }

  function afterMatch(i, j) {
    cells[i] = null;
    cells[j] = null;
    score += 1;
    selected = [];
    paint();

    if (score >= TARGET_SCORE) {
      setTimeout(() => finish("done"), 280);
      return;
    }

    setTimeout(() => {
      const empties = cells.map((c, idx) => (c ? -1 : idx)).filter((idx) => idx >= 0);
      empties.forEach((idx) => {
        cells[idx] = pickCardForSlot();
      });
      ensureMatchable();
      busy = false;
      paint();
    }, 260);
  }

  function tryMatch() {
    if (selected.length < 2) return;
    const [i, j] = selected;
    const a = cells[i];
    const b = cells[j];
    if (!a || !b) {
      clearSelection();
      return;
    }

    const ok = a.pairId === b.pairId && a.side !== b.side;
    if (ok) {
      busy = true;
      boardEl.querySelector(`[data-i="${i}"]`)?.classList.add("is-matched");
      boardEl.querySelector(`[data-i="${j}"]`)?.classList.add("is-matched");
      setTimeout(() => afterMatch(i, j), 300);
    } else {
      boardEl.querySelector(`[data-i="${i}"]`)?.classList.add("is-wrong");
      boardEl.querySelector(`[data-i="${j}"]`)?.classList.add("is-wrong");
      busy = true;
      setTimeout(() => {
        busy = false;
        clearSelection();
      }, 400);
    }
  }

  boardEl.addEventListener("click", (e) => {
    if (busy || finished) return;
    const btn = e.target.closest(".match-cell[data-i]");
    if (!btn || btn.classList.contains("match-cell--empty")) return;
    const i = Number(btn.dataset.i);
    if (!cells[i]) return;

    if (selected.includes(i)) {
      selected = selected.filter((x) => x !== i);
      paint();
      return;
    }
    if (selected.length >= 2) return;
    selected.push(i);
    paint();
    if (selected.length === 2) tryMatch();
  });

  seedBoard();
  paint();
  updateTimer();
  timerId = setInterval(() => {
    if (finished) return;
    remaining -= 1;
    updateTimer();
    if (remaining <= 0) finish("time");
  }, 1000);
})();
