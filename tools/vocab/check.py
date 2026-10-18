"""Revisa out/partK.jsonl contra in/partK.tsv. Uso: python3 check.py K"""
import json, re, sys
import pymorphy3
m = pymorphy3.MorphAnalyzer()
K = sys.argv[1]
want = [l.split('\t')[0] for l in open(f'in/part{K}.tsv')]
V = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ'
TYPES = {'sust m', 'sust f', 'sust n', 'sust pl', 'verbo impf', 'verbo pf', 'verbo impf/pf', 'adj', 'adv', 'pron', 'prep', 'conj', 'part', 'num', 'interj', 'pred'}
def stress_errors(s):
    errs = []
    for w in re.findall(r"[А-Яа-яЁё'-]+", s):
        for part in w.split('-'):
            if not part: continue
            n = sum(c in V for c in part); k = part.count("'")
            if "'" in part and (part.index("'") == 0 or part[part.index("'") - 1] not in V): errs.append('marca fuera de vocal: ' + part)
            elif n >= 2 and 'ё' not in part.lower() and k != 1: errs.append('acento: ' + part)
            elif n <= 1 and k: errs.append('monosílabo marcado: ' + part)
            elif 'ё' in part.lower() and k: errs.append('ё con marca: ' + part)
    return errs
seen = {}; bad = 0
for ln, line in enumerate(open(f'out/part{K}.jsonl'), 1):
    line = line.strip()
    if not line: continue
    try: x = json.loads(line)
    except Exception as e: print('línea', ln, 'JSON inválido'); bad += 1; continue
    i = str(x.get('i')); seen[i] = 1
    if x.get('drop'): continue
    errs = []
    for f in ('ru', 'es', 't', 'ex', 'exes'):
        if not x.get(f): errs.append('falta ' + f)
    if x.get('t') not in TYPES: errs.append('t inválido')
    errs += stress_errors(x.get('ru', '')) + stress_errors(x.get('ex', '')) + stress_errors(x.get('n', ''))
    if re.search(r'[0-9/()]', x.get('ex', '')): errs.append('ex con dígitos, / o paréntesis')
    lem = x.get('ru', '').replace("'", '').lower().replace('ё', 'е')
    toks = re.findall(r'[а-яё-]+', x.get('ex', '').replace("'", '').lower())
    lemmas = {p.normal_form.replace('ё', 'е') for t in toks for p in m.parse(t)} | {t.replace('ё', 'е') for t in toks}
    if lem not in lemmas and not any(lem in t.replace('ё', 'е') for t in toks): errs.append('el ejemplo no contiene la palabra')
    if errs: bad += 1; print(i, x.get('ru'), '|', '; '.join(errs))
missing = [i for i in want if i not in seen]
print('faltan', len(missing), missing[:20], '| con problemas', bad)
