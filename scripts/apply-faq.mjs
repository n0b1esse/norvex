import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
let fails = 0;

const CONTENT = {
  ru: {
    title: 'Частые <span class="accent">вопросы</span>',
    lead: "Коротко о том, как устроено сотрудничество. Не нашли свой вопрос — напишите нам, ответим в течение рабочего дня.",
    cta: "Задать свой вопрос",
    qa: [
      ["Чем аутсорсинг HSE отличается от найма специалиста в штат?",
       "Вместо одного сотрудника вы получаете функцию целиком: подготовленного специалиста на объекте, замещение во время отпуска и болезни, отработанные методики, документацию и отчётность. Нет затрат на поиск, обучение и удержание, а объём легко масштабируется по объектам."],
      ["Как быстро можно начать сотрудничество?",
       "Обычно 3–5 рабочих дней: первичный созвон и экспресс-диагностика объекта, подбор специалиста под отрасль, подписание договора и выход на объект."],
      ["Соответствуете ли вы требованиям законодательства Кыргызстана?",
       "Да. Работаем по Трудовому кодексу КР и нормативным требованиям в области охраны труда, промышленной безопасности и охраны окружающей среды, опираясь на признанные международные практики (ISO 45001, ISO 14001)."],
      ["Что входит в аутстаффинг специалистов?",
       "Подбор и предоставление сертифицированных специалистов HSE под задачи и проекты заказчика, с полным оформлением отношений и контролем качества работы со стороны NORVEX."],
      ["Сколько стоят услуги?",
       "Стоимость зависит от объёма присутствия на объекте и перечня задач: аутсорсинг — фиксированный ежемесячный платёж; аудиты и консалтинг — по проекту или за день специалиста. Первичная консультация бесплатна."],
      ["Работаете ли вы с небольшими объектами?",
       "Да. Формат подбирается под размер площадки: от нескольких дней консалтинга в месяц до постоянного присутствия HSE-специалиста на объекте."],
    ],
  },
  en: {
    title: 'Frequently asked <span class="accent">questions</span>',
    lead: "A quick overview of how cooperation works. If you don't see your question, drop us a line — we reply within a working day.",
    cta: "Ask your question",
    qa: [
      ["How is HSE outsourcing different from hiring an in-house specialist?",
       "Instead of one employee you get the whole function: a trained specialist on site, replacement during vacations and sick leave, proven methodologies, documentation and reporting. No hiring, training or retention costs — and the scope scales across sites."],
      ["How quickly can we start working together?",
       "Usually 3–5 working days: an initial call and a quick site assessment, a specialist matched to your industry, contract signing and an on-site start."],
      ["Do you comply with the legislation of the Kyrgyz Republic?",
       "Yes. We work according to the Labour Code of the Kyrgyz Republic and the regulatory requirements in occupational health and safety, industrial safety and environmental protection, applying recognised international practices (ISO 45001, ISO 14001)."],
      ["What does outstaffing include?",
       "Selection and provision of certified HSE specialists for the client's projects, with complete employment paperwork and quality control by NORVEX."],
      ["How much do your services cost?",
       "Pricing depends on on-site presence and scope: a fixed monthly fee for outsourcing; audits and consulting are billed per project or per specialist-day. The first consultation is free."],
      ["Do you work with smaller sites?",
       "Yes. The format is tailored to the size of the facility — from a few consulting days a month to a permanent HSE specialist on site."],
    ],
  },
  ky: {
    title: 'Көп берилүүчү <span class="accent">суроолор</span>',
    lead: "Кызматташтык кантип уюштурулганы — кыскача. Сиздин суроо тизмеде жок болсо, кабарлашыңыз: бир жумуш күнүнүн ичинде жооп берейбиз.",
    cta: "Суроо берүү",
    qa: [
      ["HSE-аутсорсинг штатка адис жалдоодон кантип айырмаланат?",
       "Бир кызматкердин ордуна сиз функцияны толук аласыз: объекттеги даярдалган адис, демалыс жана оору убакыттарында алмаштыруу, текшерилген методикалар, документация жана отчёттоо. Издөө, окутуу жана сактоо чыгашалары жок, көлөмдү объекттер боюнча оңой кеңейтүүгө болот."],
      ["Кызматташтыкты канчалык тез баштаса болот?",
       "Көбүнчө 3–5 жумуш күнү: баштапкы чалуу жана объектиге экспресс-баа берүү, тармакка ылайык адисти тандоо, келишимге кол коюу жана объектке чыгуу."],
      ["Кыргызстандын мыйзамдарына туура келесизби?",
       "Ооба. Кыргыз Республикасынын Эмгек кодексин жана эмгекти коргоо, өнөр жай коопсуздугу, экологияны коргоо боюнча нормативдик талаптарга ылайык иштейбиз; танылган эл аралык тажрыйбаны (ISO 45001, ISO 14001) колдонобуз."],
      ["Аутстаффингге эмне кирет?",
       "Заказчиктин милдеттери жана долбоорлору үчүн сертификатталган HSE адистерин тандоо жана берүү, иш мамилелерин толук расмийлештирүү жана сапаттын NORVEX көзөмөлү."],
      ["Кызматтардын баасы кандай аныкталат?",
       "Баа объекттеги чыгуунун көлөмүнө жана милдеттердин тизмесине көз каранды: аутсорсинг — айына туруктуу төлөм; аудиттер жана консалтинг — долбоор боюнча же адис-күн боюнча. Баштапкы консалтинг акысыз."],
      ["Кичинекей объектилер менен иштейсизби?",
       "Ооба. Формат аянтчанын көлөмүнө жараша тандоо: айына бир нече консалтинг күнүнөн — объектиде туруктуу HSE адисине чейин."],
    ],
  },
};

const chev = '<span class="chev" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>';

function faqHtml(lang, meta) {
  const items = meta.qa.map(([q, a], i) =>
    `<details class="card faq-item reveal" style="--i:${i + 1}"${i === 0 ? " open" : ""}> <summary>${q}${chev}</summary> <div class="faq-body"><p>${a}</p></div> </details>`
  ).join("");
  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.qa.map(([q, a]) => ({
      "@type": "Question", name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  });
  return `
  <section class="section" id="faq">
   <div class="container">
    <div class="section-head reveal" style="--i:0">
     <h2 class="section-title">${meta.title}</h2>
     <div class="bar"></div>
     <p class="section-lead">${meta.lead}</p>
    </div>
    <div class="faq-list">
     ${items}
    </div>
    <div class="faq-cta reveal" style="--i:0">
     <a class="btn btn-primary" href="/${lang}/contacts">${meta.cta}</a>
    </div>
   </div>
   <script type="application/ld+json">${jsonld}<\/script>
  </section>
  `;
}

/* 1) CSS в Layout.css (один раз) */
{
  const f = join(ROOT, "_astro", "Layout.BXn8tf-v.css");
  let css = readFileSync(f, "utf8");
  if (!css.includes("staging: FAQ")) {
    const block = [
      "", "/* ==== staging: FAQ (home) ==== */",
      ".faq-list{display:grid;gap:14px;max-width:780px;margin-inline:auto}",
      ".faq-item{padding:0;overflow:hidden}",
      ".faq-item>summary{display:flex;align-items:center;gap:14px;padding:18px 22px;cursor:pointer;font-weight:700;color:var(--navy);font-size:16.5px;list-style:none}",
      ".faq-item>summary::-webkit-details-marker{display:none}",
      ".faq-item .chev{flex:none;margin-left:auto;width:26px;height:26px;border-radius:50%;background:var(--bg);display:inline-flex;align-items:center;justify-content:center;color:var(--green-600);transition:transform .18s ease,background .18s ease}",
      ".faq-item[open] .chev{transform:rotate(90deg);background:#e5f4ea}",
      ".faq-item .faq-body{padding:2px 22px 20px;color:var(--muted)}",
      ".faq-item .faq-body p{max-width:680px}",
      ".faq-cta{display:flex;justify-content:center;flex-wrap:wrap;gap:14px;margin-top:30px}",
      "@media(max-width:640px){.faq-item>summary{font-size:15.5px;padding:16px 18px}.faq-item .faq-body{padding:2px 18px 18px}}",
    ].join("\n");
    css = css + block;
    writeFileSync(f, css, "utf8");
    console.log("OK   Layout.css: FAQ styles appended");
  } else console.log("SKIP Layout.css (faq styles already there)");
}

/* 2) Вставка секции перед </main> в 3 главных файлах */
for (const lang of ["ru", "en", "ky"]) {
  const f = join(ROOT, lang, "index.html");
  let html = readFileSync(f, "utf8");
  if (html.includes('id="faq"')) { console.log(`SKIP ${lang} (faq already inserted)`); continue; }
  const anchor = "</main>";
  const c = html.split(anchor).length - 1;
  if (c !== 1) { console.error(`FAIL ${lang}: </main> count=${c}`); fails++; continue; }
  html = html.replace(anchor, faqHtml(lang, CONTENT[lang]) + anchor);
  writeFileSync(f, html, "utf8");
  console.log(`OK   ${lang}/index.html: FAQ inserted (items=${CONTENT[lang].qa.length}, jsonld=yes)`);
}

if (fails) { console.error("!! ERRORS " + fails); process.exitCode = 1; } else console.log("\nAPPLY-FAQ OK");
