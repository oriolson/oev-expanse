# AGENTS.md — personal-site

Guidance for agents (and humans) working on Ori Olson’s personal website.
Read `BRIEF.md` first for purpose and design principles.

## Project structure

```
personal-site/
  BRIEF.md              Purpose, audience, design principles, scope
  AGENTS.md             This file
  README.md             How to run and update the site
  build.js              Node build, checks, and preview server (dependency-free today)
  assets/
    style.css           Base styles (copied into dist/assets/)
  media/
    <project-slug>/     Images, videos, posters, .vtt captions for one project
                        (copied into dist/media/; referenced as "media/…" in content)
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

Node.js only — there is currently no `npm install` or `package.json`. Minimal
dependencies stays the default, but a small, focused library is allowed when it
demonstrably improves reliability or maintainability. The first candidate is the
hand-rolled Markdown subset: if content outgrows it or rendering bugs appear,
swap in a focused parser (e.g. `marked`) behind the `renderMarkdown` seam rather
than growing the in-house parser. Never add a framework, bundler, or transitive
dependency sprawl to solve a problem a small library or flat files can solve.

## Content rules

- **Preserve Ori’s writing.** Never invent employers, project details, outcomes, or
  metrics. When information is unknown, write `[MISSING: what is needed]` in the
  content. Markers are allowed (and counted) in drafts and in `home.md`; published
  project entries must resolve every marker — `--check` fails otherwise.
- **Two separate statuses, never conflated:**
  - `publication: draft | published` — whether the entry appears in the built
    site at all. Drafts stay out of `dist/` entirely. Required on every entry.
  - `status: in progress | complete` — the state of the work itself, shown
    publicly on the index and detail pages.
- Published entries require front matter fields: `title`, `year` (four digits),
  `type`, `status`, `summary` (one plain sentence). Optional: `cover`
  (a `media/…` path, reserved for the planned visual archive view). Drafts may be
  incomplete apart from `title` and `publication`.
- Body text uses a small Markdown subset, implemented in `build.js`:
  headings (`#` to `###` — use `##` and below, the layout owns `<h1>`), paragraphs,
  unordered lists (`- `), links `[text](url)`, `**bold**`, `*italic*`,
  `` `code` ``, and the media blocks below. Anything fancier belongs in the build,
  not inline HTML.
- **Ori curates; agents only propose.** The repository is source material, not the
  portfolio — a sibling folder existing does not entitle it to an entry. When an
  agent thinks a work belongs on the site, it adds an entry with
  `publication: draft`, described using only facts found in that work's own files.
  Only Ori flips an entry to `published`, edits it, or deletes it. Never change
  the `publication` field or remove published entries without Ori's direction.
- **No repository internals in public copy.** Folder paths, file names, branch
  names, and build details stay out of `content/`. When a demo or source link is
  wanted but no public URL exists yet, use a `[MISSING: public link …]` marker.
- **No secrets** — no API keys, tokens, or private data anywhere in this folder.
  Everything in `content/` is public by definition.

## Media

All content media (images, video, posters, caption tracks) lives in
`media/<project-slug>/` and is copied verbatim into `dist/media/`. Content always
references it with a path starting `media/…` — the build resolves the path for
each page's depth. Keep files web-ready (compressed, sensible dimensions); the
build does no processing. The planned archive view reads the same folder via the
`cover` field.

Syntax, implemented in `build.js`:

- Inline image: `![Alt text](media/slug/screen.png)` → `<img>` with required alt.
- Captioned image, alone on its own line:
  `![Alt text](media/slug/screen.png "Caption text")` → `<figure>` + `<figcaption>`.
  Alt text describes the image; the caption is visible commentary — write both.
- Video, alone on its own line, poster and caption required:
  `@video media/slug/demo.mp4 poster=media/slug/demo-poster.jpg "Caption text"`
  → `<figure>` with a native `<video controls preload="metadata">`, the poster
  image, a download-link fallback, and the caption as `<figcaption>`.
  When the video has speech or meaningful audio, a WebVTT track is mandatory:
  add `captions=media/slug/demo.vtt` before the quoted caption.
  Videos never autoplay or loop silently; users start them.

## Accessibility

Non-negotiable, enforced by convention and by `--check`:

- Every image needs meaningful alt text; every video needs native controls, a
  poster image, a visible caption, and a WebVTT captions track when it has speech
  or meaningful audio (`--check` enforces alt, controls, and poster).
- The layout provides `lang`, landmarks (`header`/`main`/`footer`), a skip link,
  and visible `:focus-visible` outlines — keep them when touching `build.js`.
- One `<h1>` per page, heading levels in order.
- Text contrast stays at or above WCAG AA; check any color change in `style.css`.
- The site must be fully usable with keyboard only and without JavaScript
  (there is currently no client-side JavaScript at all — keep it that way unless a
  feature truly requires it).

## Verification

Before committing:

1. `node build.js --check` — must exit 0. It validates `publication` and `status`
   values on every entry, required front matter and the no-`[MISSING: …]` rule on
   published entries, internal links and media references (including posters and
   covers) across all generated pages, image alt text, and video controls/posters.
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
