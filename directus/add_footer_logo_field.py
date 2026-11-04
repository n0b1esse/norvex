#!/usr/bin/env python3
"""
Add a separate footer logo field on `site_settings`:
  footer_logo  file-image  — logo shown in the footer (e.g. a light/white variant).
                             If left empty, the frontend falls back to the main `logo`.

No upload is done here — the editor uploads the footer logo in the admin. Idempotent.

  DIRECTUS_URL=... DIRECTUS_EMAIL=<admin> DIRECTUS_PASSWORD=... \
  python3 directus/add_footer_logo_field.py
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

def add_file_field(coll, field, note):
    existing = api("GET", f"/fields/{coll}/{field}")
    if existing and existing.get("data", {}).get("field") == field:
        print(f"= {coll}.{field} exists"); return
    api("POST", f"/fields/{coll}", {
        "field": field, "type": "uuid",
        "meta": {"interface": "file-image", "special": ["file"], "note": note, "width": "half"},
        "schema": {},
    }, ignore=("already exists", "duplicate"))
    api("POST", "/relations", {
        "collection": coll, "field": field, "related_collection": "directus_files",
        "schema": {"on_delete": "SET NULL"}, "meta": {},
    }, ignore=("already exists", "duplicate", "RECORD_NOT_UNIQUE"))
    print(f"+ {coll}.{field} (file-image)")

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]
    add_file_field("site_settings", "footer_logo",
                   "Логотип для подвала (напр. светлый вариант). Если пусто — берётся основной логотип.")
    api("POST", "/utils/cache/clear")

if __name__ == "__main__":
    main()
