// Corrections saisies dans la page (« Corriger ici ») : elles vont dans le fichier de reprise, sont listées dans la table
// de correspondance et le contrôle d’intégrité en tient compte. Usage : node tests/saisies.js
const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const s=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const els={};global.document={getElementById:id=>els[id]||(els[id]={addEventListener(){},set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},className:'',textContent:''}),createElement:()=>({}),body:{appendChild(){},removeChild(){}},addEventListener(){},querySelector:()=>null};global.window={};
global.XLSX=require('xlsx');global.navigator={};
eval(s+';global.T={fixFEC,normCell,lastDay,EXPECTED,MAN_KEY,rowsIndex,suggest,balSugg,fixKind,adds:()=>ADDS,edits:()=>EDITS};');const {EXPECTED,MAN_KEY}=T;
const H=EXPECTED.join('|'),L=(...f)=>f.join('|');
const rows=[H,
 L('OD','Divers','1','20250230','641100','Salaires','','','P1','20250230','Paie','100,00','0,00','','','20250230','',''),
 L('OD','Divers','1','20250230','421000','Personnel','','','P1','20250230','Paie','0,00','100,00','','','20250230','',''),
 L('VT','Ventes','2','20250310','411100','Clients','C1','Client','F1','20250310','Facture','120,00','0,00','','','20250310','',''),
 L('VT','Ventes','2','20250310','706000','Ventes','','','F1','20250310','Facture','0,00','110,00','','','20250310','',''),
 L('vt','Ventes','2','20250310','445710','TVA','','','F1','20250310','Facture','0,00','20,00','','','20250310','','')].map(l=>l.split('|'));
// Sans saisie : le fichier de reprise ne touche ni aux dates ni aux montants
let F=T.fixFEC(rows,{});
assert.ok(F.integrity.ok);assert.strictEqual(F.out[0].EcritureDate,'20250230');assert.ok(!F.integrity.man);
// Avec saisies : dates, code journal, montant
const edits={2:{EcritureDate:'20250228',PieceDate:'20250228'},3:{EcritureDate:'20250228'},5:{Credit:'100,00'},6:{JournalCode:'VT'}};
F=T.fixFEC(rows,{edits});
assert.ok(F.integrity.ok,'intégrité attendue, écart de saisie compris');
assert.deepStrictEqual(F.integrity.man,{n:5,add:0,d:0,c:-1000});
assert.strictEqual(F.out[0].EcritureDate,'20250228');assert.strictEqual(F.out[3].Credit,'100,00');assert.strictEqual(F.out[4].JournalCode,'VT');
assert.ok(F.changes[MAN_KEY]&&F.changes[MAN_KEY].kind==='man');
assert.ok(F.corrCsv.includes('5;Credit (saisie manuelle);110,00;100,00'));
assert.ok(F.corrCsv.includes('6;JournalCode (saisie manuelle);vt;VT'));
// Saisie identique à la valeur du fichier : rien n’est listé
F=T.fixFEC(rows,{edits:{4:{Debit:'120,00'}}});assert.ok(!F.integrity.man);
// Mise au format des valeurs saisies
assert.strictEqual(T.normCell('EcritureDate','28/02/2025'),'20250228');
assert.strictEqual(T.normCell('EcritureDate','30/02/2025'),null);
assert.strictEqual(T.normCell('Debit','1 200,5'),'1200,50');
assert.strictEqual(T.normCell('Debit','abc'),null);
assert.strictEqual(T.lastDay('20240230'),'20240229');assert.strictEqual(T.lastDay('20250231'),'20250228');
// Ligne ajoutée à une écriture : copiée de la ligne d’ancrage (journal, numéro, dates), insérée juste après, comptée par l’intégrité
F=T.fixFEC(rows,{adds:{4:[{CompteNum:'471000',CompteLib:'Compte d’attente',EcritureLib:'',Debit:'10,00',Credit:'0,00'}]}});
assert.ok(F.integrity.ok,'intégrité attendue avec la ligne ajoutée');assert.strictEqual(F.out.length,6);
assert.deepStrictEqual(F.integrity.man,{n:0,add:1,d:1000,c:0});
const ad=F.out[3];assert.strictEqual(ad.CompteNum,'471000');assert.strictEqual(ad.JournalCode,'VT');assert.strictEqual(ad.EcritureNum,'2');assert.strictEqual(ad.EcritureDate,'20250310');assert.strictEqual(ad.CompAuxNum,'');assert.strictEqual(ad.Debit,'10,00');
assert.ok(F.corrCsv.includes('4+1;ligne ajoutée (saisie manuelle)'));assert.ok(F.changes[MAN_KEY]);
// Pistes pour une écriture déséquilibrée : TVA oubliée retrouvée par le taux, puis compte d’attente
const R={name:'t.txt',hints:{fyStart:'20250101'},rows:[H,
 L('VT','Ventes','1','20250310','411000','Clients','','','F1','20250310','Facture','120,00','0,00','','','20250310','',''),
 L('VT','Ventes','1','20250310','706000','Ventes','','','F1','20250310','Facture','0,00','100,00','','','20250310','',''),
 L('VT','Ventes','2','20250311','411000','Clients','','','F2','20250311','Facture','-50,00','0,00','','','20250311','',''),
 L('VT','Ventes','2','20250311','706000','Ventes','','','F2','20250311','Facture','0,00','0,00','','','20250311','',''),
 L('VT','Ventes','3','20250312','445710','TVA','','','F3','20250312','Facture','0,00','4,00','','','20250312','',''),
 L('VT','Ventes','3','20250312','411000','Clients','','','F3','20250312','Facture','4,00','0,00','','','20250312','','')].map(l=>l.split('|'))};
const I=T.rowsIndex(R),P=T.balSugg(R,I,[2,3],3,2000,'VT/1');
assert.ok(/TVA oubliée : 20,00 € au crédit sur 445710 \(20 % de 100,00 € HT\)/.test(P[0].t),P[0].t);
assert.ok(P.some(x=>/471000/.test(x.t)));
P[0].go();const A=T.adds()['t.txt'][3][0];assert.strictEqual(A.CompteNum,'445710');assert.strictEqual(A.Credit,'20,00');assert.strictEqual(A.CompteLib,'TVA');
F=T.fixFEC(R.rows,{adds:T.adds()['t.txt']});assert.ok(F.integrity.ok);assert.strictEqual(F.out[2].Credit,'20,00');
// Suggestions selon le point relevé : montant négatif passé de l’autre côté, devise au format ISO, à-nouveau au 1er jour
assert.strictEqual(T.suggest(R,I,4,'Debit','Montant négatif'),'0,00');assert.strictEqual(T.suggest(R,I,4,'Credit','Montant négatif'),'50,00');
assert.strictEqual(T.fixKind({title:'Montant négatif',lines:[4],label:'Ligne',_k:{where:'source',effect:'fausse'}}).f.join(),'Debit,Credit');
assert.strictEqual(T.fixKind({title:'Codes de compte non numériques',lines:['A1'],label:'Compte',_k:{where:'source',effect:'fausse'}}).m,'acc');
console.log('Saisies : 25 vérifications conformes');
