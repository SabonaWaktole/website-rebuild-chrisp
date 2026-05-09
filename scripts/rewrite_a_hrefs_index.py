#!/usr/bin/env python3
"""Rewrite internal <a href> targets to .../index for static hosts (e.g. Crazy Domains)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def is_skip_href(href: str) -> bool:
    """True if href should not be rewritten."""
    lower = href.lower()
    if lower.startswith(("mailto:", "tel:", "javascript:")):
        return True
    if lower.startswith("http://") or lower.startswith("https://"):
        return True
    if href.startswith("#"):
        return True
    path = href.split("#", 1)[0].split("?", 1)[0]
    if "/assets/" in path.replace("\\", "/"):
        return True
    if path.startswith("assets/") or path.startswith("../assets/") or path.startswith("../../assets/"):
        return True
    if "/images/" in path.replace("\\", "/"):
        return True
    seg = path.rstrip("/").split("/")[-1] if path else ""
    if seg.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".ico")):
        return True
    return False


def should_rewrite(href: str) -> bool:
    if not href:
        return False
    if is_skip_href(href):
        return False
    path = href.split("#", 1)[0].split("?", 1)[0]
    if not path:
        return False
    if path.endswith("/index") or path.endswith("/index/"):
        return False
    if path.endswith(".html"):
        return False
    last = path.rstrip("/").split("/")[-1]
    if "." in last and not last.endswith(".html"):
        return False
    return True


def rewrite_href(href: str) -> str:
    hash_part = ""
    q_part = ""
    rest = href
    if "#" in rest:
        rest, frag = rest.split("#", 1)
        hash_part = "#" + frag
    if "?" in rest:
        rest, q = rest.split("?", 1)
        q_part = "?" + q
    path = rest
    if path in (".", "./"):
        return "./index" + q_part + hash_part
    if path in ("..", "../"):
        return "../index" + q_part + hash_part
    path = path.rstrip("/")
    if path.endswith("/index"):
        return href
    return path + "/index" + q_part + hash_part


A_HREF_RE = re.compile(r'(<a\b[^>]*\bhref=")([^"]+)(")', re.IGNORECASE)


def process_html(text: str) -> tuple[str, int]:
    count = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal count
        pre, href, post = m.group(1), m.group(2), m.group(3)
        if not should_rewrite(href):
            return m.group(0)
        new_href = rewrite_href(href)
        if new_href != href:
            count += 1
        return pre + new_href + post

    return A_HREF_RE.sub(repl, text), count


def main() -> int:
    total = 0
    for path in sorted(ROOT.rglob("*.html")):
        if "node_modules" in path.parts:
            continue
        raw = path.read_text(encoding="utf-8")
        new, n = process_html(raw)
        if n:
            path.write_text(new, encoding="utf-8")
            print(f"{path.relative_to(ROOT)}: {n} anchor(s)")
            total += n
    print(f"Done. Updated {total} anchor href(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
