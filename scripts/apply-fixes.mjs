import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
let fails = 0;
const log = [];

function rep(html, from, to, tag) {
  const c = html.split(from).length - 1;
  if (c === 0 && html.includes(to)) { log.push(`SKIP ${tag} (already applied)`); return html; }
  if (c !== 1) { fails++; log.push(`FAIL ${tag}: expected 1 got ${c}`); return html; }
  log.push(`OK   ${tag}`);
  return html.replace(from, to);
}

/* ====== 1) Layout.css: page-hero компактнее, nav-link крупнее ====== */
{
  const f = join(ROOT, "_astro", "Layout.BXn8tf-v.css");
  let css = readFileSync(f, "utf8");
  css = rep(css, "padding-block:84px 76px", "padding-block:44px 38px", "css page-hero padding");
  css = rep(css, "min-height:600px", "min-height:340px", "css page-hero min-height");
  css = rep(css, "clamp(32px,4.5vw,50px)", "clamp(28px,3.8vw,40px)", "css page-hero h1");
  css = rep(css,
    ".page-hero .hero-text p{margin-top:20px;font-size:calc(17px * var(--ts-body))",
    ".page-hero .hero-text p{margin-top:12px;font-size:calc(16px * var(--ts-body))",
    "css page-hero p");
  css = rep(css,
    "gap:4px;padding:8px 9px;white-space:nowrap;font-weight:600;font-size:14px",
    "gap:4px;padding:10px 12px;white-space:nowrap;font-weight:600;font-size:16px",
    "css nav-link size");
  writeFileSync(f, css, "utf8");
}

/* ====== 2) Home hero компактнее (3 index.html) ====== */
for (const lang of ["ru", "en", "ky"]) {
  const f = join(ROOT, lang, "index.html");
  let html = readFileSync(f, "utf8");
  html = rep(html, "padding-block:88px 52px", "padding-block:52px 36px", `${lang} home hero padding`);
  html = rep(html, "min-height:460px", "min-height:320px", `${lang} home hero min-height`);
  html = rep(html, "clamp(34px,5vw,56px)", "clamp(30px,4.2vw,46px)", `${lang} home hero h1`);
  html = rep(html,
    'p[data-astro-cid-ct3bgug4]{margin-top:22px;font-size:calc(19px * var(--ts-body))',
    'p[data-astro-cid-ct3bgug4]{margin-top:12px;font-size:calc(16px * var(--ts-body))',
    `${lang} home hero p`);
  writeFileSync(f, html, "utf8");
}

/* ====== 3) Футер: колонка «Документы» → 3 якорных ссылки (24 файла) ====== */
const FOOT = {
  ru: { h4: "Документы", labels: ["Политики", "Процедуры", "Чек-листы"] },
  en: { h4: "Documents", labels: ["Policies", "Procedures", "Checklists"] },
  ky: { h4: "Документтер", labels: ["Политикалар", "Процедуралар", "Чек-листтер"] },
};
const anchors = ["policies", "procedures", "checklists"];

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name === "index.html" ? [p] : [];
  });
const allFiles = ["ru", "en", "ky"].flatMap((l) => walk(join(ROOT, l)));

for (const f of allFiles) {
  const lang = f.slice(ROOT.length + 1).split(/[\\/]/)[0];
  const meta = FOOT[lang];
  let html = readFileSync(f, "utf8");
  const hIdx = html.indexOf(">" + meta.h4 + "</h4>");
  if (hIdx < 0) { fails++; log.push(`FAIL footer h4 not in ${f}`); continue; }
  const uStart = html.indexOf("<ul", hIdx);
  const uEnd = html.indexOf("</ul>", uStart) + 5;
  const oldUl = html.slice(uStart, uEnd);
  if (oldUl.includes(`href="/${lang}/documents/#`)) { log.push(`SKIP footer ${f} (updated)`); continue; }
  if (!oldUl.includes(`href="/${lang}/documents"`)) { log.push(`SKIP footer ${f} (no docs col)`); continue; }
  const cidF = (oldUl.match(/data-astro-cid-[a-z0-9]+/) || [])[0];
  const ulOpen = oldUl.match(/^<ul[^>]*>/)[0];
  const liOpen = oldUl.match(/<li[^>]*>/)[0];
  const items = meta.labels.map((label, i) =>
    `${liOpen}<a href="/${lang}/documents/#${anchors[i]}" ${cidF}>${label}</a></li>`);
  const newUl = ulOpen + items.join("") + "</ul>";
  html = html.slice(0, uStart) + newUl + html.slice(uEnd);
  writeFileSync(f, html, "utf8");
  log.push(`OK   footer ${f.slice(ROOT.length + 1).replace(/\\/g, "/")}`);
}

/* ====== 4) Страницы Документы: кнопка/панель «Чек-листы», якоря, hash-скрипт ====== */
const DOCS = {
  ru: {
    h1: "Чек-листы",
    lead: "Практические чек-листы для быстрой проверки состояния охраны труда, промышленной безопасности и экологии на объектах.",
    sub: "PDF — по запросу",
    rows: [
      "ЧЕК-ЛИСТ ПЕРВИЧНОЙ ОЦЕНКИ ОХРАНЫ ТРУДА НА ОБЪЕКТЕ",
      "ЧЕК-ЛИСТ ПРОМЫШЛЕННОЙ БЕЗОПАСНОСТИ И РАБОТ ПОВЫШЕННОЙ ОПАСНОСТИ",
      "ЧЕК-ЛИСТ ЭКОЛОГИЧЕСКОГО КОНТРОЛЯ НА ОБЪЕКТЕ",
      "ЧЕК-ЛИСТ ПОДГОТОВКИ К ВНЕШНЕМУ HSE-АУДИТУ",
    ],
    procLabel: "Процедуры", listLabel: "Чек-листы",
  },
  en: {
    h1: "Checklists",
    lead: "Practical checklists for a quick assessment of occupational health, safety and environmental compliance on site.",
    sub: "PDF — upon request",
    rows: [
      "OCCUPATIONAL HEALTH AND SAFETY SITE ASSESSMENT CHECKLIST",
      "INDUSTRIAL SAFETY AND HIGH-RISK WORKS CHECKLIST",
      "ENVIRONMENTAL CONTROL CHECKLIST",
      "EXTERNAL HSE AUDIT PREPARATION CHECKLIST",
    ],
    procLabel: "Procedures", listLabel: "Checklists",
  },
  ky: {
    h1: "Чек-листтер",
    lead: "Объекттердеги эмгекти коргоо, өнөр жай коопсуздугу жана экологиянын абалын тез баалоо үчүн практикалык чек-листтер.",
    sub: "PDF — суроо-талап боюнча",
    rows: [
      "ОБЪЕКТТЕГИ ЭМГЕКТИ КОРГОО ЧЕК-ЛИСТИ",
      "ӨНӨР ЖАЙ КООПСУЗДУГУ ЖАНА ЖОГОРКУ ТИБЕГИНДЕГИ ИШТЕР ЧЕК-ЛИСТИ",
      "ЭКОЛОГИЯЛЫК КОНТРОЛЬ ЧЕК-ЛИСТИ",
      "ТЫШКЫ HSE-АУДИТКЕ ДАЯРДЫК ЧЕК-ЛИСТИ",
    ],
    procLabel: "Процедуралар", listLabel: "Чек-листтер",
  },
};

for (const lang of ["ru", "en", "ky"]) {
  const f = join(ROOT, lang, "documents", "index.html");
  let html = readFileSync(f, "utf8");
  if (!html.includes('data-cat="checklists"')) {
    const meta = DOCS[lang];

    // 4.1 ids на кнопки табов
    html = rep(html, '<button class="cat active" data-cat="policies"',
      '<button id="policies" class="cat active" data-cat="policies"', `${lang} id policies`);
    html = rep(html, '<button class="cat" data-cat="procedures"',
      '<button id="procedures" class="cat" data-cat="procedures"', `${lang} id procedures`);

    // 4.2 новая кнопка (копия процедурной)
    const bStart = html.indexOf('<button id="procedures"');
    const bEnd = html.indexOf("</button>", bStart) + "</button>".length;
    let btn = html.slice(bStart, bEnd);
    if (!btn.includes(meta.procLabel)) { fails++; log.push(`FAIL ${lang} procedures button label`); }
    btn = btn.replace('id="procedures"', 'id="checklists"').replace('data-cat="procedures"', 'data-cat="checklists"')
      .replace(meta.procLabel, meta.listLabel);
    const asideIdx = html.indexOf("</aside>", bStart);
    html = html.slice(0, asideIdx) + btn + " " + html.slice(asideIdx);
    log.push(`OK   ${lang} checklists button`);

    // 4.3 новая панель после панели процедур
    const cid = (html.match(/class="docs-panel[^"]*" data-catpanel="[a-z]+" (data-astro-cid-[a-z0-9]+)/) || [])[1];
    if (!cid) { fails++; log.push(`FAIL ${lang} docs cid`); }
    const row = (name) =>
      `<li class="card doc-row" ${cid}> <span class="pdf-badge" ${cid}>PDF</span> <div class="doc-meta" ${cid}> <span class="doc-name" ${cid}>${name}</span> <span class="doc-sub" ${cid}>${meta.sub}</span> </div> </li>`;
    const panel =
      `<div class="docs-panel" data-catpanel="checklists" ${cid}> <h1 ${cid}>${meta.h1}</h1> <p class="docs-lead" ${cid}>${meta.lead}</p> <ul class="doc-list" ${cid}> ` +
      meta.rows.map((r) => row(r)).join("") +
      ` </ul> </div>`;
    const pIdx = html.indexOf('data-catpanel="procedures"');
    const ulIdx = html.indexOf("</ul>", pIdx);
    const divIdx = html.indexOf("</div>", ulIdx) + "</div>".length;
    html = html.slice(0, divIdx) + " " + panel + html.slice(divIdx);
    log.push(`OK   ${lang} checklists panel`);

    // 4.4 scroll-margin для якорных кнопок
    const sideRule = html.match(/\.docs-side\[data-astro-cid-[a-z0-9]+\]\{[^}]*\}/);
    if (sideRule) {
      const catCid = (sideRule[0].match(/data-astro-cid-[a-z0-9]+/) || [])[0];
      html = rep(html, sideRule[0], sideRule[0] + `.cat[${catCid}]{scroll-margin-top:104px}`, `${lang} scroll-margin`);
    }
  } else {
    log.push(`SKIP ${lang} documents (already applied)`);
  }

  // 4.5 hash -> активация нужной вкладки
  const hashScript = '<script>(function(){var h=(location.hash||"").replace("#","");if(h){var b=document.querySelector(\'.cat[data-cat="\'+h+\'"]\');if(b)b.click();}})();</script>';
  if (!html.includes("var b=document.querySelector('.cat[data-cat=")) {
    const c = html.split("</body>").length - 1;
    if (c !== 1) { fails++; log.push(`FAIL ${lang} </body> count=${c}`); }
    else { html = html.replace("</body>", hashScript + "</body>"); log.push(`OK   ${lang} hash script`); }
  }
  writeFileSync(f, html, "utf8");
}

/* ====== 5) Контрольные проверки ====== */
let checklistsPages = 0, footerUpdated = 0;
for (const f of allFiles) {
  const html = readFileSync(f, "utf8");
  if (html.split("documents/#checklists").length - 1 >= 1) footerUpdated++;
  if (html.includes('data-catpanel="checklists"')) { checklistsPages++; if (!html.includes('id="checklists"') || !html.includes('id="policies"') || !html.includes('id="procedures"')) { fails++; log.push(`FAIL ids missing in ${f}`); } }
}
log.push(`CHECK footer updated: ${footerUpdated}/24; docs pages with checklists: ${checklistsPages}/3`);

console.log(log.join("\n"));
if (fails) { console.error(`\n!! ERRORS: ${fails}`); process.exitCode = 1; }
else console.log("\nAPPLY OK");
