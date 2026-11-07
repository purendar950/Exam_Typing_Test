#!/usr/bin/env python3
"""
Automated Daily AR Typing Platform Ingestion Pipeline
Authenticates with AR Typing Platform, checks for new daily date-wise passages
in English, Hindi Mangal Inscript, and Hindi Kruti Dev, enforces UP Police word count
benchmarks (>= 500 English, >= 400 Hindi), and updates src/data/passages.ts & public/passages-by-date.json.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

API_BASE = "https://artypingplatform-efb5438ddb1b.herokuapp.com/api/v1"
PASSAGES_TS = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src/data/passages.ts"))
PASSAGES_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/passages-by-date.json"))

EN_PADDING = """In the operational architecture of Uttar Pradesh Police, technological adaptation has transformed administrative transparency and tactical responsiveness. The integration of modern analytical dashboards enables precinct supervisors to track incident lifecycles from emergency phone reporting through forensic evidence collection and final court submission. Computer operators stationed at district control centers must process voluminous textual transmissions including daily case diaries, special surveillance bulletins, and statutory notices under stringent time constraints.

Typographical precision remains foundational to digital governance within law enforcement agencies. Any transcription oversight or inadvertent omission during records entry can compromise the legal validity of prosecutorial documentation or cause administrative delays during judicial hearings. Candidates preparing for state recruitment examinations are therefore evaluated not merely on gross finger velocity across the keyboard, but fundamentally on sustained concentration, typographical discipline, and the ability to maintain above eighty-five percent accuracy throughout the full fifteen-minute testing interval. Consistent keyboard drills and systematic text auditing cultivate the motor memory necessary for high-speed administrative documentation."""

HI_MANGAL_PADDING = """आधुनिक समाज के सर्वांगीण विकास के लिए बुनियादी ढांचे, जनस्वास्थ्य, शिक्षा और पर्यावरण संरक्षण का समन्वित विकास अपरिहार्य है। ग्रामीण एवं शहरी क्षेत्रों में संचालित विकास योजनाओं के वित्तीय आंकड़ों, प्रगति आख्याओं और लाभार्थी सूचियों का सटीक डिजिटल अभिलेखीकरण सरकारी नीतियों की सफलता तय करता है। जब विभागीय कर्मचारी आधुनिक कंप्यूटर उपकरणों और त्वरित टंकण कौशल से संपन्न होते हैं तो शासकीय कार्यों में अनावश्यक विलंब समाप्त हो जाता है।

प्रतियोगी टंकण परीक्षा में सम्मिलित होने वाले अभ्यर्थियों को चाहिए कि वे विविध सामाजिक, आर्थिक एवं विधिक विषयों से संबंधित अनुच्छेदों पर टंकण का गहन अभ्यास करें। अभ्यास के दौरान शुद्धता को सर्वोच्च प्राथमिकता देनी चाहिए क्योंकि शुद्ध टंकण ही नेट गति को बढ़ाता है और परीक्षा में सफलता का मार्ग प्रशस्त करता है। उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड द्वारा आयोजित कंप्यूटर ऑपरेटर परीक्षा में निर्धारित गति एवं उच्च शुद्धता प्राप्त करना ही अंतिम चयन का आधार बनता है।"""

HI_KRUTI_PADDING = """vk/kqfud lekt ds lokZaxh.k fodkl ds fy, cqfu;knh <kaps] tuLokLF;] f'k{kk vkSj i;kZoj.k laj{k.k dk leUfor fodkl vifjgk;Z gSA xzkeh.k ,oa 'kgjh {ks=ksa esa lapkfyr fodkl ;kstukvksa ds foÙkh; vkpadM+ksa] izxfr vk[;kvksa vkSj ykHkkFkhZ lwfp;ksa dk lVhd fMftVy vfHkys[khdj.k ljdkjh uhfr;ksa dh liQyrk r; djrk gSA tc foHkkxh; deZpkjh vk/kqfud dEI;wVj midj.kksa vkSj Rofjr Vad.k dkS'ky ls laiUu gksrs gSa rks 'kkldh; dk;ksZa esa vuko';d foyac lekIr gks tkrk gSA

izfr;ksxh Vad.k ijh{kk esa lfEefyr gksus okys vH;fFkZ;ksa dks pkfg, fd os fofo/k lkekftd] vkfFkZd ,oa fof/kd fo"k;ksa ls lacaf/kr vuqPNsnksa ij Vad.k dk xgu vH;kl djsaA vH;kl ds nkSjku 'kq¼rk dks loksZPp izkFkfedrk nsuh pkfg, D;ksafd 'kq¼ Vad.k gh usV xfr dks c<+krk gS vkSj ijh{kk esa liQyrk dk ekxZ iz'kLr djrk gSA mÙkj izns'k iqfyl HkrhZ ,oa izksUufr cksMZ }kjk vk;ksftr dEI;wVj vkWijsVj ijh{kk esa fu/kkZfjr xfr ,oa mPp 'kq¼rk izkIr djuk gh vafre p;u dk vk/kkj curk gSA"""

def get_token():
    email = os.environ.get("ARTYPING_EMAIL")
    password = os.environ.get("ARTYPING_PASSWORD")
    if not email or not password:
        raise ValueError("ARTYPING_EMAIL and ARTYPING_PASSWORD environment variables are required.")
    url = f"{API_BASE}/jwt/create/"
    data = json.dumps({"email": email, "password": password}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
    res = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
    return res["access"]

def ensure_word_count(text, lang):
    words = text.split()
    count = len(words)
    if lang == "english" and count < 500:
        while len(text.split()) < 515:
            text = text + "\n\n" + EN_PADDING
    elif lang in ("hindi_mangal", "hindi_kruti") and count < 400:
        padding = HI_KRUTI_PADDING if lang == "hindi_kruti" else HI_MANGAL_PADDING
        while len(text.split()) < 415:
            text = text + "\n\n" + padding
    return text.strip(), len(text.split())

def map_difficulty(diff_str):
    d = str(diff_str).upper()
    return "easy" if d == "E" else "hard" if d == "H" else "medium"

def run_sync():
    token = get_token()
    today = datetime.now()
    dates_to_check = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

    # Load existing passages
    existing_passages = []
    if os.path.exists(PASSAGES_JSON):
        with open(PASSAGES_JSON, "r", encoding="utf-8") as f:
            existing_passages = json.load(f)

    existing_ids = set(p["id"] for p in existing_passages)
    new_found = 0

    lang_map = [(1, "english"), (2, "hindi_kruti"), (3, "hindi_mangal")]

    for d in dates_to_check:
        for lang_id, lang_name in lang_map:
            url = f"{API_BASE}/learning/passages/?language={lang_id}&created_at={d}"
            try:
                req = urllib.request.Request(url, headers={"Authorization": f"JWT {token}", "User-Agent": "Mozilla/5.0"})
                items = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
            except Exception:
                continue

            for it in items:
                pid = it["id"]
                custom_id = f"ar-{pid}"
                if custom_id in existing_ids:
                    continue

                # Fetch detail
                detail_url = f"{API_BASE}/learning/passages/?id={pid}"
                try:
                    d_req = urllib.request.Request(detail_url, headers={"Authorization": f"JWT {token}", "User-Agent": "Mozilla/5.0"})
                    d_res = json.loads(urllib.request.urlopen(d_req, timeout=15).read().decode())
                    detail = d_res[0] if isinstance(d_res, list) else d_res
                    raw_text = detail.get("passage_text", "").strip()
                except Exception:
                    continue

                if not raw_text:
                    continue

                title = detail.get("title", it.get("title", f"AR Passage {pid}"))
                text, final_count = ensure_word_count(raw_text, lang_name)
                diff = map_difficulty(detail.get("difficulty", it.get("difficulty", "M")))
                category = "up_police_asi" if "ASI" in title or pid % 2 == 1 else "up_police_co"

                new_entry = {
                    "id": custom_id,
                    "title": title,
                    "language": lang_name,
                    "category": category,
                    "duration": 15,
                    "wordCount": final_count,
                    "difficulty": diff,
                    "date": d,
                    "text": text
                }
                existing_passages.insert(0, new_entry)
                existing_ids.add(custom_id)
                new_found += 1
                print(f"[+] Synced new passage: {custom_id} ({title}) for date {d}")

    if new_found > 0:
        print(f"[*] Ingested {new_found} new passages. Updating files...")
        with open(PASSAGES_JSON, "w", encoding="utf-8") as f:
            json.dump(existing_passages, f, ensure_ascii=False, indent=2)

        import subprocess
        subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "fix_passages_ts.py")], check=True)
        print("[+] Sync complete and src/data/passages.ts successfully updated.")
    else:
        print("[*] All latest passages are already up-to-date.")

if __name__ == "__main__":
    run_sync()
