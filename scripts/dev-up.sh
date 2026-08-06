#!/usr/bin/env bash
#
# Start the component workbench — Storybook, on http://localhost:6006.
#
# This is the "run it" entry point, matching the shape of dev-up.sh in
# insolvia-ai/insolvia so muscle memory carries across. What it starts is
# different in kind, though, and worth being clear about: there is no app here.
# The workbench renders both leaves of each component — the `.web` leaf that
# marketing ships and the `.native` leaf that the Expo app ships — side by side
# in one page, which is the only place in either repo that comparison exists.
#
# The tests are the other half of the loop and answer a different question.
# `npm run test` (or `npx vitest --watch` for a live loop) asserts roles,
# labels and state machines in jsdom. Neither can see that something is the
# wrong colour, in the wrong place, or painted underneath the thing below it —
# which is what shipped as the 0.7.1 Select stacking bug, "invisible to every
# test in this package".
#
# Usage:
#   ./scripts/dev-up.sh              # start on :6006
#   ./scripts/dev-up.sh --port 7007  # anything after the script name is passed through
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

log()  { printf '\033[1;34m[ds-up]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }

cd "$REPO_ROOT"

# A missing install is the overwhelmingly likely reason this fails, and
# Storybook's own error for it is long and points elsewhere.
if [[ ! -d node_modules/storybook ]]; then
  warn "dependencies are not installed — running ./scripts/dev-setup.sh first."
  ./scripts/dev-setup.sh
fi

log "starting the workbench on http://localhost:6006 (ctrl-c to stop)"
exec npm run storybook -- "$@"
