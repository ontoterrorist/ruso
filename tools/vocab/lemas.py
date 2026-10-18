"""Lista de lemas rusos por frecuencia: wordfreq (formas) + pymorphy3 (lema)."""
import json, re, collections
from wordfreq import top_n_list, word_frequency
import pymorphy3
m = pymorphy3.MorphAnalyzer()
BAD = {'Name', 'Surn', 'Patr', 'Geox', 'Orgn', 'Trad', 'Abbr', 'Init', 'LATN', 'NUMB', 'ROMN', 'PNCT', 'UNKN', 'Erro', 'Dist'}
freq = collections.Counter(); pos = {}
for w in top_n_list('ru', 120000):
    if not re.fullmatch(r'[а-яё-]+', w) or w.startswith('-') or w.endswith('-'):
        continue
    f = word_frequency(w, 'ru')
    ps = m.parse(w)
    tot = sum(p.score for p in ps) or 1
    for p in ps:
        if BAD & set(str(p.tag).replace(' ', ',').split(',')):
            continue
        lem = p.normal_form
        freq[lem] += f * p.score / tot
        pos.setdefault(lem, collections.Counter())[p.tag.POS] += f * p.score / tot
out = []
for lem, f in freq.most_common(9000):
    P = pos[lem].most_common(1)[0][0]
    if len(lem) < 2 and lem not in ('я', 'в', 'и', 'а', 'с', 'к', 'у', 'о'):
        continue
    info = ''
    p = next((x for x in m.parse(lem) if x.normal_form == lem and x.tag.POS == P), None)
    if p is not None:
        if P == 'NOUN': info = p.tag.gender or ''
        if P == 'INFN': info = p.tag.aspect or ''
    out.append({'ru': lem, 'pos': P, 'g': info, 'f': f})
json.dump(out, open('lemas.json', 'w'), ensure_ascii=False)
print(len(out)); print([ (x['ru'], x['pos']) for x in out[:60]]); print([x['ru'] for x in out[5900:5960]])
