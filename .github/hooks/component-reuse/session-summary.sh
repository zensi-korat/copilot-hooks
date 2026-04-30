#!/usr/bin/env bash
# Stop hook: component-reuse session summary.
# Reads session.log, totals warnings, prints report, clears log.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$SCRIPT_DIR/session.log"

if [[ ! -f "$LOG" ]] || [[ ! -s "$LOG" ]]; then
  printf '{"continue": true, "systemMessage": "[component-reuse] No component-reuse checks ran this session."}\n'
  exit 0
fi

python3 - "$LOG" <<'PYEOF'
import sys, json
from pathlib import Path
from collections import defaultdict

log_path = Path(sys.argv[1])
lines = [l.strip() for l in log_path.read_text(encoding="utf-8").splitlines() if l.strip()]

total_warnings = 0
by_global: dict = defaultdict(list)

for line in lines:
    try:
        rec = json.loads(line)
        for w in rec.get("warnings", []):
            total_warnings += 1
            by_global[w["global"]].append(w)
    except Exception:
        pass

# Clear log for next session
log_path.write_text("", encoding="utf-8")

if total_warnings == 0:
    print(json.dumps({
        "continue": True,
        "systemMessage": "[component-reuse] Session Summary — ✅ No native-element violations found!"
    }))
    sys.exit(0)

header = f"[component-reuse] Session Summary — ⚠️  {total_warnings} warning(s) across {len(by_global)} component type(s)"
out_lines = [header, ""]

for global_name, warns in sorted(by_global.items()):
    out_lines.append(f"  <{global_name}> — {len(warns)} occurrence(s):")
    for w in warns:
        imported_hint = " (already imported)" if w.get("imported") else ""
        out_lines.append(f"    ⚠ {w['file']}:{w['line']} — {w['note']}{imported_hint}")

out_lines.append("")
out_lines.append("Fix: replace native elements with their global counterparts from @/components/ui/")

print(json.dumps({"continue": True, "systemMessage": "\n".join(out_lines)}))
PYEOF
