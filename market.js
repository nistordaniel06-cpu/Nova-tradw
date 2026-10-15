/* Browser-only read-only Kraken feed. PAPER trading orders never leave this app. */
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;else root.NovaMarket=api;})(typeof window==="object"?window:{},function(win){
"use strict";
const pairs=["BTC","ETH","SOL"],quotes={},candles={},errors={},STALENESS_MS=30000;
const timers=[];
function announce(){if(win.dispatchEvent&&typeof CustomEvent==="function")win.dispatchEvent(new CustomEvent("nova-market-update"));}
function validQuote(r,asset){
 return r&&r.source==="Kraken Spot"&&r.asset===asset&&r.currency==="USD"&&
 ["bid","ask","last"].every(k=>typeof r[k]==="number"&&Number.isFinite(r[k])&&r[k]>0)&&r.bid<=r.ask&&
 Number.isFinite(Date.parse(r.receivedAt));
}
function quote(asset,now){const q=quotes[asset];if(!q)return null;
 const age=(now||Date.now())-Date.parse(q.receivedAt);
 return age>=0&&age<=STALENESS_MS?q:null;
}
function last(asset){return quotes[asset]||null;}
function bars(asset){return candles[asset]||[];}
function error(asset){return errors[asset]||"";}
async function retrieve(asset,withCandles){
 if(!pairs.includes(asset))throw Error("Activ invalid.");
 const url="/api/market?asset="+asset+(withCandles?"&candles=1":"");
 const controller=new AbortController(),id=setTimeout(()=>controller.abort(),8000);
 try{
  const resp=await fetch(url,{signal:controller.signal,cache:"no-store",headers:{"Accept":"application/json"}});
  if(!resp.ok)throw Error("Nu se pot obține datele pieței.");
  const json=await resp.json();
  if(withCandles){
   if(!Array.isArray(json.candles)||json.candles.length<2||json.asset!==asset||json.source!=="Kraken Spot")throw Error("OHLC invalid.");
   candles[asset]=json.candles.filter(c=>["open","high","low","close","time"].every(k=>Number.isFinite(c[k]))).slice(-96);
  }else{
   if(!validQuote(json,asset))throw Error("Cotație invalidă.");
   quotes[asset]=json;
   errors[asset]="";
  }
  announce();return json;
 }catch(e){errors[asset]="Cotație indisponibilă. Ordinul demonstrativ este blocat până la reconectare.";announce();throw e;}
 finally{clearTimeout(id);}
}
async function refresh(asset){return retrieve(asset,false);}
async function refreshCandles(asset){return retrieve(asset,true);}
function start(){
 // All quote requests are fixed symbols. Stop polling when tab is hidden.
 pairs.forEach(asset=>{refresh(asset).catch(()=>{});refreshCandles(asset).catch(()=>{});});
 if(win.setInterval){
  timers.push(win.setInterval(()=>{if(win.document?.hidden)return;pairs.forEach(a=>refresh(a).catch(()=>{}));},12000));
  timers.push(win.setInterval(()=>{if(win.document?.hidden)return;pairs.forEach(a=>refreshCandles(a).catch(()=>{}));},60000));
 }
}
return {pairs,quote,last,bars,error,refresh,refreshCandles,start,STALENESS_MS};
});