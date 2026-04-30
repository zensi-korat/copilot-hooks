#!/usr/bin/env bash
# .github/hooks/check_accessibility_post.sh
#
# PostToolUse hook — fires after the agent writes or edits a file.
# Reads the JSON payload Claude sends via stdin, extracts the modified file,
# then delegates all WCAG analysis to check_accessibility_post.py.
#
# Exit codes mirror the Python script:
#   0  — no issues (silent)
#   2  — issues found; output is surfaced back to the model as feedback

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

PY_SCRIPT="$SCRIPT_DIR/check_accessibility_post.py"

# ── 1. Obtain target file ────────────────────────────────────────────────────
# Claude passes a JSON object via stdin for PostToolUse hooks, e.g.:
#   { "tool_name": "Edit", "tool_input": { "file_path": "src/..." }, ... }
TARGET_FILE=""
if [ ! -t 0 ]; then
  PAYLOAD=$(cat)
  if [ -n "$PAYLOAD" ]; then
  # More robust JSON parsing: walk the payload and find the first
  # string value that looks like a frontend source file path and exists.
  TARGET_FILE=$(echo "$PAYLOAD" | python3 - <<'PY'
import json, os, sys, re

def is_candidate(s):
  if not isinstance(s, str):
    return False
  s = s.strip()
  if not s:
    return False
  # common frontend extensions we care about
  if not re.search(r"\.(tsx|jsx|ts|js|html|vue|svelte)$", s, re.IGNORECASE):
    return False
  # check for file existence (absolute or relative)
  if os.path.isabs(s) and os.path.exists(s):
    return True
  # try relative to repo root (assumed cwd)
  if os.path.exists(s):
    return True
  return False

def walk(obj):
  if isinstance(obj, dict):
    for v in obj.values():
      r = walk(v)
      if r:
        return r
  elif isinstance(obj, list):
    for v in obj:
      r = walk(v)
      if r:
        return r
  else:
    if is_candidate(obj):
      return obj.strip()
  return None

try:
  data = json.load(sys.stdin)
  # common locations
  ti = data.get('tool_input') if isinstance(data, dict) else None
  if ti:
    for key in ('file_path','file','path','paths','files'):
      if isinstance(ti, dict) and key in ti:
        val = ti[key]
        if isinstance(val, str) and is_candidate(val):
          print(val.strip()); sys.exit(0)
        if isinstance(val, list):
          for item in val:
            if isinstance(item, dict) and 'filePath' in item and is_candidate(item['filePath']):
              print(item['filePath'].strip()); sys.exit(0)

  # fallback: scan entire payload for the first candidate path
  cand = walk(data)
  if cand:
    print(cand)
except Exception:
  pass
PY
 2>/dev/null || true)
  fi
fi

# Allow manual testing: pass file path as first argument
if [ -z "$TARGET_FILE" ] && [ "${1:-}" != "" ]; then
  TARGET_FILE="$1"
fi

# Guard: must exist and be a frontend source file worth scanning
if [ -z "$TARGET_FILE" ] || [ ! -f "$TARGET_FILE" ]; then
  exit 0
fi
if ! echo "$TARGET_FILE" | grep -qE '\.(tsx|jsx|ts|js|html|vue|svelte)$'; then
  exit 0
fi
# Skip vendor files
if echo "$TARGET_FILE" | grep -qE 'node_modules|\.pnpm|dist/|\.next/'; then
  exit 0
fi

# ── 2. Delegate analysis to Python ──────────────────────────────────────────
python3 "$PY_SCRIPT" "$TARGET_FILE"

