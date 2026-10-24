"""Convert SingStat's SSIC 2025 spreadsheets into data/ssic2025.json.

Usage: python tools/build_ssic.py raw/ssic2025_definitions.xlsx raw/ssic2025_alphabetical_index.xlsx \
           raw/ssic_correspondence_2025_2020.xlsx data/ssic2025.json
"""

import json
import re
import sys
import warnings

import openpyxl

warnings.filterwarnings("ignore")

# SingStat bullets come through as mojibake / private-use glyphs; strip them.
JUNK = re.compile(r"[�\u0080-\u009f-]+")
CODE = re.compile(r"[A-Z]|\d{2,5}")


def clean(value) -> str:
    if value is None:
        return ""
    text = re.sub(r"[ \t\xa0]+", " ", JUNK.sub(" ", str(value)).replace("\r", "")).strip()
    return "" if text == "<Blank>" else text


def lines(value) -> list[str]:
    out = []
    for line in clean(value).split("\n"):
        line = line.strip().lstrip("-•").strip()
        if line:
            out.append(line)
    return out


def level_of(code: str) -> int:
    # A -> 01 -> 011 -> 0111 -> 01111 (section, division, group, class, sub-class)
    return 1 if code.isalpha() else len(code)


def load_nodes(path: str) -> dict:
    ws = openpyxl.load_workbook(path, read_only=True).worksheets[0]
    rows = ws.iter_rows(values_only=True)
    for row in rows:
        if row and row[0] == "SSIC 2025":
            break
    nodes = {}
    section = None
    for row in rows:
        code = clean(row[0])
        if not CODE.fullmatch(code):
            continue
        level = level_of(code)
        if level == 1:
            section = code
        nodes[code] = {
            "code": code,
            "title": re.sub(r"\s*\(Cont\W*d\)", "", clean(row[1])),
            "level": level,
            # divisions hang off the section row above them; deeper codes off their prefix
            "parent": section if level == 2 else (code[:-1] if level > 2 else None),
            "children": [],
            "def": clean(row[3]),
            "elsewhere": lines(row[4]),
            "examples": lines(row[5]),
            "alt": [],
        }
    for code, node in nodes.items():
        if node["parent"]:
            nodes[node["parent"]]["children"].append(code)
    return nodes


def load_alt_titles(path: str, nodes: dict) -> int:
    """Alternative titles from the alphabetical index — the everyday words for each sub-class."""
    ws = openpyxl.load_workbook(path, read_only=True).worksheets[0]
    count = 0
    for row in ws.iter_rows(values_only=True):
        code, title, kind = clean(row[0]), clean(row[1]), clean(row[2])
        if code in nodes and kind == "Alternative Title" and title not in nodes[code]["alt"]:
            nodes[code]["alt"].append(title)
            count += 1
    return count


def load_correspondence(path: str) -> dict[str, list[str]]:
    ws = openpyxl.load_workbook(path, read_only=True)["2020_2025"]
    mapping: dict[str, list[str]] = {}
    for row in ws.iter_rows(values_only=True):
        old, new = clean(row[2]), clean(row[4])
        if re.fullmatch(r"\d{5}", old) and re.fullmatch(r"\d{5}", new):
            mapping.setdefault(old, [])
            if new not in mapping[old]:
                mapping[old].append(new)
    return mapping


def main() -> None:
    definitions, index, correspondence, out = sys.argv[1:5]
    nodes = load_nodes(definitions)
    alt = load_alt_titles(index, nodes)
    roots = [code for code, node in nodes.items() if node["level"] == 1]
    data = {
        "version": "SSIC 2025",
        "roots": roots,
        "nodes": nodes,
        "ssic2020to2025": load_correspondence(correspondence),
    }
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    by_level = {}
    for node in nodes.values():
        by_level[node["level"]] = by_level.get(node["level"], 0) + 1
    leaves = [n for n in nodes.values() if not n["children"]]
    widest = max(nodes.values(), key=lambda n: len(n["children"]))
    print("roots:", "".join(roots))
    print("nodes per level:", dict(sorted(by_level.items())))
    print("widest node:", widest["code"], widest["title"], len(widest["children"]))
    print("non-leaf nodes without children:", [c for c, n in nodes.items() if n["level"] < 5 and not n["children"]])
    print("leaves not at level 5:", [n["code"] for n in leaves if n["level"] != 5])
    print("leaves with definition / examples / alt titles:",
          sum(bool(n["def"]) for n in leaves), sum(bool(n["examples"]) for n in leaves), sum(bool(n["alt"]) for n in leaves),
          "of", len(leaves), f"({alt} alt titles)")
    print("2020->2025 mappings:", len(data["ssic2020to2025"]))


if __name__ == "__main__":
    main()
