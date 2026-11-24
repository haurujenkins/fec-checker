// Deux habillages, un seul moteur : garde-fous sur le dossier saas/ (habillage de la version en ligne).
// Usage : node tests/habillage.js
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'saas','saas.js'),'utf8'),css=fs.readFileSync(path.join(root,'saas','saas.css'),'utf8');
let n=0,ko=0;const ok=(c,m)=>{n++;if(!c){ko++;console.log('ÉCHEC : '+m);}};
// 1. Le moteur reste le dernier <script> de index.html (tests/run.js le lit ainsi) et le chargement de saas/ est dans le <head>.
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
ok(scripts.length>=2&&/function render\(/.test(scripts[scripts.length-1]),'le dernier <script> de index.html doit être le moteur');
const head=html.slice(0,html.indexOf('</head>'));
ok(/saas\/saas\.css/.test(head)&&/saas\/saas\.js/.test(head),'le chargement de saas/ doit être dans le <head>');
ok(/\^https\?:\$/.test(head),'saas/ ne doit être chargé qu’en http(s) : le fichier seul garde l’habillage sobre');
// 2. saas.js : présentation seulement. Il ne touche ni aux données du moteur ni à ses fonctions de contrôle ou de correction.
for(const w of ['REPORTS','EDITS','ADDS','OPTS','fixFEC','planOf','runText','rerender','render(','handleFiles','parseAmt','saveFile','FileReader','fetch(','XMLHttpRequest'])
  ok(!js.includes(w),'saas.js ne doit pas utiliser « '+w+' » : aucun contrôle ni calcul dans saas/');
// 3. saas.css : tout est sous .saas, pour ne rien changer quand la classe n’est pas posée.
const body=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/@import[^\n]*\n/g,'');
const sels=[...body.matchAll(/(^|[{}])\s*([^{}@]+?)\s*\{/g)].map(m=>m[2]).filter(s=>!/^(from|to|\d+%)/.test(s));
const bad=sels.flatMap(s=>s.split(',')).map(s=>s.trim()).filter(s=>s&&!/^(:root)?\.saas\b/.test(s));
ok(bad.length===0,'sélecteurs sans .saas dans saas.css : '+bad.slice(0,5).join(' | '));
console.log(ko?`Habillage : ${ko} échec(s) sur ${n}`:`Habillage : ${n} vérifications conformes`);process.exit(ko?1:0);
