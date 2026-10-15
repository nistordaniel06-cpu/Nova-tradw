/* NOVA Trade presentation frontend: simulations only, NO live markets or real payments. */
(function(){
"use strict";
var E=window.NovaEngine, P=window.NovaProgress;
if(!P){document.body.textContent="Modul de progres nu s-a încărcat.";return;}
if(!E){document.body.textContent="Eroare: motorul demonstrativ lipsește.";return;}
var STORE="nova-trade-harvest-demo-v2";
var state=load(),tab="home",pair="BTC",frame=4,scenario="profit",margin="175",manualMargin="175",side="LONG",lever=2,filter="all",filterDate="",pending=false,busyStarted=0,toastText="",timer=null;
var $=function(id){return document.getElementById(id);};
var fmt=function(n){return Number(n||0).toLocaleString("ro-RO",{minimumFractionDigits:2,maximumFractionDigits:2});};
var sign=function(n){return (n>=0?"+":"")+fmt(n);};
var cssClass=function(n){return n>=0?"profit":"loss";};
var escapeHtml=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
function load(){try{var s=JSON.parse(localStorage.getItem(STORE));return E.validate(s)?s:E.startingState();}catch(e){return E.startingState();}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}}
function tick(){return Math.floor(Date.now()/4000);}
function price(asset){return E.priceAt(asset,tick());}
function metrics(){return E.metrics(state,price);}
function dateLabel(s){return new Date(s).toLocaleString("ro-RO",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function todayPnl(offset){var start=new Date();start.setHours(0,0,0,0);var a=start.getTime()-offset*86400000,b=a+86400000;return E.round(state.executions.filter(function(x){var t=new Date(x.closedAt).getTime();return t>=a&&t<b;}).reduce(function(s,x){return s+x.pnl;},0));}
function progressSvg(){var array=[],t=tick();for(var i=0;i<40;i++)array.push(priceAt("BTC",t-(39-i)*6));var lo=Math.min.apply(null,array),hi=Math.max.apply(null,array);var parts=array.map(function(v,i){return (i*420/39).toFixed(2)+","+(49-(v-lo)/Math.max(1,hi-lo)*38).toFixed(2);});
return '<svg class="spark" viewBox="0 0 420 58" preserveAspectRatio="none" role="img" aria-label="Grafic demonstrativ"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#28e9b8" stop-opacity=".24"/><stop offset="1" stop-color="#28e9b8" stop-opacity="0"/></linearGradient></defs><path d="M'+parts.join(" L")+' L420,58 L0,58 Z" fill="url(#sg)"/><path d="M'+parts.join(" L")+'" fill="none" stroke="#3af6cd" stroke-width="2.8"/></svg>';}
function priceAt(k,t){return E.priceAt(k,t);}
function candleSvg(){var arr=[],t=tick(),lo=Infinity,hi=-Infinity;
for(var i=37;i>=0;i--){var x=t-i*frame,o=priceAt(pair,x-frame),c=priceAt(pair,x),h=Math.max(o,c)*(1+Math.abs(Math.sin(x*.11))*.001+0.0006),l=Math.min(o,c)*(1-Math.abs(Math.cos(x*.13))*.001-0.0006);arr.push({o:o,c:c,h:h,l:l});lo=Math.min(lo,l);hi=Math.max(hi,h);}
var Y=function(v){return 206-(v-lo)/Math.max(1,hi-lo)*190;};
var out='<svg class="chart" viewBox="0 0 750 224" preserveAspectRatio="none" role="img" aria-label="Grafic cu lumânări și prețuri simulate">';
for(var j=0;j<5;j++)out+='<line x1="0" x2="750" y1="'+(16+j*48)+'" y2="'+(16+j*48)+'" stroke="#2b4658" stroke-opacity=".6"/>';
arr.forEach(function(z,i){var x=11+i*19.5,color=z.c>=z.o?"#03dca4":"#ff5c70",top=Math.min(Y(z.c),Y(z.o)),height=Math.max(2,Math.abs(Y(z.c)-Y(z.o)));out+='<line x1="'+x+'" x2="'+x+'" y1="'+Y(z.h)+'" y2="'+Y(z.l)+'" stroke="'+color+'" stroke-width="2"/><rect x="'+(x-5)+'" y="'+top+'" width="10" height="'+height+'" fill="'+color+'" rx="1"/>';});
return out+'</svg>';}

function levelStatus(){return P.evaluate(state,metrics().equity);}
function syncLevel(){
  var old=state.progress&&Number.isInteger(state.progress.highestLevel)?state.progress.highestLevel:0;
  var status=levelStatus();save();
  return status.level>old?status.tier.label:"";
}
function isPro(){var x=levelStatus();return x.canPro&&x.mode==="PRO";}
function modeSwitcher(){
  var p=levelStatus();
  return '<div class="mode-toolbar"><div class="mode-pills"><button class="mode-button '+(!isPro()?"chosen":"")+'" data-action="mode" data-value="EASY">✦ NOVA Easy</button><button class="mode-button '+(isPro()?"chosen pro-selected":"")+'" data-action="mode" data-value="PRO">'+(p.canPro?"◈":"🔒")+' NOVA Pro</button></div><button class="mode-level" data-action="nav" data-value="levels">Nivel '+(p.level+1)+'/4 ▸</button></div>';
}
function levelCard(){
  var a=levelStatus(),next=a.next;
  var moneyPercent=next?Math.max(0,Math.min(100,100*(a.peakEquity-5000)/Math.max(1,next.minEquity-5000))):100;
  var tradePercent=next?Math.max(0,Math.min(100,100*a.trades/Math.max(1,next.minTrades))):100;
  return '<section class="panel level-card"><div class="sec-head"><span class="sec-title">Progres NOVA</span><button class="subtle-btn" data-action="nav" data-value="levels">Detalii ›</button></div>'+
    '<div class="level-current"><span class="level-crown">◈</span><div><div class="level-title">'+a.tier.label+'</div><div class="level-sub">'+a.tier.benefit+'</div></div><strong class="level-xp">'+a.xp+' XP</strong></div>'+
    (next?'<p class="level-next">Următorul nivel: <b>'+next.label+'</b></p>'+
      '<div class="level-progress-label"><span>Capital virtual maxim atins</span><b>'+fmt(a.peakEquity)+' / '+fmt(next.minEquity)+' USDT</b></div><div class="level-progress"><span style="width:'+moneyPercent+'%"></span></div>'+
      '<div class="level-progress-label"><span>Tranzacții finalizate</span><b>'+a.trades+' / '+next.minTrades+'</b></div><div class="level-progress"><span style="width:'+tradePercent+'%"></span></div>'+
      '<div class="level-todo">'+(a.missingEquity?'Mai ai de atins '+fmt(a.missingEquity)+' USDT virtuali. ':'Pragul de capital este atins. ')+(a.missingTrades?'Mai ai '+a.missingTrades+' tranzacții.':'Numărul de tranzacții este atins.')+'</div>':
      '<p class="level-next">Toate nivelurile demo au fost deblocate.</p>')+
    '<div class="level-foot">Fără depuneri reale • Fără venituri din recrutări • Progresul este doar educațional</div></section>';
}
function proGate(){
  var z=levelStatus();
  return '<section class="panel"><div class="sec-head"><span class="sec-title">NOVA Pro '+(z.canPro?'disponibil':'blocat')+'</span><span class="demo-badge">DEMO</span></div>'+
    '<p class="info-copy">'+(z.canPro?'Ai deblocat NOVA Pro. Activează-l pentru tranzacții manuale Long/Short și unelte avansate.':'Modul Pro se deblochează progresiv printr-un prag de capital virtual și tranzacții încheiate. Nicio depunere și nicio recrutare nu este necesară.')+'</p>'+
    '<button class="primary" data-action="'+(z.canPro?'mode':'nav')+'" data-value="'+(z.canPro?'PRO':'levels')+'">'+(z.canPro?'Activează NOVA Pro':'Vezi condițiile de deblocare')+' →</button></section>';
}
function levelPage(){
  var st=levelStatus(),tiers=P.tiers;
  var cards=tiers.map(function(t,i){
    var unlocked=i<=st.level;
    return '<div class="level-step '+(unlocked?'unlocked':'locked')+'"><span class="level-step-num">'+(unlocked?'✓':i+1)+'</span><div class="level-step-main"><strong>'+t.label+'</strong><p>'+t.benefit+'</p><small>Capital virtual atins: '+(i===0?'Start':fmt(t.minEquity)+' USDT')+' • '+t.minTrades+' tranzacții închise</small></div><span class="level-step-state">'+(unlocked?'Deblocat':'Blocat')+'</span></div>';
  }).join('');
  return layout(levelCard()+'<section class="panel"><div class="sec-title">Scara de progres</div><p class="info-copy">Fiecare etapă se deschide prin evoluția portofoliului demonstrativ și experiență. Nivelurile nu se pierd dacă ulterior ai o tranzacție cu pierdere.</p>'+cards+'</section>',
  '<section class="panel"><div class="sec-title">Alege interfața</div><div class="level-mode-compare"><div><b>Easy</b><p>Harvest la un click, sold, istoric și explicații simple.</p></div><div><b>Pro</b><p>Grafice detaliate, Long / Short manual, levier și analiză PnL.</p></div></div><button class="primary" data-action="mode" data-value="'+(st.canPro?'PRO':'EASY')+'">'+(st.canPro?'Treci la NOVA Pro':'Continuă în NOVA Easy')+'</button></section>'+
  '<section class="panel"><div class="sec-title">Comunitate, nu piramidă financiară</div><p class="info-copy">Un eventual program de recomandări poate recompensa doar promovarea unor abonamente educaționale efectiv vândute, transparent și fără obligație de recrutare. Nu distribuim depuneri către nivelurile superioare și nu promitem câștiguri.</p></section>');
}

function topbar(){return '<header class="header"><div class="brand"><div class="logo">N</div><div><div class="brand-name">NOVA <i>Trade</i></div><div class="brand-sub">Platformă de prezentare</div></div></div><div class="header-right"><span class="demo-badge">● DEMO</span><button class="small-ghost" data-action="guide">Ghid ?</button></div></header><div class="disclaimer">ⓘ <b>SIMULARE</b> — sume și tranzacții exclusiv virtuale. Rezultatele sunt fictive, nu randamente reale.</div>'+modeSwitcher();}
function wallet(){var m=metrics(),d=E.round(m.equity-E.DEFAULT_BALANCE);return '<section class="panel hero"><div class="label">Active totale • USDT virtuali</div><div class="big-balance">'+fmt(m.equity)+' <small style="font:600 12px DM Sans;color:#bed7f2">USDT</small></div><div style="font-size:12px;font-weight:800" class="'+cssClass(d)+'">'+sign(d)+' USDT <span style="color:#b9d5ef;font-weight:500">față de soldul inițial</span></div>'+progressSvg()+'<div class="hero-metrics"><div><div class="metric-label">Disponibil</div><div class="metric-value">'+fmt(m.available)+'</div></div><div><div class="metric-label">Marjă blocată</div><div class="metric-value">'+fmt(m.frozen)+'</div></div><div><div class="metric-label">PnL deschis</div><div class="metric-value '+cssClass(m.pnl)+'">'+sign(m.pnl)+'</div></div></div></section>';}
function harvest(){var pct=pending?Math.min(99,100*(Date.now()-busyStarted)/2100):0;
return '<section class="panel harvest"><div class="harvest-head"><div><h2 class="harvest-heading">Harvest • One Click</h2><div class="harvest-sub">Cumpărare → vânzare în circa 2 secunde</div></div><span class="harvest-icon">↗</span></div><div style="margin-top:16px"><label class="form-label" for="harvest-amount" style="color:#bbf1dc">Sumă pentru operațiune (USDT demo)</label><input id="harvest-amount" class="field" type="number" min="1" max="10000" step="1" inputmode="decimal" value="'+escapeHtml(margin)+'" '+(pending?"disabled":"")+'></div><div class="demo-select"><button data-action="scenario" data-value="profit" class="scenario '+(scenario==="profit"?"active":"")+'" '+(pending?"disabled":"")+'>↗ Exemplu profit</button><button data-action="scenario" data-value="loss" class="scenario loss-scenario '+(scenario==="loss"?"active":"")+'" '+(pending?"disabled":"")+'>↘ Exemplu pierdere</button></div><button class="harvest-btn" data-action="harvest" '+(pending?"disabled":"")+'>'+(pending?"◌ Se execută simularea…":"✦ Începe Harvest DEMO")+'</button><div class="progress-shell"><div class="progress-value" id="harvest-progress" style="width:'+pct+'%"></div></div><div class="harvest-status" id="harvest-status">'+(pending?"1/2: Cumpărare virtuală înregistrată…":"Pregătit: BTC/USDT • LONG • scenariu demonstrativ")+'</div><div class="harvest-hint">Scenariile sunt <b>prestabilite exclusiv pentru prezentare</b>. Un exemplu de profit nu garantează niciun câștig real.</div></section>';}
function stats(){var m=metrics(),items=[["⌁","Rezultat azi",sign(todayPnl(0))+" USDT",cssClass(todayPnl(0))],["◧","Marjă blocată",fmt(m.frozen)+" USDT",""],["✓","Tranzacții finalizate",state.executions.length,""],["◉","Sold disponibil",fmt(m.available)+" USDT",""],["◷","Rezultat ieri",sign(todayPnl(1))+" USDT",cssClass(todayPnl(1))],["⇄","Poziții active",state.positions.length,""]];
return '<section class="panel"><div class="sec-head"><span class="sec-title">Rezumat cont</span><span class="sec-caption">Virtual</span></div><div class="gridstats">'+items.map(function(it){return '<div class="statbox"><span class="staticon">'+it[0]+'</span><span class="statlabel">'+it[1]+'</span><strong class="statvalue '+it[3]+'">'+it[2]+'</strong></div>';}).join("")+'</div></section>';}
function coin(a){return '<div class="coin coin-'+a+'">'+E.ASSETS[a].symbol+'</div>';}
function markets(){var html='<section class="panel"><div class="sec-head"><span class="sec-title">Piețe simulate</span><span class="sec-caption">Prețuri fictive</span></div>';
["BTC","ETH","SOL"].forEach(function(a){var p=price(a),old=priceAt(a,tick()-48),change=(p/old-1)*100;html+='<div class="market-item">'+coin(a)+'<div><div class="market-symbol">'+a+'/USDT</div><div class="market-name">'+E.ASSETS[a].name+'</div></div><div class="market-price">'+fmt(p)+'<small class="'+cssClass(change)+'">'+sign(change)+'%</small></div><button class="subtle-btn" data-action="pair" data-value="'+a+'">Trade</button></div>';});return html+'</section>';}
function chart(){var p=price(pair),old=priceAt(pair,tick()-40),pct=(p/old-1)*100;
return '<section class="panel"><div class="sec-head"><span class="sec-title">Grafic • '+pair+'/USDT</span><span class="sec-caption">Date sintetice</span></div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><strong style="font:700 25px Space Grotesk">'+fmt(p)+'</strong><span style="font-size:12px;margin-left:7px" class="'+cssClass(pct)+'">'+sign(pct)+'%</span></div><button class="subtle-btn" data-action="nav" data-value="trade">Long / Short →</button></div>'+candleSvg()+'<div class="tabs">'+[[1,"1m"],[2,"5m"],[4,"15m"],[8,"1h"],[16,"4h"],[25,"1z"]].map(function(a){return '<button class="tab '+(frame===a[0]?"selected":"")+'" data-action="frame" data-value="'+a[0]+'">'+a[1]+'</button>';}).join("")+'</div></section>';}
function positions(){if(!state.positions.length)return '<div class="empty"><b>Nu ai poziții deschise</b>Încearcă modul Trading manual sau un Harvest demonstrativ.</div>';
return '<div class="positions">'+state.positions.map(function(p){var pl=E.round(E.unrealized(p,price(p.asset)));return '<div class="position"><div class="position-head"><div><span class="position-symbol">'+p.asset+'/USDT</span> <span class="mini-tag '+(p.side==="LONG"?"long":"short")+'">'+p.side+' '+p.leverage+'x</span></div><button class="subtle-btn" data-action="close" data-value="'+p.id+'">Închide</button></div><div class="position-grid"><div class="position-stat"><small>Intrare</small><strong>'+fmt(p.entry)+'</strong></div><div class="position-stat"><small>Curent</small><strong>'+fmt(price(p.asset))+'</strong></div><div class="position-stat"><small>PnL demo</small><strong class="'+cssClass(pl)+'">'+sign(pl)+'</strong></div></div></div>';}).join("")+'</div>';}
function positionPanel(){return '<section class="panel"><div class="sec-head"><span class="sec-title">Poziții deschise ('+state.positions.length+')</span><button class="subtle-btn" data-action="nav" data-value="positions">Vezi toate</button></div>'+positions()+'</section>';}
function records(limit){var entries=state.ledger.filter(function(row){return (filter==="all"||row.type===filter)&&(!filterDate||row.at.slice(0,10)===filterDate);}).slice(0,limit);
if(!entries.length)return '<div class="empty"><b>Nu există înregistrări</b>Un click pe Harvest creează cumpărare, vânzare și rezultat demonstrativ.</div>';
return entries.map(function(x){var op=x.type==="open",dir=x.side==="LONG"?(op?"Cumpărare LONG":"Vânzare LONG"):(op?"Deschidere SHORT":"Acoperire SHORT");
return '<div class="history-row"><div class="hist-icon">'+(op?"↘":"↗")+'</div><div><div class="hist-name">'+dir+' <span class="muted">· '+x.asset+'</span></div><div class="hist-sub">'+dateLabel(x.at)+' · Preț '+fmt(x.price)+'</div><div class="hist-sub">Sold după: '+fmt(x.balance)+' USDT</div></div><div class="hist-value '+(op?"loss":"profit")+'">'+(op?"−":"+")+fmt(x.amount)+'<small>USDT noționali</small>'+(op?'<small>Taxă '+fmt(x.fee)+'</small>':'<small class="'+cssClass(x.pnl)+'">PnL net '+sign(x.pnl)+'</small>')+'</div></div>';}).join("");}
function history(full){return '<section class="panel"><div class="sec-head"><span class="sec-title">Account Details • Istoric</span>'+(full?'<span class="sec-caption">'+state.ledger.length+' înregistrări</span>':'<button class="subtle-btn" data-action="nav" data-value="history">Vezi toate →</button>')+'</div>'+(full?'<div class="tabs" style="margin-bottom:13px">'+[["all","Toate"],["open","Deschideri"],["close","Închideri"]].map(function(x){return '<button class="tab '+(filter===x[0]?"selected":"")+'" data-action="filter" data-value="'+x[0]+'">'+x[1]+'</button>';}).join("")+'</div><label class="form-label" for="filter-date">Data</label><input class="date-filter" id="filter-date" type="date" value="'+escapeHtml(filterDate)+'" />':"")+records(full?150:5)+'</section>';}
function form(){return '<section class="panel"><div class="sec-head"><span class="sec-title">Trading manual</span><span class="demo-badge">● SIMULAT</span></div><label class="form-label">Pereche</label><div class="tabs">'+["BTC","ETH","SOL"].map(function(x){return '<button class="tab '+(pair===x?"selected":"")+'" data-action="asset" data-value="'+x+'">'+x+'/USDT</button>';}).join("")+'</div><div class="form-group"><div class="side-buttons"><button class="side-btn long '+(side==="LONG"?"active":"")+'" data-action="side" data-value="LONG">↗ Long<small>Cumpărare virtuală</small></button><button class="side-btn short '+(side==="SHORT"?"active":"")+'" data-action="side" data-value="SHORT">↘ Short<small>Vânzare virtuală</small></button></div></div><div class="form-group"><label class="form-label" for="manual-amount">Marjă demo (USDT)</label><input id="manual-amount" class="field" type="number" min="1" step="1" inputmode="decimal" value="'+escapeHtml(manualMargin)+'"></div><div class="form-group"><label class="form-label">Levier</label><div class="tabs">'+[1,2,3,5,10].map(function(x){return '<button class="tab '+(lever===x?"selected":"")+'" data-action="lever" data-value="'+x+'">'+x+'x</button>';}).join("")+'</div></div><div style="margin-top:14px"><div class="order-row"><span class="muted">Preț simulat</span><strong>'+fmt(price(pair))+'</strong></div><div class="order-row"><span class="muted">Valoare noțională</span><strong id="notional">'+fmt((Number(manualMargin)||0)*lever)+' USDT</strong></div><div class="order-row"><span class="muted">Comision deschidere</span><strong id="orderfee">'+fmt(E.round((Number(manualMargin)||0)*lever*E.FEE_RATE))+' USDT</strong></div><div class="order-row"><span class="muted">Disponibil virtual</span><strong>'+fmt(metrics().available)+' USDT</strong></div></div><button class="primary" style="margin-top:16px" data-action="manual">Deschide '+side+' DEMO</button><p class="info-copy">Pozițiile manuale rămân deschise până apeși Închide. Nu sunt ordine pe piețe financiare.</p></section>';}
function profile(){var m=metrics(),wins=state.executions.filter(function(x){return x.pnl>0;}).length;
return '<div class="page"><div class="column"><section class="panel"><div class="sec-head"><span class="sec-title">Profil demonstrativ</span><span class="demo-badge">VIRTUAL</span></div><div class="order-row"><span>Capital inițial</span><strong>5.000,00 USDT</strong></div><div class="order-row"><span>Capital virtual actual</span><strong>'+fmt(m.equity)+' USDT</strong></div><div class="order-row"><span>Tranzacții închise</span><strong>'+state.executions.length+'</strong></div><div class="order-row"><span>Închideri profitabile</span><strong>'+wins+'</strong></div><div class="order-row"><span>Rezultat net demo</span><strong class="'+cssClass(m.equity-5000)+'">'+sign(m.equity-5000)+' USDT</strong></div><button data-action="reset" class="subtle-btn" style="width:100%;margin-top:17px;padding:13px">↺ Resetează contul virtual</button></section><section class="panel"><div class="sec-title">Cum prezint aplicația?</div><ol class="guide-steps"><li><span class="stepnum">1</span>Alege un scenariu de profit sau pierdere demonstrativă.</li><li><span class="stepnum">2</span>Apasă Harvest și arată animația de circa 2 secunde.</li><li><span class="stepnum">3</span>Prezintă soldul și cele două rânduri din Istoric.</li><li><span class="stepnum">4</span>Explică apoi modul Long / Short manual.</li></ol><button class="primary" data-action="nav" data-value="harvest">Deschide Harvest →</button></section></div><div class="column"><section class="panel"><div class="sec-title">Transparență</div><p class="info-copy">Aplicația este un <b>simulator educațional cu bani virtuali</b>. Butonul Harvest rulează exemple preconfigurate și nu efectuează tranzacții reale.</p><p class="info-copy">Nu există depuneri, retrageri, exchange-uri, bani investiți, randamente promise ori recomandări financiare. Cotațiile sunt generate matematic și nu reprezintă prețuri de piață.</p><p class="info-copy">Tranzacționarea reală, în special cu levier, presupune riscuri de pierdere semnificativă.</p></section>'+history(false)+'</div></div>';}
function layout(a,b){return '<div class="page"><div class="column">'+a+'</div><div class="column">'+b+'</div></div>';}
function main(){
switch(tab){
case "home":
  return isPro()
    ? layout(wallet()+chart()+positionPanel(),form()+levelCard()+history(false))
    : layout(wallet()+harvest()+levelCard()+stats()+history(false),markets()+positionPanel()+proGate());
case "harvest":return layout(wallet()+harvest()+stats(),levelCard()+history(false)+positionPanel());
case "markets":return layout(chart()+markets(),(isPro()?form():proGate())+levelCard()+positionPanel());
case "trade":return isPro()?layout(chart()+positionPanel(),form()):layout(chart()+markets(),proGate()+levelCard());
case "positions":return layout(wallet()+positionPanel(),(isPro()?form():proGate())+levelCard());
case "history":return layout(wallet()+history(true),levelCard()+stats());
case "levels":return levelPage();
case "profile":return profile();
default:return layout(wallet()+harvest(),levelCard()+history(false));
}}
function nav(){var items=[["home","⌂","Acasă"],["markets","▥","Piețe"],["harvest","✦","Harvest"],["history","≡","Istoric"],["levels","◇","Nivel"],["profile","♙","Profil"]];return '<nav class="nav" aria-label="Meniu principal">'+items.map(function(x){return '<button class="navbtn '+(tab===x[0]||(tab==="trade"&&x[0]==="markets")?"selected":"")+'" data-action="nav" data-value="'+x[0]+'"><span class="ico">'+x[1]+'</span>'+x[2]+'</button>';}).join("")+'</nav>';}
function render(){var t=toastText?'<div class="toast" role="status">'+escapeHtml(toastText)+'</div>':"";$("app").innerHTML='<main class="layout">'+topbar()+main()+'</main>'+nav()+t;}
function notify(txt){toastText=txt;render();clearTimeout(timer);timer=setTimeout(function(){toastText="";var t=document.querySelector(".toast");if(t)t.remove();},5000);}
function go(t){tab=t;render();window.scrollTo(0,0);}
function startHarvest(){if(pending)return;var m=Number(margin),fee=E.round(m*E.FEE_RATE);
if(!Number.isFinite(m)||m<1||m>10000)return notify("Introdu o sumă de 1–10.000 USDT virtuali.");
if(m+fee>state.cash)return notify("Sold virtual insuficient.");
var open;try{open=E.open(state,{asset:"BTC",side:"LONG",margin:m,leverage:1,entry:price("BTC"),automated:true});}catch(e){return notify(e.message);}
state=open.state;save();pending=true;busyStarted=Date.now();render();
var id=open.position.id,mode=scenario;
var indicator=setInterval(function(){var elapsed=Date.now()-busyStarted,b=$("harvest-progress"),st=$("harvest-status");if(b)b.style.width=Math.min(100,elapsed/2000*100)+"%";if(st && elapsed>950)st.textContent="2/2: Vânzare virtuală și calculul rezultatului…";if(elapsed>=2000)clearInterval(indicator);},70);
setTimeout(function(){clearInterval(indicator);try{var position=state.positions.find(function(x){return x.id===id;});if(position){var result=E.close(state,id,E.harvestExit(position,mode),"harvest");state=result.state;var newRank=syncLevel();pending=false;notify((newRank?"Nivel nou: "+newRank+". ":"")+(mode==="profit"?"Exemplu de profit: ":"Exemplu de pierdere: ")+sign(result.execution.pnl)+" USDT virtuali. Vezi Istoric.");}else{pending=false;notify("Operațiunea demo nu a fost găsită.");}}catch(e){pending=false;notify("Eroare demo: "+e.message);}},2050);}
function openManual(){if(pending)return;if(!isPro())return notify("Deblochează și activează NOVA Pro pentru Long / Short manual.");try{var opened=E.open(state,{asset:pair,side:side,margin:Number(manualMargin),leverage:lever,entry:price(pair),automated:false});state=opened.state;save();tab="positions";notify("Poziția "+side+" demo este deschisă.");}catch(e){notify(e.message);}}
function closeManual(id){if(pending)return;var x=state.positions.find(function(p){return p.id===id;});if(!x)return notify("Poziția nu există.");if(!window.confirm("Închizi poziția virtuală "+x.asset+" "+x.side+"?"))return;try{var r=E.close(state,id,price(x.asset),"manual");state=r.state;var newRank=syncLevel();notify((newRank?"Nivel nou: "+newRank+". ":"")+"Închidere virtuală, PnL net: "+sign(r.execution.pnl)+" USDT.");}catch(e){notify(e.message);}}
document.addEventListener("click",function(event){var el=event.target.closest("[data-action]");if(!el)return;var a=el.dataset.action,v=el.dataset.value;
if(a==="nav")go(v);else if(a==="mode"){try{var status=P.setMode(state,v,metrics().equity);save();go("home");notify("Modul NOVA "+status.mode+" a fost activat.");}catch(e){go("levels");notify(e.message);}}else if(a==="scenario"&&!pending){scenario=v;render();}
else if(a==="harvest")startHarvest();
else if(a==="pair"){pair=v;go("trade");}
else if(a==="asset"){pair=v;render();}
else if(a==="frame"){frame=Number(v);render();}
else if(a==="side"){side=v;render();}
else if(a==="lever"){lever=Number(v);render();}
else if(a==="manual")openManual();
else if(a==="close")closeManual(v);
else if(a==="filter"){filter=v;render();}
else if(a==="reset"){if(pending)return notify("Așteaptă finalizarea Harvest.");if(window.confirm("Resetezi soldul virtual la 5.000 USDT și ștergi istoricul demo?")){state=E.startingState();syncLevel();tab="home";notify("Contul demonstrativ a fost resetat.");}}
else if(a==="guide")window.alert("Ghid demo:\n1. Alege Exemplu profit sau Exemplu pierdere (fictive).\n2. Apasă Harvest. Așteaptă 2 secunde.\n3. Arată soldul nou și perechea cumpărare/vânzare din Istoric.\n4. Testează Long/Short manual.\n\nAtenție: Nu există fonduri sau tranzacții reale.");});
document.addEventListener("input",function(event){if(event.target.id==="harvest-amount")margin=event.target.value;else if(event.target.id==="manual-amount"){manualMargin=event.target.value;var n=$("notional"),f=$("orderfee"),amount=Number(manualMargin)||0;if(n)n.textContent=fmt(amount*lever)+" USDT";if(f)f.textContent=fmt(E.round(amount*lever*E.FEE_RATE))+" USDT";}});
document.addEventListener("change",function(event){if(event.target.id==="filter-date"){filterDate=event.target.value;render();}});
setInterval(function(){if(document.hidden||pending)return;var focused=document.activeElement;if(focused && ["INPUT","SELECT","TEXTAREA"].includes(focused.tagName))return;
for(var i=state.positions.length-1;i>=0;i--){var po=state.positions[i];if(E.unrealized(po,price(po.asset))<=-po.margin){try{state=E.close(state,po.id,price(po.asset),"liquidation").state;save();}catch(e){}}}render();},4000);
syncLevel();render();
})();