/* Spirit Beasts section + shared tab row — plugs into the main hero database page. */
(function(){
const D=window.PETS,P=D.pets,RK={Legend:0,Epic:1,Elite:2};
const RU={"Legend":"Легенда","Epic":"Эпик","Elite":"Элита","All rarities":"Все редкости","All sources":"Все источники","All effects":"Все эффекты","Sort: rarity":"Сортировка: редкость","Sort: name":"Сортировка: имя","Home":"Главная","Heroes":"Герои","Spirit Beasts":"Звери-духи","Arcane Gems":"Камни мага","Database: Select a Spirit Beast for more info":"База данных: выберите зверя-духа","Search Spirit Beasts or skill text…":"Поиск по имени или тексту навыка…","Spirit Beast Cultivation":"Воспитание зверя-духа","Purgatory of Seven Sins":"Чистилище семи грехов","Random Spirit Beast Shard":"Случайный осколок зверя-духа","Hire Store":"Найм","← All Spirit Beasts":"← Все звери-духи","{a} of {b} Spirit Beasts":"{a} из {b} зверей-духов","Source: game files.":"Источник: файлы игры.","Skill by star":"Навык по звёздам","Base skill":"Базовый навык","NEW":"НОВОЕ","Full skill text at 5★":"Полный текст навыка на 5★","How to obtain":"Как получить","Soul item":"Предмет души"};
const ru=()=>typeof LANG!=="undefined"&&LANG==="ru";
const t=(s,v)=>{let r=ru()&&RU[s]?RU[s]:s;if(v)for(const k in v)r=r.replace("{"+k+"}",v[k]);return r};
const nm=p=>ru()&&p.ru&&p.ru!==p.en?p.ru:p.en;
const sk=(p,i)=>{const s=p.skills[i];return ru()&&s.ru?s.ru:s.en};
const OBN={sbstore:"Spirit Beast Store",guild:"Guild Store",elemental:"Elemental Market",homestead:"Homestead Market",heroq:"Hero Quests",cult:"Spirit Beast Cultivation",rainbow:"Rainbow Diamond Store",mirage:"Purgatory of Seven Sins",random:"Random Spirit Beast Shard",monthly:"Monthly Card",cultp:"Spirit Beast Cultivation (paid track)",border:"Battle Order",group:"Group Benefit",acp:"Advanced Combat Pass",huge:"Huge Discount"};
const OBP=new Set(["cultp","monthly","border","group","acp","huge"]);
const OBD={sbstore:"10 Souls for 4,800 Spirit Beast Coins. Limit 1; store refreshes every 30 days.",
 guild:"Selection chest: 10 Souls for 20,000 Guild Coins. Limit 1; store refreshes every 30 days.",
 elemental:"Selection chest: 10 Souls. Limit 1; store refreshes every 30 days.",
 homestead:"Selection chest: 10 Souls for 100,000 Homestead Coins. Limit 1; store refreshes every 30 days.",
 rainbow:"50 Souls for 20,000 Rainbow Diamonds. Limit 1.",
 border:"Level 50 paid track: selection chest of 10 Souls.",
 group:"Selection chest of 5 Souls at 200 progress (plus Random Spirit Beast Shards at 40 and 80 progress).",
 acp:"Selection chest of 10 Souls each season.",
 huge:"Ultimate Pack: selection chest of 50 Souls.",cultp:"Souls purchased in 10-Soul increments during the event."};
const idx=p=>(parseInt((/(\d+)/.exec(p.img)||[0,1])[1],10)||1)-1;

/* ---- shared tab row ---- */
const TABS=[];
window.IM_TABS=function(logo,cur){if(!logo)return;const d=el("div","ptabs");
 [["home","Home","home"],["h","Heroes","heroes"],["p","Spirit Beasts","pets"],["g","Arcane Gems","gems"]].forEach(([k,lab,h])=>{const b=el("a",k===cur?"on":"",lab);b.href=PATH(h);b.dataset.l=lab;b.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();NAV(h)};d.appendChild(b)});
 {const b=el("a","",t("Bracket Challenge"));b.href="/bracket/";b.dataset.l="Bracket Challenge";d.appendChild(b)}
 let sb=logo.nextElementSibling;while(sb&&sb.tagName==="H1")sb=sb.nextElementSibling;(sb&&sb.matches(".sub,.psub")?sb:logo).after(d);TABS.push(d)};
function tabsRu(){TABS.forEach(d=>d.querySelectorAll("button").forEach(b=>b.textContent=t(b.dataset.l)))}

function rich(e,x){String(x).split(/(\[[^\[\]]{2,40}\])/).forEach(s=>{if(/^\[.*\]$/.test(s))e.appendChild(el("span","pbk",s));else e.appendChild(document.createTextNode(s))})}
function pimg(p){const w=el("div","pph "+p.q),i=el("div","pimg"),k=idx(p);i.style.backgroundImage="url(/img/pets-p.webp)";i.style.backgroundSize="600% 400%";i.style.backgroundPosition=((k%6)/5*100)+"% "+(Math.floor(k/6)/3*100)+"%";i.setAttribute("role","img");i.setAttribute("aria-label",p.en);w.appendChild(i);return w}

/* ---- markup ---- */
const pl=el("div");pl.id="pets";pl.hidden=true;
pl.innerHTML='<img class="logo" src="/img/logo.png" alt="Infinite Magicraid"><p class="psub"></p><div class="bar pbar"><input id="pq" type="search"><select id="prar"></select><select id="pobt"></select><select id="peff"></select><select id="psort"></select></div><div class="count" id="pcount"></div><div class="grid pgrid" id="pgrid"></div>';
const pd=el("div");pd.id="pdetail";pd.hidden=true;
const detail=document.getElementById("detail");detail.after(pl);pl.after(pd);
IM_TABS(document.querySelector("#list .logo"),"h");
IM_TABS(pl.querySelector(".logo"),"p");
const EFF=[...new Set(P.flatMap(p=>p.skills.flatMap(s=>(s.en.match(/\[[^\]]{2,30}\]/g)||[]).map(x=>x.slice(1,-1)))))].sort();
function fillSel(id,opts){const s=$(id),v=s.value;s.replaceChildren();opts.forEach(([val,lab])=>{const o=el("option",null,lab);o.value=val;s.appendChild(o)});s.value=v||""}
function statics(){pl.querySelector(".psub").textContent=t("Database: Select a Spirit Beast for more info");$("pq").placeholder=t("Search Spirit Beasts or skill text…");
 fillSel("prar",[["",t("All rarities")],["Legend",t("Legend")],["Epic",t("Epic")],["Elite",t("Elite")]]);
 fillSel("pobt",[["",t("All sources")],...Object.keys(OBN).map(k=>[k,t(OBN[k])])]);
 fillSel("peff",[["",t("All effects")],...EFF.map(e=>[e,e])]);
 {const s=$("psort"),v=s.value||"rarity";fillSel("psort",[["rarity",t("Sort: rarity")],["name",t("Sort: name")]]);s.value=v}
 tabsRu()}

/* ---- list ---- */
function prender(){const q=$("pq").value.trim().toLowerCase(),r=$("prar").value,o=$("pobt").value,ef=$("peff").value,s=$("psort").value;
 let A=P.filter(p=>(!q||[p.en,p.ru,...p.skills.map(x=>x.en),...p.skills.map(x=>x.ru||"")].join(" ").toLowerCase().includes(q))&&(!r||p.q===r)&&(!o||p.obtain.some(x=>x.k===o))&&(!ef||p.skills.some(x=>x.en.includes("["+ef+"]"))));
 A.sort((a,b)=>s==="name"?nm(a).localeCompare(nm(b)):RK[a.q]-RK[b.q]||nm(a).localeCompare(nm(b)));
 window.PNL=A.map(x=>x.id);$("pcount").textContent=t("{a} of {b} Spirit Beasts",{a:A.length,b:P.length});
 const g=$("pgrid");g.replaceChildren();A.forEach(p=>{const c=el("a","pc");c.href=PATH("pet-"+p.id);c.appendChild(pimg(p));const i=el("div","pinfo");i.appendChild(el("div","pn",nm(p)));i.appendChild(el("div","prr "+p.q,t(p.q)));
  const eff=[...new Set((p.skills[5].en.match(/\[[^\]]{2,30}\]/g)||[]))];if(eff.length){const ob=el("div","pob");eff.slice(0,3).forEach(x=>ob.appendChild(el("span",null,x.slice(1,-1))));i.appendChild(ob)}
  c.appendChild(i);const go=()=>NAV("pet-"+p.id);c.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();go()};g.appendChild(c)})}


/* ---- recommended equipment ---- */
const PEQ={"n":22,"it":{"12501501":["Attack Sorcery Orb",1,15,"Increases ATK by 8,600."],"12501502":["Crit Rate Sorcery Orb",1,16,"Increases Crit Rate by 30%."],"12501503":["Shield Sorcery Orb",1,17,"Increases Shield Effect by 30%."],"12501504":["Direct DMG Sorcery Orb",1,18,"Increases Direct DMG by 30%."],"12502501":["Attack Hallow Crystal",2,19,"After the Spirit Beast casts a skill, increases ATK by 21% + 9,000 for the allied hero with the highest ATK for 1 turn."],"12502503":["Debuff Hallow Crystal",2,21,"After the Spirit Beast deals DMG, reduces the target's Effect RES by 30% for 1 turn."],"12502505":["Speed Hallow Crystal",2,20,"Before the Spirit Beast cleanses debuffs from allies, increases all allies' SPD by 12% for 1 turn. Before the Spirit Beast cleanses buffs from enemies, reduces all enemies' (excluding Boss) SPD by 8% for 1 turn."],"12503501":["Icefield Ghost Divinity Stone",3,0,"Increases the Spirit Beast's Direct DMG dealt by 15%. The target with [Preying Wolves] inflicted by Icefield Ghost has a 100% fixed chance (not affected by Effect Hit or Effect RES) to fail to receive buffs from heroes next 3 times."],"12503503":["Control Divinity Stone",3,11,"Increases the Spirit Beast's Effect Hit by 15%. After the ally Spirit Beast inflicts Control effects on an enemy, when heroes inflict Control effects on the same enemy next time, there is a 100% fixed chance to extend the target's duration of up to 3 layers of debuffs by 1 turn, making the target lose HP by 15% of their Max HP, caps at 300% of the Spirit Beast's ATK."],"12503502":["Briar Phantom Divinity Stone",3,10,"Increases the Spirit Beast's Shield Effect by 15%. When Briar Phantom's [Briar Shield] is granted/broken or its duration ends, restores the hero's HP by 220% of Briar Phantom's ATK immediately (not affected by Healing Effect or Healed Effect)."],"12503504":["Damage Divinity Stone",3,12,"When the Spirit Beast deals DMG to a hero from the enemy side, the higher the target's current HP percentage, the higher the DMG, up to 30% can be increased."],"12503505":["Goshawk Divinity Stone",3,13,"Increases the Spirit Beast's Crit DMG by 15%. Before the Shadow Goshawk casts skills for the first time at the beginning of each wave, after an allied hero takes Control effects each time, Shadow Goshawk gains 10% Energy. Each time the Shadow Goshawk absorbs buffs or debuffs, for every 1 layer absorbed, grants its DMG dealt next time extra 6% Crit DMG, up to 30%."],"12503506":["Phoenix Divinity Stone",3,14,"Increases the Spirit Beast's Healing Effect by 15%. When an ally's [Phoenix Flame] triggers the enhancement effect or the Power of Phoenix, gains 10.5% Turn Meter. If an ally survives after the duration of Power of Phoenix ends, restores HP by 220% of the Spirit Beast's ATK."],"12503507":["Manta Ray Divinity Stone",3,1,"Increases the Spirit Beast's Effect Hit by 15%. When being equipped by Starry Manta Ray, 15% Energy will be granted under the following circumstances: 1. When an allied hero inflicts control effects: 2. When an allied hero inflicts Turn Meter Reduction effects: Each of the two circumstances can be triggered once at the beginning of each wave and the effects will be doubled when each circumstance is triggered for the first time. The triggerable attempts will be reset after Starry Manta Ray casts skills."],"12503508":["Specter Divinity Stone",3,2,"Increases the Spirit Beast's ATK by 15%. When Frost Specter is equipped with it, increases Frost Specter's Turn Meter by 70% after Frost Specter inflicts [Bite of Fox Fire] on enemies for the first time in each wave."],"12503509":["Unicorn Divinity Stone",3,3,"Increases the Spirit Beast's Healing Effect by 15%. When being equipped by Dreamy Unicorn and after granting [Neon Light] on an ally, it will cleanse 3 layer(s) of debuffs from the ally and reduce their delayed settlement of DMG taken by 60%."],"12503510":["Griffin Divinity Stone",3,4,"Increases the Spirit Beast's Crit DMG by 15%. When it's equipped by Divine Griffin: 1. Each time after casting a skill proactively or casting a skill to pursue and attack, gains [Spirit Beast's Breath]: Increases self Direct DMG dealt by 12%, up to 60% can be increased. 2. When an ally tries inflicting Control effects, increases Divine Griffin's Turn Meter by 8%. This effect can be triggered once in any turn, up to 4 time(s) before Divine Griffin casts skills next time."],"12503511":["Serpent Divinity Stone",3,5,"Increases the Spirit Beast's Crit Rate by 15%. When it's equipped by Feathered Serpent: 1. After casting skills each time, grants [Spirit Beast's Breath] (increases ATK by 30% and Crit DMG by 90%) to the ally with the highest initial Crit Rate for 2 turns. 2. When an ally pursues and attacks, increases Feathered Serpent's Turn Meter by 8%. This effect can be triggered once in any turn, up to 4 time(s) before Feathered Serpent casts skills proactively next time."],"12503512":["Bone Dragon Divinity Stone",3,6,"Increases the Spirit Beast's Attack by 15%. When it's equipped by Calamity Bone Dragon: 1. After casting skills each time, grants [Spirit Beast's Breath] (increases Basic Attack DMG by 6% and Skill DMG by 6%) to all allies, up to 10 layers. 2. When an ally steals attributes from enemies or obtains [SPD Up II], increases Calamity Bone Dragon's Turn Meter by 10%, this effect can be triggered once in any turn, and up to 4 times before Calamity Bone Dragon casts skills proactively next time."],"12503513":["Celestial Loong Divinity Stone",3,7,"Increases the Spirit Beast's ATK by 15% and Shield Effect by 15%. When it's equipped by Scarlet Celestial Loong: 1. At the beginning of each wave, there is a 100% chance to cast the active skill once."],"rhino":["Rhinoceros Divinity Stone",3,8,"Increases the Spirit Beast's ATK by 15% and Healing Effect by 15%. When equipped by Heavy-armored Rhinoceros: 1. When an enemy is inflicted with a control effect, increases their DMG taken by 10%, stackable up to 5 times."],"seahorse":["Seahorse Divinity Stone",3,9,"Increases the Spirit Beast's ATK by 15% and Skill DMG by 15%. When equipped by Phantom Seahorse: 1. When an enemy is inflicted with [HP Burning] or [Loong's Wrath], increases their Skill DMG taken by 5%, up to 10 stacks."]},"orb":{"atk":"12501501","crit":"12501502","shield":"12501503","dd":"12501504"},"cry":{"atk":"12502501","debuff":"12502503","spd":"12502505"},"div":{"12005001":"12503501","12005002":"12503503","12005003":"12503502","12005004":"12503504","12005005":"12503505","12005006":"12503506","12005007":"12503507","12005008":"12503508","12005009":"12503509","12005010":"12503510","12005011":"12503511","12005012":"12503512","12005013":"12503513","12005014":"rhino","12005015":"seahorse"},"cl":[12005011,12005013,12005014,12005015],"dm":[12005001,12005002,12005004,12005005,12005006,12005007,12005008,12005010,12005011,12005012,12005015,12004001,12004002,12004004,12004005,12003001,12003002]};
const RUQ={"Recommended Equipment":"Рекомендуемое снаряжение","Sorcery Orb":"Магическая сфера","Hallow Crystal":"Священный кристалл","Divinity Stone":"Божественный камень","Recommended":"Рекомендуется","Option":"Вариант","Unique":"Уникальный","Legend tier, max level effect shown.":"Легендарный уровень, показан эффект на макс. уровне.","Best stat for this Spirit Beast.":"Лучший стат для этого зверя-духа.","Works on every Spirit Beast.":"Подходит любому зверю-духу.","This Spirit Beast cleanses debuffs from allies.":"Этот зверь-дух снимает дебаффы с союзников.","This Spirit Beast deals damage.":"Этот зверь-дух наносит урон.","Effect not in the game files yet.":"Эффекта пока нет в файлах игры.","No unique Divinity Stone for this rarity.":"Для этой редкости нет уникального камня."};
Object.assign(RU,RUQ);
{const st=document.createElement("style");st.textContent=".eqr{display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--line)}.eqr:first-of-type{border-top:0;padding-top:0}.eqi{width:56px;height:56px;flex:none;border-radius:8px;background-repeat:no-repeat}.eqb{min-width:0;flex:1}.eqs{font-size:11px;color:var(--mute);text-transform:uppercase;letter-spacing:.05em}.eqn{font-weight:700;font-size:15px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.eqt{font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;border-radius:4px;padding:0 6px;color:#fff;background:#b45309}.eqt.o{background:transparent;color:var(--mute);border:1px solid var(--line)}.eqw{font-size:12.5px;color:var(--mute);margin-top:2px}.eqf{font-size:13px;line-height:1.45;margin-top:4px}";document.head.appendChild(st)}
function eqRow(key,slot,tag,why){const v=PEQ.it[key],r=el("div","eqr"),i=el("div","eqi");
 i.style.backgroundImage="url(/img/peq.webp)";i.style.backgroundSize=(PEQ.n*56)+"px 56px";i.style.backgroundPosition="-"+(v[2]*56)+"px 0";i.setAttribute("role","img");i.setAttribute("aria-label",v[0]);r.appendChild(i);
 const b=el("div","eqb");b.appendChild(el("div","eqs",t(slot)));const n=el("div","eqn");n.appendChild(el("span",null,v[0]));if(tag)n.appendChild(el("span","eqt"+(tag==="Option"?" o":""),t(tag)));b.appendChild(n);
 if(why)b.appendChild(el("div","eqw",t(why)));const f=el("div","eqf");rich(f,v[3]||t("Effect not in the game files yet."));b.appendChild(f);r.appendChild(b);return r}
function eqSec(p){const s=el("div","sec");s.appendChild(el("h3",null,t("Recommended Equipment")));
 const orb=p.id===12005010?"crit":p.id===12005008?"dd":p.id===12005003?"shield":"atk";
 s.appendChild(eqRow(PEQ.orb[orb],"Sorcery Orb","Recommended",orb==="atk"?null:"Best stat for this Spirit Beast."));
 const cl=PEQ.cl.includes(p.id),dm=PEQ.dm.includes(p.id);
 if(cl){s.appendChild(eqRow(PEQ.cry.spd,"Hallow Crystal","Recommended","This Spirit Beast cleanses debuffs from allies."));s.appendChild(eqRow(PEQ.cry.atk,"Hallow Crystal","Option","Works on every Spirit Beast."))}
 else s.appendChild(eqRow(PEQ.cry.atk,"Hallow Crystal","Recommended","Works on every Spirit Beast."));
 if(dm)s.appendChild(eqRow(PEQ.cry.debuff,"Hallow Crystal","Option","This Spirit Beast deals damage."));
 const dv=PEQ.div[String(p.id)];
 if(dv)s.appendChild(eqRow(dv,"Divinity Stone","Unique",null));
 else{const r=el("div","eqr"),b=el("div","eqb");b.appendChild(el("div","eqs",t("Divinity Stone")));b.appendChild(el("div","eqw",t("No unique Divinity Stone for this rarity.")));r.appendChild(b);s.appendChild(r)}
 s.appendChild(el("div","kn",t("Legend tier, max level effect shown.")));return s}
const PTAG={12005002:["Control"],12005004:["Poison"],12005006:["HP Burning"],12005007:["Control"],12005008:["Control"],12005010:["HP Deduction","Control"],12005011:["Pursue & Attack","Internal Injury"],12005012:["Burn","Attribute Steal"],12005013:["Attribute Steal","Direct DMG"],12005014:["Poison","Control"],12005015:["Loong's Wrath","Resonance"],12004001:["Poison"],12004002:["Bleed","Control"],12004004:["Burn"],12003001:["Burn"]};
const RUT={"Direct DMG":"Прямой урон","Control":"Контроль","Poison":"Яд","HP Burning":"Горение HP","HP Deduction":"Снижение HP","Pursue & Attack":"Преследование","Internal Injury":"Внутренняя травма","Burn":"Ожог","Attribute Steal":"Кража атрибутов","Loong's Wrath":"Гнев Луна","Resonance":"Резонанс","Bleed":"Кровотечение","Damage Tags":"Теги урона"};Object.assign(RU,RUT);
{const st=document.createElement("style");st.textContent=".pdt{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.pdt span{display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;padding:3px 10px 3px 6px;border-radius:999px;background:rgba(10,10,20,.55);border:1px solid rgba(255,255,255,.28);color:#fff}.pdt img{width:20px;height:20px;object-fit:contain}";document.head.appendChild(st)}
function ptags(p){const L=PTAG[p.id];if(!L)return null;const d=el("div","pdt");d.setAttribute("aria-label",t("Damage Tags"));L.forEach(x=>{const sp=el("span");const i=document.createElement("img");i.src="/img/dt-"+(x==="Direct DMG"?"direct-damage":x.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""))+".png";i.alt="";i.onerror=()=>i.remove();sp.appendChild(i);sp.appendChild(document.createTextNode(t(x)));d.appendChild(sp)});return d}
/* ---- detail ---- */
let CUR=null;
function pshow(id){const p=P.find(x=>x.id===id);if(!p)return false;CUR=id;pd.replaceChildren();
 const b=el("button","back",t("← All Spirit Beasts"));b.onclick=()=>NAV("pets");{const PL=window.PNL&&window.PNL.includes(id)?window.PNL:P.slice().sort((a,c)=>RK[a.q]-RK[c.q]||nm(a).localeCompare(nm(c))).map(x=>x.id);pd.appendChild(NAVBAR(b,PL,id,k=>NAV("pet-"+k),k=>nm(P.find(x=>x.id===k)),k=>"pet-"+k))}
 const h=el("div","pdhead");{const bn=el("div","pbnr"),bi=el("i"),k=idx(p);bi.style.backgroundImage="url(/img/pets-b.webp)";bi.style.backgroundSize="100% 2300%";bi.style.backgroundPosition="0 "+(k/22*100)+"%";bn.appendChild(bi);h.appendChild(bn)}
 h.appendChild(pimg(p));const tt=el("div");tt.appendChild(el("h1","pdh",nm(p)));const dm=el("div","pdm");dm.appendChild(el("b",p.q,t(p.q)));dm.appendChild(document.createTextNode(" · "+t("Soul item")+": "+(ru()&&p.soul_ru?p.soul_ru:p.soul_en)));tt.appendChild(dm);{const g=ptags(p);if(g)tt.appendChild(g)}h.appendChild(tt);pd.appendChild(h);
 {const s=el("div","sec");s.appendChild(el("h3",null,t("Skill by star")));const sm=(ru()&&p.sum.ru)||p.sum.en;
  sm.forEach((x,i)=>{const r=el("div","pks");const bd=el("div","psb"+(i===0?" s0":""));bd.appendChild(el("b",null,String(i)));bd.appendChild(el("span",null,"★"));r.appendChild(bd);const bb=el("div","pksb");
   if(i===0){bb.appendChild(el("div","pkst",t("Base skill")));const d=el("div","pksd");rich(d,x);bb.appendChild(d)}
   else{const ul=el("ul","psl");x.forEach(it=>{const nw=it[0]==="+";const li=el("li",nw?"nw":"up");if(nw)li.appendChild(el("span","ptag",t("NEW")));rich(li,nw||it[0]==="="?it.slice(1):it);ul.appendChild(li)});bb.appendChild(ul)}
   r.appendChild(bb);s.appendChild(r)});
  const det=el("details","pfull");det.appendChild(el("summary",null,t("Full skill text at 5★")));const ft=el("div","pksd");rich(ft,sk(p,5));det.appendChild(ft);s.appendChild(det);
  s.appendChild(el("div","kn",t("Source: game files.")));pd.appendChild(s)}
 pd.appendChild(eqSec(p));
 {const s=el("div","sec");s.appendChild(el("h3",null,t("How to obtain")));
  const OB=[...p.obtain].sort((a,b)=>Object.keys(OBN).indexOf(a.k)-Object.keys(OBN).indexOf(b.k));
  const grp=(lab,L)=>{if(!L.length)return;s.appendChild(el("div","pobg",lab));const u=el("ul","pobl");L.forEach(o=>u.appendChild(obLine(o)));s.appendChild(u)};
  grp("Free-to-play",OB.filter(o=>!OBP.has(o.k)));grp("Paid",OB.filter(o=>OBP.has(o.k)));
  function obLine(o){let line=t(OBN[o.k]);const R=ru();if(o.d||OBD[o.k])line+=" — "+(o.d||OBD[o.k]);
   if(o.k==="monthly")line+=R?" — каждые 7 дней получения наград: сундук выбора души зверя-духа (1 душа этого зверя на выбор).":" — every 7 days of claimed rewards: Soul of Spirit Beast Selection Chest (pick 1 Soul of this Spirit Beast).";if(o.k==="cult")line+=" — limited-time event. Free track: 10 Souls (random chance).";
   if(o.k==="mirage"){const ds=o.diffs,rng=ds.length>2&&ds[ds.length-1]-ds[0]===(ds.length-1)*(ds[1]-ds[0])?ds[0]+"–"+ds[ds.length-1]:ds.join(", ");line+=(R?" — награда за первое прохождение, сложность ":" — first-clear reward, Difficulty ")+rng+" ("+o.nums.join("–")+(R?" душ)":" Souls)")}
   if(o.k==="random")line+=(R?" — шанс выпадения души: ":" — Soul drop chance: ")+o.pct+"%";
   if(o.k==="hire")line+=R?" — можно нанять на время (не насовсем).":" — can be hired temporarily (not kept).";
   const li=el("li");li.appendChild(el("b",null,line.split(" — ")[0]));if(line.includes(" — "))li.appendChild(document.createTextNode(" — "+line.split(" — ").slice(1).join(" — ")));return li}
  pd.appendChild(s)}
 return true}

/* ---- routing ---- */
function hidePets(){pl.hidden=true;pd.hidden=true}
window.PETR=function(hs){
 if(hs==="pets"||/^pet-\d+$/.test(hs)){
  ["list","detail"].forEach(i=>{const e=document.getElementById(i);if(e)e.hidden=true});if(typeof pbgList==="function")pbgList();
  if(hs==="pets"){pd.hidden=true;pl.hidden=false;prender()}
  else{if(!pshow(+hs.slice(4))){pd.hidden=true;pl.hidden=false;prender()}else{pl.hidden=true;pd.hidden=false}}
  window.scrollTo(0,0);return true}
 hidePets();return false};
if(typeof render==="function"){const _r=render;render=function(){_r.apply(this,arguments);statics();if(!pl.hidden)prender();if(!pd.hidden&&CUR)pshow(CUR)}}
["pq","prar","pobt","peff","psort"].forEach(i=>$(i).addEventListener("input",prender));
statics();
{const hs=ROUTEKEY();if(hs==="pets"||/^pet-\d+$/.test(hs))window.PETR(hs)}
})();
