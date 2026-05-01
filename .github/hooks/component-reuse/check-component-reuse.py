#!/usr/bin/env python3
"""
check-component-reuse.py
Scans TSX/JSX files for native HTML elements that have a global component equivalent
in src/components/ui/ or src/components/shared/.
Warns when a native element is used instead of the available global component.
Appends JSON records to session.log for end-of-session summary.
"""

import sys
import re
import json
import os
from pathlib import Path

SESSION_LOG = Path(__file__).parent / "session.log"

# ── Native → Global component mapping ────────────────────────────────────────
# Each entry: native tag pattern → (global component name, import path, notes)
COMPONENT_MAP = [
    # Inputs / form elements
    {
        "native":    re.compile(r'<input\b', re.IGNORECASE),
        "global":    "Input",
        "import":    "@/components/ui/input",
        "note":      "Use <Input> from @/components/ui/input",
    },
    {
        "native":    re.compile(r'<textarea\b', re.IGNORECASE),
        "global":    "Textarea",
        "import":    "@/components/ui/textarea",
        "note":      "Use <Textarea> from @/components/ui/textarea",
    },
    {
        "native":    re.compile(r'<select\b', re.IGNORECASE),
        "global":    "Select",
        "import":    "@/components/ui/select",
        "note":      "Use <Select> from @/components/ui/select",
    },
    # Buttons
    {
        "native":    re.compile(r'<button\b', re.IGNORECASE),
        "global":    "Button",
        "import":    "@/components/ui/button",
        "note":      "Use <Button> from @/components/ui/button",
    },
    # Labels
    {
        "native":    re.compile(r'<label\b', re.IGNORECASE),
        "global":    "FieldLabel",
        "import":    "@/components/ui/field",
        "note":      "Use <FieldLabel> from @/components/ui/field (or <Label> from @/components/ui/label)",
    },
    # Cards (plain div used as card)
    {
        "native":    re.compile(r'<div\b[^>]*\bclass(?:Name)?\s*=\s*["\'][^"\']*\b(?:card|Card)\b', re.IGNORECASE),
        "global":    "Card",
        "import":    "@/components/ui/card",
        "note":      "Use <Card>/<CardHeader>/<CardContent> from @/components/ui/card",
    },
    # Separator / horizontal rule
    {
        "native":    re.compile(r'<hr\b', re.IGNORECASE),
        "global":    "Separator",
        "import":    "@/components/ui/separator",
        "note":      "Use <Separator> from @/components/ui/separator",
    },
    # Switch / checkbox styled as toggle
    {
        "native":    re.compile(r'<input\b[^>]*\btype\s*=\s*["\']checkbox["\']', re.IGNORECASE),
        "global":    "Switch",
        "import":    "@/components/ui/switch",
        "note":      "Consider <Switch> from @/components/ui/switch for toggle interactions",
    },
    # RadioGroup
    {
        "native":    re.compile(r'<input\b[^>]*\btype\s*=\s*["\']radio["\']', re.IGNORECASE),
        "global":    "RadioGroup",
        "import":    "@/components/ui/radio-group",
        "note":      "Use <RadioGroup>/<RadioGroupItem> from @/components/ui/radio-group",
    },
]

# Patterns to detect if the global component is already imported in the file
def is_global_already_imported(content: str, global_name: str) -> bool:
    # Matches: import { ..., Button, ... } from "@/components/ui/..."
    return bool(re.search(
        rf'\bimport\b[^;]*\b{re.escape(global_name)}\b[^;]*from\s+["\']@/components/',
        content,
        re.MULTILINE,
    ))

def get_line_number(text: str, pos: int) -> int:
    return text[:pos].count("\n") + 1


def check_file(filepath: str):
    warnings: list[dict] = []

    try:
        content = Path(filepath).read_text(encoding="utf-8")
    except Exception as exc:
        return [{"type": "error", "file": filepath, "line": 0,
                 "native": "file", "global": "", "message": f"Could not read: {exc}"}], 0

    # Strip comments to avoid false positives on commented-out code
    content_no_comments = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
    content_no_comments = re.sub(r'//[^\n]*', '', content_no_comments)

    seen: set[str] = set()

    for mapping in COMPONENT_MAP:
        for match in mapping["native"].finditer(content_no_comments):
            line = get_line_number(content_no_comments, match.start())
            global_name = mapping["global"]

            # Avoid duplicate warnings for the same global on the same line
            key = f"{line}:{global_name}"
            if key in seen:
                continue
            seen.add(key)

            already_imported = is_global_already_imported(content, global_name)

            warnings.append({
                "type":     "warning",
                "file":     filepath,
                "line":     line,
                "native":   match.group(0).strip(),
                "global":   global_name,
                "imported": already_imported,
                "note":     mapping["note"],
                "message":  (
                    f"Native element used — global <{global_name}> exists. "
                    + ("(already imported, just use it)" if already_imported
                       else f"Import from {mapping['import']}")
                ),
            })

    return warnings, 0  # 0 fixes — warnings only for this hook


def main():
    files = [f for f in sys.argv[1:]
             if f.endswith((".tsx", ".jsx")) and os.path.isfile(f)]

    if not files:
        print(json.dumps({"continue": True}))
        return

    all_warnings: list[dict] = []

    for fp in files:
        warns, _ = check_file(fp)
        all_warnings.extend(warns)

    # ── Append to session log ─────────────────────────────────────────────
    record = {
        "warnings": all_warnings,
        "files":    files,
    }
    with open(SESSION_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    if not all_warnings:
        print(json.dumps({"continue": True}))
        return

    # ── Build systemMessage ───────────────────────────────────────────────
    lines = [f"[component-reuse] ⚠️  {len(all_warnings)} warning(s) — native elements used instead of global components:"]

    for w in all_warnings:
        imported_hint = " (already imported — just use it)" if w.get("imported") else ""
        lines.append(
            f"  ⚠ {w['file']}:{w['line']} — "
            f"used `{w['native']}`, prefer <{w['global']}>{imported_hint}\n"
            f"    → {w['note']}"
        )

    print(json.dumps({"continue": True, "systemMessage": "\n".join(lines)}))


if __name__ == "__main__":
    main()
