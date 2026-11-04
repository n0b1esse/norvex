#!/usr/bin/env python3
"""
Self-hosted page-view analytics inside Directus (Option B).

Creates a `page_views` intake collection (public can CREATE, like contact_submissions;
public CANNOT read), grants the Client role READ so the chart is visible in their login,
and builds an Insights dashboard "Посещаемость сайта" with:
  - Total views (metric, last 30 days, bots excluded)
  - Unique visitors (metric, countDistinct visitor, bots excluded)
  - Views per day (time-series, last 30 days, bots excluded)

The frontend beacon (src/layouts/Layout.astro) POSTs one row per page load:
  { path, lang, referrer, visitor, is_bot }

Idempotent: skips the collection/dashboard if they already exist.

  DIRECTUS_URL=... DIRECTUS_EMAIL=<admin> DIRECTUS_PASSWORD=... \
  python3 directus/setup_analytics.py
"""
import json, os, urllib.request, urllib.error

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
TOKEN = None
GREEN = "#2AA54A"
NOBOTS = {"is_bot": {"_eq": False}}

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

def grant(policy, collection, action, fields=None, rule=None):
    api("POST", "/permissions", {
        "policy": policy, "collection": collection, "action": action,
        "fields": fields or ["*"], "permissions": rule or {},
    }, ignore=("RECORD_NOT_UNIQUE", "already exists", "duplicate"))
    print(f"  grant {action} on {collection} -> policy {policy[:8]}")

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]
    pols = api("GET", "/policies?fields=id,name,admin_access")["data"]
    public = next(p["id"] for p in pols if "public" in p["name"].lower())
    client = next((p["id"] for p in pols if "client" in p["name"].lower()), None)
    print(f"public policy={public}  client policy={client}")

    # ---- collection ----
    if api("GET", "/collections/page_views") is None:
        api("POST", "/collections", {
            "collection": "page_views", "schema": {},
            "meta": {"icon": "bar_chart", "note": "Просмотры страниц (аналитика). Public create, no public read."},
            "fields": [
                {"field": "id", "type": "integer", "schema": {"is_primary_key": True, "has_auto_increment": True}, "meta": {"hidden": True}},
                {"field": "path", "type": "string", "meta": {"interface": "input"}},
                {"field": "lang", "type": "string", "meta": {"interface": "input", "width": "half"}},
                {"field": "referrer", "type": "string", "meta": {"interface": "input"}},
                {"field": "visitor", "type": "string", "meta": {"interface": "input", "width": "half", "note": "Случайный id из localStorage (для подсчёта уникальных)."}},
                {"field": "is_bot", "type": "boolean", "schema": {"default_value": False}, "meta": {"interface": "boolean", "width": "half"}},
                {"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "special": ["date-created"], "readonly": True}},
            ],
        })
        print("+ collection page_views")
    else:
        print("= page_views exists")

    # ---- permissions ----
    grant(public, "page_views", "create")            # visitors can record a view
    if client:
        grant(client, "page_views", "read")          # client can see the data
        grant(client, "directus_dashboards", "read")  # ...and open the Insights module
        grant(client, "directus_panels", "read")
    api("POST", "/utils/cache/clear")

    # ---- Insights dashboard ----
    existing = api("GET", "/dashboards?fields=id,name") or {"data": []}
    dash = next((d for d in existing["data"] if d["name"] == "Посещаемость сайта"), None)
    if dash:
        print(f"= dashboard exists ({dash['id']})"); return
    dash_id = api("POST", "/dashboards", {
        "name": "Посещаемость сайта", "icon": "insights", "note": "Просмотры страниц сайта.",
    })["data"]["id"]
    print(f"+ dashboard {dash_id}")

    panels = [
        {"name": "Всего просмотров (30 дн.)", "icon": "visibility", "type": "metric",
         "position_x": 1, "position_y": 1, "width": 7, "height": 6,
         "options": {"collection": "page_views", "field": "id", "function": "count", "filter": NOBOTS, "color": GREEN}},
        {"name": "Уникальные посетители", "icon": "group", "type": "metric",
         "position_x": 8, "position_y": 1, "width": 7, "height": 6,
         "options": {"collection": "page_views", "field": "visitor", "function": "countDistinct", "filter": NOBOTS, "color": GREEN}},
        {"name": "Просмотры по дням", "icon": "show_chart", "type": "time-series",
         "position_x": 1, "position_y": 7, "width": 24, "height": 12,
         "options": {"collection": "page_views", "dateField": "date_created", "valueField": "id",
                     "function": "count", "precision": "day", "range": "1 month", "filter": NOBOTS,
                     "color": GREEN, "fillHoles": True}},
    ]
    for p in panels:
        p["dashboard"] = dash_id
        r = api("POST", "/panels", p)
        print(f"  {'+' if r else '!'} panel {p['name']}")
    print("done")

if __name__ == "__main__":
    main()
