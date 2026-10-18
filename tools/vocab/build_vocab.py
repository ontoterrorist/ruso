"""Une out/part*.jsonl en /home/user/ruso/vocab/palabras.js (las N más frecuentes, sin descartes ni duplicados).
Para cada palabra busca en qué posición de su ejemplo aparece (para el ejercicio de completar)."""
import json, re, glob, sys
import pymorphy3
m = pymorphy3.MorphAnalyzer()
N = int(sys.argv[1]) if len(sys.argv) > 1 else 6000
rows = []
for f in sorted(glob.glob('out/part*.jsonl'), key=lambda x: int(re.findall(r'\d+', x)[0])):
    for line in open(f):
        line = line.strip()
        if line:
            rows.append(json.loads(line))
rows.sort(key=lambda x: x['i'])
plain = lambda s: s.replace("'", '').lower().replace('ё', 'е')
QUITAR = {"хрень"}  # vulgar
seen, out, dropped = set(), [], 0
for x in rows:
    if x.get('drop'):
        dropped += 1; continue
    if x['ru'] in seen or x['ru'] in QUITAR:
        continue
    if x['ru'] == "обо'":  # en el habla va sin acento: обо мне
        x['ru'] = 'обо'; x['ex'] = x['ex'].replace("обо'", 'обо').replace("Обо'", 'Обо')
    seen.add(x['ru'])
    lem = plain(x['ru'])
    toks = x['ex'].split(' ')
    k = -1
    if ' ' not in x['ru']:
        for j, t in enumerate(toks):
            w = re.sub(r"[^а-яёА-ЯЁ'-]", '', t)
            p = plain(w)
            if not p:
                continue
            if p == lem or any(plain(q.normal_form) == lem for q in m.parse(p)):
                k = j; break
    out.append([x['ru'], x['es'], x['t'], x.get('n', ''), x['ex'], x['exes'], k])
    if len(out) >= N:
        break
with open('/home/user/ruso/vocab/palabras.js', 'w') as f:
    f.write('/* Las 6000 palabras rusas más frecuentes (wordfreq + pymorphy3), con traducción, nota, ejemplo y\n'
            '   la posición de la palabra en el ejemplo: [ruso, español, clase, nota, ejemplo, traducción, posición]. */\n')
    f.write('window.VOCAB = [\n' + ',\n'.join(json.dumps(r, ensure_ascii=False) for r in out) + '\n];\n')
print(len(out), 'palabras ·', dropped, 'descartadas · sin hueco:', sum(r[6] < 0 for r in out))
