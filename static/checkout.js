const code=new URLSearchParams(location.search).get('code');let B=null,method='netbanking',bank='',left=0,tm=null;
const METHODS={netbanking:'Net banking',upi:'UPI',card:'Credit card'};
const luhn=n=>{let s=0;[...n].reverse().forEach((c,i)=>{let d=+c;if(i%2){d*=2;if(d>9)d-=9}s+=d});return s%10==0};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function showModal(h){$('#mbox').innerHTML=h;$('#modal').classList.add('on')}function hideModal(){$('#modal').classList.remove('on')}
function summary(){const t=B.kind=='reservation'?`Table ${B.table_id} · ${B.zone}<br>${B.date} at ${B.time} · ${B.guests} guest(s)`:`Pickup order · ${esc(B.time)}`;
 $('#summary').innerHTML=`<h3>${B.kind=='reservation'?'Reservation':'Order'} ${B.code}</h3><p class="mut sm">${esc(B.name)} · ${t}</p>`+(B.lines.map(l=>`<div class="tot"><span>${l.q} × ${esc(l.n)}</span><span>${money(l.p*l.q)}</span></div>`).join('')||'<p class="mut sm">No pre-ordered dishes.</p>')+(B.lines.length?`<div class="tot"><span>Subtotal</span><span>${money(B.subtotal)}</span></div><div class="tot"><span>Tax (${B.tax_percent}%)</span><span>${money(B.tax)}</span></div>`:'')+(B.fee?`<div class="tot"><span>Reservation fee</span><span>${money(B.fee)}</span></div>`:'')+`<div class="tot b"><span>Total</span><span>${money(B.amount)}</span></div>`+(B.kind=='reservation'?'<p class="sm mut" id="timer"></p>':'')+'<p><a class="sm" href="#" id="cx">Cancel and go back</a></p>';
 $('#cx').onclick=async e=>{e.preventDefault();try{await api('/api/cancel',{code})}catch(x){}localStorage.removeItem('ma_pending');location.href=B.kind=='reservation'?'index.html#reserve':'menu.html'}}
function tick(){if(B.kind!='reservation')return;const e=$('#timer');if(left<=0){e.innerHTML='<b class="er">Your table hold has expired.</b> <a href="index.html#reserve">Reserve again</a>';$('#paybtn').disabled=true;clearInterval(tm);return}
 e.textContent=`Table held for ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;left--}
function tabs(){$('#pm').innerHTML=Object.entries(METHODS).map(([k,v])=>`<button class="${k==method?'on':''}" data-k="${k}">${v}</button>`).join('');$$('#pm button').forEach(b=>b.onclick=()=>{method=b.dataset.k;$('#cerr').textContent='';tabs();pane()})}
function pane(){
 if(method=='netbanking')$('#pane').innerHTML=`<p class="mut sm">Select your bank. You’ll be taken to a simulated bank login.</p><div class="banks">${CFG.banks.map(b=>`<button class="bank ${b==bank?'on':''}">🏦 ${b}</button>`).join('')}</div>`;
 if(method=='upi')$('#pane').innerHTML=`<label>UPI ID</label><input id="up" placeholder="name@okaxis" autocomplete="off"><div class="chips">${['@okaxis','@oksbi','@paytm','@ybl'].map(s=>`<button class="chip" style="background:none;cursor:pointer">${s}</button>`).join('')}</div><p class="mut sm">A payment request will be sent to your UPI app (simulated).</p>`;
 if(method=='card')$('#pane').innerHTML=`<label>Card number</label><input id="cn" inputmode="numeric" placeholder="4111 1111 1111 1111" autocomplete="off"><div class="row" style="margin-top:10px"><div><label>Name on card</label><input id="cnm"></div><div><label>Expiry (MM/YY)</label><input id="ex" maxlength="5" placeholder="MM/YY"></div><div><label>CVV</label><input id="cv" type="password" maxlength="4" inputmode="numeric"></div></div>`;
 $$('.bank').forEach(b=>b.onclick=()=>{bank=b.textContent.replace('🏦 ','');pane()});
 $$('#pane .chip').forEach(c=>c.onclick=()=>{const u=$('#up');u.value=u.value.split('@')[0]+c.textContent;u.focus()});
 const cn=$('#cn');if(cn)cn.oninput=e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
 const ex=$('#ex');if(ex)ex.oninput=e=>{const v=e.target.value.replace(/\D/g,'').slice(0,4);e.target.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v}}
function go(){const e=m=>{$('#cerr').textContent=m};e('');
 if(method=='card'){const n=$('#cn').value.replace(/\D/g,''),ex=$('#ex').value,cv=$('#cv').value,nm=$('#cnm').value.trim();
  if(n.length<13||!luhn(n))return e('Please enter a valid card number.');if(!/^(0[1-9]|1[0-2])\/\d\d$/.test(ex))return e('Expiry must be in MM/YY format.');if(!/^\d{3,4}$/.test(cv))return e('Please enter the CVV.');if(nm.length<2)return e('Please enter the name on the card.');
  otp('Your card issuer',o=>run({method:'card',number:n,expiry:ex,cvv:cv,name:nm,otp:o}))}
 else if(method=='upi'){const u=$('#up').value.trim();if(!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(u))return e('Please enter a valid UPI ID, for example name@okaxis.');
  showModal(`<h3>UPI payment request</h3><p>Maison Aurelia requests <b>${money(B.amount)}</b> from <b>${esc(u)}</b>.</p><p class="hint">This simulates the approval screen in your UPI app.</p><button id="ua">Approve</button><button class="g" id="ud">Decline</button>`);
  $('#ua').onclick=()=>run({method:'upi',upi:u,approved:true});$('#ud').onclick=()=>fail('Payment was declined in the UPI app (simulated).')}
 else{if(!bank)return e('Please select your bank.');bankFlow()}}
function otp(who,cb){showModal(`<h3>Verify payment</h3><p>${who} sent a one-time password to your registered mobile number (simulated).</p><p class="hint">Demo OTP: <b>123456</b></p><input id="otp" maxlength="6" inputmode="numeric" placeholder="Enter OTP"><p class="er" id="oe"></p><button id="ov">Verify &amp; pay</button><button class="g" id="oc">Cancel</button>`);
 $('#ov').onclick=()=>{const v=$('#otp').value.trim();if(v.length<4){$('#oe').textContent='Please enter the OTP.';return}cb(v)};$('#oc').onclick=hideModal}
async function bankFlow(){showModal(`<div class="spin"></div><p>Redirecting to ${esc(bank)} secure login…</p>`);await sleep(1300);
 showModal(`<div class="bkh">${esc(bank)}</div><h3>Net banking login (simulated)</h3><input id="bu" placeholder="User ID"><input id="bp" type="password" placeholder="Password"><input id="bo" maxlength="6" placeholder="OTP (demo: 123456)"><p class="er" id="be"></p><button id="bl">Login &amp; authorise ${money(B.amount)}</button><button class="g" id="bc">Cancel</button>`);
 $('#bl').onclick=()=>{if(!$('#bu').value.trim()||!$('#bp').value||$('#bo').value.trim().length<4){$('#be').textContent='Please fill in all fields.';return}run({method:'netbanking',bank,otp:$('#bo').value.trim(),approved:true})};
 $('#bc').onclick=()=>fail('Payment was cancelled at the bank (simulated).')}
function fail(m){showModal(`<div class="cross">✕</div><h3>Payment failed</h3><p>${esc(m)}</p><button id="fx">Try again</button>`);$('#fx').onclick=hideModal}
async function run(d){showModal('<div class="spin"></div><h3>Processing payment…</h3><p>Please do not close this window.</p>');await sleep(1800);
 try{await api('/api/pay',{code,...d});Cart.clear();localStorage.removeItem('ma_pending');localStorage.removeItem('ma_notes');
  showModal('<svg class="tick" viewBox="0 0 52 52"><circle cx="26" cy="26" r="25"/><path d="M14 27l8 8 16-17"/></svg><h3>Payment successful</h3><p>Generating your invoice…</p>');await sleep(1600);location.href='invoice.html?code='+code}
 catch(x){fail(x.message)}}
boot('').then(async()=>{
 if(!code){$('#summary').textContent='No payment session found.';$('#paybtn').disabled=true;return}
 try{B=await api('/api/bill/'+code)}catch(e){$('#summary').textContent='This payment session was not found.';$('#paybtn').disabled=true;return}
 if(B.status=='paid'){location.href='invoice.html?code='+code;return}
 if(!['held','pending'].includes(B.status)||(B.kind=='reservation'&&B.left<=0)){$('#summary').innerHTML='<h3>Session expired</h3><p class="mut">This payment session has expired.</p><a class="btn" href="index.html#reserve">Start again</a>';$('#paybtn').disabled=true;return}
 left=B.left;summary();tabs();pane();$('#paybtn').textContent='Pay '+money(B.amount);$('#paybtn').onclick=go;
 if(B.kind=='reservation'){tick();tm=setInterval(tick,1000)}});
