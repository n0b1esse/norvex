import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();

for (const lang of ["ru", "en", "ky"]) {
  const f = join(ROOT, lang, "index.html");
  let html = readFileSync(f, "utf8");
  const from1 = '<h2 class="section-title">';
  const to1 = '<h3 class="section-title">';
  const c1 = html.split(from1).length - 1;
  const c2 = html.split("</h2>").length - 1;
  if (c1 === 0 && html.includes(to1)) { console.log(`SKIP ${lang}`); continue; }
  if (c1 !== 1 || c2 !== 1) { console.error(`FAIL ${lang}: h2 open=${c1} close=${c2}`); process.exitCode = 1; continue; }
  html = html.replace(from1, to1).replace("</h2>", "</h3>");
  writeFileSync(f, html, "utf8");
  console.log(`OK ${lang}: faq heading h2 -> h3`);
}
console.log("done");
