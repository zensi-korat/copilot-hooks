#!/usr/bin/env python3
"""
check-tailwind.py
Scans TSX/JSX files for Tailwind violations:
  1. Arbitrary values in any class (e.g., w-[100px], mt-[1.5rem], p-[12px])
  2. Hardcoded color classes instead of semantic tokens
     (e.g., bg-white, text-black, bg-blue-500, border-gray-200)

Color-specific arbitrary values (e.g., bg-[#fff], text-[rgb(0,0,0)]) are
treated as errors (stricter than general arbitrary value warnings).

Auto-fixes simple cases where a clear semantic token mapping exists.
Appends JSON records to session.log for end-of-session summary.
"""

import sys
import re
import json
from pathlib import Path

SESSION_LOG = Path(__file__).parent / "session.log"

# ── Tailwind color palette names ─────────────────────────────────────────────
TW_COLORS = [
    "slate", "gray", "zinc", "neutral", "stone",
    "red", "orange", "amber", "yellow", "lime",
    "green", "emerald", "teal", "cyan", "sky",
    "blue", "indigo", "violet", "purple", "fuchsia",
    "pink", "rose",
]

# ── Color utility prefixes ────────────────────────────────────────────────────
COLOR_PREFIXES = [
    "bg", "text", "border", "ring", "fill", "stroke",
    "from", "to", "via", "shadow", "outline", "accent",
    "caret", "decoration", "placeholder",
]

# ── Pattern: arbitrary values (e.g., w-[100px], h-[200px], bg-[#fff]) ────────
# Matches: word-chars[anything-except-closing-bracket]
ARBITRARY_RE = re.compile(r'\b([\w][\w/-]*)\[([^\]]+)\]')

# ── Pattern: hardcoded named Tailwind colors ──────────────────────────────────
# Matches: bg-blue-500, text-red-400, border-gray-200, bg-white, bg-black, etc.
HARDCODED_COLOR_RE = re.compile(
    r'\b(?:' + '|'.join(COLOR_PREFIXES) + r')'
    r'-(?:(?:' + '|'.join(TW_COLORS) + r')(?:-\d+)?|white|black)'
    r'(?:/\d+)?\b'
)

# ── Auto-fixable mappings: hardcoded class → semantic token ──────────────────
AUTOFIXABLE: dict[str, str] = {
    "bg-white":   "bg-background",
    "bg-black":   "bg-foreground",
    "text-white": "text-background",
    "text-black": "text-foreground",
}


def is_css_var(bracket_content: str) -> bool:
    """CSS variables inside brackets are acceptable (not arbitrary values)."""
    s = bracket_content.strip()
    return s.startswith("--") or s.startswith("var(--")


def get_line(text: str, pos: int) -> int:
    return text[:pos].count("\n") + 1


def strip_comments(text: str) -> str:
    """Remove JSX block comments and JS line comments to avoid false positives."""
    text = re.sub(r"\{/\*.*?\*/\}", "", text, flags=re.DOTALL)
    text = re.sub(r"//[^\n]*", "", text)
    return text


def check_and_fix_file(filepath: str) -> tuple[list, list, list, bool]:
    errors: list[dict] = []
    warnings: list[dict] = []
    fixes: list[dict] = []

    try:
        content = Path(filepath).read_text(encoding="utf-8")
    except Exception as exc:
        errors.append({
            "type": "error", "file": filepath, "line": 0,
            "class": "", "message": f"Could not read file: {exc}", "category": "io-error",
        })
        return errors, warnings, fixes, False

    original_content = content
    check_text = strip_comments(content)
    short = Path(filepath).name

    seen: set[str] = set()  # deduplicate by (line, class)

    # ── 1. Arbitrary values ───────────────────────────────────────────────────
    for match in ARBITRARY_RE.finditer(check_text):
        bracket_val = match.group(2)
        if is_css_var(bracket_val):
            continue

        full_class = match.group(0)
        prefix = match.group(1)
        line = get_line(check_text, match.start())
        key = f"{line}:{full_class}"
        if key in seen:
            continue
        seen.add(key)

        is_color_prefix = prefix.split("-")[0] in COLOR_PREFIXES

        if is_color_prefix:
            errors.append({
                "type": "error", "file": filepath, "line": line,
                "class": full_class,
                "message": (
                    f"Arbitrary color value '{full_class}' in {short}:{line} — "
                    "use a semantic token from global.css (e.g., bg-primary, text-foreground)"
                ),
                "category": "arbitrary-color",
            })
        else:
            warnings.append({
                "type": "warning", "file": filepath, "line": line,
                "class": full_class,
                "message": (
                    f"Arbitrary value '{full_class}' in {short}:{line} — "
                    "prefer a design token or Tailwind preset"
                ),
                "category": "arbitrary-value",
            })

    # ── 2. Hardcoded named color classes ─────────────────────────────────────
    for match in HARDCODED_COLOR_RE.finditer(check_text):
        full_class = match.group(0)
        line = get_line(check_text, match.start())
        key = f"{line}:{full_class}"
        if key in seen:
            continue
        seen.add(key)

        if full_class in AUTOFIXABLE:
            replacement = AUTOFIXABLE[full_class]
            content = re.sub(r"\b" + re.escape(full_class) + r"\b", replacement, content)
            fixes.append({
                "type": "fix", "file": filepath, "line": line,
                "from": full_class, "to": replacement,
                "message": f"Auto-fixed '{full_class}' → '{replacement}' in {short}:{line}",
            })
        else:
            errors.append({
                "type": "error", "file": filepath, "line": line,
                "class": full_class,
                "message": (
                    f"Hardcoded color '{full_class}' in {short}:{line} — "
                    "use a semantic token (bg-background, text-foreground, border-border, bg-primary, etc.)"
                ),
                "category": "hardcoded-color",
            })

    # ── Write back if auto-fixes were applied ─────────────────────────────────
    was_modified = content != original_content
    if was_modified:
        Path(filepath).write_text(content, encoding="utf-8")

    return errors, warnings, fixes, was_modified


def main() -> None:
    filepaths = sys.argv[1:]
    if not filepaths:
        print(json.dumps({"continue": True}))
        return

    all_errors: list[dict] = []
    all_warnings: list[dict] = []
    all_fixes: list[dict] = []

    for fp in filepaths:
        errors, warnings, fixes, _ = check_and_fix_file(fp)
        all_errors.extend(errors)
        all_warnings.extend(warnings)
        all_fixes.extend(fixes)

    # ── Append to session log ─────────────────────────────────────────────────
    record = {"errors": all_errors, "warnings": all_warnings, "fixes": all_fixes}
    with open(SESSION_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    # ── Build system message ───────────────────────────────────────────────────
    if not all_errors and not all_warnings and not all_fixes:
        print(json.dumps({"continue": True, "systemMessage": "[tailwind-lint] ✅ No Tailwind violations found."}))
        return

    lines = ["[tailwind-lint] Tailwind check:", ""]

    if all_fixes:
        lines.append(f"  🔧 Auto-fixed {len(all_fixes)} issue(s):")
        for fix in all_fixes:
            lines.append(f"    ✓ {fix['message']}")
        lines.append("")

    if all_errors:
        lines.append(f"  ❌ {len(all_errors)} error(s) require manual fix:")
        for err in all_errors:
            lines.append(f"    ✗ {err['message']}")
        lines.append("")

    if all_warnings:
        lines.append(f"  ⚠️  {len(all_warnings)} warning(s):")
        for w in all_warnings:
            lines.append(f"    ⚠ {w['message']}")
        lines.append("")

    if all_errors:
        lines.append("Replace hardcoded values with semantic tokens from src/styles/global.css")

    print(json.dumps({"continue": True, "systemMessage": "\n".join(lines)}))


if __name__ == "__main__":
    main()
