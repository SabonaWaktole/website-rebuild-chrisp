#!/usr/bin/env python3
"""Convert internal hrefs to root-absolute /path/index.html (fixes /directory/index URL resolution)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
A_HREF_RE = re.compile(r'(<a\b[^>]*\bhref=")([^"]+)(")', re.IGNORECASE)


def is_skip_href(href: str) -> bool:
    lower = href.lower()
    if lower.startswith(("mailto:", "tel:", "javascript:", "http://", "https://")):
        return True
    if href.startswith("#"):
        return True
    return False


def file_depth(html_path: Path) -> int:
    rel = html_path.relative_to(ROOT)
    return len(rel.parts) - 1


def rel_to_root_path(href: str, depth: int) -> str | None:
    if is_skip_href(href):
        return None
    path_only = href.split("#", 1)[0].split("?", 1)[0]
    if not path_only:
        return None

    rest = href
    if depth == 0:
        if path_only.startswith("./"):
            rest = path_only[2:] + href[len(path_only) :]
        elif path_only.startswith("../"):
            rest = path_only[3:] + href[len(path_only) :]
        elif path_only.startswith("/"):
            return normalize_index_html(href)
        else:
            rest = path_only + href[len(path_only) :]
    elif depth == 1:
        if path_only.startswith("../"):
            rest = path_only[3:] + href[len(path_only) :]
        elif path_only.startswith("./"):
            rest = path_only[2:] + href[len(path_only) :]
        elif path_only.startswith("/"):
            return normalize_index_html(href)
        else:
            return None
    elif depth >= 2:
        if path_only.startswith("../../"):
            rest = path_only[6:] + href[len(path_only) :]
        elif path_only.startswith("../"):
            rest = path_only[3:] + href[len(path_only) :]
        elif path_only.startswith("/"):
            return normalize_index_html(href)
        else:
            return None
    else:
        return None

    root_path = "/" + rest.lstrip("/")
    return normalize_index_html(root_path)


def normalize_index_html(href: str) -> str:
    hash_part = ""
    q_part = ""
    rest = href
    if "#" in rest:
        rest, frag = rest.split("#", 1)
        hash_part = "#" + frag
    if "?" in rest:
        rest, q = rest.split("?", 1)
        q_part = "?" + q

    if rest in ("", "/"):
        return "/index.html" + q_part + hash_part

    rest = rest.rstrip("/")
    if rest.endswith("/index") and not rest.endswith("/index.html"):
        rest = rest + ".html"
    elif not rest.endswith(".html") and not any(
        rest.endswith(ext)
        for ext in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".ico", ".css", ".js")
    ):
        if "/assets/" not in rest and "/images/" not in rest:
            if not rest.endswith("/index.html"):
                rest = rest + "/index.html"

    return rest + q_part + hash_part


def process_html(text: str, depth: int) -> tuple[str, int]:
    count = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal count
        prefix, href, suffix = m.group(1), m.group(2), m.group(3)
        new_href = rel_to_root_path(href, depth)
        if new_href is None or new_href == href:
            return m.group(0)
        count += 1
        return prefix + new_href + suffix

    return A_HREF_RE.sub(repl, text), count


def main() -> int:
    total = 0
    for path in sorted(ROOT.rglob("*.html")):
        if ".jj" in path.parts:
            continue
        depth = file_depth(path)
        text = path.read_text(encoding="utf-8")
        new_text, n = process_html(text, depth)
        if n:
            path.write_text(new_text, encoding="utf-8", newline="\n")
            print(f"{path.relative_to(ROOT)}: {n} links")
            total += n
    print(f"Done. Updated {total} links.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
