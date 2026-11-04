import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
let fails = 0;
function rep(html, from, to, tag) {
  const c = html.split(from).length - 1;
  if (c === 0 && html.includes(to)) { console.log(`SKIP ${tag}`); return html; }
  if (c !== 1) { console.error(`FAIL ${tag}: occurrences=${c}`); fails++; return html; }
  console.log(`OK   ${tag}`);
  return html.replace(from, to);
}

const ICONS = {
  search: '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />',
  user: '<path d="M2 21a8 8 0 0 1 13.292-6" /><circle cx="10" cy="8" r="5" /><path d="m16 19 2 2 4-4" />',
  clip: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" />',
};
const svg = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const CONTENT = {
  ru: {
    title: "Как мы <span class=\"accent\">работаем</span>",
    lead: "Прозрачный процесс от первой диагностики до устойчивого результата — вы всегда знаете, что происходит на вашем объекте.",
    steps: [
      [1, ICONS.search, "Диагностика объекта", "Аккуратный первичный аудит: задачи, документы и текущее состояние охраны труда и промбезопасности. Без обязательств."],
      [2, ICONS.file, "Решение и договор", "Предлагаем формат — консалтинг, аутсорсинг или аутстаффинг, объём присутствия и прозрачную смету. Подписываем договор."],
      [3, ICONS.user, "Специалист на объекте", "Сертифицированный HSE-специалист приступает к работе по графику, согласованному с производством."],
      [4, ICONS.clip, "Отчётность и аудит", "Регулярные отчёты, корректирующие действия и контроль до результата. Решение пересматривается по мере изменений."],
    ],
  },
  en: {
    title: "How we <span class=\"accent\">work</span>",
    lead: "A transparent process from the first assessment to a stable result — you always know what is happening on your site.",
    steps: [
      [1, ICONS.search, "Site assessment", "A careful initial review: your tasks, documentation and the current state of OSH — free of charge, no strings attached."],
      [2, ICONS.file, "Proposal and contract", "We propose the format — consulting, outsourcing or outstaffing — the scope of presence and transparent pricing, then sign the contract."],
      [3, ICONS.user, "Specialist on site", "A certified HSE specialist starts work on a schedule agreed with your operations team."],
      [4, ICONS.clip, "Reporting and audit", "Regular reports, corrective actions and control until the result. The solution is revisited as conditions change."],
    ],
  },
  ky: {
    title: "Кантип <span class=\"accent\">иштейбиз</span>",
    lead: "Биринчи баалоодон туруктуу жыйынтыкка чейин айкын процесс — объектиңизде эмне болуп жатканын дайыма билесиз.",
    steps: [
      [1, ICONS.search, "Объекттин абалын баалоо", "Тапшырмаларды, документтерди жана учурдагы коопсуздук абалын акысыз талдоо. Милдеткенслер."],
      [2, ICONS.file, "Чечим жана келишим", "Форматты сунуштайбыз: консалтинг, аутсорсинг же аутстаффинг. Чыгуу объёму, айкын баа жана келишим."],
      [3, ICONS.user, "Объекттеги адис", "Сертификатталган HSE адиси өндүрүш менен макулдашылган график боюнча ишин баштайт."],
      [4, ICONS.clip, "Отчёт жана аудит", "Мезгилдүү отчёттор, оңдоочу аракеттер жана жыйынтыкка чейинки көзөмөл; зарыл болсо чечимди жаңыртайбыз."],
    ],
  },
};

function workHtml(lang, meta) {
  const cards = meta.steps.map(([no, paths, t, d]) =>
    `<div class="card process-step reveal" style="--i:${no}"> <div class="process-top"> <span class="icon-badge">${svg(paths)}</span> <span class="step-no">0${no}</span> </div> <h3 class="process-title">${t}</h3> <p>${d}</p> </div>`
  ).join("");
  return `
  <section class="section" id="process">
   <div class="container">
    <div class="section-head reveal" style="--i:0">
     <h3 class="section-title">${meta.title}</h3>
     <div class="bar"></div>
     <p class="section-lead">${meta.lead}</p>
    </div>
    <div class="process-steps">${cards}</div>
   </div>
  </section>
  `;
}

/* 1) CSS */
{
  const f = join(ROOT, "_astro", "Layout.BXn8tf-v.css");
  let css = readFileSync(f, "utf8");
  if (!css.includes("staging: process")) {
    const block = [
      "", "/* ==== staging: process (home) ==== */",
      ".process-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}",
      "@media(max-width:992px){.process-steps{grid-template-columns:repeat(2,1fr)}}",
      "@media(max-width:600px){.process-steps{grid-template-columns:1fr}}",
      ".process-step{padding:26px 24px}",
      ".process-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}",
      ".step-no{color:var(--green-600);font-weight:800;font-size:22px;letter-spacing:.02em}",
      ".process-title{font-size:17.5px}",
      ".process-step p{color:var(--muted);font-size:15.5px;margin-top:8px}",
      "",
    ].join("\n");
    writeFileSync(f, css + block, "utf8");
    console.log("OK   Layout.css: process styles appended");
  } else console.log("SKIP Layout.css");
}

/* 2) вставка перед FAQ + перевод FAQ на bg-soft */
for (const lang of ["ru", "en", "ky"]) {
  const f = join(ROOT, lang, "index.html");
  let html = readFileSync(f, "utf8");
  if (!html.includes('id="process"')) {
    const anchor = '<section class="section" id="faq">';
    if (html.split(anchor).length - 1 !== 1) { console.error(`FAIL ${lang}: faq section anchor`); fails++; continue; }
    html = html.replace(anchor, workHtml(lang, CONTENT[lang]) + anchor);
    console.log(`OK   ${lang}: process section inserted`);
    html = rep(html, '<section class="section" id="faq">', '<section class="section bg-soft" id="faq">', `${lang} faq -> bg-soft`);
  } else console.log(`SKIP ${lang} (process already there)`);
  writeFileSync(f, html, "utf8");
}

fails && process.exitCode === undefined;
if (fails) { console.error(`!! ERRORS ${fails}`); process.exitCode = 1; } else console.log("\nAPPLY-PROCESS OK");
