# Digital Expanse — personal website (personal-site/ in the oev-expanse monorepo)

Read this whole file before touching anything. It is the memory between sessions.
All paths below are relative to `personal-site/`. Run commands from there, or prefix them.

## What this is
Ori Olson's hand-written personal site (product designer), deployed to GitHub Pages at
https://oriolson.github.io/oev-expanse/ by `.github/workflows/deploy-pages.yml` at the
repo root on every push to `main` that touches `personal-site/`. Design lineage: Prof. Dr. style (plain HTML that lasts), Websitesite
(each work its own URL, old versions kept), Laurel Schwulst (a site is a living place,
never finished), Be Here Now (book pages, plates, margins). See colophon.html.

## Metaphor
My website is a ______. (Owner fills this in. Until then, treat the site as
"a manuscript with plates": text tells, pictures show, nothing is deleted.)

## Session start ritual (every new session)
1. `git log --oneline | head -20` and read `log.html` top entries: what changed last.
2. `cat site.json`: this is the entire content of the index.
3. `node scripts/build.mjs --check`: confirm it passes. Blanks ("______") only warn.
4. Open `index.html` in the browser preview (repo-root `.claude/launch.json` has a "site" server).
   Screenshot at a tall viewport (e.g. 900×2300) because pane screenshots go blank after scrolling.
5. Do the work. Then the session end ritual below.

## Session end ritual
1. `node scripts/build.mjs --check` (never hand-edit index.html; it is generated). The deploy
   runs the same check and fails on errors.
2. Add a one-line entry to the top of the list in `log.html` (date, what changed).
3. Commit with a plain message. Push only if the owner asked. Publishing to the live site is a
   separate, explicit step (`scripts/publish.sh`); only do it when the owner asks.
4. If a design decision was made, record it in this file under "Design decisions".

## Files
- `site.json`          ALL index content: title, intro, now, contact, frontispiece, kinds,
                       states, works[], ideas[], plates[]. Edit this, not index.html.
- `src/index.html`     the index TEMPLATE (HTML + inline CSS + `{{slots}}`). Edit for design changes.
- `scripts/build.mjs`  fills the template from site.json → `index.html`. Node, zero deps.
- `index.html`         GENERATED. Committed so GitHub Pages can serve it without a build step.
- `projects/<slug>/vN/index.html`  one folder per work per version. Self-contained; may have
                       its own CSS/JS and its own look. Old versions are never edited or deleted.
- `assets/plates/`     images for the index (frontispiece, work plates, loose plates).
- `log.html`           changelog, newest first. `colophon.html` how and why. `style.css` shared
                       base for the non-index pages only.
- `explorations/`      earlier index designs (ledger, chart, manuscript, hybrid, plates).
                       Reference only. Never deleted.

## site.json schema
- `works[]`: `slug, title, kind, state, year, prose, image, caption, versions[]`.
  `kind` must be one of `kinds`; `state` one of `states`. `image` is a path under assets/
  or `null` (renders a hatched placeholder). Newest work first. `versions` are folder names.
- `ideas[]`: `title, kind`. Shown as dashed squares in the first state column.
- `plates[]`: `image, ratio ("3:2"|"4:3"|"1:1"|"3:4"|"21:9"), caption`. Pictures without a work.
- `now`: `where, making, reading, since`. Keep it current; it is the liveliest thing on the page.

## Content rules (carried over from the first foundation)
- Ori curates; agents propose. Never invent employers, projects, outcomes, dates, or quotes.
  A sibling folder in this monorepo existing does not entitle it to an entry.
- Unknown facts stay as "______" in site.json rather than a guess. The build counts them.
- No repository internals (paths, branch names, build details) in public copy.
- Preserve Ori's wording in `intro` and `prose`; edit only when asked.

## Stack — do not add to it
- Plain HTML and CSS. No framework, no bundler, no preprocessor, no npm packages, no Jekyll
  (`.nojekyll` is present on purpose).
- No client-side JavaScript on the index or shared pages. Project folders may use JS.
- Every page must open correctly from the filesystem and from a subpath.

## Design rules (constraints, not a design system)
- Index: white page, body in the browser's default serif (Times), margins and labels in a
  condensed sans (Arial Narrow fallback chain). 18px/1.5 body. Centered measure ≤ 46em with a
  13em sticky margin column on the left; margin drops below content on phones.
- Links pure blue #0000ff, no restyling. Highlights only pure yellow #ffff00 and green #00ff00.
- Native HTML buttons. No icons, no rounded corners, no shadows, no gradients, no nav bar.
- Headings are body size; "~ NAME" uppercase in condensed sans marks sections.
- Captions: small uppercase condensed sans, archive style: DATE, SUBJECT, PHOTO BY.
- Placeholders: light grey hatched boxes labelled "Plate N". Real images replace them 1:1.
- Whitespace is the design. When in doubt, remove.

## Design decisions (append, dated)
- 2026-09-21 Chose "plates" over ledger/chart/manuscript/hybrid. Reasons: manuscript openness,
  Now margin retained, chart repurposed as a state board (Idea → Making → Shipped → Resting)
  because there is no archive yet, and visuals expected of a product designer's home page.
- 2026-09-21 Board rows (kinds) are Product, Tool, Text, Site. Provisional; owner may rename.
- 2026-09-21 Custom models begins with original, labeled concept illustrations, not private source exports or a replica of shipped UI. Its Resting state describes the retired preview; the story is a working draft. Keep beta refinements separate from unshipped explorations and do not add unsupported impact claims.
- 2026-09-21 Custom models v2 leads with owner-selected Figma design crops rather than the conceptual demo. Keep source files and internal annotations out; remove account chrome by cropping, retain original UI copy, and label draft artifacts and illustrative data. Split template crops on phones; link images to full-size assets. v1 remains unchanged. Publication is still a separate approval.

## Adding a work (checklist)
1. `mkdir -p projects/<slug>/v1` and write its `index.html` (link back to `../../../index.html`).
2. Put its picture in `assets/plates/` and add the work object to the top of `works[]` in site.json.
3. Build, check the board cell and the entry, log it, commit.

## Adding a new version of a work
Copy `projects/<slug>/vN` to `vN+1`, edit the copy, append to `versions[]`. Never touch vN.

## Hosting
GitHub Pages, branch-based: Pages serves the `gh-pages` branch root. Publish with
`bash personal-site/scripts/publish.sh` (builds with `--check`, copies this folder into a
`gh-pages` worktree at `../oev-pages`, commits, pushes). GitHub Actions is disabled for this
account, so `.github/workflows/deploy-pages.yml` is dormant; if Actions is re-enabled, switch
Pages back to "GitHub Actions" and the workflow takes over with no other change.
The site lives under the `/oev-expanse/` subpath, so every link is relative; never use `/`-rooted paths.
Custom domain later: add a `CNAME` file in `personal-site/` containing the domain.
