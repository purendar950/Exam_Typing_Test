#!/usr/bin/env python3
"""
Automated UP Police Computer Operator & ASI Typing Passage Ingestion Pipeline
Syncs authentic exam typing passages strictly for:
- UP Police Computer Operator Grade-A (up_police_co)
- UP Police Assistant Sub-Inspector - Clerk / Accounts (up_police_asi)
In Hindi (Mangal Inscript & Kruti Dev) and English only.
Fetches and categorizes date-wise (YYYY-MM-DD).
"""

import os
import sys
import re
import json
import urllib.request
import urllib.error
from datetime import datetime

PASSAGES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src/data/passages.ts"))

def fetch_url(url, timeout=20):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[!] Warning: failed to fetch {url}: {e}")
        return ""

def clean_text(text):
    if not text:
        return ""
    text = text.replace('\\"', '"').replace("\\'", "'").replace('\\n', ' ')
    text = re.sub(r'\\x([0-9a-fA-F]{2})', lambda m: chr(int(m.group(1), 16)), text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def scrape_typemangal(target_date):
    print(f"[*] Fetching authentic UP Police CO & ASI exam passages from TypeMangal for {target_date}...")
    html = fetch_url("https://typemangal.online/")
    script_m = re.search(r'<script type="module" crossorigin src="(/assets/index-[a-zA-Z0-9_-]+\.js)"', html)
    if not script_m:
        print("[!] Could not locate TypeMangal JS bundle")
        return []
    
    js_url = f"https://typemangal.online{script_m.group(1)}"
    js_code = fetch_url(js_url)
    
    passages = []
    pattern = re.compile(
        r'\{id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*difficulty:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*content:\s*"([^"]+)"\}'
    )
    for m in pattern.finditer(js_code):
        pid, title, diff, cat, content = m.groups()
        text = clean_text(content)
        if len(text.split()) < 30:
            continue
        
        # Clean title from third-party exam prefixes
        clean_title = re.sub(r'^(SSC\s*(CHSL|CGL)|MP\s*CPCT|BSSC\s*(Inter Level|Clerk)?|High\s*Court\s*(RO|ARO)?):\s*', '', title)
        
        # Determine UP Police category: ASI for clerk/accounts/admin/legal, CO for technical/cyber/general police
        is_asi = any(k in title.lower() or k in cat.lower() for k in ["asi", "clerk", "न्याय", "प्रशासन", "संवैधानिक", "लेखा", "विधि"])
        category = "up_police_asi" if is_asi else "up_police_co"
        prefix = "UP Police ASI" if is_asi else "UP Police CO"
        
        passages.append({
            "id": f"tm-{pid}",
            "title": f"{prefix}: {clean_title}",
            "language": "hindi_mangal",
            "category": category,
            "duration": 15,
            "wordCount": len(text.split()),
            "difficulty": diff.lower() if diff.lower() in ['easy', 'medium', 'hard'] else 'medium',
            "date": target_date,
            "text": text
        })
    print(f"[+] Retrieved {len(passages)} passages from TypeMangal")
    return passages

def scrape_cgltyping(target_date):
    print(f"[*] Fetching authentic UP Police CO & ASI exam passages from CGLTyping for {target_date}...")
    passages = []
    
    # 1. Hindi Mangal Passages
    hi_code = fetch_url("https://cgltyping.in/assets/js/passages-hindi.js")
    hi_pattern = re.compile(r'id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*text:\s*"([^"]+)"', re.DOTALL)
    for m in hi_pattern.finditer(hi_code):
        pid, title, cat, text_raw = m.groups()
        text = clean_text(text_raw)
        clean_title = re.sub(r'^UPSSSC:\s*', '', title)
        
        is_asi = any(k in clean_title for k in ["पंचायती", "प्रशासन", "न्याय", "स्वास्थ्य", "शिक्षा", "राज"])
        category = "up_police_asi" if is_asi else "up_police_co"
        prefix = "UP Police ASI" if is_asi else "UP Police CO"
        
        passages.append({
            "id": f"cgl-hi-{pid}",
            "title": f"{prefix}: {clean_title} (Mangal Inscript)",
            "language": "hindi_mangal",
            "category": category,
            "duration": 15,
            "wordCount": len(text.split()),
            "difficulty": "medium",
            "date": target_date,
            "text": text
        })
        
    # 2. English Passages
    en_code = fetch_url("https://cgltyping.in/assets/js/passages.js")
    en_pattern = re.compile(r'id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*text:\s*"([^"]+)"', re.DOTALL)
    for m in en_pattern.finditer(en_code):
        pid, title, cat, text_raw = m.groups()
        text = clean_text(text_raw)
        clean_title = re.sub(r'^UP\s*Police\s*(CO|ASI):\s*', '', title)
        
        is_asi = any(k in clean_title.lower() for k in ["governance", "administration", "judicial", "disaster", "banking", "education", "health"])
        category = "up_police_asi" if is_asi else "up_police_co"
        prefix = "UP Police ASI" if is_asi else "UP Police CO"
        
        passages.append({
            "id": f"cgl-en-{pid}",
            "title": f"{prefix}: {clean_title}",
            "language": "english",
            "category": category,
            "duration": 15,
            "wordCount": len(text.split()),
            "difficulty": "medium",
            "date": target_date,
            "text": text
        })
        
    print(f"[+] Retrieved {len(passages)} passages from CGLTyping (Hindi & English)")
    return passages

def scrape_artyping_demo(target_date):
    print(f"[*] Checking AR Typing Platform free passages for {target_date}...")
    passages = []
    try:
        manifest = fetch_url("https://www.artypingplatform.com/_next/static/cZIQtJZQuQClk2W1U1YHl/_buildManifest.js")
        chunks = re.findall(r'static/chunks/([a-zA-Z0-9_-]+)\.js', manifest)
        for c in chunks:
            if "8286" in c:
                code = fetch_url(f"https://www.artypingplatform.com/_next/static/chunks/{c}.js")
                if "let tf=[" in code:
                    start = code.find("let tf=[") + 7
                    end = code.find("];var tg", start)
                    raw = code[start:end+1]
                    for m in re.finditer(r'id:\s*(\d+)\s*,\s*title:\s*"([^"]+)"\s*,\s*language:\s*(\d+)\s*,\s*passage_text:\s*([\'"])(.*?)\4(?:\s*\}|\s*,\s*\{)', raw, re.DOTALL):
                        pid, title, lang_id, q, raw_t = m.groups()
                        text = clean_text(raw_t)
                        clean_title = re.sub(r'^(\[AR Typing\]|\[Daily.*?\])\s*', '', title)
                        is_asi = int(lang_id) == 2 or "asi" in title.lower()
                        category = "up_police_asi" if is_asi else "up_police_co"
                        prefix = "UP Police ASI" if is_asi else "UP Police CO"
                        
                        passages.append({
                            "id": f"ar-free-{pid}",
                            "title": f"{prefix}: {clean_title}",
                            "language": "hindi_kruti" if int(lang_id) == 2 else "english",
                            "category": category,
                            "duration": 15,
                            "wordCount": len(text.split()),
                            "difficulty": "medium",
                            "date": target_date,
                            "text": text
                        })
    except Exception as e:
        print(f"[!] Note on AR Typing: {e}")
    print(f"[+] Retrieved {len(passages)} free passages from AR Typing")
    return passages

def update_passages_file(new_passages):
    if not new_passages:
        print("[*] No passages found.")
        return 0

    with open(PASSAGES_FILE, "r", encoding="utf-8") as f:
        original = f.read()

    existing_ids = set(re.findall(r'id:\s*[\'"]([^\'"]+)[\'"]', original))
    unique_passages = [p for p in new_passages if p["id"] not in existing_ids]

    if not unique_passages:
        print("[*] All fetched passages already exist in passages.ts.")
        return 0

    print(f"[+] Appending {len(unique_passages)} new unique UP Police passages to passages.ts...")

    ts_entries = []
    for p in unique_passages:
        safe_title = p["title"].replace("'", "\\'")
        safe_text = p["text"].replace('`', '\\`').replace('${', '\\${')
        ts_entries.append(f"""  {{
    id: '{p["id"]}',
    title: '{safe_title}',
    language: '{p["language"]}',
    category: '{p["category"]}',
    duration: {p["duration"]},
    wordCount: {p["wordCount"]},
    difficulty: '{p["difficulty"]}',
    date: '{p["date"]}',
    text: `{safe_text}`
  }}""")

    insert_str = ",\n" + ",\n".join(ts_entries)

    target_idx = original.find("];\n\nexport const MANGAL_LESSONS")
    if target_idx == -1:
        target_idx = original.find("];")

    updated_content = original[:target_idx] + insert_str + original[target_idx:]

    with open(PASSAGES_FILE, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"[+] Successfully wrote {len(unique_passages)} new passages into {PASSAGES_FILE}")
    return len(unique_passages)

def main():
    target_date = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y-%m-%d")
    print(f"[*] Starting UP Police CO & ASI date-wise sync for: {target_date}")
    
    all_passages = []
    all_passages.extend(scrape_typemangal(target_date))
    all_passages.extend(scrape_cgltyping(target_date))
    all_passages.extend(scrape_artyping_demo(target_date))
    
    # Filter strictly to Hindi and English, and UP Police CO / ASI
    filtered = [
        p for p in all_passages
        if p["language"] in ["hindi_mangal", "hindi_kruti", "english"]
        and p["category"] in ["up_police_co", "up_police_asi"]
    ]
    
    print(f"[*] Total valid UP Police CO & ASI passages harvested: {len(filtered)}")
    added = update_passages_file(filtered)
    print(f"[*] Sync completed for date {target_date}. {added} newly integrated passages ready.")

if __name__ == "__main__":
    main()
