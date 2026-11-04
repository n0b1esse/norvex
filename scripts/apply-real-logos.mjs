import { readFileSync, writeFileSync } from "node:fs";

const base = "C:\\Users\\user\\Documents\\Default Project\\norvex";

// 8 реальных логотипов: файл → названия на 3 языка → категория на 3 языка
const logos = [
  { file: "real_siemens.svg",   names: { ru: "Сименс", en: "Siemens",   ky: "Сименс" },      cat: { ru: "Горнодобыча", en: "Mining", ky: "Көн добыча" } },
  { file: "real_abb.svg",       names: { ru: "АББ", en: "ABB", ky: "АББ" },                    cat: { ru: "Промышленность", en: "Industry", ky: "Темiр кысабы" } },
  { file: "real_schneider.svg", names: { ru: "Шнайдер Электрик", en: "Schneider Electric", ky: "Шнайдер" }, cat: { ru: "Строительство", en: "Construction", ky: "Кыrsa" } },
  { file: "real_caterpillar.svg",names: { ru: "Катерпиллар", en: "Caterpillar", ky: "Катерпиллар" }, cat: { ru: "Тяжёлая техника", en: "Heavy Machinery", ky: "Тяжк техника" } },
  { file: "real_honeywell.svg", names: { ru: "Хонейвелл", en: "Honeywell", ky: "Хонейвелл" },   cat: { ru: "Логистика", en: "Logistics", ky: "Логистика" } },
  { file: "real_gazprom.svg",   names: { ru: "Газпром", en: "Gazprom", ky: "Газпром" },         cat: { ru: "Нефтегаз", en: "Oil & Gas", ky: "Нефтегаз" } },
  { file: "real_total.svg",     names: { ru: "Тотал Энерги", en: "TotalEnergies", ky: "Тотал" }, cat: { ru: "Энергетика", en: "Energy", ky: "Эネルгетика" } },
  { file: "real_beeline.svg",   names: { ru: "Билайн", en: "Beeline", ky: "Билайн" },           cat: { ru: "Телеком", en: "Telecom", ky: "Телеком" } }
];

const sections = {
  ru: { file: "\\ru\\index.html",   h1: "Нам доверяют<span class=\"accent\">ведущие компании</span>", lead: "Крупные предприятия Кыргызстана и региона уже выбирают NORVEX для обеспечения охраны труда, промышленной безопасности и экологии." },
  en: { file: "\\en\\index.html",   h1: "Trusted by<span class=\"accent\">leading companies</span>", lead: "Leading enterprises in Kyrgyzstan and the region already choose NORVEX for occupational health, industrial safety and ecology." },
  ky: { file: "\\ky\\index.html",   h1: "Бизге ишенүүчүлөр<span class=\"accent\">күнгдөк компаниялар</span>", lead: "Кыргызстандын жана өлкөлөрдүн үлкө кээлик компаниялары NORVEX-ди саילת." }
};

function buildBlock(langData) {
  const { h1, lead } = langData;
  const cards = logos.map((l, i) => {
    const nm = l.names; const ct = l.cat;
    return `<div class="trust-card reveal" style="--i:${i + 1}"><img src="/assets/logos/${l.file}" alt="${nm.ru}" width="160" height="160"><p class="trust-name">${nm.ru}<br><span style="font-weight:400;font-size:11px;opacity:.7;text-transform:uppercase">${ct.ru}</span></p></div>`;
  }).join("\n      ");
  return `<section class="section" id="trusted">\n  <div class="container">\n    <div class="section-head reveal" style="--i:0">\n      <h2 class="section-title">${h1}</h2>\n      <div class="bar"></div>\n      <p class="section-lead">${lead}</p>\n    </div>\n    <div class="trusted-grid">\n      ${cards}\n    </div>\n  </div>\n</section>`;
}

for (const lang of Object.keys(sections)) {
  const { file } = sections[lang];
  const f = base + file;
  let s = readFileSync(f, "utf8");
  const before = s;
  const start = s.indexOf('<section class="section" id="trusted">');
  const end = s.indexOf('</section>\n<section class="section bg-soft" id="faq">', start);
  if (start < 0 || end < 0) { console.log("block not found:", f); continue; }
  const block = buildBlock(sections[lang]);
  s = s.slice(0, start) + block + "\n" + s.slice(end);
  if (s !== before) { writeFileSync(f, s, "utf8"); console.log("patched:", f); } else { console.log("no changes:", f); }
}

console.log("done");
