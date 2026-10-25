/* Path-based router + per-page SEO meta for imrdatabase.com */
(function(){
const SITE="https://imrdatabase.com",BRAND="Infinite Magicraid Database";
const sl=n=>String(n).toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const PETL=(window.PETS&&window.PETS.pets)||[],GEML=(window.GEMS&&window.GEMS.gems)||[];
const PBY={},PID={},GBY={},GID={};
PETL.forEach(p=>{const s=sl(p.en);PBY[s]=p;PID[p.id]=s});
GEML.forEach(g=>{const s=sl(g.en);GBY[s]=g;GID[g.id]=s});
window.SLUG2=sl;window.PET_SLUGS=PID;window.GEM_SLUGS=GID;

/* names for factions / damage tags are resolved lazily (app.js defines D and X) */
function facBySlug(s){try{const f=D.map(d=>d[0]).find(f=>sl(f)===s);return f||null}catch(e){return null}}
function tagBySlug(s){try{const t=[...new Set(Object.values(X).flatMap(v=>v[1]))].find(t=>sl(t)===s);return t||null}catch(e){return null}}

/* path -> route key */
window.ROUTEKEY=function(){
 const p=location.pathname.replace(/\/index\.html$/,"/").replace(/\/+$/,"")||"/";
 const seg=p.split("/").filter(Boolean);
 if(!seg.length)return "home";
 const [a,b]=seg;
 if(a==="heroes")return b?b:"heroes";
 if(a==="game-overview"&&!b)return "overview";
 if(a==="spirit-beasts"){if(!b)return "pets";const x=PBY[b];return x?"pet-"+x.id:"pets"}
 if(a==="arcane-gems"){if(!b)return "gems";const x=GBY[b];return x?"gem-"+x.id:"gems"}
 if(a==="factions"&&b){const f=facBySlug(b);return f?"fac:"+f:"heroes"}
 if(a==="damage-tags"&&b){const t=tagBySlug(b);return t?"dt:"+t:"heroes"}
 return "notfound"};

/* route key -> path */
window.PATH=function(k){
 if(!k||k==="home")return "/";
 if(k==="heroes")return "/heroes/";
 if(k==="overview")return "/game-overview/";
 if(k==="pets")return "/spirit-beasts/";
 if(k==="gems")return "/arcane-gems/";
 let m;
 if((m=/^pet-(\d+)$/.exec(k)))return "/spirit-beasts/"+(PID[m[1]]||"")+"/";
 if((m=/^gem-(\d+)$/.exec(k)))return "/arcane-gems/"+(GID[m[1]]||"")+"/";
 if(k.startsWith("fac:"))return "/factions/"+sl(k.slice(4))+"/";
 if(k.startsWith("dt:"))return "/damage-tags/"+sl(k.slice(3))+"/";
 return "/heroes/"+k+"/"};

window.NAVP=function(k){const p=PATH(k);if(location.pathname!==p)history.pushState(null,"",p);SETMETA()};
window.NAV=function(k){const p=PATH(k);if(location.pathname!==p)history.pushState(null,"",p);if(typeof route==="function")route();SETMETA();window.scrollTo(0,0)};

/* legacy #hash links from the old artifact */
if(location.hash.length>1){const h=decodeURIComponent(location.hash.slice(1));history.replaceState(null,"",PATH(h==="home"?"home":h))}

/* faction / damage-tag listing pages */
let LISTK=null;
window.LISTR=function(k){
 const fac=k.startsWith("fac:"),dt=k.startsWith("dt:");
 const hd=document.getElementById("lhd");
 if(!fac&&!dt){
  if(LISTK){LISTK=null;if(hd)hd.remove();MSI.forEach(i=>SEL[i].clear());render()}
  if(k==="notfound"){showNF();return true}
  hideNF();return false}
 hideNF();
 ["HOMER","GEMR","PETR","OVR"].forEach(f=>window[f]&&window[f]("__none"));
 MSI.forEach(i=>SEL[i].clear());
 const v=fac?k.slice(4):k.slice(3);
 if(fac)SEL.fac.add(v);else SEL.dtag.add(v);
 LISTK=k;back(true);render();
 let h=hd;if(!h){h=document.createElement("div");h.id="lhd";h.className="lhd";const g=document.getElementById("count");g.parentNode.insertBefore(h,g)}
 const n=H.filter(x=>fac?x.f===v:(X[x.n]&&X[x.n][1].includes(v))).length;
 h.replaceChildren();
 const t=document.createElement("h2");t.textContent=fac?v+" Faction Heroes":v+" Heroes";h.appendChild(t);
 const p=document.createElement("p");p.textContent=fac?`All ${n} heroes of the ${v} faction in Infinite Magicraid, with tiers, skills and builds.`:`All ${n} Infinite Magicraid heroes that deal ${v} damage, with tiers, skills and builds.`;h.appendChild(p);
 const a=document.createElement("a");a.href="/heroes/";a.textContent="← All heroes";a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();NAV("heroes")};h.appendChild(a);
 window.scrollTo(0,0);return true};

function showNF(){["list","detail","home","pets","pdetail","gems","gdetail","overview"].forEach(i=>{const e=document.getElementById(i);if(e)e.hidden=true});let n=document.getElementById("nf");if(!n){n=document.createElement("div");n.id="nf";n.className="nf";n.innerHTML='<h1>Page not found</h1><p>That page doesn’t exist. Try the <a href="/heroes/">hero list</a>, <a href="/spirit-beasts/">Spirit Beasts</a> or <a href="/arcane-gems/">Arcane Gems</a>.</p>';document.querySelector("main").appendChild(n)}n.hidden=false}
function hideNF(){const n=document.getElementById("nf");if(n)n.hidden=true}

/* ---- meta ---- */
const clip=(s,n)=>{s=String(s||"").replace(/\s+/g," ").trim();return s.length>n?s.slice(0,n-1).replace(/\s+\S*$/,"")+"…":s};
function meta(k){
 const pth=PATH(k);let m;
 if(k==="home")return{t:"Infinite Magicraid Database – Heroes, Tier List, Spirit Beasts & Arcane Gems",d:"Fan-made Infinite Magicraid database: every hero with skills, tier, damage tags and builds, plus Spirit Beasts, Arcane Gems, guides and videos by Dubb."};
 if(k==="heroes")return{t:"All Heroes & Tier List | Infinite Magicraid Database",d:"Browse every Infinite Magicraid hero. Filter by faction, rarity, tier, class, damage tag, buffs and debuffs, and open any hero for skills and builds."};
 if(k==="overview")return{t:"Infinite Magicraid Game Overview – LTEs vs Legendaries, Priorities & Resources",d:"New to Infinite Magicraid? What the game is, how LTEs differ from Legendaries, what to prioritize, and how to manage Miracle Runes, Diamonds and Dragon Eyes."};
 if(k==="pets")return{t:"Spirit Beasts (Pets) – Skills, Stars & Equipment | Infinite Magicraid",d:"All Infinite Magicraid Spirit Beasts with star-by-star skills, damage tags, how to obtain them and recommended Sorcery Orb, Hallow Crystal and Divinity Stone."};
 if(k==="gems")return{t:"Arcane Gems – Effects, Cooldowns & Best Heroes | Infinite Magicraid",d:"Every Infinite Magicraid Arcane Gem with full effects by star, cooldowns and which heroes should use them."};
 if((m=/^pet-(\d+)$/.exec(k))){const p=PETL.find(x=>x.id==m[1]);if(p){const s=(p.skills&&p.skills[0]&&p.skills[0].en)||"";return{t:`${p.en} – Spirit Beast Skills, Stars & Best Equipment | Infinite Magicraid`,d:clip(`${p.en} (${p.q} Spirit Beast) in Infinite Magicraid: ${s} Star upgrades, damage tags and recommended equipment.`,158)}}}
 if((m=/^gem-(\d+)$/.exec(k))){const g=GEML.find(x=>x.id==m[1]);if(g){const s=(g.full&&g.full.en)||"";return{t:`${g.en} – Arcane Gem Effect & Best Heroes | Infinite Magicraid`,d:clip(`${g.en} (${g.q} Arcane Gem) in Infinite Magicraid: ${s}`,158)}}}
 if(k.startsWith("fac:")){const f=k.slice(4);return{t:`${f} Faction Heroes | Infinite Magicraid Database`,d:`Every ${f} faction hero in Infinite Magicraid with rarity, tier, damage tags, skills and recommended builds.`}}
 if(k.startsWith("dt:")){const t=k.slice(3);return{t:`${t} Heroes | Infinite Magicraid Database`,d:`All Infinite Magicraid heroes with the ${t} damage tag, with tiers, factions, skills and builds.`}}
 if(k==="notfound")return{t:"Page not found | Infinite Magicraid Database",d:"",nf:1};
 const h=H.find(x=>sl(x.n)===k||x.n===k);
 if(h){const x=X[h.n]||[],tags=(x[1]||[]).join(", "),tier=x[0]?` ${x[0]} tier.`:"";
  return{t:`${h.n} – Skills, Kit, Tier & Build | Infinite Magicraid`,d:clip(`${h.n} is ${/^[AEIOU]/.test(h.r)?"an":"a"} ${h.r} ${h.f} hero in Infinite Magicraid.${tier}${tags?" Damage: "+tags+".":""} Full skills, exclusive gear, stats, buffs, debuffs and recommended build.`,158)}}
 return{t:BRAND,d:""}}
function setTag(sel,attr,key,val){let e=document.head.querySelector(sel);if(!e){e=document.createElement(sel.startsWith("link")?"link":"meta");const [a,b]=key;e.setAttribute(a,b);document.head.appendChild(e)}e.setAttribute(attr,val)}
window.PAGEMETA=meta;
window.SETMETA=function(){
 const k=ROUTEKEY(),m=meta(k),url=SITE+PATH(k);
 document.title=m.t;
 setTag('meta[name="description"]',"content",["name","description"],m.d);
 setTag('link[rel="canonical"]',"href",["rel","canonical"],url);
 setTag('meta[property="og:title"]',"content",["property","og:title"],m.t);
 setTag('meta[property="og:description"]',"content",["property","og:description"],m.d);
 setTag('meta[property="og:url"]',"content",["property","og:url"],url);
 setTag('meta[name="robots"]',"content",["name","robots"],m.nf?"noindex":"index,follow")};
})();
