#!/usr/bin/env bash
# Publish personal-site/ to the gh-pages branch (GitHub Pages, branch-based deploy).
# Used because GitHub Actions is disabled for this account. Run from anywhere:
#   bash personal-site/scripts/publish.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SITE="$ROOT/personal-site"
WT="$ROOT/../oev-pages"

node "$SITE/scripts/build.mjs" --check

git -C "$ROOT" fetch -q origin gh-pages
if [ ! -d "$WT" ]; then
  git -C "$ROOT" worktree add -q "$WT" -B gh-pages origin/gh-pages
else
  git -C "$WT" checkout -q gh-pages && git -C "$WT" pull -q --ff-only origin gh-pages
fi

rsync -a --exclude '.claude' --exclude '.git' "$SITE/" "$WT/"

# The old app's service worker lived at the root; replace it with one that unregisters itself.
cat > "$WT/service-worker.js" <<'SW'
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((c) => c.navigate(c.url));
});
SW

git -C "$WT" add -A
if git -C "$WT" diff --cached --quiet; then echo "nothing to publish"; exit 0; fi
git -C "$WT" commit -qm "Publish personal-site $(date +%Y-%m-%d)"
git -C "$WT" push -q origin gh-pages
echo "published: https://oriolson.github.io/oev-expanse/ (allow a minute)"
