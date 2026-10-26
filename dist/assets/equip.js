/* Hero "Build & Recommended Equipment" section, from Dubb's stat cards. */
(function(){
const EQ={
 "Bastet":{lv:200,
  goals:[["ATK","40K","60K","80K"],["Mastery","160%","200%","240%"],["Effect Hit","75%","100%","125%"],["SPD","2,200","2,600","2,800"]],
  gear:[[["Penetration","gear-penetration"]],[["Bone","gear-bone"],["Wind","gear-wind"]]],
  aura:[["Mastery","aura-mastery"],["Adv. Hit","aura-adv-hit"],["Versatility","aura-versatility"],["Poison","aura-poison"]],
  echo:[["Traveler’s Diary","echo-travelers-diary"],["Uplifting Drums","echo-uplifting-drums"],["Golden Sand Reverie","echo-golden-sand-reverie"]],
  gem:null,src:"Sep 2026"}
};
window.HERO_EQ=EQ;
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
function tile(n,ic,cls){const d=el("div","eqtile eqk-"+cls);const i=el("img");i.src="/img/eq/"+ic+".png";i.alt=n;i.loading="lazy";d.appendChild(i);d.appendChild(el("span",null,n));return d}
function row(label,kids){const r=el("div","eqr");r.appendChild(el("div","eql",label));const b=el("div","eqv");kids.forEach(k=>b.appendChild(k));r.appendChild(b);return r}
function build(n){const q=EQ[n];if(!q)return null;
 const s=el("div","sec eqsec");s.appendChild(el("h3",null,"Build & recommended equipment"));
 if(q.goals){const w=el("div","eqgoal");const hd=el("div","eqgh");hd.appendChild(el("b",null,"Estimated stat goals"));if(q.lv)hd.appendChild(el("span","eqlv","Target Lv."+q.lv));w.appendChild(hd);
  const t=el("table","ptbl eqtbl"),h=el("tr");["","New","Mid","End"].forEach((x,i)=>h.appendChild(el("th",i?"eq"+i:null,x)));t.appendChild(h);
  q.goals.forEach(r=>{const tr=el("tr");r.forEach((x,i)=>tr.appendChild(el(i?"td":"th",i?"eq"+i:null,x)));t.appendChild(tr)});w.appendChild(t);s.appendChild(w)}
 if(q.gear){s.appendChild(row("Gear",q.gear.map((set,i)=>{const g=el("div","eqset");set.forEach((p,j)=>{if(j)g.appendChild(el("span","eqor","or"));g.appendChild(tile(p[0],p[1],"gear"))});return g}).flatMap((g,i)=>i?[el("span","eqplus","+"),g]:[g])))}
 if(q.aura)s.appendChild(row("Aura",q.aura.map(a=>tile(a[0],a[1],"aura"))));
 if(q.echo)s.appendChild(row("Echo",q.echo.map(a=>tile(a[0],a[1],"echo"))));
 s.appendChild(row("Arcane Gem",[q.gem?tile(q.gem[0],q.gem[1],"gem"):el("span","eqtbd","To be determined")]));
 s.appendChild(el("p","eqnote","From Dubb’s stat card"+(q.src?" ("+q.src+")":"")+". Stat goals are estimates for new, mid-game and end-game accounts; echoes are nice to have, not needed."));
 return s}
if(typeof show==="function"){const _s=show;show=function(n){const r=_s.apply(this,arguments);try{const d=document.getElementById("detail"),s=build(n);if(d&&s){const secs=[...d.querySelectorAll(".sec")];const kit=secs.find(x=>{const h=x.querySelector("h3");return h&&/^(Kit|Stat card|Videos)$/i.test(h.textContent.trim())});kit?kit.before(s):d.appendChild(s)}}catch(e){}return r}}
if(typeof route==="function")route();
})();
