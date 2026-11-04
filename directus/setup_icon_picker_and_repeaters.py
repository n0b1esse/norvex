#!/usr/bin/env python3
"""
Better admin UX for content editing (no code/JSON typing):

  1. ICON FIELDS -> curated searchable dropdown.
     services.icon, cooperation_models.icon, document_categories.icon and the `icon`
     sub-field inside the repeaters below become a "Select Dropdown" of ~67 hand-picked,
     EHS-relevant icons (each with a rough Material glyph hint). The stored value is the
     Lucide name the site renders (src/components/Icon.astro). `allowOther: true` keeps
     the door open to type any of Lucide's ~1700 names that isn't in the curated list.

  2. JSON FIELDS -> repeater / tags forms (no more raw-JSON "input-code" editor):
       home_page_translations.hero_features  -> list  [{icon, label}]
       home_page_translations.highlights      -> list  [{icon, title, text}]
       about_page_translations.stats          -> list  [{value, label}]
       about_page_translations.advantages      -> list  [{icon, label}]
       cooperation_models_translations.points  -> tags  ["...", "..."]  (string array)

     The `list` interface stores an array of OBJECTS, so it fits the first four. `points`
     is an array of plain STRINGS, which `list` can't represent without changing the data
     shape — so it uses the `tags` interface, which natively round-trips ["a","b"].

Only changes field `meta` (interface + options) — no data is migrated or destroyed.
Idempotent: re-running just re-applies the same config.

  DIRECTUS_URL=... DIRECTUS_EMAIL=<admin> DIRECTUS_PASSWORD=... \
  python3 directus/setup_icon_picker_and_repeaters.py
"""
import json, os, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
TOKEN = None

# Curated icon set. value = Lucide name the site renders; icon = Material Symbol hint
# shown beside it in the Directus dropdown (purely cosmetic; a wrong hint just shows blank).
CHOICES = [
    {"text": "Shield · check", "value": "shield-check", "icon": "verified_user"},
    {"text": "Shield", "value": "shield", "icon": "shield"},
    {"text": "Shield · alert", "value": "shield-alert", "icon": "gpp_maybe"},
    {"text": "Scales (justice)", "value": "scale", "icon": "balance"},
    {"text": "Gavel / legal", "value": "gavel", "icon": "gavel"},
    {"text": "Hard hat", "value": "hard-hat", "icon": "engineering"},
    {"text": "Badge · verified", "value": "badge-check", "icon": "verified"},
    {"text": "Clipboard · check", "value": "clipboard-check", "icon": "fact_check"},
    {"text": "Clipboard · list", "value": "clipboard-list", "icon": "assignment"},
    {"text": "Clipboard", "value": "clipboard", "icon": "content_paste"},
    {"text": "Checklist", "value": "list-checks", "icon": "checklist"},
    {"text": "Document · check", "value": "file-check", "icon": "task"},
    {"text": "Document", "value": "file-text", "icon": "description"},
    {"text": "File", "value": "file", "icon": "draft"},
    {"text": "Archive", "value": "archive", "icon": "inventory_2"},
    {"text": "Check", "value": "check", "icon": "check"},
    {"text": "Lock / security", "value": "lock", "icon": "lock"},
    {"text": "Eye / oversight", "value": "eye", "icon": "visibility"},
    {"text": "Search / audit", "value": "search", "icon": "search"},
    {"text": "Warning", "value": "triangle-alert", "icon": "warning"},
    {"text": "Alarm / siren", "value": "siren", "icon": "siren"},
    {"text": "Flame / fire", "value": "flame", "icon": "local_fire_department"},
    {"text": "Fire extinguisher", "value": "fire-extinguisher", "icon": "fire_extinguisher"},
    {"text": "Construction", "value": "construction", "icon": "construction"},
    {"text": "Life buoy / support", "value": "life-buoy", "icon": "support"},
    {"text": "Biohazard", "value": "biohazard", "icon": "coronavirus"},
    {"text": "People / team", "value": "users", "icon": "groups"},
    {"text": "Person · check", "value": "user-check", "icon": "how_to_reg"},
    {"text": "Briefcase", "value": "briefcase", "icon": "work"},
    {"text": "Building / company", "value": "building", "icon": "business"},
    {"text": "Office building", "value": "building-2", "icon": "apartment"},
    {"text": "Factory / industry", "value": "factory", "icon": "factory"},
    {"text": "Handshake / partner", "value": "handshake", "icon": "handshake"},
    {"text": "Training", "value": "graduation-cap", "icon": "school"},
    {"text": "Presentation", "value": "presentation", "icon": "co_present"},
    {"text": "Support / call center", "value": "headset", "icon": "headset_mic"},
    {"text": "Leaf / ecology", "value": "leaf", "icon": "eco"},
    {"text": "Recycle", "value": "recycle", "icon": "recycling"},
    {"text": "Globe / world", "value": "globe", "icon": "public"},
    {"text": "Trees", "value": "trees", "icon": "forest"},
    {"text": "Water", "value": "droplets", "icon": "water_drop"},
    {"text": "Air / wind", "value": "wind", "icon": "air"},
    {"text": "Sun / energy", "value": "sun", "icon": "wb_sunny"},
    {"text": "Sprout / growth", "value": "sprout", "icon": "compost"},
    {"text": "Settings / system", "value": "settings", "icon": "settings"},
    {"text": "Adjust / controls", "value": "sliders-horizontal", "icon": "tune"},
    {"text": "Refresh / flexible", "value": "refresh-cw", "icon": "autorenew"},
    {"text": "Target / risk", "value": "target", "icon": "target"},
    {"text": "Trending up", "value": "trending-up", "icon": "trending_up"},
    {"text": "Bar chart", "value": "chart-column", "icon": "bar_chart"},
    {"text": "Line chart", "value": "chart-line", "icon": "show_chart"},
    {"text": "Pie chart", "value": "chart-pie", "icon": "pie_chart"},
    {"text": "Activity / monitor", "value": "activity", "icon": "monitoring"},
    {"text": "Gauge / performance", "value": "gauge", "icon": "speed"},
    {"text": "Workflow", "value": "workflow", "icon": "account_tree"},
    {"text": "Layers", "value": "layers", "icon": "layers"},
    {"text": "Phone", "value": "phone", "icon": "call"},
    {"text": "Email", "value": "mail", "icon": "mail"},
    {"text": "Location", "value": "map-pin", "icon": "place"},
    {"text": "Clock / hours", "value": "clock", "icon": "schedule"},
    {"text": "Calendar", "value": "calendar", "icon": "calendar_today"},
    {"text": "Message", "value": "message-circle", "icon": "chat"},
    {"text": "Award", "value": "award", "icon": "emoji_events"},
    {"text": "Medal", "value": "medal", "icon": "military_tech"},
    {"text": "Star", "value": "star", "icon": "star"},
    {"text": "Idea / lightbulb", "value": "lightbulb", "icon": "lightbulb"},
    {"text": "Energy / zap", "value": "zap", "icon": "bolt"},
    {"text": "Rocket / launch", "value": "rocket", "icon": "rocket_launch"},
    {"text": "Health / pulse", "value": "heart-pulse", "icon": "monitor_heart"},
    {"text": "Health / medical", "value": "stethoscope", "icon": "stethoscope"},
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


# --- reusable interface configs --------------------------------------------
def icon_dropdown_options():
    # allowOther MUST be False: Directus only renders the per-choice glyph in the dropdown
    # menu when `multiple === false && allowOther === false` (see select-list-item.vue).
    # With allowOther True the menu shows labels only. Trade-off: editors pick from the
    # curated list (can't free-type a name) — add new ones to CHOICES instead.
    return {"choices": CHOICES, "allowOther": False, "allowNone": True,
            "placeholder": "Pick an icon…"}


def icon_subfield(width="half"):
    return {"field": "icon", "type": "string", "name": "Icon",
            "meta": {"interface": "select-dropdown", "width": width,
                     "options": icon_dropdown_options()}}


def text_subfield(field, name, interface="input", width="full"):
    return {"field": field, "type": "text" if interface == "input-multiline" else "string",
            "name": name, "meta": {"interface": interface, "width": width}}


def patch_field(collection, field, meta):
    r = api("PATCH", f"/fields/{collection}/{field}", {"meta": meta})
    print(f"  {'✓' if r else '!'} {collection}.{field} -> {meta['interface']}")


# Legacy icon names -> canonical Lucide names that exist in the dropdown above, so the
# already-selected value shows its glyph (the site renders both identically via Icon.astro's
# alias map). Adding NEW names to CHOICES (archive/clipboard/file) covers the rest.
ICON_RENAME = {"scales": "scale", "refresh": "refresh-cw"}


def normalize_content_icons():
    print("normalize legacy icon values in content")
    # standalone icon fields on base collections
    for coll in ["services", "cooperation_models", "document_categories"]:
        for r in api("GET", f"/items/{coll}?fields=id,icon&limit=-1")["data"]:
            new = ICON_RENAME.get(r.get("icon"))
            if new:
                api("PATCH", f"/items/{coll}/{r['id']}", {"icon": new})
                print(f"  {coll}/{r['id']}: {r['icon']} -> {new}")
    # icon sub-values inside the repeater JSON fields (per translation row)
    for coll, fields in [("home_page_translations", ["hero_features", "highlights"]),
                         ("about_page_translations", ["advantages"])]:
        for r in api("GET", f"/items/{coll}?fields=id,{','.join(fields)}&limit=-1")["data"]:
            patch, changed = {}, []
            for f in fields:
                arr = r.get(f) or []
                if any(it.get("icon") in ICON_RENAME for it in arr):
                    for it in arr:
                        if it.get("icon") in ICON_RENAME:
                            changed.append(f"{it['icon']}->{ICON_RENAME[it['icon']]}")
                            it["icon"] = ICON_RENAME[it["icon"]]
                    patch[f] = arr
            if patch:
                api("PATCH", f"/items/{coll}/{r['id']}", patch)
                print(f"  {coll}/{r['id']}: {', '.join(changed)}")


def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]

    # 1) standalone icon fields -> dropdown
    print("icon fields -> select-dropdown")
    for coll in ["services", "cooperation_models", "document_categories"]:
        patch_field(coll, "icon", {"interface": "select-dropdown", "options": icon_dropdown_options(),
                                   "note": "Иконка карточки (значок). Выберите из списка."})

    # 2) JSON repeaters -> list interface
    print("json fields -> repeater / tags")
    patch_field("home_page_translations", "hero_features", {
        "interface": "list",
        "options": {"template": "{{label}}", "addLabel": "Добавить пункт",
                    "fields": [icon_subfield(), text_subfield("label", "Label")]},
        "note": "Пункты под заголовком на главной (иконка + текст).",
    })
    patch_field("home_page_translations", "highlights", {
        "interface": "list",
        "options": {"template": "{{title}}", "addLabel": "Добавить блок",
                    "fields": [icon_subfield(), text_subfield("title", "Title"),
                               text_subfield("text", "Text", "input-multiline")]},
        "note": "Блоки «Кто мы / Что делаем / Для кого» (иконка + заголовок + текст).",
    })
    patch_field("about_page_translations", "stats", {
        "interface": "list",
        "options": {"template": "{{value}} — {{label}}", "addLabel": "Добавить показатель",
                    "fields": [text_subfield("value", "Value", "input", "half"),
                               text_subfield("label", "Label", "input", "half")]},
        "note": "Цифры о компании (значение + подпись), напр. «10+» / «лет опыта».",
    })
    patch_field("about_page_translations", "advantages", {
        "interface": "list",
        "options": {"template": "{{label}}", "addLabel": "Добавить преимущество",
                    "fields": [icon_subfield(), text_subfield("label", "Label")]},
        "note": "Преимущества (иконка + текст).",
    })
    # points is an array of plain strings -> tags (preserves ["a","b"] shape)
    patch_field("cooperation_models_translations", "points", {
        "interface": "tags", "options": {"placeholder": "Введите пункт и нажмите Enter"},
        "note": "Пункты списка. Введите текст и нажмите Enter, чтобы добавить.",
    })

    # 3) normalize legacy icon values so each selected value matches a curated choice
    normalize_content_icons()

    api("POST", "/utils/cache/clear")
    print("done — hard-refresh the admin (Cmd/Ctrl+Shift+R) to drop the cached schema.")


if __name__ == "__main__":
    main()
