/* Maison Aurelia – shared helpers: navigation, cart, occasion planner engine, AI concierge widget */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ADDR='Marine Hill Road, Port Blair, Andaman and Nicobar Islands'; // replace with your restaurant's address
let CFG={currency:'$',deposit:1000,tax:5,banks:[]},MENU=[];
const money=c=>CFG.currency+(c/100).toFixed(2),cents=m=>Math.round(m.p*100),taxOf=s=>Math.round(s*CFG.tax/100);
async function api(p,o){const r=await fetch(p,o&&{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)});let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw Object.assign(new Error(j.error||'Request failed'),{status:r.status});return j}
const Cart={
 get(){try{return JSON.parse(localStorage.getItem('ma_cart')||'{}')}catch(e){return{}}},
 save(c){try{localStorage.setItem('ma_cart',JSON.stringify(c))}catch(e){}document.dispatchEvent(new Event('cart'))},
 add(id,d=1){const c=this.get();c[id]=Math.max(0,(c[id]||0)+d);if(!c[id])delete c[id];this.save(c);if(d>0){const m=MENU.find(x=>x.id==id);if(m)toast('Added '+m.n)}},
 set(c){this.save(c)},clear(){this.save({})},
 count(){return Object.values(this.get()).reduce((a,b)=>a+b,0)},
 lines(){const c=this.get();return MENU.filter(m=>c[m.id]).map(m=>({...m,q:c[m.id]}))},
 sub(){return this.lines().reduce((a,m)=>a+cents(m)*m.q,0)}};
addEventListener('storage',e=>{if(e.key=='ma_cart')document.dispatchEvent(new Event('cart'))});
function toast(m){let t=$('#toast');if(!t){document.body.insertAdjacentHTML('beforeend','<div id="toast"></div>');t=$('#toast')}t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),1800)}
const ZONES={Window:'quiet sea-view side, ideal for couples',Garden:'lantern-lit and serene',Main:'lively central room',Terrace:'open-air with a sunset breeze',Private:'closed room for groups and business dinners'};
/* ---- occasions and the planner engine (also used by the concierge's offline mode) ---- */
const OCC={
 anniversary:{e:'💞',l:'Anniversary',tag:'romantic',zones:['Window','Terrace','Garden'],blurb:'An intimate evening for two with mild, aromatic dishes.',tips:['Mention the anniversary in your order notes so the team can plan the evening around it.','Choose a Window or Terrace table for the quietest corner.','Toast with the Vintage Champagne or Lavender Cloud.']},
 birthday:{e:'🎂',l:'Birthday',tag:'celebration',zones:['Garden','Main','Private'],blurb:'Festive dishes to share, with room for the whole group.',tips:['Note the birthday in your order so the team knows.','You may bring your own cake – ask the staff to plate it.','Share plates across the table so everyone tries everything.']},
 proposal:{e:'💍',l:'Proposal',tag:'romantic',zones:['Window','Terrace'],blurb:'A private, candlelit setting for a moment to remember.',tips:['Call or use the contact form beforehand so the team can help you plan the moment.','Arrive 30 minutes early to settle in.','Keep the menu light and mild so the evening stays unhurried.']},
 business:{e:'💼',l:'Business dinner',tag:'business',zones:['Private','Main'],blurb:'Quiet surroundings and lighter dishes that keep the conversation flowing.',tips:['The Private room keeps conversation confidential.','Order courses together so timing stays tight.','Tandoori and soups are quick to serve and easy to eat while talking.']},
 family:{e:'👨‍👩‍👧',l:'Family gathering',tag:'family',zones:['Main','Garden','Private'],blurb:'Generous shared dishes that suit every age.',tips:['Order a rice dish and a few curries to share.','Choose mild dishes for children and mention any allergies.','A table with spare seats gives children room.']},
 friends:{e:'🥂',l:'Friends get-together',tag:'celebration',zones:['Garden','Main','Terrace'],blurb:'A relaxed spread to share, mixing mild and spicy.',tips:['Share plates and order a round of signature drinks.','Mix one spicy and one mild dish for variety.','The Garden zone is lively but easy to talk in.']}};
function buildPlan(o){
 const oc=OCC[o.occasion]||OCC.friends,n=Math.max(1,o.guests||2),cap=(o.budget||45)*100,sp=o.spice||'medium',hot=m=>m.t.includes('spicy');
 let pool=MENU.filter(m=>!m.t.includes('drink'));
 if(o.diet=='veg')pool=pool.filter(m=>m.t.includes('veg'));if(o.diet=='noBeef')pool=pool.filter(m=>!m.t.includes('beef'));if(sp=='mild')pool=pool.filter(m=>!hot(m));
 const score=m=>(m.t.includes(oc.tag)?3:0)+(sp=='spicy'&&hot(m)?2:0)+(sp=='mild'&&m.t.includes('mild')?1:0);
 const mains=pool.filter(m=>!m.t.includes('soup')&&!m.t.includes('rice'));
 let cand=mains.filter(m=>cents(m)<=cap*.7);if(cand.length<2)cand=mains.slice().sort((a,b)=>a.p-b.p).slice(0,3);
 cand.sort((a,b)=>score(b)-score(a)||a.p-b.p);
 const picks=cand.slice(0,n>1?3:1),items={};
 if(picks.length)for(let i=0;i<n;i++){const m=picks[i%picks.length];items[m.id]=(items[m.id]||0)+1}
 const soup=pool.filter(m=>m.t.includes('soup')).sort((a,b)=>score(b)-score(a))[0];if(soup)items[soup.id]=Math.ceil(n/2);
 const rice=pool.find(m=>m.t.includes('rice'));if(rice&&n>=3)items[rice.id]=Math.ceil(n/3);
 if(o.drinks){const dr=MENU.filter(m=>m.t.includes('drink')&&(!o.alcoholFree||!m.t.includes('alcohol'))).sort((a,b)=>score(b)-score(a)||a.p-b.p)[0];if(dr)items[dr.id]=n}
 const lines=MENU.filter(m=>items[m.id]).map(m=>({...m,q:items[m.id]})),sub=lines.reduce((a,m)=>a+cents(m)*m.q,0);
 return{oc,items,lines,sub,tax:taxOf(sub),pp:Math.round(sub/n),over:sub/n>cap,n}}
async function tableFor(zones,n,c){const[ts,j]=await Promise.all([api('/api/tables'),api('/api/availability?date='+c.date+'&time='+encodeURIComponent(c.time))]);for(const z of zones){const t=ts.filter(t=>t.z==z&&!j.taken.includes(t.id)&&t.s>=n).sort((a,b)=>a.s-b.s)[0];if(t)return t}}
function goTable(id){window.onPickTable?onPickTable(id):location.href='index.html?table='+id+'#reserve'}
/* ---- page chrome ---- */
function chrome(active){document.documentElement.classList.add('js');
 const L=[['home','index.html','Home'],['menu','menu.html','Menu'],['plan','plan.html','Plan an occasion'],['res','index.html#reserve','Reserve'],['rev','index.html#reviews','Reviews'],['con','index.html#contact','Contact']];
 document.body.insertAdjacentHTML('afterbegin',`<nav id="nav"><a class="logo" href="index.html">Maison Aurelia</a><span class="sp"></span>${L.map(l=>`<a href="${l[1]}" class="${l[0]==active?'on':''}">${l[2]}</a>`).join('')}<a class="cartp" href="menu.html#order">🛒 <b id="cc">0</b></a></nav>`);
 document.body.insertAdjacentHTML('beforeend','<footer>© Maison Aurelia · Demo project: payments and billing are simulated, no real money is charged.</footer>');
 const f=()=>$('#nav').classList.toggle('sc',scrollY>30);addEventListener('scroll',f);f()}
const cartBadge=()=>{const e=$('#cc');if(e)e.textContent=Cart.count()};
function reveal(){const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1}):null;$$('.reveal').forEach(el=>io?io.observe(el):el.classList.add('in'))}
function dust(cv){const g=cv&&cv.getContext&&cv.getContext('2d');if(!g||(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches))return;let w,h;const P=[],rs=()=>{w=cv.width=cv.offsetWidth;h=cv.height=cv.offsetHeight};rs();addEventListener('resize',rs);
 for(let i=0;i<46;i++)P.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.8+.4,v:Math.random()*.25+.08,a:Math.random()*6});
 (function f(){g.clearRect(0,0,w,h);for(const p of P){p.y-=p.v;p.x+=Math.sin(p.a+=.01)*.2;if(p.y<-5){p.y=h+5;p.x=Math.random()*w}g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fillStyle=`rgba(212,175,106,${.2+.4*Math.sin(p.a*2)**2})`;g.fill()}requestAnimationFrame(f)})()}
async function boot(active){chrome(active);try{const r=await Promise.all([api('/api/config'),api('/api/menu')]);CFG=r[0];MENU=r[1]}catch(e){}cartBadge();document.addEventListener('cart',cartBadge);Bot.init();reveal()}
/* ---- AI concierge widget (live model through /api/chat, built-in rules when unavailable) ---- */
const Bot={hist:[],
 ctx(){if(window.botCtx)return botCtx();let s={};try{s=JSON.parse(localStorage.getItem('ma_slot')||'{}')}catch(e){}const t=new Date().toISOString().slice(0,10);return{date:s.date&&s.date>=t?s.date:t,time:s.time||'8:00 pm',guests:s.guests||2}},
 init(){document.body.insertAdjacentHTML('beforeend','<button class="btn" id="fab">✦ Ask the concierge</button><div class="card" id="bot"><div class="bh">Concierge<span id="bx">✕</span></div><div id="log"></div><div class="sug" id="sug"></div><div class="bi"><input id="bi" placeholder="Ask about dishes, tables, occasions…"><button class="btn" id="bs">Send</button></div></div>');
  $('#fab').onclick=$('#bx').onclick=()=>this.toggle();$('#bs').onclick=()=>this.ask();$('#bi').onkeydown=e=>{if(e.key=='Enter')this.ask()}},
 toggle(){const b=$('#bot');b.classList.toggle('on');if(b.classList.contains('on')&&!$('#log').children.length){this.say('Good evening! I’m your concierge. Ask me about any dish, tell me your plans (for example, “anniversary dinner for 2”) and I’ll suggest a table and dishes.','a');$('#sug').innerHTML=['Anniversary for 2','Something mild','Vegetarian options','Table with a view'].map(s=>`<button>${s}</button>`).join('');$$('#sug button').forEach(b=>b.onclick=()=>this.ask(b.textContent))}},
 open(){if(!$('#bot').classList.contains('on'))this.toggle()},
 say(h,c){$('#log').insertAdjacentHTML('beforeend',`<div class="m ${c}">${h}</div>`);$('#log').scrollTop=1e9},
 fmt(t){return esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>').replace(/\[\[table:(\w+)\]\]/g,(_,i)=>`<button class="btn" onclick="goTable('${i}')">Select ${i}</button>`).replace(/\[\[dish:(\d+)\]\]/g,(_,i)=>{const m=MENU.find(x=>x.id==i);return m?`<button class="btn o" onclick="Cart.add(${i},1)">+ ${esc(m.n)}</button>`:''})},
 async ask(v){v=(v||$('#bi').value).trim();if(!v)return;$('#bi').value='';this.open();this.say(esc(v),'u');let r;
  try{r=(await api('/api/chat',{message:v,history:this.hist.slice(-8),cart:Cart.get(),...this.ctx()})).reply}catch(e){r=await localReply(v)}
  this.hist.push({role:'user',content:v},{role:'assistant',content:r});this.say(this.fmt(r),'a')}};
async function localReply(q){
 const l=q.toLowerCase(),c=Bot.ctx(),n=+((l.match(/(\d+)\s*(people|guests|persons|pax|of us)/)||l.match(/for\s*(\d+)/)||[])[1])||c.guests;
 const list=a=>a.slice(0,8).map(m=>`• **${m.n}** (${money(cents(m))}) – ${m.d}`).join('\n'),btn=a=>a.slice(0,4).map(m=>`[[dish:${m.id}]]`).join('');
 const o=Object.keys(OCC).find(k=>l.includes(k))||(/couple|romantic|date night/.test(l)?'anniversary':/celebrat|party/.test(l)?'birthday':/client|meeting/.test(l)?'business':null);
 if(o){const p=buildPlan({occasion:o,guests:n,budget:45,drinks:true});let t;try{t=await tableFor(OCC[o].zones,n,c)}catch(e){}
  return `For your ${OCC[o].l.toLowerCase()} I’d suggest:\n${p.lines.map(m=>`• ${m.q} × **${m.n}** (${money(cents(m))})`).join('\n')}\nAbout ${money(p.sub)} before tax.`+(t?`\nBest free table: **${t.id}** (${t.z}, ${ZONES[t.z]}). [[table:${t.id}]]`:'')+'\n'+btn(p.lines)+'\nFor a full plan, open “Plan an occasion”.'}
 const dn=MENU.find(m=>l.includes(m.n.toLowerCase().replace(/ \(.*\)/,'')));
 const dish=m=>`**${m.n}** – ${money(cents(m))}\n${m.d}\n[[dish:${m.id}]]`;if(dn)return dish(dn);
 for(const[k,f,t]of[['spicy',m=>m.t.includes('spicy'),'Our spicy dishes'],['mild',m=>m.t.includes('mild')&&!m.t.includes('drink'),'Mild dishes'],['chicken',m=>m.t.includes('chicken'),'Chicken dishes'],['lamb',m=>m.t.includes('lamb'),'Lamb dishes'],['beef',m=>m.t.includes('beef'),'Beef dishes'],['veg',m=>m.t.includes('veg')&&!m.t.includes('soup'),'Vegetarian dishes'],['soup',m=>m.t.includes('soup'),'Soups'],['tandoor',m=>m.t.includes('tandoor'),'From the tandoor'],['mocktail',m=>m.t.includes('mocktail'),'Alcohol-free drinks'],['drink',m=>m.t.includes('drink'),'Signature drinks'],['cocktail',m=>m.t.includes('drink'),'Signature drinks']]){
  if(l.includes(k)){const a=MENU.filter(f);return `${t}:\n${list(a)}\n${btn(a)}`}}
 if(/view|ambien|quiet|sunset|scenic|atmosphere|table|seat/.test(l)){const zs=/sunset|open|air/.test(l)?['Terrace','Window']:/lively|buzz/.test(l)?['Main']:/group|private/.test(l)?['Private']:['Window','Terrace','Garden'];let t;try{t=await tableFor(zs,n,c)}catch(e){}
  return `Our zones: ${Object.entries(ZONES).map(([k,v])=>`**${k}** – ${v}`).join('; ')}.`+(t?`\nBest free table: **${t.id}** (${t.z}). [[table:${t.id}]]`:'')}
 const mn=MENU.filter(m=>!m.t.includes('drink')),pr=mn.map(m=>m.p);
 if(/price|cost|budget|cheap/.test(l))return `Dishes range from ${money(Math.min(...pr)*100)} to ${money(Math.max(...pr)*100)}. A ${money(CFG.deposit)} reservation fee secures your table and is credited to your bill.`;
 if(/allerg|gluten|nut|dairy/.test(l))return 'Dishes marked “Contains nuts” are labelled on the menu. Please add allergies to your order notes or use the contact form so the chef can adapt dishes.';
 const w=MENU.find(m=>m.n.toLowerCase().split(' ').some(x=>x.length>5&&!['chicken','vegetable','coconut'].includes(x)&&l.includes(x)));if(w)return dish(w);
 return 'I can describe any dish, suggest food for an occasion (anniversary, birthday, business, family), list mild, spicy or vegetarian dishes, or pick the best table for a view. What would you like?'}
