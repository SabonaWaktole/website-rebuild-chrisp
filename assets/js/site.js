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
      const tags = (card.getAttribute("data-tags") || "").split("|").filter(Boolean);
      const text = normalize(
      [
      card.textContent,
      gender,
      industries.join(" "),
      tags.join(" "),
      ].join(" ")
      );
      if (selectedGenders.size && !selectedGenders.has(normalize(gender))) return false;
      if (selectedSectors.size) {
        const has = industries.some((i) => selectedSectors.has(normalize(i)));
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
  function init() {
    initDesktopDropdowns();
    initMobileMenu();
    initDirectoryFilters();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}
)();
