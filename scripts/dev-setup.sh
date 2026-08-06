#!/usr/bin/env bash
#
# Developer bootstrap for the design-system repo.
#
# Deliberately tiny. This repo publishes two npm packages and has no cloud
# account, no infrastructure and no native build, so Node plus an install is the
# whole toolchain. Resist growing this to match a consumer's setup script "for
# consistency" — it would turn a 30-second setup into a 10-minute one for tools
# nothing here uses.
#
# NO REGISTRY TOKEN IS NEEDED to work here. @insolvia-ai/tokens is a workspace
# member, so npm links it from source; every other dependency is public. A token
# is only required to *consume* these packages from the registry.
#
# IDEMPOTENT: everything is checked before it is done, so re-running is cheap.
#
# Usage:
#   ./scripts/dev-setup.sh            # set up
#   ./scripts/dev-setup.sh --check    # report only, change nothing
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CHECK_ONLY=0
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1

# Read from the file that owns it, never hard-coded twice.
NODE_MAJOR_MIN="$(node -p "require('$REPO_ROOT/package.json').engines.node.replace(/[^0-9]/g,'')" 2>/dev/null || echo 24)"

log()  { printf '\033[1;34m[ds-setup]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ ok ]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[fail]\033[0m %s\n' "$*" >&2; }

# ── Node ─────────────────────────────────────────────────────────────────────
#
# Checked rather than installed. This repo has no opinion on how you get Node —
# brew, nvm, mise, asdf, a system package — and a script that installed one of
# them would fight whichever you already use. `engines.node` is the contract;
# this only reports whether it is met.
if ! command -v node >/dev/null 2>&1; then
  err "MISSING node (>=${NODE_MAJOR_MIN}). Install it however you prefer (brew install node, nvm install ${NODE_MAJOR_MIN}, …)."
  exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "$node_major" -lt "$NODE_MAJOR_MIN" ]]; then
  err "MISSING node >=${NODE_MAJOR_MIN} (found $(node --version))."
  err "Node's native TypeScript type-stripping is what lets the token generator run with no build step; older majors cannot."
  exit 1
fi
ok "node $(node --version) (>=${NODE_MAJOR_MIN})."

# ── Dependencies ─────────────────────────────────────────────────────────────
if [[ "$CHECK_ONLY" -eq 1 ]]; then
  if [[ -d "$REPO_ROOT/node_modules/storybook" ]]; then
    ok "workspace installed."
  else
    warn "MISSING workspace install (would: npm ci)."
  fi
  exit 0
fi

log "installing the npm workspace..."
# `ci`, not `install`: the committed lockfile is the point, and `ci` fails
# loudly when it and the manifests have drifted apart rather than quietly
# resolving something new.
(cd "$REPO_ROOT" && npm ci)

ok "ready."
printf '\n  Look at components:  ./scripts/dev-up.sh\n  Run the full gate:   npm run ci\n\n'
