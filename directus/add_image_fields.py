#!/usr/bin/env python3
"""
Add image-upload (file-image) fields so the admin can manage the main page imagery
from Directus (until now only team_members.photo existed; everything else was a
hardcoded placeholder). Idempotent — skips fields that already exist.

  home_page.hero_image          hero photo on the home page
  about_page.image              office/about photo
  cooperation_models.image      per-model panel image

Files are already public-readable, so <DIRECTUS_URL>/assets/<id> works from the build.

  DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... python3 directus/add_image_fields.py
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

# (collection, field, admin note)
IMAGE_FIELDS = [
    ("home_page", "hero_image", "Фото для главного экрана (hero)"),
    ("about_page", "image", "Фото компании / офиса"),
    ("cooperation_models", "image", "Изображение для модели сотрудничества"),
]

def add_image_field(coll, field, note):
    # field metadata GET returns 403 (not 404) when the field is absent on this build,
    # so treat both as "missing" and rely on the create being a no-op error if it exists.
    existing = api("GET", f"/fields/{coll}/{field}")
    if existing and existing.get("data", {}).get("field") == field:
        print(f"= {coll}.{field} exists"); return
    api("POST", f"/fields/{coll}", {
        "field": field, "type": "uuid",
        "meta": {"interface": "file-image", "special": ["file"], "note": note, "width": "full"},
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
    for coll, field, note in IMAGE_FIELDS:
        add_image_field(coll, field, note)
    api("POST", "/utils/cache/clear")
    print("done (cache cleared).")

if __name__ == "__main__":
    main()
