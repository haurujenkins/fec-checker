// Options du fichier de reprise pour l'import de plusieurs exercices : préfixe des numéros d'écriture et retrait des à-nouveaux.
// Deux situations, dont le comportement diffère :
//  - un seul exercice déposé (import année par année) : aucune option cochée d'office, l'utilisateur choisit ;
//  - plusieurs exercices déposés d'un coup : options cochées d'office selon le contrôle croisé.
// Usage : npm i --no-save xlsx@0.18.5 && node tests/options.js
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert');
const D0=Date,T=new D0('2026-10-22T12:00:00').getTime();global.Date=class extends D0{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const s=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const els={};global.document={getElementById:id=>els[id]||(els[id]={addEventListener(){},set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},className:'',textContent:''}),createElement:()=>({}),body:{appendChild(){},removeChild(){}},addEventListener(){},querySelector:()=>null};global.window={};
global.XLSX=require('xlsx');global.navigator={};
global.FileReader=class{readAsArrayBuffer(f){setTimeout(()=>{this.result=f._buf;this.onload();},0);}};
eval(s+';global.T_={handleFiles,render,planOf,reports:()=>REPORTS,opts:()=>OPTS,combined};');
const F=path.join(__dirname,'fixtures'),F24=path.join(F,'123456789FEC20241231.txt'),F25=path.join(F,'123456789FEC20251231.txt');
// Exercice 2026 fictif, tiré de 2025 (mêmes numéros de pièce, à-nouveaux = clôture 2025)
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fec-opt-'));
const F26=path.join(tmp,'123456789FEC20261231.txt');
const H=fs.readFileSync(F25,'utf8').split(/\r?\n/)[0];
fs.writeFileSync(F26,[H,
 'AN|A-nouveaux|1|20260101|101300|Capital|||-|20260101|Capital|0,00|10000,00|||20260101||',
 'AN|A-nouveaux|1|20260101|512100|Banque|||-|20260101|Banque|11200,00|0,00|||20260101||',
 'AN|A-nouveaux|1|20260101|445710|TVA collectee|||-|20260101|TVA collectee|0,00|200,00|||20260101||',
 'AN|A-nouveaux|1|20260101|401000|Fournisseurs|F1|FOURNISSEUR UN|-|20260101|Fournisseurs|0,00|500,00|||20260101||',
 'AN|A-nouveaux|1|20260101|120000|Resultat de l exercice|||-|20260101|Resultat de l exercice|0,00|500,00|||20260101||',
 'BQ|Banque|2|20260305|401000|Fournisseurs|F1|FOURNISSEUR UN|-|20260305|Fournisseurs|500,00|0,00|||20260305||',
 'BQ|Banque|2|20260305|512100|Banque|||-|20260305|Banque|0,00|500,00|||20260305||'].join('\r\n')+'\r\n');
const FBAD=path.join(tmp,'123456789FEC20250630.txt');fs.writeFileSync(FBAD,fs.readFileSync(F25,'utf8').replace('|0,00|10000,00|','|0,00|9000,00|'));
const mk=p=>{const b=fs.readFileSync(p);return {name:path.basename(p),_buf:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
const load=async files=>{await T_.handleFiles(files.map(mk));await new Promise(r=>setTimeout(r,100));for(const k of Object.keys(T_.opts()))delete T_.opts()[k];T_.render(T_.reports());return T_.reports();};
const set=(R,o)=>{T_.opts()[R.name]={...R._opts,...o};T_.render(T_.reports());return T_.reports().find(x=>x.name===R.name);};
const lines=R=>R._fix.text.trim().split('\r\n').slice(1).map(l=>l.split('\t'));
const nums=R=>new Set(lines(R).map(l=>l[0]+'/'+l[2]));
const bal=Rs=>{const b={};for(const R of Rs)for(const l of lines(R)){const a=l[4];if(!/^[1-5]/.test(a)||/^12/.test(a))continue;b[a]=(b[a]||0)+amt(l[11])-amt(l[12]);}for(const k in b)if(!b[k])delete b[k];return b;};
const amt=x=>Math.round(parseFloat(String(x||'0').replace(',','.'))*100);
// Comptes collectifs avec tiers reportés sur le compte par défaut d’Odoo, comme le fait le fichier de reprise
const srcBal=p=>{const b={};for(const l of fs.readFileSync(p,'utf8').trim().split(/\r?\n/).slice(1).map(l=>l.split('|'))){const a=/^4[01]10*$/.test(l[4])&&l[6]?(l[4][1]==='0'?'401100':'411100'):l[4];if(!/^[1-5]/.test(a)||/^12/.test(a))continue;b[a]=(b[a]||0)+amt(l[11])-amt(l[12]);}for(const k in b)if(!b[k])delete b[k];return b;};
let n=0;const ok=(t,f)=>{f();n++;console.log('✓ '+t);};

(async()=>{
  // ---------- Un seul exercice déposé ----------
  let [R]=await load([F25]);
  ok('un exercice : aucune option cochée d’office',()=>{assert.strictEqual(R._opts.prefixOn,false);assert.strictEqual(R._opts.dropAN,false);assert.deepStrictEqual(R._fix.opts,{prefix:'',dropAN:false,later:false,recv:'411100',pay:'401100',collect:true});});
  ok('un exercice : numéros bruts et à-nouveaux gardés',()=>{assert.deepStrictEqual(lines(R).map(l=>l[2]),['1','1','1','1','2','2']);assert.strictEqual(lines(R).filter(l=>l[0]==='AN').length,4);});
  ok('un exercice : préfixe proposé = année de clôture',()=>assert.strictEqual(R._opts.prefix,'2025'));
  R=set(R,{prefixOn:true,collect:false});
  ok('un exercice : préfixe coché → « 2025-1 », PieceRef inchangé, aucune validation exigée',()=>{assert.deepStrictEqual([...new Set(lines(R).map(l=>l[2]))],['2025-1','2025-2']);assert.deepStrictEqual(lines(R).map(l=>l[8]),['-','-','-','-','AC1','AC1']);assert.ok(!Object.values(R._fix.changes).some(v=>v.kind==='map'));assert.ok(R._fix.integrity.ok);});
  R=set(R,{prefix:'EX25/'});
  ok('un exercice : préfixe saisi qui finit par un séparateur gardé tel quel',()=>assert.strictEqual(lines(R)[0][2],'EX25/1'));
  R=set(R,{prefixOn:false,dropAN:true});
  ok('un exercice : retrait des à-nouveaux → 2 lignes, intégrité réussie hors à-nouveaux',()=>{const I=R._fix.integrity;assert.strictEqual(I.lines,2);assert.strictEqual(I.srcLines,6);assert.ok(I.ok);assert.deepStrictEqual({n:I.dropped.n,d:I.dropped.d,c:I.dropped.c},{n:4,d:1120000,c:1120000});});
  ok('un exercice : lignes retirées listées dans la table et validation exigée',()=>{assert.strictEqual(R._fix.corr.filter(c=>c[1]==='ligne retirée').length,4);assert.ok(Object.values(R._fix.changes).some(v=>v.kind==='map'));});
  ok('un exercice : la balance d’ouverture garde les à-nouveaux',()=>assert.ok(R._open.aoa.some(r=>r[3]==='101300')));
  ok('un exercice : le fichier de reprise réanalysé n’a plus de journal d’à-nouveaux',()=>{assert.ok(R.issues.some(i=>/^Journal d’à-nouveaux présent/.test(i.title)));assert.ok(!R._after.issues.some(i=>/^Journal d’à-nouveaux présent/.test(i.title)));});
  [R]=await load([F24]);
  ok('un exercice (premier exercice) : à-nouveaux gardés par défaut',()=>assert.strictEqual(lines(R).filter(l=>l[0]==='AN').length,2));
  [R]=await load([FBAD]);R=set(R,{dropAN:true});
  ok('à-nouveaux déséquilibrés : non retirés, motif affiché',()=>{assert.strictEqual(R._fix.opts.dropAN,false);assert.strictEqual(lines(R).filter(l=>l[0]==='AN').length,4);assert.ok(R._fix.left.some(x=>/^À-nouveaux non retirés/.test(x)));});

  // ---------- Plusieurs exercices déposés d'un coup ----------
  let Rs=await load([F25,F24]);
  const [A,B]=Rs;
  ok('deux exercices : ordre chronologique, préfixe coché pour les deux',()=>{assert.deepStrictEqual(Rs.map(r=>r.name),[path.basename(F24),path.basename(F25)]);assert.deepStrictEqual(Rs.map(r=>r._fix.opts.prefix),['2024-','2025-']);});
  ok('deux exercices : à-nouveaux gardés dans le premier, retirés du second',()=>{assert.strictEqual(lines(A).filter(l=>l[0]==='AN').length,2);assert.strictEqual(lines(B).filter(l=>l[0]==='AN').length,0);});
  ok('deux exercices : aucune pièce (journal + numéro) commune entre les fichiers de reprise',()=>{const a=nums(A);assert.ok(![...nums(B)].some(k=>a.has(k)));});
  ok('deux exercices : bilan importé = bilan de clôture 2025, rien de compté deux fois',()=>assert.deepStrictEqual(bal(Rs),srcBal(F25)));
  ok('deux exercices : verdicts « Importable avec le fichier de reprise »',()=>assert.deepStrictEqual(Rs.map(r=>T_.planOf(r).title),['Importable avec le fichier de reprise','Importable avec le fichier de reprise']));
  ok('deux exercices : points croisés non dupliqués après un changement d’option',()=>{const n0=B.issues.length;set(B,{prefixOn:true});assert.strictEqual(T_.reports()[1].issues.length,n0);});
  let B2=set(B,{dropAN:false});
  ok('deux exercices : décocher le retrait remet le point à corriger, le choix est gardé',()=>{assert.strictEqual(lines(B2).filter(l=>l[0]==='AN').length,4);assert.strictEqual(T_.planOf(B2).title,'À corriger avant import');T_.render(T_.reports());assert.strictEqual(T_.reports()[1]._opts.dropAN,false);});
  B2=set(B2,{prefixOn:false});
  ok('deux exercices : un seul fichier préfixé suffit à séparer les pièces',()=>{const a=nums(T_.reports()[0]);assert.ok(![...nums(B2)].some(k=>a.has(k)));});
  set(T_.reports()[0],{prefixOn:false});
  ok('deux exercices : sans aucun préfixe, la collision redevient un point Odoo',()=>{const R0=T_.reports()[0];assert.ok(T_.planOf(R0).g.odoo.some(i=>/en commun entre/.test(i.title)));});

  ok('deux exercices : un seul fichier de reprise combiné, dans l’ordre, sans collision',()=>{set(T_.reports()[0],{prefixOn:true});set(T_.reports()[1],{prefixOn:true,dropAN:true});const C=T_.combined(T_.reports());assert.ok(C.ok);assert.strictEqual(C.lines,9);assert.ok(C.map);assert.strictEqual(C.name,'123456789_reprise_odoo_2024-2025.txt');
    const L=C.text.trim().split('\r\n').slice(1).map(l=>l.split('\t'));assert.deepStrictEqual(L.map(l=>l[3]),[...L.map(l=>l[3])].sort());const k=new Map();for(const l of L){const key=l[0]+'/'+l[2];k.set(key,(k.get(key)||new Set()).add(l[3].slice(0,4)));}assert.ok([...k.values()].every(v=>v.size===1));assert.deepStrictEqual(bal([{_fix:{text:C.text}}]),srcBal(F25));});
  set(T_.reports()[0],{prefixOn:false});set(T_.reports()[1],{prefixOn:false});
  ok('deux exercices sans préfixe : fichier combiné refusé, motif donné',()=>{const C=T_.combined(T_.reports());assert.strictEqual(C.ok,false);assert.ok(C.why.some(w=>/préfixe/.test(w)));});
  set(T_.reports()[1],{prefixOn:true,dropAN:false});
  ok('deux exercices, à-nouveaux gardés dans le second : fichier combiné refusé',()=>{const C=T_.combined(T_.reports());assert.strictEqual(C.ok,false);assert.ok(C.why.some(w=>/à-nouveaux/.test(w)));});
  Rs=await load([F26,F24,F25]);
  ok('trois exercices : à-nouveaux retirés des deux derniers seulement',()=>assert.deepStrictEqual(Rs.map(r=>lines(r).filter(l=>l[0]==='AN').length),[2,0,0]));
  ok('trois exercices : trois préfixes distincts, aucune pièce commune',()=>{assert.deepStrictEqual(Rs.map(r=>r._fix.opts.prefix),['2024-','2025-','2026-']);const all=Rs.map(nums);for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(![...all[j]].some(k=>all[i].has(k)));});
  ok('trois exercices : bilan importé = bilan de clôture 2026',()=>assert.deepStrictEqual(bal(Rs),srcBal(F26)));
  ok('trois exercices : intégrité réussie pour chaque fichier',()=>assert.ok(Rs.every(r=>r._fix.integrity.ok)));
  ok('trois exercices : fichier combiné = bilan de clôture 2026',()=>{const C=T_.combined(Rs);assert.ok(C.ok);assert.strictEqual(C.lines,Rs.reduce((t,r)=>t+lines(r).length,0));assert.deepStrictEqual(bal([{_fix:{text:C.text}}]),srcBal(F26));
    fs.writeFileSync(path.join(tmp,C.name),C.text);});
  [R]=await load([path.join(tmp,'123456789_reprise_odoo_2024-2026.txt')]);
  ok('fichier combiné réanalysé par la page : rien à corriger',()=>{assert.strictEqual(T_.planOf(R).title,'Importable tel quel');assert.ok(!R.issues.some(i=>/chronologique|Plusieurs exercices|en double/.test(i.title)));});

  // ---------- Tous les exercices dans un seul fichier ----------
  const body=p=>fs.readFileSync(p,'utf8').trim().split(/\r?\n/).slice(1);
  fs.mkdirSync(path.join(tmp,'all'));const FALL=path.join(tmp,'all','123456789FEC20261231.txt'),F26b=F26;
  fs.writeFileSync(FALL,[H,...body(F24),...body(F25),...body(F26b)].join('\r\n')+'\r\n');
  [R]=await load([FALL]);
  ok('un fichier, trois exercices : exercices repérés par leurs à-nouveaux',()=>{assert.deepStrictEqual(R.hints.exos.map(e=>e.label),['2024','2025','2026']);assert.ok(R.issues.some(i=>i.title==='Plusieurs exercices dans le même fichier'));});
  ok('un fichier, trois exercices : options cochées d’office',()=>{assert.strictEqual(R._opts.prefixOn,true);assert.strictEqual(R._opts.dropAN,true);});
  ok('un fichier, trois exercices : à-nouveaux du premier exercice gardés, des suivants retirés',()=>{const an=lines(R).filter(l=>l[0]==='AN');assert.strictEqual(an.length,2);assert.ok(an.every(l=>l[3]==='20240101'));assert.strictEqual(R._fix.integrity.dropped.n,9);assert.ok(R._fix.integrity.ok);});
  ok('un fichier, trois exercices : chaque pièce préfixée par son exercice, aucune fusion',()=>{const L=lines(R);assert.ok(L.every(l=>l[2].startsWith(l[3].slice(0,4)+'-')));const k=new Map();for(const l of L){const key=l[0]+'/'+l[2];k.set(key,(k.get(key)||new Set()).add(l[3].slice(0,4)));}assert.ok([...k.values()].every(v=>v.size===1));});
  ok('un fichier, trois exercices : bilan importé = bilan de clôture 2026',()=>assert.deepStrictEqual(bal([R]),srcBal(F26)));
  ok('un fichier, trois exercices : balance d’ouverture sans les à-nouveaux des exercices suivants',()=>{const b=R._open.aoa.find(r=>r[3]==='512100');assert.strictEqual(b[7],10700);assert.strictEqual(R._open.tot,0);});
  ok('un fichier, trois exercices : verdict « Importable avec le fichier de reprise », plus de faux « à-nouveaux mal datés »',()=>{assert.strictEqual(T_.planOf(R).title,'Importable avec le fichier de reprise');assert.ok(!R.issues.some(i=>/^À-nouveaux non datés/.test(i.title)));});
  R=set(R,{prefixOn:false,dropAN:false});
  ok('un fichier, trois exercices : options décochées → point à corriger',()=>{assert.strictEqual(lines(R).filter(l=>l[0]==='AN').length,11);assert.notStrictEqual(T_.planOf(R).title,'Importable avec le fichier de reprise');});
  // Sans journal d’à-nouveaux : découpage par la date de clôture du nom de fichier
  const FNA=path.join(tmp,'all','123456789FEC20251231.txt');fs.writeFileSync(FNA,[H,...body(F24),...body(F25)].filter(l=>!/^AN\|/.test(l)).join('\r\n')+'\r\n');
  [R]=await load([FNA]);
  ok('un fichier sans à-nouveaux, deux exercices : découpage par la clôture du nom de fichier',()=>{assert.deepStrictEqual(R.hints.exos.map(e=>e.label),['2024','2025']);assert.deepStrictEqual([...new Set(lines(R).map(l=>l[2]))],['2024-2','2024-3','2025-2']);});
  // Un seul exercice, à-nouveaux saisis en deux fois : pas plusieurs exercices
  const FAN2=path.join(tmp,'123456789FEC20250630.txt');fs.writeFileSync(FAN2,fs.readFileSync(F25,'utf8').replace('AN|A-nouveaux|1|20250101|445710|TVA collectee|||-|20250101','AN|A-nouveaux|1|20250115|445710|TVA collectee|||-|20250115'));
  [R]=await load([FAN2]);
  ok('un exercice, à-nouveaux à deux dates proches : un seul exercice',()=>{assert.strictEqual(R.hints.exos,null);assert.strictEqual(R._opts.dropAN,false);});

  // ---------- Comptes de tiers individuels → compte collectif d’Odoo ----------
  const FT=path.join(tmp,'tiers','123456789FEC20251231.txt');fs.mkdirSync(path.dirname(FT),{recursive:true});fs.writeFileSync(FT,[H,
   'VT|Ventes|1|20250105|411CELINE|Celine Dion|||FA1|20250105|Facture|120,00|0,00|||20250131||',
   'VT|Ventes|1|20250105|706000|Prestations|||FA1|20250105|Facture|0,00|120,00|||20250131||',
   'HA|Achats|1|20250106|0FOURN|Fournisseur Un|||FF1|20250106|Facture|0,00|60,00|||20250131||',
   'HA|Achats|1|20250106|606400|Fournitures|||FF1|20250106|Facture|60,00|0,00|||20250131||'].join('\r\n')+'\r\n');
  [R]=await load([FT]);
  const tl=R=>lines(R).filter(l=>/^4[01]/.test(l[4])).map(l=>l[4]+' '+l[6]);
  ok('tiers : regroupés par défaut sur 411100 / 401100, tiers en compte auxiliaire',()=>{assert.deepStrictEqual(tl(R),['411100 411CELINE','401100 FOURN']);assert.strictEqual(R._fix.nColl,1);assert.strictEqual(R._fix.nQuadra,1);});
  R=set(R,{recv:'411000',pay:'401000'});
  ok('tiers : compte cible modifiable',()=>assert.deepStrictEqual(tl(R),['411000 411CELINE','401000 FOURN']));
  ok('tiers : montants inchangés',()=>assert.deepStrictEqual(lines(R).map(l=>l[11]+'/'+l[12]),['120,00/0,00','0,00/120,00','0,00/60,00','60,00/0,00']));
  R=set(R,{collect:false});
  ok('tiers : case décochée, tiers Quadra toujours remis sur le compte collectif',()=>assert.deepStrictEqual(tl(R),['411CELINE ','401000 FOURN']));

  // Compte individuel avec CompAuxNum déjà rempli, et compte collectif 411000 / 401000 du FEC
  const FC=path.join(tmp,'coll','123456789FEC20251231.txt');fs.mkdirSync(path.dirname(FC),{recursive:true});fs.writeFileSync(FC,[H,
   'VT|Ventes|1|20250105|411CELINE|Celine Dion|CD|Celine Dion|FA1|20250105|Facture|120,00|0,00|||20250131||',
   'VT|Ventes|1|20250105|706000|Prestations|||FA1|20250105|Facture|0,00|120,00|||20250131||',
   'VT|Ventes|2|20250107|411000|Clients|C2|Client Deux|FA2|20250107|Facture|50,00|0,00|||20250131||',
   'VT|Ventes|2|20250107|706000|Prestations|||FA2|20250107|Facture|0,00|50,00|||20250131||',
   'HA|Achats|1|20250106|401|Fournisseurs|F1|Fournisseur Un|FF1|20250106|Facture|0,00|60,00|||20250131||',
   'HA|Achats|1|20250106|606400|Fournitures|||FF1|20250106|Facture|60,00|0,00|||20250131||',
   'HA|Achats|2|20250108|401700|Retenues|F1|Fournisseur Un|FF2|20250108|Retenue|0,00|10,00|||20250131||',
   'HA|Achats|2|20250108|606400|Fournitures|||FF2|20250108|Retenue|10,00|0,00|||20250131||'].join('\r\n')+'\r\n');
  [R]=await load([FC]);
  ok('tiers : compte individuel avec CompAuxNum déjà rempli regroupé, code tiers gardé',()=>assert.deepStrictEqual(tl(R)[0],'411100 CD'));
  ok('tiers : 411000 / 401 avec tiers reportés sur le compte par défaut, 401700 intact',()=>{assert.deepStrictEqual(tl(R).slice(1),['411100 C2','401100 F1','401700 F1']);assert.deepStrictEqual(R._fix.collAcc,['411CELINE','411000','401']);});
  R=set(R,{collect:false});
  ok('tiers : case décochée, comptes individuels et collectifs laissés tels quels',()=>assert.deepStrictEqual(tl(R),['411CELINE CD','411000 C2','401000 F1','401700 F1']));

  // Même lettre chez deux tiers regroupés sur le même compte : Odoo lettrerait les deux ensemble
  const FL=path.join(tmp,'let','123456789FEC20251231.txt');fs.mkdirSync(path.dirname(FL),{recursive:true});fs.writeFileSync(FL,[H,
   'VT|Ventes|1|20250110|411000|Clients|C2|Client Deux|FA1|20250110|Facture|100,00|0,00|A|20250228|20250131||',
   'VT|Ventes|1|20250110|706000|Prestations|||FA1|20250110|Facture|0,00|100,00|||20250131||',
   'VT|Ventes|2|20250111|411CELINE|Celine Dion|||FA2|20250111|Facture|120,00|0,00|A|20250228|20250131||',
   'VT|Ventes|2|20250111|706000|Prestations|||FA2|20250111|Facture|0,00|120,00|||20250131||',
   'BQ|Banque|1|20250228|411000|Clients|C2|Client Deux|RG1|20250228|Reglement|0,00|100,00|A|20250228|20250228||',
   'BQ|Banque|1|20250228|512000|Banque|||RG1|20250228|Reglement|100,00|0,00|||20250228||',
   'BQ|Banque|2|20250228|411CELINE|Celine Dion|||RG2|20250228|Reglement|0,00|120,00|A|20250228|20250228||',
   'BQ|Banque|2|20250228|512000|Banque|||RG2|20250228|Reglement|120,00|0,00|||20250228||'].join('\r\n')+'\r\n');
  [R]=await load([FL]);
  ok('tiers : lettre commune à deux tiers regroupés rendue unique par tiers',()=>assert.deepStrictEqual(lines(R).filter(l=>l[4]==='411100').map(l=>l[6]+' '+l[13]),['C2 C2-A','411CELINE 411CELINE-A','C2 C2-A','411CELINE 411CELINE-A']));
  R=set(R,{collect:false});
  ok('tiers : lettres sur des comptes distincts laissées telles quelles',()=>assert.deepStrictEqual(lines(R).filter(l=>/^411/.test(l[4])).map(l=>l[13]),['A','A','A','A']));

  fs.rmSync(tmp,{recursive:true,force:true});
  console.log(`\n${n} vérifications réussies`);
})().catch(e=>{console.error('✗ '+e.message);process.exit(1);});
