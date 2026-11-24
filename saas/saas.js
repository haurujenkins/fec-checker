/* Habillage « application » de la version en ligne (GitHub Pages).
   Présentation seulement : barre latérale, barre du haut, parcours à droite du rapport.
   Aucun contrôle ni calcul ici. Le moteur (contrôles, corrections, fichier de reprise) est celui de index.html,
   le même que dans la version hors ligne. Ce script ne lit que ce que la page a déjà affiché. */
(function(){
'use strict';
const H=document.documentElement;
if(!H.classList.contains('saas'))return;
const $=id=>document.getElementById(id),q=(s,r)=>(r||document).querySelector(s),qa=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const main=q('main'),top=q('header.top'),tabs=$('tabsNav'),foot=q('footer.appver'),resbar=$('resbar'),reports=$('reports');
if(!main||!tabs||!reports){H.classList.remove('saas');return;}

const svg=d=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC={
  tabCheck:'<path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6l7-3z"/><path d="M9 11.8l2.2 2.2 4.3-4.4"/>',
  tabView:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/>',
  tabMethod:'<path d="M4 6.5L5.5 8 8 5.5M4 12.5L5.5 14 8 11.5M4 18.5L5.5 20 8 17.5M11.5 7H20M11.5 13H20M11.5 19H20"/>',
  lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  down:'<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14"/>',
  sun:'<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'
};

/* ---------- Barre latérale : marque, navigation, dossier en cours, pied ---------- */
const sb=document.createElement('aside');sb.className='sb';sb.setAttribute('aria-label','Navigation');
sb.innerHTML=`<div class="sb-brand"><span class="sb-logo" aria-hidden="true"><svg viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="M9.5 16.5l4.2 4.2 8.8-9.4" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
<div class="sb-file" id="sbFile" hidden></div>
<div class="sb-foot">
<p class="sb-priv">${svg(IC.lock)}<span><b>Rien ne quitte votre poste</b>L’analyse se fait dans votre navigateur : aucun FEC n’est envoyé.</span></p>
<a class="sb-link" href="index.html" download="fec-it-until-you-make-it.html">${svg(IC.down)}<span>Version hors ligne (.html)</span></a>
<button class="sb-link" type="button" id="sbTheme"></button>
</div>`;
if(top)q('.sb-brand',sb).append(top);
tabs.classList.add('sb-nav');
qa('.tab',tabs).forEach(b=>{b.title=b.textContent.trim();if(IC[b.dataset.tab])b.insertAdjacentHTML('afterbegin',svg(IC[b.dataset.tab]));});
q('.sb-brand',sb).after(tabs);
if(foot)q('.sb-foot',sb).append(foot);

/* ---------- Zone de travail : barre du haut (titre de la section, fichier contrôlé, actions) ---------- */
const app=document.createElement('div');app.className='app';
const tb=document.createElement('div');tb.className='tb';
tb.innerHTML='<div class="tb-t"><h2 id="tbTitle"></h2><p id="tbSub"></p></div>';
document.body.insertBefore(app,main);app.append(tb,main);document.body.insertBefore(sb,app);
if(resbar)tb.append(resbar);

const TT={
  tabCheck:['Contrôle du FEC','Verdict, points à régler et fichier de reprise, avant l’import dans Odoo.'],
  tabView:['Lecture du FEC','Toutes les lignes du fichier, reliées aux constats du contrôle.'],
  tabMethod:['Méthodologie avant import','Les étapes avant, pendant et après l’import, et le cadre légal.']
};
let curTab='';
function syncTab(){
  const b=q('[role=tab][aria-selected="true"]',tabs),id=b&&TT[b.dataset.tab]?b.dataset.tab:'tabCheck';
  if(id===curTab)return;
  if(curTab&&id!=='tabCheck')window.scrollTo(0,0); // retour au contrôle : la page du moteur choisit où défiler (constat visé)
  curTab=id;document.body.dataset.tab=id;$('tbTitle').textContent=TT[id][0];$('tbSub').textContent=TT[id][1];
}
new MutationObserver(syncTab).observe(tabs,{attributes:true,subtree:true,attributeFilter:['aria-selected']});
syncTab();

/* ---------- Accueil : les trois promesses en cartes ---------- */
qa('#empty li').forEach(li=>{const b=q('b',li),t=b&&b.nextSibling;
  if(t&&t.nodeType===3){const s=t.textContent.replace(/^[\s:,]+/,'');t.textContent=s.charAt(0).toUpperCase()+s.slice(1);}});

/* ---------- Bulles « i » : retournées vers la gauche quand elles dépasseraient à droite ---------- */
const flip=ev=>{const t=ev.target.closest&&ev.target.closest('.tip');if(!t)return;const b=q('.tipb',t);if(!b)return;t.classList.remove('flip');
  if(b.getBoundingClientRect().right>innerWidth-12)t.classList.add('flip');};
document.addEventListener('mouseover',flip);document.addEventListener('focusin',flip);document.addEventListener('click',flip,true);

/* ---------- Mode clair / sombre (les deux habillages suivent déjà le réglage du système) ---------- */
const KEY='fec-theme',btn=$('sbTheme');
try{const t=localStorage.getItem(KEY);if(t==='dark'||t==='light')H.dataset.theme=t;}catch(e){}
const isDark=()=>H.dataset.theme?H.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
const themeLabel=()=>{btn.innerHTML=svg(isDark()?IC.sun:IC.moon)+`<span>${isDark()?'Mode clair':'Mode sombre'}</span>`;};
btn.addEventListener('click',()=>{H.dataset.theme=isDark()?'light':'dark';try{localStorage.setItem(KEY,H.dataset.theme);}catch(e){}themeLabel();});
themeLabel();

/* ---------- Après chaque contrôle : dossier en cours dans la barre latérale, parcours à droite du rapport ---------- */
function sync(){
  const reps=qa('.report',reports),box=$('sbFile');
  document.body.classList.toggle('has-report',reps.length>0);
  if(!reps.length){box.hidden=true;box.innerHTML='';return;}
  const single=$('fname')&&$('fname').firstChild?$('fname').firstChild.textContent.trim():'';
  box.innerHTML=`<p class="sb-lab">${reps.length>1?reps.length+' exercices':'Dossier en cours'}</p>`+reps.map(r=>{
    const v=q('.verdict',r),lvl=v?['ok','warn','err'].find(c=>v.classList.contains(c))||'':'',st={};
    qa('dl.stats>div',r).forEach(d=>{const k=q('dt',d),x=q('dd',d);if(k&&x)st[k.textContent.trim()]=x.textContent.trim();});
    const rn=q('.rname',r),name=rn&&rn.firstChild?rn.firstChild.textContent.trim():single;
    const rows=['Période','Lignes','Écritures','Journaux'].filter(k=>st[k]&&st[k]!=='—').map(k=>`<div><dt>${k}</dt><dd>${esc(st[k])}</dd></div>`).join('');
    return `<a class="sb-doc" href="#${r.id}"><span class="sb-fn">${esc(name)}</span>${v&&q('h2',v)?`<span class="vpill ${lvl}">${esc(q('h2',v).textContent)}</span>`:''}${rows?`<dl>${rows}</dl>`:''}</a>`;}).join('');
  box.hidden=false;
  reps.forEach(r=>{
    if(q(':scope>.rail',r))return;
    const col=document.createElement('div');col.className='rcol';
    [...r.children].filter(c=>!c.matches('.verdict,.rname')).forEach(c=>col.append(c));
    const rail=document.createElement('aside');rail.className='rail';rail.setAttribute('aria-label','Parcours et fichier de reprise');
    const route=q('ol.route',col),time=q('.vtime b',r),dl=q('.lvl.l2 .mainf [data-dl="fix"]',col)||q('[data-dl="fix"]',col),n1=q('.lvl.l1>h3 .count',col),cf=q('[data-confirm]',col);
    let h='';
    if(route)h+=`<section class="rcard rsteps"><h4>Votre parcours${time?`<span>${esc(time.textContent)}</span>`:''}</h4>${route.outerHTML}</section>`;
    if(dl)h+=`<section class="rcard rdl"><h4>Fichier de reprise</h4>
${n1?`<p class="rleft"><a href="#${r.id}" data-rtop>${esc(n1.textContent.trim())} point${+n1.textContent>1?'s':''} à corriger avant l’import</a></p>`:'<p>Le fichier à importer dans Odoo, à la place du FEC.</p>'}
<button class="btn${n1?'':' primary'}" type="button" data-dl="fix" data-r="${esc(dl.dataset.r)}"${dl.disabled?' disabled':''}>Télécharger</button>
${dl.disabled?`<p class="rhint"${cf&&cf.checked?' hidden':''}>${cf?'À valider d’abord : cochez « Correspondances de reprise validées » à l’étape « Préparer l’import ».':'Indisponible pour l’instant : voir l’étape « Préparer l’import ».'}</p>`:''}</section>`;
    rail.innerHTML=h;r.append(col,rail);
  });
}
new MutationObserver(sync).observe(reports,{childList:true});
sync();
document.addEventListener('change',ev=>{const c=ev.target.closest&&ev.target.closest('[data-confirm]');if(!c)return;const r=c.closest('.report');if(r)qa('.rail .rhint',r).forEach(p=>p.hidden=c.checked);});
document.addEventListener('click',ev=>{const a=ev.target.closest&&ev.target.closest('.sb-doc,[data-rtop]');if(!a)return;const t=q(a.getAttribute('href'));if(!t)return;ev.preventDefault();
  if($('tabCheck').hidden){const b=$('tabBtnCheck');if(b)b.click();}
  const l1=a.matches('[data-rtop]')&&q('.lvl.l1',t);(l1||t).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
})();
