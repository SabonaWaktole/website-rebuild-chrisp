#!/usr/bin/env python3
"""Insert Ground Transportation & Tourism nav links into all site HTML files."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

DESKTOP_INSERT = """                      <a class="text-sm text-zinc-400 hover:text-luxury-gold hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group/item" href="/industries/ground-transportation-tourism/index.html">
                        <span class="w-1 h-1 rounded-full bg-zinc-700 group-hover/item:bg-luxury-gold transition-colors duration-200 shrink-0">
                        </span>
                        Ground Transportation &amp; Tourism
                      </a>
"""

MOBILE_INSERT = """              <a class="text-zinc-400 hover:text-luxury-gold text-base transition-colors flex items-center gap-2" href="/industries/ground-transportation-tourism/index.html">
                <span class="w-1 h-1 rounded-full bg-zinc-700">
                </span>
                Ground Transportation &amp; Tourism
              </a>
"""

DESKTOP_ANCHOR = """                      <a class="text-sm text-zinc-400 hover:text-luxury-gold hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group/item" href="/industries/tourism-hospitality/index.html">
                        <span class="w-1 h-1 rounded-full bg-zinc-700 group-hover/item:bg-luxury-gold transition-colors duration-200 shrink-0">
                        </span>
                        Tourism &amp; Hospitality
                      </a>
                      <a class="text-sm text-zinc-400 hover:text-luxury-gold hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group/item" href="/industries/trades/index.html">"""

MOBILE_ANCHOR = """              <a class="text-zinc-400 hover:text-luxury-gold text-base transition-colors flex items-center gap-2" href="/industries/tourism-hospitality/index.html">
                <span class="w-1 h-1 rounded-full bg-zinc-700">
                </span>
                Tourism &amp; Hospitality
              </a>
              <a class="text-zinc-400 hover:text-luxury-gold text-base transition-colors flex items-center gap-2" href="/industries/trades/index.html">"""

DESKTOP_REPLACEMENT = DESKTOP_ANCHOR.replace(
    'href="/industries/trades/index.html">',
    DESKTOP_INSERT + '                      <a class="text-sm text-zinc-400 hover:text-luxury-gold hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group/item" href="/industries/trades/index.html">',
    1,
)

MOBILE_REPLACEMENT = MOBILE_ANCHOR.replace(
    'href="/industries/trades/index.html">',
    MOBILE_INSERT + '              <a class="text-zinc-400 hover:text-luxury-gold text-base transition-colors flex items-center gap-2" href="/industries/trades/index.html">',
    1,
)

FILTER_ANCHOR = """                    Tourism &amp; Hospitality
                  </button>
                  <button class="
                      px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border
                      bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200
                    ">
                    Trades"""

FILTER_REPLACEMENT = """                    Tourism &amp; Hospitality
                  </button>
                  <button class="
                      px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border
                      bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200
                    ">
                    Ground Transportation &amp; Tourism
                  </button>
                  <button class="
                      px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border
                      bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200
                    ">
                    Trades"""


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "ground-transportation-tourism" in text:
        return False
    original = text
    if DESKTOP_ANCHOR in text:
        text = text.replace(DESKTOP_ANCHOR, DESKTOP_REPLACEMENT, 1)
    if MOBILE_ANCHOR in text:
        text = text.replace(MOBILE_ANCHOR, MOBILE_REPLACEMENT, 1)
    if path.name == "index.html" and path.parent.name == "directory":
        if FILTER_ANCHOR in text:
            text = text.replace(FILTER_ANCHOR, FILTER_REPLACEMENT, 1)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    updated = []
    for html_path in sorted(ROOT.rglob("*.html")):
        if patch_file(html_path):
            updated.append(html_path.relative_to(ROOT))
    print(f"Updated {len(updated)} file(s)")
    for p in updated:
        print(f"  {p}")


if __name__ == "__main__":
    main()
