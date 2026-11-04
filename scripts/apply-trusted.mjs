import { readFileSync, writeFileSync } from "node:fs";

const base = "C:\\Users\\user\\Documents\\Default Project\\norvex";
const cssFile = `${base}\\_astro\\Layout.BXn8tf-v.css`;

const cssBlock = `
/* staging: trusted-logos */
.trusted-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:24px;margin-top:32px}
.trust-card{border:1px solid var(--border);border-radius:var(--radius-sm);padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--surface);transition:transform .18s,box-shadow .18s}
.trust-card:hover{transform:translateY(-4px);box-shadow:var(--shadow);border-color:var(--green-500)}
.trust-card svg,.trust-card img{width:84px;height:84px;color:var(--navy);margin-bottom:10px;display:block}
.trust-name{font-weight:700;color:var(--navy);font-size:calc(13.5px * var(--ts-body));text-align:center;line-height:1.35}
`;

const sections = {
  ru: {
    file: "\\ru\\index.html",
    h1: "Нам доверяют<span class=\"accent\">ведущие компании</span>",
    lead: "Крупные предприятия Кыргызстана и региона уже выбирают NORVEX для обеспечения охраны труда, промышленной безопасности и экологии.",
    names: ["Горнодобыча","Нефтегаз","Строительство","Промышленность","Логистика","Торговля","Банк","Телеком"]
  },
  en: {
    file: "\\en\\index.html",
    h1: "Trusted by<span class=\"accent\">leading companies</span>",
    lead: "Leading enterprises in Kyrgyzstan and the region already choose NORVEX for occupational health, industrial safety and ecology.",
    names: ["Mining","Oil & Gas","Construction","Manufacturing","Logistics","Retail","Banking","Telecom"]
  },
  ky: {
    file: "\\ky\\index.html",
    h1: "Бизге ишенүүчүлөр<span class=\"accent\">күнгдөк компаниялар</span>",
    lead: "Кыргызстандын жана өлкөлөрдүн үлкө кээлик компаниялары NORVEX-ди саילת.",
    names: ["Көн добыча","Нефтегаз","Стройка","Завод","Логистика","Торговля","Банк","Телеком"]
  }
};

const logos = ["logo-mining","logo-oilgas","logo-construction","logo-manufacturing","logo-logistics","logo-retail","logo-finance","logo-telecom"];

function buildSection(langData) {
  const { h1, lead, names } = langData;
  const cardHtml = names.map((name, i) =>
    `<div class="trust-card reveal" style="--i:${i + 1}"><img src="/assets/logos/${logos[i]}.svg" alt="${name}" width="160" height="160"><p class="trust-name">${name}</p></div>`
  ).join("\n      ");
  return `<section class="section" id="trusted">\n  <div class="container">\n    <div class="section-head reveal" style="--i:0">\n      <h2 class="section-title">${h1}</h2>\n      <div class="bar"></div>\n      <p class="section-lead">${lead}</p>\n    </div>\n    <div class="trusted-grid">\n      ${cardHtml}\n    </div>\n  </div>\n</section>`;
}

for (const lang of Object.keys(sections)) {
  const { file } = sections[lang];
  const f = base + file;
  let s = readFileSync(f, "utf8");
  const before = s;
  const faqPos = s.indexOf('id="faq"');
  if (faqPos < 0) { console.log("faq not found:", f); continue; }
  const secPos = s.lastIndexOf("<section", faqPos);
  if (secPos < 0) { console.log("section not found:", f); continue; }
  const section = buildSection(sections[lang]);
  s = s.slice(0, secPos) + section + "\n" + s.slice(secPos);
  if (s !== before) { writeFileSync(f, s, "utf8"); console.log("patched:", f); }
}

let css = readFileSync(cssFile, "utf8");
if (!css.includes("trusted-grid")) {
  writeFileSync(cssFile, css.trimEnd() + cssBlock, "utf8");
  console.log("css appended");
} else {
  console.log("css already present");
}

console.log("done");
