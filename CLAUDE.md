# Digital Expanse — personal website

## Metaphor
My website is a ______. (Fill this in before adding anything else. Every
structural decision should be checkable against this sentence.)

## Lineage
- Prof. Dr. style: http://contemporary-home-computing.org/prof-dr-style/
- Websitesite (index as table, each work its own URL, old versions kept): https://websitesite.xyz/
- Laurel Schwulst, "My website is a shifting house next to a river of knowledge"
- Mindy Seu's site: https://mindyseu.com/
- Be Here Now (Ram Dass): allowed on individual project pages only, never the index.

## Stack — do not add to it
- Plain HTML and CSS. No framework, no bundler, no CSS preprocessor, no npm dependencies.
- The only script is `scripts/build.mjs` (Node, zero deps). It rewrites the works
  table in `index.html` from `projects.json`. Run `node scripts/build.mjs` after
  editing `projects.json`. Never hand-edit between the `projects:start/end` markers.
- Static hosting. Every page must open correctly from the filesystem (`file://`).
- Client-side JavaScript only inside a project folder, and only if that project needs it.

## Structure
- `index.html`       the works table. Prof. Dr. style. Austere. Text and links only.
- `projects.json`    the single source of truth for the works list.
- `projects/<slug>/v1/index.html`   one self-contained folder per work. A project
  may have its own CSS and its own look. New version = new `vN` folder; old
  versions are never deleted or edited.
- `log.html`         running changelog. Append an entry for every change to the site.
- `colophon.html`    how the site is made, credits, the metaphor.
- `style.css`        shared base. Small. Project folders may ignore it.

## Design rules (constraints, not a design system)
- One typeface site-wide on the index and shared pages: Arial Narrow / Helvetica Neue Condensed, falling back to sans-serif.
- Links are default blue (#0000FF), never restyled except by highlight backgrounds in pure RGB (blue, green #00FF00, yellow).
- Native HTML controls. No icon libraries, no rounded corners, no shadows, no gradients, no hero images, no nav bar.
- Headings are body size. Hierarchy comes from uppercase, highlight, and whitespace.
- Left-aligned, small fixed margin, no max-width on the index.
- Index only: warm paper (#efe6d3), dark-brown ink (#2a1f14), ruled lines every 1.25em,
  a sticky 14em margin column ("Now", contact) beside the ledger. Versions render as
  small square frames (2.5em) meant to hold thumbnails later. Shared pages stay on white.
- Section markers are "~ NAME" in uppercase (the tilde of early academic URLs).
- A visible "Last updated" line on the index, kept current by the build script.
- Images are captioned in small uppercase: DATE, PLACE, PHOTO BY.
- When in doubt, remove.

## Working rules for agents
- Editing `projects.json`: keep fields `slug, title, year, function, description, url, versions`.
- After any change: run the build, then append to `log.html` (date, one line, what changed).
- Never rewrite a project's old version. Copy to a new `vN` folder instead.
- Never introduce a dependency to solve a styling problem. Solve it with less.
