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
eval(s+';global.T_={handleFiles,render,planOf,reports:()=>REPORTS,opts:()=>OPTS};');
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
const srcBal=p=>{const b={};for(const l of fs.readFileSync(p,'utf8').trim().split(/\r?\n/).slice(1).map(l=>l.split('|'))){const a=l[4];if(!/^[1-5]/.test(a)||/^12/.test(a))continue;b[a]=(b[a]||0)+amt(l[11])-amt(l[12]);}for(const k in b)if(!b[k])delete b[k];return b;};
let n=0;const ok=(t,f)=>{f();n++;console.log('✓ '+t);};

(async()=>{
  // ---------- Un seul exercice déposé ----------
  let [R]=await load([F25]);
  ok('un exercice : aucune option cochée d’office',()=>{assert.strictEqual(R._opts.prefixOn,false);assert.strictEqual(R._opts.dropAN,false);assert.deepStrictEqual(R._fix.opts,{prefix:'',dropAN:false});});
  ok('un exercice : numéros bruts et à-nouveaux gardés',()=>{assert.deepStrictEqual(lines(R).map(l=>l[2]),['1','1','1','1','2','2']);assert.strictEqual(lines(R).filter(l=>l[0]==='AN').length,4);});
  ok('un exercice : préfixe proposé = année de clôture',()=>assert.strictEqual(R._opts.prefix,'2025'));
  R=set(R,{prefixOn:true});
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

  Rs=await load([F26,F24,F25]);
  ok('trois exercices : à-nouveaux retirés des deux derniers seulement',()=>assert.deepStrictEqual(Rs.map(r=>lines(r).filter(l=>l[0]==='AN').length),[2,0,0]));
  ok('trois exercices : trois préfixes distincts, aucune pièce commune',()=>{assert.deepStrictEqual(Rs.map(r=>r._fix.opts.prefix),['2024-','2025-','2026-']);const all=Rs.map(nums);for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(![...all[j]].some(k=>all[i].has(k)));});
  ok('trois exercices : bilan importé = bilan de clôture 2026',()=>assert.deepStrictEqual(bal(Rs),srcBal(F26)));
  ok('trois exercices : intégrité réussie pour chaque fichier',()=>assert.ok(Rs.every(r=>r._fix.integrity.ok)));
  fs.rmSync(tmp,{recursive:true,force:true});
  console.log(`\n${n} vérifications réussies`);
})().catch(e=>{console.error('✗ '+e.message);process.exit(1);});
