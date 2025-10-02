#!/usr/bin/env bash
set -Eeuo pipefail

# --------------------------------------------------------------------
# Local publish to Verdaccio (no Git pushes, no Rush publish workflow)
#
# What it does:
#   - Verifies Verdaccio reachability.
#   - Ensures NPM_AUTH_TOKEN for //localhost:4873/.
#   - Optionally bumps versions via "rush version".
#   - Publishes all @quojs/* packages to Verdaccio with:
#       --registry <verdaccio>
#       --access public (scoped)
#       --ignore-scripts (avoid husky & prepack mishaps)
#       --provenance=false (npm 9/10 provenance breaks on non-npmjs)
#
# Usage:
#   common/scripts/publish-verdaccio.sh [--registry URL]
#                                       [--skip-bump] [--skip-tests]
#
# Examples:
#   common/scripts/publish-verdaccio.sh
#   common/scripts/publish-verdaccio.sh --registry http://localhost:4873/
# --------------------------------------------------------------------

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
cd "$REPO_ROOT"

REGISTRY="http://localhost:4873"
SKIP_BUMP="true"
SKIP_TESTS="false"

log()  { printf "\033[1;34m[publish-verdaccio]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*"; }
die()  { printf "\033[1;31m[error]\033[0m %s\n" "$*"; exit 1; }
need() { command -v "$1" >/dev/null || die "Missing dependency: $1"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --registry)   REGISTRY="${2%/}/"; shift 2 ;;
    --skip-bump)  SKIP_BUMP="true"; shift ;;
    --skip-tests) SKIP_TESTS="true"; shift ;;
    -h|--help)
      cat <<EOF
Usage: common/scripts/publish-verdaccio.sh [--registry URL] [--skip-bump] [--skip-tests]
Defaults: --registry http://localhost:4873/
EOF
      exit 0 ;;
    *) die "Unknown arg: $1" ;;
  esac
done

need curl
need node
need npm
need pnpm
need rush

log "Repo root: $REPO_ROOT"
log "Registry:  $REGISTRY"

# 1) Reachability
if ! curl -fsS "${REGISTRY%-/}/-/ping" >/dev/null 2>&1; then
  die "Verdaccio not reachable at ${REGISTRY}. Start it first (e.g., docker compose -f ops/verdaccio/docker-compose.yml up -d)"
fi
log "Verdaccio ping OK."

# 2) Token
HOST="$(printf "%s" "$REGISTRY" | sed -E 's|^https?://||; s|/.*$||')"
if [[ -z "${NPM_AUTH_TOKEN:-}" ]]; then
  if [[ -f "$HOME/.npmrc" ]]; then
    TOKEN="$(awk -v h="$HOST" 'match($0, "^//"h"/:_authToken=(.+)$", a){print a[1]}' "$HOME/.npmrc" | tail -n1 || true)"
    [[ -n "$TOKEN" ]] && export NPM_AUTH_TOKEN="$TOKEN"
  fi
fi
[[ -n "${NPM_AUTH_TOKEN:-}" ]] || die "NPM_AUTH_TOKEN not set for //$HOST/. Run: npm adduser --registry ${REGISTRY}"

# 3) Optional bump
if [[ "$SKIP_BUMP" != "true" ]]; then
  log "Generating change files…"
  rush change -v || warn "No change files; proceeding"
  log "Applying version bump (rush version)…"
  rush version || warn "Version bump skipped or failed; proceeding"
else
  warn "Skipping version bump (--skip-bump)."
fi

# 4) Publish all public packages (@quojs/*) without Git pushes
log "Publishing all @quojs/* packages to ${REGISTRY}…"
pnpm -r --filter "@quojs/*" --filter "!@quojs/repo-tools" --filter "!@quojs/quojs" \
  exec -- npm publish \
    --registry "$REGISTRY" \
    --access public \
    --ignore-scripts \
    --provenance=false

log "Publish completed."

# 5) Optional example install/build smoke (against Verdaccio)
if [[ "$SKIP_TESTS" == "true" ]]; then
  warn "Skipping example smoke (--skip-tests)."
  exit 0
fi

log "Running example smoke against freshly published packages…"
if [[ -d "examples/quojs-in-react" ]]; then
  pushd "examples/quojs-in-react" >/dev/null
  npm_config_registry="$REGISTRY" pnpm install
  if npm pkg get scripts.build >/dev/null 2>&1; then pnpm build; fi
  popd >/dev/null
fi

log "Done."
