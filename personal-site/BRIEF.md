# Project brief — Ori Olson, personal website

## Purpose

A personal website for Ori Olson, product designer. It is an evolving collection of
professional projects, experiments, and personal interests — a place Ori tends over
time, not a portfolio frozen at launch. Work appears while it is still rough; the
structure is allowed to shift as the work does.

## Audience

- People who want to know who Ori is and see the work: collaborators, clients,
  employers, peers.
- Ori — the site should be pleasant to update, so it actually gets updated.
- Browsers and wanderers who arrive at one project and follow links to others.

## References and what we take from them

These are inspirations for principles, not designs to copy.

- **mindyseu.com** — a single content-led page in the first person; the work speaks
  in plain sentences with direct links, no portfolio-speak or case-study theater.
- **Laurel Schwulst, “My website is a shifting house next to a river of knowledge.”**
  — a website as a living space that changes with its author; imperfect and
  unfinished is fine, and low ceremony to update matters more than polish.
- **websitesite.xyz** — an honest, complete index: every project in one table with
  year, type, and a one-line description; tiny experiments sit beside major work
  with equal standing.
- **oneterabyteofkilobyteage.tumblr.com** — browsing as an experience: an
  image-led, scrollable archive where metadata (year, tags) is part of the surface.
  This inspires the planned alternate archive view, not the primary interface.

## Design principles

1. **Content before chrome.** Semantic HTML and readable text carry the site.
   Typography and spacing do the design work; decoration is added last, if at all.
2. **First person, Ori’s words only.** No invented facts, employers, outcomes, or
   metrics. Gaps are visible, marked `[MISSING: …]` until Ori fills them.
3. **The index is the interface.** One honest list of everything — professional
   work and small experiments side by side, each with year, type, status, and one
   plain sentence.
4. **Built to shift.** Flat files, no lock-in. Restructuring the site should cost
   minutes, not a migration.
5. **One source, many views.** Content lives once in `content/`; the list view
   exists now and the visual archive view will render the same files later.
6. **Small and durable.** Zero runtime dependencies, standard web technology,
   output that any static host (or a folder on disk) can serve for decades.
7. **Accessible by default.** Landmarks, skip link, visible focus, sufficient
   contrast, alt text required — checked on every build.

## Architecture

The site lives in its own top-level folder of the `oev-expanse` monorepo. Sibling
projects are candidate material, not automatic entries: agents may propose drafts,
but Ori curates what appears on the site (see `AGENTS.md`).

Static-first: Markdown-subset content files with front matter, built by a single
zero-dependency Node script (`build.js`) into plain HTML in `dist/`. Chosen because
the repository has no existing framework (its one other project is hand-written
HTML), and because a site meant to last decades should not depend on a package
ecosystem to render three page types. If the site outgrows this (search, feeds,
hundreds of pages), migrating the same content files to a small static site
generator such as Eleventy is straightforward.

## Initial scope (v1)

- **Homepage** — who Ori is, in Ori’s words, plus the current project list.
- **Project index** — the complete table of projects, newest first.
- **Project detail pages** — one page per content file, generated from Markdown.
- Base styles only: readable defaults, accessibility affordances. The full visual
  design is a later, deliberate step.

## Planned, not yet built

- **Visual archive view** — an alternate, image-led way to browse the same
  projects (each content file has a reserved optional `cover` field). Same data,
  different room.
- **Public publishing** — hosting and domain are a separate step. Nothing here
  assumes a host; the output is a folder of files.

## Non-goals

- No CMS, database, accounts, analytics, or client-side framework.
- No fabricated content to make the site look fuller than the work is.
- No secrets in the repository — the site is fully public content by definition.
