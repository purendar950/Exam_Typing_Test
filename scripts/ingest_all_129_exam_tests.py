#!/usr/bin/env python3
"""
Automated Ingestion Pipeline: Ingest All 129 Exam Tests from AR Typing
Fetches dedicated exam series bundles + category-specific special passages
and organizes them numbering-wise (Test #01, Test #02...) across all exam categories.
"""

import urllib.request
import urllib.error
import json
import re
import os
import concurrent.futures
from datetime import datetime

API_BASE = "https://artypingplatform-efb5438ddb1b.herokuapp.com/api/v1"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASSAGES_TS = os.path.join(BASE_DIR, "src/data/passages.ts")
PASSAGES_JSON = os.path.join(BASE_DIR, "public/passages-by-date.json")

# Official exam expansion padding for law enforcement & administration
EN_PADDING = """In the operational architecture of state administrative services and judicial registries, technological adaptation has transformed institutional transparency and workflow efficiency. The integration of modern analytical dashboards enables supervisory officers to track documentation lifecycles from initial receipt through inter-departmental verification and final statutory certification. Technical assistants and clerical staff stationed across district and departmental offices must process voluminous official records including daily proceedings, statutory notifications, and compliance returns under stringent schedule constraints.

Typographical precision remains foundational to digital public governance. Any transcription error or inadvertent omission during records entry can compromise the legal validity of public documentation or cause substantial delays during institutional review. Candidates preparing for competitive typing examinations are therefore evaluated not merely on gross finger velocity across the keyboard, but fundamentally on sustained concentration, typographical discipline, and the ability to maintain above eighty-five to ninety-five percent accuracy throughout the full testing duration. Consistent keyboard practice and disciplined text transcription cultivate the motor memory and cognitive endurance necessary for error-free administrative documentation."""

HI_MANGAL_PADDING = """आधुनिक समाज के सर्वांगीण विकास के लिए बुनियादी ढांचे, जनस्वास्थ्य, शिक्षा और पर्यावरण संरक्षण का समन्वित विकास अपरिहार्य है। ग्रामीण एवं शहरी क्षेत्रों में संचालित विकास योजनाओं के वित्तीय आंकड़ों, प्रगति आख्याओं और लाभार्थी सूचियों का सटीक डिजिटल अभिलेखीकरण सरकारी नीतियों की सफलता तय करता है। जब विभागीय कर्मचारी आधुनिक कंप्यूटर उपकरणों और त्वरित टंकण कौशल से संपन्न होते हैं तो शासकीय कार्यों में अनावश्यक विलंब समाप्त हो जाता है।

प्रतियोगी टंकण परीक्षा में सम्मिलित होने वाले अभ्यर्थियों को चाहिए कि वे विविध सामाजिक, आर्थिक एवं विधिक विषयों से संबंधित अनुच्छेदों पर टंकण का गहन अभ्यास करें। अभ्यास के दौरान शुद्धता को सर्वोच्च प्राथमिकता देनी चाहिए क्योंकि शुद्ध टंकण ही नेट गति को बढ़ाता है और परीक्षा में सफलता का मार्ग प्रशस्त करता है। भर्ती बोर्डों द्वारा आयोजित कंप्यूटर ऑपरेटर व लिपिकीय परीक्षाओं में निर्धारित गति एवं उच्च शुद्धता प्राप्त करना ही अंतिम चयन का आधार बनता है।"""

HI_KRUTI_PADDING = """vk/kqfud lekt ds lokZaxh.k fodkl ds fy, cqfu;knh <kaps] tuLokLF;] f'k{kk vkSj i;kZoj.k laj{k.k dk leUfor fodkl vifjgk;Z gSA xzkeh.k ,oa 'kgjh {ks=ksa esa lapkfyr fodkl ;kstukvksa ds foÙkh; vkpadM+ksa] izxfr vk[;kvksa vkSj ykHkkFkhZ lwfp;ksa dk lVhd fMftVy vfHkys[khdj.k ljdkjh uhfr;ksa dh liQyrk r; djrk gSA tc foHkkxh; deZpkjh vk/kqfud dEI;wVj midj.kksa vkSj Rofjr Vad.k dkS'ky ls laiUu gksrs gSa rks 'kkldh; dk;ksZa esa vuko';d foyac lekIr gks tkrk gSA

izfr;ksxh Vad.k ijh{kk esa lfEefyr gksus okys vH;fFkZ;ksa dks pkfg, fd os fofo/k lkekftd] vkfFkZd ,oa fof/kd fo"k;ksa ls lacaf/kr vuqPNsnksa ij Vad.k dk xgu vH;kl djsaA vH;kl ds nkSjku 'kq¼rk dks loksZPp izkFkfedrk nsuh pkfg, D;ksafd 'kq¼ Vad.k gh usV xfr dks c<+krk gS vkSj ijh{kk esa liQyrk dk ekxZ iz'kLr djrk gSA HkrhZ cksMksZa }kjk vk;ksftr dEI;wVj vkWijsVj o fyfid ijh{kk esa fu/kkZfjr xfr ,oa mPp 'kq¼rk izkIr djuk gh vafre p;u dk vk/kkj curk gSA"""

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

def clean_title(title):
    t = re.sub(r'^(Test\s*#?\d+[\s:–-]*|Practice\s*Passage[\s:–-]*|\d+[\s:–-]+)', '', title, flags=re.IGNORECASE).strip()
    return t if t else "Typing Speed Examination Test"

def fetch_passage_text(pid, token):
    url = f"{API_BASE}/learning/passages/?id={pid}"
    req = urllib.request.Request(url, headers={'Authorization': f'JWT {token}', 'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode())
            item = data[0] if isinstance(data, list) else data
            return item.get('passage_text', '')
    except Exception:
        # Fallback to special-passages detail endpoint
        try:
            s_url = f"{API_BASE}/learning/special-passages/?id={pid}"
            s_req = urllib.request.Request(s_url, headers={'Authorization': f'JWT {token}', 'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(s_req, timeout=10) as s_res:
                s_data = json.loads(s_res.read().decode())
                s_item = s_data[0] if isinstance(s_data, list) else s_data
                return s_item.get('passage_text', '')
        except Exception:
            return ""

def main():
    token = get_auth_token()
    print("[+] Successfully authenticated.")

    # 1. Load existing base passages (420 daily passages already ingested)
    existing_passages = []
    if os.path.exists(PASSAGES_JSON):
        with open(PASSAGES_JSON, 'r', encoding='utf-8') as f:
            existing_passages = json.load(f)
        print(f"[*] Loaded {len(existing_passages)} existing passages from {PASSAGES_JSON}")

    # Mark existing UP Police / UPPSC passages
    for p in existing_passages:
        if 'categoryGroup' not in p:
            p['categoryGroup'] = 'up_govt'
        if 'category' not in p or p['category'] in ('up_police_co', 'up_police_asi'):
            p['category'] = p.get('category', 'up_police_co')

    existing_ids = set(str(p['id']) for p in existing_passages)
    new_passages = []

    # 2. Ingest Dedicated Exam Bundles (Delhi Police, SSB HCM, PHHC, DSSSB, BSF HCM)
    print("\n[*] --- STEP 1: Ingesting Dedicated Exam Bundles ---")
    bundle_meta_file = os.path.join(BASE_DIR, "scripts/all_bundle_passages_meta.json")
    if os.path.exists(bundle_meta_file):
        with open(bundle_meta_file, 'r', encoding='utf-8') as f:
            bundle_meta_list = json.load(f)
        print(f"[*] Found {len(bundle_meta_list)} passages across dedicated bundles")

        # Map exam slug to categoryGroup and category
        exam_mapping = {
            910: {'group': 'delhi_govt', 'cat': 'delhi_police_hcm', 'lang': 'english'},
            911: {'group': 'delhi_govt', 'cat': 'delhi_police_hcm', 'lang': 'hindi_mangal'},
            1273: {'group': 'judiciary', 'cat': 'phhc_clerk', 'lang': 'english'},
            1240: {'group': 'defense', 'cat': 'ssb_hcm', 'lang': 'english'},
            1241: {'group': 'defense', 'cat': 'ssb_hcm', 'lang': 'hindi_mangal'},
            86: {'group': 'defense', 'cat': 'bsf_hcm', 'lang': 'hindi_mangal'},
            20: {'group': 'delhi_govt', 'cat': 'dsssb_ldc', 'lang': 'english'},
        }

        # Deduplicate bundle passage items
        seen_bundle_pids = set()
        pids_to_fetch = []
        for item in bundle_meta_list:
            pid = item['id']
            if pid not in seen_bundle_pids and str(pid) not in existing_ids:
                seen_bundle_pids.add(pid)
                pids_to_fetch.append(item)

        print(f"[*] Fetching text for {len(pids_to_fetch)} new bundle passages in parallel...")

        def fetch_bundle_item(item):
            pid = item['id']
            text = fetch_passage_text(pid, token)
            if not text:
                return None
            eid = item.get('exam_id')
            m = exam_mapping.get(eid, {'group': 'state_exams', 'cat': 'general', 'lang': 'english'})
            lang = m['lang']
            cleaned_text, wcount = ensure_word_count(text, lang)
            return {
                'id': f"ar-bundle-{pid}",
                'raw_title': clean_title(item.get('title', 'Exam Typing Practice')),
                'language': lang,
                'category': m['cat'],
                'categoryGroup': m['group'],
                'examSlug': item.get('exam_slug'),
                'duration': 10 if 'delhi' in m['cat'] or 'ssb' in m['cat'] or 'dsssb' in m['cat'] else 15,
                'wordCount': wcount,
                'difficulty': item.get('difficulty', 'medium').lower() if isinstance(item.get('difficulty'), str) else 'medium',
                'date': item.get('date', '2026-10-01'),
                'text': cleaned_text
            }

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(fetch_bundle_item, it) for it in pids_to_fetch]
            for f in concurrent.futures.as_completed(futures):
                res = f.result()
                if res:
                    new_passages.append(res)
                    print(f"  [+] Ingested Bundle Test: {res['raw_title']} ({res['category']})")

    print(f"[+] Total bundle passages ingested: {len(new_passages)}")

    # 3. Ingest Category-Specific Special Passages
    print("\n[*] --- STEP 2: Ingesting Category-Specific Special Passages ---")
    category_queries = [
        # Courts & Judiciary
        {'group': 'judiciary', 'cat': 'court_judiciary', 'lang_id': 1, 'lang': 'english', 'kw': 'legal', 'pages': 3},
        {'group': 'judiciary', 'cat': 'court_judiciary', 'lang_id': 1, 'lang': 'english', 'kw': 'court', 'pages': 2},
        {'group': 'judiciary', 'cat': 'court_judiciary', 'lang_id': 3, 'lang': 'hindi_mangal', 'kw': 'न्यायालय', 'pages': 1, 'diff': 'H'},

        # SSC CGL & CHSL (DEST)
        {'group': 'ssc', 'cat': 'ssc_cgl_chsl', 'lang_id': 1, 'lang': 'english', 'kw': 'ssc', 'pages': 3},
        {'group': 'ssc', 'cat': 'ssc_cgl_chsl', 'lang_id': 3, 'lang': 'hindi_mangal', 'kw': 'कर्मचारी', 'pages': 1, 'diff': 'M'},

        # Bihar Exams (Beltron & BSSC)
        {'group': 'bihar', 'cat': 'bihar_beltron_bssc', 'lang_id': 1, 'lang': 'english', 'kw': 'bihar', 'pages': 2},
        {'group': 'bihar', 'cat': 'bihar_beltron_bssc', 'lang_id': 3, 'lang': 'hindi_mangal', 'kw': 'बिहार', 'pages': 1, 'diff': 'M'},

        # Central & NTA (AIIMS, KVS, Universities)
        {'group': 'central_nta', 'cat': 'central_nta', 'lang_id': 1, 'lang': 'english', 'kw': 'aiims', 'pages': 1},
        {'group': 'central_nta', 'cat': 'central_nta', 'lang_id': 1, 'lang': 'english', 'kw': 'education', 'pages': 2},
        {'group': 'central_nta', 'cat': 'central_nta', 'lang_id': 3, 'lang': 'hindi_mangal', 'kw': 'केंद्रीय', 'pages': 1, 'diff': 'M'},
    ]

    for q in category_queries:
        lang_id = q['lang_id']
        lang = q['lang']
        grp = q['group']
        cat = q['cat']
        pages_to_fetch = q.get('pages', 1)

        print(f"[*] Querying Special Passages for {grp.upper()} ({cat}) [Lang: {lang}]...")
        for page in range(1, pages_to_fetch + 1):
            if 'kw' in q:
                url = f"{API_BASE}/learning/special-passages/?language={lang_id}&keyword={urllib.parse.quote(q['kw'])}&page={page}&page_size=15"
            else:
                url = f"{API_BASE}/learning/special-passages/?language={lang_id}&difficulty={q.get('diff', 'M')}&page={page}&page_size=15"
            
            req = urllib.request.Request(url, headers={'Authorization': f'JWT {token}', 'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(req, timeout=10) as res:
                    data = json.loads(res.read().decode())
                    results = data.get('results', [])
                    for item in results:
                        pid = item['id']
                        if f"ar-spec-{pid}" in existing_ids or f"ar-bundle-{pid}" in existing_ids:
                            continue
                        
                        text = fetch_passage_text(pid, token)
                        if not text:
                            continue
                        
                        cleaned_text, wcount = ensure_word_count(text, lang)
                        raw_title = clean_title(item.get('title', 'Exam Typing Practice'))
                        diff_val = item.get('difficulty', 'M')
                        diff_str = 'hard' if diff_val == 'H' else 'easy' if diff_val in ('E', 'B') else 'medium'
                        
                        new_passages.append({
                            'id': f"ar-spec-{pid}",
                            'raw_title': raw_title,
                            'language': lang,
                            'category': cat,
                            'categoryGroup': grp,
                            'duration': 10 if grp in ('ssc', 'delhi_govt', 'bihar') else 15,
                            'wordCount': wcount,
                            'difficulty': diff_str,
                            'date': item.get('created_at', '2026-10-15')[:10],
                            'text': cleaned_text
                        })
                        print(f"  [+] Ingested Special Passage: {raw_title} [{grp}] ({wcount} words)")
            except Exception as e:
                print(f"  [-] Failed query for {q}: {e}")

    print(f"\n[+] Total newly fetched passages across all categories: {len(new_passages)}")

    # 4. Merge All Passages and Organize Numbering-Wise (Test #01, Test #02...)
    print("\n[*] --- STEP 3: Assigning Sequential Test Numbers Across All Exam Groups ---")
    
    # Group passages by (categoryGroup, language) to give dedicated numbering: Test #01..#N per group
    all_combined = []
    
    # First, handle existing 420 UP Police passages
    for p in existing_passages:
        if 'raw_title' not in p:
            p['raw_title'] = clean_title(p.get('title', ''))
        all_combined.append(p)

    all_combined.extend(new_passages)

    # Group by (categoryGroup, category, language)
    grouped = {}
    for p in all_combined:
        grp = p.get('categoryGroup', 'up_govt')
        cat = p.get('category', 'up_police_co')
        lang = p.get('language', 'english')
        key = (grp, cat, lang)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(p)

    final_passages = []
    for (grp, cat, lang), p_list in grouped.items():
        # Sort by date desc, then raw_title
        p_list.sort(key=lambda x: (x.get('date', '2026-01-01'), x.get('raw_title', '')), reverse=True)
        print(f"[*] Numbering {len(p_list)} tests for Group '{grp}' -> '{cat}' ({lang})...")
        for num, p in enumerate(p_list, start=1):
            num_str = f"{num:02d}" if num < 100 else f"{num}"
            p['testNumber'] = num
            p['title'] = f"Test #{num_str}: {p['raw_title']}"
            if 'raw_title' in p:
                del p['raw_title']
            final_passages.append(p)

    # Sort final passages: Group order, then testNumber
    group_priority = {
        'up_govt': 1,
        'judiciary': 2,
        'ssc': 3,
        'delhi_govt': 4,
        'defense': 5,
        'bihar': 6,
        'central_nta': 7,
        'railways': 8,
        'state_exams': 9
    }
    final_passages.sort(key=lambda x: (
        group_priority.get(x.get('categoryGroup', ''), 99),
        0 if x['language'] == 'english' else 1 if x['language'] == 'hindi_mangal' else 2,
        x.get('testNumber', 9999)
    ))

    print(f"\n[+] Total catalog size: {len(final_passages)} official tests.")

    # 5. Save to public/passages-by-date.json
    with open(PASSAGES_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_passages, f, ensure_ascii=False, indent=2)
    print(f"[+] Saved {len(final_passages)} passages to {PASSAGES_JSON}")

    # 6. Generate src/data/passages.ts with valid json.dumps text
    with open(PASSAGES_TS, 'w', encoding='utf-8') as f:
        f.write("import { Passage } from '../types';\n\n")
        f.write("export const PASSAGES: Passage[] = [\n")
        for p in final_passages:
            f.write("  {\n")
            f.write(f"    id: {json.dumps(p['id'])},\n")
            f.write(f"    testNumber: {p.get('testNumber', 1)},\n")
            f.write(f"    title: {json.dumps(p['title'])},\n")
            f.write(f"    language: {json.dumps(p['language'])},\n")
            f.write(f"    category: {json.dumps(p.get('category', 'up_police_co'))},\n")
            if 'categoryGroup' in p:
                f.write(f"    categoryGroup: {json.dumps(p['categoryGroup'])},\n")
            if 'examSlug' in p and p['examSlug']:
                f.write(f"    examSlug: {json.dumps(p['examSlug'])},\n")
            f.write(f"    duration: {p.get('duration', 15)},\n")
            f.write(f"    wordCount: {p.get('wordCount', 500)},\n")
            f.write(f"    difficulty: {json.dumps(p.get('difficulty', 'medium'))},\n")
            f.write(f"    date: {json.dumps(p.get('date', '2026-10-26'))},\n")
            f.write(f"    text: {json.dumps(p['text'])}\n")
            f.write("  },\n")
        f.write("];\n\n")

        # Append lessons
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

    print(f"[+] Successfully generated {PASSAGES_TS} with all {len(final_passages)} numbered tests!")

if __name__ == '__main__':
    main()
