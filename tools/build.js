// Build static, prerendered site: src/ -> dist/
// Usage: NODE_PATH=$(npm root -g) node tools/build.js
const fs=require("fs"),path=require("path"),{spawn}=require("child_process");
const {chromium}=require("playwright");
const ROOT=path.resolve(__dirname,".."),SRC=path.join(ROOT,"src"),DIST=path.join(ROOT,"dist"),SITE="https://imrdatabase.com",PORT=8091;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function cp(a,b){fs.mkdirSync(b,{recursive:true});for(const f of fs.readdirSync(a)){const s=path.join(a,f),d=path.join(b,f);if(fs.statSync(s).isDirectory())cp(s,d);else fs.copyFileSync(s,d)}}
(async()=>{
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
   .replace("<!--SSR-->",o.html);
  const out=r.k==="notfound"?path.join(DIST,"404.html"):path.join(DIST,r.p,"index.html");
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);
  if(r.k!=="notfound")urls.push(SITE+r.p);n++;
 }
 await br.close();srv.kill();
 urls.push(SITE+"/privacy/");urls.push(SITE+"/bracket/");
 const today=new Date().toISOString().slice(0,10);
 fs.writeFileSync(path.join(DIST,"sitemap.xml"),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>`<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")+"\n</urlset>\n");
 fs.writeFileSync(path.join(DIST,"robots.txt"),`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
 console.log("pages:",n,"sitemap urls:",urls.length,"errors:",errs.length?errs.slice(0,5):0);
})();
