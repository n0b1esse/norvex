// Локальные новости NORVEX — работают без CMS, 3 локали.
// Добавить новую новость: вставить объект в массив NEWS и пересобрать сайт.
export type NewsItem = {
  slug: string;
  date: string;        // ISO дата, например "2026-10-20"
  category: string;    // "Законодательство" | "Компания" | "Экспертиза" | "События"
  title: Record<string, string>;
  excerpt: Record<string, string>;
  content: Record<string, string>; // HTML для страницы новости
  image?: string;      // /assets/news/<файл>
  featured?: boolean;  // показывать ли на главной
};

export const NEWS: NewsItem[] = [
  {
    slug: "trudovoy-kodeks-2026",
    date: "2026-10-20",
    category: "Законодательство",
    title: {
      ru: "Изменения в Трудовом кодексе КР с 1 января 2026: что нужно знать работодателю",
      en: "Changes to the Labour Code of the Kyrgyz Republic from 1 January 2026",
      ky: "2026-жыл 1-январден Эмгек кодексинөндөгү өзгөртүүлөр",
    },
    excerpt: {
      ru: "Поправки об оплате сверхурочных, порядке отпусков и ответственности за нарушение норм охраны труда. Разбираем главное для бизнеса.",
      en: "Amendments on overtime pay, leave procedures and liability for occupational safety violations.",
      ky: "Эмгек кодексинөнгө кirdөгөн өзгөртүүлөрү bar.",
    },
    content: {
      ru: `<p>1 января 2026 в Кыргызской Республике вступили в силу поправки в Трудовой кодекс, которые касаются всех работодателей.</p>
<p><strong>Основные изменения:</strong></p>
<ul>
<li>Оплата сверхурочных работ увеличена до полутора тарифных ставок за час.</li>
<li>Ежегодный оплачиваемый отпуск теперь предоставляется не позднее чем через 6 месяцев после приёма на работу.</li>
<li>Ужесточена ответственность за нарушение норм охраны труда — штрафы для юрлиц достигли 200 000 сомов.</li>
<li>Работодатель обязан проводить специальную оценку условий труда не реже одного раза в 5 лет.</li>
</ul>
<p>Обращайтесь за консультацией — поможем привести документацию вашей компании в соответствие с новыми требованиями.</p>`,
      en: `<p>On 1 January 2026, amendments to the Labour Code of the Kyrgyz Republic came into force.</p>
<p><strong>Key changes:</strong></p>
<ul>
<li>Overtime pay increased to one-and-a-half tariff rates per hour.</li>
<li>Paid annual leave must now be granted no later than 6 months after hiring.</li>
<li>Liability for occupational safety violations has been toughened.</li>
<li>Employers must conduct a special assessment of working conditions at least once every 5 years.</li>
</ul>
<p>Contact us for a consultation — we will help bring your documentation in line with the new requirements.</p>`,
      ky: `<p>2026-жыл 1-январден Эмгек кодексинөндө özgөртүүлөрү kirdі.</p>
<p><strong>Notogo өзгөртүктү:</strong></p>
<ul>
<li>Аш triệu өтөп калуунун өтөмдөсү artirildi.</li>
<li>Kесипке келишүү 6 aydan echpe kelishi kerek.</li>
<li>Эмгекти коргоонуң normdun bузуунун жауапкершиliği artirildi.</li>
<li>Ish berүүchü 5 jyl bir marta max-force special assessment өткөрүп kereñ.</li>
</ul>
<p>Dan istinizden — biz kompaniyangizin dokumentatsiyasını yangılatıp beremiz.</p>`,
    },
    image: "/assets/news/trudovoy-kodeks.jpg",
    featured: true,
  },
  {
    slug: "norvex-iso-45001-audit",
    date: "2026-10-05",
    category: "Компания",
    title: {
      ru: "NORVEX прошёл независимый аудит по ISO 45001",
      en: "NORVEX passed independent ISO 45001 audit",
      ky: "NORVEX ISO 45001 audit өткөн",
    },
    excerpt: {
      ru: "Подтвердили соответствие международному стандарту системы менеджмента охраны труда и безопасности. Сертификат действителен 3 года.",
      en: "Confirmed compliance with the international standard for occupational health and safety management systems.",
      ky: "ISO 45001 standarttuga kebелеşkenligin tasdikledik.",
    },
    content: {
      ru: `<p>Компания NORVEX успешно прошла независимый аудит по международному стандарту ISO 45001 «Системы менеджмента охраны труда и безопасности».</p>
<p>В ходе проверки были оценены система управления рисками, процедуры оценки опасностей, обучение специалистов и отчётность по охране труда.</p>
<p>Сертификат подтверждает, что NORVEX работает в соответствии с международными требованиями и готова брать на себя комплексное сопровождение объектов любой сложности.</p>`,
      en: `<p>NORVEX successfully passed an independent audit to ISO 45001 “Occupational Health and Safety Management Systems”.</p>
<p>The audit evaluated risk management systems, hazard assessment procedures, specialist training and occupational health reporting.</p>
<p>The certificate confirms that NORVEX operates in line with international requirements and is ready to support facilities of any complexity.</p>`,
      ky: `<p>NORVEX ISO 45001 audit өткөн. Sertifikat 3 jyl.</p>`,
    },
    image: "/assets/news/iso-audit.jpg",
    featured: true,
  },
  {
    slug: "siz-new-requirements-2026",
    date: "2026-09-15",
    category: "Законодательство",
    title: {
      ru: "Новые требования к СИЗ на предприятиях с 1 сентября 2026",
      en: "New PPE requirements for enterprises from 1 September 2026",
      ky: "2026-жыл 1-сентябрдө SIZ талаптары",
    },
    excerpt: {
      ru: "Обновлён перечень индивидуальных средств защиты, которые работодатель обязан выдавать сотрудникам бесплатно.",
      en: "Updated list of personal protective equipment employers must provide free of charge.",
      ky: "Ish berүүchü işçilere SIZ istebe berүү kerek.",
    },
    content: {
      ru: `<p>С 1 сентября 2026 в Кыргызстане вступили в силу обновлённые нормы по предоставлению индивидуальных средств защиты (СИЗ) работникам.</p>
<p><strong>Что изменилось:</strong></p>
<ul>
<li>Расширен перечень обязательных СИЗ — добавлены защитные комбинезоны и дыхательные аппараты.</li>
<li>Срок ношения защитной обуви увеличен до 12 месяцев.</li>
<li>Работодатель обязан проводить инструктаж по использованию СИЗ перед допуском к работе.</li>
<li>За неисправные или просроченные СИЗ установлен штраф до 50 000 сомов.</li>
</ul>
<p>Поможем подобрать и закупить СИЗ, соответствующие новым нормам, и оформить всю сопроводительную документацию.</p>`,
      en: `<p>From 1 September 2026, updated norms for PPE provision to workers came into force in Kyrgyzstan.</p>
<p><strong>What changed:</strong></p>
<ul>
<li>Protective overalls and respiratory protection added to mandatory PPE.</li>
<li>Wearing period for protective footwear extended to 12 months.</li>
<li>Employers must conduct PPE usage instruction before admitting to work.</li>
<li>Faulty or expired PPE fines up to 50,000 som.</li>
</ul>
<p>We will help select and purchase PPE compliant with new norms and arrange documentation.</p>`,
      ky: `<p>1-сентябрь 2026 — SIZ norma kirdi.</p>`,
    },
    image: "/assets/news/siz.jpg",
    featured: false,
  },
  {
    slug: "hse-seminar-bishkek",
    date: "2026-09-02",
    category: "События",
    title: {
      ru: "Семинар NORVEX по охране труда в Бишкеке: подводим итоги",
      en: "NORVEX occupational safety seminar in Bishkek: results",
      ky: "NORVEX семинар Bishkekде: natija",
    },
    excerpt: {
      ru: "На семинаре собрались представители более 20 компаний Кыргызстана. Разобрали подготовку к плановым проверкам и новые штрафы.",
      en: "Representatives of more than 20 Kyrgyzstan companies attended. Covered preparation for inspections and new fines.",
      ky: "20 компания awdany.",
    },
    content: {
      ru: `<p>В июле 2026 NORVEX провёл бесплатный семинар «Охрана труда на предприятии: от проверки к результату» для бизнеса Бишкека и региона.</p>
<p>На мероприятии обсуждали подготовку к внеплановой проверке, необходимые документы, новые размеры штрафов и составление карты рисков предприятия.</p>
<p>Запись семинара и презентации спикеров доступны по запросу. Оставьте заявку на консультацию — вышлем материалы.</p>`,
      en: `<p>In July 2026 NORVEX held a free seminar for businesses in Bishkek and the region.</p>
<p>The event covered preparation for unscheduled checks, required documents, new fine amounts and enterprise risk mapping.</p>
<p>Seminar recording and speaker presentations are available on request.</p>`,
      ky: `<p>2026-жыл 7-iyul — NORVEX семинар Bishkekде.</p>`,
    },
    image: "/assets/news/seminar.jpg",
    featured: false,
  },
  {
    slug: "labor-inspection-checklist",
    date: "2026-08-10",
    category: "Экспертиза",
    title: {
      ru: "Как подготовиться к проверке Государственной инспекции труда: чек-лист для работодателя",
      en: "How to prepare for a State Labour Inspectorate inspection: checklist for employers",
      ky: "Ish berүүchü үчүн check-list",
    },
    excerpt: {
      ru: "Пошаговая инструкция: какие документы проверит инспектор, на что обратить внимание и как избежать штрафов.",
      en: "Step-by-step guide: what documents the inspector will check and how to avoid fines.",
      ky: "Inspector wanerdi.",
    },
    content: {
      ru: `<p>Проверка Государственной инспекции труда — стресс для любого работодателя. Но если документы в порядке, прохождение пройдёт без штрафов и замечаний.</p>
<p><strong>В чек-лист вошли:</strong></p>
<ul>
<li>Договоры и соглашения с сотрудниками;</li>
<li>Журналы инструктажей и обучения;</li>
<li>Документы по специальной оценке условий труда;</li>
<li>Акты испытаний СИЗ и измерительных приборов;</li>
<li>Отчёты о состоянии безопасности на рабочих местах.</li>
</ul>
<p>Загрузите полный чек-лист по ссылке или закажите консультацию NORVEX — проверим вашу документацию и поможем устранить недостатки перед проверкой.</p>`,
      en: `<p>A State Labour Inspectorate inspection is stressful for any employer. But if documents are in order, the inspection will pass without fines.</p>
<p><strong>The checklist includes:</strong></p>
<ul>
<li>Contracts and agreements with employees;</li>
<li>Instruction and training logs;</li>
<li>Special assessment of working conditions documents;</li>
<li>PPE and measuring instrument test certificates;</li>
<li>Workplace safety status reports.</li>
</ul>
<p>Download the full checklist or order a NORVEX consultation — we will check your documentation.</p>`,
      ky: `<p>2026-жыл 8-avgust — check-list ish berүүchü үчүн.</p>`,
    },
    image: "/assets/news/checklist.jpg",
    featured: true,
  },
];