import json
import os

in_json = 'public/passages-by-date.json'
with open(in_json, 'r', encoding='utf-8') as f:
    passages = json.load(f)

out_ts = 'src/data/passages.ts'
with open(out_ts, 'w', encoding='utf-8') as f:
    f.write("import { Passage } from '../types';\n\n")
    f.write("export const PASSAGES: Passage[] = [\n")
    for p in passages:
        f.write("  {\n")
        f.write(f"    id: {json.dumps(p['id'])},\n")
        f.write(f"    title: {json.dumps(p['title'])},\n")
        f.write(f"    language: {json.dumps(p['language'])},\n")
        f.write(f"    category: {json.dumps(p['category'])},\n")
        f.write(f"    duration: {p['duration']},\n")
        f.write(f"    wordCount: {p['wordCount']},\n")
        f.write(f"    difficulty: {json.dumps(p['difficulty'])},\n")
        f.write(f"    date: {json.dumps(p['date'])},\n")
        f.write(f"    text: {json.dumps(p['text'], ensure_ascii=False)}\n")
        f.write("  },\n")
    f.write("];\n\n")
    f.write("""export const MANGAL_LESSONS = [
  {
    id: 'lesson-1',
    title: 'Lesson 1: Home Row Basics (क र प ह स)',
    keys: ['k', 'j', 'i', 'u', 'l'],
    text: 'क र प ह स क र प ह स क र प ह स क र प ह स कर पर हर सर रस कस कप पस हक पक'
  },
  {
    id: 'lesson-2',
    title: 'Lesson 2: Home Row Vowel Signs (ा ो े ्)',
    keys: ['e', 'd', 'f', 'a'],
    text: 'का को के क् रा रो रे र् पा पो पे प् हा हो हे ह् सा सो से स् कार कोर केर पार'
  },
  {
    id: 'lesson-3',
    title: 'Lesson 3: Top Row Consonants (ब ग द ज ड)',
    keys: ['y', 't', 'r', 'e', 'w'],
    text: 'ब ग द ज ड ब ग द ज ड बद गज दब जब गड डग बाद गजरा दबा जबड़ा डगर गदर'
  },
  {
    id: 'lesson-4',
    title: 'Lesson 4: Shift Combinations & Halant (क् ख ग घ)',
    keys: ['k', 'K', 'i', 'I'],
    text: 'क्या क्यों क्रम प्यार स्पष्ट ज्ञान क्षेत्र राष्ट्र प्रकाश प्रतिज्ञा उत्तर प्रदेश पुलिस'
  }
];

export const ENGLISH_LESSONS = [
  {
    id: 'en-lesson-1',
    title: 'Lesson 1: Home Row (ASDF JKL;)',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    text: 'asdf jkl; asdf jkl; all fall dad glad flash flask salad lads asks fall half flask'
  },
  {
    id: 'en-lesson-2',
    title: 'Lesson 2: Top Row (QWERTY UIOP)',
    keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    text: 'quiet power write require quote report priority output input proper write tower route'
  },
  {
    id: 'en-lesson-3',
    title: 'Lesson 3: Bottom Row (ZXCVBNM)',
    keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    text: 'zoom calm voice zero zinc victim civil combine bonus matrix carbon common vacuum'
  },
  {
    id: 'en-lesson-4',
    title: 'Lesson 4: Capital Letters & Special Punctuation',
    keys: ['Shift', '.', ',', '-', '"'],
    text: 'Uttar Pradesh Police, Computer Operator Grade-A: Speed 30 WPM, Accuracy 85.0%!'
  }
];
""")

print("Successfully updated src/data/passages.ts with lessons!")
