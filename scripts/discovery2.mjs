import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

console.log("=== out/discovery files ===");
console.log(readdirSync(join(ROOT, "out", "discovery")).join("\n"));

const css = readFileSync(join(ROOT, "_astro/Layout.BXn8tf-v.css"), "utf8");
for (const sel of [".page-hero", ".docs-side", ".docs-panel", ".doc-list", ".cat[", "doc-row"]) {
  const i = css.indexOf(sel);
  console.log(`\n--- css: ${sel} @${i}`);
  if (i >= 0) console.log(css.slice(i, i + 1200));
}

for (const lang of ["ru", "en", "ky"]) {
  const f = join(ROOT, lang, "documents", "index.html");
  const raw = readFileSync(f, "utf8");
  const mEnd = raw.indexOf("</main>");

  const all = [...raw.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const catScripts = all.filter((s) => s.includes("cat") || s.includes("panel"));
  console.log(`\n=== ${lang}/documents inline scripts mentioning cat/panel (${catScripts.length}) ===`);
  for (const s of catScripts) console.log("---\n" + s.slice(0, 1200));

  const i = raw.indexOf('data-catpanel="procedures"');
  console.log(`\n=== ${lang} procedures panel ===\n` + raw.slice(i - 260, i + 1700).replace(/\s+/g, " "));

  const main = raw.slice(raw.indexOf("<main"), mEnd);
  console.log(`\nanchorTagsInMain=${(main.match(/<a[\s>]/g) || []).length}`);
}

const footerNeedle = { ru: "Документ", en: "Documents", ky: "Документ" };
for (const [lang, needle] of Object.entries(footerNeedle)) {
  const raw = readFileSync(join(ROOT, lang, "index.html"), "utf8");
  const footer = raw.slice(raw.indexOf("<footer"), raw.indexOf("</footer>") + 9);
  const m = footer.match(new RegExp(`<h[45][^>]*>\\s*${needle}[\\s\\S]{0,2000}?</ul>`));
  console.log(`\n=== footer docs col ${lang} ===\n` + (m ? m[0].replace(/\s+/g, " ") : "(not matched)"));
}
console.log("\ndiscovery2 done");
