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
node build.js --check    # build + validate content, links, and alt text
```

## Update the site

All words live in `content/` as plain text files with a small Markdown subset
(documented in `AGENTS.md`).

- **Homepage text** — edit `content/home.md`.
- **Add a project** — copy `content/projects/_template.md` to
  `content/projects/your-project.md` (the file name becomes the URL, e.g.
  `/projects/your-project/`), fill in the front matter, write the body in your own
  words. Rebuild.
- **Review proposals** — agents suggest entries as `content/projects/_proposed-*.md`
  drafts, which the build ignores. You curate: rename a draft to drop the `_proposed-`
  prefix to publish it, edit it first, or delete it. Nothing goes public without
  that rename. (One proposal is waiting: `_proposed-pier-journal.md`.)
- **Edit a project** — edit its file under `content/projects/`, rebuild.
- **Unknown details** — write `[MISSING: what is needed]` rather than guessing;
  these markers are counted by `--check` so they don’t get forgotten.

Run `node build.js --check` before committing. Never edit or commit `dist/` — it is
generated and gitignored.

## Publishing

Not set up yet, deliberately. The build output in `dist/` is a plain folder of
HTML, CSS, and images that any static host can serve; choosing a host and domain is
a separate step.
