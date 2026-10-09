# oev-expanse

Read this before editing the repo. This is Ori Olson's monorepo for small projects,
microapps, experiments, and sites.

## Repo rules

- Treat each top-level folder as its own project.
- Do not merge projects together unless Ori explicitly asks.
- Check for a project-level `AGENTS.md` before editing inside a folder.
- Prefer plain, durable, low-dependency implementations.
- Preserve each project's existing style and stack.
- Do not push to GitHub unless Ori explicitly asks.
- Do not publish or deploy unless Ori explicitly asks, or the task clearly concerns a hosted Site update.
- Before making a repo-wide change, check `git status --short` and avoid touching unrelated work.

## Writing for Ori

Write like the reader has ADHD.

- Put the main point first.
- Use short sections and clear labels.
- Prefer bullets for steps, options, and decisions.
- Keep paragraphs short.
- Make the next action obvious.
- Avoid long throat-clearing, hype, and vague summaries.
- Use concrete names, dates, paths, and outcomes.
- Do not bury warnings or blockers.
- When public-facing copy needs personality, keep it spare, direct, and human.

This applies to docs, app copy, changelogs, commit context, and agent handoffs. It does not
mean dumbing things down. It means reducing working-memory load.

## Projects

- `personal-site/` — Ori's personal website. Read `personal-site/AGENTS.md` before touching it.
- `pier-journal/` — native app plan and interactive wireframes.
- `tide-now/` — private mobile-first tide and fishing-time checker. Static Sites project.

## Personal site

`personal-site/` has strict local rules. Always read its own `AGENTS.md`.

Important defaults:

- Edit `site.json` and templates, not generated `index.html`.
- Preserve the plain HTML design language.
- Publishing is separate and explicit.

## Tide Now

`tide-now/` is a buildless static HTML/CSS/JS app.

- Source lives in `tide-now/dist/`.
- Existing Sites identity lives in `tide-now/.openai/hosting.json`.
- Keep it fast, mobile-first, and minimal.
- Use no framework unless Ori asks.
- Tide and weather APIs are browser-side.
- If editing, run `node --check tide-now/dist/app.js`.
- Deploy through Sites only when asked.

## Git

- Make small, descriptive commits.
- Do not rewrite history.
- Do not push without explicit approval.
- If work affects a private or hosted project, call out where it will become visible before pushing.
