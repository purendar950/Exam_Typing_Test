#!/usr/bin/env python3
"""
Automated Daily Multi-Exam AI Passage Generator with Failover Chain
Generates official competitive typing exam passages calibrated to:
- UP Police Computer Operator & ASI (15 min, 540w EN, 430w HI Hard)
- High Courts: Allahabad HC RO/ARO (15 min, Legal Judgments) & Delhi HC JJA (10 min)
- SSC CGL / CHSL DEST (10-15 min, Alphanumerics, %, Figures, Shift-Key)
- Defense & Paramilitary: BSF / CISF / CRPF HCM (10 min, Military Protocols)
- Bihar Beltron DEO & Railways RRB NTPC (10 min, Land Records & Logistics)
- Hindi Kruti Dev 010 & Mangal Inscript variants

Multi-Provider Failover Chain:
1. Google Gemini 2.0 Flash (GEMINI_API_KEY)
2. Groq Cloud Llama 3.3 (GROQ_API_KEY)
3. OpenRouter Free Tier (OPENROUTER_API_KEY)
4. OpenAI GPT-4o Mini (OPENAI_API_KEY)

Updates both:
- public/passages-by-date.json (Master JSON Bank)
- src/data/passages.ts (TypeScript Compiled Bank)
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASSAGES_JSON = os.path.join(BASE_DIR, "public/passages-by-date.json")
PASSAGES_TS = os.path.join(BASE_DIR, "src/data/passages.ts")
ENV_FILE = os.path.join(BASE_DIR, ".env")

# Load .env file if present
if os.path.exists(ENV_FILE):
    try:
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k not in os.environ and v:
                        os.environ[k] = v
    except Exception:
        pass

# ── Multi-Provider Failover Chain Definition ─────────────────────────────────
def get_configured_providers():
    providers = []

    # 1. Google Gemini
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
    if gemini_key:
        providers.append({
            "name": "Google Gemini 2.0 Flash (Primary)",
            "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            "key": gemini_key.strip(),
            "model": "gemini-2.0-flash",
            "headers": {"Content-Type": "application/json", "Authorization": f"Bearer {gemini_key.strip()}"}
        })

    # 2. Groq Cloud
    groq_key = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")
    if groq_key:
        providers.append({
            "name": "Groq Cloud Llama 3.3 (Fallback 1)",
            "url": "https://api.groq.com/openai/v1/chat/completions",
            "key": groq_key.strip(),
            "model": "llama-3.3-70b-versatile",
            "headers": {"Content-Type": "application/json", "Authorization": f"Bearer {groq_key.strip()}"}
        })

    # 3. OpenRouter
    openrouter_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("VITE_OPENROUTER_API_KEY")
    if openrouter_key:
        providers.append({
            "name": "OpenRouter (Fallback 2)",
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "key": openrouter_key.strip(),
            "model": "google/gemini-2.0-flash-exp:free",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openrouter_key.strip()}",
                "HTTP-Referer": "https://purendar950.github.io/Exam_Typing_Test/",
                "X-Title": "Exam Typing Test Automated Generator"
            }
        })

    # 4. OpenAI
    openai_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("VITE_OPENAI_API_KEY")
    if openai_key:
        providers.append({
            "name": "OpenAI GPT-4o Mini (Fallback 3)",
            "url": "https://api.openai.com/v1/chat/completions",
            "key": openai_key.strip(),
            "model": "gpt-4o-mini",
            "headers": {"Content-Type": "application/json", "Authorization": f"Bearer {openai_key.strip()}"}
        })

    return providers

def call_llm_with_failover(system_prompt, user_prompt, max_tokens=3500, temperature=0.7):
    providers = get_configured_providers()
    if not providers:
        raise RuntimeError("No AI API keys found. Set GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY.")

    errors = []
    for prov in providers:
        try:
            print(f"  [AI] Trying {prov['name']} with model {prov['model']}...")
            payload = json.dumps({
                "model": prov["model"],
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens
            }).encode("utf-8")

            req = urllib.request.Request(prov["url"], data=payload, headers=prov["headers"], method="POST")
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if content and content.strip():
                    print(f"  [AI] ✅ Success with {prov['name']}!")
                    return content.strip(), prov["name"]
        except Exception as err:
            print(f"  [AI] ⚠️ {prov['name']} failed: {err}. Switching to next provider in failover chain...")
            errors.append(f"{prov['name']}: {err}")

    raise RuntimeError(f"All {len(providers)} AI providers failed in failover chain: {' | '.join(errors)}")

# ── JSON & Markdown Extractor ────────────────────────────────────────────────
def extract_passage_json(raw_text, default_title="Official Test Passage"):
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    # Try direct JSON parse
    try:
        obj = json.loads(text)
        if isinstance(obj, dict) and "text" in obj and obj["text"].strip():
            clean_body = re.sub(r"[\r\n]+", " ", obj["text"]).strip()
            clean_body = re.sub(r"\s+", " ", clean_body)
            return (obj.get("title") or default_title).strip(), clean_body
    except Exception:
        pass

    # Extract balanced { ... }
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            obj = json.loads(m.group(0))
            if isinstance(obj, dict) and "text" in obj and obj["text"].strip():
                clean_body = re.sub(r"[\r\n]+", " ", obj["text"]).strip()
                clean_body = re.sub(r"\s+", " ", clean_body)
                return (obj.get("title") or default_title).strip(), clean_body
        except Exception:
            pass

    # Fallback regex
    title_m = re.search(r'"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"', text)
    title = title_m.group(1).strip() if title_m else default_title

    text_m = re.search(r'"text"\s*:\s*"([\s\S]*?)(?:"\s*\}|"$)', text)
    if text_m:
        raw_body = text_m.group(1).replace('\\"', '"').replace('\\n', ' ')
        clean_body = re.sub(r"\s+", " ", raw_body).strip()
        return title, clean_body

    # Final fallback: strip all markdown & punctuation
    clean_body = re.sub(r"^#+.*$", "", text, flags=re.MULTILINE)
    clean_body = re.sub(r"[{}]", "", clean_body)
    clean_body = re.sub(r"\s+", " ", clean_body).strip()
    return default_title, clean_body

# ── Balanced Daily Rotation Slot Configurations ─────────────────────────────
DAILY_ROTATION_SLOTS = [
    # 1. UP Police Computer Operator (English Medium)
    {
        "slot": 1,
        "language": "english",
        "difficulty": "medium",
        "category": "up_police_co",
        "categoryGroup": "up_govt",
        "examTitle": "UP Police Computer Operator & ASI",
        "duration": 15,
        "targetWords": 540,
        "subType": "UP Police English Medium",
        "topic": "Digital India, E-Governance & Police Automation Data Infrastructure",
        "system_prompt": "You are the principal typing examination passage author for Uttar Pradesh Police Recruitment Board (UPPRPB).",
        "user_prompt": """Generate an official competitive examination typing passage in standard English for UP Police Computer Operator Grade-A and ASI examinations.
Topic: Digital India, E-Governance & Police Automation Data Infrastructure
Target Word Count: Exactly 530 to 550 words for the 15-minute examination test.
Requirements:
1. Balanced administrative and socio-technical prose suitable for 30 to 35 WPM net speed.
2. Include official police references (e.g. CCTNS, UPPRPB, FIR, IT Act, Cyber Forensics), statistics, and percentages.
3. Exactly 3 continuous formal paragraphs. Absolutely NO bullet points, NO numbered lists, NO markdown.
Return ONLY valid JSON:
{
  "title": "UP Police CO & ASI: Digital Policing & E-Governance Infrastructure",
  "text": "Full continuous passage text here..."
}"""
    },
    # 2. UP Police Computer Operator (Hindi Mangal Hard - Long Words)
    {
        "slot": 2,
        "language": "hindi_mangal",
        "difficulty": "hard",
        "category": "up_police_co",
        "categoryGroup": "up_govt",
        "examTitle": "UP Police Computer Operator (दीर्घ शब्द)",
        "duration": 15,
        "targetWords": 430,
        "subType": "UP Police Hindi Mangal Hard (दीर्घ शब्द)",
        "topic": "साइबर अपराध जांच, डिजिटल साक्ष्य प्रमाणीकरण, उत्तरदायित्व एवं पुलिस प्रशासनिक चुनौतियाँ",
        "system_prompt": "आप उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB) के मुख्य टंकण सामग्री निर्माता हैं।",
        "user_prompt": """दिए गए विषय पर उत्तर प्रदेश पुलिस कंप्यूटर ऑपरेटर (ग्रेड-ए) एवं एएसआई टंकण परीक्षा के 'कठिन स्तर' (दीर्घ शब्द) के अनुसार आधिकारिक 15-मिनट की टंकण सामग्री तैयार करें।
विषय: साइबर अपराध जांच, डिजिटल साक्ष्य प्रमाणीकरण, उत्तरदायित्व एवं पुलिस प्रशासनिक चुनौतियाँ
लक्षित शब्द संख्या: ठीक 420 से 450 शब्द (15 मिनट हेतु)।
अनिवार्य मानक:
1. दीर्घ एवं सामासिक शब्द (Long Words): गद्यांश के प्रत्येक वाक्य में 8 से 16 अक्षर/मात्रा वाले भारी-भरकम शब्द होने चाहिए (जैसे: संवैधानिकता, उत्तरदायित्व, कार्यप्रणाली, प्रशासनिक, दूरसंचार, न्यायाधिकरण, पुनर्गठन, विभागाध्यक्ष, अंतर-विभागीय, विशेषज्ञता, प्रतिबद्धता, आत्मनिर्भरता, प्रमाणीकरण, कार्यकुशलता, सार्वभौमिकता, परिस्थितिजन्य, सुदृढ़ीकरण)।
2. कठिन संयुक्ताक्षर: द्ध (बुद्धि, शुद्ध), द्व (विद्वान, द्वार), द्य (उद्योग, विद्या), ष्ट (दृष्टिकोण, विशिष्ट), क्त (शक्ति, संयुक्त), ह्न (चिह्न), हृ (हृदय), त्त (उत्तरदायित्व), ट्र (ट्रैफिक, राष्ट्रीय), क्र (क्रम, प्रक्रिया)।
3. नुक्ता शब्द: ज़िला, फ़ैसला, क़ानून, ख़ास।
4. 3 निरंतर पैराग्राफ, कोई बुलेट नहीं।
केवल शुद्ध JSON दें:
{
  "title": "उत्तर प्रदेश पुलिस कंप्यूटर ऑपरेटर: साइबर अपराध एवं डिजिटल साक्ष्य",
  "text": "पूर्ण गद्यांश..."
}"""
    },
    # 3. Allahabad High Court RO/ARO (Legal Judgment & Citations)
    {
        "slot": 3,
        "language": "english",
        "difficulty": "hard",
        "category": "court_ahc",
        "categoryGroup": "judiciary",
        "examTitle": "Allahabad High Court RO / ARO (Legal Judgment)",
        "duration": 15,
        "targetWords": 520,
        "subType": "High Court Legal English (Citations & Judgment)",
        "topic": "Constitutional Jurisprudence, High Court Writ Jurisdiction, Evidentiary Proportionality & Criminal Appellate Review",
        "system_prompt": "You are the Chief Examination Controller and Senior Legal Registrar preparing official typing test passages for the High Court of Judicature at Allahabad.",
        "user_prompt": """Generate an official Allahabad High Court Review Officer (RO) / Assistant Review Officer (ARO) competitive typing passage in legal English.
Topic: Constitutional Jurisprudence, High Court Writ Jurisdiction, Evidentiary Proportionality & Criminal Appellate Review
Target Word Count: Exactly 510 to 530 words for the 15-minute examination hall test (50 Marks benchmark).
CRITICAL LEGAL REQUIREMENTS:
1. Authentic Case Citations & Statutory Sections: Include authentic citations (e.g. "(2022) 5 SCC 312", "Section 482 of Cr.P.C.", "Article 226(2) of the Constitution", "Section 138 of the Negotiable Instruments Act, 1881").
2. Latin Maxims & Legal Vocabulary: Use terms like "prima facie", "suo motu", "res judicata", "ultra vires", "inter alia", "ratio decidendi", "sub-judice".
3. Long Words & Syntax: High Average Word Length (AWL >= 7.5 letters/word), compound multi-clause sentences, semicolons, and paired quotes ("...").
4. Format: Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown.
Return ONLY valid JSON:
{
  "title": "Allahabad High Court RO/ARO: Appellate Jurisdiction & Constitutional Mandate",
  "text": "Full legal passage text here..."
}"""
    },
    # 4. Delhi High Court JJA
    {
        "slot": 4,
        "language": "english",
        "difficulty": "medium",
        "category": "court_delhi",
        "categoryGroup": "judiciary",
        "examTitle": "Delhi High Court Junior Judicial Assistant (JJA)",
        "duration": 10,
        "targetWords": 380,
        "subType": "Delhi Court English Medium",
        "topic": "Civil Procedure Directives, Subordinate Registry Filings & Statutory Declarations",
        "system_prompt": "You are the judicial examination evaluator for Delhi High Court recruitment examinations.",
        "user_prompt": """Generate an official Delhi High Court Junior Judicial Assistant (JJA) typing examination passage in standard legal English.
Topic: Civil Procedure Directives, Subordinate Registry Filings & Statutory Declarations
Target Word Count: Exactly 370 to 390 words for the 10-minute test (35 to 40 WPM benchmark).
Requirements: Legal proceedings terminology, registry procedures, statutory declarations, paired quotation marks, clean 3 paragraphs, no bullets.
Return ONLY valid JSON:
{
  "title": "Delhi High Court JJA: Civil Registry Procedures & Statutory Filings",
  "text": "Full passage text here..."
}"""
    },
    # 5. SSC CGL / CHSL DEST (Alphanumeric, Shift-Key, Figures)
    {
        "slot": 5,
        "language": "english",
        "difficulty": "hard",
        "category": "ssc_dest",
        "categoryGroup": "ssc",
        "examTitle": "SSC CGL / CHSL Data Entry Skill Test (DEST)",
        "duration": 15,
        "targetWords": 380,
        "subType": "SSC CGL DEO Alphanumeric (Codes, %, Figures)",
        "topic": "Union Ministry Financial Allocation, Audit Disclosures, Public Accounts & Expenditure Statistics",
        "system_prompt": "You are the Staff Selection Commission (SSC) examination director preparing official Data Entry Skill Test (DEST) passages.",
        "user_prompt": """Generate an official SSC DEST competitive examination typing passage in standard English.
Topic: Union Ministry Financial Allocation, Audit Disclosures, Public Accounts & Expenditure Statistics
Target Word Count: Exactly 370 to 390 words (approximately 1,850 key depressions) for the DEST module.
CRITICAL SSC DEST REQUIREMENTS:
1. Alphanumerics & Figures: Include monetary sums (e.g. "₹24,850.50", "Rs. 1,45,000/-"), percentages ("48.65%"), dates ("26.11.2008", "15th August 1947"), and serial file references ("Ref: MoF/Exp-2024/09").
2. Uppercase Acronyms (Shift-Key Strain): High frequency of capitalized abbreviations (e.g. "NITI Aayog", "CAG", "GSTN", "UIDAI", "AIIMS", "CBI", "MoF", "FY 2024-25").
3. Continuous 3 paragraphs, no bullet points, no markdown.
Return ONLY valid JSON:
{
  "title": "SSC CGL DEST: Union Ministry Fiscal Allocations & Audit Review",
  "text": "Full passage text here..."
}"""
    },
    # 6. SSC CHSL Hindi DEST
    {
        "slot": 6,
        "language": "hindi_mangal",
        "difficulty": "medium",
        "category": "ssc_dest",
        "categoryGroup": "ssc",
        "examTitle": "SSC CHSL Hindi DEST (1500 Key Depressions)",
        "duration": 10,
        "targetWords": 320,
        "subType": "SSC Hindi Mangal Medium",
        "topic": "केंद्रीय सतर्कता आयोग, राजकोषीय अनुशासन, आर्थिक नीतियां एवं बजट प्रबंधन",
        "system_prompt": "आप कर्मचारी चयन आयोग (SSC) के वरिष्ठ हिंदी टंकण परीक्षक हैं।",
        "user_prompt": """कर्मचारी चयन आयोग (SSC) सीएचएसएल डाटा एंट्री परीक्षा हेतु 1500 की-डिप्रेशन्स (लगभग 310 से 330 शब्द) का मानक हिंदी गद्यांश तैयार करें।
विषय: केंद्रीय सतर्कता आयोग, राजकोषीय अनुशासन, आर्थिक नीतियां एवं बजट प्रबंधन
मानक: मंगल इनस्क्रिप्ट कीबोर्ड पर 30 WPM की गति, वित्तीय आंकड़े, प्रतिशत, मानक विराम चिह्न, 3 निरंतर पैराग्राफ।
केवल शुद्ध JSON दें:
{
  "title": "एसएससी सीएचएसएल: राजकोषीय प्रबंधन एवं सतर्कता तंत्र",
  "text": "पूर्ण गद्यांश..."
}"""
    },
    # 7. Paramilitary HCM English Hard (BSF / CISF / CRPF)
    {
        "slot": 7,
        "language": "english",
        "difficulty": "hard",
        "category": "paramilitary_hcm",
        "categoryGroup": "defense",
        "examTitle": "BSF / CISF / CRPF Head Constable Ministerial (HCM)",
        "duration": 10,
        "targetWords": 370,
        "subType": "Paramilitary HCM English Hard",
        "topic": "Border Security Surveillance Protocols, Tactical Field Telecommunications & Central Armed Police Orders",
        "system_prompt": "You are the Central Armed Police Forces (CAPF) board evaluator creating Head Constable Ministerial (HCM) typing test materials for BSF, CISF, and CRPF.",
        "user_prompt": """Generate an official Paramilitary HCM competitive examination typing passage in standard English.
Topic: Border Security Surveillance Protocols, Tactical Field Telecommunications & Central Armed Police Orders
Target Word Count: Exactly 360 to 380 words for the 10-minute test (35 WPM benchmark with 5% strict mistake limit).
Requirements: Border vigilance architecture, tactical telemetry, surveillance drones, official circulars, average word length >= 7.0 letters/word, continuous 3 paragraphs, no bullets.
Return ONLY valid JSON:
{
  "title": "Paramilitary HCM: Border Security Surveillance & Communications",
  "text": "Full passage text here..."
}"""
    },
    # 8. Paramilitary HCM Hindi Hard (CRPF / SSB)
    {
        "slot": 8,
        "language": "hindi_mangal",
        "difficulty": "hard",
        "category": "paramilitary_hcm",
        "categoryGroup": "defense",
        "examTitle": "CRPF / SSB Head Constable Ministerial (हिंदी कठिन)",
        "duration": 10,
        "targetWords": 330,
        "subType": "Paramilitary HCM Hindi Hard",
        "topic": "आंतरिक सुरक्षा प्रबंधन, अग्रिम रक्षा चौकियां एवं सीमा सुरक्षा बल प्रशासनिक नियमावली",
        "system_prompt": "आप केंद्रीय सशस्त्र पुलिस बल (CAPF) के मुख्य हिंदी टंकण सामग्री परीक्षक हैं।",
        "user_prompt": """अर्धसैनिक बल (CRPF/BSF/SSB) हेड कांस्टेबल मिनिस्ट्रियल परीक्षा हेतु कठिन स्तर का आधिकारिक 10-मिनट का हिंदी टंकण गद्यांश तैयार करें।
विषय: आंतरिक सुरक्षा प्रबंधन, अग्रिम रक्षा चौकियां एवं सीमा सुरक्षा बल प्रशासनिक नियमावली
लक्षित शब्द संख्या: ठीक 320 से 340 शब्द।
मानक: सामरिक शब्दावली, दीर्घ सामासिक शब्द, कठिन संयुक्ताक्षर (द्ध, द्व, द्य, ष्ट, क्त, ह्न), नुक्ता शब्द (ज़िला, फ़ैसला, अग्रिम चौकी), 3 निरंतर पैराग्राफ।
केवल शुद्ध JSON दें:
{
  "title": "अर्धसैनिक बल मिनिस्ट्रियल: आंतरिक सुरक्षा एवं सीमा प्रबंधन",
  "text": "पूर्ण गद्यांश..."
}"""
    },
    # 9. Bihar Beltron DEO / BSSC Inter Level
    {
        "slot": 9,
        "language": "hindi_mangal",
        "difficulty": "medium",
        "category": "bihar_beltron",
        "categoryGroup": "bihar",
        "examTitle": "Bihar Beltron DEO / BSSC Inter Level",
        "duration": 10,
        "targetWords": 320,
        "subType": "Bihar Beltron Hindi Mangal",
        "topic": "बिहार भूमि राजस्व अभिलेख, लोक शिकायत निवारण अधिकार एवं पंचायती राज प्रशासन",
        "system_prompt": "आप बिहार राज्य इलेक्ट्रॉनिक्स विकास निगम (बेल्ट्रॉन) एवं बिहार कर्मचारी चयन आयोग के मुख्य टंकण सामग्री नियंत्रक हैं।",
        "user_prompt": """बिहार बेल्ट्रॉन डीईओ एवं बीएसएससी इंटर स्तरीय टंकण परीक्षा हेतु आधिकारिक 10-मिनट का हिंदी गद्यांश तैयार करें।
विषय: बिहार भूमि राजस्व अभिलेख, लोक शिकायत निवारण अधिकार एवं पंचायती राज प्रशासन
लक्षित शब्द संख्या: ठीक 310 से 330 शब्द (30 WPM मानक)।
मानक: खड़ी बोली हिंदी, बिहार प्रशासनिक शब्दावली, भूमि दाखिल-खारिज व लोक शिकायत संदर्भ, 3 निरंतर पैराग्राफ।
केवल शुद्ध JSON दें:
{
  "title": "बिहार बेल्ट्रॉन डीईओ: भूमि राजस्व एवं लोक शिकायत निवारण",
  "text": "पूर्ण गद्यांश..."
}"""
    },
    # 10. Railways RRB NTPC Senior Clerk
    {
        "slot": 10,
        "language": "english",
        "difficulty": "medium",
        "category": "rrb_ntpc",
        "categoryGroup": "railways",
        "examTitle": "Railways RRB NTPC Senior Clerk cum Typist",
        "duration": 10,
        "targetWords": 330,
        "subType": "Railways NTPC English Medium",
        "topic": "Indian Railways Dedicated Freight Corridors, Telemetry Signaling & Passenger Traffic Management",
        "system_prompt": "You are the Railway Recruitment Control Board (RRB) examination evaluator for RRB NTPC Senior Clerk cum Typist examinations.",
        "user_prompt": """Generate an official RRB NTPC Senior Clerk cum Typist typing examination passage in standard English.
Topic: Indian Railways Dedicated Freight Corridors, Telemetry Signaling & Passenger Traffic Management
Target Word Count: Exactly 320 to 340 words for the 10-minute test (30 WPM Eduquity formula standard).
Requirements: Railway logistics, signaling telemetry, rolling stock operations, safety systems, standard punctuation, continuous 3 paragraphs.
Return ONLY valid JSON:
{
  "title": "RRB NTPC: Dedicated Freight Corridors & Railway Logistics",
  "text": "Full passage text here..."
}"""
    }
]

def build_exam_calibrated_prompt(slot):
    """
    Constructs high-precision exam prompt matching AR Typing, EzTyping, and TestMentor standards.
    Supports all major Indian competitive typing exams.
    """
    if "system_prompt" in slot and "user_prompt" in slot and slot["system_prompt"] and slot["user_prompt"]:
        return slot["system_prompt"], slot["user_prompt"]

    cat = (slot.get("category") or "").lower()
    group = (slot.get("categoryGroup") or "").lower()
    lang = slot.get("language", "english")
    is_hindi = lang.startswith("hindi")
    is_kruti = lang == "hindi_kruti"
    is_hard = slot.get("difficulty") == "hard"
    topic = slot.get("topic", "Official Examination Passage")
    duration = slot.get("duration", 15)
    target_words = slot.get("targetWords", 540 if not is_hindi else 430)
    exam_title = slot.get("examTitle", "Competitive Typing Examination")

    is_judiciary = "court" in cat or "judiciary" in cat or "jja" in cat or group == "judiciary"
    is_ssc = "ssc" in cat or group == "ssc"
    is_defense = "paramilitary" in cat or "defense" in cat or "hcm" in cat or group == "defense"
    is_bihar = "bihar" in cat or "beltron" in cat or "bssc" in cat or group == "bihar"
    is_railways = "rrb" in cat or "ntpc" in cat or group == "railways"

    if not is_hindi:
        if is_judiciary:
            sys_p = "You are the Chief Examination Controller and Senior Legal Registrar preparing official typing test passages for High Court and Supreme Court typing examinations (Allahabad High Court RO/ARO, Delhi High Court JJA, Supreme Court JCA) as calibrated by AR Typing and TestMentor standards."
            usr_p = f"""Generate an authentic High Court competitive examination typing passage in legal English on '{topic}'.
Target Word Count: Exactly {target_words} words ({duration}-minute test).
CRITICAL HIGH COURT & JUDICIARY REQUIREMENTS:
1. Authentic Case Citations & Statutes: Naturally include realistic statutory provisions and Supreme Court / High Court citations (e.g. "(2022) 5 SCC 312", "AIR 2021 SC 1421", "Section 482 of Cr.P.C.", "Article 226(2) of the Constitution of India", "Section 138 of the Negotiable Instruments Act, 1881", "Order VII Rule 11 of C.P.C.").
2. Latin Maxims & Legal Terms: Naturally integrate Latin maxims (e.g. "inter alia", "suo motu", "res judicata", "ultra vires", "prima facie", "status quo", "ratio decidendi", "ad interim", "bona fide", "locus standi", "sub judice").
3. Judicial Syntactical Rhythm: Long, multi-clause compound sentences, paired double quotation marks ("..."), semicolons (;), and legal abbreviations ("Ltd.", "Govt.", "v.", "Anr.", "Ors.").
4. High Average Word Length (AWL >= 7.2): constitutionalism, jurisprudence, maintainability, inadmissibility, disproportionality, apprehension, superintendence.
5. Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown.
Return ONLY valid JSON:
{{
  "title": "{exam_title}",
  "text": "The complete legal judgment passage text here..."
}}"""
        elif is_ssc:
            sys_p = "You are the Staff Selection Commission (SSC) Examination Director preparing official Data Entry Skill Test (DEST) typing passages for SSC CGL DEO and CHSL LDC/JSA calibrated to AR Typing and TestMentor DEST modules."
            usr_p = f"""Generate an official SSC DEST competitive examination typing passage in standard English on '{topic}'.
Target Word Count: Exactly {target_words} words ({duration}-minute test, ~{target_words * 5} key depressions).
CRITICAL SSC DEST REQUIREMENTS:
1. Alphanumeric & Numeric Density (10-15% of keystrokes): Currency figures (e.g. "₹24,850.50 crore", "Rs. 1,45,000/-"), exact percentages ("12.85%", "48.60%"), dates ("26.11.2008", "15th August 1947"), fiscal years ("2024-25", "2021-22"), and serial codes ("Ref: F.No. 14/02/2024-Coord").
2. Shift-Key Intensity (Uppercase Acronyms): Capitalized abbreviations forcing rapid Shift-key switching (e.g. "NITI Aayog", "CAG", "GSTN", "UIDAI", "AIIMS", "CBI", "MoF", "FY 2024-25", "CSIR", "BHEL", "MSME", "NSO", "PFMS").
3. Hyphenated & Technical Units: "public-private", "capacity-building", "socio-economic", "semi-autonomous", "macro-economic".
4. Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown.
Return ONLY valid JSON:
{{
  "title": "{exam_title}",
  "text": "The complete SSC DEST passage text here..."
}}"""
        elif is_defense:
            sys_p = "You are the Central Armed Police Forces (CAPF) Board Evaluator creating Head Constable Ministerial (HCM) typing test materials for BSF, CISF, CRPF, SSB, and ITBP calibrated to AR Typing HCM benchmark."
            usr_p = f"""Generate an official Paramilitary HCM competitive examination typing passage in standard English on '{topic}'.
Target Word Count: Exactly {target_words} words ({duration}-minute test, 35 WPM benchmark with 95% accuracy rule).
CRITICAL PARAMILITARY HCM REQUIREMENTS:
1. Subject Matter: Border Outpost (BOP) vigilance, tactical telecommunications, wireless encryption, UAV drone surveillance, logistical convoy operations, arms & ammunition registers, cantonment discipline, CCS Conduct Rules 1964, Standing Operating Procedures (SOP), NDRF deployment.
2. High Average Word Length (AWL >= 7.0): reconnaissance, counter-intelligence, superintendence, telecommunications, interoperability, infrastructure, subordination.
3. Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown.
Return ONLY valid JSON:
{{
  "title": "{exam_title}",
  "text": "The complete Paramilitary HCM passage text here..."
}}"""
        elif is_railways:
            sys_p = "You are the Railway Recruitment Control Board (RRB) Examination Evaluator for RRB NTPC Senior Clerk cum Typist typing skill tests calibrated to Eduquity formula."
            usr_p = f"""Generate an official RRB NTPC Senior Clerk cum Typist typing examination passage in standard English on '{topic}'.
Target Word Count: Exactly {target_words} words ({duration}-minute test, 30 WPM Eduquity formula).
CRITICAL RAILWAY REQUIREMENTS:
1. Subject Matter: Dedicated Freight Corridors (DFCCIL), Kavach collision avoidance system, electronic interlocking and block signaling, Centre for Railway Information Systems (CRIS), Passenger Reservation System (PRS), rolling stock scheduling.
2. Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown.
Return ONLY valid JSON:
{{
  "title": "{exam_title}",
  "text": "The complete Railways NTPC passage text here..."
}}"""
        else:
            sys_p = "You are the Principal Typing Examination Passage Author for Uttar Pradesh Police Recruitment Board (UPPRPB) calibrated to AR Typing and EzTyping CO/ASI standards."
            usr_p = f"""Generate an official competitive examination typing passage in standard English for {exam_title} on '{topic}'.
Target Word Count: Exactly {target_words} words ({duration}-minute test).
CRITICAL UP POLICE REQUIREMENTS:
1. Technical Policing Theme: Cyber crime investigations, CCTNS infrastructure, Emergency Dial 112 telemetry, digital forensics, packet capture, SHA-256 hash validation, IT Act 2000 (Section 43, 66C, 66D), BNSS, biometric identification.
2. {'HARD LEVEL (AWL >= 7.3): At least 45% of words must be 8-16+ letters long: institutionalization, telecommunications, constitutionalism, misappropriation, jurisprudence, accountability, interoperability, proportionality.' if is_hard else 'MEDIUM LEVEL: Balanced administrative prose.'}
3. Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown.
Return ONLY valid JSON:
{{
  "title": "{exam_title}",
  "text": "The complete passage text here..."
}}"""
    else:
        # HINDI
        font_dir = "कुर्ती देव 010 (Kruti Dev 010) रेमिंगटन कीबोर्ड लेआउट" if is_kruti else "मंगल इनस्क्रिप्ट (Mangal Inscript Unicode) कीबोर्ड लेआउट (हलंत: D कुंजी, नुक्ता: ] कुंजी)"
        if is_judiciary:
            sys_p = "आप उच्च न्यायालय एवं सर्वोच्च न्यायालय के मुख्य विधि टंकण सामग्री नियंत्रक एवं वरिष्ठ हिंदी न्यायिक अनुवादक हैं।"
            usr_p = f"""दिए गए विषय पर उच्च न्यायालय आरओ/एआरओ एवं जेजेए टंकण परीक्षा के लिए {font_dir} में आधिकारिक गद्यांश तैयार करें।
विषय: {topic}
लक्षित शब्द संख्या: ठीक {target_words} शब्द ({duration} मिनट हेतु)।
अनिवार्य मानक:
1. विधिक शब्दावली: वादी, प्रतिवादी, याचिकाकर्ता, प्रत्यर्थी, रिट याचिका, स्थगनादेश, स्वतः संज्ञान, प्रथम दृष्टया, अपीलीय क्षेत्राधिकार, अंतरिम राहत, नैसर्गिक न्याय, संज्ञेय अपराध, गैर-जमानती वारंट, धारा 482, अनुच्छेद 226।
2. कठिन संयुक्ताक्षर (Halant Conjuncts): द्ध (शुद्ध, बुद्धि), द्व (विद्वान, द्वितीय), द्य (न्यायिक, उद्योग), ष्ट (विशिष्ट, दृष्टिकोण), क्त (अधिवक्ता, संयुक्त), ह्न (चिह्न), हृ (हृदय), त्त (संपत्ति, उत्तरदायित्व)।
3. नुक्ता शब्द: फ़ैसला, ज़िला, क़ानून, ख़ारिज।
4. ठीक 3 निरंतर पैराग्राफ, कोई बुलेट नहीं।
केवल शुद्ध JSON दें:
{{
  "title": "{exam_title}",
  "text": "पूर्ण न्यायिक गद्यांश यहाँ..."
}}"""
        elif is_bihar:
            sys_p = "आप बिहार राज्य इलेक्ट्रॉनिक्स विकास निगम (BELTRON) एवं बिहार कर्मचारी चयन आयोग (BSSC) के मुख्य टंकण सामग्री नियंत्रक हैं।"
            usr_p = f"""बिहार बेल्ट्रॉन डीईओ एवं बीएसएससी इंटर स्तरीय टंकण परीक्षा हेतु {font_dir} में आधिकारिक 10-मिनट का हिंदी गद्यांश तैयार करें।
विषय: {topic}
लक्षित शब्द संख्या: ठीक {target_words} शब्द (30 WPM मानक)।
अनिवार्य बिहार मानक:
1. बिहार राजस्व एवं लोक प्रशासन संदर्भ: राजस्व एवं भूमि सुधार विभाग, ऑनलाइन दाखिल-खारिज (Mutation), खतियान एवं जमाबंदी पंजी, अंचल अधिकारी (CO), हल्का कर्मचारी, पंचायत सरकार भवन, बिहार लोक शिकायत निवारण अधिकार अधिनियम 2015, सात निश्चय योजना।
2. कठिन संयुक्ताक्षर: द्ध, द्व, द्य, ष्ट, क्त, ह्न, त्त।
3. ठीक 3 निरंतर पैराग्राफ, कोई बुलेट नहीं।
केवल शुद्ध JSON दें:
{{
  "title": "{exam_title}",
  "text": "पूर्ण गद्यांश यहाँ..."
}}"""
        elif is_defense:
            sys_p = "आप केंद्रीय सशस्त्र पुलिस बल (CAPF) के मुख्य हिंदी टंकण सामग्री परीक्षक हैं।"
            usr_p = f"""अर्धसैनिक बल हेड कांस्टेबल मिनिस्ट्रियल (HCM) परीक्षा हेतु {font_dir} में कठिन स्तर का आधिकारिक 10-मिनट का हिंदी टंकण गद्यांश तैयार करें।
विषय: {topic}
लक्षित शब्द संख्या: ठीक {target_words} शब्द (30 WPM मानक, 95% कठोर सटीकता सीमा)।
अनिवार्य मानक:
1. सामरिक एवं प्रशासनिक शब्दावली: अग्रिम रक्षा चौकी (BOP), आंतरिक सुरक्षा प्रबंधन, सीमा सुरक्षा बल, शस्त्र एवं गोला-बारूद भंडार, महानिदेशक, उपमहानिरीक्षक, अनुशासनिक कार्यवाही, वायरलेस संचार तंत्र।
2. दीर्घ सामासिक शब्द एवं कठिन संयुक्ताक्षर: द्ध, द्व, द्य, ष्ट, क्त, ह्न, त्त, ट्र, क्र।
3. नुक्ता शब्द: ज़िला, फ़ैसला, अग्रिम चौकी, फ़ाइल।
4. ठीक 3 निरंतर पैराग्राफ, कोई बुलेट नहीं।
केवल शुद्ध JSON दें:
{{
  "title": "{exam_title}",
  "text": "पूर्ण गद्यांश यहाँ..."
}}"""
        else:
            sys_p = "आप उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB) के मुख्य टंकण सामग्री नियंत्रक एवं वरिष्ठ पुलिस प्रशासनिक विशेषज्ञ हैं।"
            usr_p = f"""दिए गए विषय पर '{exam_title}' के लिए {font_dir} में आधिकारिक टंकण सामग्री तैयार करें।
विषय: {topic}
कठिनाई: {'कठिन (दीर्घ एवं लंबे शब्द, कठिन संयुक्ताक्षर)' if is_hard else 'मध्यम'}
लक्षित शब्द संख्या: ठीक {target_words} शब्द ({duration} मिनट हेतु)।
अनिवार्य मानक (AR TYPING & EZTYPING KATHIN BENCHMARK):
1. {'दीर्घ एवं सामासिक शब्द MANDATE: 45% से अधिक शब्द 8 से 16 अक्षर/मात्रा वाले भारी-भरकम शब्द होने चाहिए (संवैधानिकता, उत्तरदायित्व, कार्यप्रणाली, प्रशासनिक, दूरसंचार, न्यायाधिकरण, पुनर्गठन, विभागाध्यक्ष, अंतर-विभागीय, विशेषज्ञता, प्रतिबद्धता, आत्मनिर्भरता, प्रमाणीकरण, कार्यकुशलता, सार्वभौमिकता, परिस्थितिजन्य, सुदृढ़ीकरण)।' if is_hard else 'मानक प्रशासनिक शब्दावली।'}
2. कठिन संयुक्ताक्षर (Halant Conjuncts): द्ध (बुद्धि, शुद्ध), द्व (विद्वान, द्वितीय), द्य (उद्योग, विद्या), ष्ट (दृष्टिकोण, विशिष्ट), क्त (शक्ति, संयुक्त), ह्न (चिह्न), हृ (हृदय), त्त (उत्तरदायित्व, संपत्ति), ट्र (ट्रैफिक), क्र (प्रक्रिया)।
3. नुक्ता शब्द: फ़ॉरेंसिक, ज़िला, फ़ाइल, फ़ैसला, क़ानून, ख़ास।
4. ठीक 3 निरंतर पैराग्राफ, कोई बुलेट नहीं।
केवल शुद्ध JSON दें:
{{
  "title": "{exam_title}",
  "text": "पूर्ण गद्यांश यहाँ..."
}}"""

    return sys_p, usr_p

def main():
    target_date = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y-%m-%d")
    print(f"[*] 🚀 Running Automated Daily AI Passage Generation for date: {target_date}")

    providers = get_configured_providers()
    print(f"[*] Configured AI Providers in failover chain: {len(providers)}")
    for i, p in enumerate(providers):
        print(f"    #{i+1}: {p['name']} (model: {p['model']})")

    if not providers:
        print("[!] ❌ Error: No AI API keys detected in environment.")
        print("    Please set GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY.")
        sys.exit(1)

    # Load existing master JSON bank
    existing_passages = []
    if os.path.exists(PASSAGES_JSON):
        try:
            with open(PASSAGES_JSON, "r", encoding="utf-8") as f:
                existing_passages = json.load(f)
        except Exception as e:
            print(f"[!] Warning reading {PASSAGES_JSON}: {e}")

    existing_ids = set(p.get("id") for p in existing_passages)
    generated_passages = []

    for slot in DAILY_ROTATION_SLOTS:
        slot_num = slot["slot"]
        pid = f"ar-live-{target_date}-slot{slot_num}"

        if pid in existing_ids:
            print(f"[*] Slot #{slot_num} ({pid}) already exists in database. Skipping.")
            continue

        print(f"\n[*] 📝 Generating Slot #{slot_num}: {slot['examTitle']} ({slot['language']}, {slot['difficulty']})...")
        try:
            sys_prompt, user_prompt = build_exam_calibrated_prompt(slot)
            raw_content, prov_used = call_llm_with_failover(sys_prompt, user_prompt)
            title, text = extract_passage_json(raw_content, slot["examTitle"])
            words = text.split()
            word_count = len(words)

            passage = {
                "id": pid,
                "title": f"🔥 {title}",
                "language": slot["language"],
                "category": slot["category"],
                "categoryGroup": slot["categoryGroup"],
                "duration": slot["duration"],
                "wordCount": word_count,
                "difficulty": slot["difficulty"],
                "date": target_date,
                "text": text
            }
            generated_passages.append(passage)
            print(f"  [+] Generated successfully via {prov_used}! ({word_count} words)")
        except Exception as err:
            print(f"  [!] ❌ Failed to generate slot #{slot_num}: {err}")

    if not generated_passages:
        print("\n[*] No new passages needed to be generated today.")
        return

    print(f"\n[*] Successfully generated {len(generated_passages)} new exam tests for {target_date}!")

    # Merge into existing master JSON bank
    # Prepend or append new tests
    updated_bank = generated_passages + [p for p in existing_passages if p.get("id") not in set(x["id"] for x in generated_passages)]

    with open(PASSAGES_JSON, "w", encoding="utf-8") as f:
        json.dump(updated_bank, f, ensure_ascii=False, indent=2)
    print(f"[*] ✅ Updated {PASSAGES_JSON} (Total passages: {len(updated_bank)})")

    # Update src/data/passages.ts with top recent passages
    # To keep bundle size reasonable, passages.ts exports the master array
    print(f"[*] 🔄 Updating {PASSAGES_TS}...")
    try:
        ts_content = f"""// Master Curated & AI Live Daily Examination Passages Bank
// Auto-generated & synced with official examination patterns
import {{ Passage }} from '../types';

export const PASSAGES: Passage[] = {json.dumps(updated_bank, ensure_ascii=False, indent=2)};
"""
        with open(PASSAGES_TS, "w", encoding="utf-8") as f:
            f.write(ts_content)
        print(f"[*] ✅ Updated {PASSAGES_TS}")
    except Exception as e:
        print(f"[!] Warning updating passages.ts: {e}")

    print("\n[*] 🎉 All daily passages generated and databases updated successfully!")

if __name__ == "__main__":
    main()
