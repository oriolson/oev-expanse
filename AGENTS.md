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
- One typeface for the whole site: the system UI sans (`system-ui, -apple-system, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif`). No webfont, nothing downloaded. 19px/1.6, 17px on phones.
- Type scale: page title 1.6rem semibold; section headings bold at body size with a hairline rule
  (`#e6e6e6`) running to the right edge; lede 1.15rem; captions and small print 0.8rem in `#666`.
- Index layout: white page, a 12em sticky margin column on the left holding Now and Contact, a
  content column up to 46em. Prose sits at 34em inside it; pictures use the full column. The margin
  drops below the content under 900px.
- Links pure blue #0000ff, no restyling. Highlights only pure yellow #ffff00 and green #00ff00.
- Native HTML buttons. No icons, no rounded corners, no shadows, no gradients, no nav bar.
- Plates sit on the white page with a 1px #e2e2e2 hairline. No grey stage, no drop shadow.
  Captions are one grey line under the plate, sentence case, never uppercase.
- Placeholders: light grey hatched boxes labelled "Plate N". Real images replace them 1:1.
- Whitespace is the design. When in doubt, remove.
- Work pages (`projects/<slug>/vN/`) follow the same rules with their own stylesheet, plus: a
  contents list in the margin, plates at full column width, and yellow (#ffff00) 2px marker boxes
  drawn by the page over untouched screenshots. v5 of custom models is the reference.

## Design decisions (append, dated)
- 2026-09-22 The whole site moved from Times plus condensed Arial to one system sans, so the index
  and the work pages speak with one voice. The owner preferred the v5 work-page surface and asked
  for the index to match it rather than the reverse. What moved: typeface, type scale, section
  headings with a rule, captions in sentence case, plates on white with a hairline, more air, and
  a 34em prose measure. What did not move: the Now margin, the state board, frontispiece, entries,
  loose plates, pure blue links, the yellow and green highlights, native buttons, no icons, no
  radius, no shadows, no nav bar, and the build from site.json. The serif index is preserved at
  `explorations/plates-serif.html`. `projects/this-website/v1/` was given its own frozen copy of the
  old shared stylesheet so that changing `style.css` did not edit an old version.
- 2026-09-21 Chose "plates" over ledger/chart/manuscript/hybrid. Reasons: manuscript openness,
  Now margin retained, chart repurposed as a state board (Idea → Making → Shipped → Resting)
  because there is no archive yet, and visuals expected of a product designer's home page.
- 2026-09-21 Board rows (kinds) are Product, Tool, Text, Site. Provisional; owner may rename.
- 2026-09-21 Custom models begins with original, labeled concept illustrations, not private source exports or a replica of shipped UI. Its Resting state describes the retired preview; the story is a working draft. Keep beta refinements separate from unshipped explorations and do not add unsupported impact claims.
- 2026-09-21 Custom models v2 leads with owner-selected Figma design crops rather than the conceptual demo. Keep source files and internal annotations out; remove account chrome by cropping, retain original UI copy, and label draft artifacts and illustrative data. Split template crops on phones; link images to full-size assets. v1 remains unchanged. Publication is still a separate approval.
- 2026-09-21 Custom models v3 places the supplied training-data setup after template suggestions, moving from a starting point to explicit data choices. Label it as exploration; its "x% improvement" copy is a placeholder, not evidence of impact.
- 2026-09-21 Trial complete-frame presentation on the v3 setup screen only: retain navigation and whitespace, use the full plate width, and offer a full-resolution image link for native zoom. Do not crop other plates or upscale a raster and call it a higher-resolution export.
- 2026-09-21 Complete-frame trial ended: at page width the setup text was illegible. v3 now shows the two steps cropped from the genuine 2× export to the content column, displayed at design scale (808px) on the prose measure, with the complete frame still linked. A plate is shown at the size its text can be read; whitespace in the frame is not the whitespace of the page. One rule for quotations from the design: quote UI copy in the prose (blockquote) rather than repeating a crop the reader has already seen.
- 2026-09-21 Cropping reversed again, and this is the settled rule: both designs are shown as complete frames at the same page width, because the frame is the argument. The beta screen sits inside organization settings; the GA screen has a page of its own. Cropping either one to its content column hides exactly the change the story is about. Legibility is handled by quoting UI copy in the prose and linking each plate to its full-size export, not by cropping. Owner supplied the full beta frame and the Figma file name "Fine-tuned-models-GA"; plate 04 is therefore labelled "General availability design / Not shipped" rather than "exploration". Plate 03 (templates) stays an exploration. Do not restate this as shipped: the preview was retired before GA.
- 2026-09-21 v4 sets the pattern for work pages, after studying two references the owner likes (Fabian Schultz’s "The Art of Scoping" and an internal versioned design post): (1) plates sit on a flat grey stage (#f2f2f2, no radius, no shadow) at one shared width, so different screens compare directly; (2) one frame shown repeatedly with a single yellow (#ffff00) marker box drawn by the page, never by editing the image; (3) the caption says what to notice, the margin label says what it is, and provenance caveats are stated once in a note under the opening; (4) a sticky contents list in the 13em margin, current entry darkened by a few lines of JS (allowed in project folders, page reads fine without it); (5) design reasoning in present tense. Not adopted: sans body, rounded frames, centered captions. Next work should ship with a vN/prototype/ folder linked from a plain card near the top, like the reference.

- 2026-09-21 Work pages have their own look (v5 of custom models is the reference). The design rules above are the index's rules: a manuscript with plates. A case study made of product screenshots is not a manuscript, and dressing it as one made the screenshots look worse than the work. Work pages therefore use: one system sans (system-ui stack, no webfont) at 19px/1.6; a title at 1.6× body; bold body-size section headings with a hairline rule running right; plates on the white page at full column width with a 1px #e2e2e2 border and no stage; one grey caption line beginning with the plate numeral; marks (2px #ffff00) only where a caption depends on one; sections spaced roughly twice as far apart as on the index. Kept from the index: pure blue links, yellow highlight, no shadows, no rounded corners, no icons, no nav bar. The owner asked for this after comparing v4 with two reference posts whose surface they preferred.

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
