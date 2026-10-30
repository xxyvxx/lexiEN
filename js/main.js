(() => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");

  if (toggle && links) {
    const closeNav = () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeNav);
    });

    document.addEventListener("click", (event) => {
      if (!links.classList.contains("is-open")) return;
      if (toggle.contains(event.target) || links.contains(event.target)) return;
      closeNav();
    });
  }

  document.querySelectorAll("[data-tabs]").forEach((root) => {
    // вкладки этого блока (в т.ч. внутри sticky-обёртки), панели — прямые дети
    const tabsRow = root.querySelector(
      ":scope > .tabs, :scope > [role='tablist'], :scope > .trainer-tabs-sticky .tabs, :scope > .trainer-tabs-sticky [role='tablist']"
    );
    const tabs = tabsRow ? [...tabsRow.querySelectorAll("[data-tab]")] : [];
    const panels = [...root.querySelectorAll(":scope > [data-panel]")];

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.getAttribute("data-tab");
        tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
        panels.forEach((p) => {
          p.hidden = p.getAttribute("data-panel") !== id;
        });
      });
    });
  });
})();
