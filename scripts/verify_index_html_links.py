#!/usr/bin/env python3
"""Fail if any internal <a href> does not use .../index.html for page targets."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
A_HREF_RE = re.compile(r'<a\b[^>]*\bhref="([^"]+)"', re.IGNORECASE)

INTERNAL_PREFIXES = (
    "/directory",
    "/profiles",
    "/industries",
    "/women-leaders",
    "/men-leaders",
    "/about",
    "/contact",
    "/become-member",
    "/index.html",
)


def is_skip_href(href: str) -> bool:
    lower = href.lower()
    if lower.startswith(("mailto:", "tel:", "javascript:", "http://", "https://")):
        return True
    if href.startswith("#"):
        return True
    path = href.split("#", 1)[0].split("?", 1)[0]
    if "/assets/" in path or "/images/" in path:
        return True
    if path.startswith("assets/") or "../assets" in path or "../../assets" in path:
        return True
    seg = path.rstrip("/").split("/")[-1] if path else ""
    if seg.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".ico", ".css", ".js")):
        return True
    return False


def is_bad_internal_href(href: str) -> bool:
    if is_skip_href(href):
        return False
    path = href.split("#", 1)[0].split("?", 1)[0]
    if not path:
        return False
    if path in ("/", "/index.html"):
        return False
    if path.endswith("/index") or path.endswith("/index/"):
        return True
    if path.endswith("/index.html"):
        return False
    for prefix in INTERNAL_PREFIXES:
        if path.startswith(prefix) and not path.endswith("index.html"):
            return True
    if path.startswith("/") and not path.endswith(".html"):
        last = path.rstrip("/").split("/")[-1]
        if "." not in last:
            return True
    return False


def main() -> int:
    failures: list[tuple[str, str]] = []
    for html_path in sorted(ROOT.rglob("*.html")):
        if ".jj" in html_path.parts:
            continue
        text = html_path.read_text(encoding="utf-8")
        for m in A_HREF_RE.finditer(text):
            href = m.group(1)
            if is_bad_internal_href(href):
                failures.append((str(html_path.relative_to(ROOT)), href))

    if failures:
        print(f"FAIL: {len(failures)} bad internal link(s):\n")
        for path, href in failures[:50]:
            print(f"  {path}: {href}")
        if len(failures) > 50:
            print(f"  ... and {len(failures) - 50} more")
        return 1

    print("OK: all internal <a href> use index.html for page targets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
