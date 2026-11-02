#!/usr/bin/env python3
"""
Audits all passages in src/data/passages.ts against UP Police official benchmarks:
- English: minimum 500 words
- Hindi (Mangal & Kruti): minimum 400 words
"""

import os
import re

PASSAGES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src/data/passages.ts"))

with open(PASSAGES_FILE, "r", encoding="utf-8") as f:
    content = f.read()

lessons_idx = content.find("export const MANGAL_LESSONS")
passages_part = content[:lessons_idx]

raw_chunks = re.split(r'(?=\s*\{\s*id:\s*[\'"])', passages_part)

results = []
short_list = []

for chunk in raw_chunks:
    if not chunk.strip().startswith("{"):
        continue
    
    id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", chunk)
    title_m = re.search(r"title:\s*['\"](.*?)['\"]", chunk)
    lang_m = re.search(r"language:\s*['\"]([^'\"]+)['\"]", chunk)
    text_m = re.search(r"text:\s*`(.*?)`\s*\}", chunk, re.DOTALL)
    
    if not (id_m and title_m and lang_m and text_m):
        continue
        
    pid = id_m.group(1)
    title = title_m.group(1)
    lang = lang_m.group(1)
    body = text_m.group(1).strip()
    words = body.split()
    wc = len(words)
    
    req = 500 if lang == "english" else 400
    is_short = wc < req
    
    results.append({
        "id": pid,
        "title": title,
        "language": lang,
        "wordCount": wc,
        "required": req,
        "is_short": is_short
    })
    
    if is_short:
        short_list.append((pid, lang, wc, req, title))

print(f"Total passages audited: {len(results)}")
print(f"Passages below benchmark: {len(short_list)}")
print("-" * 60)
for s in short_list:
    print(f"[{s[1]}] {s[0]} ({s[2]}/{s[3]} words): {s[4]}")
