#!/usr/bin/env python3
"""
Migrate content collections to Directus native Translations (languages + <coll>_translations
junction + a `translations` alias on the parent), migrate existing RU data into translations,
add EN/KY, and drop the now-translated base columns.

Idempotent per collection (skips if <coll>_translations already exists).

  DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... python3 directus/setup_content_i18n.py
"""
import json, os, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
TOKEN = None
PUBLIC = None

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
        print(f"  ! {method} {path} -> {e.code}: {d[:240]}"); return None

def login():
    global TOKEN, PUBLIC
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]
    PUBLIC = next(p["id"] for p in api("GET", "/policies?fields=id,name")["data"] if "public" in p["name"].lower())

def grant(coll, action="read"):
    api("POST", "/permissions", {"policy": PUBLIC, "collection": coll, "action": action, "fields": ["*"], "permissions": {}})

def ensure_languages():
    if api("GET", "/collections/languages") is None:
        api("POST", "/collections", {
            "collection": "languages", "schema": {}, "meta": {"icon": "translate", "note": "Языки сайта"},
            "fields": [
                {"field": "code", "type": "string", "schema": {"is_primary_key": True}, "meta": {"interface": "input"}},
                {"field": "name", "type": "string", "meta": {"interface": "input"}},
                {"field": "direction", "type": "string", "schema": {"default_value": "ltr"}, "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "LTR", "value": "ltr"}, {"text": "RTL", "value": "rtl"}]}}},
            ],
        })
        print("+ collection languages")
    existing = {l["code"] for l in (api("GET", "/items/languages?fields=code&limit=-1") or {"data": []})["data"]}
    rows = [r for r in [{"code": "ru", "name": "Русский"}, {"code": "en", "name": "English"}, {"code": "ky", "name": "Кыргызча"}] if r["code"] not in existing]
    if rows: api("POST", "/items/languages", rows)
    grant("languages")
    print("= languages ready")

def add_translations(coll, fields):
    """fields: list of {field,type,meta?} translatable columns to live in the junction."""
    tcoll = f"{coll}_translations"
    if api("GET", f"/collections/{tcoll}") is not None:
        print(f"= {tcoll} exists, skipping infra"); return
    api("POST", "/collections", {
        "collection": tcoll, "schema": {}, "meta": {"hidden": True, "icon": "translate"},
        "fields": [{"field": "id", "type": "integer", "schema": {"is_primary_key": True, "has_auto_increment": True}, "meta": {"hidden": True}}] + fields,
    })
    # FK -> parent (O2M back-reference is the `translations` alias)
    api("POST", f"/fields/{tcoll}", {"field": f"{coll}_id", "type": "integer", "schema": {}, "meta": {"hidden": True}})
    api("POST", "/relations", {
        "collection": tcoll, "field": f"{coll}_id", "related_collection": coll,
        # junction_field links the two sides of the M2M; without it the translations
        # interface can't resolve the relation and renders an empty box.
        "meta": {"one_field": "translations", "junction_field": "languages_code", "sort_field": None, "one_deselect_action": "delete"},
        "schema": {"on_delete": "CASCADE"},
    })
    # FK -> languages
    api("POST", f"/fields/{tcoll}", {"field": "languages_code", "type": "string", "schema": {}, "meta": {"hidden": True}})
    api("POST", "/relations", {
        "collection": tcoll, "field": "languages_code", "related_collection": "languages",
        "meta": {"junction_field": f"{coll}_id"},
        "schema": {"on_delete": "SET NULL"},
    })
    # alias `translations` on the parent
    api("POST", f"/fields/{coll}", {
        "field": "translations", "type": "alias",
        "meta": {"interface": "translations", "special": ["translations"], "options": {"languageField": "code"}},
    })
    grant(tcoll)
    print(f"+ translations infra for {coll}")

def fstr(name): return {"field": name, "type": "string", "meta": {"interface": "input"}}
def ftext(name): return {"field": name, "type": "text", "meta": {"interface": "input-multiline"}}
def fjson(name): return {"field": name, "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}}

# ---- services translations (keyed by slug): (en_title, en_desc, ky_title, ky_desc) ----
SERVICES = {
  "consulting": ("HSE consulting", "Development of strategies and management systems for occupational, industrial and environmental safety.",
                  "HSE консалтинг", "Эмгекти коргоо, өнөр жай коопсуздугу жана айлана-чөйрөнү коргоо боюнча стратегияларды жана башкаруу системаларын иштеп чыгуу."),
  "outsourcing": ("HSE function outsourcing", "Delegating occupational, industrial and environmental safety functions to a professional team.",
                   "HSE функцияларын аутсорсинг", "Эмгекти коргоо, өнөр жай коопсуздугу жана айлана-чөйрөнү коргоо функцияларын кесипкөй командага өткөрүп берүү."),
  "outstaffing": ("Staff outstaffing", "Providing qualified specialists to work within your team.",
                   "Персоналды аутстаффинг", "Командаңызда иштөө үчүн квалификациялуу адистерди берүү."),
  "audits": ("Audits and inspections", "Independent audits, inspections and compliance checks.",
              "Аудиттер жана текшерүүлөр", "Көз карандысыз аудиттер, инспекциялар жана шайкештик текшерүүлөрү."),
  "docs": ("Documentation development", "Development of policies, procedures, instructions and other documentation.",
            "Документацияны иштеп чыгуу", "Саясаттарды, процедураларды, нускамаларды жана башка документтерди иштеп чыгуу."),
  "contractors": ("Contractor management", "Control, assessment and development of contractor organizations.",
                   "Подрядчыларды башкаруу", "Подряддык уюмдарды көзөмөлдөө, баалоо жана өнүктүрүү."),
}

def migrate_services():
    rows = api("GET", "/items/services?fields=id,slug,title,description&limit=-1")["data"]
    payload = []
    for r in rows:
        en = SERVICES[r["slug"]]
        payload.append({"services_id": r["id"], "languages_code": "ru", "title": r["title"], "description": r["description"]})
        payload.append({"services_id": r["id"], "languages_code": "en", "title": en[0], "description": en[1]})
        payload.append({"services_id": r["id"], "languages_code": "ky", "title": en[2], "description": en[3]})
    api("POST", "/items/services_translations", payload)
    print(f"  migrated services translations: {len(payload)} rows")

# cooperation_models by slug: (en_title, en_desc, en_points[], ky_title, ky_desc, ky_points[])
MODELS = {
  "consulting": ("Consulting", "We provide expert support and solutions to improve processes, assess risks and comply with national and international standards.",
                  ["Analysis and assessment of the current situation", "Development of strategies and recommendations", "Implementation and change support", "Training and competency development"],
                  "Консалтинг", "Биз процесстерди жакшыртуу, тобокелдиктерди баалоо жана улуттук жана эл аралык стандарттарга шайкеш келүү үчүн эксперттик колдоо жана чечимдерди беребиз.",
                  ["Учурдагы абалды талдоо жана баалоо", "Стратегияларды жана сунуштарды иштеп чыгуу", "Өзгөрүүлөрдү ишке ашыруу жана коштоо", "Окутуу жана компетенцияны жогорулатуу"]),
  "outsourcing": ("Outsourcing", "We take over your HSE functions in full — from documentation to on-site control — so you can focus on your core business.",
                   ["Full management of occupational, industrial and environmental safety", "Regular reporting and control", "Support during inspections and audits", "Lower in-house staffing costs"],
                   "Аутсорсинг", "Биз HSE функцияларын толугу менен өз мойнубузга алабыз — документациядан баштап аянтчадагы көзөмөлгө чейин — ошентип сиз негизги бизнесиңизге көңүл бура аласыз.",
                   ["Эмгекти коргоо, өнөр жай жана экологиялык коопсуздук функцияларын толук жүргүзүү", "Үзгүлтүксүз отчеттуулук жана көзөмөл", "Текшерүүлөрдү жана аудиттерди коштоо", "Штаттык персоналга кеткен чыгымдарды азайтуу"]),
  "outstaffing": ("Outstaffing", "We provide qualified HSE specialists for your team for as long as you need — with no recruitment, paperwork or administration costs.",
                   ["Selection of certified specialists", "Employment and HR administration", "Flexible team scaling", "Specialist replacement and support"],
                   "Аутстаффинг", "Биз командаңызга керектүү мөөнөткө квалификациялуу HSE адистерин беребиз — тандоо, документ жүргүзүү жана администрациялоо чыгымдарысыз.",
                   ["Сертификацияланган адистерди тандоо", "Жумушка алуу жана кадрдык администрациялоо", "Команданы ийкемдүү масштабдоо", "Адистерди алмаштыруу жана коштоо"]),
}
# team_members by name: (en_position, ky_position, en_exp, ky_exp); ru_exp kept from base
TEAM = {
  "Иванов Сергей Александрович": ("General Director", "Башкы директор", "15 years", "15 жыл"),
  "Петрова Анна Владимировна": ("Head of HSE Consulting", "HSE консалтинг бөлүмүнүн жетекчиси", "12 years", "12 жыл"),
  "Маматов Данияр Талгатович": ("Head of Audits", "Аудит бөлүмүнүн жетекчиси", "10 years", "10 жыл"),
  "Смдьякова Айгуль Нурлановна": ("Environmental Expert", "Экологиялык эксперт", "9 years", "9 жыл"),
}
# document_categories by slug: (en_title, en_heading, en_lead, ky_title, ky_heading, ky_lead)
DOC_CATS = {
  "policies": ("Policies", "Company policies", "We maintain high standards of management and transparency. You can review and download our policies.",
                "Саясаттар", "Компаниянын саясаттары", "Биз башкаруунун жана ачыктыктын жогорку стандарттарын карманабыз. Сиз биздин саясаттар менен таанышып, жүктөп ала аласыз."),
  "procedures": ("Procedures", "Procedures", "Regulated procedures for managing HSE processes.",
                  "Процедуралар", "Процедуралар", "HSE процесстерин башкаруунун регламенттелген процедуралары."),
  "forms": ("Forms", "Forms", "Templates and forms for record-keeping.",
             "Формалар", "Формалар", "Документтерди жүргүзүү үчүн үлгүлөр жана формалар."),
  "registers": ("Registers", "Registers", "Registers for tracking and control.",
                 "Реестрлер", "Реестрлер", "Эсепке алуу жана көзөмөлдөө реестрлери."),
}
# documents by RU title: (en_title, ky_title)
DOCS = {
  "Политика в области охраны труда": ("Occupational Safety Policy", "Эмгекти коргоо саясаты"),
  "Политика в области охраны окружающей среды": ("Environmental Protection Policy", "Айлана-чөйрөнү коргоо саясаты"),
  "Политика в области качества": ("Quality Policy", "Сапат саясаты"),
  "Антикоррупционная политика": ("Anti-Corruption Policy", "Коррупцияга каршы саясат"),
  "Кодекс деловой этики": ("Code of Business Ethics", "Ишкердик этика кодекси"),
  "Политика Due Diligence": ("Due Diligence Policy", "Due Diligence саясаты"),
  "Политика управления подрядчиками": ("Contractor Management Policy", "Подрядчыларды башкаруу саясаты"),
  "Процедура управления рисками": ("Risk Management Procedure", "Тобокелдиктерди башкаруу процедурасы"),
  "Процедура расследования инцидентов": ("Incident Investigation Procedure", "Инциденттерди иликтөө процедурасы"),
  "Процедура управления изменениями": ("Change Management Procedure", "Өзгөрүүлөрдү башкаруу процедурасы"),
  "Форма наряда-допуска": ("Work Permit Form", "Иштөөгө уруксат формасы"),
  "Форма акта расследования": ("Investigation Report Form", "Иликтөө актысынын формасы"),
  "Чек-лист аудита": ("Audit Checklist", "Аудит текшерүү тизмеси"),
  "Реестр опасностей и рисков": ("Hazard and Risk Register", "Коркунучтар жана тобокелдиктер реестри"),
  "Реестр нормативных требований": ("Register of Regulatory Requirements", "Ченемдик талаптардын реестри"),
}

def _seed_and_drop(coll, payload, drop_fields):
    cnt = api("GET", f"/items/{coll}_translations?limit=0&meta=total_count")
    if cnt and cnt["meta"]["total_count"] == 0:
        api("POST", f"/items/{coll}_translations", payload)
        for f in drop_fields:
            api("DELETE", f"/fields/{coll}/{f}")
        print(f"  migrated {coll}: {len(payload)} rows; dropped {drop_fields}")
    else:
        print(f"= {coll}_translations already populated")

def migrate_models():
    rows = api("GET", "/items/cooperation_models?fields=id,slug,title,description,points&limit=-1")["data"]
    p = []
    for r in rows:
        m = MODELS[r["slug"]]
        p.append({"cooperation_models_id": r["id"], "languages_code": "ru", "title": r["title"], "description": r["description"], "points": r["points"]})
        p.append({"cooperation_models_id": r["id"], "languages_code": "en", "title": m[0], "description": m[1], "points": m[2]})
        p.append({"cooperation_models_id": r["id"], "languages_code": "ky", "title": m[3], "description": m[4], "points": m[5]})
    _seed_and_drop("cooperation_models", p, ["title", "description", "points"])

def migrate_team():
    rows = api("GET", "/items/team_members?fields=id,name,position,experience&limit=-1")["data"]
    p = []
    for r in rows:
        m = TEAM[r["name"]]
        p.append({"team_members_id": r["id"], "languages_code": "ru", "position": r["position"], "experience": r["experience"]})
        p.append({"team_members_id": r["id"], "languages_code": "en", "position": m[0], "experience": m[2]})
        p.append({"team_members_id": r["id"], "languages_code": "ky", "position": m[1], "experience": m[3]})
    _seed_and_drop("team_members", p, ["position", "experience"])

def migrate_doc_cats():
    rows = api("GET", "/items/document_categories?fields=id,slug,title,heading,lead&limit=-1")["data"]
    p = []
    for r in rows:
        m = DOC_CATS[r["slug"]]
        p.append({"document_categories_id": r["id"], "languages_code": "ru", "title": r["title"], "heading": r["heading"], "lead": r["lead"]})
        p.append({"document_categories_id": r["id"], "languages_code": "en", "title": m[0], "heading": m[1], "lead": m[2]})
        p.append({"document_categories_id": r["id"], "languages_code": "ky", "title": m[3], "heading": m[4], "lead": m[5]})
    _seed_and_drop("document_categories", p, ["title", "heading", "lead"])

def migrate_documents():
    rows = api("GET", "/items/documents?fields=id,title&limit=-1")["data"]
    p = []
    for r in rows:
        m = DOCS[r["title"]]
        p.append({"documents_id": r["id"], "languages_code": "ru", "title": r["title"]})
        p.append({"documents_id": r["id"], "languages_code": "en", "title": m[0]})
        p.append({"documents_id": r["id"], "languages_code": "ky", "title": m[1]})
    _seed_and_drop("documents", p, ["title"])

def migrate_singleton(coll, ru_fields, en_obj, ky_obj):
    """ru_fields: list of field names to copy from the existing singleton row."""
    cur = api("GET", f"/items/{coll}?fields=id," + ",".join(ru_fields))["data"]
    sid = cur["id"]
    ru = {"languages_code": "ru", f"{coll}_id": sid, **{f: cur[f] for f in ru_fields}}
    en = {"languages_code": "en", f"{coll}_id": sid, **en_obj}
    ky = {"languages_code": "ky", f"{coll}_id": sid, **ky_obj}
    _seed_and_drop(coll, [ru, en, ky], ru_fields)

HOME_EN = {
  "hero_title": "Your reliable partner in HSE",
  "hero_subtitle": "Occupational safety, industrial safety and environmental protection — from consulting to full outsourcing",
  "hero_features": [{"icon": "globe", "label": "International standards"}, {"icon": "users", "label": "Experienced experts"},
                     {"icon": "shield-check", "label": "Confidentiality and reliability"}, {"icon": "target", "label": "Result-oriented"}],
  "highlights_title": "Who we are, what we do, for whom",
  "highlights": [{"icon": "users", "title": "Who we are", "text": "A team of experts in occupational, industrial and environmental safety with over 10 years of experience."},
                  {"icon": "clipboard-check", "title": "What we do", "text": "We develop documentation, conduct audits, assess risks and provide HSE outsourcing."},
                  {"icon": "building", "title": "For whom", "text": "For construction, energy, manufacturing, oil & gas and other industries."}],
}
HOME_KY = {
  "hero_title": "HSE тармагында ишеничтүү өнөктөш",
  "hero_subtitle": "Эмгекти коргоо, өнөр жай коопсуздугу жана экология — консалтингден толук аутсорсингге чейин",
  "hero_features": [{"icon": "globe", "label": "Эл аралык стандарттар"}, {"icon": "users", "label": "Тажрыйбалуу эксперттер"},
                     {"icon": "shield-check", "label": "Купуялык жана ишенимдүүлүк"}, {"icon": "target", "label": "Натыйжага багытталган"}],
  "highlights_title": "Биз кимбиз, эмне кылабыз, кимдер үчүн",
  "highlights": [{"icon": "users", "title": "Биз кимбиз", "text": "Эмгекти коргоо, өнөр жай коопсуздугу жана экология боюнча 10 жылдан ашык тажрыйбасы бар эксперттердин командасы."},
                  {"icon": "clipboard-check", "title": "Биз эмне кылабыз", "text": "Биз документтерди иштеп чыгабыз, аудит жүргүзөбүз, тобокелдиктерди баалайбыз жана HSE функцияларын аутсорсинг кылабыз."},
                  {"icon": "building", "title": "Кимдер үчүн", "text": "Курулуш, энергетика, өндүрүш, мунай-газ жана башка тармактардагы ишканалар үчүн."}],
}
ABOUT_EN = {
  "title": "About the company",
  "intro": "NORVEX is a professional consulting company providing comprehensive solutions in occupational safety, industrial safety, environmental protection and risk management.",
  "stats": [{"value": "10+", "label": "years of team experience"}, {"value": "100+", "label": "successful projects"},
             {"value": "20+", "label": "industries of expertise"}, {"value": "3", "label": "languages of service"}],
  "advantages": [{"icon": "settings", "label": "Systematic approach"}, {"icon": "globe", "label": "International practices"},
                  {"icon": "award", "label": "Strong HSE expertise"}, {"icon": "shield-check", "label": "Confidentiality guaranteed"},
                  {"icon": "refresh", "label": "Flexibility to client needs"}, {"icon": "user-check", "label": "Contractor support"},
                  {"icon": "target", "label": "Risk management"}, {"icon": "file-check", "label": "Documents to international standards"}],
}
ABOUT_KY = {
  "title": "Компания жөнүндө",
  "intro": "NORVEX — эмгекти коргоо, өнөр жай коопсуздугу, айлана-чөйрөнү коргоо жана тобокелдиктерди башкаруу боюнча комплекстүү чечимдерди сунуштаган кесипкөй консалтинг компаниясы.",
  "stats": [{"value": "10+", "label": "жылдык команда тажрыйбасы"}, {"value": "100+", "label": "ийгиликтүү долбоорлор"},
             {"value": "20+", "label": "экспертиза тармактары"}, {"value": "3", "label": "тейлөө тили"}],
  "advantages": [{"icon": "settings", "label": "Системалуу мамиле"}, {"icon": "globe", "label": "Эл аралык практикалар"},
                  {"icon": "award", "label": "Жогорку HSE экспертизасы"}, {"icon": "shield-check", "label": "Купуялык кепилденген"},
                  {"icon": "refresh", "label": "Кардардын талаптарына ийкемдүүлүк"}, {"icon": "user-check", "label": "Подрядчыларды коштоо"},
                  {"icon": "target", "label": "Тобокелдиктерди башкаруу"}, {"icon": "file-check", "label": "Эл аралык стандарттар боюнча документтер"}],
}
SETTINGS_EN = {"address": "Kyrgyz Republic, Bishkek, Toktogul St. 123", "working_hours": "Mon – Fri: 9:00 – 18:00",
               "footer_tagline": "HSE solutions for business. Safety. Reliability. Results."}
SETTINGS_KY = {"address": "Кыргыз Республикасы, Бишкек ш., Токтогул көч. 123", "working_hours": "Дш – Жм: 9:00 – 18:00",
               "footer_tagline": "Бизнес үчүн HSE чечимдери. Коопсуздук. Ишенимдүүлүк. Натыйжа."}

def main():
    login()
    ensure_languages()

    add_translations("services", [fstr("title"), ftext("description")])
    cnt = api("GET", "/items/services_translations?limit=0&meta=total_count")
    if cnt and cnt["meta"]["total_count"] == 0:
        migrate_services(); api("DELETE", "/fields/services/title"); api("DELETE", "/fields/services/description")
        print("  migrated services; dropped base columns")
    else:
        print("= services_translations already populated")

    add_translations("cooperation_models", [fstr("title"), ftext("description"), fjson("points")])
    migrate_models()

    add_translations("team_members", [fstr("position"), fstr("experience")])
    migrate_team()

    add_translations("document_categories", [fstr("title"), fstr("heading"), ftext("lead")])
    migrate_doc_cats()

    add_translations("documents", [fstr("title")])
    migrate_documents()

    add_translations("home_page", [fstr("hero_title"), ftext("hero_subtitle"), fjson("hero_features"), fstr("highlights_title"), fjson("highlights")])
    migrate_singleton("home_page", ["hero_title", "hero_subtitle", "hero_features", "highlights_title", "highlights"], HOME_EN, HOME_KY)

    add_translations("about_page", [fstr("title"), ftext("intro"), fjson("stats"), fjson("advantages")])
    migrate_singleton("about_page", ["title", "intro", "stats", "advantages"], ABOUT_EN, ABOUT_KY)

    add_translations("site_settings", [ftext("address"), fstr("working_hours"), ftext("footer_tagline")])
    migrate_singleton("site_settings", ["address", "working_hours", "footer_tagline"], SETTINGS_EN, SETTINGS_KY)

    print("done.")

if __name__ == "__main__":
    main()
