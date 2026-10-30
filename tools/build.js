// Build static, prerendered site: src/ -> dist/
// Usage: NODE_PATH=$(npm root -g) node tools/build.js
const fs=require("fs"),path=require("path"),{spawn}=require("child_process");
const {chromium}=require("playwright");
const ROOT=path.resolve(__dirname,".."),SRC=path.join(ROOT,"src"),DIST=path.join(ROOT,"dist"),SITE="https://imrdatabase.com",PORT=8091;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function cp(a,b){fs.mkdirSync(b,{recursive:true});for(const f of fs.readdirSync(a)){const s=path.join(a,f),d=path.join(b,f);if(fs.statSync(s).isDirectory())cp(s,d);else fs.copyFileSync(s,d)}}
(async()=>{
 /* publish date (New York time) -> "Last updated" on the Hero Tier List */
 const BD=new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"});
 fs.writeFileSync(path.join(SRC,"assets","buildinfo.js"),`window.BUILD_DATE="${BD}";\n`);
 fs.rmSync(DIST,{recursive:true,force:true});cp(SRC,DIST);fs.rmSync(path.join(DIST,"shell-body.html"),{force:true});
 const shell=fs.readFileSync(path.join(SRC,"index.html"),"utf8");
 const srv=spawn("node",[path.join(__dirname,"serve.js"),SRC,String(PORT)],{stdio:"ignore"});
 await new Promise(r=>setTimeout(r,800));
 const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1280,height:900}});
 const errs=[];pg.on("pageerror",e=>errs.push(e.message));
 await pg.goto(`http://localhost:${PORT}/`,{waitUntil:"networkidle"});
 const routes=await pg.evaluate(()=>{const s=SLUG2,k=["home","heroes","pets","gems"];
  H.map(h=>h.n).sort().forEach(n=>k.push(n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")));
  Object.keys(PET_SLUGS).forEach(id=>k.push("pet-"+id));Object.keys(GEM_SLUGS).forEach(id=>k.push("gem-"+id));
  D.forEach(d=>k.push("fac:"+d[0]));[...new Set(Object.values(X).flatMap(v=>v[1]))].filter(Boolean).filter(t=>H.some(h=>X[h.n]&&X[h.n][1].includes(t))).forEach(t=>k.push("dt:"+t));
  return k.map(x=>({k:x,p:PATH(x)}))});
 routes.push({k:"notfound",p:"/__404__/"});
 const OG=await require("./og.js")({br,pg,PORT,ROOT,DIST}); /* hero social preview images */
 const urls=[];let n=0;
 for(const r of routes){
  await pg.goto(`http://localhost:${PORT}${r.p}`,{waitUntil:"load"});
  await pg.waitForTimeout(60);
  const o=await pg.evaluate(()=>{
   const m=PAGEMETA(ROUTEKEY());const main=document.querySelector("main");
   const vis=[...main.children].filter(e=>!e.hidden&&e.id!=="ssr"&&!e.classList.contains("lw"));
   const box=document.createElement("div");vis.forEach(e=>{const c=e.cloneNode(true);c.querySelectorAll("img").forEach(i=>i.setAttribute("loading","lazy"));c.querySelectorAll("script,style").forEach(x=>x.remove());box.appendChild(c)});
   const h1=box.querySelector("h1");
   return{m,html:box.innerHTML,h1:!!h1}});
  if(o.m.nf&&r.k!=="notfound")console.warn("route resolved to 404:",r.p);
  const url=SITE+(r.k==="notfound"?"/":r.p);
  let html=shell.replace(/<title>[^<]*<\/title>/,`<title>${esc(o.m.t)}</title>`)
   .replace('<meta name="description" content="">',`<meta name="description" content="${esc(o.m.d)}">`)
   .replace('<meta property="og:title" content="Infinite Magicraid Database">',`<meta property="og:title" content="${esc(o.m.t)}">`)
   .replace('<meta property="og:description" content="">',`<meta property="og:description" content="${esc(o.m.d)}">`)
   .replace('<link rel="canonical" href="https://imrdatabase.com/">',r.k==="notfound"?'<meta name="robots" content="noindex">':`<link rel="canonical" href="${url}">`)
   .replace('<meta property="og:url" content="https://imrdatabase.com/">',`<meta property="og:url" content="${url}">`)
   .replace('<meta property="og:image" content="https://imrdatabase.com/img/logo.png">',OG[r.k]?`<meta property="og:image" content="${SITE}${OG[r.k]}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:image" content="${SITE}${OG[r.k]}">`:'<meta property="og:image" content="https://imrdatabase.com/img/logo.png">')
   .replace("<!--SSR-->",o.html);
  const out=r.k==="notfound"?path.join(DIST,"404.html"):path.join(DIST,r.p,"index.html");
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);
  if(r.k!=="notfound")urls.push(SITE+r.p);n++;
 }
 await br.close();srv.kill();
 urls.push(SITE+"/privacy/");urls.push(SITE+"/bracket/");
 /* Codes page: static HTML filled from src/codes/codes.json (edit the JSON to update codes) */
 {const C=JSON.parse(fs.readFileSync(path.join(SRC,"codes","codes.json"),"utf8"));
  const d=s=>new Date(s+"T12:00:00"),long=s=>d(s).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}),short=s=>d(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  const act=C.active.filter(c=>!c.expires||c.expires>=C.checked),late=C.active.filter(c=>c.expires&&c.expires<C.checked);
  const card=c=>`<div class="ccard" data-code="${esc(c.code)}"${c.expires?` data-exp="${c.expires}" data-expl="${short(c.expires)}"`:""}><div class="crow"><span class="ccode">${esc(c.code)}${c.new?'<span class="cnew">New</span>':""}</span><button class="ccopy" type="button" data-code="${esc(c.code)}" aria-label="Copy code ${esc(c.code)}">Copy</button></div><div class="crew">${esc(c.rewards)}</div><div class="cexp">${c.expires?"Expires "+long(c.expires):"No expiry date announced"}</div></div>`;
  const row=c=>`<tr><td>${esc(c.code)}</td><td>${esc(c.rewards)}</td><td>${c.ended?short(c.ended):c.expires?short(c.expires):"—"}</td></tr>`;
  const F=C.featured,et=s=>new Date(s).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});
  const feat=F&&new Date(F.end)>new Date()?`<section class="cfeat" id="feat" data-start="${F.start}" data-end="${F.end}" aria-labelledby="h-feat"><div class="cfhead"><img src="/img/aptoide.svg" alt="Aptoide" class="cflogo"><span class="cfonly">Aptoide only</span></div><h2 id="h-feat" class="cftitle">Aptoide Wallet promo code</h2><div class="cfrow"><span class="cfcode">${esc(F.code)}</span><button class="ccopy" type="button" data-code="${esc(F.code)}" aria-label="Copy code ${esc(F.code)}">Copy</button></div><p class="cfrew">${esc(F.reward)}</p><p class="cfdate"><span class="cfstat"></span>${et(F.start)} – ${et(F.end)} ET</p><p class="cfnote">Enter this code in your <b>Aptoide Wallet</b>, not in the game. It only works for purchases in the Aptoide version of Infinite Magicraid. The in-game codes below go in the game's Redeem Code screen.</p><a class="cfbtn" href="${esc(F.link)}" rel="noopener">Get Infinite Magicraid on Aptoide</a></section>`:"";
  const mo=d(C.checked).toLocaleString("en-US",{month:"long",year:"numeric"});
  const f=path.join(DIST,"codes","index.html");
  fs.writeFileSync(f,fs.readFileSync(f,"utf8").split("<!--MONTH-->").join(mo).split("<!--UPDATED-->").join(long(C.checked)).replace("<!--FEATURED-->",feat).replace("<!--ACTIVE-->",act.map(card).join("")).replace("<!--EXPIRED-->",late.concat(C.expired).map(row).join("")));
  fs.rmSync(path.join(DIST,"codes","codes.json"),{force:true});
  urls.push(SITE+"/codes/")}
 const today=BD;
 fs.writeFileSync(path.join(DIST,"sitemap.xml"),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>`<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")+"\n</urlset>\n");
 fs.writeFileSync(path.join(DIST,"robots.txt"),`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
 console.log("pages:",n,"sitemap urls:",urls.length,"errors:",errs.length?errs.slice(0,5):0);
})();
