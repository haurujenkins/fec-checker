// Lettrages à cheval sur deux exercices : la lettre d'un à-nouveaux retiré est reportée sur la ligne d'origine restée ouverte.
// FEC fictifs (aucune donnée client). Deux situations : un seul fichier sur deux exercices, deux fichiers déposés ensemble.
// Usage : npm i --no-save xlsx@0.18.5 && node tests/lettrage_cheval.js
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert');
const D0=Date,T=new D0('2026-11-05T12:00:00').getTime();global.Date=class extends D0{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const s=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const els={};global.document={getElementById:id=>els[id]||(els[id]={addEventListener(){},set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},className:'',textContent:''}),createElement:()=>({}),body:{appendChild(){},removeChild(){}},addEventListener(){},querySelector:()=>null};global.window={};
global.XLSX=require('xlsx');global.navigator={};
global.FileReader=class{readAsArrayBuffer(f){setTimeout(()=>{this.result=f._buf;this.onload();},0);}};
eval(s+';global.T_={handleFiles,render,reports:()=>REPORTS,opts:()=>OPTS,combined};');
const H='JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise';
const L=(j,n,d,cpt,aux,ref,deb,cre,let_='')=>[j,j==='AN'?'A-nouveaux':j==='VT'?'Ventes':j==='HA'?'Achats':'Banque',n,d,cpt,cpt,aux,aux?'TIERS '+aux:'',ref,d,ref+' '+(aux||cpt),deb,cre,let_,let_?d:'',d,'',''].join('|');
const Y24=[
 L('AN',1,'20240101','101300','','-','0,00','10000,00'),L('AN',1,'20240101','512100','','-','10000,00','0,00'),
 L('VT',2,'20240310','411000','C1','FA1','300,00','0,00','AA'),L('VT',2,'20240310','706000','','FA1','0,00','300,00'),
 L('BQ',3,'20240410','512100','','-','300,00','0,00'),L('BQ',3,'20240410','411000','C1','-','0,00','300,00','AA'),
 L('VT',4,'20241115','411000','C1','FA10','1200,00','0,00'),L('VT',4,'20241115','706000','','FA10','0,00','1200,00'),
 L('VT',5,'20241120','411000','C2','FA11','600,00','0,00'),L('VT',5,'20241120','706000','','FA11','0,00','600,00'),
 L('VT',6,'20241122','411000','C2','FA12','300,00','0,00'),L('VT',6,'20241122','706000','','FA12','0,00','300,00'),
 L('VT',7,'20241201','411000','C3','FA13','500,00','0,00'),L('VT',7,'20241201','706000','','FA13','0,00','500,00'),
 L('VT',8,'20241202','411000','C3','FA14','500,00','0,00'),L('VT',8,'20241202','706000','','FA14','0,00','500,00'),
 L('VT',9,'20241203','411000','C4','-','400,00','0,00'),L('VT',9,'20241203','706000','','-','0,00','400,00'),
 L('VT',10,'20241203','411000','C4','-','400,00','0,00'),L('VT',10,'20241203','706000','','-','0,00','400,00'),
 L('VT',11,'20241205','411000','C5','FA15','100,00','0,00'),L('VT',11,'20241205','706000','','FA15','0,00','100,00'),
 L('HA',12,'20241210','607000','','FF1','240,00','0,00'),L('HA',12,'20241210','401000','F1','FF1','0,00','240,00')];
const AN25=[
 L('AN',1,'20250101','101300','','-','0,00','10000,00'),L('AN',1,'20250101','512100','','-','10300,00','0,00'),
 L('AN',1,'20250101','411000','C1','FA10','1200,00','0,00','AB'),
 L('AN',1,'20250101','411000','C2','-','900,00','0,00','AC'),
 L('AN',1,'20250101','411000','C3','FA13','500,00','0,00','AD'),L('AN',1,'20250101','411000','C3','FA14','500,00','0,00'),
 L('AN',1,'20250101','411000','C4','-','400,00','0,00','AE'),L('AN',1,'20250101','411000','C4','-','400,00','0,00'),
 L('AN',1,'20250101','411000','C5','FA15','100,00','0,00','AA'),
 L('AN',1,'20250101','401000','F1','FF1','0,00','240,00','AF'),
 L('AN',1,'20250101','120000','','-','0,00','4060,00')];
const Y25=[
 L('BQ',2,'20250115','512100','','-','3100,00','0,00'),
 L('BQ',2,'20250115','411000','C1','-','0,00','1200,00','AB'),L('BQ',2,'20250115','411000','C2','-','0,00','900,00','AC'),
 L('BQ',2,'20250115','411000','C3','-','0,00','500,00','AD'),L('BQ',2,'20250115','411000','C4','-','0,00','400,00','AE'),
 L('BQ',2,'20250115','411000','C5','-','0,00','100,00','AA'),
 L('BQ',3,'20250120','401000','F1','-','240,00','0,00','AF'),L('BQ',3,'20250120','512100','','-','0,00','240,00')];
const tmp=process.env.OUT||fs.mkdtempSync(path.join(os.tmpdir(),'fec-cheval-')); // OUT=dossier : garde les FEC fictifs (test d’import réel)
const w=(n,rows,sub)=>{fs.mkdirSync(path.join(tmp,sub),{recursive:true});const p=path.join(tmp,sub,n);fs.writeFileSync(p,[H,...rows].join('\r\n')+'\r\n');return p;};
const mk=p=>{const b=fs.readFileSync(p);return {name:path.basename(p),_buf:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
const load=async files=>{await T_.handleFiles(files.map(mk));await new Promise(r=>setTimeout(r,100));for(const k of Object.keys(T_.opts()))delete T_.opts()[k];T_.render(T_.reports());return T_.reports();};
const rows=R=>R._fix.text.trim().split('\r\n').slice(1).map(l=>l.split('\t'));
const letOf=(Rs,ref,aux)=>Rs.flatMap(rows).filter(l=>l[8]===ref&&l[6]===aux&&l[0]==='VT').map(l=>l[13]);
const tot=Rs=>Rs.flatMap(rows).reduce((t,l)=>t+Math.round(parseFloat(l[11].replace(',','.'))*100)-Math.round(parseFloat(l[12].replace(',','.'))*100),0);
// Lettres soldées dans la base (compte + lettre) : ce que fera Odoo à la comptabilisation
const solde=Rs=>{const m=new Map();for(const l of Rs.flatMap(rows))if(l[13]){const k=l[4]+'|'+l[13];m.set(k,(m.get(k)||0)+Math.round(parseFloat(l[11].replace(',','.'))*100)-Math.round(parseFloat(l[12].replace(',','.'))*100));}return m;};
let n=0;const ok=(t,f)=>{f();n++;console.log('✓ '+t);};
(async()=>{
  for(const mode of ['deux fichiers','un seul fichier']){
    const Rs=mode==='deux fichiers'?await load([w('111222333FEC20241231.txt',Y24,'deux_fichiers'),w('111222333FEC20251231.txt',[...AN25,...Y25],'deux_fichiers')]):await load([w('111222333FEC20251231.txt',[...Y24,...AN25,...Y25],'un_fichier')]);
    ok(`${mode} : à-nouveaux 2025 retirés, montants inchangés`,()=>{assert(Rs.every(R=>R._fix.integrity.ok));assert.equal(tot(Rs),0);assert(!Rs.flatMap(rows).some(l=>l[0]==='AN'&&l[3].startsWith('2025')));});
    const C=T_.combined(Rs);
    ok(`${mode} : AN détaillé (même pièce) → lettre reportée sur la facture 2024`,()=>{assert.deepEqual(letOf(Rs,'FA10','C1'),['AB']);assert.deepEqual(letOf(Rs,'FA13','C3'),['AD']);assert.deepEqual(letOf(Rs,'FA14','C3'),['']);});
    ok(`${mode} : AN global par tiers → lettre reportée sur toutes ses factures ouvertes`,()=>{assert.deepEqual(letOf(Rs,'FA11','C2'),['AC']);assert.deepEqual(letOf(Rs,'FA12','C2'),['AC']);});
    ok(`${mode} : fournisseur lettré aussi`,()=>{assert.deepEqual(Rs.flatMap(rows).filter(l=>l[8]==='FF1'&&l[6]==='F1').map(l=>l[13]),['AF']);});
    ok(`${mode} : deux factures identiques sans référence → rien reporté, signalé`,()=>{assert.deepEqual(letOf(Rs,'-','C4'),['','']);assert(Rs.some(R=>R._fix.left.some(x=>/Lettrage à cheval non reporté.*C4 lettre AE/.test(x))));});
    ok(`${mode} : lettres reportées soldées sur les deux exercices`,()=>{const m=solde(Rs);for(const [k,v] of m)if(/\|(AB|AC|AD|AF)$/.test(k))assert.equal(v,0,k);});
    if(mode==='deux fichiers')ok('deux fichiers : lettre déjà prise en 2024 sur le compte → non reportée, signalée',()=>{assert.deepEqual(letOf(Rs,'FA15','C5'),['']);assert(Rs[0]._fix.left.some(x=>/déjà prise/.test(x)));});
    else ok('un seul fichier : lettre partagée par deux tiers préfixée par le tiers, puis reportée',()=>{assert.deepEqual(letOf(Rs,'FA15','C5'),['C5-AA']);});
    ok(`${mode} : table de correspondance et fichier combiné`,()=>{assert(Rs.some(R=>R._fix.corr.some(c=>c[1]==='EcritureLet'&&c[2]===''&&c[3]==='AB')));assert(C.ok);});
  }
  console.log(`${n} vérifications OK`);
})().catch(e=>{console.error(e);process.exit(1);});
