import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const home = readFileSync(join(ROOT, "ru", "index.html"), "utf8");
const styleBlocks = [...home.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
console.log("=== ru/index.html style blocks ===");
styleBlocks.forEach((s, i) => console.log(`--- block ${i} (${s.length}) ---\n${s}\n`));

const astro = readdirSync(join(ROOT, "_astro"));
console.log("=== _astro/ contents ===");
for (const f of astro) console.log(`  ${f}  ${(statSync(join(ROOT, "_astro", f)).size / 1024).toFixed(1)}KB`);

for (const lang of ["ru", "en", "ky"]) {
  const raw = readFileSync(join(ROOT, lang, "documents", "index.html"), "utf8");
  const links = [...raw.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map((m) => m[0]);
  console.log(`\n=== ${lang}/documents css links ===\n${links.join("\n")}`);
  const docsStyles = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).filter((s) => s.includes("docs-side") || s.includes("doc-list"));
  console.log(`docs inline style blocks: ${docsStyles.length}`);
  for (const s of docsStyles) console.log(`--- docs style (${s.length}) ---\n${s.slice(0, 2500)}`);
}

const raw = readFileSync(join(ROOT, "ru", "documents", "index.html"), "utf8");
const pi = raw.indexOf('data-catpanel="procedures"');
const tail = raw.slice(pi, raw.indexOf("</main>"));
console.log(`\n=== ru documents: procedures panel tail (last 1500 on main) ===\n${tail.slice(-1500)}`);

const css = readFileSync(join(ROOT, "_astro/Layout.BXn8tf-v.css"), "utf8");
const checks = [
  ["padding-block:88px 52px", "home-inline-x3"],
  ["min-height:460px", "home-inline-x3"],
  ["clamp(34px,5vw,56px)", "home-inline-x3"],
  ["calc(19px * var(--ts-body))", "home-inline-x3"],
  ["padding-block:84px 76px", "layout"],
  ["min-height:600px", "layout"],
  ["clamp(32px,4.5vw,50px)", "layout"],
  [".page-hero .hero-text p{margin-top:20px;font-size:calc(17px * var(--ts-body))", "layout"],
  ["gap:4px;padding:8px 9px;white-space:nowrap;font-weight:600;font-size:14px", "layout-nav"],
];
const counts = { html: {} };
for (const lang of ["ru", "en", "ky"]) {
  const h = readFileSync(join(ROOT, lang, "index.html"), "utf8");
  for (const [s] of checks) counts.html[s] = (counts.html[s] || 0) + (h.split(s).length - 1);
}
console.log("\n=== occurrence counts ===");
for (const [s, where] of checks) {
  const c = where === "layout" || where === "layout-nav" ? css.split(s).length - 1 : counts.html[s];
  console.log(`${c}  total(actual css ${css.split(s).length - 1})  [${where}]  ${s.slice(0, 60)}`);
}
console.log("\ndiscovery3 done");
