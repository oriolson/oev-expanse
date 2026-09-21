#!/usr/bin/env node
/**
 * Zero-dependency static build for Ori Olson's personal site.
 *
 * Usage:
 *   node build.js            Build the site into dist/
 *   node build.js --check    Build, then validate content and links
 *   node build.js --serve    Build, then preview at http://localhost:8080
 *
 * Requires only Node.js (no npm install). See AGENTS.md for content rules.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const SOURCE_DIRECTORY = __dirname;
const CONTENT_DIRECTORY = path.join(SOURCE_DIRECTORY, "content");
const PROJECTS_DIRECTORY = path.join(CONTENT_DIRECTORY, "projects");
const ASSETS_DIRECTORY = path.join(SOURCE_DIRECTORY, "assets");
const OUTPUT_DIRECTORY = path.join(SOURCE_DIRECTORY, "dist");

const SITE_TITLE = "Ori Olson";
const PREVIEW_PORT = 8080;
const REQUIRED_PROJECT_FIELDS = ["title", "year", "type", "status", "summary"];
const MISSING_CONTENT_PATTERN = /\[MISSING:[^\]]*\]/g;

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

/** Renders the documented Markdown subset for one inline span. */
function renderInline(text) {
  return escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

/** Renders the documented Markdown subset: headings, paragraphs, lists. */
function renderMarkdown(body) {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const html = blocks.map((block) => {
    const headingMatch = block.match(/^(#{1,3}) (.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      return `<h${level}>${renderInline(headingMatch[2])}</h${level}>`;
    }
    if (block.split("\n").every((line) => line.startsWith("- "))) {
      const items = block
        .split("\n")
        .map((line) => `<li>${renderInline(line.slice(2))}</li>`)
        .join("\n");
      return `<ul>\n${items}\n</ul>`;
    }
    return `<p>${renderInline(block.replaceAll("\n", " "))}</p>`;
  });
  return html.join("\n");
}

function readProjects() {
  if (!fs.existsSync(PROJECTS_DIRECTORY)) return [];
  const fileNames = fs
    .readdirSync(PROJECTS_DIRECTORY)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .sort();
  const projects = fileNames.map((fileName) => {
    const rawText = fs.readFileSync(path.join(PROJECTS_DIRECTORY, fileName), "utf8");
    const { data, body } = parseFrontMatter(rawText);
    return { slug: fileName.replace(/\.md$/, ""), fileName, data, body };
  });
  return projects.sort(
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
  const mainHtml = [
    `<h1>${SITE_TITLE}</h1>`,
    renderMarkdown(body),
    "<h2>Projects</h2>",
    `<ul>\n${renderProjectListItems(projects, "./")}\n</ul>`,
    '<p><a href="./projects/index.html">Full project index</a></p>',
  ].join("\n");
  return renderLayout({ pageTitle: SITE_TITLE, mainHtml, rootPath: "./" });
}

function renderProjectIndexPage(projects) {
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
${renderMarkdown(body)}
<p><a href="../index.html">Back to all projects</a></p>`;
  return renderLayout({ pageTitle: data.title, mainHtml, rootPath: "../../" });
}

/* ------------------------------------------------------------------ build */

function writePage(relativePath, html) {
  const outputPath = path.join(OUTPUT_DIRECTORY, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
}

function copyAssets() {
  if (!fs.existsSync(ASSETS_DIRECTORY)) return;
  fs.cpSync(ASSETS_DIRECTORY, path.join(OUTPUT_DIRECTORY, "assets"), { recursive: true });
}

function buildSite() {
  fs.rmSync(OUTPUT_DIRECTORY, { recursive: true, force: true });
  const projects = readProjects();
  writePage("index.html", renderHomePage(projects));
  writePage(path.join("projects", "index.html"), renderProjectIndexPage(projects));
  for (const project of projects) {
    writePage(path.join("projects", project.slug, "index.html"), renderProjectPage(project));
  }
  copyAssets();
  console.log(`Built ${projects.length} project page(s) into ${path.relative(process.cwd(), OUTPUT_DIRECTORY)}/`);
  return projects;
}

/* ------------------------------------------------------------------ checks */

function collectInternalLinkErrors(pagePath, html) {
  const errors = [];
  const hrefPattern = /(?:href|src)="([^"]+)"/g;
  for (const match of html.matchAll(hrefPattern)) {
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

function collectImageAltErrors(pagePath, html) {
  const errors = [];
  for (const match of html.matchAll(/<img [^>]*>/g)) {
    const hasAltText = /alt="[^"]+"/.test(match[0]);
    if (!hasAltText) {
      errors.push(`${path.relative(OUTPUT_DIRECTORY, pagePath)}: image without alt text (${match[0]})`);
    }
  }
  return errors;
}

function listOutputPages(directory) {
  return fs
    .readdirSync(directory, { recursive: true })
    .filter((name) => String(name).endsWith(".html"))
    .map((name) => path.join(directory, String(name)));
}

function runChecks(projects) {
  const errors = [];
  for (const project of projects) {
    for (const field of REQUIRED_PROJECT_FIELDS) {
      if (!project.data[field]) {
        errors.push(`${project.fileName}: missing required front-matter field "${field}"`);
      }
    }
    if (project.data.year && !/^\d{4}$/.test(project.data.year)) {
      errors.push(`${project.fileName}: year must be a four-digit number, got "${project.data.year}"`);
    }
  }
  let missingContentCount = 0;
  for (const pagePath of listOutputPages(OUTPUT_DIRECTORY)) {
    const html = fs.readFileSync(pagePath, "utf8");
    errors.push(...collectInternalLinkErrors(pagePath, html));
    errors.push(...collectImageAltErrors(pagePath, html));
    missingContentCount += (html.match(MISSING_CONTENT_PATTERN) ?? []).length;
  }
  if (missingContentCount > 0) {
    console.log(`Note: ${missingContentCount} [MISSING: …] marker(s) still present (allowed; fill in over time).`);
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
  const projects = buildSite();
  if (process.argv.includes("--check")) runChecks(projects);
  if (process.argv.includes("--serve")) startPreviewServer();
}

main();
