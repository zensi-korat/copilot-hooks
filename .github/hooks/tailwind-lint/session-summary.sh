#!/usr/bin/env bash
# Stop hook: tailwind-lint session summary.
# Reads session.log, totals errors/warnings/fixes, prints final report, then clears the log.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$SCRIPT_DIR/session.log"

if [[ ! -f "$LOG" ]] || [[ ! -s "$LOG" ]]; then
  printf '{"continue": true, "systemMessage": "[tailwind-lint] No Tailwind checks ran this session."}\n'
  exit 0
fi

python3 - "$LOG" <<'PYEOF'
import sys, json
from pathlib import Path

log_path = Path(sys.argv[1])
lines = [l.strip() for l in log_path.read_text(encoding="utf-8").splitlines() if l.strip()]

all_errors: list = []
all_warnings: list = []
all_fixes: list = []

for line in lines:
    try:
        rec = json.loads(line)
        all_errors.extend(rec.get("errors", []))
        all_warnings.extend(rec.get("warnings", []))
        all_fixes.extend(rec.get("fixes", []))
    except Exception:
        pass

# Clear log for next session
log_path.write_text("", encoding="utf-8")

total_e = len(all_errors)
total_w = len(all_warnings)
total_f = len(all_fixes)

if total_e == 0 and total_w == 0 and total_f == 0:
    print(json.dumps({
        "continue": True,
        "systemMessage": "[tailwind-lint] Session Summary — ✅ No Tailwind violations found this session!",
    }))
    sys.exit(0)

header = (
    f"[tailwind-lint] Session Summary — "
    f"{total_e} error(s)  |  {total_w} warning(s)  |  {total_f} auto-fix(es)"
)
out = [header, ""]

if total_f > 0:
    out.append(f"  🔧 Auto-fixed ({total_f}):")
    for fix in all_fixes:
        out.append(f"    ✓ {fix['message']}")
    out.append("")

if total_e > 0:
    out.append(f"  ❌ Errors requiring manual fix ({total_e}):")
    for err in all_errors:
        out.append(f"    ✗ {err['message']}")
    out.append("")

if total_w > 0:
    out.append(f"  ⚠️  Warnings ({total_w}):")
    for w in all_warnings:
        out.append(f"    ⚠ {w['message']}")
    out.append("")

if total_e > 0 or total_w > 0:
    out.append("Guidance: Replace hardcoded values with semantic tokens from src/styles/global.css")
    out.append("  Colors  → bg-background, text-foreground, border-border, bg-primary, text-muted-foreground …")
    out.append("  Spacing → use Tailwind preset scale (p-4, mt-2, gap-6) instead of arbitrary values")

print(json.dumps({"continue": True, "systemMessage": "\n".join(out)}))
PYEOF
