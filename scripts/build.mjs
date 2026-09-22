// Generates index.html from src/index.html (template) and site.json (content). Zero dependencies.
// Usage: node scripts/build.mjs            build
//        node scripts/build.mjs --check    build, then fail on errors (unknown kind/state, missing
//                                          image files, broken version folders); blanks only warn.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(readFileSync(resolve(root, "site.json"), "utf8"));
let html = readFileSync(resolve(root, "src/index.html"), "utf8");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ratioClass = (r) => ({ "3:2": "r32", "4:3": "r43", "1:1": "r11", "21:9": "r219", "3:4": "r34" }[r] || "r43");
const roman = (n) => { const m = [[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; let s = ""; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; };

// An image or, when there is none, a hatched placeholder carrying a label.
const picture = (src, alt, ratio, label, extra = "") => {
  if (src) {
    fail(!existsSync(resolve(root, src)), `image not found: ${src}`);
    return `<img class="${extra}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;
  }
  return `<span class="ph ${ratioClass(ratio)} ${extra}" data-label="${esc(label)}"></span>`;
};

const problems = [];
const warn = (cond, msg) => { if (cond) console.warn(`warning: ${msg}`); };
const fail = (cond, msg) => { if (cond) { problems.push(msg); console.error(`error: ${msg}`); } };

// ---- now + contact
const now = Object.entries(site.now).map(([k, v]) =>
  `    <li><b>${esc(k)}</b> ${k === "since" ? `<span class="now">${esc(v)}</span>` : esc(v)}</li>`).join("\n");
const contact = [`<a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>`]
  .concat((site.contact.links || []).map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`)).join("<br>");

// ---- frontispiece
const fp = site.frontispiece || {};
const frontispiece = `    ${picture(fp.image, fp.caption, "21:9", "Frontispiece")}\n    <figcaption>${esc(fp.caption)}</figcaption>`;

// ---- board: rows = kinds, columns = states; works and ideas placed by kind/state
const boardRows = [`    <div class="ax"></div>` + site.states.map((s) => `<div class="ax">${esc(s)}</div>`).join("")];
for (const kind of site.kinds) {
  const cells = site.states.map((state) => {
    const items = [];
    if (state === site.states[0]) {
      for (const idea of site.ideas || []) if (idea.kind === kind)
        items.push(`<a href="#" title="${esc(idea.title)}"><span class="ph r11 idea"></span></a>`);
    }
    for (const w of site.works) if (w.kind === kind && w.state === state)
      items.push(`<a href="#${esc(w.slug)}" title="${esc(w.title)}">${picture(w.image, w.title, "1:1", "", "r11")}</a>`);
    return `<div class="cell">${items.join("")}</div>`;
  });
  boardRows.push(`    <div class="ax y">${esc(kind)}</div>${cells.join("")}`);
}
for (const w of site.works) {
  fail(!site.kinds.includes(w.kind), `${w.slug}: kind "${w.kind}" is not in kinds`);
  fail(!site.states.includes(w.state), `${w.slug}: state "${w.state}" is not in states`);
  for (const v of w.versions || []) fail(!existsSync(resolve(root, `projects/${w.slug}/${v}/index.html`)), `${w.slug}: missing projects/${w.slug}/${v}/index.html`);
}

// ---- works: one entry each, newest first as listed in site.json
let plateNo = 0;
const works = site.works.map((w) => {
  plateNo += 1;
  const frames = (w.versions || []).map((v) => `<a href="projects/${esc(w.slug)}/${esc(v)}/index.html" title="version ${esc(v.replace(/^v/, ""))}">${esc(v)}</a>`).join("");
  const latest = `projects/${esc(w.slug)}/${esc((w.versions || ["v1"]).at(-1))}/index.html`;
  return `  <div class="entry" id="${esc(w.slug)}">
    <figure>
      ${picture(w.image, w.caption, "4:3", `Plate ${roman(plateNo)}`)}
      <figcaption>${esc(w.caption)}</figcaption>
    </figure>
    <div>
      <p><b><a href="${latest}">${esc(w.title)}</a></b>. ${esc(w.prose)}</p>
      <div class="frames">${frames}</div>
    </div>
  </div>`;
}).join("\n\n");

// ---- loose plates
const plates = (site.plates || []).map((p) => {
  plateNo += 1;
  return `    <figure>${picture(p.image, p.caption, p.ratio, `Plate ${roman(plateNo)}`)}<figcaption>${esc(p.caption)}</figcaption></figure>`;
}).join("\n");

const updated = new Date().toISOString().slice(0, 10);
const slots = { title: esc(site.title), intro: esc(site.intro), now, contact, frontispiece, board: boardRows.join("\n"), works, plates, updated };
html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in slots)) throw new Error(`no slot for {{${k}}}`); return slots[k]; });

writeFileSync(resolve(root, "index.html"), html);
const blanks = (JSON.stringify(site).match(/______/g) || []).length;
warn(blanks > 0, `${blanks} blank(s) "______" still to fill in site.json`);
console.log(`index.html: ${site.works.length} work(s), ${(site.plates || []).length} loose plate(s), updated ${updated}`);
if (process.argv.includes("--check") && problems.length) { console.error(`${problems.length} problem(s)`); process.exit(1); }
