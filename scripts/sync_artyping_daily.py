#!/usr/bin/env python3
"""
AR Typing Platform Daily Live-Typing Ingestion Pipeline
Fetches daily paragraphs from artypingplatform.com /member-area/live-typing
and automatically updates src/data/passages.ts
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
from datetime import datetime

API_BASE = "https://artypingplatform-efb5438ddb1b.herokuapp.com/api/v1"
PASSAGES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src/data/passages.ts"))

def http_post(url, data_dict, headers=None):
    if headers is None:
        headers = {}
    headers["Content-Type"] = "application/json"
    headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    req = urllib.request.Request(url, data=json.dumps(data_dict).encode("utf-8"), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8", errors="ignore")
        print(f"[!] HTTP Error {e.code} for POST {url}: {error_msg}")
        return None
    except Exception as e:
        print(f"[!] Error for POST {url}: {e}")
        return None

def http_get(url, headers=None):
    if headers is None:
        headers = {}
    headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8", errors="ignore")
        print(f"[!] HTTP Error {e.code} for GET {url}: {error_msg}")
        return None
    except Exception as e:
        print(f"[!] Error for GET {url}: {e}")
        return None

def get_jwt_token(email, password):
    print(f"[*] Authenticating with AR Typing Platform for {email}...")
    url = f"{API_BASE}/jwt/create/"
    res = http_post(url, {"email": email, "password": password})
    if res and "access" in res:
        print("[+] Authentication successful! Received JWT access token.")
        return res["access"]
    else:
        print("[!] Authentication failed. Check your ARTYPING_EMAIL and ARTYPING_PASSWORD.")
        return None

def fetch_live_typing_sessions(access_token):
    print("[*] Querying daily live-typing sessions from /live-typing/sessions/...")
    url = f"{API_BASE}/live-typing/sessions/?page=1&page_size=20"
    headers = {"Authorization": f"JWT {access_token}"}
    res = http_get(url, headers=headers)
    if not res:
        return []
    results = res.get("results", []) if isinstance(res, dict) else res
    print(f"[+] Found {len(results)} live typing sessions.")
    return results

def fetch_session_detail(session_id, access_token):
    url = f"{API_BASE}/live-typing/sessions/{session_id}/"
    headers = {"Authorization": f"JWT {access_token}"}
    return http_get(url, headers=headers)

def fetch_demo_passages():
    print("[*] Fetching public demo passages from web bundle...")
    try:
        manifest_url = "https://www.artypingplatform.com/_next/static/cZIQtJZQuQClk2W1U1YHl/_buildManifest.js"
        req = urllib.request.Request(manifest_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            manifest = r.read().decode("utf-8", errors="ignore")
        chunks = re.findall(r'static/chunks/([a-zA-Z0-9_-]+)\.js', manifest)
        
        for c in chunks:
            if "8286" in c:
                chunk_url = f"https://www.artypingplatform.com/_next/static/chunks/{c}.js"
                with urllib.request.urlopen(urllib.request.Request(chunk_url, headers={"User-Agent": "Mozilla/5.0"})) as cr:
                    content = cr.read().decode("utf-8", errors="ignore")
                if "let tf=[" in content:
                    start = content.find("let tf=[") + 7
                    end = content.find("];var tg", start)
                    raw = content[start:end+1]
                    matches = []
                    for m in re.finditer(r'id:\s*(\d+)\s*,\s*title:\s*"([^"]+)"\s*,\s*language:\s*(\d+)\s*,\s*passage_text:\s*([\'"])(.*?)\4(?:\s*\}|\s*,\s*\{)', raw, re.DOTALL):
                        pid, title, lang_id, q, text = m.groups()
                        cleaned = text.replace('\\"', '"').replace("\\'", "'").replace('\\n', ' ')
                        cleaned = re.sub(r'\\x([0-9a-fA-F]{2})', lambda hex_m: chr(int(hex_m.group(1), 16)), cleaned)
                        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
                        matches.append({
                            "id": f"ar-demo-{pid}",
                            "title": f"[Daily AR Demo] {title}",
                            "language": "hindi_kruti" if int(lang_id) == 2 else "english",
                            "category": "up_police_co",
                            "duration": 15,
                            "wordCount": len(cleaned.split()),
                            "difficulty": "medium",
                            "text": cleaned
                        })
                    return matches
    except Exception as e:
        print(f"[!] Error fetching demo passages: {e}")
    return []

def load_existing_passages():
    if not os.path.exists(PASSAGES_FILE):
        return []
    with open(PASSAGES_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract existing IDs
    existing_ids = set(re.findall(r'id:\s*[\'"]([^\'"]+)[\'"]', content))
    return existing_ids

def update_passages_file(new_passages):
    if not new_passages:
        print("[*] No new passages to add.")
        return 0

    with open(PASSAGES_FILE, "r", encoding="utf-8") as f:
        original = f.read()

    existing_ids = set(re.findall(r'id:\s*[\'"]([^\'"]+)[\'"]', original))
    unique_passages = [p for p in new_passages if p["id"] not in existing_ids]

    if not unique_passages:
        print("[*] All fetched passages already exist in passages.ts.")
        return 0

    print(f"[+] Adding {len(unique_passages)} new unique passages to passages.ts...")

    # Format new passage entries in TypeScript
    ts_entries = []
    for p in unique_passages:
        safe_title = p["title"].replace('"', '\\"')
        safe_text = p["text"].replace('`', '\\`').replace('${', '\\${')
        ts_entries.append(f"""  {{
    id: '{p["id"]}',
    title: '{safe_title}',
    language: '{p["language"]}',
    category: '{p["category"]}',
    duration: {p["duration"]},
    wordCount: {p["wordCount"]},
    difficulty: '{p["difficulty"]}',
    text: `{safe_text}`
  }}""")

    insert_str = ",\n" + ",\n".join(ts_entries)

    # Insert before the end of PASSAGES array (before `];\n\nexport const MANGAL_LESSONS`)
    target_idx = original.find("];\n\nexport const MANGAL_LESSONS")
    if target_idx == -1:
        target_idx = original.find("];")

    updated_content = original[:target_idx] + insert_str + original[target_idx:]

    with open(PASSAGES_FILE, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"[+] Successfully wrote {len(unique_passages)} new passages to {PASSAGES_FILE}")
    return len(unique_passages)

def main():
    email = os.environ.get("ARTYPING_EMAIL")
    password = os.environ.get("ARTYPING_PASSWORD")
    jwt_token = os.environ.get("ARTYPING_JWT_TOKEN")

    all_fetched = []

    if not jwt_token and email and password:
        jwt_token = get_jwt_token(email, password)

    if jwt_token:
        sessions = fetch_live_typing_sessions(jwt_token)
        for s in sessions:
            s_id = s.get("id")
            detail = fetch_session_detail(s_id, jwt_token)
            if not detail:
                continue
            passage = detail.get("passage", {})
            p_text = passage.get("passage_text", "")
            if not p_text or len(p_text.strip()) < 50:
                continue

            lang_raw = passage.get("language", 1)
            lang_key = "english"
            if lang_raw == 2 or re.search(r'[\u0900-\u097F]', passage.get("title", "")) or "अयोध्या" in p_text:
                if any(k in p_text for k in ["v;ks", "Hkwifr", "Jh", "jke"]):
                    lang_key = "hindi_kruti"
                else:
                    lang_key = "hindi_mangal"
            elif lang_raw == 3:
                lang_key = "hindi_mangal"

            title = passage.get("title") or s.get("title") or f"Daily Live Session {s_id}"
            category = "up_police_co"
            for candidate_cat, pattern in [("up_police_co", "police"), ("upsssc_ja", "upsssc"), ("up_police_asi", "asi")]:
                if pattern in title.lower():
                    category = candidate_cat
                    break

            cleaned_text = re.sub(r'\s+', ' ', p_text).strip()
            all_fetched.append({
                "id": f"ar-live-{s_id}",
                "title": f"[Daily Live] {title}",
                "language": lang_key,
                "category": category,
                "duration": 15,
                "wordCount": len(cleaned_text.split()),
                "difficulty": "medium",
                "text": cleaned_text
            })
    else:
        print("[!] No ARTYPING_EMAIL / ARTYPING_PASSWORD credentials provided in environment.")
        print("[*] Falling back to public daily demo passages...")
        demo_passages = fetch_demo_passages()
        all_fetched.extend(demo_passages)

    added_count = update_passages_file(all_fetched)
    print(f"[*] Daily pipeline sync complete. {added_count} passages added.")

if __name__ == "__main__":
    main()
