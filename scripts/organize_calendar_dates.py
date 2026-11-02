#!/usr/bin/env python3
"""
Organizes all passages in src/data/passages.ts so that:
1. Every passage is deduplicated (strictly 1 instance per unique ID).
2. Dates are systematically assigned across October and November 2026.
3. 2026-10-25 and 2026-10-24 (from user's screenshots) have distinct, mutually exclusive passages:
   - 2026-10-25:
     * Food Offers Nutrients That Supports Heart
     * Lawyers are Guardians of Rule of Law
     * Aishbagh - Forgotten Heritage of Lucknow
     * Railways and Crime Against Women
   - 2026-10-24:
     * e-Governance - Technology for Good Governance
     * Understanding of Government & Governance
     * Cyber Forensics & Police Network Infrastructure
     * Banking and Financial Inclusion
   - Other dates (2026-10-26, 2026-10-27, 2026-10-28, 2026-10-29, 2026-10-30, 2026-10-31, 2026-11-01, 2026-11-02) all have distinct sets!
"""

import os
import re
from datetime import datetime, timedelta

PASSAGES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src/data/passages.ts"))

with open(PASSAGES_FILE, "r", encoding="utf-8") as f:
    content = f.read()

lessons_idx = content.find("export const MANGAL_LESSONS")
passages_part = content[:lessons_idx]
lessons_part = content[lessons_idx:]

raw_chunks = re.split(r'(?=\s*\{\s*id:\s*[\'"])', passages_part)
seen_ids = set()
unique_passages = []

for chunk in raw_chunks:
    if not chunk.strip().startswith("{"): continue
    id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", chunk)
    title_m = re.search(r"title:\s*['\"](.*?)['\"]", chunk)
    lang_m = re.search(r"language:\s*['\"]([^'\"]+)['\"]", chunk)
    cat_m = re.search(r"category:\s*['\"]([^'\"]+)['\"]", chunk)
    dur_m = re.search(r"duration:\s*(\d+)", chunk)
    diff_m = re.search(r"difficulty:\s*['\"]([^'\"]+)['\"]", chunk)
    text_m = re.search(r"text:\s*`(.*?)`\s*\}", chunk, re.DOTALL)
    if not (id_m and title_m and lang_m and text_m): continue
    
    pid = id_m.group(1)
    if pid in seen_ids: continue
    seen_ids.add(pid)
    
    unique_passages.append({
        "id": pid,
        "title": title_m.group(1),
        "language": lang_m.group(1),
        "category": cat_m.group(1) if cat_m else "up_police_co",
        "duration": int(dur_m.group(1)) if dur_m else 15,
        "difficulty": diff_m.group(1) if diff_m else "medium",
        "text": text_m.group(1).strip(),
        "wordCount": len(text_m.group(1).strip().split())
    })

print(f"Total deduplicated passages: {len(unique_passages)}")

# Separate by language
english_passages = [p for p in unique_passages if p["language"] == "english"]
mangal_passages = [p for p in unique_passages if p["language"] == "hindi_mangal"]
kruti_passages = [p for p in unique_passages if p["language"] == "hindi_kruti"]

print(f"English: {len(english_passages)}, Mangal: {len(mangal_passages)}, Kruti: {len(kruti_passages)}")

# Assign English passages specific dates
# Specifically 2026-10-25 (Image 1)
p_25 = ["ar-food-nutrients-heart", "ar-lawyers-rule-law", "ar-aishbagh-lucknow", "ar-railways-crime-women"]
# Specifically 2026-10-24 (Image 2)
p_24 = ["ar-egov-good-gov", "ar-gov-governance", "up-en-01", "cgl-en-p01"]

# Remaining English passages
remaining_en = [p for p in english_passages if p["id"] not in p_25 and p["id"] not in p_24]

# Assign dates to English:
for p in english_passages:
    if p["id"] in p_25:
        p["date"] = "2026-10-25"
    elif p["id"] in p_24:
        p["date"] = "2026-10-24"

# Distribute remaining English across dates: 2026-10-26 to 2026-11-02
other_dates = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]
for i, p in enumerate(remaining_en):
    d = other_dates[i % len(other_dates)]
    p["date"] = d

# Distribute Mangal passages across dates: 2026-10-20 to 2026-11-02
mangal_dates = [(datetime(2026, 11, 2) - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(14)]
for i, p in enumerate(mangal_passages):
    d = mangal_dates[i % len(mangal_dates)]
    p["date"] = d

# Distribute Kruti passages across dates: 2026-10-25 to 2026-11-02
kruti_dates = ["2026-11-02", "2026-11-01", "2026-10-31", "2026-10-25"]
for i, p in enumerate(kruti_passages):
    d = kruti_dates[i % len(kruti_dates)]
    p["date"] = d

# Recombine and sort by date descending
all_sorted = english_passages + mangal_passages + kruti_passages
all_sorted.sort(key=lambda x: (x.get("date", ""), x["id"]), reverse=True)

# Format into TypeScript array
ts_items = []
for p in all_sorted:
    safe_title = p["title"].replace("'", "\\'")
    safe_text = p["text"].replace('`', '\\`').replace('${', '\\${')
    ts_items.append(f"""  {{
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

new_content = "import { Passage } from '../types';\n\nexport const PASSAGES: Passage[] = [\n" + ",\n".join(ts_items) + "\n];\n\n" + lessons_part

with open(PASSAGES_FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"[+] Successfully rewrote {PASSAGES_FILE} with {len(all_sorted)} deduplicated passages and clean dates.")

# Verify 2026-10-25 vs 2026-10-24
en_25 = [p["title"] for p in english_passages if p.get("date") == "2026-10-25"]
en_24 = [p["title"] for p in english_passages if p.get("date") == "2026-10-24"]
print("\nPassages for 2026-10-25:")
for t in en_25: print(f"  - {t}")
print("\nPassages for 2026-10-24:")
for t in en_24: print(f"  - {t}")
