# FEC fictif sur 6 exercices (2019-2024) avec des lettrages à cheval chaque année, à-nouveaux détaillés (C01-C04, fournisseurs)
# ou globaux par tiers (C05-C08). Aucune donnée client. Usage : python3 tests/gen_six_ans.py dossier_sortie
import random,sys,datetime as dt,json,os
random.seed(6)
OUT=sys.argv[1] if len(sys.argv)>1 else '.'
H='JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise'
JL={'AN':'A-nouveaux','VT':'Ventes','AC':'Achats','BQ':'Banque'}
CLI=['C%02d'%i for i in range(1,9)];GLOB=set(CLI[4:]);FOU=['F01','F02','F03']
fmt=lambda c:'%d,%02d'%(c//100,c%100)
d8=lambda d:d.strftime('%Y%m%d')
rows=[];num={}
def piece(j,y):num[(j,y)]=num.get((j,y),0)+1;return str(num[(j,y)])
def line(j,n,d,cpt,lib,aux,ref,pd,el,deb,cre,let='',dl=None):
  rows.append([j,JL[j],n,d8(d),cpt,lib,aux,('TIERS '+aux) if aux else '',ref,d8(pd),el,fmt(deb),fmt(cre),let,d8(dl) if let and dl else '',d8(d),'',''])
seq={'411000':0,'401000':0}
def newlet(a):
  seq[a]+=1;n=seq[a]-1;return ''.join('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[x] for x in (n//676,(n//26)%26,n%26))
docs=[]  # factures : dict(acc,aux,ref,date,amt,pays=[(date,amt)])
k=0
for y in range(2019,2025):
  for m in range(1,13):
    for c in random.sample(CLI,3):
      k+=1;d=dt.date(y,m,random.randint(1,28));a=random.randint(100,5000)*100
      delay=random.randint(20,80)
      if c=='C02' and m==11:delay=400   # réglée deux clôtures plus tard
      docs.append(dict(acc='411000',aux=c,ref='FA%04d'%k,date=d,amt=a,pays=[(d+dt.timedelta(days=delay),a)]))
    for f in random.sample(FOU,1):
      k+=1;d=dt.date(y,m,random.randint(1,28));a=random.randint(50,2000)*100
      docs.append(dict(acc='401000',aux=f,ref='FF%04d'%k,date=d,amt=-a,pays=[(d+dt.timedelta(days=random.randint(15,60)),-a)]))
  if y==2021: # deux factures identiques, même date, sans référence : appariement ambigu
    d=dt.date(2021,12,20)
    for _ in range(2):docs.append(dict(acc='411000',aux='C04',ref='-',date=d,amt=77700,pays=[(dt.date(2022,1,25),77700)]))
END=dt.date(2024,12,31)
for x in docs:x['pays']=[p for p in x['pays'] if p[0]<=END]
yr=lambda d:d.year
# lettres : une par facture réglée ; tiers à AN global : une lettre par (tiers, exercice d'ouverture) regroupant AN + règlements
for x in docs:x['let']=newlet(x['acc']) if x['pays'] else ''
glob={}
for y in range(2020,2025):
  for c in GLOB:
    op=[x for x in docs if x['aux']==c and x['date'].year<y and (not x['pays'] or x['pays'][0][0].year>=y)]
    if op and all(x['pays'] and x['pays'][0][0].year==y for x in op):
      L=newlet('411000');glob[(c,y)]=(L,op)
      for x in op:x['let']=L
# écritures
for y in range(2019,2025):
  # à-nouveaux
  n=piece('AN',y);d=dt.date(y,1,1)
  if y==2019:
    line('AN',n,d,'101300','Capital','','-',d,'Capital',0,1000000);line('AN',n,d,'512100','Banque','','-',d,'Banque',1000000,0)
  else:
    bank=1000000+sum(sum(-p[1] if x['acc']=='401000' else p[1] for p in x['pays'] if p[0].year<y)*(1 if x['acc']=='411000' else 1) for x in docs if x['acc']=='411000')
    bank-=sum(sum(-p[1] for p in x['pays'] if p[0].year<y) for x in docs if x['acc']=='401000')
    tot=0
    line('AN',n,d,'101300','Capital','','-',d,'Capital',0,1000000);line('AN',n,d,'512100','Banque','','-',d,'Banque',bank,0);tot+=bank-1000000
    op=[x for x in docs if x['date'].year<y and (not x['pays'] or x['pays'][0][0].year>=y)]
    for x in op:
      if x['aux'] in GLOB:continue
      a=x['amt'];L=x['let'] if x['pays'] and x['pays'][0][0].year==y else ''
      line('AN',n,d,x['acc'],'Clients' if a>0 else 'Fournisseurs',x['aux'],x['ref'],x['date'],'AN '+x['ref'],max(a,0),max(-a,0),L,x['pays'][0][0] if L else None);tot+=a
    for c in sorted(GLOB):
      o=[x for x in op if x['aux']==c]
      if not o:continue
      a=sum(x['amt'] for x in o);L=glob.get((c,y),('',0))[0]
      line('AN',n,d,'411000','Clients',c,'-',d,'Solde '+c,a,0,L,d if L else None);tot+=a
    line('AN',n,d,'110000','Report a nouveau','','-',d,'Report a nouveau',max(-tot,0),max(tot,0))
  ev=[]
  for x in docs:
    if x['date'].year==y:ev.append((x['date'],0,x))
    for p in x['pays']:
      if p[0].year==y:ev.append((p[0],1,x))
  for d,t,x in sorted(ev,key=lambda e:(e[0],e[1],e[2]['ref'])):
    a=x['amt'];paidY=x['pays'] and x['pays'][0][0].year==y
    if t==0:
      j='VT' if a>0 else 'AC';n=piece(j,y);L=x['let'] if paidY else ''
      dl=x['pays'][0][0] if L else None
      line(j,n,d,x['acc'],'Clients' if a>0 else 'Fournisseurs',x['aux'],x['ref'],d,x['ref'],max(a,0),max(-a,0),L,dl)
      line(j,n,d,'706000' if a>0 else '607000','Ventes' if a>0 else 'Achats','',x['ref'],d,x['ref'],max(-a,0),max(a,0))
    else:
      n=piece('BQ',y)
      line('BQ',n,d,x['acc'],'Clients' if a>0 else 'Fournisseurs',x['aux'],x['ref'],d,'Reglement '+x['ref'],max(-a,0),max(a,0),x['let'],d)
      line('BQ',n,d,'512100','Banque','','-',d,'Reglement '+x['ref'],max(a,0),max(-a,0))
os.makedirs(OUT,exist_ok=True)
p=os.path.join(OUT,'222333444FEC20241231.txt')
open(p,'w',encoding='utf-8',newline='').write('\r\n'.join([H]+['|'.join(r) for r in rows])+'\r\n')
# attendu : factures réglées → lettrage complet ; factures non réglées fin 2024 → ouvertes
paid=[x for x in docs if x['pays']];unp=[x for x in docs if not x['pays']]
exp=dict(lignes=len(rows),factures=len(docs),reglees=len(paid),lettrages_attendus=len({(x['acc'],x['let']) for x in paid}),
  ouvert_clients=sum(x['amt'] for x in unp if x['acc']=='411000')/100,ouvert_fournisseurs=sum(-x['amt'] for x in unp if x['acc']=='401000')/100,
  a_cheval=sum(1 for x in paid if x['pays'][0][0].year>x['date'].year))
json.dump(exp,open(os.path.join(OUT,'attendu.json'),'w'),indent=1);print(exp)
