#!/usr/bin/env bash
# Publish tide-now/dist/ to the gh-pages branch under /tide-now/ (GitHub Pages, branch-based
# deploy, same gh-pages worktree used by personal-site/scripts/publish.sh). Run from anywhere:
#   bash tide-now/scripts/publish.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SITE="$ROOT/tide-now/dist"
WT="$ROOT/../oev-pages"

node --check "$SITE/app.js"

git -C "$ROOT" fetch -q origin gh-pages
if [ ! -d "$WT" ]; then
  git -C "$ROOT" worktree add -q "$WT" -B gh-pages origin/gh-pages
else
  git -C "$WT" checkout -q gh-pages && git -C "$WT" pull -q --ff-only origin gh-pages
fi

mkdir -p "$WT/tide-now"
rsync -a --exclude '.git' "$SITE/" "$WT/tide-now/"

git -C "$WT" add -A
if git -C "$WT" diff --cached --quiet; then echo "nothing to publish"; exit 0; fi
git -C "$WT" commit -qm "Publish tide-now $(date +%Y-%m-%d)"
git -C "$WT" push -q origin gh-pages
echo "published: https://oriolson.github.io/oev-expanse/tide-now/ (allow a minute)"
