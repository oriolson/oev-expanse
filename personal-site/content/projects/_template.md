---
title: Project title
year: 2026
type: One or two words, e.g. App study, Experiment, Website
status: in progress
publication: draft
summary: One plain sentence used by the project index (and later the archive view).
cover: media/project-slug/cover.jpg
---

Copy this file to a new name like `my-project.md` (the file name becomes the URL
slug, e.g. `/projects/my-project/`). Files starting with `_` are ignored entirely.

Two separate statuses:

- `publication: draft | published` — whether the entry appears in the built site.
  Agents always propose with `draft`; only Ori flips it to `published`.
- `status: in progress | complete` — the state of the work itself, shown publicly.

Write the body in Ori’s own voice, without repository internals (folder paths,
file names). Use `[MISSING: what is needed]` for anything not yet known — never
guess employers, dates, outcomes, or metrics. Drafts may hold `[MISSING: …]`
markers and incomplete front matter; published entries must resolve all of them
(`node build.js --check` enforces this).

Media lives in `media/<project-slug>/` and is always referenced with a path
starting `media/`. The optional `cover` field points there too (reserved for the
planned visual archive view). Syntax:

- Image: `![Alt text](media/project-slug/screen.png)`
- Image with caption (on its own line): `![Alt text](media/project-slug/screen.png "Caption text")`
- Video (on its own line, poster and caption required):
  `@video media/project-slug/demo.mp4 poster=media/project-slug/demo-poster.jpg "Caption text"`
  Add `captions=media/project-slug/demo.vtt` before the quoted caption when the
  video has speech or meaningful audio.
