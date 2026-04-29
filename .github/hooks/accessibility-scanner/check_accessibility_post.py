#!/usr/bin/env python3
"""
WCAG heuristic analyser for a single frontend source file.
Called by check_accessibility_post.sh after the agent edits a file.

Exit codes:
  0  — no issues
  2  — issues found (output surfaced as model feedback)
"""
import re
import sys


def line_of(content: str, pos: int) -> int:
    return content[:pos].count("\n") + 1


def compact(text: str, maxlen: int = 80) -> str:
    return re.sub(r"\s+", " ", text).strip()[:maxlen]


def analyse(filepath: str) -> list[dict]:
    try:
        with open(filepath, encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return []

    issues: list[dict] = []

    def add(wcag: str, criterion: str, msg: str, line: int, code: str, fix: str) -> None:
        issues.append(
            {
                "num": len(issues) + 1,
                "wcag": wcag,
                "criterion": criterion,
                "msg": msg,
                "line": line,
                "code": code,
                "fix": fix,
            }
        )

    # ── WCAG 1.1.1 — Images missing alt text (Level A) ───────────────────────
    for m in re.finditer(r"<img\b.*?(?:/>|>)", content, re.DOTALL):
        tag = m.group(0)
        if not re.search(r"\balt\s*=", tag):
            add(
                "1.1.1",
                "Non-text Content",
                "<img> missing alt attribute",
                line_of(content, m.start()),
                compact(tag),
                'Add alt="Descriptive text" for informative images, or alt="" for decorative ones.',
            )

    # ── WCAG 1.3.1 / 3.3.2 — Form controls without label binding (Level A/AA) ─
    for m in re.finditer(r"<(input|textarea|select)\b.*?(?:/>|>)", content, re.DOTALL):
        tag = m.group(0)
        elem = m.group(1)
        if not re.search(r"\b(aria-label|aria-labelledby|id)\s*=", tag):
            add(
                "1.3.1 / 3.3.2",
                "Labels",
                f"<{elem}> has no id or aria-label attribute",
                line_of(content, m.start()),
                compact(tag),
                f'Add id="fieldId" and a matching <label htmlFor="fieldId">, or aria-label="...".',
            )

    # ── WCAG 2.4.3 — Positive tabIndex (Level A) ─────────────────────────────
    for m in re.finditer(r'tabIndex\s*=\s*\{?([1-9]\d*)|tabindex\s*="([1-9]\d*)"', content):
        lnum = line_of(content, m.start())
        add(
            "2.4.3",
            "Focus Order",
            "Positive tabIndex disrupts natural keyboard navigation order",
            lnum,
            compact(content.splitlines()[lnum - 1]),
            "Use tabIndex={0} or remove the attribute; rely on DOM order for focus sequence.",
        )

    # ── WCAG 2.4.4 — Vague link text (Level A) ───────────────────────────────
    # Only match text between JSX tags, not inside attribute values
    for m in re.finditer(
        r">\s*(click here|read more|learn more|more info)\s*<",
        content,
        re.IGNORECASE,
    ):
        lnum = line_of(content, m.start())
        add(
            "2.4.4",
            "Link Purpose",
            f'Vague link text: "{m.group(1)}"',
            lnum,
            compact(content.splitlines()[lnum - 1]),
            "Replace with text that describes the destination or action when read out of context.",
        )

    # ── WCAG 4.1.2 — aria-hidden on focusable elements (Level A) ────────────
    for m in re.finditer(
        r'(<a|<button|<input)\b[^>]*aria-hidden\s*=\s*["\'{]true',
        content,
        re.DOTALL,
    ):
        add(
            "4.1.2",
            "Name, Role, Value",
            f"aria-hidden=\"true\" on an interactive {m.group(1)} element",
            line_of(content, m.start()),
            compact(m.group(0)),
            "Remove aria-hidden from interactive elements; only use it on presentational wrappers.",
        )

    # ── WCAG 1.3.1 — Heading level skips (Level A) ───────────────────────────
    headings = re.findall(r"<[hH]([1-6])", content)
    prev = 0
    for h in headings:
        lvl = int(h)
        if prev != 0 and lvl - prev > 1:
            add(
                "1.3.1",
                "Info & Relationships",
                f"Heading level skips from h{prev} to h{lvl}",
                0,
                "",
                "Use sequential heading levels (h1→h2→h3). Use CSS for visual size, not level skips.",
            )
            break
        prev = lvl

    # ── WCAG 3.1.1 — Missing lang on <html> (Level A, .html only) ───────────
    if filepath.endswith(".html"):
        if not re.search(r"<html\b[^>]+lang\s*=", content):
            add(
                "3.1.1",
                "Language of Page",
                "<html> element is missing a lang attribute",
                1,
                "",
                'Add lang="en" (or your locale code) to the opening <html> tag.',
            )

    return issues


def report(filepath: str, issues: list[dict]) -> int:
    """Print a formatted accessibility report. Returns exit code."""
    if not issues:
        print(f"[a11y] ✓ No accessibility issues detected in: {filepath}")
        return 0

    sep = "━" * 65
    print()
    print(sep)
    print(f"[a11y] ACCESSIBILITY AUDIT — {filepath}")
    print(sep)
    print()

    for issue in issues:
        print(f"[{issue['num']}] WCAG {issue['wcag']} ({issue['criterion']}) — {issue['msg']}")
        if issue["line"]:
            print(f"     Line : {issue['line']}")
        if issue["code"]:
            print(f"     Code : {issue['code']}")
        print(f"     Fix  : {issue['fix']}")
        print()

    count = len(issues)
    print(sep)
    print(f"{count} accessibility issue(s) found in the file you just edited.")
    print()
    print("Shall I implement these fixes?")
    print(f'  • Reply "yes"        — apply all {count} fixes')
    print('  • Reply "fix 1,3"    — apply only the numbered items')
    print('  • Reply "no"         — skip (you can run this check manually later)')
    print(sep)

    # Exit 2 surfaces output as feedback to the agent.
    # PostToolUse already completed — this does NOT undo the file write.
    return 2


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(0)

    target = sys.argv[1]
    found = analyse(target)
    sys.exit(report(target, found))
