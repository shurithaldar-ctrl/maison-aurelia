let occ='anniversary',P=null,TB=null;
function slot(){return{date:$('#d').value,time:$('#tm').value,guests:+$('#g').value}}
window.botCtx=slot;
function saveSlot(){try{localStorage.setItem('ma_slot',JSON.stringify(slot()))}catch(e){}}
function drawOcc(){$('#oc').innerHTML=Object.entries(OCC).map(([k,o])=>`<button class="${k==occ?'on':''}" data-k="${k}">${o.e} ${o.l}</button>`).join('');$$('#oc button').forEach(b=>b.onclick=()=>{occ=b.dataset.k;drawOcc()})}
async function recommend(){
 const c=slot(),n=c.guests;
 P=buildPlan({occasion:occ,guests:n,budget:+$('#bu').value,diet:$('#di').value,spice:$('#sp').value,drinks:$('#dr').checked,alcoholFree:$('#af').checked});TB=null;
 try{TB=await tableFor(P.oc.zones,n,c)}catch(e){}
 const o=P.oc;
 $('#res').innerHTML=`<div class="card ok"><h3>${o.e} ${o.l} for ${n} guest${n>1?'s':''}</h3><p class="mut">${o.blurb}</p>
 <h4>Recommended table</h4>${TB?`<p>Table <b>${TB.id}</b> in the <b>${TB.z}</b> zone (${ZONES[TB.z]}), seats ${TB.s}. Free on ${c.date} at ${c.time}.</p>`:'<p class="mut">No matching table is free for that date and time. Try another time or a different date.</p>'}
 <h4>Suggested menu</h4>${P.lines.length?P.lines.map(m=>`<div class="tot"><span>${m.q} × ${esc(m.n)}</span><span>${money(cents(m)*m.q)}</span></div>`).join('')+`<div class="tot"><span>Subtotal</span><span>${money(P.sub)}</span></div><div class="tot"><span>Tax (${CFG.tax}%)</span><span>${money(P.tax)}</span></div><div class="tot b"><span>About ${money(P.pp)} per person</span><span>${money(P.sub+P.tax)}</span></div>${P.over?'<p class="er">This is slightly above your budget. You can remove dishes on the menu page.</p>':''}`:'<p class="mut">No dishes match these preferences. Try relaxing the spice or food filters.</p>'}
 <h4>Ambience &amp; planning tips</h4><ul class="mut">${o.tips.map(t=>`<li>${t}</li>`).join('')}</ul>
 <p><button class="btn" id="a1" ${P.lines.length?'':'disabled'}>Add to my order &amp; edit</button> ${TB?'<button class="btn o" id="a2">Reserve this table</button>':''} <button class="btn o" id="a3">Ask the concierge</button></p></div>`;
 const a1=$('#a1'),a2=$('#a2');
 a1.onclick=()=>{Cart.set(P.items);saveSlot();location.href='menu.html#order'};
 if(a2)a2.onclick=()=>{Cart.set(P.items);saveSlot();location.href='index.html?table='+TB.id+'#reserve'};
 $('#a3').onclick=()=>{Bot.ask(`Plan a ${o.l.toLowerCase()} dinner for ${n} guests. Suggest dishes and a table.`)};
 $('#res').scrollIntoView({behavior:'smooth',block:'nearest'})}
boot('plan').then(()=>{
 const today=new Date().toISOString().slice(0,10);let s={};try{s=JSON.parse(localStorage.getItem('ma_slot')||'{}')}catch(e){}
 $('#d').min=today;$('#d').value=s.date&&s.date>=today?s.date:today;if(s.time)$('#tm').value=s.time;
 $('#g').innerHTML=[1,2,3,4,5,6,7,8].map(n=>`<option ${n==(s.guests||2)?'selected':''}>${n}</option>`).join('');
 $('#bu').innerHTML=[20,30,45,70].map(b=>`<option value="${b}" ${b==30?'selected':''}>Up to ${CFG.currency}${b}</option>`).join('');
 const p=new URLSearchParams(location.search).get('occasion');if(OCC[p])occ=p;drawOcc();$('#go').onclick=recommend;if(p)recommend()});
