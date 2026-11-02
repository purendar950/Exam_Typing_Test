#!/usr/bin/env python3
"""
Formats and enriches passages.ts with:
1. Strict UP Police categories: 'up_police_co' and 'up_police_asi'
2. Strict languages: 'hindi_mangal', 'hindi_kruti', 'english'
3. Date-wise tagging: 'date': 'YYYY-MM-DD'
4. Clean, authentic exam titles
"""

import os
import re
from datetime import datetime, timedelta

PASSAGES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src/data/passages.ts"))

with open(PASSAGES_FILE, "r", encoding="utf-8") as f:
    full_content = f.read()

lessons_idx = full_content.find("export const MANGAL_LESSONS")
passages_part = full_content[:lessons_idx]
lessons_part = full_content[lessons_idx:]

raw_chunks = re.split(r'(?=\s*\{\s*id:\s*[\'"])', passages_part)
extracted = []

for chunk in raw_chunks:
    if not chunk.strip().startswith("{"):
        continue
    
    id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", chunk)
    title_m = re.search(r"title:\s*['\"](.*?)['\"]", chunk)
    lang_m = re.search(r"language:\s*['\"]([^'\"]+)['\"]", chunk)
    cat_m = re.search(r"category:\s*['\"]([^'\"]+)['\"]", chunk)
    dur_m = re.search(r"duration:\s*(\d+)", chunk)
    wc_m = re.search(r"wordCount:\s*(\d+)", chunk)
    diff_m = re.search(r"difficulty:\s*['\"]([^'\"]+)['\"]", chunk)
    text_m = re.search(r"text:\s*`(.*?)`\s*\}", chunk, re.DOTALL)
    
    if not (id_m and title_m and lang_m and text_m):
        continue
        
    extracted.append({
        "id": id_m.group(1),
        "title": title_m.group(1),
        "language": lang_m.group(1),
        "category": cat_m.group(1) if cat_m else "up_police_co",
        "duration": int(dur_m.group(1)) if dur_m else 15,
        "wordCount": int(wc_m.group(1)) if wc_m else len(text_m.group(1).split()),
        "difficulty": diff_m.group(1) if diff_m else "medium",
        "text": text_m.group(1).strip()
    })

print(f"Extracted {len(extracted)} passages from passages.ts.")

# Clean and transform
cleaned_passages = []
base_date = datetime(2026, 11, 2) # Today

# Additional Kruti Dev passages for UP Police ASI
kruti_extras = [
    {
        "id": "up-kr-02",
        "title": "UP Police ASI: पुलिस कार्यालय अभिलेख एवं पत्राचार नियमावली (Kruti Dev)",
        "language": "hindi_kruti",
        "category": "up_police_asi",
        "duration": 15,
        "wordCount": 395,
        "difficulty": "medium",
        "date": "2026-11-02",
        "text": """उत्तर प्रदेश पुलिस महानिदेशालय एवं जिला पुलिस कार्यालयों में पत्राचार तथा प्रशासनिक अभिलेखों का संधारण एक अत्यंत उत्तरदायित्वपूर्ण कार्य है। सहायक उपनिरीक्षक (लिपिक एवं लेखा) पद पर नियुक्त कर्मचारियों को प्रतिदिन सरकारी पत्रावलियों, शासकीय आदेशों, सेवा पुस्तिकाओं और न्यायालयीन प्रपत्रों का प्रारूप तैयार करना होता है। कुर्ती देव फॉन्ट में कार्य करते समय रेमिंगटन कीबोर्ड के विशेष संप्रतीकों और मात्राओं की शुद्धता पर विशेष ध्यान दिया जाना चाहिए।

कार्यालय कार्यप्रणाली में गोपनीयता बनाए रखना और अभिलेखों को समयबद्ध रूप से उच्चाधिकारियों के समक्ष प्रस्तुत करना सेवा नियमों की प्रथम प्राथमिकता है। किसी भी अपराध पत्रावली अथवा प्रशासनिक टिप्पणी में त्रुटिहीन भाषा और स्पष्ट वर्तनी का होना अनिवार्य है। टंकण में थोड़ी सी असावधानी भी पत्राचार के मूल अर्थ को परिवर्तित कर सकती है। अतः परीक्षार्थियों को नियमित रूप से कठिन विधिक एवं प्रशासनिक शब्दावली का अभ्यास करना चाहिए।"""
    },
    {
        "id": "up-kr-03",
        "title": "UP Police ASI: पुलिस लेखा एवं रोकड़ बही संधारण प्रक्रिया (Kruti Dev)",
        "language": "hindi_kruti",
        "category": "up_police_asi",
        "duration": 15,
        "wordCount": 385,
        "difficulty": "hard",
        "date": "2026-11-01",
        "text": """पुलिस विभाग के लेखा अनुभाग में वित्तीय नियमों का पालन तथा बजट आवंटन का पारदर्शी प्रबंधन अति महत्वपूर्ण होता है। पुलिस कार्मिकों के वेतन भत्ते, यात्रा व्यय, भविष्य निधि और पेंशन संबंधी विवरणों को कंप्यूटर पर शुद्धता से अंकित करना लेखा लिपिक का प्राथमिक कर्तव्य है। टंकण परीक्षा में संख्यात्मक आंकड़ों, तिथियों और विशेष चिह्नों का सही संयोजन परीक्षार्थी की तकनीकी प्रवीणता को प्रमाणित करता है।

रोकड़ बही और दैनिक आय-व्यय के विवरणों में किसी भी प्रकार की ओवरराइटिंग या अशुद्धि अस्वीकार्य मानी जाती है। लेखा परीक्षा के दौरान सभी वाउचर और बिलों का मिलान बैंक स्टेटमेंट से किया जाता है। एक कुशल टंकक को तीव्र गति के साथ-साथ वित्तीय संवेदनशीलता और सतर्कता बनाए रखनी चाहिए। गति और शुद्धता का संतुलन ही परीक्षा में सफलता सुनिश्चित करता है।"""
    },
    {
        "id": "up-kr-04",
        "title": "UP Police ASI: प्राथमिकी एवं सामान्य दैनिकी प्रविष्टि (Kruti Dev)",
        "language": "hindi_kruti",
        "category": "up_police_asi",
        "duration": 15,
        "wordCount": 375,
        "difficulty": "easy",
        "date": "2026-10-31",
        "text": """थाना स्तर पर सामान्य दैनिकी (जीडी) और प्रथम सूचना रिपोर्ट (एफआईआर) का पंजीकरण पुलिस प्रशासन की बुनियादी प्रक्रिया है। इसमें घटना का समय, स्थान, पीड़ितों तथा गवाहों के बयान को यथावत और शुद्ध भाषा में टंकित किया जाता है। कंप्यूटर ऑपरेटर और लिपिकीय संवर्ग के कर्मचारियों से यह अपेक्षा की जाती है कि वे पीड़ित नागरिकों की बात को धैर्यपूर्वक सुनकर निष्पक्ष रूप से दर्ज करें।

डिजिटल तकनीक के इस युग में ऑनलाइन सीसीटीएनएस प्रणाली के माध्यम से सभी थानों को केंद्रीय सर्वर से जोड़ा जा चुका है। टंकक की गति जितनी अधिक और त्रुटिरहित होगी, पीड़ितों को उतनी ही शीघ्रता से न्याय और सहायता मिल सकेगी। प्रतिदिन निर्धारित समय में अभ्यास करने से टंकण की गति में निरंतर सुधार होता है।"""
    }
]

# We will assign dates in a rolling window:
# Hindi Mangal: 25 passages -> assign 2026-11-02 down to 2026-10-15
# English: 18 passages -> assign 2026-11-02 down to 2026-10-16
# Kruti Dev: 4 passages -> assign 2026-11-02 down to 2026-10-30

lang_counters = {"hindi_mangal": 0, "hindi_kruti": 0, "english": 0}

for p in extracted:
    title = p["title"]
    # Clean unwanted external exam prefixes
    clean_title = re.sub(r'^(SSC\s*(CHSL|CGL)|MP\s*CPCT|BSSC\s*(Inter Level|Clerk)?|High\s*Court\s*(RO|ARO)?|UPSSSC):\s*', '', title)
    clean_title = re.sub(r'^(UP\s*Police\s*(CO|ASI|Ops):\s*)+', '', clean_title)
    clean_title = re.sub(r'\[AR Typing\]\s*', '', clean_title)
    clean_title = clean_title.strip()
    
    # Classify strictly into up_police_asi or up_police_co
    asi_keywords = [
        "asi", "clerk", "न्याय", "प्रशासन", "संवैधानिक", "लेखा", "विधि",
        "अभिलेख", "पंचायती", "स्वास्थ्य", "शिक्षा", "राज", "governance",
        "administration", "judicial", "disaster", "banking", "sports", "rights"
    ]
    is_asi = any(k in title.lower() or k in clean_title.lower() for k in asi_keywords)
    
    category = "up_police_asi" if is_asi else "up_police_co"
    prefix = "UP Police ASI" if is_asi else "UP Police CO"
    
    # Language check
    lang = p["language"]
    if lang not in ["hindi_mangal", "hindi_kruti", "english"]:
        lang = "hindi_mangal"
        
    day_offset = lang_counters[lang] // 2 # 2 tests per day per language
    lang_counters[lang] += 1
    test_date = (base_date - timedelta(days=day_offset)).strftime("%Y-%m-%d")
    
    full_title = f"{prefix}: {clean_title}"
    if lang == "hindi_mangal" and "Mangal" not in full_title and "Inscript" not in full_title:
        pass # keep clean
    
    cleaned_passages.append({
        "id": p["id"],
        "title": full_title,
        "language": lang,
        "category": category,
        "duration": 15,
        "wordCount": len(p["text"].split()),
        "difficulty": p["difficulty"],
        "date": test_date,
        "text": p["text"]
    })

# Add Kruti extras
cleaned_passages.extend(kruti_extras)

# Sort passages so newest date is first, and group nicely
cleaned_passages.sort(key=lambda x: (x["date"], x["id"]), reverse=True)

print(f"Total formatted passages: {len(cleaned_passages)}")

# Format into TypeScript array
ts_items = []
for p in cleaned_passages:
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

print(f"[+] Successfully rewrote {PASSAGES_FILE} with date-wise UP Police CO & ASI passages.")
