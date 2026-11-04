import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OLD = '<script>(function(){var h=(location.hash||"").replace("#","");if(h){var b=document.querySelector(\'.cat[data-cat="\'+h+\'"]\');if(b)b.click();}})();</script>';
const NEW = '<script>(function(){var h=(location.hash||"").replace("#","");if(!h)return;function act(){var ok=[].slice.call(document.querySelectorAll("[data-catpanel]")).some(function(p){return p.dataset.catpanel===h});if(!ok)return;document.querySelectorAll("[data-cat]").forEach(function(x){var on=x.dataset.cat===h;x.classList.toggle("active",on)});document.querySelectorAll("[data-catpanel]").forEach(function(p){var on=p.dataset.catpanel===h;p.classList.toggle("active",on)});}act();})();</script>';

let n = 0;
for (const lang of ["ru", "en", "ky"]) {
  const f = join(ROOT, lang, "documents", "index.html");
  let html = readFileSync(f, "utf8");
  if (html.includes(NEW)) { console.log(`${lang}: already fixed`); continue; }
  const c = html.split(OLD).length - 1;
  if (c !== 1) { console.error(`${lang}: OLD hash script occurrences=${c} — expected 1`); process.exitCode = 1; continue; }
  html = html.replace(OLD, NEW);
  writeFileSync(f, html, "utf8");
  n++;
  console.log(`${lang}: hash script upgraded`);
}
console.log("done, files changed:", n);
