import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();

const TITLES = {
  ru: "Частые <span class=\"accent\">вопросы</span>",
  en: "Frequently asked <span class=\"accent\">questions</span>",
  ky: "Көп берилүүчү <span class=\"accent\">суроолор</span>",
};

// показать, где ещё встречается </h2> (справочно)
import { readdirSync } from "node:fs";
const all = readFileSync(join(ROOT, "ru", "index.html"), "utf8");
let idx = 0;
while ((idx = all.indexOf("</h2>", idx)) >= 0) {
  console.log(`</h2> @${idx}: ...${all.slice(Math.max(0, idx - 120), idx + 5).replace(/\s+/g, " ")}`);
  idx += 5;
}

for (const [lang, title] of Object.entries(TITLES)) {
  const f = join(ROOT, lang, "index.html");
  let html = readFileSync(f, "utf8");
  const from = `<h2 class="section-title">${title}</h2>`;
  const to = `<h3 class="section-title">${title}</h3>`;
  const c = html.split(from).length - 1;
  if (c === 0 && html.includes(to)) { console.log(`SKIP ${lang}`); continue; }
  if (c !== 1) { console.error(`FAIL ${lang}: full-tag occurrences=${c}`); process.exitCode = 1; continue; }
  html = html.replace(from, to);
  writeFileSync(f, html, "utf8");
  console.log(`OK ${lang}: h2 -> h3 (full tag)`);
}
console.log("done");
