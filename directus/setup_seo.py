#!/usr/bin/env python3
"""
SEO setup, all admin-editable from Directus:

  1. site_settings.og_image  — default social-share image (file-image). Used for
     og:image / twitter:image on every page when set; falls back to /norvexHero.jpg.
  2. ui_strings rows `seo.<page>.title` / `seo.<page>.desc` (ru/en/ky) — the per-page
     <title> and meta description. Editors change SEO copy in the existing "UI Strings"
     collection; the static build reads them via getT() like every other UI string.

Idempotent: the og_image field is created only if missing, and only seo.* strings that
don't already exist are inserted — so re-running never clobbers edits made in Directus.

  DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... python3 directus/setup_seo.py
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

# key: (ru, en, ky)
SEO = {
    "seo.home.title": (
        "NORVEX — охрана труда, промбезопасность и экология",
        "NORVEX — Occupational Safety, Industrial Safety & Ecology",
        "NORVEX — эмгекти коргоо, өнөр жай коопсуздугу жана экология"),
    "seo.home.desc": (
        "NORVEX — надёжный партнёр в области HSE в Кыргызстане: охрана труда, промышленная безопасность, экология и аутсорсинг функций HSE для вашего бизнеса.",
        "NORVEX is a trusted HSE partner in Kyrgyzstan: occupational health & safety, industrial safety, ecology and full HSE outsourcing for your business.",
        "NORVEX — Кыргызстандагы ишеничтүү HSE өнөктөшү: эмгекти коргоо, өнөр жай коопсуздугу, экология жана HSE функцияларын аутсорсинг."),
    "seo.about.title": (
        "О компании NORVEX — эксперты в области HSE",
        "About NORVEX — HSE Experts",
        "NORVEX компаниясы жөнүндө — HSE боюнча эксперттер"),
    "seo.about.desc": (
        "Узнайте о NORVEX: команда сертифицированных специалистов по охране труда, промышленной безопасности и экологии с опытом проектов в разных отраслях.",
        "Learn about NORVEX: a team of certified occupational, industrial safety and ecology specialists with project experience across many industries.",
        "NORVEX жөнүндө: эмгекти коргоо, өнөр жай коопсуздугу жана экология боюнча сертификацияланган, ар кандай тармактарда тажрыйбасы бар адистердин командасы."),
    "seo.services.title": (
        "Услуги в области HSE — охрана труда и экология | NORVEX",
        "HSE Services — Occupational Safety & Ecology | NORVEX",
        "HSE кызматтары — эмгекти коргоо жана экология | NORVEX"),
    "seo.services.desc": (
        "Полный спектр услуг HSE: аудит, обучение, документация, охрана труда, промышленная безопасность и экологическое сопровождение бизнеса.",
        "A full range of HSE services: audits, training, documentation, occupational and industrial safety and environmental support for your business.",
        "HSE кызматтарынын толук спектри: аудит, окутуу, документация, эмгекти коргоо, өнөр жай коопсуздугу жана экологиялык коштоо."),
    "seo.cooperation.title": (
        "Модели сотрудничества с NORVEX | HSE-аутсорсинг",
        "Engagement Models with NORVEX | HSE Outsourcing",
        "NORVEX менен кызматташуу моделдери | HSE аутсорсинг"),
    "seo.cooperation.desc": (
        "Выберите модель сотрудничества с NORVEX: разовый проект, абонентское обслуживание или полный аутсорсинг функций HSE.",
        "Choose how to work with NORVEX: one-off projects, ongoing retainer support, or full outsourcing of your HSE functions.",
        "NORVEX менен кызматташуу моделин тандаңыз: бир жолку долбоор, абоненттик тейлөө же HSE функцияларын толук аутсорсинг."),
    "seo.team.title": (
        "Команда NORVEX — специалисты по охране труда и экологии",
        "NORVEX Team — Occupational Safety & Ecology Specialists",
        "NORVEX командасы — эмгекти коргоо жана экология адистери"),
    "seo.team.desc": (
        "Команда NORVEX — опытные специалисты с международными сертификатами в области охраны труда, промышленной безопасности и экологии.",
        "The NORVEX team: experienced specialists with international certifications in occupational health, industrial safety and ecology.",
        "NORVEX командасы — эмгекти коргоо, өнөр жай коопсуздугу жана экология боюнча эл аралык сертификаттарга ээ тажрыйбалуу адистер."),
    "seo.documents.title": (
        "Документы и лицензии NORVEX | HSE",
        "NORVEX Documents & Licenses | HSE",
        "NORVEX документтери жана лицензиялары | HSE"),
    "seo.documents.desc": (
        "Официальные документы, лицензии и сертификаты NORVEX в области охраны труда, промышленной безопасности и экологии — доступны для скачивания.",
        "Official NORVEX documents, licenses and certificates in occupational, industrial safety and ecology — available to download.",
        "NORVEX'тин эмгекти коргоо, өнөр жай коопсуздугу жана экология боюнча расмий документтери, лицензиялары жана сертификаттары."),
    "seo.contacts.title": (
        "Контакты NORVEX — свяжитесь с нами | Бишкек",
        "Contact NORVEX — Get in Touch | Bishkek",
        "NORVEX байланыштары — биз менен байланышыңыз | Бишкек"),
    "seo.contacts.desc": (
        "Свяжитесь с NORVEX в Бишкеке: телефон, email, мессенджеры и форма обратной связи. Ответим на вопросы по охране труда и экологии.",
        "Contact NORVEX in Bishkek: phone, email, messengers and a contact form. We'll answer your occupational safety and ecology questions.",
        "NORVEX менен Бишкекте байланышыңыз: телефон, email, мессенджерлер жана байланыш формасы. Эмгекти коргоо боюнча суроолорго жооп беребиз."),
}

def add_og_image():
    existing = api("GET", "/fields/site_settings/og_image")
    if existing and existing.get("data", {}).get("field") == "og_image":
        print("= site_settings.og_image exists"); return
    api("POST", "/fields/site_settings", {
        "field": "og_image", "type": "uuid",
        "meta": {"interface": "file-image", "special": ["file"], "width": "half",
                 "note": "Картинка для превью при шаринге ссылки (Open Graph / Twitter). ~1200×630."},
        "schema": {},
    }, ignore=("already exists", "duplicate"))
    api("POST", "/relations", {
        "collection": "site_settings", "field": "og_image", "related_collection": "directus_files",
        "schema": {"on_delete": "SET NULL"}, "meta": {},
    }, ignore=("already exists", "duplicate", "RECORD_NOT_UNIQUE"))
    print("+ site_settings.og_image (file-image)")

def seed_seo_strings():
    have = {r["key"] for r in (api("GET", "/items/ui_strings?fields=key&limit=-1") or {}).get("data", [])}
    rows = [{"key": k, "ru": v[0], "en": v[1], "ky": v[2]} for k, v in SEO.items() if k not in have]
    if not rows:
        print("= all seo.* strings already present"); return
    api("POST", "/items/ui_strings", rows)
    print(f"+ seeded {len(rows)} seo.* strings ({len(SEO) - len(rows)} already present)")

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]
    add_og_image()
    seed_seo_strings()
    api("POST", "/utils/cache/clear")
    print("done (cache cleared).")

if __name__ == "__main__":
    main()
