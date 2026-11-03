#!/usr/bin/env python3
"""
Full Automated Pipeline to fetch all date-wise passages from AR Typing Platform,
format and pad them to official word count standards (>= 500 English, >= 400 Hindi),
assign sequential test numbering (Test #01, Test #02, etc.), and generate
both public/passages-by-date.json and src/data/passages.ts.
"""

import urllib.request
import urllib.error
import json
import os
import sys
import re
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

API_BASE = "https://artypingplatform-efb5438ddb1b.herokuapp.com/api/v1"
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PASSAGES_TS = os.path.join(BASE_DIR, "src/data/passages.ts")
PASSAGES_JSON = os.path.join(BASE_DIR, "public/passages-by-date.json")

# Official exam expansion padding for law enforcement & administration:
EN_PADDING = """In the operational architecture of Uttar Pradesh Police, technological adaptation has transformed administrative transparency and tactical responsiveness. The integration of modern analytical dashboards enables precinct supervisors to track incident lifecycles from emergency phone reporting through forensic evidence collection and final court submission. Computer operators stationed at district control centers must process voluminous textual transmissions including daily case diaries, special surveillance bulletins, and statutory notices under stringent time constraints.

Typographical precision remains foundational to digital governance within law enforcement agencies. Any transcription oversight or inadvertent omission during records entry can compromise the legal validity of prosecutorial documentation or cause administrative delays during judicial hearings. Candidates preparing for state recruitment examinations are therefore evaluated not merely on gross finger velocity across the keyboard, but fundamentally on sustained concentration, typographical discipline, and the ability to maintain above eighty-five percent accuracy throughout the full fifteen-minute testing interval. Consistent keyboard drills and systematic text auditing cultivate the motor memory necessary for high-speed administrative documentation."""

HI_MANGAL_PADDING = """आधुनिक समाज के सर्वांगीण विकास के लिए बुनियादी ढांचे, जनस्वास्थ्य, शिक्षा और पर्यावरण संरक्षण का समन्वित विकास अपरिहार्य है। ग्रामीण एवं शहरी क्षेत्रों में संचालित विकास योजनाओं के वित्तीय आंकड़ों, प्रगति आख्याओं और लाभार्थी सूचियों का सटीक डिजिटल अभिलेखीकरण सरकारी नीतियों की सफलता तय करता है। जब विभागीय कर्मचारी आधुनिक कंप्यूटर उपकरणों और त्वरित टंकण कौशल से संपन्न होते हैं तो शासकीय कार्यों में अनावश्यक विलंब समाप्त हो जाता है।

प्रतियोगी टंकण परीक्षा में सम्मिलित होने वाले अभ्यर्थियों को चाहिए कि वे विविध सामाजिक, आर्थिक एवं विधिक विषयों से संबंधित अनुच्छेदों पर टंकण का गहन अभ्यास करें। अभ्यास के दौरान शुद्धता को सर्वोच्च प्राथमिकता देनी चाहिए क्योंकि शुद्ध टंकण ही नेट गति को बढ़ाता है और परीक्षा में सफलता का मार्ग प्रशस्त करता है। उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड द्वारा आयोजित कंप्यूटर ऑपरेटर परीक्षा में निर्धारित गति एवं उच्च शुद्धता प्राप्त करना ही अंतिम चयन का आधार बनता है।"""

HI_KRUTI_PADDING = """vk/kqfud lekt ds lokZaxh.k fodkl ds fy, cqfu;knh <kaps] tuLokLF;] f'k{kk vkSj i;kZoj.k laj{k.k dk leUfor fodkl vifjgk;Z gSA xzkeh.k ,oa 'kgjh {ks=ksa esa lapkfyr fodkl ;kstukvksa ds foÙkh; vkpadM+ksa] izxfr vk[;kvksa vkSj ykHkkFkhZ lwfp;ksa dk lVhd fMftVy vfHkys[khdj.k ljdkjh uhfr;ksa dh liQyrk r; djrk gSA tc foHkkxh; deZpkjh vk/kqfud dEI;wVj midj.kksa vkSj Rofjr Vad.k dkS'ky ls laiUu gksrs gSa rks 'kkldh; dk;ksZa esa vuko';d foyac lekIr gks tkrk gSA

izfr;ksxh Vad.k ijh{kk esa lfEefyr gksus okys vH;fFkZ;ksa dks pkfg, fd os fofo/k lkekftd] vkfFkZd ,oa fof/kd fo"k;ksa ls lacaf/kr vuqPNsnksa ij Vad.k dk xgu vH;kl djsaA vH;kl ds nkSjku 'kq¼rk dks loksZPp izkFkfedrk nsuh pkfg, D;ksafd 'kq¼ Vad.k gh usV xfr dks c<+krk gS vkSj ijh{kk esa liQyrk dk ekxZ iz'kLr djrk gSA mÙkj izns'k iqfyl HkrhZ ,oa izksUufr cksMZ }kjk vk;ksftr dEI;wVj vkWijsVj ijh{kk esa fu/kkZfjr xfr ,oa mPp 'kq¼rk izkIr djuk gh vafre p;u dk vk/kkj curk gSA"""

def get_auth_token():
    print("[*] Authenticating with AR Typing Platform API...")
    url = f"{API_BASE}/jwt/create/"
    data = json.dumps({
        'email': 'purendar_test_pipeline_2026@gmail.com',
        'password': 'PassWord@12345!'
    }).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    res = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
    return res['access']

def ensure_word_count(text, lang):
    words = text.split()
    count = len(words)
    if lang == 'english':
        if count < 500:
            while len(text.split()) < 515:
                text = text + "\n\n" + EN_PADDING
    elif lang in ('hindi_mangal', 'hindi_kruti'):
        padding = HI_KRUTI_PADDING if lang == 'hindi_kruti' else HI_MANGAL_PADDING
        if count < 400:
            while len(text.split()) < 415:
                text = text + "\n\n" + padding
    return text.strip(), len(text.split())

def map_difficulty(diff_str):
    d = str(diff_str).upper()
    if d == 'E':
        return 'easy'
    elif d == 'H':
        return 'hard'
    return 'medium'

def clean_title(raw_title):
    # Remove existing 'Test #123:' if already present
    t = re.sub(r'^Test\s*#?\d+\s*[-:]\s*', '', raw_title, flags=re.IGNORECASE).strip()
    return t if t else raw_title

def main():
    token = get_auth_token()
    headers = {'Authorization': f'JWT {token}', 'User-Agent': 'Mozilla/5.0'}

    print("[*] Scanning date-wise passage catalogs across 60 days...")
    base_date = datetime(2024, 11, 4)
    dates = [(base_date - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(60)]

    lang_map = [
        (1, 'english'),
        (2, 'hindi_kruti'),
        (3, 'hindi_mangal')
    ]

    items_to_fetch = []
    seen_ids = set()

    for d in dates:
        for lang_id, lang_name in lang_map:
            url = f"{API_BASE}/learning/passages/?language={lang_id}&created_at={d}"
            try:
                req = urllib.request.Request(url, headers=headers)
                items = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
                for item in items:
                    pid = item['id']
                    if pid not in seen_ids:
                        seen_ids.add(pid)
                        items_to_fetch.append({
                            'id': pid,
                            'title': item.get('title', f'Passage {pid}'),
                            'language': lang_name,
                            'difficulty': item.get('difficulty', 'M'),
                            'date': d
                        })
            except Exception:
                pass

    print(f"[+] Total unique passages to fetch from AR Typing: {len(items_to_fetch)}")

    # Fetch full texts in parallel
    print("[*] Downloading full passage texts in parallel...")
    fetched_passages = []

    def fetch_detail(meta):
        pid = meta['id']
        url = f"{API_BASE}/learning/passages/?id={pid}"
        try:
            req = urllib.request.Request(url, headers=headers)
            res = json.loads(urllib.request.urlopen(req, timeout=8).read().decode())
            detail = res[0] if isinstance(res, list) else res
            raw_text = detail.get('passage_text', '').strip()
            if not raw_text:
                return None
            title = detail.get('title', meta['title'])
            clean_t = clean_title(title)
            formatted_text, word_count = ensure_word_count(raw_text, meta['language'])
            diff = map_difficulty(detail.get('difficulty', meta['difficulty']))
            cat = 'up_police_asi' if 'ASI' in clean_t or 'Accounts' in clean_t or pid % 2 == 1 else 'up_police_co'

            return {
                'raw_id': pid,
                'id': f"ar-{pid}",
                'title': clean_t,
                'language': meta['language'],
                'category': cat,
                'duration': 15,
                'wordCount': word_count,
                'difficulty': diff,
                'date': meta['date'],
                'text': formatted_text
            }
        except Exception as e:
            return None

    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = [executor.submit(fetch_detail, m) for m in items_to_fetch]
        for idx, fut in enumerate(as_completed(futures), 1):
            res = fut.result()
            if res:
                fetched_passages.append(res)
            if idx % 50 == 0 or idx == len(futures):
                print(f"  [+] Progress: {idx}/{len(futures)} downloaded ({len(fetched_passages)} valid)")

    print(f"[+] Successfully downloaded {len(fetched_passages)} authentic passages from AR Typing!")

    # Load existing passages to ensure no tests are lost
    existing_passages = []
    if os.path.exists(PASSAGES_JSON):
        try:
            with open(PASSAGES_JSON, 'r', encoding='utf-8') as f:
                existing_passages = json.load(f)
        except Exception:
            existing_passages = []

    # Map existing by id
    all_map = {}
    for p in existing_passages:
        pid = str(p.get('id'))
        all_map[pid] = p

    # Merge newly fetched passages (new authentic texts update or append)
    for p in fetched_passages:
        pid = str(p['id'])
        all_map[pid] = p

    combined_passages = list(all_map.values())
    print(f"[+] Total merged passages count: {len(combined_passages)}")

    # NUMBERING-WISE ORGANIZATION:
    # We organize passages by language, sort them deterministically (by date desc, then id),
    # and assign sequential test numbers: Test #01, Test #02, Test #03, ...
    by_lang = {
        'english': [],
        'hindi_mangal': [],
        'hindi_kruti': []
    }

    for p in combined_passages:
        lang = p.get('language', 'english')
        if lang not in by_lang:
            by_lang[lang] = []
        by_lang[lang].append(p)

    final_numbered_passages = []

    for lang, p_list in by_lang.items():
        # Sort by date desc, then id
        p_list.sort(key=lambda x: (x.get('date', '2024-01-01'), str(x.get('id', ''))), reverse=True)
        print(f"[*] Assigning sequential test numbers for {lang.upper()} ({len(p_list)} tests)...")
        for num, p in enumerate(p_list, start=1):
            clean_t = clean_title(p.get('title', ''))
            num_str = f"{num:02d}" if num < 100 else f"{num}"
            p['testNumber'] = num
            p['title'] = f"Test #{num_str}: {clean_t}"
            final_numbered_passages.append(p)

    # Sort final list: English first (1..N), Hindi Mangal (1..N), Hindi Kruti (1..N)
    final_numbered_passages.sort(key=lambda x: (
        0 if x['language'] == 'english' else 1 if x['language'] == 'hindi_mangal' else 2,
        x.get('testNumber', 9999)
    ))

    # Save to public/passages-by-date.json
    os.makedirs(os.path.dirname(PASSAGES_JSON), exist_ok=True)
    with open(PASSAGES_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_numbered_passages, f, ensure_ascii=False, indent=2)
    print(f"[+] Written {len(final_numbered_passages)} numbered passages to {PASSAGES_JSON}")

    # Generate src/data/passages.ts
    os.makedirs(os.path.dirname(PASSAGES_TS), exist_ok=True)
    with open(PASSAGES_TS, 'w', encoding='utf-8') as f:
        f.write("import { Passage } from '../types';\n\n")
        f.write("export const PASSAGES: Passage[] = [\n")
        for p in final_numbered_passages:
            f.write("  {\n")
            f.write(f"    id: {json.dumps(p['id'])},\n")
            f.write(f"    testNumber: {p.get('testNumber', 1)},\n")
            f.write(f"    title: {json.dumps(p['title'])},\n")
            f.write(f"    language: {json.dumps(p['language'])},\n")
            f.write(f"    category: {json.dumps(p.get('category', 'up_police_co'))},\n")
            f.write(f"    duration: {p.get('duration', 15)},\n")
            f.write(f"    wordCount: {p.get('wordCount', 500)},\n")
            f.write(f"    difficulty: {json.dumps(p.get('difficulty', 'medium'))},\n")
            f.write(f"    date: {json.dumps(p.get('date', '2024-10-26'))},\n")
            f.write(f"    text: {json.dumps(p['text'])}\n")
            f.write("  },\n")
        f.write("];\n\n")
        f.write("export const MANGAL_LESSONS = [\n")
        f.write("  {\n    id: 'lesson-1',\n    title: 'Lesson 1: Home Row Basics (क र प ह स)',\n    keys: ['k', 'j', 'i', 'u', 'l'],\n    text: 'क र प ह स क र प ह स क र प ह स क र प ह स कर पर हर सर रस कस कप पस हक पक'\n  },\n")
        f.write("  {\n    id: 'lesson-2',\n    title: 'Lesson 2: Home Row Vowel Signs (ा ो े ्)',\n    keys: ['e', 'd', 'f', 'a'],\n    text: 'का को के क् रा रो रे र् पा पो पे प् हा हो हे ह् सा सो से स् कार कोर केर पार'\n  },\n")
        f.write("  {\n    id: 'lesson-3',\n    title: 'Lesson 3: Top Row Consonants (ब ग द ज ड)',\n    keys: ['y', 't', 'r', 'e', 'w'],\n    text: 'ब ग द ज ड ब ग द ज ड बद गज दब जब गड डग बाद गजरा दबा जबड़ा डगर गदर'\n  },\n")
        f.write("  {\n    id: 'lesson-4',\n    title: 'Lesson 4: Shift Combinations & Halant (क् ख ग घ)',\n    keys: ['k', 'K', 'i', 'I'],\n    text: 'क्या क्यों क्रम प्यार स्पष्ट ज्ञान क्षेत्र राष्ट्र प्रकाश प्रतिज्ञा उत्तर प्रदेश पुलिस'\n  }\n")
        f.write("];\n\n")
        f.write("export const ENGLISH_LESSONS = [\n")
        f.write("  {\n    id: 'en-lesson-1',\n    title: 'Lesson 1: Home Row (ASDF JKL;)',\n    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],\n    text: 'asdf jkl; asdf jkl; all fall dad glad flash flask salad lads asks fall half flask'\n  },\n")
        f.write("  {\n    id: 'en-lesson-2',\n    title: 'Lesson 2: Top Row (QWERTY UIOP)',\n    keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],\n    text: 'quiet power write require quote report priority output input proper write tower route'\n  },\n")
        f.write("  {\n    id: 'en-lesson-3',\n    title: 'Lesson 3: Bottom Row (ZXCVBNM)',\n    keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],\n    text: 'zoom calm voice zero zinc victim civil combine bonus matrix carbon common vacuum'\n  },\n")
        f.write("  {\n    id: 'en-lesson-4',\n    title: 'Lesson 4: Capital Letters & Special Punctuation',\n    keys: ['Shift', '.', ',', '-', '\"'],\n    text: 'Uttar Pradesh Police, Computer Operator Grade-A: Speed 30 WPM, Accuracy 85.0%!'\n  }\n")
        f.write("];\n")

    print(f"[+] Successfully generated {PASSAGES_TS} with {len(final_numbered_passages)} numbered passages.")

if __name__ == '__main__':
    main()
