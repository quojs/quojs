#!/usr/bin/env bash
set -Eeuo pipefail

# ------------------------------------------------------------------------------
# verify-npm-access.sh
#   Verifies you can publish @<scope>/<pkg> to a registry before running
#   `rush publish`. Checks:
#     - npm auth (whoami)
#     - org membership for scope
#     - package existence & your write access (if already published)
#     - .npmrc-publish points to the target registry for the scope
#
# Location: common/scripts/verify-npm-access.sh
#
# Usage:
#   common/scripts/verify-npm-access.sh [--scope quojs] [--registry URL]
#                                       [--access public]
#
# Examples:
#   common/scripts/verify-npm-access.sh
#   common/scripts/verify-npm-access.sh --scope quojs --registry https://registry.npmjs.org/
# ------------------------------------------------------------------------------

# Resolve repo root from this script's directory (common/scripts/ -> repo root ../..)
SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
cd "$REPO_ROOT"

SCOPE="quojs"         # default org/scope (without leading @)
REGISTRY="https://registry.npmjs.org/"
ACCESS_LEVEL="public"   # first publish must be public for scoped packages

# ------------------------- arg parsing ----------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope)    SCOPE="${2#@}"; shift 2 ;;  # strip leading @ if provided
    --registry) REGISTRY="$2"; shift 2 ;;
    --access)   ACCESS_LEVEL="$2"; shift 2 ;;
    -h|--help)
      cat <<EOF
Usage: common/scripts/verify-npm-access.sh [--scope quojs] [--registry URL] [--access public]
Defaults: --scope quojs --registry https://registry.npmjs.org/ --access public
EOF
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

SCOPE_AT="@${SCOPE}"
SCOPE_AT_SLASH="@${SCOPE}/"
HOST="$(printf "%s" "$REGISTRY" | sed -E 's|^https?://||; s|/.*$||')"

# ------------------------- helpers --------------------------------------------
need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 127; }; }

log()  { printf "\033[1;34m[verify-npm-access]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*"; }
die()  { printf "\033[1;31m[error]\033[0m %s\n" "$*"; exit 1; }

# ------------------------- preflight ------------------------------------------
need npm

log "Repo root: $REPO_ROOT"
log "Scope:     $SCOPE_AT"
log "Registry:  $REGISTRY"

# Registry reachability/auth check:
# Use 'npm ping' (works for npmjs and Verdaccio). Fall back to simple curl if needed.
if ! npm ping --registry "$REGISTRY" >/dev/null 2>&1; then
  if ! curl -fsS "$REGISTRY/-/ping" >/dev/null 2>&1 && ! curl -fsSI "$REGISTRY" >/dev/null 2>&1; then
    die "Registry not reachable or not responding to ping: $REGISTRY"
  else
    warn "npm ping failed, but registry responded to HTTP probe; continuing."
  fi
fi
log "Registry reachable."

# Verify .npmrc-publish exists and references the registry for this scope
PUBLISH_NPMRC="$REPO_ROOT/common/config/rush/.npmrc-publish"
if [[ -f "$PUBLISH_NPMRC" ]]; then
  if ! grep -Eq "^${SCOPE_AT}:registry=${REGISTRY//\//\\/}" "$PUBLISH_NPMRC"; then
    warn "${PUBLISH_NPMRC} does not map ${SCOPE_AT} to ${REGISTRY}."
    warn "Add a line: ${SCOPE_AT}:registry=${REGISTRY}"
  fi
  # Check auth token host
  if ! grep -Eq "^//${HOST}/:_authToken=" "$PUBLISH_NPMRC"; then
    warn "${PUBLISH_NPMRC} does not contain token entry for //${HOST}/:_authToken=\${NPM_AUTH_TOKEN}"
  fi
else
  warn "Missing ${PUBLISH_NPMRC}. Rush uses this for publish-time auth."
fi

# Verify npm login
if ! NPM_USER="$(npm whoami --registry "$REGISTRY" 2>/dev/null || true)" || [[ -z "$NPM_USER" ]]; then
  die "Not logged into npm. Run: npm login --registry $REGISTRY"
fi
log "npm user:  $NPM_USER"

# Verify org membership (if org exists)
ORG_JSON="$(npm org ls "$SCOPE" --json 2>/dev/null || true)"
if [[ -z "$ORG_JSON" ]]; then
  warn "Could not list org members for '$SCOPE'. The org may not exist or you may not be a member."
  warn "If this scope is a *user* scope, that's ok. Otherwise create/join the npm org: npm org add $SCOPE $NPM_USER"
else
  if command -v node >/dev/null 2>&1; then
    if ! echo "$ORG_JSON" | node -e "const m=JSON.parse(require('fs').readFileSync(0,'utf8'));const u=process.argv[1];process.exit(m[u] ? 0:1)" "$NPM_USER"; then
      warn "You are not listed in the '$SCOPE' org. Ask an owner to add you: npm org add $SCOPE $NPM_USER"
    else
      log "Org membership OK for @$SCOPE"
    fi
  else
    if echo "$ORG_JSON" | grep -q ""$NPM_USER""; then
      log "Org membership seems OK for @$SCOPE (grep fallback)"
    else
      warn "You may not be in the '$SCOPE' org (grep fallback). Ask an owner to add you: npm org add $SCOPE $NPM_USER"
    fi
  fi
fi

# ------------------------- collect packages from rush.json ---------------------
RUSH_JSON="$REPO_ROOT/rush.json"
[[ -f "$RUSH_JSON" ]] || die "rush.json not found at repo root."

# Extract publishable package names from rush.json (shouldPublish !== false)
# Prefer Node for robust JSON parsing; fallback to grep if Node not on PATH
if command -v node >/dev/null 2>&1; then
  PKG_LIST=$(node -e '
    const fs=require("fs");
    const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
    const out=[];
    for (const p of j.projects||[]) {
      if (p.shouldPublish === false) continue;
      if (p.packageName) out.push(p.packageName);
    }
    console.log(out.join("\n"));
  ' "$RUSH_JSON")
else
  # naive fallback: list all packageName values (may include non-publishable projects)
  PKG_LIST=$(grep -o '"packageName":[[:space:]]*"[^"]*"' "$RUSH_JSON" | sed 's/.*"packageName":[[:space:]]*"\([^"]*\)".*/\1/')
fi

if [[ -z "$PKG_LIST" ]]; then
  die "No publishable packages found in rush.json"
fi

log "Publishable packages from rush.json:"
echo "$PKG_LIST" | sed 's/^/  - /'

echo

# ------------------------- per-package checks ---------------------------------
EXIT_CODE=0
while read -r PKG; do
  [[ -n "$PKG" ]] || continue

  if [[ "$PKG" != ${SCOPE_AT_SLASH}* ]]; then
    warn "$PKG is not in scope ${SCOPE_AT}. Skipping scope-specific checks."
    continue
  fi

  echo "---- $PKG ----"

  # Check if package exists on target registry
  if npm view "$PKG" version --registry "$REGISTRY" >/dev/null 2>&1; then
    VER="$(npm view "$PKG" version --registry "$REGISTRY" 2>/dev/null || echo "?")"
    log "Published on registry ($REGISTRY): version $VER"

    # Check write access by listing collaborators (requires rights)
    if COLLABS_JSON="$(npm access ls-collaborators "$PKG" --json 2>/dev/null || true)" && [[ -n "$COLLABS_JSON" ]]; then
      if echo "$COLLABS_JSON" | node -e "const c=JSON.parse(require('fs').readFileSync(0,'utf8'));const u=process.argv[1];process.exit(c[u] && c[u].write ? 0:1)" "$NPM_USER"; then
        log "Write access: OK (you are a collaborator)"
      else
        warn "No write access on $PKG for $NPM_USER"
        EXIT_CODE=1
      fi
    else
      warn "Could not verify collaborators for $PKG (you may not have access). If publish fails with 403, request access."
      # do not fail hard here
    fi
  else
    warn "$PKG not found on registry. First publish will need: --access $ACCESS_LEVEL"
    log  "Example: rush publish --set-access-level $ACCESS_LEVEL --apply --publish --target-branch main"
  fi

  echo
done <<< "$PKG_LIST"

# ------------------------- summary --------------------------------------------
if [[ $EXIT_CODE -ne 0 ]]; then
  die "Some checks failed. See warnings above."
else
  log "All checks passed (or produced only non-fatal warnings). You should be able to publish."
fi
