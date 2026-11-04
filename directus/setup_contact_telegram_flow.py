#!/usr/bin/env python3
"""
Create a Directus Flow that sends a Telegram message whenever the website
contact form creates a `contact_submissions` row. Free, no email/SMTP needed.

Pipeline: items.create on contact_submissions
  -> "Run Script" op builds a JSON-safe Telegram payload from the submitted
     fields (JSON.stringify avoids breakage from quotes/newlines in the message)
  -> "Request" op POSTs it to https://api.telegram.org/bot<TOKEN>/sendMessage

Two helper modes:
  * No TELEGRAM_CHAT_ID set -> calls getUpdates and prints candidate chat IDs
    (send your bot a message first, or add it to a group and post once), then exits.
  * Both token + chat id set -> creates the flow (idempotent; skips if it exists).

  TELEGRAM_BOT_TOKEN=123:abc \
  [TELEGRAM_CHAT_ID=123456789] \
  DIRECTUS_URL=http://127.0.0.1:18055 \
  DIRECTUS_EMAIL=<admin> DIRECTUS_PASSWORD=<admin pw> \
  python3 directus/setup_contact_telegram_flow.py
"""
import json, os, sys, urllib.request, urllib.error, urllib.parse

BASE = os.environ.get("DIRECTUS_URL", "http://127.0.0.1:18055").rstrip("/")
BOT = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
FLOW_NAME = "Telegram on contact submission"
TOKEN = None

def tg(method):
    with urllib.request.urlopen(f"https://api.telegram.org/bot{BOT}/{method}") as r:
        return json.loads(r.read().decode())

def discover_chat_ids():
    print("No TELEGRAM_CHAT_ID set — reading getUpdates for candidate chats.")
    print("(First send your bot a direct message, or add it to a group and post once.)\n")
    data = tg("getUpdates")
    seen = {}
    for u in data.get("result", []):
        msg = u.get("message") or u.get("channel_post") or {}
        chat = msg.get("chat") or {}
        if chat.get("id") is not None:
            seen[chat["id"]] = f'{chat.get("type")}: {chat.get("title") or (chat.get("first_name","")+" "+chat.get("username",""))}'.strip()
    if not seen:
        print("No chats found. Message the bot (or post in its group) and re-run."); return
    print("Candidate chat IDs:")
    for cid, desc in seen.items():
        print(f"  {cid}   ({desc})")
    print("\nRe-run with TELEGRAM_CHAT_ID=<one of the above> to create the flow.")

def api(method, path, body=None):
    req = urllib.request.Request(f"{BASE}{path}", data=(json.dumps(body).encode() if body is not None else None), method=method)
    req.add_header("Content-Type", "application/json")
    if TOKEN: req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        print(f"  ! {method} {path} -> {e.code}: {e.read().decode()[:240]}"); return None

# Run-Script op: build a JSON-safe Telegram sendMessage body from the trigger.
SCRIPT = """module.exports = async function(data) {
  var p = (data.$trigger && data.$trigger.payload) || {};
  var lines = [
    '\\uD83D\\uDD14 Новая заявка с сайта norvexhse.com',
    '',
    '\\uD83D\\uDC64 Имя: ' + (p.name || '—'),
    '\\uD83C\\uDFE2 Компания: ' + (p.company || '—'),
    '\\uD83D\\uDCDE Телефон: ' + (p.phone || '—'),
    '\\u2709\\uFE0F Email: ' + (p.email || '—'),
    '',
    '\\uD83D\\uDCAC Сообщение:',
    (p.message || '—')
  ];
  return { body: JSON.stringify({ chat_id: %s, text: lines.join('\\n'), disable_web_page_preview: true }) };
};""" % json.dumps(CHAT if not CHAT.lstrip("-").isdigit() else int(CHAT))

def main():
    global TOKEN
    if not CHAT:
        discover_chat_ids(); return

    TOKEN = api("POST", "/auth/login", {"email": os.environ["DIRECTUS_EMAIL"], "password": os.environ["DIRECTUS_PASSWORD"]})["data"]["access_token"]
    existing = api("GET", f"/flows?filter[name][_eq]={urllib.parse.quote(FLOW_NAME)}&fields=id")
    if existing and existing.get("data"):
        print(f"= flow '{FLOW_NAME}' already exists (id {existing['data'][0]['id']}); nothing to do"); return

    flow = api("POST", "/flows", {
        "name": FLOW_NAME, "icon": "send", "status": "active",
        "trigger": "event", "accountability": "all",
        "options": {"type": "action", "scope": ["items.create"], "collections": ["contact_submissions"]},
    })["data"]

    build = api("POST", "/operations", {
        "flow": flow["id"], "key": "build", "name": "Build Telegram payload",
        "type": "exec", "position_x": 19, "position_y": 1, "options": {"code": SCRIPT},
    })["data"]

    send = api("POST", "/operations", {
        "flow": flow["id"], "key": "telegram", "name": "Send Telegram message",
        "type": "request", "position_x": 37, "position_y": 1,
        "options": {
            "url": f"https://api.telegram.org/bot{BOT}/sendMessage",
            "method": "POST",
            "headers": [{"header": "Content-Type", "value": "application/json"}],
            "body": "{{build.body}}",
        },
    })["data"]

    api("PATCH", f"/operations/{build['id']}", {"resolve": send["id"]})
    api("PATCH", f"/flows/{flow['id']}", {"operation": build["id"]})
    print(f"+ flow created (id {flow['id']}) -> Telegram chat {CHAT} on new submission")

if __name__ == "__main__":
    main()
