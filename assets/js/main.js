(function () {
  const cfg = window.SITE_CONFIG;
  const dict = window.I18N;
  const LANGS = ["uk", "en"];
  let lang = detectLang();

  function detectLang() {
    // ?lang=en має пріоритет – зручно для окремих рекламних кампаній
    const param = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(param)) return param;
    try {
      const saved = localStorage.getItem("lang");
      if (LANGS.includes(saved)) return saved;
    } catch (e) {}
    return (navigator.language || "").toLowerCase().startsWith("uk") ? "uk" : "en";
  }

  function t(key) {
    return dict[lang][key] || dict.uk[key] || key;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    document.querySelector('meta[name="description"]').setAttribute("content", t("meta.description"));
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });
  }

  function setLang(next) {
    lang = next;
    try {
      localStorage.setItem("lang", lang);
    } catch (e) {}
    applyLang();
  }

  function telegramUrl(text) {
    const base = "https://t.me/" + cfg.telegram;
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }

  function whatsappUrl(text) {
    const base = "https://wa.me/" + cfg.whatsapp;
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }

  // Посилання на месенджери
  document.querySelectorAll("[data-link=telegram]").forEach((a) => (a.href = telegramUrl()));
  document.querySelectorAll("[data-link=whatsapp]").forEach((a) => (a.href = whatsappUrl()));
  document.querySelectorAll("[data-link=email]").forEach((a) => {
    a.href = "mailto:" + cfg.email;
    a.textContent = cfg.email;
  });

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  // Мобільне меню
  const nav = document.querySelector(".nav");
  document.querySelector(".nav-toggle").addEventListener("click", (e) => {
    const open = nav.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  // Форма заявки
  const form = document.getElementById("lead-form");
  const status = document.getElementById("form-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // honeypot від ботів
    delete data.website;
    data.lang = lang;
    data.page = location.href;

    if (!cfg.formEndpoint) {
      const select = form.elements.service;
      const lines = [
        t("form.tgPrefix"),
        t("form.name") + ": " + data.name,
        t("form.contact") + ": " + data.contact,
        t("form.service") + ": " + select.options[select.selectedIndex].text,
        data.message ? t("form.message") + ": " + data.message : "",
      ].filter(Boolean);
      const text = lines.join("\n");
      // window.open до будь-якого await, інакше браузер може заблокувати вікно
      window.open(telegramUrl(text), "_blank", "noopener");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => (status.textContent = t("form.copied")), () => {});
      }
      return;
    }

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    status.textContent = t("form.sending");
    try {
      const res = await fetch(cfg.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.textContent = t("form.success");
    } catch (err) {
      status.textContent = t("form.error");
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("year").textContent = new Date().getFullYear();
  applyLang();
})();
