#!/usr/bin/env python3
"""
Fix admin-UI display config left dangling after the content-i18n migration dropped
base columns (title/heading/lead/etc. moved into <coll>_translations):

  1. documents.category (M2O) display template was "{{title}}" — a column that no
     longer exists on document_categories → admin threw "field title ... does not exist".
     Repoint at the translated title.
  2. languages collection had no display_template, so the translation language dropdown
     showed bare codes. Show the language name.
  3. Give each translated collection a display_template that uses translations.* so the
     item list / relational pickers show a readable label instead of the id.

Idempotent. DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... python3 directus/fix_admin_display.py
"""
import json, os, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
TOKEN = None

def api(method, path, body=None):
    req = urllib.request.Request(f"{BASE}{path}", data=json.dumps(body).encode() if body is not None else None, method=method)
    req.add_header("Content-Type", "application/json")
    if TOKEN: req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        print(f"  ! {method} {path} -> {e.code}: {e.read().decode()[:200]}"); return None

# collection -> display_template (uses the translated title; falls back to slug where present)
DISPLAY = {
    "services": "{{translations.title}}",
    "cooperation_models": "{{translations.title}}",
    "document_categories": "{{translations.title}}",
    "documents": "{{translations.title}}",
}

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]

    # 1. fix the broken M2O template
    api("PATCH", "/fields/documents/category", {"meta": {"options": {"template": "{{translations.title}}"}}})
    print("~ documents.category template -> {{translations.title}}")

    # 2. languages dropdown label
    api("PATCH", "/collections/languages", {"meta": {"display_template": "{{name}}"}})
    print("~ languages display_template -> {{name}}")

    # 3. readable list/picker labels for translated collections
    for coll, tmpl in DISPLAY.items():
        api("PATCH", f"/collections/{coll}", {"meta": {"display_template": tmpl}})
        print(f"~ {coll} display_template -> {tmpl}")

    api("POST", "/utils/cache/clear")
    print("done (cache cleared).")

if __name__ == "__main__":
    main()
