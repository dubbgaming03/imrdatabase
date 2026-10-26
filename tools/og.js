// Social preview images (Open Graph, 1200x630) for hero pages.
// Called from build.js with the already-loaded site page. Images are cached in og-cache/
// and only re-rendered when a hero's card data (or this template) changes.
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const TPL_VER="1";
const RCOL={Mythic:"#fb923c",Legendary:"#facc15",Epic:"#c4b5fd",LTE:"#a78bfa"};
const TCOL={SS:"#f43f5e",S:"#f97316",A:"#facc15",B:"#4ade80",C:"#38bdf8",D:"#a78bfa",F:"#9ca3af"};
const DCOL={"Burn":"#f97316","HP Burning":"#ef4444","Bleed":"#be123c","Poison":"#16a34a","Internal Injury":"#9333ea","Direct DMG":"#3b82f6","HP Deduction":"#ec4899","Resonance":"#14b8a6","Loong’s Wrath":"#d9a93a","Control":"#6366f1","Attribute Steal":"#06b6d4","Pursue & Attack":"#f59e0b"};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function card(h,base){
 const bg=h.fbg?`linear-gradient(90deg,rgba(12,10,24,.25) 0%,rgba(12,10,24,.82) 42%,rgba(12,10,24,.94) 100%),url(${h.fbg})`:"linear-gradient(135deg,#2a2148,#0f0c1d)";
 const chips=(h.dt||[]).slice(0,5).map(t=>`<span class="chip" style="--c:${DCOL[t]||"#8b7fd6"}">${esc(t)}</span>`).join("");
 const meta=[h.cls,h.mark].filter(Boolean).map(esc).join(" · ");
 const nameSize=h.n.length>14?68:h.n.length>10?80:96;
 return `<!doctype html><html><head><meta charset="utf-8"><base href="${base}"><style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Inter,"DejaVu Sans",sans-serif;color:#fff;background:#0f0c1d}
.wrap{position:relative;width:1200px;height:630px;background:${bg};background-size:cover;background-position:center}
.por{position:absolute;left:30px;bottom:0;width:500px;height:625px;display:flex;align-items:flex-end;justify-content:center}
.por img{width:500px;height:625px;object-fit:cover;object-position:top;${h.cut?"filter:drop-shadow(0 0 30px rgba(0,0,0,.6))":"border-radius:22px 22px 0 0;box-shadow:0 0 40px rgba(0,0,0,.6)"}}
.info{position:absolute;left:560px;right:56px;top:70px;bottom:56px;display:flex;flex-direction:column}
.name{font-size:${nameSize}px;font-weight:800;line-height:1.02;letter-spacing:-.01em;text-shadow:0 3px 14px rgba(0,0,0,.7)}
.row{display:flex;align-items:center;gap:16px;margin-top:22px;flex-wrap:wrap}
.rar{font-size:34px;font-weight:800;color:${RCOL[h.r]||"#e5e7eb"}}
.tier{font-size:30px;font-weight:800;padding:4px 18px;border-radius:12px;background:${TCOL[h.t]||"#6b7280"};color:#111}
.tier small{font-size:20px;font-weight:700;opacity:.75;margin-right:6px}
.fac{display:flex;align-items:center;gap:12px;font-size:30px;font-weight:600;margin-top:20px;color:#f1eefc}
.fac img{height:46px}
.meta{font-size:26px;color:#cfc8ee;margin-top:10px;font-weight:500}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.chip{font-size:22px;font-weight:700;padding:7px 16px;border-radius:999px;background:color-mix(in srgb,var(--c) 30%,rgba(0,0,0,.45));border:2px solid var(--c)}
.foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between}
.foot img{height:62px}
.url{font-size:24px;font-weight:700;color:#e9c765;letter-spacing:.02em}
</style></head><body><div class="wrap">
${h.img?`<div class="por"><img src="${h.img}"></div>`:""}
<div class="info">
<div class="name">${esc(h.n)}</div>
<div class="row"><span class="rar">${esc(h.r)}</span>${h.t?`<span class="tier"><small>TIER</small>${esc(h.t)}</span>`:""}</div>
<div class="fac"><img src="/img/f-${h.fs}.png" onerror="this.remove()">${esc(h.f)}</div>
${meta?`<div class="meta">${meta}</div>`:""}
<div class="chips">${chips}</div>
<div class="foot"><img src="/img/logo.png"><span class="url">imrdatabase.com</span></div>
</div></div></body></html>`}

module.exports=async function({br,pg,PORT,ROOT,DIST}){
 const heroes=await pg.evaluate(()=>H.map(h=>{const x=X[h.n]||[],s=slug(h.n),fs=slug(h.f);
  return{n:h.n,s,f:h.f,fs,r:h.r,t:x[0]||"",dt:x[1]||[],cls:x[3]||"",mark:x[4]||"",img:imgSrc(h.n),cut:!NOCUT.has(s),fbg:FBG.has(fs)?"/img/fbg-"+fs+".jpg":null}}));
 const CACHE=path.join(ROOT,"og-cache","heroes");fs.mkdirSync(CACHE,{recursive:true});
 const manF=path.join(ROOT,"og-cache","manifest.json");let man={};try{man=JSON.parse(fs.readFileSync(manF,"utf8"))}catch(e){}
 const p=await br.newPage({viewport:{width:1200,height:630}});const base=`http://localhost:${PORT}/`;
 const out={};let made=0;
 for(const h of heroes){
  const key=crypto.createHash("sha1").update(TPL_VER+JSON.stringify(h)).digest("hex").slice(0,12);
  const file=path.join(CACHE,h.s+".jpg");
  if(man[h.s]!==key||!fs.existsSync(file)){
   await p.setContent(card(h,base),{waitUntil:"load"});
   await p.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r}))));
   await p.screenshot({path:file,type:"jpeg",quality:86});man[h.s]=key;made++}
  out[h.s]="/og/heroes/"+h.s+".jpg"}
 await p.close();fs.writeFileSync(manF,JSON.stringify(man,null,0));
 const D=path.join(DIST,"og","heroes");fs.mkdirSync(D,{recursive:true});
 for(const h of heroes)fs.copyFileSync(path.join(CACHE,h.s+".jpg"),path.join(D,h.s+".jpg"));
 console.log("og images:",heroes.length,"rendered:",made);
 return out};
module.exports.card=card;
