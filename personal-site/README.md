# personal-site

Ori Olson’s personal website: an evolving collection of professional projects,
experiments, and personal interests. See `BRIEF.md` for the thinking behind it and
`AGENTS.md` for contributor rules.

## Run it

Requires only [Node.js](https://nodejs.org) (any recent version — no `npm install`).

```
node build.js --serve
```

Open http://localhost:8080/. The site is rebuilt into `dist/` on each run of the
script; after editing content, run it again and refresh the browser.

Other commands:

```
node build.js            # just build into dist/
node build.js --check    # build + validate content, links, media, and alt text
```

## Update the site

All words live in `content/` as plain text files with a small Markdown subset
(documented in `AGENTS.md`).

- **Homepage text** — edit `content/home.md`.
- **Add a project** — copy `content/projects/_template.md` to
  `content/projects/your-project.md` (the file name becomes the URL, e.g.
  `/projects/your-project/`), fill in the front matter, write the body in your own
  words. Rebuild.
- **Publish a project** — every entry has `publication: draft` or
  `publication: published` in its front matter. Drafts never appear in the built
  site. Agents propose entries as drafts; you curate by flipping the field to
  `published` (or editing/deleting the draft). Publishing requires resolving all
  `[MISSING: …]` markers — `--check` fails otherwise. (One draft is waiting:
  `pier-journal.md`.)
- **Project status** — separate from publication: `status: in progress` or
  `status: complete` describes the work itself and is shown on the site.
- **Add images or video** — put files in `media/<project-slug>/` and reference
  them with `media/…` paths; captions, alt text, video posters, and the `@video`
  syntax are documented in `AGENTS.md`.
- **Edit a project** — edit its file under `content/projects/`, rebuild.
- **Unknown details** — write `[MISSING: what is needed]` rather than guessing;
  markers are fine in drafts and on the homepage, and `--check` counts them so
  they don’t get forgotten.

Run `node build.js --check` before committing. Never edit or commit `dist/` — it is
generated and gitignored.

## Publishing

The site deploys to GitHub Pages at
https://oriolson.github.io/oev-expanse/ via the repository workflow
`.github/workflows/deploy-pages.yml`. It runs automatically on every push to
`main` that touches `personal-site/`, building the site and failing the deploy
if `--check` fails. It can also be run manually from the repository's Actions
tab ("Deploy site to GitHub Pages" → Run workflow).

First-run note: the workflow tries to enable Pages itself; if it errors on
enablement, turn it on once in the repository Settings → Pages → Source:
"GitHub Actions", then re-run.

The output stays portable — a plain folder of HTML, CSS, and media in `dist/`
that any static host can serve — so moving to a custom domain or another host
later is just a hosting change, not a site change.
