import os, re

PASSAGES_FILE = 'src/data/passages.ts'
with open(PASSAGES_FILE, 'r', encoding='utf-8') as f:
    c = f.read()

chunks = re.split(r'(?=\s*\{\s*id:\s*[\'"])', c[:c.find('export const MANGAL_LESSONS')])
seen = set()
unique_list = []
for chunk in chunks:
    id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", chunk)
    lang_m = re.search(r"language:\s*['\"]([^'\"]+)['\"]", chunk)
    title_m = re.search(r"title:\s*['\"](.*?)['\"]", chunk)
    text_m = re.search(r"text:\s*`(.*?)`\s*\}", chunk, re.DOTALL)
    if not (id_m and lang_m and text_m):
        continue
    pid = id_m.group(1)
    if pid in seen:
        continue
    seen.add(pid)
    words = len(text_m.group(1).split())
    lang = lang_m.group(1)
    target = 510 if lang == 'english' else 415
    diff = target - words
    unique_list.append((pid, lang, words, target, max(0, diff), title_m.group(1)))

print(f"Total unique passages: {len(unique_list)}")
for item in unique_list:
    print(f"{item[0]} [{item[1]}]: current={item[2]}, target={item[3]}, need={item[4]} words | {item[5][:35]}")
