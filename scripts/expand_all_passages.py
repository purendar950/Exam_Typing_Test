#!/usr/bin/env python3
"""
Expands all passages in src/data/passages.ts to strictly meet official UP Police benchmarks:
- English: minimum 500 words (guarantees >= 510 words)
- Hindi (Mangal & Kruti): minimum 400 words (guarantees >= 415 words)
"""

import os
import re

PASSAGES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src/data/passages.ts"))

with open(PASSAGES_FILE, "r", encoding="utf-8") as f:
    full_content = f.read()

lessons_idx = full_content.find("export const MANGAL_LESSONS")
passages_part = full_content[:lessons_idx]
lessons_part = full_content[lessons_idx:]

raw_chunks = re.split(r'(?=\s*\{\s*id:\s*[\'"])', passages_part)
seen_ids = set()
passages = []

for chunk in raw_chunks:
    if not chunk.strip().startswith("{"):
        continue
    
    id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", chunk)
    title_m = re.search(r"title:\s*['\"](.*?)['\"]", chunk)
    lang_m = re.search(r"language:\s*['\"]([^'\"]+)['\"]", chunk)
    cat_m = re.search(r"category:\s*['\"]([^'\"]+)['\"]", chunk)
    dur_m = re.search(r"duration:\s*(\d+)", chunk)
    diff_m = re.search(r"difficulty:\s*['\"]([^'\"]+)['\"]", chunk)
    date_m = re.search(r"date:\s*['\"]([^'\"]+)['\"]", chunk)
    text_m = re.search(r"text:\s*`(.*?)`\s*\}", chunk, re.DOTALL)
    
    if not (id_m and title_m and lang_m and text_m):
        continue
        
    pid = id_m.group(1)
    if pid in seen_ids:
        continue
    seen_ids.add(pid)
    
    passages.append({
        "id": pid,
        "title": title_m.group(1),
        "language": lang_m.group(1),
        "category": cat_m.group(1) if cat_m else "up_police_co",
        "duration": int(dur_m.group(1)) if dur_m else 15,
        "difficulty": diff_m.group(1) if diff_m else "medium",
        "date": date_m.group(1) if date_m else "2026-11-02",
        "text": text_m.group(1).strip()
    })

EN_PARAGRAPHS = [
    """In the operational architecture of Uttar Pradesh Police, technological adaptation has transformed administrative transparency and tactical responsiveness. The integration of modern analytical dashboards enables precinct supervisors to track incident lifecycles from emergency phone reporting through forensic evidence collection and final court submission. Computer operators stationed at district control centers must process voluminous textual transmissions including daily case diaries, special surveillance bulletins, and statutory notices under stringent time constraints.""",
    """Typographical precision remains foundational to digital governance within law enforcement agencies. Any transcription oversight or inadvertent omission during records entry can compromise the legal validity of prosecutorial documentation or cause administrative delays during judicial hearings. Candidates preparing for state recruitment examinations are therefore evaluated not merely on gross finger velocity across the keyboard, but fundamentally on sustained concentration, typographical discipline, and the ability to maintain above eighty-five percent accuracy throughout the full fifteen-minute testing interval.""",
    """Effective administrative governance depends heavily upon the reliable flow of documented information between government departments and citizen service points. Modern public administration frameworks prioritize rapid grievance redressal, digital land record verification, and unified public distribution pipelines that eliminate procedural bottlenecks. Within this administrative matrix, clerical officers and computer personnel function as essential conduits who transcribe official memoranda, verify citizen petitions, and record departmental audit filings.""",
    """Operating under official testing guidelines, prospective candidates must develop rhythmic cadence and avoid excessive backspacing, as inconsistent keystroke intervals quickly deplete net words per minute. Mastery of technical vocabulary, punctuation placement, and numerical data entry equips operators to execute high-volume clerical tasks with commendable efficiency in fast-paced government secretariats."""
]

HI_PARAGRAPHS = [
    """उत्तर प्रदेश पुलिस विभाग में सूचना प्रौद्योगिकी और कंप्यूटर अनुप्रयोगों का विस्तार दिन-प्रतिदिन बढ़ता जा रहा है। थानों से लेकर मुख्यालय तक अपराध अभिलेखों के ऑनलाइन संधारण, वायरलेस संदेशों के त्वरित प्रेषण और न्यायालयीन साक्ष्यों के डिजिटलीकरण के लिए कुशल कंप्यूटर ऑपरेटरों की भूमिका अनिवार्य हो चुकी है। अपराध एवं अपराधी ट्रैकिंग नेटवर्क सिस्टम (सीसीटीएनएस) के सुचारू संचालन से जांच अधिकारियों को आवश्यक सूचनाएं वास्तविक समय में उपलब्ध हो पाती हैं।""",
    """टंकण परीक्षा में सफल होने के लिए अभ्यर्थी को न केवल गति बल्कि पूर्ण शुद्धता पर भी विशेष ध्यान देना आवश्यक है। आधिकारिक नियमों के अनुसार पंद्रह मिनट की निर्धारित अवधि में न्यूनतम पच्चीस शुद्ध शब्द प्रति मिनट की गति और पचासी प्रतिशत शुद्धता अनिवार्य है। असावधानीपूर्वक किए गए गलत टंकण से अभिलेखों का विधिक महत्व प्रभावित हो सकता है। अतः नियमित अभ्यास, एकाग्रता और उंगलियों के सही संतुलन से ही इस परीक्षा में उत्कृष्ट प्रदर्शन संभव है।""",
    """राज्य प्रशासन में सुशासन और पारदर्शिता स्थापित करने के लिए ई-ऑफिस और डिजिटल सचिवालय प्रणाली को प्रभावी रूप से लागू किया गया है। सरकारी पत्रावलियों के त्वरित निस्तारण, जनसुनवाई पोर्टल पर प्राप्त शिकायतों के समयबद्ध समाधान और जनहितकारी योजनाओं के कुशल क्रियान्वयन के लिए दक्ष कर्मचारियों की अत्यधिक आवश्यकता रहती है। कंप्यूटर पर कार्य करने वाले लिपिकीय संवर्ग के कर्मचारी प्रशासनिक मशीनरी की रीढ़ की तरह कार्य करते हैं।""",
    """कार्यालयीन टंकण में विराम चिह्नों, मात्राओं और कठिन प्रशासनिक शब्दावली का सही प्रयोग अत्यंत महत्वपूर्ण होता है। टंकक को स्क्रीन पर दृष्टि गड़ाए रखने के साथ-साथ अपनी गति को नियंत्रित रखना चाहिए ताकि बैकस्पेस के अनावश्यक प्रयोग से बचा जा सके। निरंतर अभ्यास और शुद्धता पर केंद्रित रहकर ही परीक्षार्थी चयन बोर्ड द्वारा निर्धारित मानकों को सफलतापूर्वक उत्तीर्ण कर सकते हैं।"""
]

KRUTI_PARAGRAPHS = [
    """उत्तर प्रदेश पुलिस महानिदेशालय एवं जिला पुलिस कार्यालयों में पत्राचार तथा प्रशासनिक अभिलेखों का संधारण एक अत्यंत उत्तरदायित्वपूर्ण कार्य है। सहायक उपनिरीक्षक (लिपिक एवं लेखा) पद पर नियुक्त कर्मचारियों को प्रतिदिन सरकारी पत्रावलियों, शासकीय आदेशों, सेवा पुस्तिकाओं और न्यायालयीन प्रपत्रों का प्रारूप तैयार करना होता है। कुर्ती देव फॉन्ट में कार्य करते समय रेमिंगटन कीबोर्ड के विशेष संप्रतीकों और मात्राओं की शुद्धता पर विशेष ध्यान दिया जाना चाहिए।""",
    """कार्यालय कार्यप्रणाली में गोपनीयता बनाए रखना और अभिलेखों को समयबद्ध रूप से उच्चाधिकारियों के समक्ष प्रस्तुत करना सेवा नियमों की प्रथम प्राथमिकता है। किसी भी अपराध पत्रावली अथवा प्रशासनिक टिप्पणी में त्रुटिहीन भाषा और स्पष्ट वर्तनी का होना अनिवार्य है। टंकण में थोड़ी सी असावधानी भी पत्राचार के मूल अर्थ को परिवर्तित कर सकती है। अतः परीक्षार्थियों को नियमित रूप से कठिन विधिक एवं प्रशासनिक शब्दावली का अभ्यास करना चाहिए।""",
    """पुलिस विभाग के लेखा अनुभाग में वित्तीय नियमों का पालन तथा बजट आवंटन का पारदर्शी प्रबंधन अति महत्वपूर्ण होता है। पुलिस कार्मिकों के वेतन भत्ते, यात्रा व्यय, भविष्य निधि और पेंशन संबंधी विवरणों को कंप्यूटर पर शुद्धता से अंकित करना लेखा लिपिक का प्राथमिक कर्तव्य है। टंकण परीक्षा में संख्यात्मक आंकड़ों, तिथियों और विशेष चिह्नों का सही संयोजन परीक्षार्थी की तकनीकी प्रवीणता को प्रमाणित करता है।""",
    """रोकड़ बही और दैनिक आय-व्यय के विवरणों में किसी भी प्रकार की ओवरराइटिंग या अशुद्धि अस्वीकार्य मानी जाती है। लेखा परीक्षा के दौरान सभी वाउचर और बिलों का मिलान बैंक स्टेटमेंट से किया जाता है। एक कुशल टंकक को तीव्र गति के साथ-साथ वित्तीय संवेदनशीलता और सतर्कता बनाए रखनी चाहिए। गति और शुद्धता का संतुलन ही परीक्षा में सफलता सुनिश्चित करता है।"""
]

for p in passages:
    lang = p["language"]
    target_words = 510 if lang == "english" else 415
    cur_words = len(p["text"].split())
    
    if cur_words < target_words:
        bank = EN_PARAGRAPHS if lang == "english" else (KRUTI_PARAGRAPHS if lang == "hindi_kruti" else HI_PARAGRAPHS)
        idx = 0
        while len(p["text"].split()) < target_words:
            p["text"] = p["text"] + "\n\n" + bank[idx % len(bank)]
            idx += 1
            
    p["text"] = re.sub(r'[ \t]+', ' ', p["text"]).strip()
    p["wordCount"] = len(p["text"].split())

# Check minimums
for p in passages:
    w = p["wordCount"]
    req = 500 if p["language"] == "english" else 400
    assert w >= req, f"Error: {p['id']} has {w} words, less than required {req}"

print(f"All {len(passages)} passages verified! English >= 500 words, Hindi >= 400 words.")

ts_items = []
for p in passages:
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

print(f"[+] Successfully wrote {len(passages)} verified passages to {PASSAGES_FILE}")
