#!/usr/bin/env python3
"""
Follow-up fixes surfaced in code review (additive + idempotent):

  1. team_members: make `name` translatable. Adds a `name` field to the
     team_members_translations junction and fills ru/ky (Cyrillic, = base name)
     and en (transliterated). The frontend now reads the localised name.
  2. ui_strings: add the `about.why_title` key so the "Why choose NORVEX"
     heading on /about is admin-editable and translated (was hardcoded RU).

Safe to re-run: skips the field/rows/keys that already exist.

  DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... python3 directus/fix_review_issues.py
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
        print(f"  ! {method} {path} -> {e.code}: {d[:240]}"); return None

# EN transliterations of the seeded team names (ru/ky keep the Cyrillic original).
TEAM_NAME_EN = {
    "Иванов Сергей Александрович": "Ivanov Sergey Aleksandrovich",
    "Петрова Анна Владимировна": "Petrova Anna Vladimirovna",
    "Маматов Данияр Талгатович": "Mamatov Daniyar Talgatovich",
    "Смдьякова Айгуль Нурлановна": "Smdyakova Aygul Nurlanovna",
}

ABOUT_WHY = ("about.why_title", "Почему выбирают NORVEX", "Why choose NORVEX", "Эмне үчүн NORVEX-ти тандашат")

# Shorten the nav/footer label only (the page H1 keeps the long `page.cooperation_title`).
# Long labels wrapped the header to two lines and overflowed the bar.
NAV_COOP = ("nav.cooperation", "Сотрудничество", "Engagement", "Кызматташуу")

def login():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]

def add_team_name():
    # 1. add the translatable `name` field to the junction (skip if present)
    if api("GET", "/fields/team_members_translations/name") is None:
        api("POST", "/fields/team_members_translations", {"field": "name", "type": "string", "meta": {"interface": "input"}})
        print("+ field team_members_translations.name")
    else:
        print("= team_members_translations.name exists")
    # 2. fill the name on each existing translation row
    rows = api("GET", "/items/team_members?fields=id,name,translations.id,translations.languages_code,translations.name&limit=-1")["data"]
    patched = 0
    for m in rows:
        base = m["name"]
        for tr in m.get("translations", []):
            if tr.get("name"):  # already set
                continue
            val = TEAM_NAME_EN.get(base, base) if tr["languages_code"] == "en" else base
            api("PATCH", f"/items/team_members_translations/{tr['id']}", {"name": val})
            patched += 1
    print(f"  set name on {patched} translation rows")

def add_about_why():
    k, ru, en, ky = ABOUT_WHY
    existing = api("GET", f"/items/ui_strings?filter[key][_eq]={k}&fields=id")
    if existing and existing.get("data"):
        print(f"= ui_strings '{k}' exists"); return
    api("POST", "/items/ui_strings", {"key": k, "ru": ru, "en": en, "ky": ky})
    print(f"+ ui_strings '{k}'")

def set_ui_string(key, ru, en, ky):
    row = api("GET", f"/items/ui_strings?filter[key][_eq]={key}&fields=id,ru")
    data = (row or {}).get("data") or []
    if not data:
        api("POST", "/items/ui_strings", {"key": key, "ru": ru, "en": en, "ky": ky}); print(f"+ ui_strings '{key}'")
    else:
        api("PATCH", f"/items/ui_strings/{data[0]['id']}", {"ru": ru, "en": en, "ky": ky}); print(f"~ ui_strings '{key}' -> '{ru}'")

def main():
    login()
    add_team_name()
    add_about_why()
    set_ui_string(*NAV_COOP)
    api("POST", "/utils/cache/clear")
    print("done (cache cleared).")

if __name__ == "__main__":
    main()
