// Banc d'essai sur un jeu de paires FEC correct / erroné (format du jeu « fichiers FECS » : index.csv + 03_reference_erreurs).
// Usage : npm i xlsx@0.18.5 && node tests/bench_dataset.js "chemin/fichiers FECS" [nb_paires]  -> tests/bench_result.json, puis python3 tests/bench_measure.py
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const s=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const els={};global.document={getElementById:id=>els[id]||(els[id]={addEventListener(){},set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},className:'',textContent:''}),createElement:()=>({}),body:{appendChild(){},removeChild(){}},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]};
global.XLSX=require('xlsx');global.navigator={};global.window={};
global.FileReader=class{};
eval(s.replace('\nstartBatch(1);runText(SAMPLE_NAME,new TextEncoder().encode(SAMPLE).buffer,true);','')+';global.A=(name,buf)=>{CAPTURE=[];if(/\\.xlsx?$/i.test(name))runXlsx(name,buf);else runText(name,buf,false);const R=CAPTURE[0];CAPTURE=null;if(R)prepare(R,null);return R;};global.planOf=planOf;');
const D=path.resolve(process.argv[2]||'fichiers FECS')+'/';
const idx=fs.readFileSync(D+'index.csv','utf8').trim().split('\n').slice(1).map(l=>{const m=l.match(/("[^"]*"|[^;]*)/g).filter((x,i,a)=>true);return l;});
const rows=fs.readFileSync(D+'index.csv','utf8').trim().split(/\r?\n/).slice(1).map(l=>{const out=[];let cur='',q=false;for(const ch of l){if(ch=='"'){q=!q;continue}if(ch==';'&&!q){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out;});
const res=[];
const lim=+process.argv[3]||rows.length;
for(const r of rows.slice(0,lim)){const [paire,profil,siren,deb,fin,nb,fam,ne,codes,fc,fe,ref]=r;
 const one=f=>{const b=fs.readFileSync(D+f);const R=A(path.basename(f),b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));if(!R)return null;const P=planOf(R);
   return {verdict:P.title,level:P.level,issues:R.issues.map(i=>({t:i.title,sev:i.sev,n:i.lines.length,lines:i.lines.map(String)})),integ:R._fix?R._fix.integrity.ok:null};};
 let C=null,E=null;try{C=one(fc)}catch(e){C={crash:e.message}};try{E=one(fe)}catch(e){E={crash:e.message}}
 res.push({paire,profil,fam,codes:codes.split(';'),C,E,ref:JSON.parse(fs.readFileSync(D+ref,'utf8'))});}
fs.writeFileSync(path.join(__dirname,'bench_result.json'),JSON.stringify(res));console.log('done',res.length);
