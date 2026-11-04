#!/usr/bin/env python3
"""
Adds three typography-scale controls to the `site_settings` singleton so editors can
resize text site-wide from the CMS (no code change):

  type_scale_hero    — hero / page titles      (.page-hero h1, home & docs hero h1)
  type_scale_heading — section & card headings  (.section-title, panel/card h2/h3)
  type_scale_body    — body text & leads        (base text, .section-lead, hero paragraphs)

Each is a slider, bounded 0.8–1.4 (step 0.05), default 1.0 — a multiplier applied to the
existing sizes via CSS calc(). Layout.astro reads them and sets --ts-hero/--ts-heading/
--ts-body on <html>; src/styles/global.css (+ a few page styles) multiply by them.

Bounded + multiplier-based so an editor can nudge sizes without breaking the layout.
Idempotent: skips a field if it already exists.

  DIRECTUS_URL=... DIRECTUS_EMAIL=<admin> DIRECTUS_PASSWORD=... \
  python3 directus/add_typography_fields.py
"""
import json, os, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
TOKEN = None

FIELDS = [
    ("type_scale_hero", "Размер заголовков (hero)",
     "Масштаб крупных заголовков страниц. 1 = обычный, 1.2 = крупнее, 0.9 = мельче."),
    ("type_scale_heading", "Размер заголовков секций",
     "Масштаб заголовков разделов и карточек. 1 = обычный."),
    ("type_scale_body", "Размер основного текста",
     "Масштаб обычного текста и подзаголовков. 1 = обычный."),
]


def api(method, path, body=None, ignore=()):
    req = urllib.request.Request(f"{BASE}{path}", data=json.dumps(body).encode() if body is not None else None, method=method)
    req.add_header("Content-Type", "application/json")
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        d = e.read().decode()
        for c in ignore:
            if c in d:
                return None
        print(f"  ! {method} {path} -> {e.code}: {d[:200]}"); return None


def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]

    existing = {f["field"] for f in (api("GET", "/fields/site_settings") or {"data": []})["data"]}
    for field, name, note in FIELDS:
        if field in existing:
            print(f"= {field} exists"); continue
        r = api("POST", "/fields/site_settings", {
            "field": field,
            "type": "float",
            "schema": {"default_value": 1},
            "meta": {
                "interface": "slider",
                "options": {"minValue": 0.8, "maxValue": 1.4, "stepInterval": 0.05},
                "width": "half",
                "note": note,
                "special": None,
            },
        }, ignore=("RECORD_NOT_UNIQUE",))
        print(f"  {'+' if r else '!'} {field} ({name})")

    api("POST", "/utils/cache/clear")
    print("done — hard-refresh the admin to see the new Site Settings sliders.")


if __name__ == "__main__":
    main()
