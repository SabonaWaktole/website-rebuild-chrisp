#!/usr/bin/env python3
"""Remove Ground Transportation & Tourism nav, filter, and fix duplicated anchor tags."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

DESKTOP_BLOCK = re.compile(
    r'\s*<a class="text-sm text-zinc-400[^"]*"[^>]*href="/industries/ground-transportation-tourism/index\.html">'
    r'\s*<span class="w-1 h-1 rounded-full bg-zinc-700[^"]*">\s*</span>\s*'
    r'Ground Transportation &amp; Tourism\s*</a>',
    re.DOTALL,
)

MOBILE_BLOCK = re.compile(
    r'\s*<a class="text-zinc-400 hover:text-luxury-gold text-base[^"]*"[^>]*href="/industries/ground-transportation-tourism/index\.html">'
    r'\s*<span class="w-1 h-1 rounded-full bg-zinc-700">\s*</span>\s*'
    r'Ground Transportation &amp; Tourism\s*</a>',
    re.DOTALL,
)

# Broken duplicate opening tags from bad merge
BROKEN_DESKTOP = re.compile(
    r'<a class="text-sm text-zinc-400 hover:text-luxury-gold hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group/item"\s+'
    r'<a class="text-sm text-zinc-400 hover:text-luxury-gold hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group/item" '
    r'href="/industries/ground-transportation-tourism/index\.html">'
    r'\s*<span class="w-1 h-1 rounded-full bg-zinc-700 group-hover/item:bg-luxury-gold transition-colors duration-200 shrink-0">\s*</span>\s*'
    r'Ground Transportation &amp; Tourism\s*</a>',
    re.DOTALL,
)

BROKEN_MOBILE = re.compile(
    r'<a class="text-zinc-400 hover:text-luxury-gold text-base transition-colors flex items-center gap-2"\s+'
    r'<a class="text-zinc-400 hover:text-luxury-gold text-base transition-colors flex items-center gap-2" '
    r'href="/industries/ground-transportation-tourism/index\.html">'
    r'\s*<span class="w-1 h-1 rounded-full bg-zinc-700">\s*</span>\s*'
    r'Ground Transportation &amp; Tourism\s*</a>',
    re.DOTALL,
)

FILTER_BUTTON = re.compile(
    r'\s*<button class="\s*'
    r'px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border\s*'
    r'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200\s*'
    r'">\s*Ground Transportation &amp; Tourism\s*</button>',
    re.DOTALL,
)

HOMEPAGE_CARD = re.compile(
    r'\s*<a class="industry-card[^"]*"[^>]*href="/industries/ground-transportation-tourism/index\.html">.*?</a>',
    re.DOTALL,
)


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    for pat in (BROKEN_DESKTOP, BROKEN_MOBILE, DESKTOP_BLOCK, MOBILE_BLOCK, FILTER_BUTTON):
        text = pat.sub("", text)
    if path.name == "index.html" and path.parent == ROOT:
        text = HOMEPAGE_CARD.sub("", text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    updated = []
    for html_path in sorted(ROOT.rglob("*.html")):
        if "ground-transportation-tourism" in html_path.parts:
            continue
        if patch_file(html_path):
            updated.append(html_path.relative_to(ROOT))
    print(f"Updated {len(updated)} file(s)")
    for p in updated:
        print(f"  {p}")


if __name__ == "__main__":
    main()
