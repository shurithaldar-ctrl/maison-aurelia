let T=[],st={},sel=null;
const gs=()=>+$('#g').value,slot=()=>({date:$('#d').value,time:$('#tm').value,guests:gs()});
window.botCtx=slot;
function saveSlot(){try{localStorage.setItem('ma_slot',JSON.stringify(slot()))}catch(e){}}
function drawPlan(){
 $('#plan').innerHTML=['Window|2|1','Main|32|1','Garden|58|1','Terrace|58|93','Private|82|1'].map(z=>{const[a,l,tp]=z.split('|');return `<span class="zl" style="left:${l}%;top:${tp}%">${a}</span>`}).join('')+T.map(t=>{
  const f=st[t.id]=='f',ok=t.s>=gs();
  return `<button class="tb ${f?'free':'res'} ${sel==t.id?'sel':''} ${ok?'':'dim'}" style="left:${t.x}%;top:${t.y+4}%;width:${40+t.s*6}px;height:${40+t.s*6}px" ${f&&ok?'':'disabled'} onclick="pick('${t.id}')" title="${t.z} · ${t.s} seats">${t.id}<small>${t.s} seats</small></button>`}).join('');
 const fr=T.filter(t=>st[t.id]=='f');$('#cnt').textContent=`${fr.length} tables free · ${fr.reduce((a,t)=>a+t.s,0)} seats`}
function pick(id){if(st[id]!='f')return;const t=T.find(x=>x.id==id);if(t.s<gs()){toast(`Table ${id} seats up to ${t.s} – change the guest count first`);return}sel=id;drawPlan();sum()}
window.onPickTable=id=>{pick(id);$('#reserve').scrollIntoView({behavior:'smooth'})};
async function load(){try{const j=await api(`/api/availability?date=${$('#d').value}&time=${encodeURIComponent($('#tm').value)}`);T.forEach(t=>st[t.id]=j.taken.includes(t.id)?'r':'f');if(sel&&st[sel]=='r'){sel=null;sum()}drawPlan();$('#upd').textContent='Live · updated '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch(e){$('#upd').textContent='Offline'}}
function live(){const es=new EventSource('/api/stream');es.onopen=load;es.onmessage=e=>{const m=JSON.parse(e.data);if(m.type=='seats')load();if(m.type=='reviews')loadRv()};es.onerror=()=>{$('#upd').textContent='Reconnecting…'}}
function sum(){const L=Cart.lines(),sub=Cart.sub(),tax=taxOf(sub),t=T.find(x=>x.id==sel);
 $('#sumBox').innerHTML=`<h3>Your booking</h3><p class="mut" style="margin:4px 0 10px">${t?`Table ${t.id} · ${t.z} · seats ${t.s}`:'Tap a green table on the plan'} · ${gs()} guest(s)</p>`+(L.map(m=>`<div class="tot"><span>${m.q} × ${esc(m.n)}</span><span>${money(cents(m)*m.q)}</span></div>`).join('')||'<p class="mut sm">No pre-order yet.</p>')+`<p><a href="menu.html#order">${L.length?'Edit pre-order':'Add dishes to pre-order'} →</a></p>`+(L.length?`<div class="tot"><span>Subtotal</span><span>${money(sub)}</span></div><div class="tot"><span>Tax (${CFG.tax}%)</span><span>${money(tax)}</span></div>`:'')+`<div class="tot"><span>Reservation fee (credited to your bill)</span><span>${money(CFG.deposit)}</span></div><div class="tot b"><span>Pay now</span><span>${money(sub+tax+CFG.deposit)}</span></div>`}
async function proceed(){const e=m=>{$('#err').textContent=m};
 if(!sel)return e('Please choose a table on the seating plan.');
 const name=$('#nm').value.trim(),phone=$('#ph').value.trim();
 if(name.length<2||phone.replace(/\D/g,'').length<8)return e('Please enter your name and a valid phone number.');
 e('');$('#go').disabled=true;try{localStorage.setItem('ma_who',JSON.stringify({n:name,p:phone}))}catch(x){}
 try{const h=await api('/api/hold',{table_id:sel,...slot(),name,phone,items:Cart.get(),notes:localStorage.getItem('ma_notes')||''});localStorage.setItem('ma_pending',h.code);location.href='checkout.html?code='+h.code}
 catch(x){e(x.status==409?'Sorry, that table was just taken. Please pick another.':x.message);$('#go').disabled=false;load()}}
async function pending(){const c=localStorage.getItem('ma_pending');if(!c)return;try{const b=await api('/api/bill/'+c);if(b.status=='held'&&b.left>0)$('#pend').innerHTML=`<div class="banner"><span>You have table <b>${b.table_id}</b> on hold (${Math.ceil(b.left/60)} min left).</span><a class="btn sm" href="checkout.html?code=${c}">Continue to payment</a></div>`;else localStorage.removeItem('ma_pending')}catch(e){localStorage.removeItem('ma_pending')}}
/* reviews and contact */
let RV=[];
async function loadRv(){try{RV=await api('/api/reviews');rv()}catch(e){}}
function rv(){const a=k=>(RV.reduce((x,r)=>x+r[k],0)/RV.length).toFixed(1);$('#avg').textContent=RV.length?`Food ${a('f')}/5 · Experience ${a('e')}/5 · ${RV.length} reviews`:'No reviews yet.';
 $('#rvl').innerHTML=RV.map(r=>`<div class="rv"><b>${esc(r.n)}</b> <span class="st">Food ${'★'.repeat(r.f)} · Experience ${'★'.repeat(r.e)}</span><br><span class="mut">${esc(r.c)}</span></div>`).join('')}
async function addRv(){const c=$('#rc').value.trim();if(!c)return;try{await api('/api/reviews',{n:$('#rn').value.trim(),f:+$('#rf').value,e:+$('#re').value,c});$('#rc').value='';loadRv()}catch(x){toast(x.message)}}
function cont(){if(!$('#cem').value||!$('#cms').value.trim()){$('#cok').textContent='';return}$('#cok').textContent='Thank you, we’ll be in touch.';$('#cms').value=''}
boot('home').then(async()=>{
 const q=encodeURIComponent('Maison Aurelia, '+ADDR);$('#addr').textContent=ADDR;$('#addr2').textContent=ADDR;
 $('#mapA').href='https://www.google.com/maps/search/?api=1&query='+q;$('#dirA').href='https://www.google.com/maps/dir/?api=1&destination='+q;
 const today=new Date().toISOString().slice(0,10);let s={};try{s=JSON.parse(localStorage.getItem('ma_slot')||'{}')}catch(e){}
 $('#d').min=today;$('#d').value=s.date&&s.date>=today?s.date:today;if(s.time)$('#tm').value=s.time;
 $('#g').innerHTML=[1,2,3,4,5,6,7,8].map(n=>`<option ${n==(s.guests||2)?'selected':''}>${n}</option>`).join('');
 try{const w=JSON.parse(localStorage.getItem('ma_who')||'{}');$('#nm').value=w.n||'';$('#ph').value=w.p||''}catch(e){}
 $('#feat').innerHTML=[1,5,7,15,18,21,24,28].map(i=>MENU.find(m=>m.id==i)).filter(Boolean).map(m=>`<div class="card hv dish"><div><div class="mi"><b>${esc(m.n)}</b><span class="pr">${money(cents(m))}</span></div><p class="mut sm">${esc(m.d)}</p></div><p><button class="btn o sm" onclick="Cart.add(${m.id},1)">Add to order</button></p></div>`).join('');
 $('#occ').innerHTML=Object.entries(OCC).map(([k,o])=>`<a class="card hv occ" href="plan.html?occasion=${k}"><div class="big">${o.e}</div><h3>${o.l}</h3><p class="mut sm">${o.blurb}</p></a>`).join('');
 $('#g').onchange=()=>{saveSlot();drawPlan();sum()};$('#d').onchange=$('#tm').onchange=()=>{saveSlot();sel=null;load();sum()};
 $('#go').onclick=proceed;$('#rs').onclick=addRv;$('#cs').onclick=cont;document.addEventListener('cart',sum);
 T=await api('/api/tables');T.forEach(t=>st[t.id]='f');sum();await load();await loadRv();live();pending();
 const p=new URLSearchParams(location.search).get('table');if(p)setTimeout(()=>{pick(p);$('#reserve').scrollIntoView()},400);
 dust($('#dust'))});
