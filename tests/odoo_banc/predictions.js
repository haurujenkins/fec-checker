// Analyse en lot : pour chaque paire, issues du FEC correct et du FEC erroné (sans rendu)
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(''+require("path").join(__dirname,"..","..","index.html")+'','utf8');
const s=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const els={};global.document={getElementById:id=>els[id]||(els[id]={addEventListener(){},set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},className:'',textContent:''}),createElement:()=>({}),body:{appendChild(){},removeChild(){}},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]};
global.XLSX=require('/tmp/nx/node_modules/xlsx');global.navigator={};global.window={};
global.FileReader=class{};
eval(s.replace('\nstartBatch(1);runText(SAMPLE_NAME,new TextEncoder().encode(SAMPLE).buffer,true);','')+';global.A=(name,buf)=>{CAPTURE=[];if(/\\.xlsx?$/i.test(name))runXlsx(name,buf);else runText(name,buf,false);const R=CAPTURE[0];CAPTURE=null;if(R)prepare(R,null);return R;};global.planOf=planOf;');
global.dg=(R)=>R.dgfip;
const out={};for(const b of [0,1,2,3,4])for(const f of JSON.parse(fs.readFileSync(`/tmp/claude-0/bench/b${b}.json`))){const bn=path.basename(f);const buf=fs.readFileSync(f);let R;try{R=A(bn.replace(/^[CE]_P\d+__/,""),buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength))}catch(e){out[bn]={crash:e.message};continue}
 const P=planOf(R);if(R._fix&&R._fix.integrity.ok&&Object.keys(R._fix.changes).length){fs.mkdirSync('/tmp/claude-0/s/rep',{recursive:true});fs.writeFileSync('/tmp/claude-0/s/rep/'+bn.slice(0,7)+'.txt',R._fix.text);}out[bn]={level:P.level,title:P.title,dg:R.dgfip?{rej:[...R.dgfip.rej].map(([k,a])=>k+':'+a.length),al:[...R.dgfip.al].map(([k,a])=>k+':'+a.length),nor:[...R.dgfip.nor].map(([k,a])=>k+':'+a.length)}:null,issues:R.issues.filter(i=>i._k&&['bloque','fausse'].includes(i._k.effect)).map(i=>i.title.slice(0,60)+'|'+i._k.where+'|'+i._k.effect),after:R._after?planOf(R._after).level:null};}
fs.writeFileSync('pred.json',JSON.stringify(out));
const L=Object.entries(out);console.log(L.length,'crash',L.filter(([k,v])=>v.crash).length,'C rej',L.filter(([k,v])=>k.startsWith('C_')&&v.dg&&v.dg.rej.length).map(([k,v])=>k+' '+v.dg.rej));
