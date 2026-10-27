/* Hero "Build & Recommended Equipment" section, from Dubb's stat cards.
   Gear / Aura / Echo names refer to window.EQDATA (eqdata.js, from the game files). */
(function(){
const EQ={
 "Bastet":{lv:200,
  goals:[["ATK","40K","60K","80K"],["Mastery","160%","200%","240%"],["Effect Hit","75%","100%","125%"],["SPD","2,200","2,600","2,800"]],
  gear:["Penetration","Bone Erosion","Wind Erosion"],
  aura:["Mastery Expert","Advanced Hit","Versatility","Bone-gnawing Toxin"],
  echo:["The Traveler's Diary","Uplifting Drums","Golden Sand Reverie"],
  gem:null}
};
window.HERO_EQ=EQ;
const DATA=()=>window.EQDATA||{gear:{},aura:{},echo:{}};
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const short={"Mastery Expert":"Mastery","Advanced Hit":"Adv. Hit","Bone-gnawing Toxin":"Poison","The Traveler's Diary":"Traveler’s Diary"};
function rich(e,s){String(s).split(/(\[[^\[\]]{2,40}\])/).forEach(p=>{if(/^\[.*\]$/.test(p))e.appendChild(el("b",null,p.slice(1,-1)));else if(p)e.appendChild(document.createTextNode(p))});return e}
function tile(kind,name){const d=DATA()[kind][name]||{};const t=el("div","eqtile eqk-"+kind+(d.q?" q"+d.q:""));t.tabIndex=0;
 const i=el("img");i.src="/img/eq/"+(d.i||"")+".webp";i.alt=name;i.loading="lazy";i.onerror=()=>i.style.visibility="hidden";t.appendChild(i);
 t.appendChild(el("span",null,short[name]||name));
 if(d.d){const tip=el("div","eqtip");tip.appendChild(el("b",null,name+(kind==="aura"?" Aura":kind==="gear"?" Set":"")));
  const txt=kind==="gear"?d.d.replace(/^[^:]+:\s*/,""):d.d;txt.split("\n").forEach(l=>tip.appendChild(rich(el("p"),l)));
  if(kind!=="gear")tip.appendChild(el("small",null,"At max "+(kind==="aura"?"star":"level")));t.appendChild(tip);t.setAttribute("aria-label",name+": "+txt)}
 return t}
const GIDX=()=>[...new Set((window.GEMS&&GEMS.gems||[]).map(g=>g.img))].sort();
function gemTile(name){const g=(window.GEMS&&GEMS.gems||[]).find(x=>x.en===name);if(!g)return el("span","eqtbd",name);
 const a=el("a","eqtile eqk-gem");a.href=PATH("gem-"+g.id);a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();NAV("gem-"+g.id)};
 const k=Math.max(0,GIDX().indexOf(g.img)),i=el("div","eqgem");i.style.backgroundPosition=((k%8)/7*100)+"% "+(Math.floor(k/8)/3*100)+"%";i.setAttribute("role","img");i.setAttribute("aria-label",g.en);
 a.appendChild(i);a.appendChild(el("span",null,g.en));a.title="Open "+g.en;return a}
function row(label,kids){const r=el("div","eqr");r.appendChild(el("div","eql",label));const b=el("div","eqv");kids.forEach(k=>b.appendChild(k));r.appendChild(b);return r}
function build(n){const q=EQ[n];if(!q)return null;
 const s=el("div","sec eqsec");s.appendChild(el("h3",null,"Build & recommended equipment"));
 if(q.goals){const w=el("div","eqgoal");const hd=el("div","eqgh");hd.appendChild(el("b",null,"Estimated stat goals"));if(q.lv)hd.appendChild(el("span","eqlv","Target Lv."+q.lv));w.appendChild(hd);
  const t=el("table","ptbl eqtbl"),h=el("tr");["","New","Mid","End"].forEach((x,i)=>h.appendChild(el("th",i?"eq"+i:null,x)));t.appendChild(h);
  q.goals.forEach(r=>{const tr=el("tr");r.forEach((x,i)=>tr.appendChild(el(i?"td":"th",i?"eq"+i:null,x)));t.appendChild(tr)});w.appendChild(t);s.appendChild(w)}
 if(q.gear)s.appendChild(row("Gear",q.gear.map(x=>tile("gear",x))));
 if(q.aura)s.appendChild(row("Aura",q.aura.map(x=>tile("aura",x))));
 if(q.echo)s.appendChild(row("Echo",q.echo.map(x=>tile("echo",x))));
 s.appendChild(row("Arcane Gem",q.gem&&q.gem.length?(Array.isArray(q.gem)?q.gem:[q.gem]).map(gemTile):[el("span","eqtbd","To be determined")]));
 return s}
/* tap outside closes an open tooltip on touch screens */
document.addEventListener("click",e=>{if(!e.target.closest(".eqtile"))document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains("eqtile")&&document.activeElement.blur()});
if(typeof show==="function"){const _s=show;show=function(n){const r=_s.apply(this,arguments);try{const d=document.getElementById("detail"),s=build(n);if(d&&s){const secs=[...d.querySelectorAll(".sec")];const kit=secs.find(x=>{const h=x.querySelector("h3");return h&&/^(Kit|Stat card|Videos)$/i.test(h.textContent.trim())});kit?kit.before(s):d.appendChild(s)}}catch(e){}return r}}
if(typeof route==="function")route();
})();
