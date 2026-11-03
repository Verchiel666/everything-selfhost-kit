#!/usr/bin/env sh
# Fetch the upstream source as a tarball (no git needed; also much faster than a
# 1.3 GB clone). Extracts to $EVERYTHING_ROOT.
set -e
HOME=${HOME:-$PWD}
ROOT=${EVERYTHING_ROOT:-$HOME/everything}
REF=${REF:-main}
URL=${URL:-https://codeload.github.com/HeyPuter/everything/tar.gz/refs/heads/$REF}
TMP="$ROOT/../everything-$REF.tar.gz"
mkdir -p "$ROOT/.."
echo "downloading $URL"
curl -L --retry 2 -m 1800 "$URL" -o "$TMP"
mkdir -p "$ROOT"
tar xzf "$TMP" -C "$ROOT" --strip-components=1
echo "source ready at $ROOT ($(du -sh "$ROOT" 2>/dev/null | cut -f1))"
