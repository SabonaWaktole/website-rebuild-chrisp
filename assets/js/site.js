(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const openClasses = ["opacity-100", "visible", "translate-y-0", "pointer-events-auto"];
  const closedClasses = ["opacity-0", "invisible", "-translate-y-3", "pointer-events-none"];
  function setOpen(el, isOpen) {
    if (!el) return;
    if (isOpen) {
      closedClasses.forEach((c) => el.classList.remove(c));
      openClasses.forEach((c) => el.classList.add(c));
    }
    else {
      openClasses.forEach((c) => el.classList.remove(c));
      closedClasses.forEach((c) => el.classList.add(c));
    }
  }
  function initDesktopDropdowns() {
    const nav = qs("header nav.md\\:flex");
    if (!nav) return;
    const dropdownParents = qsa("div.relative.py-3", nav);
    dropdownParents.forEach((parent) => {
      const button = qs("button", parent);
      const menu = qs("div.absolute.left-1\\/2", parent);
      if (!button || !menu) return;
      let open = false;
      const update = (v) => {
        open = v;
        setOpen(menu, open);
        button.setAttribute("aria-expanded", open ? "true" : "false");
      }
      ;
      button.setAttribute("aria-haspopup", "true");
      button.setAttribute("aria-expanded", "false");
      parent.addEventListener("mouseenter", () => update(true));
      parent.addEventListener("mouseleave", () => update(false));
      button.addEventListener("click", (e) => {
        e.preventDefault();
        update(!open);
      }
      );
    }
    );
    document.addEventListener("click", (e) => {
      dropdownParents.forEach((parent) => {
        const menu = qs("div.absolute.left-1\\/2", parent);
        const button = qs("button", parent);
        if (!menu || !button) return;
        if (parent.contains(e.target)) return;
        setOpen(menu, false);
        button.setAttribute("aria-expanded", "false");
      }
      );
    }
    );
  }
  function initMobileMenu() {
    const openBtn = qs('button[aria-label="Toggle menu"]');
    const overlay = qs("header div.fixed.inset-0.z-40");
    if (!openBtn || !overlay) return;
    const closeBtn = qs('button[aria-label="Close menu"]', overlay);
    const setOverlay = (isOpen) => setOpen(overlay, isOpen);
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setOverlay(true);
    }
    );
    (closeBtn || overlay).addEventListener("click", (e) => {
      if (e.target === overlay || e.currentTarget === closeBtn) setOverlay(false);
    }
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOverlay(false);
    }
    );
  }
  function initDirectoryFilters() {
    const directoryRoot = qs('main input[placeholder^="Search leaders"]')?.closest("main");
    if (!directoryRoot) return;
    const searchInput = qs('input[placeholder^="Search leaders"]', directoryRoot);
    const cards = qsa("a[data-slug]", directoryRoot).filter((card) => {
      const href = card.getAttribute("href") || "";
      return href.includes("/profiles/");
    });
    const countEl = qsa("p", directoryRoot).find((p) => /Showing/i.test(p.textContent || "") && /curated members/i.test(p.textContent || ""));
    const genderSectionTitle = qsa("h3", directoryRoot).find((h) => /Filter by Gender/i.test(h.textContent || ""));
    const sectorSectionTitle = qsa("h3", directoryRoot).find((h) => /Filter by Sector/i.test(h.textContent || ""));
    const genderButtons = genderSectionTitle ? qsa("button", genderSectionTitle.parentElement || directoryRoot) : [];
    const sectorButtons = sectorSectionTitle ? qsa("button", sectorSectionTitle.parentElement || directoryRoot) : [];
    const clearFiltersBtn = qs(".ic-clear-filters", directoryRoot);
    if (!cards.length || !genderButtons.length || !sectorButtons.length) return;
    const selectedGenders = new Set();
    const selectedSectors = new Set();
    let query = "";
    const activeBtnClasses = ["ic-active"];
    const genderActiveClass = "ic-active-gender";
    const sectorActiveClass = "ic-active-sector";
    genderButtons.forEach((btn) => btn.classList.add("ic-gender-btn"));
    sectorButtons.forEach((btn) => btn.classList.add("ic-sector-btn"));
    function setBtnActive(btn, active) {
      const typeClass = btn.classList.contains("ic-gender-btn") ? genderActiveClass : sectorActiveClass;
      activeBtnClasses.forEach((c) => btn.classList.toggle(c, active));
      btn.classList.toggle(typeClass, active);
    }
    function normalize(s) {
      return (s || "").toLowerCase().trim();
    }
    function cardNormalizedSectors(card) {
      const norms = new Set();
      (card.getAttribute("data-industries") || "").split("|").map((s) => s.trim()).filter(Boolean).forEach((i) => {
        norms.add(normalize(i));
      }
      );
      const sub =
      qs('p[class*="text-luxury-gold/80"]', card) || (() => {
        const h3 = qs("h3", card);
        const n = h3?.nextElementSibling;
        return n && n.tagName === "P" ? n : null;
      }
      )();
      if (sub) {
        (sub.textContent || "").split("/").map((s) => s.trim()).filter(Boolean).forEach((p) => {
          norms.add(normalize(p));
        }
        );
      }
      return norms;
    }
    function hasActiveFilters() {
      return selectedGenders.size > 0 || selectedSectors.size > 0 || normalize(query).length > 0;
    }
    function syncClearButtonVisibility() {
      if (!clearFiltersBtn) return;
      const show = hasActiveFilters();
      clearFiltersBtn.classList.toggle("hidden", !show);
    }
    function matches(card) {
      const gender = card.getAttribute("data-gender") || "";
      const industries = (card.getAttribute("data-industries") || "").split("|").map((s) => s.trim()).filter(Boolean);
      const sectorNorms = cardNormalizedSectors(card);
      const tags = (card.getAttribute("data-tags") || "").split("|").filter(Boolean);
      const text = normalize(
      [
      card.textContent,
      gender,
      [...sectorNorms].join(" "),
      tags.join(" "),
      ].join(" ")
      );
      if (selectedGenders.size && !selectedGenders.has(normalize(gender))) return false;
      if (selectedSectors.size) {
        const has = [...selectedSectors].some((sel) => sectorNorms.has(sel));
        if (!has) return false;
      }
      if (query && !text.includes(normalize(query))) return false;
      return true;
    }
    function update() {
      let shown = 0;
      cards.forEach((card) => {
        const ok = matches(card);
        card.style.display = ok ? "" : "none";
        if (ok) shown += 1;
      }
      );
      if (countEl) countEl.innerHTML = `Showing <!-- -->${
        shown
      }
      <!-- --> curated members`;
      syncClearButtonVisibility();
    }
    genderButtons.forEach((btn) => {
      const label = (btn.textContent || "").trim();
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const normalizedLabel = normalize(label);
        if (selectedGenders.has(normalizedLabel)) selectedGenders.delete(normalizedLabel);
        else selectedGenders.add(normalizedLabel);
        setBtnActive(btn, selectedGenders.has(normalizedLabel));
        update();
      }
      );
    }
    );
    sectorButtons.forEach((btn) => {
      const label = (btn.textContent || "").trim();
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const normalizedLabel = normalize(label);
        if (selectedSectors.has(normalizedLabel)) selectedSectors.delete(normalizedLabel);
        else selectedSectors.add(normalizedLabel);
        setBtnActive(btn, selectedSectors.has(normalizedLabel));
        update();
      }
      );
    }
    );
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = searchInput.value || "";
        update();
      }
      );
    }
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", (e) => {
        e.preventDefault();
        selectedGenders.clear();
        selectedSectors.clear();
        query = "";
        if (searchInput) searchInput.value = "";
        [...genderButtons, ...sectorButtons].forEach((btn) => setBtnActive(btn, false));
        update();
      }
      );
    }
    update();
  }

  /** Ensure internal page URLs use index.html (never bare /index). */
  function pathnameToIndexHtml(pathname) {
    if (!pathname || pathname === "/") return "/index.html";
    const trimmed = pathname.replace(/\/$/, "") || "/";
    if (trimmed === "/index") return "/index.html";
    if (trimmed.endsWith("/index") && !trimmed.endsWith("/index.html")) {
      return `${trimmed}.html`;
    }
    return pathname;
  }
  function isInternalPagePath(pathname) {
    if (pathname.includes("/assets/") || pathname.includes("/images/")) return false;
    const last = pathname.split("/").filter(Boolean).pop() || "";
    if (/\.(css|js|png|jpe?g|gif|webp|svg|avif|ico)$/i.test(last)) return false;
    return true;
  }
  function normalizeInternalAnchorHref(raw) {
    if (!raw || raw.startsWith("javascript:")) return raw;
    if (raw.startsWith("mailto:") || raw.startsWith("tel:")) return raw;
    if (raw.startsWith("#")) return raw;
    let url;
    try {
      url = new URL(raw, window.location.origin);
    } catch {
      return raw;
    }
    if (url.origin !== window.location.origin) return raw;
    if (!isInternalPagePath(url.pathname)) return raw;
    const fixedPath = pathnameToIndexHtml(url.pathname);
    if (fixedPath === url.pathname) return raw;
    url.pathname = fixedPath;
    if (raw.startsWith("/")) return url.pathname + url.search + url.hash;
    return url.pathname + url.search + url.hash;
  }
  function redirectBareIndexInAddressBar() {
    const path = window.location.pathname || "";
    if (!path.endsWith("/index") || path.endsWith("/index.html")) return false;
    const next = pathnameToIndexHtml(path) + window.location.search + window.location.hash;
    window.location.replace(next);
    return true;
  }
  function initIndexHtmlLinks() {
    if (redirectBareIndexInAddressBar()) return;
    qsa("a[href]").forEach((a) => {
      const raw = a.getAttribute("href");
      const fixed = normalizeInternalAnchorHref(raw);
      if (fixed && fixed !== raw) a.setAttribute("href", fixed);
    });
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a[href]");
        if (!a) return;
        const raw = a.getAttribute("href");
        const fixed = normalizeInternalAnchorHref(raw);
        if (!fixed || fixed === raw) return;
        e.preventDefault();
        window.location.href = fixed;
      },
      true
    );
  }

  const EMAILJS_PUBLIC_KEY = "rZgnsZHk3VI-0BApV";
  const EMAILJS_SERVICE_ID = "service_zz8ccem";
  const EMAILJS_TEMPLATE_BECOME_MEMBER = "template_7dd9wxb";
  const EMAILJS_TEMPLATE_CONTACT = "template_jgmuf4b";
  let emailjsInitialized = false;

  function initEmailJS() {
    if (emailjsInitialized) return true;
    const emailjs = window.emailjs;
    if (!emailjs) return false;
    try {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      emailjsInitialized = true;
      return true;
    } catch (e) {
      try {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        emailjsInitialized = true;
        return true;
      } catch (e2) {
        console.warn("[emailjs] init failed", e, e2);
        return false;
      }
    }
  }

  function findFormByFieldNames(requiredNames) {
    const forms = qsa("form");
    return (
      forms.find((form) => requiredNames.every((name) => !!form.querySelector(`[name="${name}"]`))) ||
      null
    );
  }

  function getOrCreateFormStatusEl(form) {
    const existing = form.querySelector('[data-ic-email-status="true"]');
    if (existing) return existing;

    const el = document.createElement("div");
    el.setAttribute("data-ic-email-status", "true");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.style.marginTop = "12px";
    el.style.fontSize = "0.95rem";
    el.style.lineHeight = "1.35";
    el.style.display = "none";

    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn && submitBtn.parentElement) submitBtn.parentElement.appendChild(el);
    else form.appendChild(el);

    return el;
  }

  function setFormStatus(form, kind, message) {
    const el = getOrCreateFormStatusEl(form);
    if (!message) {
      el.textContent = "";
      el.style.display = "none";
      return;
    }
    el.textContent = message;
    el.style.display = "block";
    el.style.color = kind === "success" ? "#86efac" : kind === "info" ? "#e4e4e7" : "#fca5a5";
  }

  async function sendEmailJSForm({ form, templateId }) {
    const emailjs = window.emailjs;
    if (!emailjs) {
      setFormStatus(form, "error", "Email service failed to load. Please try again in a moment.");
      return { ok: false };
    }
    if (!initEmailJS()) {
      setFormStatus(form, "error", "Email service failed to initialize. Please try again in a moment.");
      return { ok: false };
    }

    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    const prevDisabled = !!submitBtn?.disabled;
    const prevText = submitBtn && "textContent" in submitBtn ? submitBtn.textContent : null;

    try {
      setFormStatus(form, "info", "");
      if (submitBtn) {
        submitBtn.disabled = true;
        if (prevText != null) submitBtn.textContent = "Sending…";
      }

      await emailjs.sendForm(EMAILJS_SERVICE_ID, templateId, form);
      setFormStatus(form, "success", "Thanks :) we received your submission.");
      form.reset();
      return { ok: true };
    } catch (e) {
      console.warn("[emailjs] send failed", e);
      setFormStatus(form, "error", "Sorry :( something went wrong. Please try again.");
      return { ok: false, error: e };
    } finally {
      if (submitBtn) {
        submitBtn.disabled = prevDisabled;
        if (prevText != null) submitBtn.textContent = prevText;
      }
    }
  }

  function bindEmailForms() {
    const becomeForm = findFormByFieldNames(["full_name", "reply_to", "job_title", "phone"]);
    if (becomeForm && becomeForm.dataset.icEmailBound !== "true") {
      becomeForm.dataset.icEmailBound = "true";
      becomeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        setFormStatus(becomeForm, "info", "");
        void sendEmailJSForm({ form: becomeForm, templateId: EMAILJS_TEMPLATE_BECOME_MEMBER });
      });
    }

    const contactForm = findFormByFieldNames(["first_name", "last_name", "reply_to", "message"]);
    if (contactForm && contactForm.dataset.icEmailBound !== "true") {
      contactForm.dataset.icEmailBound = "true";
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        setFormStatus(contactForm, "info", "");
        void sendEmailJSForm({ form: contactForm, templateId: EMAILJS_TEMPLATE_CONTACT });
      });
    }
  }

  function init() {
    initIndexHtmlLinks();
    initDesktopDropdowns();
    initMobileMenu();
    initDirectoryFilters();
    bindEmailForms();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}
)();
