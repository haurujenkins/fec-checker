// Lance la logique de index.html sur des fichiers, sans navigateur.
// Usage : npm i xlsx@0.18.5 && node tests/run.js tests/fixtures/dc.txt [exports Odoo...]
// --json : verdict et points relevés en JSON (utilisé par tests/regression.js).
// TODAY=AAAA-MM-JJ fige la date du jour (contrôle des écritures datées dans le futur).
const fs=require('fs'),path=require('path');
const args=process.argv.slice(2),JSON_OUT=args.includes('--json'),files=args.filter(a=>a!=='--json');
if(process.env.TODAY){const D=Date,t=new D(process.env.TODAY+'T12:00:00').getTime();global.Date=class extends D{constructor(...a){super(...(a.length?a:[t]))}static now(){return t}};}
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const s=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const els={};global.document={getElementById:id=>els[id]||(els[id]={addEventListener(){},set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},className:'',textContent:''}),createElement:()=>({}),body:{appendChild(){},removeChild(){}},addEventListener(){},querySelector:()=>null};global.window={};
global.XLSX=require('xlsx');global.navigator={};
global.FileReader=class{readAsArrayBuffer(f){setTimeout(()=>{this.result=f._buf;this.onload();},0);}};
let last;eval(s+';global.handleFiles=handleFiles;');const render0=render;render=r=>{last=r;if(JSON_OUT)render0(r);};
const mk=p=>{const b=fs.readFileSync(p);return {name:path.basename(p),_buf:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
(async()=>{await handleFiles(files.map(mk));await new Promise(r=>setTimeout(r,100));
 if(JSON_OUT){console.log(JSON.stringify(last?last.map(R=>({name:R.name,verdict:planOf(R).title,issues:R.issues.map(i=>`[${i.sev}] ${i.title}${i.lines.length?' ('+i.lines.length+')':''}`)})):{message:els.fname.textContent}));return;}
 if(!last){console.log(els.fname.textContent);return;}
 for(const R of last){console.log(`== ${R.name}`);for(const i of R.issues)console.log(`[${i.sev}] ${i.title}${process.env.DESC&&!i.lines.length?" — "+i.desc:""}${i.lines.length?' ('+i.lines.length+') : '+i.lines.slice(0,5).join(' ; '):''}`);}})();
