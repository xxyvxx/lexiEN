/**
 * Свайп и тапы по краям для flash-карточек (мышь + сенсор).
 * Центр карточки — переворот; свайп / края / кнопки — ответ.
 */
window.LexiCardGestures = {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.card
   * @param {HTMLElement} [opts.stage]
   * @param {() => boolean} [opts.isBusy]
   * @param {() => boolean} [opts.hasCard]
   * @param {() => void} opts.onFlip
   * @param {(knows: boolean) => void} opts.onAnswer
   * @param {number} [opts.threshold]
   */
  bind(opts) {
    const card = opts.card;
    const stage = opts.stage || card?.parentElement;
    if (!card) return () => {};

    const threshold = opts.threshold ?? 64;
    const isBusy = () => (opts.isBusy ? opts.isBusy() : false);
    const hasCard = () => (opts.hasCard ? opts.hasCard() : true);

    let startX = 0;
    let startY = 0;
    let dragging = false;
    let moved = false;
    let pointerId = null;
    let suppressClick = false;

    function pointFrom(e) {
      if (e.touches && e.touches[0]) return e.touches[0];
      if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0];
      return e;
    }

    function resetLean() {
      card.classList.remove("is-dragging", "is-lean-yes", "is-lean-no");
      card.style.transition = "transform 0.22s ease";
      card.style.transform = "";
    }

    function onPointerDown(e) {
      if (isBusy() || !hasCard()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      moved = false;
      const p = pointFrom(e);
      startX = p.clientX;
      startY = p.clientY;
      card.classList.add("is-dragging");
      card.style.transition = "none";
      if (e.pointerId != null && card.setPointerCapture) {
        pointerId = e.pointerId;
        try {
          card.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const p = pointFrom(e);
      const dx = p.clientX - startX;
      const dy = p.clientY - startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 28) return;
      if (e.cancelable) e.preventDefault();
      const rot = dx / 18;
      card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
      card.classList.toggle("is-lean-yes", dx > 36);
      card.classList.toggle("is-lean-no", dx < -36);
    }

    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      const p = pointFrom(e);
      const dx = p.clientX - startX;
      card.classList.remove("is-dragging", "is-lean-yes", "is-lean-no");
      if (pointerId != null && card.releasePointerCapture) {
        try {
          card.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }
        pointerId = null;
      }
      if (moved && dx > threshold) {
        suppressClick = true;
        opts.onAnswer(true);
        return;
      }
      if (moved && dx < -threshold) {
        suppressClick = true;
        opts.onAnswer(false);
        return;
      }
      resetLean();
    }

    function onClick(e) {
      if (e.target.closest(".cards-action, .cards-edge, [data-flip-dir]")) return;
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (isBusy() || !hasCard()) return;
      opts.onFlip();
    }

    function onKey(e) {
      if (isBusy() || !hasCard()) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        opts.onFlip();
      }
      if (e.key === "ArrowRight") opts.onAnswer(true);
      if (e.key === "ArrowLeft") opts.onAnswer(false);
    }

    card.addEventListener("pointerdown", onPointerDown);
    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerup", onPointerUp);
    card.addEventListener("pointercancel", onPointerUp);
    card.addEventListener("click", onClick);
    card.addEventListener("keydown", onKey);

    // Fallback для старых WebView без Pointer Events
    card.addEventListener(
      "touchstart",
      (e) => {
        if (window.PointerEvent) return;
        onPointerDown(e);
      },
      { passive: true }
    );
    card.addEventListener(
      "touchmove",
      (e) => {
        if (window.PointerEvent) return;
        onPointerMove(e);
      },
      { passive: false }
    );
    card.addEventListener("touchend", (e) => {
      if (window.PointerEvent) return;
      onPointerUp(e);
    });

    const edgeNo = stage?.querySelector("[data-edge-no]");
    const edgeYes = stage?.querySelector("[data-edge-yes]");
    const onEdgeNo = (e) => {
      e.preventDefault();
      if (isBusy() || !hasCard()) return;
      opts.onAnswer(false);
    };
    const onEdgeYes = (e) => {
      e.preventDefault();
      if (isBusy() || !hasCard()) return;
      opts.onAnswer(true);
    };
    edgeNo?.addEventListener("click", onEdgeNo);
    edgeYes?.addEventListener("click", onEdgeYes);

    return () => {
      card.removeEventListener("pointerdown", onPointerDown);
      card.removeEventListener("pointermove", onPointerMove);
      card.removeEventListener("pointerup", onPointerUp);
      card.removeEventListener("pointercancel", onPointerUp);
      card.removeEventListener("click", onClick);
      card.removeEventListener("keydown", onKey);
      edgeNo?.removeEventListener("click", onEdgeNo);
      edgeYes?.removeEventListener("click", onEdgeYes);
    };
  },
};
