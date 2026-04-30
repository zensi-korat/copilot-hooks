#!/usr/bin/env bash
# Stop hook: display a11y form-check session summary and clear the log.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$SCRIPT_DIR/session.log"

if [[ ! -f "$LOG" ]] || [[ ! -s "$LOG" ]]; then
  printf '{"continue": true, "systemMessage": "[a11y-forms] No form field checks ran this session."}\n'
  exit 0
fi

python3 - "$LOG" <<'PYEOF'
import sys, json
from pathlib import Path

log_path = Path(sys.argv[1])
lines = [l.strip() for l in log_path.read_text(encoding="utf-8").splitlines() if l.strip()]

total_errors   = 0
total_warnings = 0
total_fixes    = 0
error_details  = []
warning_details = []

for line in lines:
    try:
        rec = json.loads(line)
        errors   = rec.get("errors",   [])
        warnings = rec.get("warnings", [])
        fixes    = rec.get("fixes",    0)
        total_errors += len(errors)
        total_fixes  += fixes
        for w in warnings:
            if w.get("type") == "warning":
                total_warnings += 1
                warning_details.append(w)
        error_details.extend(errors)
    except Exception:
        pass

# Clear the log so it only covers the current session
log_path.write_text("", encoding="utf-8")

header = (
    f"[a11y-forms] Session Summary — "
    f"❌ {total_errors} error(s)  |  "
    f"⚠️  {total_warnings} warning(s)  |  "
    f"✅ {total_fixes} auto-fix(es)"
)
out_lines = [header]

if error_details:
    out_lines.append("\nErrors:")
    for e in error_details:
        out_lines.append(f"  ✗ {e['file']}:{e['line']} — <{e['element']}> {e['message']}")

if warning_details:
    out_lines.append("\nWarnings:")
    for w in warning_details:
        out_lines.append(f"  ⚠ {w['file']}:{w['line']} — {w['message']}")

if not error_details and not warning_details:
    out_lines.append("\n  All checked form fields are accessible! 🎉")

print(json.dumps({"continue": True, "systemMessage": "\n".join(out_lines)}))
PYEOF
