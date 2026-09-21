# Digital Expanse

A hand-written personal website. Plain HTML and CSS, no dependencies. Hosted on GitHub Pages.

- Content lives in `site.json`. Design lives in `src/index.html`.
- `node scripts/build.mjs` writes `index.html` from the two. Commit the result.
- Each work lives in `projects/<slug>/vN/`. Old versions are kept forever.
- Add a line to `log.html` after every change.
- Rules for agents and humans, and the per-session ritual: `AGENTS.md`.
- Publish to https://oriolson.github.io/oev-expanse/ with `bash personal-site/scripts/publish.sh` (pushes the gh-pages branch).
- `explorations/` holds earlier index designs for reference.
