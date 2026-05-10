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
  function dirnamePathParts(pathname) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length) {
      const last = parts[parts.length - 1];
      if (last.includes(".")) parts.pop();
    }
    if (parts.length) {
      const last = parts[parts.length - 1];
      if (last.toLowerCase() === "index") parts.pop();
    }
    return parts;
  }
  function shouldAppendIndexPath(pathname) {
    const trimmed = pathname.replace(/\/$/, "") || "/";
    if (trimmed === "/" || trimmed === "") return true;
    const segments = trimmed.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last === "index") return false;
    if (last.endsWith(".html")) return false;
    if (last.includes(".") && !last.endsWith(".html")) return false;
    const prefix = `/${segments.join("/")}`;
    if (prefix.includes("/assets/") || prefix.includes("/images/")) return false;
    return true;
  }
  function pathWithIndexSuffix(pathname) {
    const base = pathname.replace(/\/$/, "") || "/";
    if (base === "/" || base === "") return "/index";
    return `${base}/index`;
  }
  function relativePathBetween(fromPathname, toPathname) {
    const fromParts = dirnamePathParts(fromPathname);
    const toParts = toPathname.split("/").filter(Boolean);
    let i = 0;
    while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;
    const ups = fromParts.length - i;
    const out = [...Array(ups).fill(".."), ...toParts.slice(i)];
    if (!out.length) return ".";
    return out.join("/");
  }
  function initInternalLinkIndexSuffix() {
    const here = new URL(window.location.href);
    qsa("a[href]").forEach((a) => {
      const raw = a.getAttribute("href");
      if (!raw || raw.startsWith("javascript:")) return;
      if (raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
      let resolved;
      try {
        resolved = new URL(raw, document.baseURI);
      } catch {
        return;
      }
      if (resolved.origin !== here.origin) return;
      if (!shouldAppendIndexPath(resolved.pathname)) return;
      const nextPath = pathWithIndexSuffix(resolved.pathname);
      const target = new URL(nextPath + resolved.search + resolved.hash, resolved.origin);
      const rel = relativePathBetween(here.pathname, target.pathname) + target.search + target.hash;
      a.setAttribute("href", rel);
    });
  }
  function init() {
    initInternalLinkIndexSuffix();
    initDesktopDropdowns();
    initMobileMenu();
    initDirectoryFilters();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}
)();
