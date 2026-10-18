"""Acento de cada lema según espeak-ng (diccionario ru 1.51): marca la vocal tónica con '."""
import json, subprocess, os, re, sys
from concurrent.futures import ThreadPoolExecutor
ESDATA = '/home/user/tts/esdata'
V = 'аеёиоуыэюя'
IPAV = set('aɐəeɛiɪɨouʊɵæʉyɔʌɑɒɘɜ')
def ipa(w):
    return subprocess.run(['espeak-ng', '-v', 'ru', '-q', '--ipa', w], capture_output=True, text=True, errors='replace',
                          env={**os.environ, 'ESPEAK_DATA_PATH': ESDATA}).stdout.strip()
def mark(w):
    n = sum(c in V for c in w.lower())
    if n <= 1: return w
    if 'ё' in w: return w.replace('ё', "ё'") if False else w  # la ё ya lleva el acento
    s = ipa(w)
    if 'ˈ' not in s or ' ' in s: return None
    before = s.split('ˈ')[0]
    k = 0; prev = False
    for c in before:
        isv = c in IPAV
        if isv and not prev: k += 1
        prev = isv
    if k >= n: return None
    idx = [i for i, c in enumerate(w) if c.lower() in V][k]
    return w[:idx + 1] + "'" + w[idx + 1:]
items = json.load(open(sys.argv[1]))
with ThreadPoolExecutor(8) as ex:
    res = list(ex.map(lambda x: mark(x['ru']), items))
for x, r in zip(items, res): x['acc'] = r
json.dump(items, open(sys.argv[2], 'w'), ensure_ascii=False)
print(sum(r is None for r in res), 'sin acento'); print([x['acc'] for x in items[:80]])
