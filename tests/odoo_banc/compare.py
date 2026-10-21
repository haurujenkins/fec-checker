import json,csv,collections,sys
P=json.load(open('/tmp/claude-0/s/pred.json'))
O={}
for l in open('/tmp/claude-0/s/odoo.txt'):
  l=l.rstrip('\n')
  if not l:continue
  f,cls,msg,mv=l.split('~')[:4];O[f]=(cls,msg,mv)
idx={r['paire']:r for r in csv.DictReader(open('/tmp/claude-0/ds/fichiers FECS/index.csv'),delimiter=';')}
cm=collections.Counter();rows=[]
for k,v in sorted(P.items()):
  f=k[:7]
  if f not in O:continue
  cls,msg,mv=O[f]
  eff=set(x.split('|')[2] for x in v['issues'])
  pred='FAIL' if 'bloque' in eff else ('CORRUPT' if 'fausse' in eff else 'OK')
  real='FAIL' if cls in('REFUSE','ERR') else ('CORRUPT' if cls=='DIFF' else 'OK')
  codes=idx[k[2:7]]['codes_erreurs'] if k.startswith('E_') else '-'
  cm[(pred,real)]+=1
  if pred!=real:rows.append((f,codes,pred,real,msg[:70],[x for x in v['issues']][:4]))
print(cm)
for r in rows:print(*r,sep=' | ')
