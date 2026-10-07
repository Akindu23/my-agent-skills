#!/usr/bin/env python3
"""Write <report>.html next to a code-review report: verdict banner, then a checklist of what to fix.

Usage: python3 render_review.py work/<slug>/review.md

Stdlib only. This file only reads the markdown into JSON and fills review.html (the template beside it).
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOCATION = re.compile(r"^(.+?):(\d+(?:-\d+)?)$")


def sections(md: str) -> tuple[str, dict[str, str]]:
    # text before the first "## ", then "## Heading" -> body keyed by the lower-case heading
    intro, out, cur = [], {}, None
    for line in md.splitlines():
        m = re.match(r"^##\s+(.+?)\s*$", line)
        if m:
            cur = m.group(1).lower()
            out[cur] = ""
        elif cur:
            out[cur] += line + "\n"
        elif not line.startswith("# "):
            intro.append(line)
    return " ".join(l.strip() for l in intro if l.strip()), out


def cells(line: str) -> list[str]:
    # split a table row on pipes outside backticks, so `a || b` stays one cell
    out, cur, in_code, i = [], "", False, 0
    body = line.strip().strip("|")
    while i < len(body):
        ch = body[i]
        if ch == "\\" and body[i + 1 : i + 2] == "|":
            cur, i = cur + "|", i + 2
            continue
        if ch == "`":
            in_code = not in_code
        if ch == "|" and not in_code:
            out.append(cur.strip())
            cur = ""
        else:
            cur += ch
        i += 1
    out.append(cur.strip())
    return out


def table(body: str) -> list[dict[str, str]]:
    # rows keyed by the lower-case header, so column order and extra columns do not matter
    lines = [l for l in body.splitlines() if l.strip().startswith("|")]
    if len(lines) < 2:
        return []
    head = [h.lower() for h in cells(lines[0])]
    return [dict(zip(head, cells(l))) for l in lines[2:]]


def location(raw: str) -> tuple[str, str]:
    raw = raw.strip().strip("`")
    m = LOCATION.match(raw)
    return (m.group(1), m.group(2)) if m else (raw, "")


def item(kind: str, row: dict, text_col: str, fix_col: str = "", lens: str = "", **extra) -> dict:
    file, line = location(row.get("location", ""))
    return {"kind": kind, "file": file, "line": line, "lens": lens or row.get("lens", ""),
            "text": row.get(text_col, ""), "fix": row.get(fix_col, "") if fix_col else "", **extra}


def bullets(body: str) -> list[str]:
    # "- item" lines, with indented continuation lines folded in; plain paragraphs count as items too
    out: list[str] = []
    for line in body.splitlines():
        if re.match(r"^\s*[-*]\s+", line):
            out.append(re.sub(r"^\s*[-*]\s+", "", line).strip())
        elif line.strip() and out and line.startswith((" ", "\t")):
            out[-1] += " " + line.strip()
        elif line.strip():
            out.append(line.strip())
    return out


def findings(body: str) -> list[dict]:
    out = []
    for row in table(body):
        it = item("finding", row, "finding", "fix", sev=row.get("severity", "").strip("*"))
        if not it["fix"] and " Fix: " in it["text"]:  # reports written before the Fix column
            it["text"], it["fix"] = it["text"].split(" Fix: ", 1)
        out.append(it)
    return out


def extract(path: Path) -> dict:
    md = path.read_text(encoding="utf-8")
    intro, s = sections(md)
    items = findings(s.get("findings", ""))
    items += [item("slop", r, "hit", lens=r.get("class", "")) for r in table(s.get("slop", ""))]
    items += [item("structure", r, "finding", "remedy", lens="thermos-quality") for r in table(s.get("structure", ""))]
    items += [item("dismissed", r, "finding", why=r.get("why dismissed", "")) for r in table(s.get("dismissed", ""))]
    verdict = s.get("verdict", "").strip()
    word = re.search(r"\*\*(.+?)\*\*", verdict) or re.search(r"^([^.\n]+)", verdict)
    count = lambda sev: int(m.group(1)) if (m := re.search(rf"{sev}:\s*(\d+)", verdict)) else sum(
        1 for i in items if i["kind"] == "finding" and i["sev"] == sev)
    return {
        # a new review gets a new key, so ticks from the last one do not carry over
        "key": hashlib.sha1(md.encode()).hexdigest()[:12],
        "title": path.parent.name if path.stem == "review" else path.stem,
        "intro": intro,
        "verdict": word.group(1).strip().rstrip(".") if word else "",
        "p0": count("P0"),
        "p1": count("P1"),
        "items": items,
        "skipped": bullets(s.get("skipped", "")),
        "notes": bullets(s.get("notes", "")),
    }


def render(data: dict) -> str:
    html = (HERE / "review.html").read_text(encoding="utf-8")
    # "</" inside the JSON would close the script tag early
    return html.replace("/*DATA*/null", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"), 1)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: python3 render_review.py work/<slug>/review.md")
    path = Path(sys.argv[1])
    if not path.exists():
        sys.exit(f"no report at {path}")
    data = extract(path)
    out = path.with_suffix(".html")
    out.write_text(render(data), encoding="utf-8")
    kinds = [i["kind"] for i in data["items"]]
    print(f"wrote {out}: {data['verdict'] or 'no verdict'}, P0 {data['p0']}, P1 {data['p1']}, "
          f"{kinds.count('slop')} slop, {kinds.count('structure')} structure, {kinds.count('dismissed')} dismissed")


if __name__ == "__main__":
    main()
