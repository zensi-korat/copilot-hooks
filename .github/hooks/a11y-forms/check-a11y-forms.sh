#!/usr/bin/env bash
# PostToolUse hook: a11y form field aria-label check + auto-fix
# Triggered after: replace_string_in_file, create_file, multi_replace_string_in_file
# Exit 0  → success (non-blocking)
# Exit 2  → blocking error (surfaces to agent)

set -uo pipefail

# Debug logging
DEBUG_LOG="${HOME}/.copilot-hooks-debug.log"

# ── 1. Parse stdin ───────────────────────────────────────────────────────────
INPUT=$(cat)

# Log raw input for debugging
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hook triggered. Input length: ${#INPUT}" >> "$DEBUG_LOG"
echo "Raw input: $INPUT" >> "$DEBUG_LOG"

extract() {
  echo "$INPUT" | python3 -c "$1" 2>&1
}

# Extract tool name
TOOL_NAME=$(extract "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_name', d.get('toolName', '')), end='')
")
echo "Tool name: '$TOOL_NAME'" >> "$DEBUG_LOG"

# ── 2. Extract file paths based on tool ──────────────────────────────────────
FILE_PATHS=()

case "$TOOL_NAME" in
  replace_string_in_file | create_file)
    fp=$(extract "
import sys, json
d = json.load(sys.stdin)
inp = d.get('tool_input', d.get('toolInput', {}))
print(inp.get('filePath', inp.get('file_path', '')), end='')
")
    if [[ -n "$fp" ]]; then
      FILE_PATHS+=("$fp")
      echo "Found file path: '$fp'" >> "$DEBUG_LOG"
    fi
    ;;

  multi_replace_string_in_file)
    while IFS= read -r line; do
      [[ -n "$line" ]] && FILE_PATHS+=("$line")
      echo "Added path: '$line'" >> "$DEBUG_LOG"
    done < <(extract "
import sys, json
d = json.load(sys.stdin)
inp = d.get('tool_input', d.get('toolInput', {}))
paths = list(dict.fromkeys(
  r.get('filePath', r.get('file_path', ''))
  for r in inp.get('replacements', [])
))
print('\n'.join(p for p in paths if p), end='')
")
    ;;

  *)
    echo "Tool name '$TOOL_NAME' not matched. Skipping hook." >> "$DEBUG_LOG"
    printf '{"continue": true}\n'
    exit 0
    ;;
esac

echo "Total file paths extracted: ${#FILE_PATHS[@]}" >> "$DEBUG_LOG"

# ── 3. Filter to TSX/JSX only ────────────────────────────────────────────────
TS_FILES=()
for fp in "${FILE_PATHS[@]}"; do
  case "$fp" in
    *.tsx | *.jsx)
      if [[ -f "$fp" ]]; then
        TS_FILES+=("$fp")
        echo "Added TS file: '$fp'" >> "$DEBUG_LOG"
      else
        echo "File not found (skipped): '$fp'" >> "$DEBUG_LOG"
      fi
      ;;
    *)
      echo "Non-TS file (skipped): '$fp'" >> "$DEBUG_LOG"
      ;;
  esac
done

echo "Total TS files to check: ${#TS_FILES[@]}" >> "$DEBUG_LOG"

if [[ ${#TS_FILES[@]} -eq 0 ]]; then
  echo "No TS files to check, exiting." >> "$DEBUG_LOG"
  printf '{"continue": true}\n'
  exit 0
fi

# ── 4. Run Python a11y checker ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Running Python checker: python3 '$SCRIPT_DIR/check-a11y-forms.py' ${TS_FILES[*]}" >> "$DEBUG_LOG"
python3 "$SCRIPT_DIR/check-a11y-forms.py" "${TS_FILES[@]}"
EXIT_CODE=$?
echo "Python checker exit code: $EXIT_CODE" >> "$DEBUG_LOG"
exit $EXIT_CODE
