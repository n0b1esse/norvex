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
  "nav.news": { ru: "Новости", en: "News", ky: "Жаңылыктар" },
  "cta.consult": { ru: "Получить консультацию", en: "Get a consultation", ky: "Консультация алуу" },
  "cta.learn_more": { ru: "Узнать больше", en: "Learn more", ky: "Толугураак" },
  "cta.more": { ru: "Подробнее", en: "Learn more", ky: "Толугураак" },
  "cta.back_news": { ru: "Назад к новостям", en: "Back to news", ky: "Жаңылыктарга кайтуу" },
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
  "page.services_more": { ru: "Аудиты, документация и подрядчики", en: "Audits, documentation and contractors", ky: "Аудиттер, документация жана подрядчики" },
  "page.services_lead": { ru: "NORVEX предоставляет услуги консалтинга, аутсорсинга и аутстаффинга в области охраны труда, промышленной безопасности, охраны окружающей среды и управления рисками для организаций различных отраслей экономики.", en: "NORVEX provides consulting, outsourcing and outstaffing services in occupational health and safety, industrial safety, environmental protection and risk management for organizations across a wide range of industries.", ky: "NORVEX экономиканын ар кандай тармактарындагы уюмдар үчүн эмгекти коргоо, өнөр жай коопсуздугу, айлана-чөйрөнү коргоо жана тобокелдиктерди башкаруу тармагында консалтинг, аутсорсинг жана аутстаффинг кызматтарын көрсөтөт." },
  "page.team_title": { ru: "Наша команда", en: "Our team", ky: "Биздин команда" },
  "page.team_lead": { ru: "Наши специалисты - это сертифицированные эксперты в области ОТ, ПБ и ООС с международным опытом и глубоким знанием законодательства Кыргызской Республики. Мы успешно реализуем проекты любой сложности в промышленности, энергетике, на производстве и в строительстве.", en: "Our specialists are certified experts in occupational health and safety, industrial safety and environmental protection with international experience and in-depth knowledge of the legislation of the Kyrgyz Republic. We successfully deliver projects of any complexity in industry, energy, manufacturing and construction.", ky: "Биздин адистер - ОТ, ПБ жана ООС боюнча эл аралык тажрыйбага жана Кыргыз Республикасынын мыйзамдарын терең билген сертификацияланган эксперттер. Биз өнөр жайда, энергетикада, өндүрүштө жана курулушта ар кандай татаалдыктагы долбоорлорду ийгиликтүү ишке ашырабыз." },
  "page.cooperation_title": { ru: "Модели сотрудничества", en: "Engagement models", ky: "Кызматташуу моделдери" },
  "page.cooperation_lead": { ru: "NORVEX предлагает различные форматы сотрудничества, позволяющие подобрать оптимальное решение с учетом специфики деятельности, требований проекта и потребностей организации.", en: "NORVEX offers a variety of engagement formats, making it possible to choose the optimal solution based on the nature of your operations, project requirements and organizational needs.", ky: "NORVEX иштин өзгөчөлүгүн, долбоордун талаптарын жана уюмдун муктаждыктарын эске алуу менен оптималдуу чечимди тандоого мүмкүндүк берген кызматташуунун ар түрдүү форматтарын сунуштайт." },
  "team.experience": { ru: "Стаж", en: "Experience", ky: "Тажрыйба" },
  "team.key_instructors": { ru: "Ключевые эксперты", en: "Key experts", ky: "Негизги эксперттер" },
  "contacts.phone": { ru: "Телефон", en: "Phone", ky: "Телефон" },
  "contacts.address": { ru: "Адрес", en: "Address", ky: "Дарек" },
  "contacts.hours": { ru: "Время работы", en: "Working hours", ky: "Иш убактысы" },
  "page.contacts_title": { ru: "Свяжитесь с нами", en: "Get in touch", ky: "Биз менен байланышыңыз" },
  "page.contacts_lead": { ru: "Контактная информация для взаимодействия по вопросам оказания услуг, реализации проектов и делового сотрудничества.", en: "Contact details for inquiries about our services, project delivery and business cooperation.", ky: "Кызматтарды көрсөтүү, долбоорлорду ишке ашыруу жана ишкердик кызматташуу маселелери боюнча байланышуу үчүн маалымат." },
  "page.news_title": { ru: "Новости и события ОсОО «НОРВЕКС»", en: "News and Events of NORVEX LLC", ky: "ОсОО «НОРВЕКС» жаңылыктары жана окуялары" },
  "page.news_lead": { ru: "Актуальные обзоры изменений в законодательстве Кыргызской Республики в сфере охраны труда, промышленной безопасности и охраны окружающей среды, а также официальная хроника деятельности компании.", en: "Current reviews of changes in the legislation of the Kyrgyz Republic in occupational health and safety, industrial safety and environmental protection, as well as the official chronicle of the company's activities.", ky: "Кыргыз Республикасынын эмгекти коргоо, өнөр жай коопсуздугу жана айлана-чөйрөнү коргоо жаатындагы мыйзамдарынын өзгөртүүлөрүнө актуалдуу серептик материалдар, ошондой эле компаниянын ишмердүүлүгүнүн расмий хроникасы." },
  "news_section_title": { ru: "Последние новости", en: "Latest news", ky: "Соңкы жаңылыктары" },
  "news_section_lead": { ru: "Что нового в NORVEX и законодательстве", en: "What's new at NORVEX and legislation", ky: "NORVEX менен валдаARDAN жаңылыкътар" },
  "news_section_cta": { ru: "Все новости", en: "All news", ky: "Бардык жаңылыкътар" },
  "about.why_title": { ru: "Почему выбирают NORVEX", en: "Why NORVEX", ky: "NORVEXти эмне үчүн тандашат" },
  "seo.home.title": { ru: "NORVEX — охрана труда, промбезопасность и экология", en: "NORVEX — Occupational Safety, Industrial Safety & Ecology", ky: "NORVEX — эмгекти коргоо, өнөр жай коопсуздугу жана экология" },
  "seo.home.desc": { ru: "NORVEX — надёжный партнёр в области HSE в Кыргызстане: охрана труда, промышленная безопасность, экология и аутсорсинг функций HSE для вашего бизнеса.", en: "NORVEX is a trusted HSE partner in Kyrgyzstan: occupational health & safety, industrial safety, ecology and full HSE outsourcing for your business.", ky: "NORVEX — Кыргызстандагы ишеничтүү HSE өнөктөшү: эмгекти коргоо, өнөр жай коопсуздугу, экология жана HSE функцияларын аутсорсинг." },
  "seo.about.title": { ru: "О компании NORVEX — эксперты в области HSE", en: "About NORVEX — HSE Experts", ky: "NORVEX компаниясы жөнүндө — HSE боюнча эксперттер" },
  "seo.about.desc": { ru: "Узнайте о NORVEX: команда сертифицированных специалистов по охране труда, промышленной безопасности и экологии с опытом проектов в разных отраслях.", en: "Learn about NORVEX: a team of certified occupational, industrial safety and ecology specialists with project experience across many industries.", ky: "NORVEX жөнүндө: эмгекти коргоо, өнөр жай коопсуздугу жана экология боюнча сертификацияланган, ар кандай тармактарда тажрыйбасы бар адистердин командасы." },
  "seo.services.title": { ru: "Услуги в области HSE — охрана труда и экология | NORVEX", en: "HSE Services — Occupational Safety & Ecology | NORVEX", ky: "HSE кызматтары — эмгекти коргоо жана экология | NORVEX" },
  "seo.services.desc": { ru: "Полный спектр услуг HSE: аудит, обучение, документация, охрана труда, промышленная безопасность и экологическое сопровождение бизнеса.", en: "A full range of HSE services: audits, training, documentation, occupational and industrial safety and environmental support for your business.", ky: "HSE кызматтарынын толук спектри: аудит, окутуу, документация, эмгекти коргоо, өнөр жай коопсуздугу жана экологиялык коштоо." },
  "seo.team.title": { ru: "Команда NORVEX — специалисты по охране труда и экологии", en: "NORVEX Team — Occupational Safety & Ecology Specialists", ky: "NORVEX командасы — эмгекти коргоо жана экология адистери" },
  "seo.team.desc": { ru: "Команда NORVEX — опытные специалисты с международными сертификатами в области охраны труда, промышленной безопасности и экологии.", en: "The NORVEX team: experienced specialists with international certifications in occupational health, industrial safety and ecology.", ky: "NORVEX командасы — эмгекти коргоо, өнөр жай коопсуздугу жана экология боюнча эл аралык сертификаттарга ээ тажрыйбалуу адистер." },
  "seo.documents.title": { ru: "Документы и лицензии NORVEX | HSE", en: "NORVEX Documents & Licenses | HSE", ky: "NORVEX документтери жана лицензиялары | HSE" },
  "seo.documents.desc": { ru: "Официальные документы, лицензии и сертификаты NORVEX в области охраны труда, промышленной безопасности и экологии — доступны для скачивания.", en: "Official NORVEX documents, licenses and certificates in occupational, industrial safety and ecology — available to download.", ky: "NORVEX'тин эмгекти коргоо, өнөр жай коопсуздугу жана экология боюнча расмий документтери, лицензиялары жана сертификаттары." },
  "seo.contacts.title": { ru: "Контакты NORVEX — свяжитесь с нами | Бишкек", en: "Contact NORVEX — Get in Touch | Bishkek", ky: "NORVEX байланыштары — биз менен байланышыңыз | Бишкек" },
  "seo.contacts.desc": { ru: "Свяжитесь с NORVEX в Бишкеке: телефон, email, мессенджеры и форма обратной связи. Ответим на вопросы по охране труда и экологии.", en: "Contact NORVEX in Bishkek: phone, email, messengers and a contact form. We'll answer your occupational safety and ecology questions.", ky: "NORVEX менен Бишкекте байланышыңыз: телефон, email, мессенджерлер жана байланыш формасы. Эмгекти коргоо боюнча суроолорго жооп беребиз." },
  "seo.cooperation.title": { ru: "Модели сотрудничества с NORVEX | HSE-аутсорсинг", en: "Engagement Models with NORVEX | HSE Outsourcing", ky: "NORVEX менен кызматташуу моделдери | HSE аутсорсинг" },
  "seo.cooperation.desc": { ru: "Выберите модель сотрудничества с NORVEX: разовый проект, абонентское обслуживание или полный аутсорсинг функций HSE.", en: "Choose how to work with NORVEX: one-off projects, ongoing retainer support, or full outsourcing of your HSE functions.", ky: "NORVEX менен кызматташуу моделин тандаңыз: бир жолку долбоор, абоненттик тейлөө же HSE функцияларын толук аутсорсинг." },
  "seo.privacy.title": { ru: "Политика конфиденциальности | NORVEX", en: "Privacy Policy | NORVEX", ky: "Купуялык саясаты | NORVEX" },
  "seo.privacy.desc": { ru: "Политика конфиденциальности NORVEX: как мы собираем, используем и защищаем персональные данные в соответствии с законодательством Кыргызской Республики.", en: "NORVEX Privacy Policy: how we collect, use and protect personal data in accordance with the legislation of the Kyrgyz Republic.", ky: "NORVEX купуялык саясаты: жеке маалыматтарды Кыргыз Республикасынын мыйзамдарына ылайык кантип чогултабыз, колдонобуз жана коргойбуз." },
  "seo.news.title": { ru: "Новости NORVEX — охрана труда, промбезопасность, экология", en: "NORVEX News — Occupational Safety, Industrial Safety & Ecology", ky: "NORVEX жаңылыктары — эмгекти коргоо жана экология" },
  "seo.news.desc": { ru: "Актуальные новости NORVEX: изменения в законодательстве КР, экспертные материалы по охране труда и экологии, анонсы семинаров и мероприятий.", en: "NORVEX news: Kyrgyzstan legislation updates, occupational health and environmental expert materials, seminar and event announcements.", ky: "NORVEX жаңылыктары: КР мыйзаларында өзгөртүүлөр, эмгекти коргоо жана экология боюнча тажрыйба материалдары, семинар жана оюндардын анонстары." },
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
