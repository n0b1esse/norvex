#!/usr/bin/env python3
"""
Seeds the ui_strings rows for the privacy-policy page: the contact-form consent
checkbox label + link, the footer link and the page's SEO title/description.
(The policy text itself is static, in src/pages/[lang]/privacy.astro.)

Idempotent: only inserts keys that don't already exist — never clobbers edits.

  DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... python3 directus/add_privacy_strings.py
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

# key: (ru, en, ky)
STRINGS = {
    "form.consent": (
        "Я даю согласие на обработку персональных данных в соответствии с документом",
        "I consent to the processing of my personal data in accordance with the",
        "Төмөнкү документке ылайык жеке маалыматтарымды иштетүүгө макулдук берем:"),
    "form.consent_link": (
        "«Политика конфиденциальности»",
        "Privacy Policy",
        "«Купуялык саясаты»"),
    "footer.privacy": (
        "Политика конфиденциальности",
        "Privacy Policy",
        "Купуялык саясаты"),
    "seo.privacy.title": (
        "Политика конфиденциальности | NORVEX",
        "Privacy Policy | NORVEX",
        "Купуялык саясаты | NORVEX"),
    "seo.privacy.desc": (
        "Политика конфиденциальности NORVEX: как мы собираем, используем и защищаем персональные данные в соответствии с законодательством Кыргызской Республики.",
        "NORVEX Privacy Policy: how we collect, use and protect personal data in accordance with the legislation of the Kyrgyz Republic.",
        "NORVEX купуялык саясаты: жеке маалыматтарды Кыргыз Республикасынын мыйзамдарына ылайык кантип чогултабыз, колдонобуз жана коргойбуз."),
}

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]
    have = {r["key"] for r in (api("GET", "/items/ui_strings?fields=key&limit=-1") or {}).get("data", [])}
    rows = [{"key": k, "ru": v[0], "en": v[1], "ky": v[2]} for k, v in STRINGS.items() if k not in have]
    if rows:
        api("POST", "/items/ui_strings", rows)
        print(f"+ seeded {len(rows)} strings ({len(STRINGS) - len(rows)} already present)")
    else:
        print("= all strings already present")
    api("POST", "/utils/cache/clear")
    print("done (cache cleared).")

if __name__ == "__main__":
    main()
