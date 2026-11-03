#!/usr/bin/env sh
# Build one or more apps from HeyPuter/everything into a static site directory.
# Works on a normal Linux box and on an Android phone (no npm scripts, no exec bit).
#
#   EVERYTHING_ROOT=~/src/everything SITE_DIR=~/site sh build-apps.sh spreadsheet documents
#
# Env:
#   EVERYTHING_ROOT  checkout of https://github.com/HeyPuter/everything (default: ~/everything)
#   SITE_DIR         output site root (default: ~/everything-site)
#   NPM              npm command (default: `npm` if on PATH, else `node $HOME/tools/npm/bin/npm-cli.js`)
#   NPM_REGISTRY     registry to use (default: https://registry.npmmirror.com)
set -e

HOME=${HOME:-$PWD}
ROOT=${EVERYTHING_ROOT:-$HOME/everything}
OUT=${SITE_DIR:-$HOME/everything-site}
REG=${NPM_REGISTRY:-https://registry.npmmirror.com}

if [ -z "$NPM" ]; then
  if command -v npm >/dev/null 2>&1; then NPM=npm
  elif [ -f "$HOME/tools/npm/bin/npm-cli.js" ]; then NPM="node $HOME/tools/npm/bin/npm-cli.js"
  else echo "no npm found; set NPM=... or see scripts/bootstrap-npm.sh" >&2; exit 1; fi
fi

# The Android/embedded-node build constraints:
#  - `npm run build` executes node_modules/.bin/* which is not allowed (EACCES) -> call vite by its JS entry
#  - the lightningcss native addon cannot be dlopen'ed        -> cssMinify:false via an override config
#  - some apps ship no `base` and emit absolute /assets/ URLs -> force base:'./' so a subpath works
VITE="node node_modules/vite/bin/vite.js"

mkdir -p "$OUT"
for APP in "$@"; do
  [ -d "$ROOT/src/$APP" ] || { echo "MISSING $APP"; continue; }
  cd "$ROOT/src/$APP"
  LOG="$ROOT/src/$APP/.build.log"; : > "$LOG"
  if [ ! -d node_modules ]; then
    $NPM ci --registry=$REG --no-audit --no-fund --ignore-scripts >>"$LOG" 2>&1 \
      || $NPM ci --registry=$REG --no-audit --no-fund >>"$LOG" 2>&1 \
      || { echo "INSTALL_FAIL $APP (see $LOG)"; continue; }
  fi
  if [ ! -f vite.config.local.mjs ]; then
    cat > vite.config.local.mjs <<'CFG'
import base from './vite.config.js';
const resolved = typeof base === 'function' ? base({ command: 'build', mode: 'production' }) : base;
export default { ...resolved, base: './', build: { ...(resolved.build || {}), cssMinify: false } };
CFG
  fi
  # optional room worker -> public/worker (must run before the main build)
  WORKER=$(node -e 'const p=require("./package.json");console.log(p.scripts&&p.scripts["build:worker"]||"")' 2>/dev/null || true)
  if [ -n "$WORKER" ]; then
    sh -c "$(echo "$WORKER" | sed 's#^vite #node node_modules/vite/bin/vite.js #')" >>"$LOG" 2>&1 \
      || echo "  warn: worker build failed for $APP"
  fi
  rm -rf dist
  $VITE build --config vite.config.local.mjs >>"$LOG" 2>&1
  if [ -f dist/index.html ]; then
    rm -rf "$OUT/$APP"; mkdir -p "$OUT/$APP"; cp -r dist/. "$OUT/$APP"/
    echo "OK   $APP $(du -sk "$OUT/$APP" 2>/dev/null | cut -f1)KB"
  else
    echo "FAIL $APP (see $LOG)"
  fi
done
