#!/usr/bin/env python3
"""
Content update (June 2026) — applies the client's copy edits across the CMS in all
three locales (ru/en/ky). Idempotent: re-running just re-sets the same values.

Covers:
  - ui_strings:   services/cooperation/contacts leads + services title + consult text
  - services:     6 cards (title + description)
  - cooperation_models: 3 models (title + description + points)
  - about_page:   intro + "Почему выбирают NORVEX" advantages (8)
  - site_settings: footer tagline, address, working hours (translations) +
                   new fields email2 / instagram / social_instagram / linkedin

  DIRECTUS_URL=... DIRECTUS_EMAIL=<admin> DIRECTUS_PASSWORD=... \
  python3 directus/update_content_jun2026.py
"""
import json, os, urllib.request, urllib.error, urllib.parse

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
TOKEN = None


def api(method, path, body=None, ignore=()):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
    )
    req.add_header("Content-Type", "application/json")
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode()
            return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        d = e.read().decode()
        for c in ignore:
            if c in d:
                return None
        print(f"  ! {method} {path} -> {e.code}: {d[:300]}")
        return None


# ── UI strings (key -> {ru,en,ky}) ───────────────────────────────────────────
UI = {
    "page.services_title": {
        "ru": "Наши услуги",
        "en": "Our services",
        "ky": "Биздин кызматтар",
    },
    "page.services_lead": {
        "ru": "NORVEX предоставляет услуги консалтинга, аутсорсинга и аутстаффинга в области охраны труда, промышленной безопасности, охраны окружающей среды и управления рисками для организаций различных отраслей экономики.",
        "en": "NORVEX provides consulting, outsourcing and outstaffing services in occupational health and safety, industrial safety, environmental protection and risk management for organizations across a wide range of industries.",
        "ky": "NORVEX экономиканын ар кандай тармактарындагы уюмдар үчүн эмгекти коргоо, өнөр жай коопсуздугу, айлана-чөйрөнү коргоо жана тобокелдиктерди башкаруу тармагында консалтинг, аутсорсинг жана аутстаффинг кызматтарын көрсөтөт.",
    },
    "page.cooperation_lead": {
        "ru": "NORVEX предлагает различные форматы сотрудничества, позволяющие подобрать оптимальное решение с учетом специфики деятельности, требований проекта и потребностей организации.",
        "en": "NORVEX offers a variety of engagement formats, making it possible to choose the optimal solution based on the nature of your operations, project requirements and organizational needs.",
        "ky": "NORVEX иштин өзгөчөлүгүн, долбоордун талаптарын жана уюмдун муктаждыктарын эске алуу менен оптималдуу чечимди тандоого мүмкүндүк берген кызматташуунун ар түрдүү форматтарын сунуштайт.",
    },
    "page.contacts_lead": {
        "ru": "Контактная информация для взаимодействия по вопросам оказания услуг, реализации проектов и делового сотрудничества.",
        "en": "Contact details for inquiries about our services, project delivery and business cooperation.",
        "ky": "Кызматтарды көрсөтүү, долбоорлорду ишке ашыруу жана ишкердик кызматташуу маселелери боюнча байланышуу үчүн маалымат.",
    },
    "contacts.consult_text": {
        "ru": "Для получения дополнительной информации о наших услугах или обсуждения потенциального сотрудничества заполните форму обратной связи. Специалисты NORVEX свяжутся с вами в кратчайшие сроки.",
        "en": "To learn more about our services or to discuss potential cooperation, fill out the contact form. NORVEX specialists will get back to you as soon as possible.",
        "ky": "Кызматтарыбыз жөнүндө кошумча маалымат алуу же мүмкүн болуучу кызматташууну талкуулоо үчүн байланыш формасын толтуруңуз. NORVEX адистери сиз менен мүмкүн болушунча тез байланышышат.",
    },
}

# ── Services (slug -> {locale: (title, description)}) ─────────────────────────
SERVICES = {
    "consulting": {
        "ru": ("Консалтинг в области ОТ, ПБ и ООС",
               "Экспертная поддержка в вопросах обеспечения безопасности, управления рисками и соответствия требованиям законодательства."),
        "en": ("Consulting in occupational, industrial and environmental safety",
               "Expert support in ensuring safety, managing risks and meeting legal requirements."),
        "ky": ("Эмгекти коргоо, өнөр жай жана айлана-чөйрө коопсуздугу боюнча консалтинг",
               "Коопсуздукту камсыздоо, тобокелдиктерди башкаруу жана мыйзам талаптарына шайкештик маселелеринде эксперттик колдоо."),
    },
    "outsourcing": {
        "ru": ("Аутсорсинг функций ОТ, ПБ и ООС",
               "Комплексное выполнение функций ОТ, ПБ и ООС с обеспечением контроля, отчетности и постоянного сопровождения деятельности организации."),
        "en": ("Outsourcing of occupational, industrial and environmental safety functions",
               "End-to-end performance of OHS, industrial and environmental safety functions with control, reporting and ongoing support of the organization's operations."),
        "ky": ("Эмгекти коргоо, өнөр жай жана айлана-чөйрө коопсуздугу функцияларын аутсорсинг",
               "Эмгекти коргоо, өнөр жай жана айлана-чөйрө коопсуздугу функцияларын контролдоо, отчёттуулук жана уюмдун ишин туруктуу коштоо менен комплекстүү аткаруу."),
    },
    "outstaffing": {
        "ru": ("Аутстаффинг специалистов",
               "Предоставление профильных специалистов для временного или долгосрочного усиления команды заказчика в соответствии с требованиями проекта."),
        "en": ("Specialist outstaffing",
               "Provision of qualified specialists for short- or long-term reinforcement of the client's team in line with project requirements."),
        "ky": ("Адистерди аутстаффинг",
               "Долбоордун талаптарына ылайык кардардын командасын убактылуу же узак мөөнөттүү күчөтүү үчүн тармактык адистерди берүү."),
    },
    "audits": {
        "ru": ("Аудиты и инспекции",
               "Независимая оценка соответствия требованиям законодательства, корпоративных стандартов и лучших отраслевых практик."),
        "en": ("Audits and inspections",
               "Independent assessment of compliance with legal requirements, corporate standards and industry best practices."),
        "ky": ("Аудиттер жана текшерүүлөр",
               "Мыйзам талаптарына, корпоративдик стандарттарга жана тармактын мыкты тажрыйбаларына шайкештигин көз карандысыз баалоо."),
    },
    "docs": {
        "ru": ("Разработка документации",
               "Разработка и актуализация документации в области ОТ, ПБ и ООС в соответствии с требованиями законодательства и международных стандартов."),
        "en": ("Documentation development",
               "Development and updating of OHS, industrial and environmental safety documentation in compliance with legal requirements and international standards."),
        "ky": ("Документтерди иштеп чыгуу",
               "Мыйзам талаптарына жана эл аралык стандарттарга ылайык эмгекти коргоо, өнөр жай жана айлана-чөйрө коопсуздугу боюнча документтерди иштеп чыгуу жана жаңылоо."),
    },
    "contractors": {
        "ru": ("Управление подрядчиками",
               "Оценка, сопровождение и контроль подрядных организаций для обеспечения безопасности, качества и соблюдения установленных требований."),
        "en": ("Contractor management",
               "Assessment, support and monitoring of contractor organizations to ensure safety, quality and compliance with established requirements."),
        "ky": ("Подрядчыларды башкаруу",
               "Коопсуздукту, сапатты жана белгиленген талаптарды сактоону камсыздоо үчүн подряд уюмдарын баалоо, коштоо жана контролдоо."),
    },
}

# ── Cooperation models (slug -> {locale: (title, description, [points])}) ─────
MODELS = {
    "consulting": {
        "ru": ("Консалтинг",
               "Предоставляем профессиональную экспертную поддержку в области охраны труда, промышленной безопасности, охраны окружающей среды и управления рисками для повышения эффективности деятельности организаций и обеспечения соответствия установленным требованиям.",
               ["Оценка текущего состояния процессов и систем управления",
                "Идентификация опасностей и оценка рисков",
                "Разработка рекомендаций и планов улучшения",
                "Подготовка к аудитам, инспекциям и проверкам",
                "Разработка документации и методологическая поддержка",
                "Обучение и развитие компетенций персонала"]),
        "en": ("Consulting",
               "We provide professional expert support in occupational health and safety, industrial safety, environmental protection and risk management to improve organizational performance and ensure compliance with established requirements.",
               ["Assessment of the current state of processes and management systems",
                "Hazard identification and risk assessment",
                "Development of recommendations and improvement plans",
                "Preparation for audits, inspections and reviews",
                "Documentation development and methodological support",
                "Training and development of staff competencies"]),
        "ky": ("Консалтинг",
               "Уюмдардын ишинин натыйжалуулугун жогорулатуу жана белгиленген талаптарга шайкештигин камсыздоо үчүн эмгекти коргоо, өнөр жай коопсуздугу, айлана-чөйрөнү коргоо жана тобокелдиктерди башкаруу тармагында кесипкөй эксперттик колдоо көрсөтөбүз.",
               ["Процесстердин жана башкаруу системаларынын учурдагы абалын баалоо",
                "Коркунучтарды аныктоо жана тобокелдиктерди баалоо",
                "Сунуштарды жана жакшыртуу пландарын иштеп чыгуу",
                "Аудиттерге, инспекцияларга жана текшерүүлөргө даярдоо",
                "Документтерди иштеп чыгуу жана методологиялык колдоо",
                "Персоналдын компетенцияларын окутуу жана өнүктүрүү"]),
    },
    "outsourcing": {
        "ru": ("Аутсорсинг",
               "Профессиональное выполнение функций охраны труда, промышленной безопасности и охраны окружающей среды в соответствии с требованиями законодательства и лучшими отраслевыми практиками на предприятии.",
               ["Полное сопровождение функций ОТ, ПБ и ООС",
                "Ведение и актуализация документации",
                "Организация производственного контроля",
                "Мониторинг соблюдения требований",
                "Подготовка отчетности и аналитики",
                "Сопровождение проверок, инспекций и аудитов"]),
        "en": ("Outsourcing",
               "Professional performance of occupational health and safety, industrial safety and environmental protection functions at the enterprise, in compliance with legal requirements and industry best practices.",
               ["Full support of OHS, industrial and environmental safety functions",
                "Maintenance and updating of documentation",
                "Organization of production control",
                "Monitoring of compliance with requirements",
                "Preparation of reporting and analytics",
                "Support during reviews, inspections and audits"]),
        "ky": ("Аутсорсинг",
               "Ишканада мыйзам талаптарына жана тармактын мыкты тажрыйбаларына ылайык эмгекти коргоо, өнөр жай коопсуздугу жана айлана-чөйрөнү коргоо функцияларын кесипкөй аткаруу.",
               ["Эмгекти коргоо, өнөр жай жана айлана-чөйрө коопсуздугу функцияларын толук коштоо",
                "Документтерди жүргүзүү жана жаңылоо",
                "Өндүрүштүк контролду уюштуруу",
                "Талаптардын сакталышын мониторинг кылуу",
                "Отчёттуулукту жана аналитиканы даярдоо",
                "Текшерүүлөрдү, инспекцияларды жана аудиттерди коштоо"]),
    },
    "outstaffing": {
        "ru": ("Аутстаффинг",
               "Предоставляем квалифицированных специалистов для усиления команды Заказчика и реализации проектов различного масштаба и сложности.",
               ["Подбор профильных специалистов",
                "Оперативное закрытие кадровой потребности",
                "Краткосрочное и долгосрочное привлечение персонала",
                "Поддержка крупных проектов и подрядных работ",
                "Замещение временно отсутствующих специалистов",
                "Административное сопровождение персонала"]),
        "en": ("Outstaffing",
               "We provide qualified specialists to reinforce the client's team and deliver projects of various scale and complexity.",
               ["Selection of specialized professionals",
                "Prompt closing of staffing needs",
                "Short- and long-term staff engagement",
                "Support for large projects and contract work",
                "Replacement of temporarily absent specialists",
                "Administrative support of personnel"]),
        "ky": ("Аутстаффинг",
               "Кардардын командасын күчөтүү жана ар кандай масштабдагы жана татаалдыктагы долбоорлорду ишке ашыруу үчүн квалификациялуу адистерди беребиз.",
               ["Тармактык адистерди тандоо",
                "Кадрдык муктаждыкты тез жабуу",
                "Кыска жана узак мөөнөттүү персоналды тартуу",
                "Ири долбоорлорду жана подряддык иштерди колдоо",
                "Убактылуу жок адистерди алмаштыруу",
                "Персоналды административдик коштоо"]),
    },
}

# ── About page: intro + advantages (8). Icons kept within the curated dropdown ─
ABOUT_INTRO = {
    "ru": "NORVEX оказывает профессиональные услуги в области охраны труда, промышленной безопасности, охраны окружающей среды и управления рисками. Предоставляем организациям экспертную поддержку и практические решения, направленные на обеспечение безопасности, соблюдение требований законодательства и повышение эффективности деятельности.",
    "en": "NORVEX provides professional services in occupational health and safety, industrial safety, environmental protection and risk management. We offer organizations expert support and practical solutions aimed at ensuring safety, meeting legal requirements and improving operational efficiency.",
    "ky": "NORVEX эмгекти коргоо, өнөр жай коопсуздугу, айлана-чөйрөнү коргоо жана тобокелдиктерди башкаруу тармагында кесипкөй кызматтарды көрсөтөт. Уюмдарга коопсуздукту камсыздоого, мыйзам талаптарын сактоого жана иштин натыйжалуулугун жогорулатууга багытталган эксперттик колдоо жана практикалык чечимдерди беребиз.",
}
ADV_ICONS = ["award", "globe", "target", "scale", "gavel", "lock", "clipboard-check", "user-check"]
ADV_LABELS = {
    "ru": ["Профессиональная экспертиза", "Лучшие международные практики", "Риск-ориентированный подход",
           "Независимость и объективность", "Соответствие требованиям законодательства", "Конфиденциальность информации",
           "Комплексное сопровождение проектов", "Индивидуальный подход к каждому вопросу"],
    "en": ["Professional expertise", "Best international practices", "Risk-based approach",
           "Independence and objectivity", "Compliance with legal requirements", "Confidentiality of information",
           "Comprehensive project support", "Individual approach to every matter"],
    "ky": ["Кесипкөй экспертиза", "Эл аралык мыкты тажрыйбалар", "Тобокелдикке негизделген ыкма",
           "Көз карандысыздык жана объективдүүлүк", "Мыйзам талаптарына шайкештик", "Маалыматтын купуялыгы",
           "Долбоорлорду комплекстүү коштоо", "Ар бир маселеге жеке мамиле"],
}

# ── Site settings ─────────────────────────────────────────────────────────────
TAGLINE = {
    "ru": "Ответственность. Безопасность. Результат.",
    "en": "Responsibility. Safety. Results.",
    "ky": "Жоопкерчилик. Коопсуздук. Натыйжа.",
}
ADDRESS = {
    "ru": "Кыргызская Республика, город Бишкек, улица Байтик Баатыра, 70",
    "en": "Kyrgyz Republic, Bishkek, Baytik Baatyr Street 70",
    "ky": "Кыргыз Республикасы, Бишкек шаары, Байтик Баатыр көчөсү, 70",
}
HOURS = {
    "ru": "Понедельник – Суббота, 09:00 – 20:00",
    "en": "Monday – Saturday, 09:00 – 20:00",
    "ky": "Дүйшөмбү – Ишемби, 09:00 – 20:00",
}
# New base fields (string). social_linkedin already exists; left for the client to fill.
NEW_FIELDS = [
    ("email2", "Доп. e-mail (contact@…)"),
    ("instagram", "Instagram (например @norvex.hse)"),
    ("social_instagram", "Instagram — полная ссылка (https://…)"),
    ("linkedin", "LinkedIn — отображаемое название"),
]
SETTINGS_BASE = {
    "email2": "contact@norvex-hse.com",
    "instagram": "@norvex.hse",
    "social_instagram": "https://www.instagram.com/norvex.hse",
    "linkedin": "NORVEX HSE",
}


def patch_translations(parent, slug_or_id_map, mapping, build):
    """Generic: for each (key, locales) in mapping, PATCH the junction rows."""
    for key, by_locale in mapping.items():
        ids = slug_or_id_map[key]  # {locale: junction_id}
        for loc, payload in by_locale.items():
            tid = ids.get(loc)
            if not tid:
                print(f"  ? {parent}:{key}:{loc} no junction id"); continue
            api("PATCH", f"/items/{parent}/{tid}", build(payload))


def main():
    global TOKEN
    auth = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
    if not auth or "data" not in auth:
        raise SystemExit("Login failed — check DIRECTUS_EMAIL / DIRECTUS_PASSWORD (needs admin access).")
    TOKEN = auth["data"]["access_token"]

    # 1) UI strings — discover PK (id or key) and patch
    rows = api("GET", "/items/ui_strings?fields=*&limit=-1")["data"]
    has_id = bool(rows) and "id" in rows[0]
    pk_by_key = {r["key"]: (r["id"] if has_id else r["key"]) for r in rows}
    for key, vals in UI.items():
        if key not in pk_by_key:
            print(f"  ? ui_strings missing key {key}"); continue
        pk = urllib.parse.quote(str(pk_by_key[key]), safe="")
        api("PATCH", f"/items/ui_strings/{pk}", vals)
    print(f"+ ui_strings: {len(UI)} keys")

    # 2) Services
    svc = api("GET", "/items/services?fields=slug,translations.id,translations.languages_code&sort=sort")["data"]
    svc_ids = {s["slug"]: {t["languages_code"]: t["id"] for t in s["translations"]} for s in svc}
    patch_translations("services_translations", svc_ids, SERVICES,
                        lambda p: {"title": p[0], "description": p[1]})
    print(f"+ services: {len(SERVICES)} cards x3 locales")

    # 3) Cooperation models
    cm = api("GET", "/items/cooperation_models?fields=slug,translations.id,translations.languages_code&sort=sort")["data"]
    cm_ids = {s["slug"]: {t["languages_code"]: t["id"] for t in s["translations"]} for s in cm}
    patch_translations("cooperation_models_translations", cm_ids, MODELS,
                        lambda p: {"title": p[0], "description": p[1], "points": p[2]})
    print(f"+ cooperation_models: {len(MODELS)} x3 locales")

    # 4) About page intro + advantages
    ap = api("GET", "/items/about_page?fields=translations.id,translations.languages_code")["data"]
    ap_ids = {t["languages_code"]: t["id"] for t in ap["translations"]}
    for loc, tid in ap_ids.items():
        advantages = [{"icon": ic, "label": lb} for ic, lb in zip(ADV_ICONS, ADV_LABELS[loc])]
        api("PATCH", f"/items/about_page_translations/{tid}",
            {"intro": ABOUT_INTRO[loc], "advantages": advantages})
    print("+ about_page: intro + 8 advantages x3 locales")

    # 5) Site settings — new base fields, then values + translations
    existing = {f["field"] for f in api("GET", "/fields/site_settings")["data"]}
    for field, note in NEW_FIELDS:
        if field in existing:
            print(f"  = field {field} exists"); continue
        api("POST", "/fields/site_settings", {
            "field": field, "type": "string",
            "meta": {"interface": "input", "width": "half", "note": note},
        })
        print(f"  + field {field}")
    api("PATCH", "/items/site_settings", SETTINGS_BASE)

    ss = api("GET", "/items/site_settings?fields=translations.id,translations.languages_code")["data"]
    ss_ids = {t["languages_code"]: t["id"] for t in ss["translations"]}
    for loc, tid in ss_ids.items():
        api("PATCH", f"/items/site_settings_translations/{tid}",
            {"footer_tagline": TAGLINE[loc], "address": ADDRESS[loc], "working_hours": HOURS[loc]})
    print("+ site_settings: tagline + address + hours x3 locales + new fields")

    api("POST", "/utils/cache/clear")
    print("done — content updated in ru/en/ky.")


if __name__ == "__main__":
    main()
