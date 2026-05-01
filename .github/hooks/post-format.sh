#!/usr/bin/env bash
# Post-tool hook: runs pnpm lint:fix + pnpm format on every file written by the agent.
# Triggered after: replace_string_in_file, create_file, multi_replace_string_in_file
# Exit 0  → success (non-blocking)
# Exit 2  → blocking error (will surface to agent)

set -uo pipefail

# ── 1. Parse stdin ──────────────────────────────────────────────────────────────
INPUT=$(cat)

extract() {
  python3 -c "$1" 2>/dev/null || echo ""
}

TOOL_NAME=$(extract "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_name', d.get('toolName', '')) )
" <<< "$INPUT")

# ── 2. Collect file paths based on tool name ───────────────────────────────────
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
    # Not a file-editing tool — nothing to do.
    printf '{"continue": true}\n'
    exit 0
    ;;
esac

if [[ ${#FILE_PATHS[@]} -eq 0 ]]; then
  printf '{"continue": true}\n'
  exit 0
fi

# ── 3. Filter to TS/TSX/JS/JSX files only ─────────────────────────────────────
TS_FILES=()
for fp in "${FILE_PATHS[@]}"; do
  case "$fp" in
    *.ts | *.tsx | *.js | *.jsx)
      [[ -f "$fp" ]] && TS_FILES+=("$fp")
      ;;
  esac
done

if [[ ${#TS_FILES[@]} -eq 0 ]]; then
  printf '{"continue": true}\n'
  exit 0
fi

# ── 4. Resolve workspace root (directory containing pnpm-lock.yaml) ─────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

if [[ ! -f "$WORKSPACE_ROOT/pnpm-lock.yaml" ]]; then
  # Fallback: use cwd
  WORKSPACE_ROOT="$PWD"
fi

# ── 5. Run prettier format ─────────────────────────────────────────────────────
FORMAT_OUT=$(cd "$WORKSPACE_ROOT" && pnpm format "${TS_FILES[@]}" 2>&1) || {
  printf '{
  "continue": true,
  "systemMessage": "⚠️  Prettier reported issues after file write:\n%s"
}\n' "$FORMAT_OUT"
  exit 0
}

# ── 6. Run ESLint fix ──────────────────────────────────────────────────────────
LINT_OUT=$(cd "$WORKSPACE_ROOT" && pnpm lint:fix "${TS_FILES[@]}" 2>&1)
LINT_EXIT=$?

if [[ $LINT_EXIT -ne 0 ]]; then
  printf '{
  "continue": true,
  "systemMessage": "⚠️  ESLint found issues after file write (auto-fix applied where possible):\n%s\nPlease review and fix remaining lint errors before committing."
}\n' "$LINT_OUT"
  exit 0
fi

# ── 7. All clean ──────────────────────────────────────────────────────────────
printf '{"continue": true}\n'
exit 0
