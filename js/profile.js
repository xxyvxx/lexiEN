(() => {
  const store = window.LexiStore;
  store.seedDemo();

  const loginView = document.querySelector("[data-view-login]");
  const registerView = document.querySelector("[data-view-register]");
  const profileView = document.querySelector("[data-view-profile]");
  const settingsView = document.querySelector("[data-view-settings]");

  const loginForm = document.querySelector("[data-form-login]");
  const registerForm = document.querySelector("[data-form-register]");
  const settingsForm = document.querySelector("[data-form-settings]");
  const loginError = document.querySelector("[data-login-error]");
  const registerError = document.querySelector("[data-register-error]");
  const settingsError = document.querySelector("[data-settings-error]");

  function showError(el, message) {
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  }

  function setView(mode) {
    if (loginView) loginView.hidden = mode !== "login";
    if (registerView) registerView.hidden = mode !== "register";
    if (profileView) profileView.hidden = mode !== "profile";
    if (settingsView) settingsView.hidden = mode !== "settings";
  }

  function levelLabel(level) {
    const map = {
      A1: "A1 · начинающий",
      A2: "A2 · базовый",
      B1: "B1 · средний",
      B2: "B2 · выше среднего",
    };
    return map[level] || level;
  }

  const avatarModal = document.querySelector("[data-avatar-modal]");
  const avatarPreview = document.querySelector("[data-avatar-preview]");
  const avatarDogsRoot = document.querySelector("[data-avatar-dogs]");
  const avatarError = document.querySelector("[data-avatar-error]");
  const avatarFileInput = document.querySelector("[data-avatar-file]");
  let draftAvatar = store.normalizeAvatar?.(store.DEFAULT_AVATAR) || { kind: "dog", id: "08_happy" };

  function applyAvatarToImg(img, avatar) {
    if (!img) return;
    const a = store.normalizeAvatar(avatar);
    img.src = store.avatarSrc(a, "../assets");
    img.classList.toggle("is-upload", a.kind === "upload");
    img.classList.toggle("emoji-dog", a.kind === "dog");
  }

  function syncAvatarImgs(avatar) {
    document.querySelectorAll("[data-profile-avatar]").forEach((img) => applyAvatarToImg(img, avatar));
    applyAvatarToImg(avatarPreview, avatar);
  }

  function markSelectedDog(id) {
    avatarDogsRoot?.querySelectorAll("[data-dog-id]").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.getAttribute("data-dog-id") === id);
    });
  }

  function setDraftAvatar(avatar) {
    draftAvatar = store.normalizeAvatar(avatar);
    applyAvatarToImg(avatarPreview, draftAvatar);
    markSelectedDog(draftAvatar.kind === "dog" ? draftAvatar.id : "");
    showError(avatarError, "");
  }

  function renderDogGrid() {
    if (!avatarDogsRoot) return;
    const dogs = store.DOG_AVATARS || [];
    avatarDogsRoot.innerHTML = dogs
      .map(
        (dog) => `
      <button type="button" class="avatar-dog" data-dog-id="${dog.id}" title="${dog.label}">
        <img src="${store.dogAvatarSrc(dog.id, "../assets")}" alt="" />
        <span>${dog.label}</span>
      </button>`
      )
      .join("");
  }

  function openAvatarModal() {
    const user = store.currentUser();
    if (!user) return;
    showError(avatarError, "");
    setDraftAvatar(user.avatar || store.DEFAULT_AVATAR);
    if (avatarModal) avatarModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeAvatarModal() {
    if (avatarModal) avatarModal.hidden = true;
    const hintsOpen = document.querySelector("[data-hints-modal]");
    if (!hintsOpen || hintsOpen.hidden) document.body.classList.remove("modal-open");
    if (avatarFileInput) avatarFileInput.value = "";
  }

  function readFileAsImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Выбери изображение (JPG, PNG, WebP)"));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error("Файл слишком большой — до 8 МБ"));
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Не удалось прочитать фото"));
      };
      img.src = url;
    });
  }

  function compressToDataUrl(img, maxSide = 320, quality = 0.82) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  }

  function renderProfile(user) {
    const nameEl = document.querySelector("[data-profile-name]");
    const metaEl = document.querySelector("[data-profile-meta]");
    if (nameEl) nameEl.textContent = user.name || user.login;
    if (metaEl) {
      metaEl.textContent = `${user.age} лет · ${user.grade} класс · ${levelLabel(user.level)}`;
    }
    syncAvatarImgs(user.avatar || store.DEFAULT_AVATAR);

    const xp = document.querySelector('[data-stat="xp"]');
    const streak = document.querySelector('[data-stat="streak"]');
    const lessons = document.querySelector('[data-stat="lessons"]');
    const progressRing = document.querySelector('[data-stat="progress"]');
    const progressPct = document.querySelector("[data-progress-pct]");
    if (xp) xp.textContent = user.xp ?? 0;
    if (streak) streak.textContent = user.streak ?? 0;
    if (lessons) lessons.textContent = user.lessonsDone ?? 0;
    const course = store.getCourseProgress?.() || { percent: 0, done: 0, total: 0 };
    if (progressRing) {
      progressRing.style.setProperty("--pct", String(course.percent));
      progressRing.setAttribute(
        "aria-label",
        `Прогресс курса: ${course.percent}% (${course.done} из ${course.total})`
      );
    }
    if (progressPct) progressPct.textContent = `${course.percent}%`;

    const hints = Math.max(0, Number(user.hints) || 0);
    document.querySelectorAll("[data-hints-count], [data-hints-modal-count]").forEach((el) => {
      el.textContent = String(hints);
    });
    const xpModal = document.querySelector("[data-hints-modal-xp]");
    if (xpModal) xpModal.textContent = String(user.xp ?? 0);

    const dictCount = document.querySelector("[data-dict-count]");
    if (dictCount) {
      const total = store.getDictionaryStats?.()?.total ?? store.getDictionary?.()?.length ?? 0;
      dictCount.textContent = String(total);
    }

    if (settingsForm) {
      settingsForm.name.value = user.name || "";
      settingsForm.age.value = user.age || "";
      settingsForm.grade.value = user.grade || "";
      settingsForm.level.value = user.level || "A1";
    }
  }

  function renderHintPacks() {
    const root = document.querySelector("[data-hint-packs]");
    if (!root) return;
    const packs = store.HINT_PACKS || [];
    const xpNow = store.getXp?.() ?? 0;
    root.innerHTML = packs
      .map((pack) => {
        const can = xpNow >= pack.xp;
        return `
          <button type="button" class="hint-pack ${can ? "" : "is-disabled"}" data-buy-pack="${pack.id}" ${
            can ? "" : "disabled"
          }>
            <span class="hint-pack__title">${pack.title}</span>
            <span class="hint-pack__price">${pack.xp} XP</span>
          </button>`;
      })
      .join("");
  }

  function openHintsModal() {
    const modal = document.querySelector("[data-hints-modal]");
    const err = document.querySelector("[data-hints-error]");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    const user = store.currentUser();
    if (user) renderProfile(user);
    renderHintPacks();
    if (modal) modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeHintsModal() {
    const modal = document.querySelector("[data-hints-modal]");
    if (modal) modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function safeNextUrl(raw) {
    const next = String(raw || "").trim();
    if (!next) return null;
    if (next.includes("://") || next.startsWith("//") || next.includes("\\")) return null;
    if (next.startsWith("../trainer/")) return next;
    if (next.startsWith("trainer/")) return `../${next}`;
    return null;
  }

  function goNextOrRefresh() {
    const params = new URLSearchParams(location.search);
    const next = safeNextUrl(params.get("next"));
    if (next) {
      location.href = next;
      return;
    }
    refresh();
  }

  function refresh() {
    const user = store.currentUser();
    if (!user) {
      setView("login");
      return;
    }
    // Уже вошли и есть куда вернуться (кнопка «Тренажёр» / редирект с гейта)
    const pendingNext = safeNextUrl(new URLSearchParams(location.search).get("next"));
    if (pendingNext) {
      location.replace(pendingNext);
      return;
    }
    renderProfile(user);
    setView("profile");
  }

  // Пришли из тренажёра без входа — подсказка
  const authParams = new URLSearchParams(location.search);
  const authBanner = document.querySelector("[data-auth-banner]");
  if (authParams.get("auth") === "1" && authBanner && !store.currentUser()) {
    authBanner.hidden = false;
  }
  const preferRegister = authParams.get("tab") === "register";

  document.querySelector("[data-go-register]")?.addEventListener("click", () => {
    showError(loginError, "");
    showError(registerError, "");
    setView("register");
  });

  document.querySelector("[data-go-login]")?.addEventListener("click", () => {
    showError(loginError, "");
    showError(registerError, "");
    setView("login");
  });

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(loginForm);
      const result = store.login(data.get("login"), data.get("password"));
      if (!result.ok) {
        showError(loginError, result.error);
        return;
      }
      loginForm.reset();
      showError(loginError, "");
      goNextOrRefresh();
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(registerForm);
      const result = store.register({
        login: data.get("login"),
        password: data.get("password"),
        name: data.get("name"),
        age: data.get("age"),
        grade: data.get("grade"),
        level: data.get("level"),
      });
      if (!result.ok) {
        showError(registerError, result.error);
        return;
      }
      registerForm.reset();
      showError(registerError, "");
      goNextOrRefresh();
    });
  }

  document.querySelector("[data-open-settings]")?.addEventListener("click", () => {
    showError(settingsError, "");
    setView("settings");
  });

  document.querySelector("[data-back-profile]")?.addEventListener("click", () => {
    showError(settingsError, "");
    setView("profile");
  });

  renderDogGrid();

  document.querySelectorAll("[data-open-avatar]").forEach((el) => {
    el.addEventListener("click", () => openAvatarModal());
  });

  document.querySelectorAll("[data-avatar-close]").forEach((el) => {
    el.addEventListener("click", () => closeAvatarModal());
  });

  avatarDogsRoot?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dog-id]");
    if (!btn) return;
    setDraftAvatar({ kind: "dog", id: btn.getAttribute("data-dog-id") });
  });

  avatarFileInput?.addEventListener("change", async () => {
    const file = avatarFileInput.files?.[0];
    if (!file) return;
    try {
      const img = await readFileAsImage(file);
      const src = compressToDataUrl(img);
      if (src.length > 450_000) {
        showError(avatarError, "Фото получилось слишком тяжёлым — попробуй другое");
        return;
      }
      setDraftAvatar({ kind: "upload", src });
    } catch (err) {
      showError(avatarError, err?.message || "Не удалось загрузить фото");
    } finally {
      avatarFileInput.value = "";
    }
  });

  document.querySelector("[data-avatar-save]")?.addEventListener("click", () => {
    const result = store.setAvatar?.(draftAvatar);
    if (!result?.ok) {
      showError(avatarError, result?.error || "Не удалось сохранить");
      return;
    }
    renderProfile(result.user);
    closeAvatarModal();
  });

  if (settingsForm) {
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(settingsForm);
      const result = store.updateProfile({
        name: data.get("name"),
        age: data.get("age"),
        grade: data.get("grade"),
        level: data.get("level"),
      });
      if (!result.ok) {
        showError(settingsError, result.error);
        return;
      }
      showError(settingsError, "");
      renderProfile(result.user);
      setView("profile");
    });
  }

  document.querySelector("[data-logout]")?.addEventListener("click", () => {
    store.logout();
    refresh();
  });

  document.querySelector("[data-open-hints]")?.addEventListener("click", () => {
    openHintsModal();
  });

  document.querySelectorAll("[data-hints-close]").forEach((el) => {
    el.addEventListener("click", () => closeHintsModal());
  });

  document.querySelector("[data-hint-packs]")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-buy-pack]");
    if (!btn || btn.disabled) return;
    const packId = btn.getAttribute("data-buy-pack");
    const err = document.querySelector("[data-hints-error]");
    const result = store.buyHintPack?.(packId);
    if (!result?.ok) {
      if (err) {
        err.hidden = false;
        err.textContent = result?.error || "Не удалось купить";
      }
      renderHintPacks();
      return;
    }
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    const user = store.currentUser();
    if (user) renderProfile(user);
    renderHintPacks();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (avatarModal && !avatarModal.hidden) {
      closeAvatarModal();
      return;
    }
    const modal = document.querySelector("[data-hints-modal]");
    if (modal && !modal.hidden) closeHintsModal();
  });

  refresh();
  if (!store.currentUser() && preferRegister) setView("register");
})();
