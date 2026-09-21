# AGENTS.md — personal-site

Guidance for agents (and humans) working on Ori Olson’s personal website.
Read `BRIEF.md` first for purpose and design principles.

## Project structure

```
personal-site/
  BRIEF.md              Purpose, audience, design principles, scope
  AGENTS.md             This file
  README.md             How to run and update the site
  build.js              Zero-dependency Node build, checks, and preview server
  assets/
    style.css           Base styles (copied into dist/assets/)
  content/
    home.md             Homepage text
    projects/
      _template.md      Copy to add a project (files starting with _ are ignored)
      *.md              One file per project; file name becomes the URL slug
  dist/                 Generated output — never edit, never commit (gitignored)
```

Generated pages: `dist/index.html` (home), `dist/projects/index.html` (index),
`dist/projects/<slug>/index.html` (one per project).

## Commands

```
node build.js            # build into dist/
node build.js --check    # build + validate (run before every commit)
node build.js --serve    # build + preview at http://localhost:8080
```

Node.js only — there is no `npm install`, `package.json`, or other toolchain, and
none should be added without a concrete problem that flat files cannot solve.

## Content rules

- **Preserve Ori’s writing.** Never invent employers, project details, outcomes, or
  metrics. When information is unknown, write `[MISSING: what is needed]` in the
  content — the check step counts these markers but allows them.
- Project files require front matter fields: `title`, `year` (four digits), `type`,
  `status`, `summary` (one plain sentence). Optional: `cover` (reserved for the
  planned visual archive view).
- Body text uses a small Markdown subset, implemented in `build.js`:
  headings (`#` to `###` — use `##` and below, the layout owns `<h1>`), paragraphs,
  unordered lists (`- `), links `[text](url)`, images `![alt](src)`, `**bold**`,
  `*italic*`, and `` `code` ``. Anything fancier belongs in the build, not inline HTML.
- **This site indexes the whole repository.** Sibling folders (like
  `../pier-journal/`) are works that deserve an entry in `content/projects/`.
  Describe them using only facts found in their own files, and name their folder
  path in the body text. Do not hard-link into sibling folders from generated
  pages yet — the URL depends on how publishing hosts the demos, so use a
  `[MISSING: public link …]` marker until that is decided.
- **No secrets** — no API keys, tokens, or private data anywhere in this folder.
  Everything in `content/` is public by definition.

## Accessibility

Non-negotiable, enforced by convention and by `--check`:

- Every image needs meaningful alt text (checked; the build fails without it).
- The layout provides `lang`, landmarks (`header`/`main`/`footer`), a skip link,
  and visible `:focus-visible` outlines — keep them when touching `build.js`.
- One `<h1>` per page, heading levels in order.
- Text contrast stays at or above WCAG AA; check any color change in `style.css`.
- The site must be fully usable with keyboard only and without JavaScript
  (there is currently no client-side JavaScript at all — keep it that way unless a
  feature truly requires it).

## Verification

Before committing:

1. `node build.js --check` — must exit 0. It validates required front matter,
   internal links across all generated pages, and image alt text.
2. `node build.js --serve` and open http://localhost:8080/ — read the changed
   pages; confirm navigation works from home → index → detail and back.
3. If you touched `build.js`, spot-check the generated HTML in `dist/` for
   well-formedness and the accessibility affordances listed above.

## Design constraints

- Do not build out the full visual design ad hoc; that is a deliberate future step.
  `style.css` stays modest: readable defaults, accessibility, nothing decorative.
- The planned visual archive view must render from the same files in
  `content/projects/` — never a second copy of the content.
- Public publishing (hosting, domain) is a separate step; do not add
  deployment-specific code or absolute URLs.
