#!/usr/bin/env python3
"""
Create the `ui_strings` collection (admin-editable UI chrome translations) and seed it
with ru/en/ky values. Grants public read. Run once against the instance.

  DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... python3 directus/setup_ui_i18n.py
"""
import json, os, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
TOKEN = None

def api(method, path, body=None, ignore=()):
    req = urllib.request.Request(f"{BASE}{path}", data=json.dumps(body).encode() if body is not None else None, method=method)
    req.add_header("Content-Type", "application/json")
    if TOKEN: req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        d = e.read().decode()
        for c in ignore:
            if c in d: return None
        print(f"  ! {method} {path} -> {e.code}: {d[:200]}"); return None

# key: (ru, en, ky)   — ky is a best-effort draft, review with a native speaker.
STRINGS = {
    "nav.home": ("Главная", "Home", "Башкы бет"),
    "nav.about": ("О компании", "About", "Компания жөнүндө"),
    "nav.services": ("Услуги", "Services", "Кызматтар"),
    "nav.cooperation": ("Модели сотрудничества", "Engagement models", "Кызматташуу моделдери"),
    "nav.team": ("Команда", "Team", "Команда"),
    "nav.documents": ("Документы", "Documents", "Документтер"),
    "nav.contacts": ("Контакты", "Contacts", "Байланыш"),
    "cta.consult": ("Получить консультацию", "Get a consultation", "Консультация алуу"),
    "cta.learn_more": ("Узнать больше", "Learn more", "Толугураак"),
    "cta.more": ("Подробнее", "Learn more", "Толугураак"),
    "cta.all_specialists": ("Все специалисты", "All specialists", "Бардык адистер"),
    "cta.about_more": ("Подробнее о нас", "More about us", "Биз жөнүндө толугураак"),
    "cta.contact_us": ("Связаться с нами", "Contact us", "Биз менен байланышуу"),
    "cta.send": ("Отправить сообщение", "Send message", "Билдирүү жөнөтүү"),
    "cta.download": ("Скачать", "Download", "Жүктөп алуу"),
    "form.name": ("Ваше имя", "Your name", "Атыңыз"),
    "form.company": ("Компания", "Company", "Компания"),
    "form.phone": ("Телефон", "Phone", "Телефон"),
    "form.email": ("Email", "Email", "Электрондук почта"),
    "form.message": ("Сообщение", "Message", "Билдирүү"),
    "form.sending": ("Отправка…", "Sending…", "Жөнөтүлүүдө…"),
    "form.success": ("Спасибо! Ваше сообщение отправлено — мы свяжемся с вами.",
                      "Thank you! Your message has been sent — we'll get back to you.",
                      "Рахмат! Билдирүүңүз жөнөтүлдү — биз сиз менен байланышабыз."),
    "form.error": ("Не удалось отправить. Попробуйте позже или напишите нам напрямую.",
                    "Couldn't send. Please try again later or contact us directly.",
                    "Жөнөтүү ишке ашкан жок. Кийинчерээк аракет кылыңыз же бизге түз жазыңыз."),
    "footer.menu": ("Меню", "Menu", "Меню"),
    "footer.services": ("Услуги", "Services", "Кызматтар"),
    "footer.documents": ("Документы", "Documents", "Документтер"),
    "footer.rights": ("© {year} NORVEX. Все права защищены.", "© {year} NORVEX. All rights reserved.",
                       "© {year} NORVEX. Бардык укуктар корголгон."),
    "footer.privacy": ("Политика конфиденциальности", "Privacy policy", "Купуялык саясаты"),
    "docs.help_title": ("У вас остались вопросы?", "Still have questions?", "Суроолоруңуз барбы?"),
    "docs.help_text": ("Если вы не нашли нужный документ, свяжитесь с нами — мы обязательно поможем.",
                        "If you didn't find the document you need, contact us — we'll be glad to help.",
                        "Эгер керектүү документти таппасаңыз, биз менен байланышыңыз — биз сөзсүз жардам беребиз."),
    "contacts.consult_title": ("Нужна консультация?", "Need a consultation?", "Консультация керекпи?"),
    "contacts.consult_text": ("Наши специалисты помогут подобрать оптимальное решение для вашего бизнеса.",
                               "Our specialists will help you find the optimal solution for your business.",
                               "Биздин адистер бизнесиңиз үчүн оптималдуу чечимди тандоого жардам беришет."),
    "page.services_title": ("Наши услуги", "Our services", "Биздин кызматтар"),
    "page.services_lead": ("Мы предоставляем полный спектр решений в области HSE для обеспечения безопасности, устойчивости и эффективности вашего бизнеса.",
                            "We provide a full range of HSE solutions to ensure the safety, sustainability and efficiency of your business.",
                            "Биз бизнесиңиздин коопсуздугун, туруктуулугун жана натыйжалуулугун камсыздоо үчүн HSE чечимдеринин толук спектрин сунуштайбыз."),
    "page.team_title": ("Наша команда", "Our team", "Биздин команда"),
    "page.team_lead": ("Наши специалисты – это опытные профессионалы, имеющие международные сертификаты и успешный опыт реализации проектов в различных отраслях.",
                        "Our specialists are experienced professionals with international certifications and a track record of successful projects across industries.",
                        "Биздин адистер – эл аралык сертификаттарга жана ар кандай тармактарда долбоорлорду ишке ашыруу тажрыйбасына ээ кесипкөйлөр."),
    "page.cooperation_title": ("Модели сотрудничества", "Engagement models", "Кызматташуу моделдери"),
    "page.cooperation_lead": ("Выберите наиболее подходящую модель взаимодействия для достижения ваших целей.",
                               "Choose the engagement model that best fits your goals.",
                               "Максаттарыңызга жетүү үчүн эң ылайыктуу кызматташуу моделин тандаңыз."),
    "team.experience": ("Стаж", "Experience", "Тажрыйба"),
    "contacts.phone": ("Телефон", "Phone", "Телефон"),
    "contacts.address": ("Адрес", "Address", "Дарек"),
    "contacts.hours": ("Время работы", "Working hours", "Иш убактысы"),
    "page.contacts_title": ("Свяжитесь с нами", "Get in touch", "Биз менен байланышыңыз"),
    "page.contacts_lead": ("Мы готовы ответить на ваши вопросы и предложить эффективные решения для вашего бизнеса.",
                            "We're ready to answer your questions and offer effective solutions for your business.",
                            "Биз сурооңузга жооп берүүгө жана бизнесиңиз үчүн натыйжалуу чечимдерди сунуштоого даярбыз."),
}

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]
    pol = next(p["id"] for p in api("GET", "/policies?fields=id,name")["data"] if "public" in p["name"].lower())

    if api("GET", "/collections/ui_strings") is None:
        api("POST", "/collections", {
            "collection": "ui_strings", "schema": {},
            "meta": {"singleton": False, "icon": "translate", "note": "UI-строки (переводы интерфейса)"},
            "fields": [
                {"field": "id", "type": "integer", "schema": {"is_primary_key": True, "has_auto_increment": True}, "meta": {"hidden": True}},
                {"field": "key", "type": "string", "meta": {"interface": "input", "required": True, "width": "full", "note": "Стабильный идентификатор, не менять"}, "schema": {"is_unique": True}},
                {"field": "ru", "type": "text", "meta": {"interface": "input-multiline", "width": "full"}},
                {"field": "en", "type": "text", "meta": {"interface": "input-multiline", "width": "full"}},
                {"field": "ky", "type": "text", "meta": {"interface": "input-multiline", "width": "full"}},
            ],
        })
        print("+ collection ui_strings")
    api("POST", "/permissions", {"policy": pol, "collection": "ui_strings", "action": "read", "fields": ["*"], "permissions": {}})
    print("  public read: ui_strings")

    rows = [{"key": k, "ru": v[0], "en": v[1], "ky": v[2]} for k, v in STRINGS.items()]
    api("POST", "/items/ui_strings", rows)
    print(f"  seeded ui_strings: {len(rows)} rows")

if __name__ == "__main__":
    main()
