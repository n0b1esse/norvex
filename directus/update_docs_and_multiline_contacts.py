#!/usr/bin/env python3
"""
June 2026 follow-up:
  1) Documents: keep just two published docs for now —
       policies   -> "Политика в области ОТ, ПБ и ООС"
       procedures -> "Процедуры в области ОТ, ПБ и ООС"
     All other docs are set to draft (NOT deleted) so categories/functionality stay
     intact and the admin can publish/add more later. Empty categories are hidden by
     the frontend (documents.astro filters out categories with no published docs).
  2) Contacts: one multiline value box per field type (admin can list several values,
     one per line). Merge the 2nd email into `email`, delete the `email2` field, and
     switch the contact fields to the multiline textarea interface.

  DIRECTUS_URL=... DIRECTUS_EMAIL=<admin> DIRECTUS_PASSWORD=... \
  python3 directus/update_docs_and_multiline_contacts.py
"""
import json, os, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
TOKEN = None

# Document id -> {locale: title}. These two stay published; everything else -> draft.
KEEP_DOCS = {
    1: {  # policies
        "ru": "Политика в области ОТ, ПБ и ООС",
        "en": "OHS, industrial and environmental safety policy",
        "ky": "Эмгекти коргоо, өнөр жай жана айлана-чөйрө коопсуздугу боюнча саясат",
    },
    8: {  # procedures
        "ru": "Процедуры в области ОТ, ПБ и ООС",
        "en": "Procedures for occupational, industrial and environmental safety",
        "ky": "Эмгекти коргоо, өнөр жай жана айлана-чөйрө коопсуздугу боюнча процедуралар",
    },
}

# Merge both addresses into the single multiline email field.
EMAIL_VALUE = "info@norvex-hse.com\ncontact@norvex-hse.com"

# site_settings base fields to switch to the multiline textarea interface.
MULTILINE_BASE = ["phone", "whatsapp", "telegram", "email", "instagram", "linkedin"]
# translatable fields (on site_settings_translations).
MULTILINE_TR = ["address", "working_hours"]


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


def set_multiline(collection, fields):
    existing = {f["field"] for f in api("GET", f"/fields/{collection}")["data"]}
    for field in fields:
        if field not in existing:
            print(f"  ? {collection}.{field} missing"); continue
        api("PATCH", f"/fields/{collection}/{field}",
            {"meta": {"interface": "input-multiline",
                      "options": {"placeholder": "Можно несколько значений — по одному на строку"}}})
        print(f"  ~ {collection}.{field} -> multiline")


def main():
    global TOKEN
    auth = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
    if not auth or "data" not in auth:
        raise SystemExit("Login failed — check DIRECTUS_EMAIL / DIRECTUS_PASSWORD (needs admin access).")
    TOKEN = auth["data"]["access_token"]

    # 1) Documents — rename the two kept docs, draft the rest.
    docs = api("GET", "/items/documents?fields=id,status,translations.id,translations.languages_code&limit=-1")["data"]
    for d in docs:
        did = d["id"]
        if did in KEEP_DOCS:
            tmap = {t["languages_code"]: t["id"] for t in d["translations"]}
            for loc, title in KEEP_DOCS[did].items():
                if loc in tmap:
                    api("PATCH", f"/items/documents_translations/{tmap[loc]}", {"title": title})
            api("PATCH", f"/items/documents/{did}", {"status": "published"})
            print(f"  + doc {did} kept + renamed")
        elif d["status"] == "published":
            # Only demote currently-published docs; leave any 'archived' docs archived.
            api("PATCH", f"/items/documents/{did}", {"status": "draft"})
            print(f"  - doc {did} -> draft")
    print(f"published docs now: {len(KEEP_DOCS)}")

    # 2) Contacts — merge emails, drop email2, switch fields to multiline.
    api("PATCH", "/items/site_settings", {"email": EMAIL_VALUE})
    print("+ email merged into one multiline value")
    api("DELETE", "/fields/site_settings/email2", ignore=("FORBIDDEN", "doesn't exist", "Invalid"))
    print("- email2 field removed")
    set_multiline("site_settings", MULTILINE_BASE)
    set_multiline("site_settings_translations", MULTILINE_TR)

    api("POST", "/utils/cache/clear")
    print("done.")


if __name__ == "__main__":
    main()
