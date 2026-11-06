// App-level i18n: locales, routing helpers, and the UI-string translator.
// UI strings are fully local (see FALLBACK) — no CMS dependency.
export const LOCALES = ["ru", "en", "ky"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_LABEL: Record<Locale, string> = { ru: "RU", en: "EN", ky: "KG" };
export const HTML_LANG: Record<Locale, string> = { ru: "ru", en: "en", ky: "ky" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function localeStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

export function lp(lang: string, path = ""): string {
  return `/${lang}${path}`;
}

export function tr<T = Record<string, any>>(
  translations: Array<{ languages_code: string } & Record<string, any>> | undefined | null,
  lang: string,
): T {
  if (!translations?.length) return {} as T;
  return (
    translations.find((t) => t.languages_code === lang) ??
    translations.find((t) => t.languages_code === "ru") ??
    translations[0]
  ) as T;
}

// Локальные переводы интерфейса — полный fallback для всего сайта без CMS.
const FALLBACK: Record<string, { ru: string; en: string; ky: string }> = {
  "nav.home": { ru: "Главная", en: "Home", ky: "Башкы бет" },
  "nav.about": { ru: "О компании", en: "About", ky: "Компания жөнүндө" },
  "nav.services": { ru: "Услуги", en: "Services", ky: "Кызматтар" },
  "nav.cooperation": { ru: "Модели сотрудничества", en: "Engagement models", ky: "Кызматташуу моделдери" },
  "nav.team": { ru: "Команда", en: "Team", ky: "Команда" },
  "nav.documents": { ru: "Документы", en: "Documents", ky: "Документтер" },
  "nav.contacts": { ru: "Контакты", en: "Contacts", ky: "Байланыш" },
  "cta.consult": { ru: "Получить консультацию", en: "Get a consultation", ky: "Консультация алуу" },
  "cta.learn_more": { ru: "Узнать больше", en: "Learn more", ky: "Толугураак" },
  "cta.more": { ru: "Подробнее", en: "Learn more", ky: "Толугураак" },
  "cta.all_specialists": { ru: "Все специалисты", en: "All specialists", ky: "Бардык адистер" },
  "cta.about_more": { ru: "Подробнее о нас", en: "More about us", ky: "Биз жөнүндө толугураак" },
  "cta.contact_us": { ru: "Связаться с нами", en: "Contact us", ky: "Биз менен байланышуу" },
  "cta.send": { ru: "Отправить сообщение", en: "Send message", ky: "Билдирүү жөнөтүү" },
  "cta.download": { ru: "Скачать", en: "Download", ky: "Жүктөп алуу" },
  "form.name": { ru: "Ваше имя", en: "Your name", ky: "Атыңыз" },
  "form.company": { ru: "Компания", en: "Company", ky: "Компания" },
  "form.phone": { ru: "Телефон", en: "Phone", ky: "Телефон" },
  "form.email": { ru: "Email", en: "Email", ky: "Электрондук почта" },
  "form.message": { ru: "Сообщение", en: "Message", ky: "Билдирүү" },
  "form.sending": { ru: "Отправка…", en: "Sending…", ky: "Жөнөтүлүүдө…" },
  "form.success": { ru: "Спасибо! Ваше сообщение отправлено — мы свяжемся с вами.", en: "Thank you! Your message has been sent — we'll get back to you.", ky: "Рахмат! Билдирүүңүз жөнөтүлдү — биз сиз менен байланышабыз." },
  "form.error": { ru: "Не удалось отправить. Попробуйте позже или напишите нам напрямую.", en: "Couldn't send. Please try again later or contact us directly.", ky: "Жөнөтүү ишке ашкан жок. Кийинчерээк аракет кылыңыз же бизге түз жазыңыз." },
  "form.consent": { ru: "Нажимая «Отправить», вы соглашаетесь с", en: "By clicking “Send”, you agree to the", ky: "«Жөнөтүү» басуу менен сиз" },
  "form.consent_link": { ru: "политикой конфиденциальности", en: "privacy policy", ky: "купуялык саясатына" },
  "footer.menu": { ru: "Меню", en: "Menu", ky: "Меню" },
  "footer.services": { ru: "Услуги", en: "Services", ky: "Кызматтар" },
  "footer.documents": { ru: "Документы", en: "Documents", ky: "Документтер" },
  "footer.rights": { ru: "© {year} NORVEX. Все права защищены.", en: "© {year} NORVEX. All rights reserved.", ky: "© {year} NORVEX. Бардык укуктар корголгон." },
  "footer.privacy": { ru: "Политика конфиденциальности", en: "Privacy policy", ky: "Купуялык саясаты" },
  "docs.help_title": { ru: "У вас остались вопросы?", en: "Still have questions?", ky: "Суроолоруңуз барбы?" },
  "docs.help_text": { ru: "Если вы не нашли нужный документ, свяжитесь с нами — мы обязательно поможем.", en: "If you didn't find the document you need, contact us — we'll be glad to help.", ky: "Эгер керектүү документти таппасаңыз, биз менен байланышыңыз — биз сөзсүз жардам беребиз." },
  "contacts.consult_title": { ru: "Нужна консультация?", en: "Need a consultation?", ky: "Консультация керекпи?" },
  "contacts.consult_text": { ru: "Наши специалисты помогут подобрать оптимальное решение для вашего бизнеса.", en: "Our specialists will help you find the optimal solution for your business.", ky: "Биздин адистер бизнесиңиз үчүн оптималдуу чечимди тандоого жардам беришет." },
  "page.services_title": { ru: "Наши услуги", en: "Our services", ky: "Биздин кызматтар" },
  "page.services_lead": { ru: "NORVEX предоставляет услуги консалтинга, аутсорсинга и аутстаффинга в области охраны труда, промышленной безопасности, охраны окружающей среды и управления рисками для организаций различных отраслей экономики.", en: "NORVEX provides consulting, outsourcing and outstaffing services in occupational health and safety, industrial safety, environmental protection and risk management for organizations across a wide range of industries.", ky: "NORVEX экономиканын ар кандай тармактарындагы уюмдар үчүн эмгекти коргоо, өнөр жай коопсуздугу, айлана-чөйрөнү коргоо жана тобокелдиктерди башкаруу тармагында консалтинг, аутсорсинг жана аутстаффинг кызматтарын көрсөтөт." },
  "page.team_title": { ru: "Наша команда", en: "Our team", ky: "Биздин команда" },
  "page.team_lead": { ru: "Наши специалисты – это опытные профессионалы, имеющие международные сертификаты и успешный опыт реализации проектов в различных отраслях.", en: "Our specialists are experienced professionals with international certifications and a track record of successful projects across industries.", ky: "Биздин адистер – эл аралык сертификаттарга жана ар кандай тармактарда долбоорлорду ишке ашыруу тажрыйбасына ээ кесипкөйлөр." },
  "page.cooperation_title": { ru: "Модели сотрудничества", en: "Engagement models", ky: "Кызматташуу моделдери" },
  "page.cooperation_lead": { ru: "NORVEX предлагает различные форматы сотрудничества, позволяющие подобрать оптимальное решение с учетом специфики деятельности, требований проекта и потребностей организации.", en: "NORVEX offers a variety of engagement formats, making it possible to choose the optimal solution based on the nature of your operations, project requirements and organizational needs.", ky: "NORVEX иштин өзгөчөлүгүн, долбоордун талаптарын жана уюмдун муктаждыктарын эске алуу менен оптималдуу чечимди тандоого мүмкүндүк берген кызматташуунун ар түрдүү форматтарын сунуштайт." },
  "team.experience": { ru: "Стаж", en: "Experience", ky: "Тажрыйба" },
  "team.key_instructors": { ru: "Ключевые специалисты", en: "Key specialists", ky: "Негизги адистер" },
  "contacts.phone": { ru: "Телефон", en: "Phone", ky: "Телефон" },
  "contacts.address": { ru: "Адрес", en: "Address", ky: "Дарек" },
  "contacts.hours": { ru: "Время работы", en: "Working hours", ky: "Иш убактысы" },
  "page.contacts_title": { ru: "Свяжитесь с нами", en: "Get in touch", ky: "Биз менен байланышыңыз" },
  "page.contacts_lead": { ru: "Контактная информация для взаимодействия по вопросам оказания услуг, реализации проектов и делового сотрудничества.", en: "Contact details for inquiries about our services, project delivery and business cooperation.", ky: "Кызматтарды көрсөтүү, долбоорлорду ишке ашыруу жана ишкердик кызматташуу маселелери боюнча байланышуу үчүн маалымат." },
  "about.why_title": { ru: "Почему выбирают NORVEX", en: "Why NORVEX", ky: "NORVEXти эмне үчүн тандашат" },
  "seo.home.title": { ru: "NORVEX — Надежный партнер в области HSE", en: "NORVEX — Reliable HSE Partner", ky: "NORVEX — HSE тармагында ишенимдүү өнөктөш" },
  "seo.home.desc": { ru: "NORVEX — охрана труда, промышленная безопасность и экология: от консалтинга до полного аутсорсинга функций HSE.", en: "NORVEX — occupational safety, industrial safety and ecology: from consulting to full HSE outsourcing.", ky: "NORVEX — эмгек коопсуздугу, өнөр жай коопсуздугу жана экология: кеңеш берүүдөн HSE функцияларын толук аутсорсингге чейин." },
  "seo.about.title": { ru: "О компании — NORVEX", en: "About — NORVEX", ky: "Компания жөнүндө — NORVEX" },
  "seo.about.desc": { ru: "NORVEX — команда экспертов в области охраны труда, промышленной безопасности и экологии.", en: "NORVEX — a team of experts in occupational safety, industrial safety and ecology.", ky: "NORVEX — эмгек коопсуздугу, өнөр жай коопсуздугу жана экология тармагындагы эксперттер командасы." },
  "seo.services.title": { ru: "Услуги — NORVEX", en: "Services — NORVEX", ky: "Кызматтар — NORVEX" },
  "seo.services.desc": { ru: "Полный спектр HSE-услуг: консалтинг, аудиты, аутсорсинг и аутстаффинг специалистов.", en: "Full range of HSE services: consulting, audits, outsourcing and staffing.", ky: "HSE кызматтарынын толук спектри: консалтинг, аудит, аутсорсинг жана адистерди аутстаффинг." },
  "seo.team.title": { ru: "Команда — NORVEX", en: "Team — NORVEX", ky: "Команда — NORVEX" },
  "seo.team.desc": { ru: "Наши специалисты — опытные профессионалы с международными сертификатами.", en: "Our specialists are experienced professionals with international certifications.", ky: "Биздин адистер — эл аралык сертификаттарга ээ тажрыйбалуу кесипкөйлөр." },
  "seo.documents.title": { ru: "Документы — NORVEX", en: "Documents — NORVEX", ky: "Документтер — NORVEX" },
  "seo.documents.desc": { ru: "Документы и материалы по охране труда, промышленной безопасности и экологии.", en: "Documents and materials on occupational safety, industrial safety and ecology.", ky: "Эмгек коопсуздугу, өнөр жай коопсуздугу жана экология боюнча документтер жана материалдар." },
  "seo.contacts.title": { ru: "Контакты — NORVEX", en: "Contacts — NORVEX", ky: "Байланыш — NORVEX" },
  "seo.contacts.desc": { ru: "Свяжитесь с NORVEX по вопросам HSE и сотрудничества.", en: "Contact NORVEX regarding HSE and cooperation.", ky: "HSE жана кызматташуу маселелери боюнча NORVEX менен байланышыңыз." },
  "seo.cooperation.title": { ru: "Модели сотрудничества — NORVEX", en: "Engagement models — NORVEX", ky: "Кызматташуу моделдери — NORVEX" },
  "seo.cooperation.desc": { ru: "Выберите модель взаимодействия с NORVEX, подходящую для ваших целей.", en: "Choose the NORVEX engagement model that fits your goals.", ky: "Максаттарыңызга ылайыктуу NORVEX кызматташуу моделин тандаңыз." },
  "seo.privacy.title": { ru: "Политика конфиденциальности — NORVEX", en: "Privacy policy — NORVEX", ky: "Купуялык саясаты — NORVEX" },
  "seo.privacy.desc": { ru: "Политика обработки персональных данных NORVEX.", en: "NORVEX personal data processing policy.", ky: "NORVEXтин персоналдык маалыматтарды иштетүү саясаты." },
};

export function getT(lang: string) {
  const key = (lang: string) => (["ru", "en", "ky"].includes(lang) ? lang : "ru");
  const map = new Map(Object.entries(FALLBACK).map(([k, v]) => [k, (v as Record<string, string>)[key(lang)] || v.ru]));
  return (keyName: string, vars?: Record<string, string | number>): string => {
    let s = map.get(keyName) ?? keyName;
    if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, String(vars[k]));
    return s;
  };
}
