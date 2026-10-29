/* Hero "Build & Recommended Equipment" section, from Dubb's stat cards.
   Gear / Aura / Echo names refer to window.EQDATA (eqdata.js, from the game files). */
(function(){
const EQ=window.HERO_EQ||{};
const DATA=()=>window.EQDATA||{gear:{},aura:{},echo:{}};
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const short={"Mastery Expert":"Mastery","Mastery Surge":"Mastery Surge","Advanced Hit":"Adv. Hit","Bone-gnawing Toxin":"Poison","Raging Inferno":"Burn","Unending Bleeding":"Bleed","Heart-piercing":"Internal Injury","Scorching Soul":"Scorching Soul","Hit Grandmaster":"HGM","Combat Vanguard":"CV","Dwarven Blessing":"Dwarven","Speed Mark":"Speed","The Traveler's Diary":"Traveler’s Diary","Rapid Rejuvenation":"Rapid Rejuv.","Firm Wind":"Firm Wind"};
function rich(e,s){String(s).split(/(\[[^\[\]]{2,40}\])/).forEach(p=>{if(/^\[.*\]$/.test(p))e.appendChild(el("b",null,p.slice(1,-1)));else if(p)e.appendChild(document.createTextNode(p))});return e}
const term=x=>I18N.term(x);
function tile(kind,name){const d=DATA()[kind][name]||{},X=I18N.eq(kind,name),on=I18N.lang!=="en"&&X;const t=el("div","eqtile eqk-"+kind+(d.q?" q"+d.q:""));t.tabIndex=0;
 const i=el("img");i.src="/img/eq/"+(d.i||"")+".webp";i.alt=name;i.loading="lazy";i.onerror=()=>i.style.visibility="hidden";t.appendChild(i);
 t.appendChild(el("span",null,on&&X[0]?X[0]:short[name]||name));
 if(d.d){const tip=el("div","eqtip");tip.appendChild(el("b",null,on&&X[0]?X[0]:name+(kind==="aura"?" Aura":kind==="gear"?" Set":"")));if(d.ms){const m=el("div","eqms");m.appendChild(el("span",null,T("Main stat")));m.appendChild(el("strong",null,I18N.ms(d.ms)));tip.appendChild(m)}
  const dd=on&&X[1]?X[1]:d.d,txt=kind==="gear"?dd.replace(/^[^:：]+[:：]\s*/,""):dd;txt.split("\n").forEach(l=>tip.appendChild(rich(el("p"),l)));
  if(kind!=="gear"&&!d.nd)tip.appendChild(el("small",null,T(kind==="aura"?"At max star":"At max level")));t.appendChild(tip);t.setAttribute("aria-label",(on&&X[0]?X[0]:name)+": "+txt)}
 return t}
const GIDX=()=>[...new Set((window.GEMS&&GEMS.gems||[]).map(g=>g.img))].sort();
function gemTile(name){const g=(window.GEMS&&GEMS.gems||[]).find(x=>x.en===name);if(!g)return el("span","eqtbd",name);
 const a=el("a","eqtile eqk-gem");a.href=PATH("gem-"+g.id);a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();NAV("gem-"+g.id)};
 const k=Math.max(0,GIDX().indexOf(g.img)),i=el("div","eqgem");i.style.backgroundPosition=((k%8)/7*100)+"% "+(Math.floor(k/8)/3*100)+"%";i.setAttribute("role","img");i.setAttribute("aria-label",g.en);
 const gn=(I18N.gem(g.id)||{}).n||g.en;a.appendChild(i);a.appendChild(el("span",null,gn));a.title=T("Open {x}",{x:gn});return a}

/* ---- Arcane Gem warning ---- */
function gemWarn(){const d=el("details","eqwarn");const sm=el("summary");sm.appendChild(el("span","eqwi","!"));sm.appendChild(document.createTextNode(T("Read before equipping")));d.appendChild(sm);
 const b=el("div","eqwb");const u=el("ul");
 [["Active gems"," need several stars before they’re useful. Equipping one too early can hurt your hero."],
  ["Passive gems"," are safe at low stars, but still choose carefully who gets them."],
  ["Removing a gem"," is free once per month. After that it costs 1,500 Diamonds (5 Primordial Potions)."]].forEach(([b1,t])=>{const li=el("li");li.appendChild(el("b",null,T(b1)));li.appendChild(document.createTextNode(T(t)));u.appendChild(li)});
 b.appendChild(u);const a=el("a",null,T("How Arcane Gems work")+" →");a.href=PATH("gems");a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();NAV("gems")};b.appendChild(a);d.appendChild(b);return d}
/* ---- Emblem tree ---- */
function emblemTree(sel){const E=(window.EMBLEMS||[]).filter(x=>!x.h),on=new Set(sel.map(Number));const w=el("div","embt");
 [["Attack",1],["Defense",2],["Support",3]].forEach(([lab,c])=>{const col=el("div","embc embc"+c);col.appendChild(el("div","embh",T(lab)+" · "+E.filter(x=>x.c===c&&on.has(x.id)).length));
  for(let r=1;r<=6;r++){const rw=el("div","embr");E.filter(x=>x.c===c&&x.r===r).sort((a,b)=>a.id-b.id).forEach(x=>{const o=on.has(x.id),t=el("div","emb"+(o?" on":""));t.tabIndex=0;
    const XE=I18N.emb(x.id)||[],xn=XE[0]||x.n,xd=XE[1]||x.d;const i=el("img");i.src="/img/emb/"+(o?x.i:x.ia)+".webp";i.alt=xn;i.loading="lazy";t.appendChild(i);if(o)t.appendChild(el("span","embl",x.mx+"/"+x.mx));
    const tip=el("div","eqtip");tip.appendChild(el("b",null,xn));xd.split("\n").forEach(l=>tip.appendChild(rich(el("p"),l)));tip.appendChild(el("small",null,(o?T("Recommended")+" · ":"")+T("At max level ({m})",{m:x.mx+"/"+x.mx})));t.appendChild(tip);t.setAttribute("aria-label",xn+": "+xd);rw.appendChild(t)});col.appendChild(rw)}
  w.appendChild(col)});return w}
function row(label,kids){const r=el("div","eqr");r.appendChild(el("div","eql",T(label)));const b=el("div","eqv");kids.forEach(k=>b.appendChild(k));r.appendChild(b);return r}
function build(n){const q=EQ[n];if(!q)return null;
 const s=el("div","sec eqsec");s.appendChild(el("h3",null,T("Build & recommended equipment")));
 if(q.goals){const w=el("div","eqgoal");const hd=el("div","eqgh");hd.appendChild(el("b",null,T("Estimated stat goals")));if(q.lv)hd.appendChild(el("span","eqlv",T("Target Lv.{n}",{n:q.lv})));w.appendChild(hd);
  const t=el("table","ptbl eqtbl"),h=el("tr");["","New","Mid","End"].forEach((x,i)=>h.appendChild(el("th",i?"eq"+i:null,x?T(x):x)));t.appendChild(h);
  q.goals.forEach(r=>{const tr=el("tr");r.forEach((x,i)=>tr.appendChild(el(i?"td":"th",i?"eq"+i:null,i?x:term(x))));t.appendChild(tr)});w.appendChild(t);s.appendChild(w)}
 if(q.goalnote)s.querySelector(".eqgoal").appendChild(el("p","eqnote2",T(q.goalnote)));
 {const k=[];if(Array.isArray(q.gear))q.gear.forEach(x=>k.push(tile("gear",x)));else if(q.gear)Object.entries(q.gear).forEach(([lab,L])=>{const g=el("div","eqgrp");g.appendChild(el("div","eqgl",T(lab)));const v=el("div","eqv");L.forEach(x=>v.appendChild(tile("gear",x)));g.appendChild(v);k.push(g)});
  if(q.gearnote)k.push(el("span","eqtxt",T(q.gearnote)));if(k.length)s.appendChild(row("Gear",k))}
 if(q.aura)s.appendChild(row("Aura",q.aura.map(x=>tile("aura",x))));
 if(q.echo){const k=q.echo.map(x=>tile("echo",x));if(q.echonote)k.push(el("span","eqtxt",T(q.echonote)));s.appendChild(row("Echo",k))}
 const gems=q.gem?(Array.isArray(q.gem)?q.gem:[q.gem]):[];
 if("gem" in q||q.gemnote){const r=row("Arcane Gem",gems.length?gems.map(gemTile):[el("span","eqtbd",T(q.gemnote||"To be determined"))]);r.querySelector(".eql").appendChild(gemWarn());s.appendChild(r)}
 if(q.emblems){if(Array.isArray(q.emblems))s.appendChild(row("Emblems",[emblemTree(q.emblems)]));else{const w=el("div","embw"),tb=el("div","embtabs"),box=el("div");const ks=Object.keys(q.emblems);
  const sh=k=>{box.replaceChildren(emblemTree(q.emblems[k]));[...tb.children].forEach(b=>b.classList.toggle("on",b.dataset.k===k))};
  ks.forEach(k=>{const b=el("button",null,T(k));b.type="button";b.dataset.k=k;b.onclick=()=>sh(k);tb.appendChild(b)});w.appendChild(tb);w.appendChild(box);sh(ks[0]);s.appendChild(row("Emblems",[w]))}}
 if(q.pet){const p=(window.PETS&&PETS.pets||[]).find(x=>x.en===q.pet);if(p){const a=el("a","eqtile eqk-pet");a.href=PATH("pet-"+p.id);a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();NAV("pet-"+p.id)};
  const k=(parseInt((/(\d+)/.exec(p.img)||[0,1])[1],10)||1)-1,i=el("div","eqgem");i.style.backgroundImage="url(/img/pets-p.webp)";i.style.backgroundSize="600% 400%";i.style.backgroundPosition=((k%6)/5*100)+"% "+(Math.floor(k/6)/3*100)+"%";
  const pn=(I18N.pet(p.id)||{}).n||p.en;a.appendChild(i);a.appendChild(el("span",null,pn));a.title=T("Open {x}",{x:pn});s.appendChild(row("Spirit Beast",[a]))}}
 return s}
/* tap outside closes an open tooltip on touch screens */
document.addEventListener("click",e=>{if(!e.target.closest(".eqtile,.emb"))document.activeElement&&document.activeElement.classList&&(document.activeElement.classList.contains("eqtile")||document.activeElement.classList.contains("emb"))&&document.activeElement.blur()});
if(typeof show==="function"){const _s=show;show=function(n){const r=_s.apply(this,arguments);try{const d=document.getElementById("detail"),s=build(n);if(d&&s){const secs=[...d.querySelectorAll(".sec")];const kit=secs.find(x=>{const h=x.querySelector("h3");return h&&/^(Kit|Stat card|Videos)$/i.test(h.textContent.trim())});kit?kit.before(s):d.appendChild(s)}}catch(e){}return r}}
if(typeof route==="function")route();
})();
