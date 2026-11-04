import { readFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();

const d = readFileSync(join(ROOT, "ru", "documents", "index.html"), "utf8");
const i = d.indexOf('id="checklists"');
console.log("BTN:   " + d.slice(i - 20, i + 330).replace(/\s+/g, " "));
const j = d.indexOf('data-catpanel="checklists"');
console.log("PANEL: " + d.slice(j - 25, j + 450).replace(/\s+/g, " "));
const k = d.indexOf("</div>", j);
console.log("TAIL:  " + d.slice(k, k + 160).replace(/\s+/g, " "));

const h = readFileSync(join(ROOT, "ru", "index.html"), "utf8");
const f = h.indexOf("Документы</h4>");
console.log("FOOTER:" + h.slice(f, f + 460).replace(/\s+/g, " "));

const c = readFileSync(join(ROOT, "_astro", "Layout.BXn8tf-v.css"), "utf8");
console.log("CSShero:" + c.slice(c.indexOf(".page-hero{"), c.indexOf(".page-hero{") + 155));
console.log("CSSnav: " + c.slice(c.indexOf(".nav-link["), c.indexOf(".nav-link[") + 215));
