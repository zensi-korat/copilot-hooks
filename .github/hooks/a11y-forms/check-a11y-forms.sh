#!/usr/bin/env bash
# PostToolUse hook: a11y form field aria-label check + auto-fix
# Triggered after: replace_string_in_file, create_file, multi_replace_string_in_file
# Exit 0  → success (non-blocking)
# Exit 2  → blocking error (surfaces to agent)

set -uo pipefail

# ── 1. Parse stdin ───────────────────────────────────────────────────────────
INPUT=$(cat)

extract() {
  python3 -c "$1" 2>/dev/null || echo ""
}

TOOL_NAME=$(extract "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_name', d.get('toolName', '')))
" <<< "$INPUT")

# ── 2. Collect file paths ────────────────────────────────────────────────────
FILE_PATHS=()

case "$TOOL_NAME" in
  replace_string_in_file | create_file)
    fp=$(extract "
import sys, json
d = json.load(sys.stdin)
inp = d.get('tool_input', d.get('toolInput', {}))
print(inp.get('filePath', inp.get('file_path', '')))
" <<< "$INPUT")
    [[ -n "$fp" ]] && FILE_PATHS+=("$fp")
    ;;

  multi_replace_string_in_file)
    while IFS= read -r line; do
      [[ -n "$line" ]] && FILE_PATHS+=("$line")
    done < <(extract "
import sys, json
d = json.load(sys.stdin)
inp = d.get('tool_input', d.get('toolInput', {}))
paths = list(dict.fromkeys(
  r.get('filePath', r.get('file_path', ''))
  for r in inp.get('replacements', [])
))
print('\n'.join(p for p in paths if p))
" <<< "$INPUT")
    ;;

  *)
    printf '{"continue": true}\n'
    exit 0
    ;;
esac

# ── 3. Filter to TSX/JSX only ────────────────────────────────────────────────
TS_FILES=()
for fp in "${FILE_PATHS[@]}"; do
  case "$fp" in
    *.tsx | *.jsx)
      [[ -f "$fp" ]] && TS_FILES+=("$fp")
      ;;
  esac
done

if [[ ${#TS_FILES[@]} -eq 0 ]]; then
  printf '{"continue": true}\n'
  exit 0
fi

# ── 4. Run Python a11y checker ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/check-a11y-forms.py" "${TS_FILES[@]}"
