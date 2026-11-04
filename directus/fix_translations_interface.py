#!/usr/bin/env python3
"""
Fix the empty Translations interface in the admin.

A Directus translations field is a M2M (parent -> <coll>_translations -> languages).
For the interface to render the per-language tabs it needs BOTH junction relations to
reference the opposite field via meta.junction_field. The original migration set
`one_field` but left `junction_field` null, so Directus couldn't resolve the M2M and
the Translations box rendered empty on every collection.

Sets, per junction <coll>_translations:
  relation <coll>_id      -> meta.junction_field = "languages_code"
  relation languages_code -> meta.junction_field = "<coll>_id"

Idempotent. DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... python3 directus/fix_translations_interface.py
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

COLLS = ["services", "cooperation_models", "team_members", "document_categories",
         "documents", "home_page", "about_page", "site_settings"]

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]
    for coll in COLLS:
        tcoll = f"{coll}_translations"
        # parent-side O2M relation: knows the other junction field is languages_code
        api("PATCH", f"/relations/{tcoll}/{coll}_id", {"meta": {"junction_field": "languages_code"}})
        # languages-side M2O relation: knows the other junction field is <coll>_id
        api("PATCH", f"/relations/{tcoll}/languages_code", {"meta": {"junction_field": f"{coll}_id"}})
        print(f"~ {tcoll}: junction_field linked both ways")
    api("POST", "/utils/cache/clear")
    print("done (cache cleared).")

if __name__ == "__main__":
    main()
