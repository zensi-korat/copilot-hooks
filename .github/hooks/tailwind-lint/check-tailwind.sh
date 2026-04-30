#!/usr/bin/env bash
# PostToolUse hook: tailwind-lint scanner
# Checks modified TSX/JSX files for:
#   1. Arbitrary Tailwind values (e.g., w-[100px], bg-[#fff])
#   2. Hardcoded color classes instead of semantic tokens (e.g., bg-white, text-black, bg-blue-500)
# Auto-fixes simple cases where a clear semantic token mapping exists.
# Triggered after: replace_string_in_file, create_file, multi_replace_string_in_file
# Exit 0 → non-blocking (warnings/errors injected via systemMessage)

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

# Filter to TSX/JSX files only
STYLE_FILES=()
for fp in "${FILE_PATHS[@]}"; do
  case "$fp" in
    *.tsx | *.jsx)
      if [[ -f "$fp" ]]; then
        STYLE_FILES+=("$fp")
      fi
      ;;
  esac
done

if [[ ${#STYLE_FILES[@]} -eq 0 ]]; then
  printf '{"continue": true}\n'
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/check-tailwind.py" "${STYLE_FILES[@]}"
