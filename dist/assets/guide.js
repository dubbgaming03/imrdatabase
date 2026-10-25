/* Game Overview tab — beginner-friendly explainer. Same view pattern as gems.js / pets.js. */
(function(){
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const go=(k)=>e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();NAV(k)};
const lnk=(txt,k)=>{const a=el("a","ovl",txt);a.href=PATH(k);a.onclick=go(k);return a};

/* rich text: **bold**, [[Label|routekey]] internal links */
function rt(e,s){String(s).split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/).forEach(p=>{
 if(/^\*\*.*\*\*$/.test(p))e.appendChild(el("b",null,p.slice(2,-2)));
 else if(/^\[\[.*\]\]$/.test(p)){const [l,k]=p.slice(2,-2).split("|");e.appendChild(lnk(l,k))}
 else if(p)e.appendChild(document.createTextNode(p))});return e}
const P=(s,c)=>rt(el("p",c||"ovp"),s);
function UL(items,cls){const u=el(cls==="ol"?"ol":"ul","ovul");items.forEach(i=>u.appendChild(rt(el("li"),i)));return u}
function sec(id,title,kids){const s=el("section","sec ovsec");s.id=id;s.appendChild(el("h2","ovh",title));kids.forEach(k=>s.appendChild(k));return s}
function sub(t){return el("h3","ovh3",t)}
function tbl(head,rows){const t=el("table","ptbl ovtbl"),th=el("tr");head.forEach(h=>th.appendChild(el("th",null,h)));t.appendChild(th);
 rows.forEach(r=>{const tr=el("tr");r.forEach((c,i)=>{const td=el(i?"td":"th");if(i)td.dataset.l=head[i];rt(td,c);tr.appendChild(td)});t.appendChild(tr)});
 const w=el("div","ovtw");w.appendChild(t);return w}
function cards(list){const g=el("div","ovcards");list.forEach(([h,b,tone])=>{const c=el("div","ovcard"+(tone?" "+tone:""));c.appendChild(el("b","ovct",h));c.appendChild(rt(el("p"),b));g.appendChild(c)});return g}
function callout(s,tone){return rt(el("div","ovcall"+(tone?" "+tone:"")),s)}

/* ---- view ---- */
const ov=el("div");ov.id="overview";ov.hidden=true;
ov.innerHTML='<img class="logo" src="/img/logo.png" alt="Infinite Magicraid"><h1 class="sr">Infinite Magicraid Game Overview</h1><p class="psub">Game Overview: start here if you are new</p>';
$("list").before(ov);
IM_TABS(ov.querySelector(".logo"),"o");

const body=el("div","ovbody");ov.appendChild(body);

/* jump links */
{const n=el("nav","ovjump");[["what","What is IMR?"],["rarity","LTEs vs Legendaries"],["priority","Prioritization"],["resources","Resource management"]].forEach(([id,l])=>{const a=el("a",null,l);a.href="#"+id;a.onclick=e=>{e.preventDefault();const t=$(id);if(t)window.scrollTo({top:t.getBoundingClientRect().top+scrollY-12,behavior:"smooth"})};n.appendChild(a)});body.appendChild(n)}

/* 1. What is the game */
body.appendChild(sec("what","What is Infinite Magicraid?",[
 P("Infinite Magicraid (IMR) is a **turn-based tactical RPG** with idle elements. You collect heroes, build teams of five around their skills, and fight through PvE content, PvP arenas and guild wars. It is a **gacha** game: most heroes come from summons (Wishes), so luck plays a part in what you own."),
 P("More than anything, IMR is a **resource management** game. Resources are limited, and the game constantly tempts you to spend them on things that feel good now but don't move your account forward. Players who plan and spend efficiently pull ahead, and **free-to-play is viable** with the right mindset and realistic expectations."),
 cards([
  ["PvE","Campaign, Tower of Mark, Faction Abyss, Guild Boss, Seven Sages of Liuli, Purgatory of Seven Sins, Endless Cloister and more."],
  ["PvP","Classic and Advanced Arena, Fair Arena, Championship, Supreme Sand Table and Trio Match."],
  ["Guild / GvG","Guild Boss, Demon Conquest, Broken Lands, Wuthering Coast, Guild Arena and War of Thrones."],
  ["Team building","Heroes are built around **damage tags** (Burn, Poison, Bleed, Internal Injury, HP Burning, Direct DMG, Resonance, Loong’s Wrath…). Teams that share a tag boost each other. See [[Damage Tags|heroes]] on the Heroes tab."]
 ]),
 P("Platforms: App Store, Google Play, APK and PC (Windows).","ovsmall")
]));

/* 2. LTE vs Legendary */
body.appendChild(sec("rarity","LTEs vs Legendaries",[
 P("Heroes come in several rarities: **Epic**, **Legendary**, **LTE** (Limited Time Event) and **Mythic**. The two that matter most for planning are Legendaries and LTEs."),
 tbl(["","Legendary","LTE"],[
  ["Power","Strong; the newest ones shape the meta","The strongest heroes in the game"],
  ["Release","Miracle Wish banner","Miracle Wish banner"],
  ["After release","Joins the Normal Wish pool after 2 weeks and returns on banners","Limited. Returns on the “Hero Rate +” banner after about a year"],
  ["Raising Exclusives","Hero copies, or **Legendary Dragon Eyes** for top-tier heroes","Hero copies **only**"]
 ]),
 callout("**Rule of thumb:** one LTE is worth about **10 Legendaries**."),
 sub("Exclusives (E levels)"),
 P("Each extra copy of a hero raises its Exclusive level. **E3 (4 copies)** is the big power spike and the goal for any hero you plan to use seriously. A hero at E3 is considered “fully activated”."),
 sub("When LTEs come out"),
 P("A new LTE arrives about every two months, in seasonal slots:"),
 cards([["Feb","Lunar New Year"],["Apr","Spring"],["Jun","Summer"],["Aug","Anniversary"],["Oct","Halloween"],["Dec","Christmas"]].map(([a,b])=>[a,b,"mini"])),
 callout("**LTE rules (Bougatsa’s Wisdom):** use Diamonds to buy Miracle Runes. Only spend Miracles to take a **new** LTE to E3. It is OK to skip an LTE you can’t E3.","gold")
]));

/* 3. Prioritization */
body.appendChild(sec("priority","Prioritization",[
 P("The most common mistake is spreading resources across many heroes. Pick a direction and finish it."),
 sub("Long-term goals, in order"),
 UL(["**E3 new LTEs**","**E3 older LTEs**","**E3 new Legendaries**","**E3 older Legendaries**"],"ol"),
 sub("Short-term gains (feel good, small impact)"),
 UL(["Awakening heroes to A5 or levelling to 150","Enhancing equipment","Raising older, off-meta Legendaries"]),
 callout("**Do not sacrifice long-term goals for short-term gains.**","red"),
 sub("Rules of thumb"),
 UL([
  "**Upgrade one hero at a time.** A finished DPS beats five half-built heroes.",
  "**Awakening (A1–A5, Lv110–150):** do your main damage dealers first.",
  "**Breakthrough (BT1–BT8, Lv155–190):** LTEs and top-tier Legendaries first.",
  "**Legendary Dragon Eyes** are extremely rare. Only use them on new, meta Legendaries rated **A tier or higher** in the [[tier list|heroes]].",
  "Spirit Beasts and Arcane Gems are power layers on top of your heroes; build heroes first. See [[Spirit Beasts|pets]] and [[Arcane Gems|gems]]."
 ])
]));

/* 4. Resource management */
body.appendChild(sec("resources","Resource management",[
 P("Almost everything comes back to a few currencies. Know what each one is for before you spend it."),
 tbl(["Resource","What it's for","Advice"],[
  ["Miracle Runes","Summoning new LTEs and new Legendaries","Save them. E3 on a new LTE costs about **1,800** (450 per copy). **Never gamble Miracles.**"],
  ["Diamonds","The main premium currency","Convert to Miracle Runes in the **Resource Store** (always 150 Diamonds each). Avoid spending on stamina refreshes."],
  ["Excellent / Supreme Runes","Normal summons and LTE reruns","Save for reruns of LTEs you already own or want to finish."],
  ["Dragon Eyes","Raising Legendary Exclusives without copies","10 Epic Dragon Eyes = 1 Legendary Dragon Eye. Only on A-tier+ meta Legendaries."],
  ["Rainbow Diamonds","Rainbow Diamond Store","Can buy select older LTEs (e.g. Lydia, Heng’e 3, Murong Jing, Erato)."]
 ]),
 sub("Saving beats pulling"),
 P("Players who summon every time they get a few Miracles rarely finish a hero. Players who save until they can guarantee an E3 on a targeted LTE progress much faster. The F2P loop is **Save → Wait → Summon** during strong events (such as 2× Legendary or Gift of Heaven)."),
 sub("Daily habits that add up"),
 UL([
  "**Guild Boss** is one of the biggest Diamond sources. Clearing two lower levels at 100% can beat 50% on a higher one.",
  "Push the **Campaign** with one team through Hell 12-10, then focus **Tower of Mark** (Lv30 on all towers).",
  "**Dragon Cliff** is poor value; save campaign stamina.",
  "During mini-events, don’t buy packs or spend Diamonds on stamina **until day 4**.",
  "The Currency Store sometimes offers a Miracle Rune for 100 Diamonds. Grab it, but don’t plan around it."
 ]),
 sub("Spending, if you choose to"),
 P("The best value for every spender is the same base: **Monthly Card**, **Battle Pass**, **Championship Pass** and Epic Eye packs. Beyond that, put money toward **LTE copies to reach E3** before anything else."),
 callout("**Bougatsa’s Wisdom:** never count on luck. Use resources only when ready. Upgrade one hero at a time. Ask questions if unsure.","gold")
]));

{const f=el("p","hnote ovsrc");f.textContent="Based on Dubb’s guides and community resources. Game details change with updates; ask in the official Discord if something looks out of date.";body.appendChild(f)}

/* ---- routing ---- */
const OTHER=["list","detail","home","pets","pdetail","gems","gdetail"];
window.OVR=function(hs){
 if(hs==="overview"){OTHER.forEach(i=>{const e=$(i);if(e)e.hidden=true});ov.hidden=false;if(typeof pbgList==="function")pbgList();window.scrollTo(0,0);return true}
 ov.hidden=true;return false};
{const hs=ROUTEKEY();if(hs==="overview")window.OVR(hs)}
})();
