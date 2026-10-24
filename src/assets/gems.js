/* Arcane Gems section — plugs into the main hero database page (same pattern as pets.js). */
(function(){
const GD=window.GEMS,G=GD.gems,RK={Legend:0,Epic:1,Elite:2};
const RU={"Legend":"Легенда","Epic":"Эпик","Elite":"Элита","Arcane Gems":"Камни мага","All rarities":"Все редкости","All types":"Все типы","All effects":"Все эффекты","Active":"Активный","Passive":"Пассивный","Sort: rarity":"Сортировка: редкость","Sort: name":"Сортировка: имя",
"Database: Select an Arcane Gem for more info":"База данных: выберите камень мага","Search Arcane Gems or skill text…":"Поиск по имени или тексту навыка…","← All Arcane Gems":"← Все камни мага","{a} of {b} Arcane Gems":"{a} из {b} камней мага",
"Skill by star":"Навык по звёздам","Base skill":"Базовый навык","NEW":"НОВОЕ","No change":"Без изменений","Exclusive Lv.4+":"Эксклюзив ур. 4+","Full skill text at 7★":"Полный текст навыка на 7★","Full skill text at 5★":"Полный текст навыка на 5★",
"Cooldown":"Перезарядка","{n} turns":"{n} хода","Effects":"Эффекты","Buff":"Бафф","Debuff":"Дебафф","Source: game files.":"Источник: файлы игры.","How Arcane Gems work":"Как работают камни мага","How to obtain":"Как получить",
"Star upgrade cost":"Стоимость повышения звезды","Copies of the same gem":"Копий того же камня","Disassembly":"Разбор","Primordial Shards":"Древние фрагменты","Shown drop rates":"Шансы выпадения","per draw":"за попытку",
"Unlocks after clearing Stage 12-10 on Hell difficulty. Each awakened hero can equip 1 Arcane Gem and uses its skill in battle.":"Открывается после прохождения этапа 12-10 на сложности «Ад». Каждый пробуждённый герой может носить 1 камень мага и использовать его навык в бою.",
"Stars are raised by consuming copies of the same gem (0★ to 5★).":"Звёзды повышаются за счёт копий того же камня (от 0★ до 5★).",
"If the hero's Exclusive is Lv.4 or higher, the equipped gem can go up to 2 extra stars (6★–7★). These extra stars are lost when the gem is removed.":"Если эксклюзив героя ур. 4 или выше, надетый камень можно поднять ещё на 2 звезды (6★–7★). Эти звёзды теряются при снятии камня.",
"A 5★ gem can be disassembled into Primordial Shards: Elite ×1, Epic ×2, Legend ×3.":"Камень 5★ можно разобрать на древние фрагменты: Элита ×1, Эпик ×2, Легенда ×3.",
"Removing or swapping a gem of Epic quality or higher costs Primordial Potions.":"Снятие или замена камня эпического качества и выше стоит древних зелий."};
const ru=()=>typeof LANG!=="undefined"&&LANG==="ru";
const t=(s,v)=>{let r=ru()&&RU[s]?RU[s]:s;if(v)for(const k in v)r=r.replace("{"+k+"}",v[k]);return r};
const L=o=>ru()&&o.ru?o.ru:o.en;
const nm=g=>ru()&&g.ru?g.ru:g.en;
const typ=g=>g.cd[0]>0?"Active":"Passive";
function rich(e,x){String(x).split(/(\[[^\[\]]{2,40}\]|\d+(?:\.\d+)?%?→\d+(?:\.\d+)?%?)/).forEach(s=>{if(/^\[.*\]$/.test(s))e.appendChild(el("span","pbk",s));else if(/→/.test(s)&&/^\d/.test(s))e.appendChild(el("b","gup",s));else e.appendChild(document.createTextNode(s))})}
const GIDX=["stone_3001.png", "stone_3002.png", "stone_3003.png", "stone_4001.png", "stone_4002.png", "stone_4003.png", "stone_4004.png", "stone_4005.png", "stone_4006.png", "stone_4007.png", "stone_5001.png", "stone_5002.png", "stone_5003.png", "stone_5004.png", "stone_5005.png", "stone_5006.png", "stone_5007.png", "stone_5008.png", "stone_5009.png", "stone_5010.png", "stone_5011.png", "stone_5012.png", "stone_5013.png", "stone_5014.png", "stone_5015.png", "stone_5016.png", "stone_5017.png", "stone_5018.png"];
function gimg(g){const w=el("div","pph gph "+g.q),i=el("div","pimg"),k=Math.max(0,GIDX.indexOf(g.img));i.style.backgroundImage="url(/img/gems.webp)";i.style.backgroundSize="800% 400%";i.style.backgroundPosition=((k%8)/7*100)+"% "+(Math.floor(k/8)/3*100)+"%";i.setAttribute("role","img");i.setAttribute("aria-label",g.en);w.appendChild(i);return w}

/* ---- markup ---- */
const gl=el("div");gl.id="gems";gl.hidden=true;
gl.innerHTML='<img class="logo" src="/img/logo.png" alt="Infinite Magicraid"><p class="psub"></p><div class="bar pbar"><input id="gq" type="search"><select id="grar"></select><select id="gtyp"></select><select id="geff"></select><select id="gsort"></select></div><div class="count" id="gcount"></div><div class="grid pgrid" id="ggrid"></div><div class="sec ginfo" id="ginfo"></div>';
const gd=el("div");gd.id="gdetail";gd.hidden=true;
const anchor=document.getElementById("pdetail")||document.getElementById("detail");anchor.after(gl);gl.after(gd);
if(window.IM_TABS)window.IM_TABS(gl.querySelector(".logo"),"g");
const EFF=[...new Set(G.flatMap(g=>(g.full.en.match(/\[[^\]]{2,30}\]/g)||[]).map(x=>x.slice(1,-1))))].sort();
function fillSel(id,opts){const s=$(id),v=s.value;s.replaceChildren();opts.forEach(([val,lab])=>{const o=el("option",null,lab);o.value=val;s.appendChild(o)});s.value=v||""}
function statics(){gl.querySelector(".psub").textContent=t("Database: Select an Arcane Gem for more info");$("gq").placeholder=t("Search Arcane Gems or skill text…");
fillSel("grar",[["",t("All rarities")],["Legend",t("Legend")],["Epic",t("Epic")],["Elite",t("Elite")]]);
fillSel("gtyp",[["",t("All types")],["Active",t("Active")],["Passive",t("Passive")]]);
fillSel("geff",[["",t("All effects")],...EFF.map(e=>[e,e])]);
{const s=$("gsort"),v=s.value||"rarity";fillSel("gsort",[["rarity",t("Sort: rarity")],["name",t("Sort: name")]]);s.value=v}
info()}
function info(){const s=$("ginfo");s.replaceChildren();s.appendChild(el("h3",null,t("How Arcane Gems work")));const ul=el("ul","pobl");
["Unlocks after clearing Stage 12-10 on Hell difficulty. Each awakened hero can equip 1 Arcane Gem and uses its skill in battle.","Stars are raised by consuming copies of the same gem (0★ to 5★).","If the hero's Exclusive is Lv.4 or higher, the equipped gem can go up to 2 extra stars (6★–7★). These extra stars are lost when the gem is removed.","A 5★ gem can be disassembled into Primordial Shards: Elite ×1, Epic ×2, Legend ×3.","Removing or swapping a gem of Epic quality or higher costs Primordial Potions."].forEach(x=>ul.appendChild(el("li",null,t(x))));s.appendChild(ul);
const h=el("h3",null,t("Star upgrade cost"));h.style.marginTop="14px";s.appendChild(h);
const tb=el("table","ptbl");const hr=el("tr");hr.appendChild(el("th",null,"★"));hr.appendChild(el("th",null,t("Copies of the same gem")));tb.appendChild(hr);GD.starCost.forEach((c,i)=>{const tr=el("tr");tr.appendChild(el("td",null,i+"★ → "+(i+1)+"★"));tr.appendChild(el("td",null,"×"+c));tb.appendChild(tr)});s.appendChild(tb);
const h2=el("h3",null,t("How to obtain"));h2.style.marginTop="14px";s.appendChild(h2);
const t2=el("table","ptbl");const r2=el("tr");["",t("Elite"),t("Epic"),t("Legend")].forEach(x=>r2.appendChild(el("th",null,x)));t2.appendChild(r2);
GD.pools.forEach(p=>{const tr=el("tr");const td=el("td");td.appendChild(el("b",null,L(p)));td.appendChild(el("div","kn",(ru()?p.cost_ru:p.cost_en)+" "+t("per draw")));tr.appendChild(td);p.rates.forEach(r=>tr.appendChild(el("td",null,r?r+"%":"—")));t2.appendChild(tr)});s.appendChild(t2);
s.appendChild(el("div","kn",t("Shown drop rates")+" · "+t("Source: game files.")))}

/* ---- list ---- */
function grender(){const q=$("gq").value.trim().toLowerCase(),r=$("grar").value,ty=$("gtyp").value,ef=$("geff").value,s=$("gsort").value;
let A=G.filter(g=>(!q||[g.en,g.ru,g.full.en,g.full.ru].join(" ").toLowerCase().includes(q))&&(!r||g.q===r)&&(!ty||typ(g)===ty)&&(!ef||g.full.en.includes("["+ef+"]")));
A.sort((a,b)=>s==="name"?nm(a).localeCompare(nm(b)):RK[a.q]-RK[b.q]||a.id-b.id);
window.GNL=A.map(x=>x.id);$("gcount").textContent=t("{a} of {b} Arcane Gems",{a:A.length,b:G.length});
const gr=$("ggrid");gr.replaceChildren();A.forEach(g=>{const c=el("a","pc");c.href=PATH("gem-"+g.id);c.appendChild(gimg(g));const i=el("div","pinfo");i.appendChild(el("div","pn",nm(g)));
const rr=el("div","prr "+g.q,t(g.q));rr.appendChild(el("span","gty"," · "+t(typ(g))+(g.cd[0]?" ("+g.cd[0]+")":"")));i.appendChild(rr);
const eff=[...new Set((g.base5.en.match(/\[[^\]]{2,30}\]/g)||[]))];if(eff.length){const ob=el("div","pob");eff.slice(0,3).forEach(x=>ob.appendChild(el("span",null,x.slice(1,-1))));i.appendChild(ob)}
c.appendChild(i);const go=()=>NAV("gem-"+g.id);c.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();go()};gr.appendChild(c)})}

/* ---- detail ---- */
let CURG=null;
function gshow(id){const g=G.find(x=>x.id===id);if(!g)return false;CURG=id;gd.replaceChildren();
const b=el("button","back",t("← All Arcane Gems"));b.onclick=()=>NAV("gems");{const GL=window.GNL&&window.GNL.includes(id)?window.GNL:G.slice().sort((a,c)=>RK[a.q]-RK[c.q]||a.id-c.id).map(x=>x.id);gd.appendChild(NAVBAR(b,GL,id,k=>NAV("gem-"+k),k=>nm(G.find(x=>x.id===k)),k=>"gem-"+k))}
const h=el("div","pdhead gdhead "+g.q);h.appendChild(gimg(g));
const tt=el("div");tt.appendChild(el("h1","pdh",nm(g)));const dm=el("div","pdm");dm.appendChild(el("b",g.q,t(g.q)));
dm.appendChild(document.createTextNode(" · "+t(typ(g))+(g.cd[0]?" · "+t("Cooldown")+": "+t("{n} turns",{n:g.cd[0]+(g.cd[7]!==g.cd[0]?"→"+g.cd[7]:"")}):"")));tt.appendChild(dm);h.appendChild(tt);gd.appendChild(h);
{const s=el("div","sec");s.appendChild(el("h3",null,t("Skill by star")));const sm=(ru()&&g.sum.ru)||g.sum.en;
sm.forEach((x,i)=>{const r=el("div","pks");const bd=el("div","psb"+(i===0?" s0":"")+(i>5?" gx":""));bd.appendChild(el("b",null,String(i)));bd.appendChild(el("span",null,"★"));r.appendChild(bd);const bb=el("div","pksb");
if(i===6)bb.appendChild(el("div","gxt",t("Exclusive Lv.4+")));
if(i===0){bb.appendChild(el("div","pkst",t("Base skill")));const d=el("div","pksd");rich(d,x);bb.appendChild(d)}
else{const ul=el("ul","psl");x.forEach(it=>{const nw=it[0]==="+";const li=el("li",nw?"nw":"up");if(nw)li.appendChild(el("span","ptag",t("NEW")));rich(li,it.slice(1));ul.appendChild(li)});bb.appendChild(ul)}
r.appendChild(bb);s.appendChild(r)});
[["Full skill text at 5★",g.base5],["Full skill text at 7★",g.full]].forEach(([lab,o])=>{const det=el("details","pfull");det.appendChild(el("summary",null,t(lab)));const ft=el("div","pksd");ft.style.whiteSpace="pre-line";rich(ft,L(o));det.appendChild(ft);s.appendChild(det)});
s.appendChild(el("div","kn",t("Source: game files.")));gd.appendChild(s)}
if(g.kw.length){const s=el("div","sec");s.appendChild(el("h3",null,t("Effects")));const ul=el("ul","pobl gkw");
g.kw.forEach(k=>{const v=ru()&&k.ru[0]?k.ru:k.en;const li=el("li");li.appendChild(el("span","pbk"+(k.d?" gdb":""),"["+v[0]+"]"));if(v[1])li.appendChild(document.createTextNode(" — "+v[1]));ul.appendChild(li)});s.appendChild(ul);gd.appendChild(s)}
return true}

/* ---- routing ---- */
function hideGems(){gl.hidden=true;gd.hidden=true}
window.GEMR=function(hs){
 if(hs==="gems"||/^gem-\d+$/.test(hs)){
  ["list","detail","pets","pdetail"].forEach(i=>{const e=document.getElementById(i);if(e)e.hidden=true});if(typeof pbgList==="function")pbgList();
  if(hs==="gems"){gd.hidden=true;gl.hidden=false;grender()}
  else{if(!gshow(+hs.slice(4))){gd.hidden=true;gl.hidden=false;grender()}else{gl.hidden=true;gd.hidden=false}}
  window.scrollTo(0,0);return true}
 hideGems();return false};
if(typeof render==="function"){const _r=render;render=function(){_r.apply(this,arguments);statics();if(!gl.hidden)grender();if(!gd.hidden&&CURG)gshow(CURG)}}
["gq","grar","gtyp","geff","gsort"].forEach(i=>$(i).addEventListener("input",grender));
statics();
{window.GEMR(ROUTEKEY())}
})();
