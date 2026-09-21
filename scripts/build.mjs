// Rewrites the works table in index.html from projects.json. Zero dependencies.
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const projects = JSON.parse(readFileSync(resolve(root, "projects.json"), "utf8"));
const indexPath = resolve(root, "index.html");
let html = readFileSync(indexPath, "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const versionsCell = (p) =>
  (p.versions || []).map((v) => `<a href="projects/${esc(p.slug)}/${esc(v)}/">${esc(v)}</a>`).join(" ");

const rows = projects
  .map((p) =>
    `<tr><td><a href="${esc(p.url)}">${esc(p.title)}</a></td><td>${esc(p.year)}</td><td>${esc(p.function)}</td><td>${esc(p.description)}</td><td>${versionsCell(p)}</td></tr>`
  )
  .join("\n");

const table = `<!-- projects:start -->
<table>
<tr><th>Title</th><th>Year</th><th>Function</th><th>Description</th><th>Versions</th></tr>
${rows}
</table>
<!-- projects:end -->`;

html = html.replace(/<!-- projects:start -->[\s\S]*?<!-- projects:end -->/, table);

const today = new Date().toISOString().slice(0, 10);
html = html.replace(/<!-- updated:start -->.*?<!-- updated:end -->/, `<!-- updated:start -->${today}<!-- updated:end -->`);

writeFileSync(indexPath, html);
console.log(`index.html: ${projects.length} work(s), updated ${today}`);
