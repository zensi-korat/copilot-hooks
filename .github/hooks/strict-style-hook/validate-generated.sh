#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run Node validator. Accepts file paths as args.
ROOT_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
SCRIPT="$ROOT_DIR/.github/hooks/validate-generated.js"

if [ ! -f "$SCRIPT" ]; then
  echo "Validator script not found: $SCRIPT" >&2
  exit 1
fi

if [ "$#" -gt 0 ]; then
  node "$SCRIPT" "$@"
else
  # No files passed: scan configured paths from hook JSON or default to src/
  echo "No file paths provided; scanning workspace src/ for candidates..."
  # find source files
  files=$(git ls-files -- "src/**/*.{ts,tsx,js,jsx,css,scss}" 2>/dev/null || true)
  if [ -z "$files" ]; then
    # fallback to globbing
    files=$(find "$ROOT_DIR/src" -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" 2>/dev/null || true)
  fi
  if [ -z "$files" ]; then
    echo "No files found to validate." && exit 0
  fi
  node "$SCRIPT" $files
fi
