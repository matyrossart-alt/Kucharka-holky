(async()=>{
const D=await (await fetch('data.json')).json(), N=D.n;
const $=id=>document.getElementById(id);
const img=$('img'),sheet=$('sheet'),hot=$('hot'),lbl=$('lbl'),menu=$('menu'),stage=$('stage'),mi=$('menuIn');
let cur=0;
const pad=n=>String(n+1).padStart(3,'0');
// recepty (rozsahy stran)
const items=D.chapters.flatMap(c=>c.k.map(k=>({t:k[0],p:k[1]}))).sort((a,b)=>a.p-b.p);
items.forEach((it,i)=>it.e=i+1<items.length?items[i+1].p-1:N-2);
const itemAt=p=>items.find(it=>p>=it.p&&p<=it.e);
// oblibene (ukladaji se jen v tomto telefonu)
let favs=[];try{favs=JSON.parse(localStorage.getItem('fav')||'[]')}catch(e){}
const saveFavs=()=>{try{localStorage.setItem('fav',JSON.stringify(favs))}catch(e){}};
function tools(){const it=itemAt(cur),f=it&&favs.includes(it.p);const b=$('btnFav');b.disabled=!it;b.textContent=f?'★ Uloženo':'☆ Uložit';b.classList.toggle('on',!!f);$('btnFavs').textContent='Oblíbené'+(favs.length?' '+favs.length:'')}
function toast(t){const x=$('toast');x.textContent=t;x.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>x.hidden=true,2600)}
function show(i,store=true){
  cur=Math.max(0,Math.min(N-1,i)); img.src='pages/p'+pad(cur)+'.webp';
  hot.innerHTML=''; (D.links[cur]||[]).forEach(l=>{const a=document.createElement('a');a.href='#'+(l[4]+1);
    a.style.cssText=`left:${l[0]}%;top:${l[1]}%;width:${l[2]}%;height:${l[3]}%`;a.onclick=e=>{e.preventDefault();show(l[4])};hot.appendChild(a)});
  lbl.textContent=(D.labels[cur]||'').trim()?('strana '+D.labels[cur]):'';
  if(cur==0) lbl.textContent=''; if(cur==N-1) lbl.textContent='zadní strana'; if(cur>=1&&cur<=4) lbl.textContent='obsah';
  stage.classList.toggle('cover',cur===0); if(cur!==0)stage.style.removeProperty('--cbg');
  reset(); tools(); history.replaceState(null,'','#'+(cur+1));
  if(store) try{localStorage.setItem('page',cur)}catch(e){}
  [cur-1,cur+1].forEach(j=>{if(j>=0&&j<N)new Image().src='pages/p'+pad(j)+'.webp'});
}
img.addEventListener('load',()=>{if(cur!==0)return;try{const c=document.createElement('canvas'),w=img.naturalWidth,h=img.naturalHeight;c.width=40;c.height=40;const x=c.getContext('2d');
  const avg=(sy,sh)=>{x.clearRect(0,0,40,40);x.drawImage(img,0,sy,w,sh,0,0,40,40);const d=x.getImageData(0,0,40,40).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];n++}return `rgb(${r/n|0},${g/n|0},${b/n|0})`};
  stage.style.setProperty('--cbg',`linear-gradient(${avg(0,h*.04)} 0%,${avg(0,h*.04)} 50%,${avg(h*.96,h*.04)} 50%,${avg(h*.96,h*.04)} 100%)`)}catch(e){}});
// zoom / tazeni / swipe
let sc=1,tx=0,ty=0,pts=new Map(),start=null,pinch0=null,tapT=0,tapX=0,tapY=0;
const L=()=>{const r=stage.getBoundingClientRect();return{r,SW:r.width,SH:r.height,W:sheet.offsetWidth,H:sheet.offsetHeight}};
function apply(){sheet.style.transform=`translate(${tx}px,${ty}px) scale(${sc})`}
function clamp(){const{SW,SH,W,H}=L(),sw=W*sc,sh=H*sc,ox=(SW-W)/2,oy=(SH-H)/2;
  tx=sw<=SW?(SW-sw)/2-ox:Math.min(-ox,Math.max(SW-sw-ox,tx));
  ty=sh<=SH?(SH-sh)/2-oy:Math.min(-oy,Math.max(SH-sh-oy,ty))}
function reset(){sc=1;tx=ty=0;apply()}
function zoomAt(ns,mx,my){const{SW,SH,W,H}=L(),ox=(SW-W)/2,oy=(SH-H)/2,lx=(mx-ox-tx)/sc,ly=(my-oy-ty)/sc;sc=ns;tx=mx-ox-lx*sc;ty=my-oy-ly*sc;clamp();apply()}
function zoomText(){ // prepnuti: cela strana <-> prizpusobeni textu
  if(sc>1.05){reset();return}
  const{SW,SH,W,H}=L(),land=SW>SH, ns=land?Math.min(4,SW/W*.98):1.6;
  sc=ns;const oy=(SH-H)/2;tx=0;ty=-oy;clamp();ty=Math.max(ty,-oy);ty=-oy;clamp();apply()}
stage.addEventListener('pointerdown',e=>{const r=stage.getBoundingClientRect();pts.set(e.pointerId,[e.clientX,e.clientY]);start={x:e.clientX,y:e.clientY,tx,ty};
  if(pts.size==2){const [a,b]=[...pts.values()];pinch0={d:Math.hypot(a[0]-b[0],a[1]-b[1]),sc}}});
stage.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pts.size==2&&pinch0){const [a,b]=[...pts.values()],r=stage.getBoundingClientRect();
    zoomAt(Math.max(1,Math.min(4,pinch0.sc*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch0.d)),(a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top)}
  else if(pts.size==1&&sc>1){tx=start.tx+e.clientX-start.x;ty=start.ty+e.clientY-start.y;clamp();apply()}});
stage.addEventListener('pointerup',e=>{const dx=e.clientX-start.x,dy=e.clientY-start.y;pts.delete(e.pointerId);if(pts.size<2)pinch0=null;
  if(sc<=1.02&&pts.size==0&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){show(cur+(dx<0?1:-1));return}
  if(pts.size==0&&Math.abs(dx)<10&&Math.abs(dy)<10){const t=Date.now();
    if(t-tapT<320&&Math.abs(e.clientX-tapX)<30&&Math.abs(e.clientY-tapY)<30){const r=stage.getBoundingClientRect();if(sc>1.05)reset();else zoomAt(2.2,e.clientX-r.left,e.clientY-r.top);tapT=0}
    else{tapT=t;tapX=e.clientX;tapY=e.clientY}}});
stage.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);pinch0=null});
$('btnHome').onclick=()=>show(0);
$('prev').onclick=()=>show(cur-1);$('next').onclick=()=>show(cur+1);
document.addEventListener('keydown',e=>{if(e.key=='ArrowRight')show(cur+1);if(e.key=='ArrowLeft')show(cur-1)});
$('btnZoom').onclick=zoomText;
$('btnFav').onclick=()=>{const it=itemAt(cur);if(!it)return;const i=favs.indexOf(it.p);
  if(i>=0){favs.splice(i,1);toast('Odebráno z oblíbených')}else{favs.push(it.p);toast('Uloženo ★ ('+favs.length+')')}saveFavs();tools()};
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
$('btnShare').onclick=async()=>{const it=itemAt(cur),url=location.href.split('#')[0]+'#'+(cur+1),title=it?it.t:'Kuchařka pro Nikču a Leu';
  try{if(navigator.share){await navigator.share({title,url});return}}catch(e){if(e&&e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(url);toast('Odkaz zkopírován')}catch(e){toast(url)}};
// displej pri vareni nezhasina
let wl=null;async function keepAwake(){try{if('wakeLock' in navigator&&!wl){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null})}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')keepAwake()});
document.addEventListener('pointerdown',keepAwake,{once:true});
// nabidka Recepty
const row=k=>`<div class="row"><a href="#${k[1]+1}" data-p="${k[1]}">${k[0]}<span>${(D.labels[k[1]]||'')}</span></a></div>`;
const sec=(t,k,cls='')=>`<section class="ch ${cls}"><button class="chh" aria-expanded="false"><span>${t}</span><small>${k.length}</small></button><div class="chl" hidden>`+k.map(row).join('')+`</div></section>`;
function buildMenu(){const fv=favs.map(p=>items.find(it=>it.p===p)).filter(Boolean).map(it=>[it.t,it.p]);
  const pk=(D.poklady||[]).map(p=>items.find(it=>it.p===p)).filter(Boolean).map(it=>[it.t,it.p]);
  mi.innerHTML=(fv.length?sec('★ Moje oblíbené',fv,'favs'):'')+(pk.length?sec('♥ Rodinné poklady',pk,'poklady'):'')+D.chapters.filter(c=>c.k.length).map(c=>sec(c.t,c.k)).join('')}
function favView(){const fv=favs.map(p=>items.find(it=>it.p===p)).filter(Boolean);
  mi.innerHTML='<h3 class="fh">★ Moje oblíbené</h3>'+(fv.length?fv.map(it=>`<div class="row"><a href="#${it.p+1}" data-p="${it.p}">${it.t}<span>${D.labels[it.p]||''}</span></a><button class="rm" data-p="${it.p}" aria-label="Odebrat">✕</button></div>`).join(''):'<p class="empty">Zatím tu nic není. U receptu klepni dole na ☆ Uložit.</p>')}
$('btnFavs').onclick=()=>{favView();menu.hidden=false};
mi.addEventListener('click',e=>{const r=e.target.closest('.rm');if(r){favs=favs.filter(p=>p!==+r.dataset.p);saveFavs();tools();favView();return}
const a=e.target.closest('a');if(a){e.preventDefault();menu.hidden=true;show(+a.dataset.p);return}
  const h=e.target.closest('.chh');if(!h)return;const open=h.getAttribute('aria-expanded')=='true';
  mi.querySelectorAll('.chh').forEach(x=>{x.setAttribute('aria-expanded','false');x.nextElementSibling.hidden=true});
  if(!open){h.setAttribute('aria-expanded','true');h.nextElementSibling.hidden=false;h.scrollIntoView({block:'nearest'})}});
$('btnMenu').onclick=()=>{buildMenu();menu.hidden=false};menu.addEventListener('click',e=>{if(e.target===menu)menu.hidden=true});
let s0=0;const h=parseInt(location.hash.slice(1));try{s0=h?h-1:(+localStorage.getItem('page')||0)}catch(e){s0=h?h-1:0}
show(s0);
if('serviceWorker' in navigator){const had=!!navigator.serviceWorker.controller;let rl=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!rl){rl=true;location.reload()}});navigator.serviceWorker.register('sw.js').then(r=>r.update&&r.update())}
})();
