/* NOVA Trade: Kraken market references, virtual-only paper trading. No deposits or investments. */
(function(){
"use strict";
var E=window.NovaEngine, P=window.NovaProgress, C=window.NovaCommunity, M=window.NovaMarket;
if(!M){document.body.textContent="Nu pot porni fluxul de cotații pentru Paper Trading.";return;}
if(!C){document.body.textContent="Modul comunitate și Battle Pass nu s-a încărcat.";return;}
if(!P){document.body.textContent="Modul de progres nu s-a încărcat.";return;}
if(!E){document.body.textContent="Eroare: motorul demonstrativ lipsește.";return;}
var STORE="nova-trade-harvest-demo-v2";
var state=load(),tab="home",pair="BTC",frame=1,margin="175",manualMargin="175",side="LONG",lever=2,filter="all",filterDate="",pending=false,busyStarted=0,toastText="",timer=null;
var $=function(id){return document.getElementById(id);};
var fmt=function(n){return Number(n||0).toLocaleString("ro-RO",{minimumFractionDigits:2,maximumFractionDigits:2});};
var sign=function(n){return (n>=0?"+":"")+fmt(n);};
var cssClass=function(n){return n>=0?"profit":"loss";};
var escapeHtml=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
function load(){try{var s=JSON.parse(localStorage.getItem(STORE));return E.validate(s)?s:E.startingState();}catch(e){return E.startingState();}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}}
function tick(){return Math.floor(Date.now()/4000);}
function price(asset){var x=M.last(asset);if(x)return x.last;
  var open=state.positions.find(function(p){return p.asset===asset;});
  return open?open.entry:E.ASSETS[asset].base;
}
function tradingQuote(asset){var x=M.quote(asset);if(!x)throw Error("Cotația live "+asset+"/USD nu este disponibilă sau este veche. Așteaptă reconectarea la Kraken.");return x;}
function marketBanner(){var q=M.quote("BTC");
  return '<div class="market-feed-banner '+(q?"is-live":"is-offline")+'">'+
   (q?'● KRAKEN SPOT LIVE • BTC/USD '+fmt(q.last)+' • spread '+fmt(q.spread)+' USD':
       '◌ KRAKEN SPOT • Se așteaptă o cotație validă. Ordinele DEMO sunt blocate momentan.')+
   '<small>Cotații de referință în USD • Capital virtual în unități USDT demonstrative • Fără depuneri</small></div>';
}
function metrics(){return E.metrics(state,price);}
function dateLabel(s){return new Date(s).toLocaleString("ro-RO",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function todayPnl(offset){var start=new Date();start.setHours(0,0,0,0);var a=start.getTime()-offset*86400000,b=a+86400000;return E.round(state.executions.filter(function(x){var t=new Date(x.closedAt).getTime();return t>=a&&t<b;}).reduce(function(s,x){return s+x.pnl;},0));}
function progressSvg(){
 var bars=M.bars("BTC").slice(-40);
 if(bars.length<2)return '<div class="empty" style="margin:13px 0">Se încarcă istoricul real al prețurilor BTC/USD…</div>';
 var values=bars.map(function(b){return b.close;});
 var lo=Math.min.apply(null,values),hi=Math.max.apply(null,values),delta=Math.max(1,hi-lo);
 var pts=values.map(function(v,i){return (i*420/Math.max(1,values.length-1)).toFixed(2)+","+(49-(v-lo)/delta*38).toFixed(2);});
 return '<svg class="spark" viewBox="0 0 420 58" preserveAspectRatio="none" role="img" aria-label="Grafic real de cotații Kraken BTC/USD"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#28e9b8" stop-opacity=".24"/><stop offset="1" stop-color="#28e9b8" stop-opacity="0"/></linearGradient></defs><path d="M'+pts.join(" L")+' L420,58 L0,58 Z" fill="url(#sg)"/><path d="M'+pts.join(" L")+'" fill="none" stroke="#3af6cd" stroke-width="2.8"/></svg>';
}
function candleSvg(){
 var raw=M.bars(pair);if(raw.length<2)return '<div class="empty" style="margin-top:13px">Graficul OHLC Kraken se încarcă. Nu afișăm prețuri inventate.</div>';
 var step=Math.max(1,frame),arr=[];
 for(var i=0;i<raw.length;i+=step){var items=raw.slice(i,i+step);if(!items.length)continue;
  arr.push({o:items[0].open,c:items[items.length-1].close,
    h:Math.max.apply(null,items.map(function(x){return x.high;})),
    l:Math.min.apply(null,items.map(function(x){return x.low;}))});
 }
 arr=arr.slice(-38);
 var lo=Math.min.apply(null,arr.map(function(x){return x.l;})),
     hi=Math.max.apply(null,arr.map(function(x){return x.h;}));
 var Y=function(v){return 206-(v-lo)/Math.max(1,hi-lo)*190;};
 var width=750/arr.length;
 var out='<svg class="chart" viewBox="0 0 750 224" preserveAspectRatio="none" role="img" aria-label="Lumânări reale Kraken Spot, interval agregat">';
 for(var j=0;j<5;j++)out+='<line x1="0" x2="750" y1="'+(16+j*48)+'" y2="'+(16+j*48)+'" stroke="#2b4658" stroke-opacity=".6"/>';
 arr.forEach(function(z,i){var x=(i+.5)*width,col=z.c>=z.o?"#03dca4":"#ff5c70",top=Math.min(Y(z.c),Y(z.o)),h=Math.max(2,Math.abs(Y(z.c)-Y(z.o)));
  out+='<line x1="'+x+'" x2="'+x+'" y1="'+Y(z.h)+'" y2="'+Y(z.l)+'" stroke="'+col+'" stroke-width="2"/>'+
     '<rect x="'+(x-Math.min(5,width*.28))+'" y="'+top+'" width="'+Math.min(10,width*.56)+'" height="'+h+'" fill="'+col+'" rx="1"/>';
 });
 return out+'</svg>';
}
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
  '<section class="panel"><div class="sec-title">Alege interfața</div><div class="level-mode-compare"><div><b>Easy</b><p>Harvest la un click, sold, istoric și explicații simple.</p></div><div><b>Pro</b><p>Grafice Kraken, Long / Short manual, levier și analiză PnL virtual.</p></div></div><button class="primary" data-action="mode" data-value="'+(st.canPro?'PRO':'EASY')+'">'+(st.canPro?'Treci la NOVA Pro':'Continuă în NOVA Easy')+'</button></section>'+
  '<section class="panel"><div class="sec-title">Comunitate, nu piramidă financiară</div><p class="info-copy">Un eventual program de recomandări poate recompensa doar promovarea unor abonamente educaționale efectiv vândute, transparent și fără obligație de recrutare. Nu distribuim depuneri către nivelurile superioare și nu promitem câștiguri.</p></section>');
}


function seedInvite(){if(window.crypto&&window.crypto.getRandomValues){var arr=new Uint8Array(5);window.crypto.getRandomValues(arr);return Array.from(arr).map(function(v){return v.toString(16).padStart(2,"0");}).join("").toUpperCase();}return Math.random().toString(36).slice(2,10).toUpperCase();}
C.ensure(state,Date.now(),seedInvite());save();
var inviteFromLink = new URLSearchParams(window.location.search).get("ref");
if(inviteFromLink && !/^NOVA-[A-Z0-9]{1,8}$/.test(inviteFromLink)) inviteFromLink=null;
function daily(){return C.progress(state,Date.now());}
function recordVirtualOpening(){return C.recordOpen(state,Date.now());}
function recordVirtualClosing(){return C.recordClose(state,Date.now());}
function quotaSummary(){var x=daily();return '<div class="daily-band"><div><strong>Tranzacții demo azi: '+x.used+' / '+x.quota+'</strong><small>'+x.remaining+' disponibile • capacitate 20→100, nu o obligație zilnică</small></div><button data-action="nav" data-value="battlepass">Battle Pass ›</button></div>';}
function battlePass(){
 var v=daily(),levels=C.PASS_LEVELS,position=levels[v.level-1],next=v.next;
 var progress=next?Math.min(100,Math.round((v.xp-position.xp)/(next.xp-position.xp)*100)):100;
 var tiles=levels.map(function(t,i){return '<div class="pass-level '+(i<v.level?"active":"locked")+'"><span class="pass-num">'+(i<v.level?"✓":i+1)+'</span><strong>'+t.title+'</strong><small>'+t.quota+' tranzacții/zi</small><small>'+t.xp+' XP</small></div>';}).join("");
 return '<section class="panel pass-panel"><div class="sec-head"><span class="sec-title">NOVA Battle Pass · Sezon demonstrativ</span><span class="demo-badge">VIRTUAL</span></div>'+
  '<div class="pass-hero"><div><span class="muted">Nivel '+v.level+' din 5</span><h2>'+position.title+'</h2><p>Insignă: '+v.badge+'</p></div><div class="pass-big">✦ '+v.xp+' XP</div></div>'+
  '<div class="pass-track"><div style="width:'+progress+'%"></div></div><div class="pass-meta"><span>'+v.quota+' tranzacții demo / zi disponibile</span><span>'+(next?next.xp+' XP pentru '+next.title:"Nivel maxim deblocat")+'</span></div>'+
  '<p class="info-copy">Nu trebuie să faci 20 de tranzacții pe zi. XP se acordă pentru primele 5 închideri demo dintr-o zi (maxim 75 XP) și pentru răspunsuri corecte la lecții. Invitațiile nu dau automat XP până la verificarea server-side.</p>'+
  '<div class="pass-levels">'+tiles+'</div>'+quotaSummary()+'</section>';
}
function lessons(){
 var x=daily(),done=x.lessonsDone;
 return '<section class="panel"><div class="sec-head"><span class="sec-title">Misiuni educaționale</span><span class="sec-caption">+30 XP / lecție corectă</span></div>'+
 C.LESSONS.map(function(l){
 var completed=done.indexOf(l.id)!==-1;
 return '<div class="lesson"><div class="lesson-top"><div><strong>'+l.title+'</strong><small>'+(completed?"Finalizată • +30 XP":"Răspunde corect pentru a debloca XP")+'</small></div><span class="mini-tag '+(completed?"long":"")+'">'+(completed?"✓ Completată":"30 XP")+'</span></div>'+
 (completed?"":'<div class="lesson-question">'+l.question+'</div><div class="lesson-options">'+l.choices.map(function(choice,i){return '<button class="lesson-answer" data-action="lesson" data-value="'+l.id+":"+i+'">'+(i+1)+'. '+choice+'</button>';}).join("")+'</div>')+'</div>';
 }).join("")+'</section>';
}
function referralInvitation(){
 if(!inviteFromLink||inviteFromLink===daily().inviteCode||daily().invitedBy===inviteFromLink)return "";
 return '<div class="invite-banner"><strong>Invitație de echipă (DEMO)</strong><p>Ai deschis un link cu codul <b>'+escapeHtml(inviteFromLink)+'</b>. Îl poți salva local; invitatorul nu primește încă membri verificați sau bonusuri.</p><button data-action="accept-invite">Acceptă invitația demo</button><button data-action="dismiss-invite">Ignoră</button></div>';
}
function teamPage(){
 var v=daily(),base=window.location.origin+window.location.pathname,link=base+"?ref="+encodeURIComponent(v.inviteCode);
 return layout(referralInvitation()+'<section class="panel"><div class="sec-head"><span class="sec-title">Echipa mea</span><span class="demo-badge">DEMO</span></div>'+
 '<label class="form-label" for="team-name">Numele echipei</label><input maxlength="32" id="team-name" class="field" value="'+escapeHtml(v.teamName)+'">'+
 '<button class="subtle-btn" data-action="rename-team" style="margin-top:9px">Salvează numele</button>'+
 '<div class="team-code"><small>Codul tău de invitație demonstrativ</small><strong>'+v.inviteCode+'</strong></div>'+
 '<label class="form-label" for="invite-link">Link de invitație</label><input readonly id="invite-link" class="field" value="'+escapeHtml(link)+'">'+
 '<button class="primary" style="margin-top:10px" data-action="copy-ref">Copiază linkul</button>'+
 '<div class="team-tree"><div class="team-node"><b>◈ Eu</b><span>'+escapeHtml(v.teamName)+'</span></div><div class="team-node secondary-node"><b>↳ Invitat de</b><span>'+escapeHtml(v.invitedBy||"Nimeni")+'</span></div><div class="team-node secondary-node"><b>↳ Membrii mei</b><span>0 confirmați — necesită conturi și backend</span></div></div></section>',
 '<section class="panel"><div class="sec-title">Cum ar funcționa comunitatea?</div>'+
 '<ol class="guide-steps"><li><span class="stepnum">1</span>Fiecare utilizator își creează cont și primește un cod unic din server.</li>'+
 '<li><span class="stepnum">2</span>Poate invita alți utilizatori, care aleg dacă se alătură echipei.</li>'+
 '<li><span class="stepnum">3</span>Arborele echipei și activitatea educațională devin vizibile numai după verificarea conturilor.</li>'+
 '<li><span class="stepnum">4</span>Insignele comunității sunt non-financiare și nu se plătesc din investiții sau din recrutarea în lanț.</li></ol>'+
 '<p class="info-copy">Acest MVP stochează doar invitația primită în propriul browser. Nu confirmă înscrierea, nu actualizează echipele altor persoane și nu verifică identități.</p></section>');
}
function passPage(){return layout(battlePass()+lessons(),levelCard()+'<section class="panel"><div class="sec-title">Reguli Battle Pass</div><p class="info-copy">Nivelurile de învățare Easy/Pro și permisul de simulări zilnice sunt separate: 20, 40, 60, 80, până la maximum 100 operațiuni zilnice. Până la un backend real, limitele sunt doar locale și se pot manipula.</p><button class="primary" data-action="nav" data-value="team">Vezi echipa și invitațiile →</button></section>');}

function topbar(){return '<header class="header"><div class="brand"><div class="logo">N</div><div><div class="brand-name">NOVA <i>Trade</i></div><div class="brand-sub">Platformă de prezentare</div></div></div><div class="header-right"><span class="demo-badge">● DEMO</span><button class="small-ghost" data-action="guide">Ghid ?</button></div></header><div class="disclaimer">ⓘ <b>SIMULARE</b> — sume și tranzacții exclusiv virtuale. Rezultatele sunt fictive, nu randamente reale.</div>'+marketBanner()+modeSwitcher()+referralInvitation();}
function wallet(){var m=metrics(),d=E.round(m.equity-E.DEFAULT_BALANCE);return '<section class="panel hero"><div class="label">Active totale • USDT virtuali</div><div class="big-balance">'+fmt(m.equity)+' <small style="font:600 12px DM Sans;color:#bed7f2">USDT</small></div><div style="font-size:12px;font-weight:800" class="'+cssClass(d)+'">'+sign(d)+' USDT <span style="color:#b9d5ef;font-weight:500">față de soldul inițial</span></div>'+progressSvg()+'<div class="hero-metrics"><div><div class="metric-label">Disponibil</div><div class="metric-value">'+fmt(m.available)+'</div></div><div><div class="metric-label">Marjă blocată</div><div class="metric-value">'+fmt(m.frozen)+'</div></div><div><div class="metric-label">PnL deschis</div><div class="metric-value '+cssClass(m.pnl)+'">'+sign(m.pnl)+'</div></div></div></section>';}
function harvest(){
 var pct=pending?Math.min(99,100*(Date.now()-busyStarted)/2100):0,
 q=M.quote("BTC"),mayRun=!pending&&!!q&&C.canTrade(state,Date.now());
 return '<section class="panel harvest"><div class="harvest-head"><div><h2 class="harvest-heading">Harvest • Paper Trading</h2><div class="harvest-sub">Cumpărare virtuală la ask → vânzare la bid în ~2 secunde</div></div><span class="harvest-icon">↗</span></div>'+
 '<div style="margin-top:16px"><label class="form-label" for="harvest-amount" style="color:#bbf1dc">Marjă virtuală pentru ordin • USDT demo</label><input id="harvest-amount" class="field" type="number" min="1" max="10000" step="1" inputmode="decimal" value="'+escapeHtml(margin)+'" '+(pending?"disabled":"")+'></div>'+
 '<div class="quote-mini"><span>Kraken BTC/USD • intrare ask <b>'+(q?fmt(q.ask):"Indisponibil")+'</b></span><span>Ieșire bid <b>'+(q?fmt(q.bid):"Indisponibil")+'</b></span></div>'+
 '<button class="harvest-btn" data-action="harvest" '+(mayRun?"":"disabled")+ '>'+(pending?"◌ Tranzacție demonstrativă în desfășurare…":"✦ Începe Harvest · PAPER")+'</button>'+
 '<div class="progress-shell"><div class="progress-value" id="harvest-progress" style="width:'+pct+'%"></div></div>'+
 '<div class="harvest-status" id="harvest-status">'+(pending?"1/2: ordin virtual deschis…":q?"Cotație disponibilă • profitul sau pierderea nu sunt prestabilite":"Aștept prețuri reale de la Kraken")+'</div>'+
 '<div class="harvest-hint">Rezultatul se bazează pe <b>cotația Kraken</b> și comisioane demo de 0,05% pe sens. În doar 2 secunde, spread-ul și taxele pot provoca pierderi chiar dacă piața nu se mișcă. Nu sunt tranzacții reale.</div>'+
 quotaSummary()+'</section>';
}
function stats(){var m=metrics(),items=[["⌁","Rezultat azi",sign(todayPnl(0))+" USDT",cssClass(todayPnl(0))],["◧","Marjă blocată",fmt(m.frozen)+" USDT",""],["✓","Tranzacții finalizate",state.executions.length,""],["◉","Sold disponibil",fmt(m.available)+" USDT",""],["◷","Rezultat ieri",sign(todayPnl(1))+" USDT",cssClass(todayPnl(1))],["⇄","Poziții active",state.positions.length,""]];
return '<section class="panel"><div class="sec-head"><span class="sec-title">Rezumat cont</span><span class="sec-caption">Virtual</span></div><div class="gridstats">'+items.map(function(it){return '<div class="statbox"><span class="staticon">'+it[0]+'</span><span class="statlabel">'+it[1]+'</span><strong class="statvalue '+it[3]+'">'+it[2]+'</strong></div>';}).join("")+'</div></section>';}
function coin(a){return '<div class="coin coin-'+a+'">'+E.ASSETS[a].symbol+'</div>';}
function markets(){
 var html='<section class="panel"><div class="sec-head"><span class="sec-title">Piață crypto • Spot</span><span class="sec-caption">Kraken USD · read-only</span></div>';
 ["BTC","ETH","SOL"].forEach(function(a){var q=M.quote(a),open=q?q.sessionOpen:0,change=q&&open>0?(q.last/open-1)*100:null;
  html+='<div class="market-item">'+coin(a)+'<div><div class="market-symbol">'+a+'/USD</div><div class="market-name">'+E.ASSETS[a].name+(q?' • Kraken':' • cotație indisponibilă')+'</div></div>'+
   '<div class="market-price">'+(q?fmt(q.last):"—")+'<small class="'+(change===null?"muted":cssClass(change))+'">'+(change===null?"Fără date":sign(change)+'% de la deschiderea zilei')+'</small></div>'+
   '<button class="subtle-btn" data-action="pair" data-value="'+a+'">Trade</button></div>';
 });
 return html+'</section>';
}
function chart(){
 var q=M.quote(pair),change=q&&q.sessionOpen>0?(q.last/q.sessionOpen-1)*100:null;
 return '<section class="panel"><div class="sec-head"><span class="sec-title">Grafic • '+pair+'/USD</span><span class="sec-caption">Kraken Spot · lumânări reale</span></div>'+
 '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><strong style="font:700 25px Space Grotesk">'+(q?fmt(q.last):"—")+'</strong>'+
 (change===null?'<span class="muted" style="font-size:11px;margin-left:7px">Se încarcă</span>':'<span style="font-size:12px;margin-left:7px" class="'+cssClass(change)+'">'+sign(change)+'%</span>')+
 '</div><button class="subtle-btn" data-action="nav" data-value="trade">Long / Short →</button></div>'+
 candleSvg()+'<div class="tabs">'+[[1,"1m"],[5,"5m"],[15,"15m"]].map(function(x){return '<button class="tab '+(frame===x[0]?"selected":"")+'" data-action="frame" data-value="'+x[0]+'">'+x[1]+'</button>';}).join("")+'</div>'+
 '<p class="info-copy">Flux real doar pentru informare. Graficul afișează intervalul disponibil din API, nu ordine executate la un exchange.</p></section>';
}
function positions(){if(!state.positions.length)return '<div class="empty"><b>Nu ai poziții deschise</b>Încearcă modul Trading manual sau un Harvest demonstrativ.</div>';
return '<div class="positions">'+state.positions.map(function(p){var pl=E.round(E.unrealized(p,price(p.asset)));return '<div class="position"><div class="position-head"><div><span class="position-symbol">'+p.asset+'/USDT</span> <span class="mini-tag '+(p.side==="LONG"?"long":"short")+'">'+p.side+' '+p.leverage+'x</span></div><button class="subtle-btn" data-action="close" data-value="'+p.id+'">Închide</button></div><div class="position-grid"><div class="position-stat"><small>Intrare</small><strong>'+fmt(p.entry)+'</strong></div><div class="position-stat"><small>Curent</small><strong>'+fmt(price(p.asset))+'</strong></div><div class="position-stat"><small>PnL demo</small><strong class="'+cssClass(pl)+'">'+sign(pl)+'</strong></div></div></div>';}).join("")+'</div>';}
function positionPanel(){return '<section class="panel"><div class="sec-head"><span class="sec-title">Poziții deschise ('+state.positions.length+')</span><button class="subtle-btn" data-action="nav" data-value="positions">Vezi toate</button></div>'+positions()+'</section>';}
function records(limit){var entries=state.ledger.filter(function(row){return (filter==="all"||row.type===filter)&&(!filterDate||row.at.slice(0,10)===filterDate);}).slice(0,limit);
if(!entries.length)return '<div class="empty"><b>Nu există înregistrări</b>Un click pe Harvest creează cumpărare, vânzare și rezultat demonstrativ.</div>';
return entries.map(function(x){var op=x.type==="open",dir=x.side==="LONG"?(op?"Cumpărare LONG":"Vânzare LONG"):(op?"Deschidere SHORT":"Acoperire SHORT");
return '<div class="history-row"><div class="hist-icon">'+(op?"↘":"↗")+'</div><div><div class="hist-name">'+dir+' <span class="muted">· '+x.asset+'</span></div><div class="hist-sub">'+dateLabel(x.at)+' · Preț '+fmt(x.price)+'</div><div class="hist-sub">Sold după: '+fmt(x.balance)+' USDT</div></div><div class="hist-value '+(op?"loss":"profit")+'">'+(op?"−":"+")+fmt(x.amount)+'<small>USDT noționali</small>'+(op?'<small>Taxă '+fmt(x.fee)+'</small>':'<small class="'+cssClass(x.pnl)+'">PnL net '+sign(x.pnl)+'</small>')+'</div></div>';}).join("");}
function history(full){return '<section class="panel"><div class="sec-head"><span class="sec-title">Account Details • Istoric</span>'+(full?'<span class="sec-caption">'+state.ledger.length+' înregistrări</span>':'<button class="subtle-btn" data-action="nav" data-value="history">Vezi toate →</button>')+'</div>'+(full?'<div class="tabs" style="margin-bottom:13px">'+[["all","Toate"],["open","Deschideri"],["close","Închideri"]].map(function(x){return '<button class="tab '+(filter===x[0]?"selected":"")+'" data-action="filter" data-value="'+x[0]+'">'+x[1]+'</button>';}).join("")+'</div><label class="form-label" for="filter-date">Data</label><input class="date-filter" id="filter-date" type="date" value="'+escapeHtml(filterDate)+'" />':"")+records(full?150:5)+'</section>';}
function form(){return '<section class="panel"><div class="sec-head"><span class="sec-title">Trading manual</span><span class="demo-badge">● SIMULAT</span></div><label class="form-label">Pereche</label><div class="tabs">'+["BTC","ETH","SOL"].map(function(x){return '<button class="tab '+(pair===x?"selected":"")+'" data-action="asset" data-value="'+x+'">'+x+'/USDT</button>';}).join("")+'</div><div class="form-group"><div class="side-buttons"><button class="side-btn long '+(side==="LONG"?"active":"")+'" data-action="side" data-value="LONG">↗ Long<small>Cumpărare virtuală</small></button><button class="side-btn short '+(side==="SHORT"?"active":"")+'" data-action="side" data-value="SHORT">↘ Short<small>Vânzare virtuală</small></button></div></div><div class="form-group"><label class="form-label" for="manual-amount">Marjă demo (USDT)</label><input id="manual-amount" class="field" type="number" min="1" step="1" inputmode="decimal" value="'+escapeHtml(manualMargin)+'"></div><div class="form-group"><label class="form-label">Levier</label><div class="tabs">'+[1,2,3,5,10].map(function(x){return '<button class="tab '+(lever===x?"selected":"")+'" data-action="lever" data-value="'+x+'">'+x+'x</button>';}).join("")+'</div></div><div style="margin-top:14px"><div class="order-row"><span class="muted">Preț Kraken (USD)</span><strong>'+(M.quote(pair)?fmt(price(pair)):"—")+'</strong></div><div class="order-row"><span class="muted">Valoare noțională</span><strong id="notional">'+fmt((Number(manualMargin)||0)*lever)+' USDT</strong></div><div class="order-row"><span class="muted">Comision deschidere</span><strong id="orderfee">'+fmt(E.round((Number(manualMargin)||0)*lever*E.FEE_RATE))+' USDT</strong></div><div class="order-row"><span class="muted">Disponibil virtual</span><strong>'+fmt(metrics().available)+' USDT</strong></div></div><button class="primary" style="margin-top:16px" data-action="manual">Deschide '+side+' DEMO</button><p class="info-copy">Pozițiile manuale rămân deschise până apeși Închide. Nu sunt ordine pe piețe financiare.</p></section>';}
function profile(){var m=metrics(),wins=state.executions.filter(function(x){return x.pnl>0;}).length;
return '<div class="page"><div class="column"><section class="panel crypto-card"><div class="sec-head"><span class="sec-title">Crypto • abonamente NOVA</span><span class="mini-tag">ÎN PLAN</span></div><p class="info-copy">Vom putea accepta crypto ca metodă de <b>plată pentru servicii educaționale reale</b>, după verificarea unui procesator autorizat și implementarea facturilor/refundurilor.</p><p class="info-copy"><b>Nu acceptăm depuneri pentru Harvest, trading virtual, bonusuri din recrutare sau promisiuni de randament.</b> Nu există momentan adresă de depunere ori transfer în această aplicație.</p></section><section class="panel"><div class="sec-head"><span class="sec-title">Profil demonstrativ</span><span class="demo-badge">VIRTUAL</span></div><div class="order-row"><span>Capital inițial</span><strong>5.000,00 USDT</strong></div><div class="order-row"><span>Capital virtual actual</span><strong>'+fmt(m.equity)+' USDT</strong></div><div class="order-row"><span>Tranzacții închise</span><strong>'+state.executions.length+'</strong></div><div class="order-row"><span>Închideri profitabile</span><strong>'+wins+'</strong></div><div class="order-row"><span>Rezultat net demo</span><strong class="'+cssClass(m.equity-5000)+'">'+sign(m.equity-5000)+' USDT</strong></div><button data-action="reset" class="subtle-btn" style="width:100%;margin-top:17px;padding:13px">↺ Resetează contul virtual</button></section><section class="panel"><div class="sec-title">Cum prezint aplicația?</div><ol class="guide-steps"><li><span class="stepnum">1</span>Așteaptă cotația Kraken și verifică spread-ul.</li><li><span class="stepnum">2</span>Apasă Harvest și arată animația de circa 2 secunde.</li><li><span class="stepnum">3</span>Prezintă soldul și cele două rânduri din Istoric.</li><li><span class="stepnum">4</span>Explică apoi modul Long / Short manual.</li></ol><button class="primary" data-action="nav" data-value="harvest">Deschide Harvest →</button></section></div><div class="column"><section class="panel"><div class="sec-title">Transparență</div><p class="info-copy">Aplicația este un <b>simulator educațional cu bani virtuali</b>. Butonul Harvest execută tranzacții VIRTUALE la cotații publice Kraken și nu efectuează transferuri sau investiții reale.</p><p class="info-copy">Nu există depuneri, retrageri, exchange-uri, bani investiți, randamente promise ori recomandări financiare. Cotațiile sunt generate matematic și nu reprezintă prețuri de piață.</p><p class="info-copy">Tranzacționarea reală, în special cu levier, presupune riscuri de pierdere semnificativă.</p></section>'+history(false)+'</div></div>';}
function layout(a,b){return '<div class="page"><div class="column">'+a+'</div><div class="column">'+b+'</div></div>';}
function main(){
switch(tab){
case "battlepass":return passPage();
case "team":return teamPage();
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
function nav(){var items=[["home","⌂","Acasă"],["harvest","✦","Harvest"],["battlepass","✧","Pass"],["team","♧","Echipă"],["profile","♙","Profil"]];return '<nav class="nav" aria-label="Meniu principal">'+items.map(function(x){return '<button class="navbtn '+(tab===x[0]||(tab==="trade"&&x[0]==="markets")?"selected":"")+'" data-action="nav" data-value="'+x[0]+'"><span class="ico">'+x[1]+'</span>'+x[2]+'</button>';}).join("")+'</nav>';}
function render(){var t=toastText?'<div class="toast" role="status">'+escapeHtml(toastText)+'</div>':"";$("app").innerHTML='<main class="layout">'+topbar()+main()+'</main>'+nav()+t;}
function notify(txt){toastText=txt;render();clearTimeout(timer);timer=setTimeout(function(){toastText="";var t=document.querySelector(".toast");if(t)t.remove();},5000);}
function go(t){tab=t;render();window.scrollTo(0,0);}
function startHarvest(){
 if(pending)return;
 if(!C.canTrade(state,Date.now()))return notify("Limita zilnică de tranzacții virtuale a fost atinsă. Nu este obligatoriu să tranzacționezi.");
 var q;try{q=tradingQuote("BTC");}catch(e){return notify(e.message);}
 var m=Number(margin),fee=E.round(m*E.FEE_RATE);
 if(!Number.isFinite(m)||m<1||m>10000)return notify("Introdu o marjă între 1 și 10.000 USDT virtuali.");
 if(m+fee>state.cash)return notify("Sold virtual insuficient.");
 var opened;try{opened=E.open(state,{asset:"BTC",side:"LONG",margin:m,leverage:1,entry:q.ask,automated:true});}catch(e){return notify(e.message);}
 state=opened.state;recordVirtualOpening();save();pending=true;busyStarted=Date.now();render();
 var id=opened.position.id;
 var indicator=setInterval(function(){var elapsed=Date.now()-busyStarted,b=$("harvest-progress"),label=$("harvest-status");
   if(b)b.style.width=Math.min(100,elapsed/2050*100)+"%";
   if(label&&elapsed>950)label.textContent="2/2: cotație actualizată și calcul de ieșire…";
   if(elapsed>=2050)clearInterval(indicator);
 },75);
 setTimeout(async function(){
  clearInterval(indicator);
  try{
    await M.refresh("BTC");
    var now=tradingQuote("BTC"),
        pos=state.positions.find(function(x){return x.id===id;});
    if(!pos){pending=false;return notify("Poziția nu mai este deschisă.");}
    var result=E.close(state,id,now.bid,"harvest");
    state=result.state;recordVirtualClosing();var rank=syncLevel();pending=false;
    notify((rank?"Nivel nou: "+rank+". ":"")+"Harvest închis la cotația Kraken bid: "+sign(result.execution.pnl)+" USDT demo. Rezultatul poate fi negativ.");
  }catch(e){
    pending=false;save();
    notify("Cotația nu mai este disponibilă. Poziția virtuală a rămas deschisă pentru închidere manuală după reconectare.");
  }
 },2050);
}
function openManual(){
 if(pending)return;
 if(!C.canTrade(state,Date.now()))return notify("Ai atins limita de ordine demo pentru astăzi.");
 if(!isPro())return notify("Activează NOVA Pro pentru Long / Short manual.");
 try{
   var q=tradingQuote(pair);
   var entry=side==="LONG"?q.ask:q.bid;
   var opened=E.open(state,{asset:pair,side:side,margin:Number(manualMargin),leverage:lever,entry:entry,automated:false});
   state=opened.state;recordVirtualOpening();save();tab="positions";
   notify("Poziție "+side+" PAPER deschisă la Kraken "+(side==="LONG"?"ask":"bid")+" ("+fmt(entry)+" USD).");
 }catch(e){notify(e.message);}
}
function closeManual(id){
 if(pending)return;
 var pos=state.positions.find(function(x){return x.id===id;});if(!pos)return notify("Poziția nu există.");
 var quote;try{quote=tradingQuote(pos.asset);}catch(e){return notify(e.message);}
 if(!window.confirm("Închizi poziția virtuală "+pos.asset+" "+pos.side+" la prețul real "+(pos.side==="LONG"?"bid":"ask")+" de "+fmt(pos.side==="LONG"?quote.bid:quote.ask)+" USD?"))return;
 try{
  var exit=pos.side==="LONG"?quote.bid:quote.ask;
  var result=E.close(state,id,exit,"manual");
  state=result.state;recordVirtualClosing();var rank=syncLevel();
  notify((rank?"Nivel nou: "+rank+". ":"")+"PnL net paper: "+sign(result.execution.pnl)+" USDT demo.");
 }catch(e){notify(e.message);}
}
document.addEventListener("click",function(event){var el=event.target.closest("[data-action]");if(!el)return;var a=el.dataset.action,v=el.dataset.value;
if(a==="nav")go(v);else if(a==="copy-ref"){var link=$("invite-link").value;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(link).then(function(){notify("Linkul de invitație DEMO a fost copiat.");}).catch(function(){window.prompt("Copiază linkul:",link);});}else window.prompt("Copiază linkul:",link);}else if(a==="dismiss-invite"){inviteFromLink=null;render();}else if(a==="accept-invite"){try{C.joinPreview(state,inviteFromLink,Date.now());save();inviteFromLink=null;notify("Invitația a fost salvată local (DEMO). Nu este o înscriere verificată.");}catch(e){notify(e.message);}}else if(a==="rename-team"){try{C.renameTeam(state,$("team-name").value,Date.now());save();notify("Numele echipei DEMO a fost actualizat.");}catch(e){notify(e.message);}}else if(a==="lesson"){var parts=v.split(":"),result=C.completeLesson(state,parts[0],Number(parts[1]),Date.now());if(result.correct){save();notify(result.alreadyDone?"Lecția era deja completată.":"+30 XP • Lecție completată!");}else notify("Nu este corect. Poți încerca din nou, fără penalizare.");}else if(a==="mode"){try{var status=P.setMode(state,v,metrics().equity);save();go("home");notify("Modul NOVA "+status.mode+" a fost activat.");}catch(e){go("levels");notify(e.message);}}else if(a==="harvest")startHarvest();
else if(a==="pair"){pair=v;go("trade");}
else if(a==="asset"){pair=v;render();}
else if(a==="frame"){frame=Number(v);render();}
else if(a==="side"){side=v;render();}
else if(a==="lever"){lever=Number(v);render();}
else if(a==="manual")openManual();
else if(a==="close")closeManual(v);
else if(a==="filter"){filter=v;render();}
else if(a==="reset"){if(pending)return notify("Așteaptă finalizarea Harvest.");if(window.confirm("Resetezi soldul virtual la 5.000 USDT și ștergi istoricul demo?")){state=E.startingState();C.ensure(state,Date.now(),seedInvite());syncLevel();tab="home";notify("Contul demonstrativ a fost resetat.");}}
else if(a==="guide")window.alert("Ghid demo:\n1. Așteaptă conexiunea LIVE Kraken. Nu există profit prestabilit.\n2. Apasă Harvest. Așteaptă 2 secunde.\n3. Arată soldul nou și perechea cumpărare/vânzare din Istoric.\n4. Testează Long/Short manual.\n\nAtenție: Nu există fonduri sau tranzacții reale.");});
document.addEventListener("input",function(event){if(event.target.id==="harvest-amount")margin=event.target.value;else if(event.target.id==="manual-amount"){manualMargin=event.target.value;var n=$("notional"),f=$("orderfee"),amount=Number(manualMargin)||0;if(n)n.textContent=fmt(amount*lever)+" USDT";if(f)f.textContent=fmt(E.round(amount*lever*E.FEE_RATE))+" USDT";}});
document.addEventListener("change",function(event){if(event.target.id==="filter-date"){filterDate=event.target.value;render();}});
setInterval(function(){if(document.hidden||pending)return;var focused=document.activeElement;if(focused && ["INPUT","SELECT","TEXTAREA"].includes(focused.tagName))return;
for(var i=state.positions.length-1;i>=0;i--){var po=state.positions[i],q=M.quote(po.asset);if(!q)continue;
 var exit=po.side==="LONG"?q.bid:q.ask;
 if(E.unrealized(po,exit)<=-po.margin){try{state=E.close(state,po.id,exit,"liquidation").state;recordVirtualClosing();save();}catch(e){}}
 }render();},4000);
window.addEventListener("nova-market-update",function(){var focused=document.activeElement;if(focused&&["INPUT","SELECT","TEXTAREA"].includes(focused.tagName))return;render();});
M.start();syncLevel();render();
})();