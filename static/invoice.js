boot('').then(async()=>{const code=new URLSearchParams(location.search).get('code'),box=$('#inv');let b;
 try{b=await api('/api/bill/'+code)}catch(e){box.innerHTML='<p>Invoice not found.</p><a href="index.html">Back to home</a>';return}
 if(b.status!='paid'){box.innerHTML=`<p>This bill has not been paid yet.</p><a href="checkout.html?code=${esc(code)}">Go to payment</a>`;return}
 const M=c=>b.currency+(c/100).toFixed(2),rsv=b.kind=='reservation';
 box.innerHTML=`<div class="ih"><div><h2>Maison Aurelia</h2><div class="sm">${esc(ADDR)}</div></div><div style="text-align:right"><b>TAX INVOICE / RECEIPT</b><br>No: ${b.code}<br>${new Date(b.paid_at*1000).toLocaleString()}</div></div>
 <span class="stamp">PAID · SIMULATED PAYMENT</span>
 <div class="two"><div><b>Billed to</b><br>${esc(b.name)}<br>${esc(b.phone)}</div><div><b>${rsv?'Reservation':'Pickup order'}</b><br>${rsv?`Table ${b.table_id} (${b.zone})<br>${b.date} at ${b.time}<br>${b.guests} guest(s)`:`Pickup: ${esc(b.time)}<br>${b.date}`}</div></div>
 ${b.notes?`<p class="sm"><b>Notes:</b> ${esc(b.notes)}</p>`:''}
 <table><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr>${b.lines.map(l=>`<tr><td>${esc(l.n)}</td><td class="r">${l.q}</td><td class="r">${M(l.p)}</td><td class="r">${M(l.p*l.q)}</td></tr>`).join('')||'<tr><td colspan="4">No pre-ordered dishes</td></tr>'}</table>
 <div class="itot"><div><span>Subtotal</span><span>${M(b.subtotal)}</span></div><div><span>Tax (${b.tax_percent}%)</span><span>${M(b.tax)}</span></div>${b.fee?`<div><span>Reservation fee</span><span>${M(b.fee)}</span></div>`:''}<div class="t"><span>Total paid</span><span>${M(b.amount)}</span></div></div>
 <p class="sm" style="margin-top:16px"><b>Payment:</b> ${({card:'Credit card',upi:'UPI',netbanking:'Net banking'})[b.method]||b.method} · ${esc(b.detail||'')}<br><b>Transaction ID:</b> ${b.txn}</p>
 ${rsv?'<p class="sm">Your reservation fee is credited against your final bill at the restaurant.</p>':''}
 <p class="sm" style="color:#6b7280">This is a simulated receipt generated for a demonstration project. No real payment was made.</p>
 <p class="noprint"><button class="btn" onclick="print()">Print / Save as PDF</button> <a class="btn o" style="color:#8a6a2a" href="index.html">Back to home</a> <a class="btn o" style="color:#8a6a2a" href="menu.html">Order more</a></p>`});
