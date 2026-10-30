/**
 * Единая озвучка EN для всех устройств (iOS Safari / Android Chrome / desktop).
 * Web Speech API: голоса ОС; на iPhone нужен первый тап и обход известных багов.
 */
window.LexiSpeak = (() => {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  let voice = null;
  let unlocked = false;
  let resumeTimer = null;
  let speakToken = 0;

  function isSupported() {
    return !!(synth && typeof window.SpeechSynthesisUtterance === "function");
  }

  function scoreVoice(v) {
    const lang = String(v.lang || "");
    const name = String(v.name || "");
    let score = 0;
    if (/^en(-|_)/i.test(lang)) score += 50;
    else if (/^en/i.test(lang)) score += 30;
    else return -1;
    if (/en-US/i.test(lang)) score += 20;
    else if (/en-GB|en-AU|en-IE/i.test(lang)) score += 12;
    if (/Samantha|Karen|Daniel|Moira|Google US|Google UK|Microsoft (Aria|Jenny|Guy|Zira)|Enhanced|Premium|Neural/i.test(name)) {
      score += 25;
    }
    if (v.localService) score += 5;
    if (/compact/i.test(name)) score -= 8;
    return score;
  }

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices?.() || [];
    if (!voices.length) return;
    let best = null;
    let bestScore = -1;
    for (const v of voices) {
      const s = scoreVoice(v);
      if (s > bestScore) {
        bestScore = s;
        best = v;
      }
    }
    voice = bestScore >= 0 ? best : null;
  }

  function stopResumeWatch() {
    if (resumeTimer) {
      clearInterval(resumeTimer);
      resumeTimer = null;
    }
  }

  function startResumeWatch() {
    stopResumeWatch();
    // iOS иногда «замирает» mid-utterance — resume раз в ~8–10 с.
    resumeTimer = window.setInterval(() => {
      if (!synth) return;
      if (synth.speaking && !synth.paused) {
        try {
          synth.resume();
        } catch (_) {
          /* ignore */
        }
      }
      if (!synth.speaking && !synth.pending) stopResumeWatch();
    }, 8000);
  }

  function cancel() {
    speakToken += 1;
    stopResumeWatch();
    if (!synth) return;
    try {
      synth.cancel();
    } catch (_) {
      /* ignore */
    }
  }

  /**
   * Разблокировка звука после жеста пользователя (обязательно для iPhone).
   */
  function unlock() {
    if (!isSupported() || unlocked) return unlocked;
    unlocked = true;
    pickVoice();
    try {
      // Тихий «прогрев» — без него первый speak на iOS часто молчит.
      const warm = new SpeechSynthesisUtterance(" ");
      warm.volume = 0;
      warm.rate = 1;
      warm.lang = voice?.lang || "en-US";
      if (voice) warm.voice = voice;
      synth.speak(warm);
      synth.cancel();
    } catch (_) {
      /* ignore */
    }
    return true;
  }

  function ensureUnlockListeners() {
    if (!isSupported()) return;
    const once = () => {
      unlock();
      document.removeEventListener("pointerdown", once, true);
      document.removeEventListener("touchstart", once, true);
      document.removeEventListener("click", once, true);
      document.removeEventListener("keydown", once, true);
    };
    document.addEventListener("pointerdown", once, true);
    document.addEventListener("touchstart", once, { capture: true, passive: true });
    document.addEventListener("click", once, true);
    document.addEventListener("keydown", once, true);
  }

  function speak(text, opts = {}) {
    const str = String(text || "").trim();
    if (!str) return false;
    if (!isSupported()) return false;

    if (opts.fromUser !== false) unlock();
    pickVoice();

    const token = ++speakToken;
    const rate = typeof opts.rate === "number" ? opts.rate : 0.92;
    const lang = opts.lang || voice?.lang || "en-US";

    const run = () => {
      if (token !== speakToken) return;
      try {
        // iOS: cancel() сразу перед speak() часто глотает фразу — пауза помогает.
        try {
          synth.cancel();
        } catch (_) {
          /* ignore */
        }
        window.setTimeout(() => {
          if (token !== speakToken) return;
          const u = new SpeechSynthesisUtterance(str);
          u.lang = lang;
          u.rate = rate;
          u.pitch = 1;
          u.volume = 1;
          if (voice) u.voice = voice;
          u.onstart = () => startResumeWatch();
          u.onend = () => stopResumeWatch();
          u.onerror = () => stopResumeWatch();
          try {
            synth.resume();
          } catch (_) {
            /* ignore */
          }
          synth.speak(u);
        }, 40);
      } catch (_) {
        /* ignore */
      }
    };

    if (!unlocked && opts.requireUnlock) {
      // Без жеста на iOS не запустится — вызывающий код покажет «Нажми Слушать».
      return false;
    }

    run();
    return true;
  }

  if (isSupported()) {
    pickVoice();
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", pickVoice);
    } else {
      synth.onvoiceschanged = pickVoice;
    }
    // Голоса на части браузеров подгружаются с задержкой.
    window.setTimeout(pickVoice, 250);
    window.setTimeout(pickVoice, 1000);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ensureUnlockListeners);
    } else {
      ensureUnlockListeners();
    }
  }

  return {
    isSupported,
    unlock,
    isUnlocked: () => unlocked,
    cancel,
    speak,
    getVoiceName: () => voice?.name || null,
  };
})();
