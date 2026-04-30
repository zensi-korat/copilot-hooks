#!/usr/bin/env python3
"""
check-a11y-forms.py
Scans TSX/JSX files for form field accessibility issues (aria-label / aria-labelledby).
Auto-fixes: adds aria-label from placeholder when no other label is present.
Appends JSON result records to session.log for end-of-session summary.
"""

import sys
import re
import json
import os
from pathlib import Path

SESSION_LOG = Path(__file__).parent / "session.log"

# ── Patterns ─────────────────────────────────────────────────────────────────
FORM_TAGS = {
    "input":    re.compile(r'<(?:Input|input)\b([^>\n]*(?:\n[^>\n]*)*?)(\s*/?>)', re.MULTILINE),
    "textarea": re.compile(r'<(?:Textarea|textarea)\b([^>\n]*(?:\n[^>\n]*)*?)(\s*/?>)', re.MULTILINE),
    "select":   re.compile(r'<(?:Select|select)\b([^>\n]*(?:\n[^>\n]*)*?)(\s*/?>)', re.MULTILINE),
    "button":   re.compile(r'<(?:Button|button)\b([^>\n]*(?:\n[^>\n]*)*?)\s*/>', re.MULTILINE),
}

HAS_ARIA_LABEL       = re.compile(r'\baria-label\s*[={\s]',        re.IGNORECASE)
HAS_ARIA_LABELLEDBY  = re.compile(r'\baria-labelledby\s*[={\s]',   re.IGNORECASE)
HAS_ID               = re.compile(r'\bid\s*=\s*["{]([^"}\s]+)',    re.IGNORECASE)
PLACEHOLDER_STR      = re.compile(r'\bplaceholder\s*=\s*"([^"]+)"')
PLACEHOLDER_EXPR     = re.compile(r'\bplaceholder\s*=\s*\{["\']([^"\']+)["\']\}')
HAS_TYPE_HIDDEN      = re.compile(r'\btype\s*=\s*["{]hidden["}]',  re.IGNORECASE)
HAS_ARIA_HIDDEN      = re.compile(r'\baria-hidden\s*=\s*["{]true["}]', re.IGNORECASE)
HAS_ROLE_PRESENTATION = re.compile(r'\brole\s*=\s*["{](?:presentation|none)["}]', re.IGNORECASE)


def get_line_number(text: str, pos: int) -> int:
    return text[:pos].count("\n") + 1


def get_placeholder(attrs: str) -> str | None:
    m = PLACEHOLDER_STR.search(attrs) or PLACEHOLDER_EXPR.search(attrs)
    return m.group(1).strip() if m else None


def check_and_fix_file(filepath: str):
    errors: list[dict] = []
    warnings: list[dict] = []
    fixes: int = 0

    try:
        content = Path(filepath).read_text(encoding="utf-8")
    except Exception as exc:
        errors.append({"type": "error", "file": filepath, "line": 0,
                        "element": "file", "message": f"Could not read file: {exc}"})
        return errors, warnings, fixes

    modified = content

    for elem_type, pattern in FORM_TAGS.items():
        for match in pattern.finditer(content):
            attrs = match.group(1)
            full_tag = match.group(0)
            line = get_line_number(content, match.start())

            # Skip non-interactive elements
            if (HAS_TYPE_HIDDEN.search(attrs)
                    or HAS_ARIA_HIDDEN.search(attrs)
                    or HAS_ROLE_PRESENTATION.search(attrs)):
                continue

            has_label = (HAS_ARIA_LABEL.search(attrs)
                         or HAS_ARIA_LABELLEDBY.search(attrs))

            if has_label:
                continue  # already accessible

            placeholder = get_placeholder(attrs)
            id_match    = HAS_ID.search(attrs)

            if elem_type == "button":
                # Self-closing buttons without any label text
                warnings.append({
                    "type": "warning",
                    "file": filepath,
                    "line": line,
                    "element": "button",
                    "message": "Self-closing <button> is missing aria-label",
                })

            elif placeholder:
                # AUTO-FIX: inject aria-label from placeholder value
                insertion = f' aria-label="{placeholder}"'
                # Insert before the closing /> or >
                closing = match.group(2)
                new_tag = full_tag[: -len(closing)] + insertion + closing
                modified = modified.replace(full_tag, new_tag, 1)
                fixes += 1
                warnings.append({
                    "type": "fixed",
                    "file": filepath,
                    "line": line,
                    "element": elem_type,
                    "message": f'Auto-added aria-label="{placeholder}" (from placeholder)',
                })

            elif id_match:
                # Has an id — a <label htmlFor> might exist elsewhere; warn only
                warnings.append({
                    "type": "warning",
                    "file": filepath,
                    "line": line,
                    "element": elem_type,
                    "message": (
                        f'<{elem_type} id="{id_match.group(1)}"> — '
                        "verify a <label htmlFor> or aria-label is present"
                    ),
                })

            else:
                errors.append({
                    "type": "error",
                    "file": filepath,
                    "line": line,
                    "element": elem_type,
                    "message": (
                        f"<{elem_type}> missing aria-label, aria-labelledby, "
                        "or an associated <label>"
                    ),
                })

    if fixes > 0:
        Path(filepath).write_text(modified, encoding="utf-8")

    return errors, warnings, fixes


def main():
    files = [f for f in sys.argv[1:]
             if f.endswith((".tsx", ".jsx")) and os.path.isfile(f)]

    if not files:
        print(json.dumps({"continue": True}))
        return

    all_errors: list[dict] = []
    all_warnings: list[dict] = []
    total_fixes = 0

    for fp in files:
        errs, warns, fixes = check_and_fix_file(fp)
        all_errors.extend(errs)
        all_warnings.extend(warns)
        total_fixes += fixes

    # ── Append to session log ─────────────────────────────────────────────
    record = {
        "errors":   all_errors,
        "warnings": all_warnings,
        "fixes":    total_fixes,
        "files":    files,
    }
    with open(SESSION_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    # ── Build inline agent message ────────────────────────────────────────
    real_warnings = [w for w in all_warnings if w["type"] == "warning"]
    fixed_items   = [w for w in all_warnings if w["type"] == "fixed"]

    parts = []
    if all_errors:
        parts.append(f"❌ {len(all_errors)} error(s)")
    if real_warnings:
        parts.append(f"⚠️  {len(real_warnings)} warning(s)")
    if fixed_items:
        parts.append(f"✅ {len(fixed_items)} auto-fix(es) applied")

    if not parts:
        print(json.dumps({"continue": True}))
        return

    lines = ["[a11y-forms] " + " | ".join(parts)]
    for e in all_errors:
        lines.append(f"  ✗ {e['file']}:{e['line']} — <{e['element']}> {e['message']}")
    for w in real_warnings:
        lines.append(f"  ⚠ {w['file']}:{w['line']} — {w['message']}")
    for w in fixed_items:
        lines.append(f"  ✓ {w['file']}:{w['line']} — {w['message']}")

    print(json.dumps({"continue": True, "systemMessage": "\n".join(lines)}))


if __name__ == "__main__":
    main()
