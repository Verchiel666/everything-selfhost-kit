#!/usr/bin/env sh
# Bootstrap npm with nothing but node + curl (for machines without a system npm).
# Installs into $HOME/tools/npm; afterwards: node $HOME/tools/npm/bin/npm-cli.js -v
set -e
HOME=${HOME:-$PWD}
REG=${NPM_REGISTRY:-https://registry.npmmirror.com}
mkdir -p "$HOME/tools"
cd "$HOME/tools"
curl -sSL -m 30 "$REG/npm/latest" -o npm_latest.json
V=$(node -e 'console.log(require("./npm_latest.json").version)')
echo "installing npm $V"
curl -sSL -m 120 "$REG/npm/-/npm-$V.tgz" -o npm.tgz
rm -rf npm && tar xzf npm.tgz && mv package npm
node npm/bin/npm-cli.js -v
