#!/usr/bin/env bash
# SessionStart hook: report toolchain readiness into the agent's context.
#
# Runs this repo's own `scripts/dev-setup.sh --check` (fast, installs nothing)
# and injects one concise line. It must never block session start, so it always
# exits 0. `--check` signals gaps with `MISSING` lines rather than an exit code,
# so that is what is grepped for.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
setup="$root/scripts/dev-setup.sh"

if [ ! -x "$setup" ]; then
  echo "Toolchain: setup script not found at $setup."
  exit 0
fi

# Strip ANSI colour so the injected context is clean text.
out="$("$setup" --check 2>&1 | sed -E 's/\x1b\[[0-9;]*m//g')"
missing="$(printf '%s\n' "$out" | grep -i 'MISSING' || true)"

if [ -n "$missing" ]; then
  printf 'Toolchain: NOT ready —\n%s\nRun ./scripts/dev-setup.sh before building.\n' "$missing"
else
  echo "Toolchain ready. Workbench: ./scripts/dev-up.sh · full gate: npm run ci"
fi
exit 0
