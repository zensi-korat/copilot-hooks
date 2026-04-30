#!/usr/bin/env bash
# PostToolUse hook: component-reuse scanner
# Warns when native HTML elements are used instead of available global components.
# Triggered after: replace_string_in_file, create_file, multi_replace_string_in_file
# Exit 0  → non-blocking (warnings only)

set -uo pipefail

INPUT=$(cat)

extract() {
  python3 -c "$1" 2>/dev/null || echo ""
}

TOOL_NAME=$(extract "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_name', d.get('toolName', '')))
" <<< "$INPUT")

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

# Filter to TSX/JSX only, exclude the ui/ directory itself
TSX_FILES=()
for fp in "${FILE_PATHS[@]}"; do
  case "$fp" in
    *.tsx | *.jsx)
      # Skip files that ARE the ui components — no point checking them
      if [[ "$fp" != *"/components/ui/"* ]] && [[ -f "$fp" ]]; then
        TSX_FILES+=("$fp")
      fi
      ;;
  esac
done

if [[ ${#TSX_FILES[@]} -eq 0 ]]; then
  printf '{"continue": true}\n'
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/check-component-reuse.py" "${TSX_FILES[@]}"
