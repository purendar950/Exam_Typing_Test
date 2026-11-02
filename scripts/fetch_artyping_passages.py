#!/usr/bin/env python3
"""
AR Typing Platform Automated Passage Ingestion Pipeline
Fetches latest exam passages from artypingplatform.com and integrates them into up-computer-operator-typing
"""

import urllib.request
import re
import json
import os
import sys

BASE_URL = "https://www.artypingplatform.com"
API_BASE = "https://artypingplatform-efb5438ddb1b.herokuapp.com/api/v1"

def get_page_content(url):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.read().decode("utf-8", errors="ignore")

def extract_manifest_chunks(html):
    manifest_match = re.search(r'/_next/static/([a-zA-Z0-9_-]+)/_buildManifest\.js', html)
    if not manifest_match:
        print("[!] Could not find build manifest hash")
        return []
    
    build_id = manifest_match.group(1)
    manifest_url = f"{BASE_URL}/_next/static/{build_id}/_buildManifest.js"
    print(f"[*] Fetching build manifest: {manifest_url}")
    manifest_content = get_page_content(manifest_url)
    
    chunks = set(re.findall(r'static/chunks/([a-zA-Z0-9_-]+)\.js', manifest_content))
    return list(chunks)

def scrape_passages():
    print(f"[*] Connecting to {BASE_URL}...")
    home_html = get_page_content(BASE_URL)
    chunks = extract_manifest_chunks(home_html)
    print(f"[*] Found {len(chunks)} chunks in manifest")

    extracted_passages = []

    # Check chunks for passage definitions
    for chunk in chunks:
        if not ("8286" in chunk or "demo" in chunk or "select" in chunk or "exam" in chunk or "main" in chunk):
            continue
        chunk_url = f"{BASE_URL}/_next/static/chunks/{chunk}.js"
        try:
            content = get_page_content(chunk_url)
        except Exception as e:
            continue

        if "let tf=[" in content:
            print(f"[+] Found passage table in chunk: {chunk}")
            start = content.find("let tf=[") + 7
            depth = 0
            idx = start
            while idx < len(content):
                if content[idx] == '[':
                    depth += 1
                elif content[idx] == ']':
                    depth -= 1
                    if depth == 0:
                        break
                idx += 1
            raw_array = content[start:idx+1]

            # Split objects
            items = re.split(r'\}\s*,\s*\{', raw_array)
            for item in items:
                # Extract id, title, language, passage_text
                id_m = re.search(r'id\s*:\s*(\d+)', item)
                title_m = re.search(r'title\s*:\s*["\']([^"\']+)["\']', item)
                lang_m = re.search(r'language\s*:\s*(\d+)', item)
                text_m = re.search(r'passage_text\s*:\s*(["\'])(.*?)\1(?:\s*\}|\s*$)', item, re.DOTALL)

                if title_m and text_m:
                    pid = id_m.group(1) if id_m else str(len(extracted_passages) + 1)
                    title = title_m.group(1)
                    lang_id = int(lang_m.group(1)) if lang_m else 1
                    raw_text = text_m.group(2)

                    # Unescape JS strings
                    cleaned_text = raw_text.replace('\\"', '"').replace("\\'", "'").replace('\\n', ' ')
                    cleaned_text = re.sub(r'\\x([0-9a-fA-F]{2})', lambda m: chr(int(m.group(1), 16)), cleaned_text)
                    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

                    # Determine language type: 1 = English, 2 = Hindi Kruti, 3 = Hindi Mangal
                    lang_key = 'english'
                    category = 'up_police_co'
                    if lang_id == 2 or re.search(r'[\u0900-\u097F]', title) or "अयोध्या" in title or "Hkwifr" in cleaned_text:
                        # Kruti Dev or Hindi
                        if "v;ks" in cleaned_text or "Jh" in cleaned_text or "jke" in cleaned_text:
                            lang_key = 'hindi_kruti'
                        else:
                            lang_key = 'hindi_mangal'
                    elif lang_id == 3:
                        lang_key = 'hindi_mangal'

                    extracted_passages.append({
                        "id": f"ar-daily-{pid}",
                        "title": f"[Daily AR] {title}",
                        "language": lang_key,
                        "category": category,
                        "duration": 15,
                        "wordCount": len(cleaned_text.split()),
                        "difficulty": "medium",
                        "text": cleaned_text
                    })

    # Also check public API for latest UP Police / UPPSC / UPSSSC exams
    try:
        print(f"[*] Querying backend API at {API_BASE}/exams/...")
        exams_json = get_page_content(f"{API_BASE}/exams/")
        exams = json.loads(exams_json)
        print(f"[+] Retrieved {len(exams)} exam categories from API")
        for exam in exams:
            if any(term in exam.get("title", "").lower() for term in ["up", "police", "operator", "upsssc", "uppsc"]):
                print(f"    - Found relevant exam: {exam.get('title')}")
    except Exception as e:
        print(f"[!] API query note: {e}")

    print(f"[+] Total passages extracted: {len(extracted_passages)}")
    return extracted_passages

if __name__ == "__main__":
    passages = scrape_passages()
    for p in passages:
        print(f"- {p['id']}: {p['title']} ({p['language']}, {p['wordCount']} words)")
