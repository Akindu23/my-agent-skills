#!/usr/bin/env python3
"""Write work/<slug>/map.html, a visual map of the decisions, the spec or plan, and the build tickets.

Usage: python3 render_map.py work/<slug>

Stdlib only. This file only reads the markdown into JSON and fills map.html (the template beside it).
Layout, rounds and hover all run in the page.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MD_LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
NUMBERED = re.compile(r"(\d+)-(.+)\.md$")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def plain(text: str) -> str:
    # strip the markdown a viewer would show raw
    text = MD_LINK.sub(r"\1", text)
    text = re.sub(r"\*\*|__|`", "", text)
    return re.sub(r"\s+", " ", text).strip()


def clip(text: str, n: int) -> str:
    return text if len(text) <= n else text[: n - 1].rsplit(" ", 1)[0] + "…"


def sections(md: str) -> dict[str, str]:
    # "## Heading" -> body, keyed by the lower-case heading
    out: dict[str, str] = {}
    cur = None
    for line in md.splitlines():
        m = re.match(r"^##\s+(.+?)\s*$", line)
        if m:
            cur = m.group(1).lower()
            out[cur] = ""
        elif cur:
            out[cur] += line + "\n"
    return out


def first_para(text: str) -> str:
    for block in re.split(r"\n\s*\n", text.strip()):
        block = block.strip()
        if block and not block.startswith("<!--"):
            return plain(block)
    return ""


def bullets(text: str) -> list[str]:
    # struck-through bullets are left out
    return [plain(m.group(1)) for m in re.finditer(r"^\s*-\s+(.*)", text, re.M) if not m.group(1).startswith("~~")]


def h1(md: str, fallback: str) -> str:
    m = re.search(r"^#\s+(.+)$", md, re.M)
    return plain(m.group(1)) if m else fallback


def field(md: str, key: str) -> str:
    # wayfinder style "Key: value" or to-tickets style "**Key:** value"
    m = re.search(rf"^(?:\*\*)?{key}:(?:\*\*)?\s*(.+)$", md, re.M | re.I)
    return m.group(1).strip() if m else ""


def blocker_numbers(raw: str) -> list[int]:
    if not raw or raw.lower().startswith("none"):
        return []
    raw = re.sub(r"\([^)]*\)", "", raw)  # drop asides like "(which gates on 06, 13)"
    # to-tickets style "NN - Title; NN - Title": titles can hold numbers, so take only the leading one
    if ";" in raw or " - " in raw:
        return [int(m.group(1)) for part in raw.split(";") if (m := re.match(r"\s*(\d+)", part))]
    return [int(n) for n in re.findall(r"\d+", raw)]


def numbered(folder: Path) -> list[tuple[Path, int, str]]:
    # NN-slug.md files, in number order; anything else in the folder is skipped
    if not folder.is_dir():
        return []
    found = [(p, NUMBERED.match(p.name)) for p in folder.glob("*.md")]
    return sorted(((p, int(m.group(1)), m.group(2)) for p, m in found if m), key=lambda f: (f[1], f[0].name))


def read_map(md: str, slug: str) -> dict:
    s = sections(md)
    gists = {}
    for m in re.finditer(r"^\s*-\s+\[[^\]]+\]\(([^)]+)\)\s*-\s*(.+)", s.get("decisions so far", ""), re.M):
        gists[Path(m.group(1)).name] = clip(plain(m.group(2).split(" · ")[0]), 220)  # drop a trailing " · [ADR-NNNN](...)"
    return {
        "slug": slug,
        "title": h1(md, slug),
        "destination": clip(first_para(s.get("destination", "")), 320),
        "fog": [clip(b, 200) for b in bullets(s.get("not yet specified", ""))],
        "outOfScope": [clip(b, 200) for b in bullets(s.get("out of scope", ""))],
        "gists": gists,
    }


def read_issues(folder: Path, gists: dict) -> list[dict]:
    out = []
    for p, n, slug in numbered(folder / "issues"):
        md = read(p)
        s = sections(md)
        typ = (field(md, "Type") or "grilling").split()[0].lower()
        # the leading word only, so "Resolved." and "resolved (see answer)" still count
        m = re.match(r"(resolved|claimed)\b", field(md, "Status").lower())
        status = m.group(1) if m else "open"
        answer = gists.get(p.name) or clip(first_para(s.get("answer", "")), 220)
        out.append({
            "n": n, "slug": slug, "file": f"issues/{p.name}", "title": h1(md, slug),
            "type": typ, "mode": "AFK" if typ == "research" else "HITL", "status": status,
            "blockedBy": blocker_numbers(field(md, "Blocked by")),
            "q": clip(first_para(s.get("question", "")), 260),
            "a": answer if status == "resolved" else None,
        })
    return out


def ticket_stage(status: str) -> str:
    low = status.lower()
    if re.search(r"reviewed:\s*\d+\s+findings?", low):  # findings still open: needs review until clean
        return "review"
    if re.search(r"(?<!not )\b(done|reviewed)\b", low):  # "review not done" is not done
        return "done"
    return "review" if re.search(r"implemented|awaiting review", low) else "todo"


def read_tickets(folder: Path) -> list[dict]:
    out = []
    for p, n, slug in numbered(folder / "tickets"):
        md = read(p)
        status = field(md, "Status")
        what = re.search(r"\*\*What to build:\*\*\s*(.+)", md)
        out.append({
            "n": n, "slug": slug, "file": f"tickets/{p.name}",
            "title": re.sub(r"^\d+\s*-\s*", "", h1(md, slug)),
            "stage": ticket_stage(status), "statusText": clip(plain(status), 160),
            "blockedBy": blocker_numbers(field(md, "Blocked by")),
            "checks": [len(re.findall(r"^\s*- \[x\]", md, re.M | re.I)), len(re.findall(r"^\s*- \[[ x]\]", md, re.M | re.I))],
            "what": clip(plain(what.group(1)), 300) if what else "",
        })
    return out


def read_doc(path: Path) -> dict | None:
    if not path.exists():
        return None
    md = read(path)
    s = sections(md)
    return {
        "file": path.name, "title": h1(md, path.name), "lines": md.count("\n") + 1,
        "outline": re.findall(r"^##\s+(.+)$", md, re.M)[:14],
        "status": plain(field(md, "Status")),
        "goal": clip(first_para(s.get("goal", "") or s.get("problem statement", "")), 260),
        "steps": [clip(plain(x), 140) for x in re.findall(r"^\d+\.\s+(.+)$", s.get("steps", ""), re.M)],
    }


def extract(folder: Path) -> dict:
    data = read_map(read(folder / "map.md"), folder.name)
    data["issues"] = read_issues(folder, data.pop("gists"))
    data["tickets"] = read_tickets(folder)
    data["spec"] = read_doc(folder / "spec.md")
    data["plan"] = read_doc(folder / "plan.md")
    return data


def render(data: dict) -> str:
    html = read(HERE / "map.html")
    # "</" inside the JSON would close the script tag early
    return html.replace("/*DATA*/null", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"), 1)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: python3 render_map.py work/<slug>")
    folder = Path(sys.argv[1])
    if not (folder / "map.md").exists():
        sys.exit(f"no map.md in {folder}")
    data = extract(folder)
    (folder / "map.html").write_text(render(data), encoding="utf-8")
    print(f"wrote {folder / 'map.html'}: {len(data['issues'])} decisions, {len(data['tickets'])} tickets")


if __name__ == "__main__":
    main()
