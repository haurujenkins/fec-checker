"""Taux de détection par code d’erreur injectée (lit tests/bench_result.json)."""
import json,collections,sys,re
r=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__),'bench_result.json')))
det=collections.Counter();tot=collections.Counter();miss=collections.defaultdict(list)
for p in r:
  if 'crash' in p['E'] or 'crash' in p['C']: continue
  Ct={i['t'] for i in p['C']['issues'] if i['sev']!='info'}
  Cn={(i['t'],i['n']) for i in p['C']['issues']}
  for e in p['ref']['erreurs']:
    code=e['code'];tot[code]+=1;lines=set(map(str,e.get('lignes') or []));hit=False
    toks=({e['ecriture']} if e.get('ecriture') else set())|{str(x).strip() for x in (e.get('avant'),e.get('apres')) if x and len(str(x).strip())>=3 and len(str(x))<40}
    for i in p['E']['issues']:
      if i['sev']=='info' or (i['t'],i['n']) in Cn:continue
      il={x.split(' ')[0] for x in i['lines']}|{m for x in i['lines'] for m in re.findall(r'ligne (\d+)',x)}|{m for x in i['lines'] for m in re.findall(r'^(\d+) =',x)}
      if lines&il or any(t in ' '.join(i['lines']) for t in toks) or ((not lines or lines=={'1'}) and i['t'] not in Ct): hit=True;break
    if hit:det[code]+=1
    else:miss[code].append(p['paire'])
print('détection',sum(det.values()),'/',sum(tot.values()))
for c in sorted(tot):
  if det[c]<tot[c]:print(c,f"{det[c]}/{tot[c]}",miss[c][:5])
