#!/usr/bin/env python3
"""
Wire the brand assets + map into the CMS by adding fields on `site_settings`:
  logo      file-image  — main logo (transparent PNG/SVG), used in header & footer
  favicon   file-image  — browser-tab icon
  map_url   string      — optional Google Maps *embed* URL for the contacts page
                          (Share -> Embed a map -> copy the src). If blank, the
                          frontend builds a map from the address automatically.

Then uploads LOGO_FILE (default public/norvexLogo.png) once and sets logo+favicon
to it (only if logo isn't already set, so re-runs don't duplicate the upload).

Idempotent. Files are public-readable so <DIRECTUS_URL>/assets/<id> works at build.

  DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... \
  [LOGO_FILE=public/norvexLogo.png] python3 directus/add_brand_map_fields.py
"""
import json, os, uuid, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
LOGO_FILE = os.environ.get("LOGO_FILE", "public/norvexLogo.png")
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

def add_string_field(coll, field, note):
    existing = api("GET", f"/fields/{coll}/{field}")
    if existing and existing.get("data", {}).get("field") == field:
        print(f"= {coll}.{field} exists"); return
    api("POST", f"/fields/{coll}", {
        "field": field, "type": "string",
        "meta": {"interface": "input", "note": note, "width": "full",
                 "options": {"placeholder": "https://www.google.com/maps/embed?pb=..."}},
        "schema": {},
    }, ignore=("already exists", "duplicate"))
    print(f"+ {coll}.{field} (string)")

def upload_file(path):
    with open(path, "rb") as f:
        data = f.read()
    name = os.path.basename(path)
    ext = name.rsplit(".", 1)[-1].lower()
    ctype = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "svg": "image/svg+xml"}.get(ext, "application/octet-stream")
    boundary = "----norvex" + uuid.uuid4().hex
    body = b"".join([
        f"--{boundary}\r\n".encode(),
        f'Content-Disposition: form-data; name="file"; filename="{name}"\r\n'.encode(),
        f"Content-Type: {ctype}\r\n\r\n".encode(),
        data, b"\r\n", f"--{boundary}--\r\n".encode(),
    ])
    req = urllib.request.Request(f"{BASE}/files", data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())["data"]["id"]

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]

    add_file_field("site_settings", "logo", "Основной логотип (прозрачный PNG/SVG). Шапка и подвал.")
    add_file_field("site_settings", "favicon", "Иконка вкладки браузера (favicon).")
    add_string_field("site_settings", "map_url", "Google Maps embed-ссылка для страницы контактов (необязательно). Если пусто — карта строится по адресу.")
    api("POST", "/utils/cache/clear")

    cur = api("GET", "/items/site_settings?fields=logo,favicon")["data"]
    if cur.get("logo"):
        print(f"= logo already set ({cur['logo']}); skipping upload"); return
    fid = upload_file(LOGO_FILE)
    api("PATCH", "/items/site_settings", {"logo": fid, "favicon": cur.get("favicon") or fid})
    print(f"+ uploaded {LOGO_FILE} -> {fid}; set as logo & favicon")

if __name__ == "__main__":
    main()
