/* Home tab: news, recents, popular, playlists, subscribe + socials, and hero-page video links. */
(function(){
const CH="https://www.youtube.com/@Dubb_Gaming03";
const SOC=[["YouTube",CH],["Instagram","https://www.instagram.com/dubbgaming03/"],["TikTok","https://www.tiktok.com/@dubb_gaming"],["Facebook","https://www.facebook.com/profile.php?id=61585900062687"]];
const PL=[["Beginner","PLRdESMN0nrsP-t1bP9Bubd4lqqPShA9U3",33],["Championship Bracket Challenge","PLRdESMN0nrsMVFwPs40KpgPj6ekdNQZeE",88],["Wuthering Coast","PLd1yg7KC43Vs",6],["Seven Sages of Liuli","PLRdESMN0nrsNEGIv7rjorzpSH9BuAO8qE",0],["Rotating Events","PLXQQjY2bUg-M",20]];
const DISCORD="https://discord.gg/aepCr4qrfD";
const PATCH_PL="PLRdESMN0nrsOcf9IO8kleh8MLM2bI3Kdb";
const PINNED=["vHGSVR0yq7Q","Faw9orkaGRk"];
const V=window.YT_ROWS.trim().split("\n").map(l=>{const a=l.split("|");return{id:a[0],d:a[1],v:+a[2],s:+a[3],t:a.slice(4).join("|").trim()}});
const BYID={};V.forEach(v=>BYID[v.id]=v);
const t=(s,v)=>T(s,v);
const fv=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e4?Math.round(n/1e3)+"K":n>=1e3?(n/1e3).toFixed(1).replace(".0","")+"K":String(n);
const fd=d=>{try{return new Date(d+"T12:00:00Z").toLocaleDateString(I18N.loc(),{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}catch(e){return d}};
const fl=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0")};
const yurl=id=>"https://www.youtube.com/watch?v="+id;
const ICO={"Discord":{"c":"#5865F2","p":"M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"},"YouTube": {"c": "#FF0000", "p": "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"}, "Instagram": {"c": "#E4405F", "p": "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"}, "TikTok": {"c": "#ffffff", "p": "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"}, "Facebook": {"c": "#1877F2", "p": "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"}};
const icon=n=>{const o=ICO[n];if(!o)return null;const s=el("span","hico");s.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="'+o.c+'" d="'+o.p+'"/></svg>';return s};
function link(cls,href,kids){const a=el("a",cls);a.href=href;a.target="_blank";a.rel="noopener noreferrer";(kids||[]).forEach(k=>a.appendChild(k));return a}
const TH=["xo9M_Q6pBwc", "5Zqoh1TG18o", "pBs6w5phLUI", "OultrV09aPY", "bGEEj04oQn8", "1gkKLrX_XkU", "xUkX3uU5gmQ", "WDxdOeQ2vhE", "BeZkQ9YyKSc", "vHGSVR0yq7Q", "Faw9orkaGRk", "ZQAV4uUVqM4", "otOGDp3nAMM", "aEMwpWO_6h0", "GaOmkscmXgM", "OiucEDaD5lw", "BSPIeHQ4V-k", "0RPJeZ8kteA", "0peMrnvGg9A", "QjczE9LOcNQ", "KngG8jmp-88", "ndKcoS6KGE8", "G1uKdMQ-hiI", "pfuu-6BeA5s", "vlPZmaLh_7U", "m8XlQ1kFg50", "KJyDWh5Z5i4", "nscMBni-tMw", "L-9HM2bArI4", "0gFIeI22E3M", "xm4We6_Ug2o", "0iD4dOiGWtU", "yx84By-5Dvo", "kNM0ZtXqSUw", "d6tZVMGMHcY", "JZQd3wioSC0", "KXqmDJ60NMk", "K0vK7aYWbjY", "mF31Xi2w2GU", "9NziyYGdQuQ", "GYX3kUhB_fY", "W-ikzOWTq_c", "Fi9kWTcusWY", "A66Xv7jxqJ0", "4rDgJlXyFTM", "sUrGk1iE2IU", "Q6mQg7mjbdE", "xytvfY0F0ZI", "LhpuntxTM-M", "QyrurxK8P-0", "IA_qq4ITcU8", "uH8HpDZ3SK0", "5G3t8A8Vn8w", "bqydd2hiLwE", "LVnKfXCInh0", "Fdj9xeITAp8", "gDH9fYUHnSw", "qTUhWKWpLpk", "BA0q2xArRNc", "cqSTEcOkJgs", "T_5YWDV2cJU", "CFkf6uUBgJY", "kcZC5_p4948", "eo1zF7-4sHo", "0MDH64zfHhc", "NI675UDqDds", "1UT8uXAtw4Q", "N5yX_kQTWXk"];
function thumb(v){const w=el("div","hthumb");{const i=el("img","himg");i.loading="lazy";i.decoding="async";i.alt=v.t;const q=["maxresdefault","sddefault","hqdefault"];let n=0;i.src="https://i.ytimg.com/vi/"+v.id+"/"+q[0]+".jpg";i.onload=()=>{if(i.naturalWidth<=120&&n<q.length-1){n++;i.src="https://i.ytimg.com/vi/"+v.id+"/"+q[n]+".jpg"}};i.onerror=()=>{if(n<q.length-1){n++;i.src="https://i.ytimg.com/vi/"+v.id+"/"+q[n]+".jpg"}};w.appendChild(i)}w.appendChild(el("span","hplay","▶"));w.appendChild(el("span","hdur",fl(v.s)));return w}
function vcard(v,pin){const b=el("div","hbody");b.appendChild(el("div","hvt",v.t));b.appendChild(el("div","hvm",fv(v.v)+" "+t("views")+" · "+fd(v.d)));const c=link("hcard"+(pin?" pin":""),yurl(v.id),[thumb(v),b]);if(pin)c.appendChild(el("span","hpin",t("Pinned")));return c}


/* ---- Download Today: official store links + Dubb's Aptoide link ---- */
const DL=[
 ["apple","https://apps.apple.com/app/6469089586","Download on the","App Store"],
 ["gplay","https://play.google.com/store/apps/details?id=com.ihgames.im.android.google","Get it on","Google Play"],
 ["apk","https://res-download.dhgames.com/ih/apk/infinite-magicraid.apk","Download the","Android APK"],
 ["pc","https://res-download.dhgames.com/ih/apk/infinite-magicraid-windows-launcher.exe","Download for","PC (Windows)"]];
const APTOIDE="http://aptoi.de/Dubb_IMR_download";
const DLI={
 apple:'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="#fff" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg>',
 gplay:'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="#00d7fe" d="M3.6 2.2 13.4 12l-9.8 9.8c-.4-.2-.6-.6-.6-1.1V3.3c0-.5.2-.9.6-1.1z"/><path fill="#ffce00" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.8 2.2c.9.5.9 1.8 0 2.3z"/><path fill="#ff3a44" d="M16.7 15.3 13.4 12l-9.8 9.8c.4.2.9.2 1.4-.1z"/><path fill="#00f076" d="M16.7 8.7 5 2.3c-.5-.3-1-.3-1.4-.1L13.4 12z"/></svg>',
 apk:'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="#3ddc84" d="M5 10h14v8a1.5 1.5 0 0 1-1.5 1.5H16v2.5a1.25 1.25 0 0 1-2.5 0v-2.5h-3v2.5a1.25 1.25 0 0 1-2.5 0v-2.5H6.5A1.5 1.5 0 0 1 5 18zM2.25 10.5a1.25 1.25 0 0 1 2.5 0v5a1.25 1.25 0 0 1-2.5 0zm17 0a1.25 1.25 0 0 1 2.5 0v5a1.25 1.25 0 0 1-2.5 0zM5 9a7 7 0 0 1 14 0zm3.6-6.7.9 1.5M15.4 2.3l-.9 1.5"/><path stroke="#3ddc84" stroke-width="1.2" stroke-linecap="round" d="m8.2 2 1.2 2m6.4-2-1.2 2"/><circle cx="9.5" cy="6.3" r=".9" fill="#1b1b1b"/><circle cx="14.5" cy="6.3" r=".9" fill="#1b1b1b"/></svg>',
 pc:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#4cc2ff" d="M2 4.3 10 3.2v7.6H2zm9-1.2L22 1.5v9.3H11zM2 12h8v7.7l-8-1.1zm9 0h11v10.5l-11-1.6z"/></svg>'};
{const st=document.createElement("style");st.textContent=".hdl{margin:26px auto 6px;max-width:880px}.hdl h2{color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.85);margin:0 0 12px;font-size:22px}.hdlg{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.hdlb{display:inline-flex;align-items:center;gap:10px;min-width:180px;padding:8px 16px 8px 12px;border-radius:12px;background:#0b0b0f;border:1px solid rgba(255,255,255,.45);color:#fff;text-decoration:none;text-align:left;box-shadow:0 2px 10px rgba(0,0,0,.45)}.hdlb:hover{border-color:#fff;background:#1a1a22}.hdlb span{display:flex;flex-direction:column;line-height:1.1}.hdlb small{font-size:11px;opacity:.85}.hdlb b{font-size:17px;font-weight:700;letter-spacing:.01em}.hdla{display:inline-flex;flex-direction:column;align-items:center;gap:6px;margin-top:14px;padding:12px 22px 10px;border-radius:14px;background:#fff;text-decoration:none;box-shadow:0 2px 12px rgba(0,0,0,.45);border:2px solid #fe6446}.hdla:hover{filter:brightness(1.04)}.hdla img{height:34px;width:auto;display:block}.hdla small{color:#5a3328;font-size:12px;font-weight:700}@media (max-width:520px){.hdlb{min-width:0;flex:1 1 calc(50% - 10px)}.hdlb b{font-size:15px}}";document.head.appendChild(st)}
function dlSection(){const s=el("section","hdl");s.appendChild(el("h2",null,t("Download Today")));const g=el("div","hdlg");
 DL.forEach(([k,u,a,b])=>{const x=link("hdlb",u,[]);const ic=el("span","hdli");ic.innerHTML=DLI[k];x.appendChild(ic.firstChild);const tx=el("span");tx.appendChild(el("small",null,t(a)));tx.appendChild(el("b",null,t(b)));x.appendChild(tx);x.setAttribute("aria-label",t(a)+" "+t(b));g.appendChild(x)});
 s.appendChild(g);
 const ap=link("hdla",APTOIDE,[]);const im=el("img");im.src="/img/aptoide.svg";im.alt="Aptoide";ap.appendChild(im);ap.appendChild(el("small",null,t("Get it on Aptoide")));ap.setAttribute("aria-label",t("Get it on Aptoide"));s.appendChild(ap);
 return s}

/* ---- markup ---- */
const home=el("div");home.id="home";home.hidden=true;
home.innerHTML='<img class="logo" src="/img/logo.png" alt="Infinite Magicraid"><p class="psub"></p><div id="htop"></div><div id="hnews"></div><div id="hpop"></div><div id="hpl"></div><div class="hfoot"></div>';
document.getElementById("list").before(home);
IM_TABS(home.querySelector(".logo"),"home");

function socials(){const d=el("div","hsoc");SOC.forEach(([n,u])=>{if(!u)return;const a=link("hs",u,[]);const i=icon(n);if(i)a.appendChild(i);a.appendChild(el("span",null,n));a.setAttribute("aria-label",n);d.appendChild(a)});return d}
function subImg(){const s=el("span","hsubimg");s.setAttribute("role","img");s.setAttribute("aria-label",t("Subscribe"));s.innerHTML='<svg viewBox="0 0 120 36" width="96" height="29" aria-hidden="true" focusable="false"><rect width="120" height="36" rx="18" fill="#FF0000"/><text x="60" y="23.5" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif" font-size="15" font-weight="700" fill="#fff">'+t("Subscribe")+'</text></svg>';return s}
function followRow(small){const d=el("div","hsub"+(small?" small":""));d.appendChild(subImg());d.appendChild(socials());const a=link("hs hdisc",DISCORD,[]);const i=icon("Discord");if(i)a.appendChild(i);a.appendChild(el("span",null,t("Official IMR Discord")));d.appendChild(a);return d}
function section(title,sub){const s=el("section","hsec");s.appendChild(el("h2",null,title));if(sub)s.appendChild(el("p","hnote",sub));return s}

function build(){
 home.querySelector(".psub").textContent=t("Database: News, videos and guides");
 $("htop").replaceChildren();
 /* News */
 const N=$("hnews");N.replaceChildren();const ns=section(t("Latest news"));
 const FEATURED="DAAhfW1pi0E";const patch=V.find(v=>/^patch note hype/i.test(v.t));const feat=BYID[FEATURED]||patch;const isPatch=feat===patch;
 if(feat){const f=el("div","hfeat");f.appendChild(link("hfthumb",yurl(feat.id),[thumb(feat)]));
  const b=el("div","hfbody");b.appendChild(el("span","hbadge",t(isPatch?"Latest patch notes":"Featured")));b.appendChild(el("h3",null,feat.t));b.appendChild(el("div","hvm",fv(feat.v)+" "+t("views")+" · "+fd(feat.d)));
  const row=el("div","hrow");row.appendChild(link("hbtn",yurl(feat.id),[el("span",null,"▶ "+t("Watch"))]));if(isPatch)row.appendChild(link("hbtn alt","https://www.youtube.com/playlist?list="+PATCH_PL,[el("span",null,t("All Patch Note HYPE videos"))]));b.appendChild(row);f.appendChild(b);ns.appendChild(f)}
 const NEWS=/patch note|leak|event|update|roadmap|message|discount|top up|vip|reward|login|packs|hotfix|anniversary|lte|festival|gift|mall|pass|servers|rework|bracket challenge/i;
 const feed=V.filter(v=>v!==feat&&(v===patch||!/^patch note hype/i.test(v.t))&&NEWS.test(v.t)).slice(0,8);
 const g=el("div","hgrid");feed.forEach(v=>g.appendChild(vcard(v)));ns.appendChild(g);N.appendChild(ns);
 /* Popular */
 const P=$("hpop");P.replaceChildren();const ps=section(t("Popular"),t("Most-viewed videos from the last 90 days, plus the guides to start with."));
 const cut=new Date(window.YT_SNAPSHOT+"T00:00:00Z");cut.setUTCDate(cut.getUTCDate()-90);const cs=cut.toISOString().slice(0,10);
 const top=V.filter(v=>v.d>=cs&&!PINNED.includes(v.id)).sort((a,b)=>b.v-a.v).slice(0,6);
 const pg=el("div","hgrid");PINNED.map(i=>BYID[i]).filter(Boolean).forEach(v=>pg.appendChild(vcard(v,true)));top.forEach(v=>pg.appendChild(vcard(v)));ps.appendChild(pg);P.appendChild(ps);
 /* Playlists */
 const L=$("hpl");L.replaceChildren();const ls=section(t("Playlists"));const lg=el("div","hgrid pls");
 PL.forEach(([n,id,c])=>{const b=el("div","hbody");b.appendChild(el("div","hvt",t(n)));b.appendChild(el("div","hvm",(c?c+" "+t("videos")+" · ":"")+t("Watch playlist")+" →"));lg.appendChild(link("hcard plc","https://www.youtube.com/playlist?list="+id,[b]))});ls.appendChild(lg);L.appendChild(ls);
 /* Footer */
 const F=home.querySelector(".hfoot");F.replaceChildren();F.appendChild(followRow(false));F.appendChild(dlSection());
 F.appendChild(el("p","hnote",t("Video list and view counts are a snapshot from")+" "+fd(window.YT_SNAPSHOT)+"."))}

/* ---- routing ---- */
window.HOMER=function(hs){
 if(hs===""||hs==="home"){["list","detail","pets","pdetail","gems","gdetail"].forEach(i=>{const e=document.getElementById(i);if(e)e.hidden=true});home.hidden=false;if(typeof pbgList==="function")pbgList();window.scrollTo(0,0);return true}
 home.hidden=true;return false};
if(typeof render==="function"){const _r=render;render=function(){_r.apply(this,arguments);build()}}

/* ---- videos on hero pages ---- */
const SKIP=new Set(["Will","Space"]),ALIAS={Ulrik:["ulrik","ulrick","olrick"]};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function heroVids(n){if(SKIP.has(n))return[];const pats=(ALIAS[n]||[n.toLowerCase()]).map(p=>new RegExp("\\b"+esc(p)+"\\b","i"));return V.filter(v=>pats.some(p=>p.test(v.t)))}
if(typeof show==="function"){const _s=show;show=function(n,nh){const r=_s.apply(this,arguments);try{const vs=heroVids(n);const d=document.getElementById("detail");if(vs.length&&d){const s=el("div","sec");s.appendChild(el("h3",null,t("Videos")));const g=el("div","hgrid hero");vs.slice(0,6).forEach(v=>g.appendChild(vcard(v)));s.appendChild(g);d.appendChild(s)}}catch(e){}return r};}
build();
if(typeof route==="function")route();
})();
