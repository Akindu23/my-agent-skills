#!/usr/bin/env python3
"""Validate a static SVG for the svg-diagrams skill (Python 3 stdlib only)."""

from __future__ import annotations

import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG_NS = "http://www.w3.org/2000/svg"
ANIM_ELEMENTS = frozenset(
    {"animate", "animatetransform", "animatemotion", "animatecolor", "set"}
)
EXTERNAL_URL = re.compile(
    r"""(?:https?:)?//|https?:|url\s*\(\s*['"]?(?:https?:)?//""",
    re.IGNORECASE,
)
FONT_FACE = re.compile(r"@font-face\b", re.IGNORECASE)
KEYFRAMES = re.compile(r"@keyframes\b", re.IGNORECASE)
ANIMATION_PROP = re.compile(r"(?:^|[\s;{])animation(?:-name)?\s*:", re.IGNORECASE)


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if tag.startswith("{") else tag


def ns_uri(tag: str) -> str | None:
    return tag[1:].rsplit("}", 1)[0] if tag.startswith("{") else None


def attr_local(name: str) -> str:
    return name.rsplit("}", 1)[-1] if name.startswith("{") else name


def err(msg: str) -> None:
    print(f"svg-validate: error: {msg}", file=sys.stderr)


def collect_text(el: ET.Element) -> str:
    parts: list[str] = []
    if el.text:
        parts.append(el.text)
    for child in el:
        parts.append(collect_text(child))
        if child.tail:
            parts.append(child.tail)
    return "".join(parts).strip()


def valid_view_box(value: str | None) -> bool:
    if not value:
        return False
    parts = value.replace(",", " ").split()
    if len(parts) != 4:
        return False
    try:
        list(map(float, parts))
    except ValueError:
        return False
    return True


def has_title(root: ET.Element) -> bool:
    """Require a non-empty child <title>; aria-* may supplement, not replace."""
    for child in root:
        if local_name(child.tag).lower() == "title" and collect_text(child):
            return True
    return False


def scan_style_text(text: str, where: str, errors: list[str]) -> None:
    if FONT_FACE.search(text):
        errors.append(f"forbidden @font-face in {where}")
    if KEYFRAMES.search(text):
        errors.append(f"forbidden CSS @keyframes in {where}")
    if ANIMATION_PROP.search(text):
        errors.append(f"forbidden CSS animation property in {where}")
    if EXTERNAL_URL.search(text):
        errors.append(f"forbidden external URL in {where}")


def validate(path: Path) -> list[str]:
    errors: list[str] = []
    raw = path.read_text(encoding="utf-8-sig")
    lower = raw.lower()

    # yagni: stdlib ET rejects external entities but not entity-bomb DoS; reject DTD/ENTITY up front.
    if "<!doctype" in lower:
        errors.append("forbidden <!DOCTYPE> in SVG")
    if "<!entity" in lower:
        errors.append("forbidden <!ENTITY> in SVG")
    if errors:
        return errors

    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        return [f"malformed XML: {exc}"]

    if local_name(root.tag).lower() != "svg":
        return [f"root element must be <svg>, got <{local_name(root.tag)}>"]

    uri = ns_uri(root.tag)
    if uri != SVG_NS and root.attrib.get("xmlns") != SVG_NS:
        errors.append(f"missing root xmlns (expected {SVG_NS})")

    view_box = root.attrib.get("viewBox") or root.attrib.get("viewbox")
    if not valid_view_box(view_box):
        errors.append("missing or invalid viewBox on <svg>")

    if not has_title(root):
        errors.append("missing non-empty child <title> on <svg>")

    for el in root.iter():
        name = local_name(el.tag).lower()
        if name == "script":
            errors.append("forbidden element <script>")
        if name in ANIM_ELEMENTS:
            errors.append(f"forbidden animation element <{local_name(el.tag)}>")

        for attr, value in el.attrib.items():
            al = attr_local(attr).lower()
            if al.startswith("on"):
                errors.append(
                    f"forbidden event-handler attribute {attr_local(attr)} "
                    f"on <{local_name(el.tag)}>"
                )
            if al == "href" or attr.endswith("}href"):
                v = (value or "").strip()
                if EXTERNAL_URL.search(v) or v.lower().startswith(
                    ("http:", "https:", "//")
                ):
                    errors.append(f"forbidden external URL in {attr_local(attr)}: {v}")

        if name == "style":
            scan_style_text(collect_text(el), "<style>", errors)

        style_attr = el.attrib.get("style")
        if style_attr:
            scan_style_text(style_attr, f'style="" on <{local_name(el.tag)}>', errors)

    return errors


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        err("usage: validate.py PATH.svg")
        return 2

    path = Path(argv[1])
    if not path.is_file():
        err(f"file not found: {path}")
        return 2

    errors = validate(path)
    if errors:
        for message in errors:
            err(message)
        return 1

    print(f"OK: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
