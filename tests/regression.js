// Tests de non-régression : rejoue index.html sur les fixtures et compare au résultat figé dans tests/expected.json.
// Usage : node tests/regression.js            (vérifie)
//         node tests/regression.js --update   (refige après une modification voulue, puis relire le diff de expected.json)
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const F=path.join(__dirname,'fixtures'),EXP=path.join(__dirname,'expected.json'),TODAY='2026-10-22';
const rel=p=>path.relative(path.join(__dirname,'..'),p).split(path.sep).join('/');
const txt=d=>fs.readdirSync(d).filter(f=>/\.txt$/.test(f)).sort().map(f=>path.join(d,f));
const odoo=['comptes_actifs','comptes_inactifs','journaux'].map(k=>path.join(F,`odoo20_fr_export_${k}.xlsx`));
const csv=['export_comptes.csv','export_comptes_inactifs.csv','export_journaux.csv'].map(f=>path.join(F,f));
const cases={};
for(const p of txt(F))cases[rel(p)]=[p];
cases['multi-exercices']=[path.join(F,'123456789FEC20241231.txt'),path.join(F,'123456789FEC20251231.txt')];
cases['neg.txt + exports Odoo xlsx']=[path.join(F,'neg.txt'),...odoo];
cases['xyz.txt + exports Odoo csv']=[path.join(F,'xyz.txt'),...csv];
for(const e of fs.readdirSync(path.join(F,'editeurs')).sort())for(const p of txt(path.join(F,'editeurs',e)))cases[rel(p)]=[p];
for(const p of txt(path.join(F,'variantes')))cases[rel(p)]=[p];

const got={};
for(const [k,files] of Object.entries(cases))
  got[k]=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'run.js'),'--json',...files],{env:{...process.env,TODAY},encoding:'utf8'}));
if(process.argv.includes('--update')){fs.writeFileSync(EXP,JSON.stringify(got,null,1)+'\n');console.log(`${Object.keys(got).length} cas figés dans ${rel(EXP)}`);process.exit(0);}

const exp=JSON.parse(fs.readFileSync(EXP,'utf8'));let fail=0;
for(const k of new Set([...Object.keys(exp),...Object.keys(got)])){
  const a=JSON.stringify(exp[k]),b=JSON.stringify(got[k]);if(a===b)continue;fail++;
  console.log(`\n✗ ${k}`);
  if(!exp[k]){console.log('  nouveau cas, absent de expected.json');continue;}
  if(!got[k]){console.log('  cas disparu');continue;}
  exp[k].forEach((E,ix)=>{const G=got[k][ix]||{issues:[]};
    if(E.verdict!==G.verdict)console.log(`  ${E.name} : verdict « ${E.verdict} » → « ${G.verdict} »`);
    for(const i of E.issues)if(!(G.issues||[]).includes(i))console.log(`  - ${i}`);
    for(const i of G.issues||[])if(!E.issues.includes(i))console.log(`  + ${i}`);});
}
console.log(`\n${Object.keys(got).length-fail}/${Object.keys(got).length} cas conformes`);
if(fail){console.log('Si le changement est voulu : node tests/regression.js --update, puis relire le diff de tests/expected.json.');process.exit(1);}
