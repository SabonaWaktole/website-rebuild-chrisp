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
    } else {
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
      };

      button.setAttribute("aria-haspopup", "true");
      button.setAttribute("aria-expanded", "false");

      parent.addEventListener("mouseenter", () => update(true));
      parent.addEventListener("mouseleave", () => update(false));

      button.addEventListener("click", (e) => {
        e.preventDefault();
        update(!open);
      });
    });

    document.addEventListener("click", (e) => {
      dropdownParents.forEach((parent) => {
        const menu = qs("div.absolute.left-1\\/2", parent);
        const button = qs("button", parent);
        if (!menu || !button) return;
        if (parent.contains(e.target)) return;
        setOpen(menu, false);
        button.setAttribute("aria-expanded", "false");
      });
    });
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
    });

    (closeBtn || overlay).addEventListener("click", (e) => {
      if (e.target === overlay || e.currentTarget === closeBtn) setOverlay(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOverlay(false);
    });
  }

  function initDirectoryFilters() {
    const directoryRoot = qs('main input[placeholder^="Search leaders"]')?.closest("main");
    if (!directoryRoot) return;

    const searchInput = qs('input[placeholder^="Search leaders"]', directoryRoot);
    const cards = qsa('a[data-slug][href^="/profiles/"]', directoryRoot);
    const countEl = qsa("p", directoryRoot).find((p) => /Showing/i.test(p.textContent || "") && /curated members/i.test(p.textContent || ""));

    const genderButtons = qsa("button", directoryRoot).filter((b) => (b.textContent || "").trim() === "Male" || (b.textContent || "").trim() === "Female");
    const sectorButtons = qsa("button", directoryRoot).filter((b) => {
      const t = (b.textContent || "").trim();
      return t && t !== "Male" && t !== "Female" && t !== "Send Message";
    });

    let selectedGender = null; // "Male" | "Female" | null
    const selectedSectors = new Set();
    let query = "";

    const activeBtnClasses = ["ic-active"];

    function setBtnActive(btn, active) {
      activeBtnClasses.forEach((c) => btn.classList.toggle(c, active));
    }

    function normalize(s) {
      return (s || "").toLowerCase().trim();
    }

    function matches(card) {
      const gender = card.getAttribute("data-gender") || "";
      const industries = (card.getAttribute("data-industries") || "").split("|").filter(Boolean);
      const tags = (card.getAttribute("data-tags") || "").split("|").filter(Boolean);
      const text = normalize(
        [
          card.textContent,
          gender,
          industries.join(" "),
          tags.join(" "),
        ].join(" ")
      );

      if (selectedGender && gender !== selectedGender) return false;
      if (selectedSectors.size) {
        const has = industries.some((i) => selectedSectors.has(i));
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
      });
      if (countEl) countEl.innerHTML = `Showing <!-- -->${shown}<!-- --> curated members`;
    }

    genderButtons.forEach((btn) => {
      const label = (btn.textContent || "").trim();
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        selectedGender = selectedGender === label ? null : label;
        genderButtons.forEach((b) => setBtnActive(b, (b.textContent || "").trim() === selectedGender));
        update();
      });
    });

    sectorButtons.forEach((btn) => {
      const label = (btn.textContent || "").trim();
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (selectedSectors.has(label)) selectedSectors.delete(label);
        else selectedSectors.add(label);
        setBtnActive(btn, selectedSectors.has(label));
        update();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = searchInput.value || "";
        update();
      });
    }

    update();
  }

  function init() {
    initDesktopDropdowns();
    initMobileMenu();
    initDirectoryFilters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
