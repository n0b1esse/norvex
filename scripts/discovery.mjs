import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "out", "discovery");
mkdirSync(OUT, { recursive: true });

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name === "index.html" ? [p] : [];
  });

const files = ["ru", "en", "ky"].flatMap((l) => walk(join(ROOT, l)));

const heroBlocks = [];
const summary = [];
let importantFiles = 0;

for (const f of files) {
  const raw = readFileSync(f, "utf8");
  const rel = f.slice(ROOT.length + 1).replace(/[\\/]index\.html$/, "").replace(/[\\/]/g, "_");

  const styles = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  const heroStyles = styles.filter((s) => /\.(page-hero|hero)\[/.test(s));
  const hero = heroStyles.join("\n\n<!-- style block -->\n\n");
  heroBlocks.push(`===== ${rel} =====\n${hero}`);

  const imp = heroStyles.some((s) => s.includes("!important"));
  if (imp) importantFiles++;

  const pad = [...hero.matchAll(/padding[a-z-]*:[^;}]*/g)].map((m) => m[0]).join(" | ");
  const mh = [...hero.matchAll(/min-height:[^;}]*/g)].map((m) => m[0]).join(" | ");
  const h1 = [...hero.matchAll(/[^{}]*\bh1\b[^{]*\{[^}]*\}/g)].map((m) => m[0]).join("\n   ");
  const ps = [...hero.matchAll(/[^{}]*\bp\b[^{]*\{[^}]*font-size[^}]*\}/g)].map((m) => m[0]).join("\n   ");
  summary.push(`--- ${rel} | blocks=${heroStyles.length} imp=${imp}\n  pad: ${pad}\n  minH: ${mh}\n  h1:\n   ${h1}\n  p:\n   ${ps}`);
}

writeFileSync(join(OUT, "hero-all.txt"), heroBlocks.join("\n\n"));
console.log(summary.join("\n"));
console.log(`\nfiles=${files.length} filesWithImportantInHeroStyles=${importantFiles}`);

for (const lang of ["ru", "en", "ky"]) {
  const raw = readFileSync(join(ROOT, lang, "index.html"), "utf8");
  const footer = raw.slice(raw.indexOf("<footer"), raw.indexOf("</footer>") + 9);
  writeFileSync(join(OUT, `footer-${lang}.html`), footer);
  const needle = lang === "en" ? "Documents" : "Документ";
  const m = footer.match(new RegExp(`<h[45][^>]*>\\s*${needle}[\\s\\S]{0,2000}?</ul>`));
  writeFileSync(join(OUT, `docscol-${lang}.txt`), m ? m[0] : "(not matched)");

  const draft = readFileSync(join(ROOT, lang, "documents", "index.html"), "utf8");
  writeFileSync(join(OUT, `main-docs-${lang}.html`), draft.slice(draft.indexOf("<main"), draft.indexOf("</main>") + 7));
}

const rawAbout = readFileSync(join(ROOT, "ru", "about", "index.html"), "utf8");
writeFileSync(join(OUT, "main-ru-about.txt"), rawAbout.slice(rawAbout.indexOf("<main"), rawAbout.indexOf("</main>") + 7));
const rawHome = readFileSync(join(ROOT, "ru", "index.html"), "utf8");
writeFileSync(join(OUT, "main-ru-home.txt"), rawHome.slice(rawHome.indexOf("<main"), rawHome.indexOf("</main>") + 7).slice(0, 3000));

console.log("discovery written to out/discovery");
