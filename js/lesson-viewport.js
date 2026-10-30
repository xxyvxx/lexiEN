/**
 * iOS Safari: клавиатура ломает 100dvh + overflow:hidden —
 * шапка уезжает вверх, внизу белая дыра, скролл клинит.
 * Синхронизируем оболочку с visualViewport.
 */
(() => {
  const shell = document.querySelector(".lesson-shell");
  if (!shell) return;

  const root = document.documentElement;
  let ticking = false;

  function sync() {
    const vv = window.visualViewport;
    const height = Math.round(vv?.height || window.innerHeight || root.clientHeight);
    const offsetTop = Math.round(vv?.offsetTop || 0);

    root.style.setProperty("--vvh", `${height}px`);
    shell.style.height = `${height}px`;
    shell.style.maxHeight = `${height}px`;
    shell.style.transform = offsetTop ? `translate3d(0, ${offsetTop}px, 0)` : "";

    if (window.scrollY || window.scrollX || root.scrollTop || document.body.scrollTop) {
      window.scrollTo(0, 0);
      root.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    const body = shell.querySelector(".lesson-body");
    if (body && offsetTop === 0 && body.scrollTop < 0) body.scrollTop = 0;
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      sync();
    });
  }

  /** Сброс после закрытия клавиатуры / смены задания. */
  window.LexiViewport = {
    sync,
    reset() {
      const active = document.activeElement;
      if (active && active !== document.body && typeof active.blur === "function") {
        const tag = active.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") active.blur();
      }
      window.scrollTo(0, 0);
      root.scrollTop = 0;
      document.body.scrollTop = 0;
      const body = shell.querySelector(".lesson-body");
      if (body) body.scrollTop = 0;
      sync();
      setTimeout(sync, 50);
      setTimeout(sync, 300);
    },
  };

  sync();
  window.addEventListener("resize", schedule);
  window.addEventListener("orientationchange", () => setTimeout(sync, 100));
  window.visualViewport?.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("scroll", schedule);

  document.addEventListener(
    "focusout",
    () => {
      setTimeout(sync, 50);
      setTimeout(sync, 350);
    },
    true
  );

  document.addEventListener(
    "focusin",
    (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.matches("input, textarea")) schedule();
    },
    true
  );
})();
