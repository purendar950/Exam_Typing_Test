#!/usr/bin/env python3
"""
Automated Free Typing Passage Ingestion Pipeline
Syncs authentic UP Police, UPSSSC, and Government Exam typing passages
from open, free-tier platforms (TypeMangal, CGLTyping, AR Typing Demo).
No login credentials or paid subscription required.
"""

import os
import sys
import re
import json
import urllib.request
import urllib.error

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

def scrape_typemangal():
    print("[*] Fetching authentic UP Police & State exam passages from TypeMangal...")
    html = fetch_url("https://typemangal.online/")
    script_m = re.search(r'<script type="module" crossorigin src="(/assets/index-[a-zA-Z0-9_-]+\.js)"', html)
    if not script_m:
        print("[!] Could not locate TypeMangal JS bundle")
        return []
    
    js_url = f"https://typemangal.online{script_m.group(1)}"
    js_code = fetch_url(js_url)
    
    passages = []
    # Pattern matching {id:"...", title:"...", difficulty:"...", category:"...", content:"..."}
    pattern = re.compile(
        r'\{id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*difficulty:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*content:\s*"([^"]+)"\}'
    )
    for m in pattern.finditer(js_code):
        pid, title, diff, cat, content = m.groups()
        text = clean_text(content)
        if len(text.split()) < 30:
            continue
        
        category = "up_police_co"
        if "asi" in title.lower() or "asi" in cat.lower():
            category = "up_police_asi"
        elif "bssc" in title.lower() or "court" in title.lower():
            category = "upsssc_ja"
            
        passages.append({
            "id": f"tm-{pid}",
            "title": title,
            "language": "hindi_mangal",
            "category": category,
            "duration": 15,
            "wordCount": len(text.split()),
            "difficulty": diff.lower() if diff.lower() in ['easy', 'medium', 'hard'] else 'medium',
            "text": text
        })
    print(f"[+] Retrieved {len(passages)} passages from TypeMangal")
    return passages

def scrape_cgltyping():
    print("[*] Fetching authentic exam passages from CGLTyping...")
    passages = []
    
    # 1. Hindi Mangal Passages
    hi_code = fetch_url("https://cgltyping.in/assets/js/passages-hindi.js")
    hi_pattern = re.compile(r'id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*text:\s*"([^"]+)"', re.DOTALL)
    for m in hi_pattern.finditer(hi_code):
        pid, title, cat, text_raw = m.groups()
        text = clean_text(text_raw)
        category = "upsssc_ja" if any(k in title for k in ["पंचायती", "डिजिटल", "ई-गवर्नेंस"]) else "up_police_co"
        passages.append({
            "id": f"cgl-hi-{pid}",
            "title": f"UPSSSC: {title} (Mangal Inscript)",
            "language": "hindi_mangal",
            "category": category,
            "duration": 15,
            "wordCount": len(text.split()),
            "difficulty": "medium",
            "text": text
        })
        
    # 2. English Passages
    en_code = fetch_url("https://cgltyping.in/assets/js/passages.js")
    en_pattern = re.compile(r'id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*text:\s*"([^"]+)"', re.DOTALL)
    for m in en_pattern.finditer(en_code):
        pid, title, cat, text_raw = m.groups()
        text = clean_text(text_raw)
        passages.append({
            "id": f"cgl-en-{pid}",
            "title": f"UP Police CO: {title}",
            "language": "english",
            "category": "up_police_co",
            "duration": 15,
            "wordCount": len(text.split()),
            "difficulty": "medium",
            "text": text
        })
        
    print(f"[+] Retrieved {len(passages)} passages from CGLTyping (Hindi & English)")
    return passages

def scrape_artyping_demo():
    print("[*] Checking AR Typing Platform free demo passages...")
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
                        passages.append({
                            "id": f"ar-free-{pid}",
                            "title": f"[AR Typing] {title}",
                            "language": "hindi_kruti" if int(lang_id) == 2 else "english",
                            "category": "up_police_co",
                            "duration": 15,
                            "wordCount": len(text.split()),
                            "difficulty": "medium",
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

    print(f"[+] Appending {len(unique_passages)} new unique passages to passages.ts...")

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
    all_passages = []
    all_passages.extend(scrape_typemangal())
    all_passages.extend(scrape_cgltyping())
    all_passages.extend(scrape_artyping_demo())
    
    print(f"[*] Total unique passages harvested from free sources: {len(all_passages)}")
    added = update_passages_file(all_passages)
    print(f"[*] Sync completed. {added} newly integrated passages ready.")

if __name__ == "__main__":
    main()
