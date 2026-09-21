#!/usr/bin/env node
/**
 * Static build for Ori Olson's personal site. Currently dependency-free;
 * see AGENTS.md for the dependency policy and content rules.
 *
 * Usage:
 *   node build.js            Build the site into dist/
 *   node build.js --check    Build, then validate content, links, and media
 *   node build.js --serve    Build, then preview at http://localhost:8080
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const SOURCE_DIRECTORY = __dirname;
const CONTENT_DIRECTORY = path.join(SOURCE_DIRECTORY, "content");
const PROJECTS_DIRECTORY = path.join(CONTENT_DIRECTORY, "projects");
const ASSETS_DIRECTORY = path.join(SOURCE_DIRECTORY, "assets");
const MEDIA_DIRECTORY = path.join(SOURCE_DIRECTORY, "media");
const OUTPUT_DIRECTORY = path.join(SOURCE_DIRECTORY, "dist");

const SITE_TITLE = "Ori Olson";
const PREVIEW_PORT = 8080;
const REQUIRED_PROJECT_FIELDS = ["title", "year", "type", "status", "summary"];
const PUBLICATION_PATTERN = /^(draft|published)$/i;
const STATUS_PATTERN = /^(in progress|complete)$/i;
const YEAR_PATTERN = /^\d{4}$/;
const EMPTY_PROJECTS_MESSAGE = "Nothing published here yet.";
const MISSING_CONTENT_PATTERN = /\[MISSING:[^\]]*\]/g;
const VIDEO_DIRECTIVE_PATTERN = /^@video (\S+) poster=(\S+)(?: captions=(\S+))? "([^"]+)"$/;
const FIGURE_IMAGE_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+) "([^"]+)"\)$/;

/* ---------------------------------------------------------------- content */

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseFrontMatter(rawText) {
  const frontMatterPattern = /^---\n([\s\S]*?)\n---\n?/;
  const match = rawText.match(frontMatterPattern);
  if (!match) return { data: {}, body: rawText };
  const data = {};
  for (const line of match[1].split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) data[key] = value;
  }
  return { data, body: rawText.slice(match[0].length) };
}

/** Content references media as "media/…"; resolve it for the page's depth. */
function resolveMediaPath(target, rootPath) {
  return target.startsWith("media/") ? `${rootPath}${target}` : target;
}

/** Renders the documented Markdown subset for one inline span. */
function renderInline(text, rootPath) {
  return escapeHtml(text)
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)(?: "[^"]+")?\)/g,
      (_, alt, src) => `<img src="${resolveMediaPath(src, rootPath)}" alt="${alt}">`
    )
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, label, href) => `<a href="${resolveMediaPath(href, rootPath)}">${label}</a>`
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

/** A standalone image block with a quoted title becomes a captioned figure. */
function renderFigureBlock(block, rootPath) {
  const [, alt, src, caption] = block.match(FIGURE_IMAGE_PATTERN);
  return `<figure>
  <img src="${resolveMediaPath(escapeHtml(src), rootPath)}" alt="${escapeHtml(alt)}">
  <figcaption>${renderInline(caption, rootPath)}</figcaption>
</figure>`;
}

/**
 * `@video src poster=… [captions=….vtt] "Caption"` becomes a captioned figure
 * with a native, non-autoplaying player. A malformed directive is rendered as
 * escaped text so `--check` can flag it.
 */
function renderVideoBlock(block, rootPath) {
  const match = block.match(VIDEO_DIRECTIVE_PATTERN);
  if (!match) return `<p>${escapeHtml(block)}</p>`;
  const [, source, poster, captionsTrack, caption] = match;
  const sourcePath = resolveMediaPath(escapeHtml(source), rootPath);
  const trackHtml = captionsTrack
    ? `\n    <track kind="captions" src="${resolveMediaPath(escapeHtml(captionsTrack), rootPath)}" srclang="en" label="English">`
    : "";
  return `<figure>
  <video controls preload="metadata" poster="${resolveMediaPath(escapeHtml(poster), rootPath)}">
    <source src="${sourcePath}">${trackHtml}
    <p>Video playback is unavailable here. <a href="${sourcePath}">Download the video</a>.</p>
  </video>
  <figcaption>${renderInline(caption, rootPath)}</figcaption>
</figure>`;
}

/** Renders the documented Markdown subset: headings, paragraphs, lists, media. */
function renderMarkdown(body, rootPath) {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const html = blocks.map((block) => {
    const headingMatch = block.match(/^(#{1,3}) (.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      return `<h${level}>${renderInline(headingMatch[2], rootPath)}</h${level}>`;
    }
    if (block.startsWith("@video ")) return renderVideoBlock(block, rootPath);
    if (FIGURE_IMAGE_PATTERN.test(block)) return renderFigureBlock(block, rootPath);
    if (block.split("\n").every((line) => line.startsWith("- "))) {
      const items = block
        .split("\n")
        .map((line) => `<li>${renderInline(line.slice(2), rootPath)}</li>`)
        .join("\n");
      return `<ul>\n${items}\n</ul>`;
    }
    return `<p>${renderInline(block.replaceAll("\n", " "), rootPath)}</p>`;
  });
  return html.join("\n");
}

function isPublished(entry) {
  return /^published$/i.test(entry.data.publication ?? "");
}

/** Reads every project entry (drafts included); `_`-prefixed files are ignored. */
function readProjectEntries() {
  if (!fs.existsSync(PROJECTS_DIRECTORY)) return [];
  const fileNames = fs
    .readdirSync(PROJECTS_DIRECTORY)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .sort();
  return fileNames.map((fileName) => {
    const filePath = path.join(PROJECTS_DIRECTORY, fileName);
    const rawText = fs.readFileSync(filePath, "utf8");
    const { data, body } = parseFrontMatter(rawText);
    return { slug: fileName.replace(/\.md$/, ""), fileName, rawText, data, body };
  });
}

function sortProjects(projects) {
  return [...projects].sort(
    (a, b) => Number(b.data.year) - Number(a.data.year) || a.data.title.localeCompare(b.data.title)
  );
}

/* --------------------------------------------------------------- rendering */

function renderLayout({ pageTitle, mainHtml, rootPath }) {
  const fullTitle = pageTitle === SITE_TITLE ? SITE_TITLE : `${pageTitle} — ${SITE_TITLE}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <link rel="stylesheet" href="${rootPath}assets/style.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>
    <nav aria-label="Site">
      <a href="${rootPath}index.html">${SITE_TITLE}</a>
      <a href="${rootPath}projects/index.html">Projects</a>
    </nav>
  </header>
  <main id="main">
${mainHtml}
  </main>
  <footer>
    <p>An evolving collection of projects, experiments, and interests.</p>
  </footer>
</body>
</html>
`;
}

function renderProjectListItems(projects, rootPath) {
  return projects
    .map(
      (project) =>
        `<li><a href="${rootPath}projects/${project.slug}/index.html">${escapeHtml(
          project.data.title
        )}</a> — ${escapeHtml(project.data.summary)}</li>`
    )
    .join("\n");
}

function renderHomePage(projects) {
  const homePath = path.join(CONTENT_DIRECTORY, "home.md");
  const { body } = parseFrontMatter(fs.readFileSync(homePath, "utf8"));
  const projectsHtml =
    projects.length > 0
      ? `<ul>\n${renderProjectListItems(projects, "./")}\n</ul>`
      : `<p>${EMPTY_PROJECTS_MESSAGE}</p>`;
  const mainHtml = [
    `<h1>${SITE_TITLE}</h1>`,
    renderMarkdown(body, "./"),
    "<h2>Projects</h2>",
    projectsHtml,
    '<p><a href="./projects/index.html">Full project index</a></p>',
  ].join("\n");
  return renderLayout({ pageTitle: SITE_TITLE, mainHtml, rootPath: "./" });
}

function renderProjectIndexPage(projects) {
  if (projects.length === 0) {
    const mainHtml = `<h1>Projects</h1>\n<p>${EMPTY_PROJECTS_MESSAGE}</p>`;
    return renderLayout({ pageTitle: "Projects", mainHtml, rootPath: "../" });
  }
  const rows = projects
    .map(
      (project) => `      <tr>
        <th scope="row"><a href="./${project.slug}/index.html">${escapeHtml(project.data.title)}</a></th>
        <td>${escapeHtml(project.data.year)}</td>
        <td>${escapeHtml(project.data.type)}</td>
        <td>${escapeHtml(project.data.status)}</td>
        <td>${escapeHtml(project.data.summary)}</td>
      </tr>`
    )
    .join("\n");
  const mainHtml = `<h1>Projects</h1>
<p>Everything in one place, newest first. Professional work and small experiments sit side by side.</p>
<table>
  <caption class="visually-hidden">All projects with year, type, status, and a one-line description</caption>
  <thead>
    <tr><th scope="col">Project</th><th scope="col">Year</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Description</th></tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`;
  return renderLayout({ pageTitle: "Projects", mainHtml, rootPath: "../" });
}

function renderProjectPage(project) {
  const { data, body } = project;
  const mainHtml = `<h1>${escapeHtml(data.title)}</h1>
<dl class="project-meta">
  <dt>Year</dt><dd>${escapeHtml(data.year)}</dd>
  <dt>Type</dt><dd>${escapeHtml(data.type)}</dd>
  <dt>Status</dt><dd>${escapeHtml(data.status)}</dd>
</dl>
${renderMarkdown(body, "../../")}
<p><a href="../index.html">Back to all projects</a></p>`;
  return renderLayout({ pageTitle: data.title, mainHtml, rootPath: "../../" });
}

/* ------------------------------------------------------------------ build */

function writePage(relativePath, html) {
  const outputPath = path.join(OUTPUT_DIRECTORY, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
}

function copyStaticDirectory(sourceDirectory, outputName) {
  if (!fs.existsSync(sourceDirectory)) return;
  fs.cpSync(sourceDirectory, path.join(OUTPUT_DIRECTORY, outputName), { recursive: true });
}

function buildSite() {
  fs.rmSync(OUTPUT_DIRECTORY, { recursive: true, force: true });
  const allEntries = readProjectEntries();
  const publishedProjects = sortProjects(allEntries.filter(isPublished));
  writePage("index.html", renderHomePage(publishedProjects));
  writePage(path.join("projects", "index.html"), renderProjectIndexPage(publishedProjects));
  for (const project of publishedProjects) {
    writePage(path.join("projects", project.slug, "index.html"), renderProjectPage(project));
  }
  copyStaticDirectory(ASSETS_DIRECTORY, "assets");
  copyStaticDirectory(MEDIA_DIRECTORY, "media");
  const draftCount = allEntries.length - publishedProjects.length;
  console.log(
    `Built ${publishedProjects.length} published project page(s) into ` +
      `${path.relative(process.cwd(), OUTPUT_DIRECTORY)}/ (${draftCount} draft(s) held back)`
  );
  return allEntries;
}

/* ------------------------------------------------------------------ checks */

function collectPublishedEntryErrors(entry) {
  const errors = [];
  for (const field of REQUIRED_PROJECT_FIELDS) {
    if (!entry.data[field]) errors.push(`${entry.fileName}: missing required front-matter field "${field}"`);
  }
  if (entry.data.year && !YEAR_PATTERN.test(entry.data.year)) {
    errors.push(`${entry.fileName}: year must be a four-digit number, got "${entry.data.year}"`);
  }
  if (entry.data.status && !STATUS_PATTERN.test(entry.data.status)) {
    errors.push(`${entry.fileName}: status must be "in progress" or "complete", got "${entry.data.status}"`);
  }
  if (entry.data.cover && !fs.existsSync(path.join(OUTPUT_DIRECTORY, entry.data.cover))) {
    errors.push(`${entry.fileName}: cover "${entry.data.cover}" not found (expected under media/)`);
  }
  const missingMarkers = entry.rawText.match(MISSING_CONTENT_PATTERN) ?? [];
  if (missingMarkers.length > 0) {
    errors.push(
      `${entry.fileName}: published entries must not contain [MISSING: …] markers ` +
        `(found ${missingMarkers.length}; resolve them or set "publication: draft")`
    );
  }
  return errors;
}

function collectDraftEntryErrors(entry) {
  const errors = [];
  if (!entry.data.title) errors.push(`${entry.fileName}: drafts still need a "title"`);
  const isKnownValue = (value) => Boolean(value) && !value.includes("[MISSING:");
  if (isKnownValue(entry.data.year) && !YEAR_PATTERN.test(entry.data.year)) {
    errors.push(`${entry.fileName}: year must be a four-digit number, got "${entry.data.year}"`);
  }
  if (isKnownValue(entry.data.status) && !STATUS_PATTERN.test(entry.data.status)) {
    errors.push(`${entry.fileName}: status must be "in progress" or "complete", got "${entry.data.status}"`);
  }
  return errors;
}

function collectEntryErrors(allEntries) {
  const errors = [];
  for (const entry of allEntries) {
    if (!PUBLICATION_PATTERN.test(entry.data.publication ?? "")) {
      errors.push(
        `${entry.fileName}: front-matter field "publication" must be "draft" or "published", ` +
          `got "${entry.data.publication ?? "(missing)"}"`
      );
      continue;
    }
    errors.push(...(isPublished(entry) ? collectPublishedEntryErrors(entry) : collectDraftEntryErrors(entry)));
  }
  return errors;
}

function collectInternalLinkErrors(pagePath, html) {
  const errors = [];
  const referencePattern = /(?:href|src|poster)="([^"]+)"/g;
  for (const match of html.matchAll(referencePattern)) {
    const target = match[1];
    const isExternal = /^(https?:|mailto:|#)/.test(target);
    if (isExternal) continue;
    const resolvedPath = path.resolve(path.dirname(pagePath), target.split("#")[0]);
    if (!fs.existsSync(resolvedPath)) {
      errors.push(`${path.relative(OUTPUT_DIRECTORY, pagePath)}: broken internal link "${target}"`);
    }
  }
  return errors;
}

function collectMediaMarkupErrors(pagePath, html) {
  const errors = [];
  const pageName = path.relative(OUTPUT_DIRECTORY, pagePath);
  for (const match of html.matchAll(/<img [^>]*>/g)) {
    const hasAltText = /alt="[^"]+"/.test(match[0]);
    if (!hasAltText) errors.push(`${pageName}: image without alt text (${match[0]})`);
  }
  for (const match of html.matchAll(/<video[^>]*>/g)) {
    const hasControls = /\bcontrols\b/.test(match[0]);
    const hasPoster = /poster="[^"]+"/.test(match[0]);
    if (!hasControls) errors.push(`${pageName}: video without native controls (${match[0]})`);
    if (!hasPoster) errors.push(`${pageName}: video without a poster image (${match[0]})`);
  }
  if (html.includes("@video")) {
    errors.push(`${pageName}: malformed @video directive rendered as text — check its syntax`);
  }
  return errors;
}

function listOutputPages(directory) {
  return fs
    .readdirSync(directory, { recursive: true })
    .filter((name) => String(name).endsWith(".html"))
    .map((name) => path.join(directory, String(name)));
}

function runChecks(allEntries) {
  const errors = collectEntryErrors(allEntries);
  let missingContentCount = 0;
  for (const pagePath of listOutputPages(OUTPUT_DIRECTORY)) {
    const html = fs.readFileSync(pagePath, "utf8");
    errors.push(...collectInternalLinkErrors(pagePath, html));
    errors.push(...collectMediaMarkupErrors(pagePath, html));
    missingContentCount += (html.match(MISSING_CONTENT_PATTERN) ?? []).length;
  }
  for (const entry of allEntries.filter((candidate) => !isPublished(candidate))) {
    missingContentCount += (entry.rawText.match(MISSING_CONTENT_PATTERN) ?? []).length;
  }
  if (missingContentCount > 0) {
    console.log(
      `Note: ${missingContentCount} [MISSING: …] marker(s) in drafts and site pages ` +
        `(allowed there; published entries must resolve them).`
    );
  }
  if (errors.length > 0) {
    console.error(`Check failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log("All checks passed.");
}

/* ------------------------------------------------------------------ serve */

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".vtt": "text/vtt; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function startPreviewServer() {
  const server = http.createServer((req, res) => {
    const requestPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filePath = path.join(OUTPUT_DIRECTORY, path.normalize(requestPath));
    if (!filePath.startsWith(OUTPUT_DIRECTORY)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
      return;
    }
    const contentType = CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType }).end(fs.readFileSync(filePath));
  });
  server.listen(PREVIEW_PORT, () => {
    console.log(`Previewing at http://localhost:${PREVIEW_PORT}/ (rebuild with "node build.js" after edits)`);
  });
}

/* ------------------------------------------------------------------- main */

function main() {
  const allEntries = buildSite();
  if (process.argv.includes("--check")) runChecks(allEntries);
  if (process.argv.includes("--serve")) startPreviewServer();
}

main();
