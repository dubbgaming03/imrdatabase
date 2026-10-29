/* Site languages. English is built in; every other language is one bundle in /i18n/<code>.js,
   loaded only when picked. Game text (heroes, skills, buffs, Spirit Beasts, Arcane Gems, gear,
   emblems) comes from the game's own language files; site text is translated. */
(function(){
const LANGS=[["en","English"],["es","Español"],["pt","Português"],["fr","Français"],["de","Deutsch"],["it","Italiano"],["ru","Русский"],["tr","Türkçe"],["id","Bahasa Indonesia"],["ja","日本語"],["ko","한국어"],["cn","简体中文"],["zh","繁體中文"]];
const HL={cn:"zh-Hans",zh:"zh-Hant"},LOC={en:"en-US",es:"es-ES",pt:"pt-BR",fr:"fr-FR",de:"de-DE",it:"it-IT",ru:"ru-RU",tr:"tr-TR",id:"id-ID",ja:"ja-JP",ko:"ko-KR",cn:"zh-CN",zh:"zh-TW"};
const CACHE={},WAIT={};
const I={lang:"en",d:null,LANGS};window.I18N=I;
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const nk=s=>String(s||"").replace(/Ⅰ/g,"I").replace(/Ⅱ/g,"II").replace(/Ⅲ/g,"III").replace(/[\s  ·・]+/g,"").toLowerCase();
let REV={};
function index(){REV={};const b=I.d&&I.d.bd;if(b)for(const k in b){REV[nk(b[k][0])]=k;REV[nk(k)]=k}}
/* site text */
window.T=function(s,v){let o=(I.d&&I.d.ui&&I.d.ui[s])||s;if(v)for(const k in v)o=o.split("{"+k+"}").join(v[k]);return o};
I.on=()=>I.lang!=="en"&&!!I.d;
I.loc=()=>LOC[I.lang]||"en-US";
/* game text: each returns the English value when there is no translation */
const g=(c,k)=>I.d&&I.d[c]&&I.d[c][k];
I.hn=n=>g("hn",n)||n;
I.fac=f=>g("fac",f)||f;
I.kit=n=>g("kit",n)||null;
I.bdName=n=>{const x=g("bd",n);return x&&x[0]||n};
I.bdDesc=(n,en)=>{const x=g("bd",n);return x&&x[1]||en};
/* bracketed name as shown in translated text -> English buff key */
I.bdKey=s=>REV[nk(s)]||null;
I.pet=id=>g("pet",id)||null;
I.gem=id=>g("gem",id)||null;
I.eq=(cat,n)=>{const x=I.d&&I.d.eq&&I.d.eq[cat]&&I.d.eq[cat][n];return x||null};
I.ms=s=>g("ms",s)||T(s);
I.emb=id=>g("emb",id)||null;
I.txt=(s)=>T(s);
I.term=x=>{const d=I.d;return(d&&((d.term&&d.term[x])||(d.bd&&d.bd[x]&&d.bd[x][0])||(d.ui&&d.ui[x])))||x};
I.peq=k=>g("peq",k)||null;
I.month=(y,m)=>{try{return new Date(Date.UTC(+y,+m-1,15)).toLocaleDateString(I.loc(),{month:"short",year:"numeric",timeZone:"UTC"})}catch(e){return m+"/"+y}};
/* loading */
window.I18N_DATA=function(code,data){CACHE[code]=data;(WAIT[code]||[]).forEach(f=>f());delete WAIT[code]};
function load(code,cb){if(code==="en")return cb(null);if(CACHE[code])return cb(CACHE[code]);
 if(WAIT[code]){WAIT[code].push(()=>cb(CACHE[code]));return}WAIT[code]=[()=>cb(CACHE[code])];
 const s=document.createElement("script");s.src="/i18n/"+code+".js?v="+(window.BUILD_DATE||"1");s.async=true;
 s.onerror=()=>{delete WAIT[code];cb(null)};document.head.appendChild(s)}
const subs=[];I.onChange=f=>subs.push(f);
I.set=function(code,save){if(!LANGS.some(l=>l[0]===code))code="en";
 if(save!==false)ls("im-lang",code);
 const box=document.getElementById("lang");if(box)box.value=code;document.documentElement.classList.add("lload");
 load(code,d=>{if(code!=="en"&&!d){code="en"}I.lang=code;I.d=d;index();
  const h=document.documentElement;h.lang=HL[code]||code;h.classList.remove("lload");if(box)box.value=code;
  subs.forEach(f=>{try{f(code)}catch(e){console.error(e)}})})};
/* picker (top right) */
function picker(){const sel=document.getElementById("lang");if(!sel)return;sel.replaceChildren();
 LANGS.forEach(([c,n])=>{const o=document.createElement("option");o.value=c;o.textContent=n;sel.appendChild(o)});
 sel.value=I.lang;sel.onchange=()=>I.set(sel.value);const b=document.getElementById("langbox");if(b)b.hidden=false}
I.init=function(){picker();const sv=ls("im-lang");if(sv&&sv!=="en")I.set(sv,false)};
})();
