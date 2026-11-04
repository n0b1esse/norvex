import { readFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();

const home = readFileSync(join(ROOT, "ru", "index.html"), "utf8");
const main = home.slice(home.indexOf("<main"), home.indexOf("</main>") + 7);

console.log("=== разделы главной (class + первые заголовки + длина блска) ===");
const secs = [...main.matchAll(/<section[^>]*class="([^"]*)"[^>]*>/g)];
for (const m of secs) {
  const start = m.index;
  const end = main.indexOf("</section>", start) + 9;
  const block = main.slice(start, end);
  const heads = [...block.matchAll(/<h[1-4][^>]*>([^<]*)</g)].map((x) => x[1].trim()).filter(Boolean).slice(0, 4);
  console.log(`[${heads.join(" | ") || "(no heads)"}]\n    classes: ${m[1]}  len=${block.length}  href="#..." anchors: ${(block.match(/#\w+/g) || []).slice(0, 4).join(",")}`);
}

console.log("\n=== ПОСЛЕДНИЕ 1800 знаков main (точка вставки FAQ) ===");
console.log(main.slice(-1800).replace(/\s+/g, " "));

console.log("\n=== существующие аккордеоны по сайту (ru/*) ===");
import { readdirSync } from "node:fs";
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = join(dir, e.name);
  return e.isDirectory() ? walk(p) : e.name === "index.html" ? [p] : [];
});
for (const f of walk(join(ROOT, "ru"))) {
  const raw = readFileSync(f, "utf8");
  const hits = ["<details", "faq", "accordion", "aria-expanded"].filter((k) => raw.toLowerCase().includes(k));
  if (hits.length) console.log(`  ${f.slice(ROOT.length + 1)}: ${hits.join(", ")}`);
}

const css = readFileSync(join(ROOT, "_astro", "Layout.BXn8tf-v.css"), "utf8");
for (const sel of [".card", ".reveal", ".btn-outline", ".container"]) {
  const i = css.indexOf(sel);
  if (i >= 0) console.log(`\n${sel}: ${css.slice(i, i + 320)}`);
}
