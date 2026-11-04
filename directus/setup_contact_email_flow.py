#!/usr/bin/env python3
"""
Create a Directus Flow that emails a notification whenever the website contact
form creates a `contact_submissions` row.

Trigger: event hook, items.create on contact_submissions (non-blocking).
Action:  Send Email (Directus "mail" operation) to the configured recipients,
         with the submitted fields in the body and reply-to set to the sender.

REQUIRES a working Directus email transport (SMTP) — see CLAUDE.md. Without it
the flow runs but mail silently fails. Recipients come from MAIL_TO (comma-sep).

Idempotent: skips if the flow already exists.

  DIRECTUS_URL=http://127.0.0.1:18055 \
  DIRECTUS_EMAIL=<admin email> DIRECTUS_PASSWORD=<admin password> \
  MAIL_TO="temooorkh@gmail.com,Ulanbek.Omorkulov@norvex-hse.com" \
  python3 directus/setup_contact_email_flow.py
"""
import json, os, urllib.request, urllib.error, urllib.parse

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
EMAIL, PASSWORD = os.environ["DIRECTUS_EMAIL"], os.environ["DIRECTUS_PASSWORD"]
MAIL_TO = [a.strip() for a in os.environ.get(
    "MAIL_TO", "temooorkh@gmail.com,Ulanbek.Omorkulov@norvex-hse.com").split(",") if a.strip()]
FLOW_NAME = "Email on contact submission"
TOKEN = None

BODY = (
    "Новая заявка с сайта norvexhse.com:\n\n"
    "- **Имя:** {{$trigger.payload.name}}\n"
    "- **Компания:** {{$trigger.payload.company}}\n"
    "- **Телефон:** {{$trigger.payload.phone}}\n"
    "- **Email:** {{$trigger.payload.email}}\n\n"
    "**Сообщение:**\n\n{{$trigger.payload.message}}\n"
)

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

    print(f"recipients: {', '.join(MAIL_TO)}")
    flow = api("POST", "/flows", {
        "name": FLOW_NAME, "icon": "mail", "status": "active",
        "trigger": "event", "accountability": "all",
        "options": {"type": "action", "scope": ["items.create"], "collections": ["contact_submissions"]},
    })["data"]

    op = api("POST", "/operations", {
        "flow": flow["id"], "key": "send_email", "name": "Send notification email",
        "type": "mail", "position_x": 19, "position_y": 1,
        "options": {
            "to": MAIL_TO,
            "replyTo": "{{$trigger.payload.email}}",
            "subject": "Новая заявка с сайта Norvex — {{$trigger.payload.name}}",
            "type": "markdown",
            "body": BODY,
        },
    })["data"]

    api("PATCH", f"/flows/{flow['id']}", {"operation": op["id"]})
    print(f"+ flow created (id {flow['id']}) -> emails {', '.join(MAIL_TO)} on new submission")

if __name__ == "__main__":
    main()
