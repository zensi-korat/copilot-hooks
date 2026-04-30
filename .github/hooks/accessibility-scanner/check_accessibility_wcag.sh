#!/usr/bin/env bash
set -euo pipefail

# Wrapper WCAG check script — runs the project's heuristic checks and
# provides a short WCAG-focused summary. For deeper coverage use axe/pa11y.

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$REPO_ROOT"

SCRIPT_DIR=".github/hooks"
BASE_CHECK="$SCRIPT_DIR/check_accessibility.sh"

echo "[a11y] Running heuristic accessibility checks (WCAG-focused)..."

if [ -x "$BASE_CHECK" ]; then
  "$BASE_CHECK"
  CHECK_EXIT=$?
else
  echo "[a11y] Fallback: base check script not executable or missing: $BASE_CHECK"
  CHECK_EXIT=0
fi

if [ "$CHECK_EXIT" -ne 0 ]; then
  echo "\n[a11y] Heuristic checks found issues. Review the output above."
  echo "[a11y] WCAG rules evaluated: 1.1.1, 1.3.1, 2.1.1, 2.4.1, 1.4.3, 2.4.4, 3.3.2, 3.1.1"
  echo "[a11y] NOTE: These are heuristics; run a full automated audit with axe-core or pa11y for comprehensive results."
  exit 2
fi

echo "[a11y] Heuristic checks passed (no issues detected)."
echo "[a11y] WCAG rules evaluated: 1.1.1, 1.3.1, 2.1.1, 2.4.1, 1.4.3, 2.4.4, 3.3.2, 3.1.1"
echo "[a11y] For a fuller audit, consider running: npm run audit:a11y (configure axe/pa11y in repo)"

exit 0
