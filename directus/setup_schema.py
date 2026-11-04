#!/usr/bin/env python3
"""
Create + seed the Norvex Directus collections, and grant public read access.

Idempotent-ish: skips collections that already exist; permission/seed steps assume a
fresh instance. Re-run after a reset.

Usage:
  DIRECTUS_URL=http://127.0.0.1:18055 \
  DIRECTUS_EMAIL=...@norvex-hse.com DIRECTUS_PASSWORD=... \
  python3 directus/setup_schema.py
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL = os.environ["DIRECTUS_EMAIL"]
PASSWORD = os.environ["DIRECTUS_PASSWORD"]
PUBLIC_POLICY = None  # resolved at runtime
TOKEN = None


def api(method, path, body=None, ignore=()):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read().decode()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        for code in ignore:
            if code in detail:
                return None
        print(f"  ! {method} {path} -> {e.code}: {detail[:300]}")
        return None


def login():
    global TOKEN, PUBLIC_POLICY
    r = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
    TOKEN = r["data"]["access_token"]
    pols = api("GET", "/policies?fields=id,name,admin_access")["data"]
    PUBLIC_POLICY = next(p["id"] for p in pols if "public" in p["name"].lower())
    print(f"logged in; public policy = {PUBLIC_POLICY}")


# ---- field helpers ----
def f_id():
    return {"field": "id", "type": "integer",
            "schema": {"is_primary_key": True, "has_auto_increment": True},
            "meta": {"hidden": True}}

def f_status():
    return {"field": "status", "type": "string", "schema": {"default_value": "published"},
            "meta": {"interface": "select-dropdown", "width": "half", "display": "labels",
                     "options": {"choices": [{"text": "Опубликовано", "value": "published"},
                                             {"text": "Черновик", "value": "draft"}]}}}

def f_sort():
    return {"field": "sort", "type": "integer", "meta": {"interface": "input", "hidden": True}}

def f_str(name, required=False, half=False):
    m = {"interface": "input"}
    if required: m["required"] = True
    if half: m["width"] = "half"
    return {"field": name, "type": "string", "meta": m, "schema": {}}

def f_text(name):
    return {"field": name, "type": "text", "meta": {"interface": "input-multiline"}}

def f_json(name, note=""):
    return {"field": name, "type": "json",
            "meta": {"interface": "input-code", "options": {"language": "json"}, "note": note}}


def create_collection(name, fields, singleton=False, sort=True, icon="box", note=""):
    if api("GET", f"/collections/{name}") is not None:
        print(f"= {name} exists, skipping create")
        return
    meta = {"singleton": singleton, "icon": icon, "note": note}
    if sort and not singleton:
        meta["sort_field"] = "sort"
    api("POST", "/collections", {"collection": name, "schema": {}, "fields": fields, "meta": meta})
    print(f"+ collection {name}")


def add_file_field(coll, field, image=True):
    api("POST", f"/fields/{coll}", {
        "field": field, "type": "uuid",
        "meta": {"interface": "file-image" if image else "file", "special": ["file"]},
        "schema": {},
    }, ignore=("already exists", "RECORD_NOT_UNIQUE"))
    api("POST", "/relations", {
        "collection": coll, "field": field, "related_collection": "directus_files",
        "schema": {"on_delete": "SET NULL"},
    }, ignore=("already exists", "RECORD_NOT_UNIQUE"))
    print(f"+ {coll}.{field} (file)")


def add_m2o_field(coll, field, related, template="{{title}}"):
    api("POST", f"/fields/{coll}", {
        "field": field, "type": "integer",
        "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"],
                 "options": {"template": template}},
        "schema": {},
    }, ignore=("already exists",))
    api("POST", "/relations", {
        "collection": coll, "field": field, "related_collection": related,
        "schema": {"on_delete": "SET NULL"},
    }, ignore=("already exists",))
    print(f"+ {coll}.{field} -> {related} (m2o)")


def grant(collection, action="read", fields=None, rule=None):
    api("POST", "/permissions", {
        "policy": PUBLIC_POLICY, "collection": collection, "action": action,
        "fields": fields or ["*"], "permissions": rule or {},
    })
    print(f"  public {action}: {collection}")


def seed(collection, rows):
    api("POST", f"/items/{collection}", rows)
    print(f"  seeded {collection}: {len(rows)} row(s)")


def seed_singleton(collection, data):
    # Singletons are upserted via PATCH /items/<collection> (no id).
    api("PATCH", f"/items/{collection}", data)
    print(f"  seeded singleton {collection}")


def main():
    login()

    # ---------- schema ----------
    create_collection("services",
        [f_id(), f_status(), f_sort(), f_str("icon", half=True), f_str("slug", half=True),
         f_str("title", required=True), f_text("description")],
        icon="eco", note="Услуги (Services page cards)")

    create_collection("cooperation_models",
        [f_id(), f_status(), f_sort(), f_str("icon", half=True), f_str("slug", half=True),
         f_str("title", required=True), f_text("description"),
         f_json("points", "Список пунктов (массив строк)")],
        icon="groups", note="Модели сотрудничества (tabs)")

    create_collection("team_members",
        [f_id(), f_status(), f_sort(), f_str("name", required=True),
         f_str("position"), f_str("experience", half=True)],
        icon="badge", note="Команда")
    add_file_field("team_members", "photo")

    create_collection("document_categories",
        [f_id(), f_sort(), f_str("icon", half=True), f_str("slug", half=True),
         f_str("title", required=True), f_str("heading"), f_text("lead")],
        icon="folder", note="Категории документов")

    create_collection("documents",
        [f_id(), f_status(), f_sort(), f_str("title", required=True), f_str("file_size", half=True)],
        icon="description", note="Документы")
    add_m2o_field("documents", "category", "document_categories")
    add_file_field("documents", "file", image=False)

    create_collection("contact_submissions",
        [f_id(), f_str("name"), f_str("company"), f_str("phone"), f_str("email"), f_text("message"),
         {"field": "date_created", "type": "timestamp",
          "meta": {"interface": "datetime", "special": ["date-created"], "readonly": True}}],
        sort=False, icon="mail", note="Заявки с формы (Контакты)")

    create_collection("site_settings",
        [f_id(), f_str("phone", half=True), f_str("whatsapp", half=True), f_str("telegram", half=True),
         f_str("email", half=True), f_str("address"), f_str("working_hours", half=True),
         f_text("footer_tagline"),
         f_str("social_whatsapp", half=True), f_str("social_telegram", half=True),
         f_str("social_linkedin", half=True)],
        singleton=True, icon="settings", note="Глобальные настройки / контакты")

    create_collection("home_page",
        [f_id(), f_str("hero_title"), f_text("hero_subtitle"),
         f_json("hero_features", "[{icon,label}]"),
         f_str("highlights_title"), f_json("highlights", "[{icon,title,text}]")],
        singleton=True, icon="home", note="Главная страница")

    create_collection("about_page",
        [f_id(), f_str("title"), f_text("intro"),
         f_json("stats", "[{value,label}]"), f_json("advantages", "[{icon,label}]")],
        singleton=True, icon="info", note="О компании")

    # ---------- public permissions ----------
    # NOTE: the free Core plan forbids custom permission rules / field subsets on public
    # access ("custom_permission_rules_enabled is restricted"), so grants are full (fields
    # "*", no filter). All seeded rows are 'published'; gate drafts at the query layer instead.
    print("permissions:")
    for c in ("services", "cooperation_models", "team_members", "documents",
              "document_categories", "site_settings", "home_page", "about_page",
              "directus_files"):
        grant(c)
    grant("contact_submissions", action="create")

    # ---------- seed ----------
    print("seed:")
    seed("services", [
        {"sort": 1, "icon": "shield-check", "slug": "consulting", "title": "HSE-консалтинг",
         "description": "Разработка стратегий и систем управления в области ОТ, ПБ и ООС."},
        {"sort": 2, "icon": "settings", "slug": "outsourcing", "title": "Аутсорсинг HSE-функций",
         "description": "Передача функций по охране труда, ПБ и ООС профессиональной команде."},
        {"sort": 3, "icon": "user-check", "slug": "outstaffing", "title": "Аутстаффинг персонала",
         "description": "Предоставление квалифицированных специалистов для работы в вашей команде."},
        {"sort": 4, "icon": "search", "slug": "audits", "title": "Аудиты и инспекции",
         "description": "Независимые аудиты, инспекции и проверки соответствия."},
        {"sort": 5, "icon": "file", "slug": "docs", "title": "Разработка документации",
         "description": "Разработка политик, процедур, инструкций и другой документации."},
        {"sort": 6, "icon": "users", "slug": "contractors", "title": "Управление подрядчиками",
         "description": "Контроль, оценка и развитие подрядных организаций."},
    ])

    seed("cooperation_models", [
        {"sort": 1, "icon": "users", "slug": "consulting", "title": "Консалтинг",
         "description": "Мы предоставляем экспертную поддержку и решения для улучшения процессов, оценки рисков и соответствия требованиям национальных и международных стандартов.",
         "points": ["Анализ и оценка текущей ситуации", "Разработка стратегий и рекомендаций",
                     "Внедрение и сопровождение изменений", "Обучение и повышение компетенций"]},
        {"sort": 2, "icon": "settings", "slug": "outsourcing", "title": "Аутсорсинг",
         "description": "Берём на себя выполнение функций HSE целиком — от ведения документации до контроля на площадке, чтобы вы могли сосредоточиться на основном бизнесе.",
         "points": ["Полное ведение функций ОТ, ПБ и ООС", "Регулярная отчетность и контроль",
                     "Сопровождение проверок и аудитов", "Снижение затрат на штатный персонал"]},
        {"sort": 3, "icon": "user-check", "slug": "outstaffing", "title": "Аутстаффинг",
         "description": "Предоставляем квалифицированных HSE-специалистов в вашу команду на необходимый срок — без затрат на подбор, оформление и администрирование.",
         "points": ["Подбор сертифицированных специалистов", "Оформление и кадровое администрирование",
                     "Гибкое масштабирование команды", "Замена и сопровождение специалистов"]},
    ])

    seed("team_members", [
        {"sort": 1, "name": "Иванов Сергей Александрович", "position": "Генеральный директор", "experience": "15 лет"},
        {"sort": 2, "name": "Петрова Анна Владимировна", "position": "Руководитель отдела HSE-консалтинга", "experience": "12 лет"},
        {"sort": 3, "name": "Маматов Данияр Талгатович", "position": "Руководитель отдела аудитов", "experience": "10 лет"},
        {"sort": 4, "name": "Смдьякова Айгуль Нурлановна", "position": "Экологический эксперт", "experience": "9 лет"},
    ])

    seed("document_categories", [
        {"sort": 1, "icon": "shield-check", "slug": "policies", "title": "Политики",
         "heading": "Политики компании",
         "lead": "Мы придерживаемся высоких стандартов управления и открытости. Вы можете ознакомиться и скачать наши политики."},
        {"sort": 2, "icon": "clipboard", "slug": "procedures", "title": "Процедуры",
         "heading": "Процедуры", "lead": "Регламентированные процедуры управления процессами в области HSE."},
        {"sort": 3, "icon": "file", "slug": "forms", "title": "Формы",
         "heading": "Формы", "lead": "Шаблоны и формы для ведения документации."},
        {"sort": 4, "icon": "archive", "slug": "registers", "title": "Реестры",
         "heading": "Реестры", "lead": "Реестры учета и контроля."},
    ])
    cats = {c["slug"]: c["id"] for c in api("GET", "/items/document_categories?fields=id,slug&limit=-1")["data"]}

    docs = []
    for i, (t, sz) in enumerate([
        ("Политика в области охраны труда", "245 КБ"),
        ("Политика в области охраны окружающей среды", "216 КБ"),
        ("Политика в области качества", "210 КБ"),
        ("Антикоррупционная политика", "186 КБ"),
        ("Кодекс деловой этики", "180 КБ"),
        ("Политика Due Diligence", "210 КБ"),
        ("Политика управления подрядчиками", "210 КБ"),
    ]):
        docs.append({"sort": i + 1, "category": cats["policies"], "title": t, "file_size": sz})
    for i, (t, sz) in enumerate([
        ("Процедура управления рисками", "220 КБ"),
        ("Процедура расследования инцидентов", "198 КБ"),
        ("Процедура управления изменениями", "175 КБ"),
    ]):
        docs.append({"sort": i + 1, "category": cats["procedures"], "title": t, "file_size": sz})
    for i, (t, sz) in enumerate([
        ("Форма наряда-допуска", "120 КБ"),
        ("Форма акта расследования", "140 КБ"),
        ("Чек-лист аудита", "160 КБ"),
    ]):
        docs.append({"sort": i + 1, "category": cats["forms"], "title": t, "file_size": sz})
    for i, (t, sz) in enumerate([
        ("Реестр опасностей и рисков", "230 КБ"),
        ("Реестр нормативных требований", "205 КБ"),
    ]):
        docs.append({"sort": i + 1, "category": cats["registers"], "title": t, "file_size": sz})
    seed("documents", docs)

    seed_singleton("site_settings", {
        "phone": "+996 555 123 456", "whatsapp": "+996 555 123 456", "telegram": "@norvex_hse",
        "email": "info@norvex.com", "address": "Кыргызская Республика, г. Бишкек, ул. Токтогула 123",
        "working_hours": "Пн – Пт: 9:00 – 18:00",
        "footer_tagline": "HSE-решения для бизнеса. Безопасность. Надежность. Результат.",
        "social_whatsapp": "#", "social_telegram": "#", "social_linkedin": "#",
    })

    seed_singleton("home_page", {
        "hero_title": "Надежный партнер в области HSE",
        "hero_subtitle": "Охрана труда, промышленная безопасность и экология — от консалтинга до полного аутсорсинга",
        "hero_features": [
            {"icon": "globe", "label": "Международные стандарты"},
            {"icon": "users", "label": "Опытные эксперты"},
            {"icon": "shield-check", "label": "Конфиденциальность и надежность"},
            {"icon": "target", "label": "Ориентация на результат"},
        ],
        "highlights_title": "Кто мы, что делаем, для кого",
        "highlights": [
            {"icon": "users", "title": "Кто мы", "text": "Команда экспертов по охране труда, промышленной безопасности и экологии с опытом более 10 лет."},
            {"icon": "clipboard-check", "title": "Что мы делаем", "text": "Разрабатываем документацию, проводим аудиты, оцениваем риски и обеспечиваем аутсорсинг функций HSE."},
            {"icon": "building", "title": "Для кого", "text": "Для предприятий строительства, энергетики, производства, нефтегаза и других отраслей."},
        ],
    })

    seed_singleton("about_page", {
        "title": "О компании",
        "intro": "NORVEX — профессиональная консалтинговая компания, предоставляющая комплексные решения в области охраны труда, промышленной безопасности, охраны окружающей среды и управления рисками.",
        "stats": [
            {"value": "10+", "label": "лет опыта команды"},
            {"value": "100+", "label": "успешных проектов"},
            {"value": "20+", "label": "отраслей экспертизы"},
            {"value": "3", "label": "языка обслуживания"},
        ],
        "advantages": [
            {"icon": "settings", "label": "Системный подход"},
            {"icon": "globe", "label": "Международные практики"},
            {"icon": "award", "label": "Высокая HSE экспертиза"},
            {"icon": "shield-check", "label": "Конфиденциальность гарантирована"},
            {"icon": "refresh", "label": "Гибкость под требования клиента"},
            {"icon": "user-check", "label": "Сопровождение подрядчиков"},
            {"icon": "target", "label": "Управление рисками"},
            {"icon": "file-check", "label": "Документы по международным стандартам"},
        ],
    })

    # project name
    api("PATCH", "/settings", {"project_name": "Norvex HSE"})
    print("done.")


if __name__ == "__main__":
    main()
