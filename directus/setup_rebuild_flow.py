#!/usr/bin/env python3
"""
Create a Directus Flow that rebuilds + redeploys the site when content changes.

On items.create/update/delete in any content collection (everything except
contact_submissions and system collections), the flow POSTs a `repository_dispatch`
event to GitHub, which triggers .github/workflows/ci-cd.yml → build (with fresh
Directus data) → deploy to Vercel. The workflow's concurrency cancel-in-progress
debounces rapid edits to a single deploy.

Idempotent: skips if the flow already exists.

  GITHUB_PAT=<fine-grained PAT, repo scope, Contents: Read+write> \
  GITHUB_REPO=NEW_OWNER/norvex \
  DIRECTUS_URL=http://127.0.0.1:18055 \
  DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... \
  python3 directus/setup_rebuild_flow.py
"""
import json, os, urllib.request, urllib.error, urllib.parse

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
PAT = os.environ["GITHUB_PAT"]
REPO = os.environ["GITHUB_REPO"]
FLOW_NAME = "Rebuild site on content change"
TOKEN = None

def api(method, path, body=None):
    req = urllib.request.Request(f"{BASE}{path}", data=(json.dumps(body).encode() if body is not None else None), method=method)
    req.add_header("Content-Type", "application/json")
    if TOKEN: req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        print(f"  ! {method} {path} -> {e.code}: {e.read().decode()[:240]}"); return None

def main():
    global TOKEN
    TOKEN = api("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})["data"]["access_token"]

    existing = api("GET", f"/flows?filter[name][_eq]={urllib.parse.quote(FLOW_NAME)}&fields=id")
    if existing and existing.get("data"):
        print(f"= flow '{FLOW_NAME}' already exists (id {existing['data'][0]['id']}); nothing to do"); return

    # watch every non-system collection except contact_submissions (form spam must not rebuild)
    cols = api("GET", "/collections?limit=-1")["data"]
    watch = sorted(c["collection"] for c in cols
                   if not c["collection"].startswith("directus_") and c["collection"] != "contact_submissions")
    print(f"watching {len(watch)} collections: {', '.join(watch)}")

    flow = api("POST", "/flows", {
        "name": FLOW_NAME, "icon": "rocket_launch", "status": "active",
        "trigger": "event", "accountability": "all",
        "options": {"type": "action", "scope": ["items.create", "items.update", "items.delete"], "collections": watch},
    })["data"]

    op = api("POST", "/operations", {
        "flow": flow["id"], "key": "github_dispatch", "name": "GitHub repository_dispatch",
        "type": "request", "position_x": 19, "position_y": 1,
        "options": {
            "url": f"https://api.github.com/repos/{REPO}/dispatches",
            "method": "POST",
            "headers": [
                {"header": "Authorization", "value": f"Bearer {PAT}"},
                {"header": "Accept", "value": "application/vnd.github+json"},
                {"header": "User-Agent", "value": "directus-flow"},
                {"header": "Content-Type", "value": "application/json"},
            ],
            "body": '{"event_type":"directus-publish"}',
        },
    })["data"]

    api("PATCH", f"/flows/{flow['id']}", {"operation": op["id"]})
    print(f"+ flow created (id {flow['id']}) -> dispatches '{REPO}' on content change")

if __name__ == "__main__":
    main()
