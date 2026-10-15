/* Kraken OAuth consent UI — NO balances or secrets stored in browser. */
(function(){
"use strict";
var loading=false,latest=null,notice="";
function esc(x){return String(x||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function target(){return document.getElementById("nrc-connect-status");}
async function token(){return window.NovaAccount?.getAccessToken?await window.NovaAccount.getAccessToken():null;}
function render(){
 var el=target();if(!el)return;
 var a=latest,authed=!!window.NovaAccount?.snapshot?.().authenticated;
 var content='<h4>Kraken Connect · acces numai pentru citire</h4>';
 if(loading)content+='<p>Se verifică integrarea oficială…</p>';
 else if(!a||!a.oauthAvailable){
  content+='<p><b>În așteptarea aprobării Kraken.</b> NOVA nu are încă un OAuth Client ID autorizat. Conectarea directă și afișarea soldului real nu sunt disponibile.</p>'+
   '<p>Nu crea chei API și nu le introduce în aplicație. Portofelul virtual rămâne separat.</p>';
 }else if(!authed)content+='<p>Autentifică-te întâi în contul NOVA și confirmă emailul, apoi revino aici.</p>';
 else if(a.connected){
  content+='<p><b>Autorizare Kraken stocată criptat pe server.</b> Scope: <code>funds-query</code>. Afișarea soldului real va fi activată separat, după validarea endpointului Kraken.</p>'+
    '<p>Token valabil până la: '+esc(a.expiresAt?new Date(a.expiresAt).toLocaleString("ro-RO"):"neprecizat")+'</p>'+
    '<button type="button" class="nrc-secondary" data-kraken-disconnect>Elimină conexiunea din NOVA</button>'+
    '<p>Revocă autorizarea și în contul oficial Kraken dacă nu mai dorești acces.</p>';
 }else{
  content+='<p>Kraken îți va cere consimțământ doar pentru citirea soldului. NOVA nu poate depune, retrage sau tranzacționa fonduri reale.</p>'+
   '<button type="button" class="nrc-secondary" data-kraken-connect>Autorizează Kraken doar pentru citire</button>';
 }
 if(notice)content+='<p role="status">'+esc(notice)+'</p>';
 el.innerHTML=content;
}
async function request(method){
 const t=await token(),headers={"Accept":"application/json"};
 if(t)headers.Authorization="Bearer "+t;
 const resp=await fetch("/api/kraken/connect",{method:method||"GET",headers,cache:"no-store"});
 const data=await resp.json();
 if(!resp.ok)throw Error(data.error||"Serviciu indisponibil");
 return data;
}
async function refresh(){
 if(!target())return;
 loading=true;render();
 try{latest=await request("GET");notice="";}
 catch(e){latest=null;notice="Nu pot verifica acum integrarea Kraken. Reîncearcă mai târziu.";}
 finally{loading=false;render();}
}
async function action(kind){
 if(loading)return;
 loading=true;render();
 try{
  if(kind==="connect"){
    var v=await request("POST");
    if(typeof v.authorizationUrl!=="string")throw Error("Autorizare indisponibilă.");
    var u=new URL(v.authorizationUrl);
    if(u.protocol!=="https:"||u.hostname!=="id.kraken.com")throw Error("Destinația OAuth nu este oficială.");
    window.location.assign(u.toString());return;
  }
  if(kind==="disconnect"){
   if(!window.confirm("Elimini tokenurile Kraken din NOVA? Revocă accesul și din contul Kraken."))return;
   await request("DELETE");
   notice="Tokenurile NOVA au fost eliminate. Revocă autorizarea și în Kraken.";
   latest={...latest,connected:false};
  }
 }catch(e){notice="Acțiunea nu este disponibilă. Verifică autentificarea NOVA și configurarea Kraken.";}
 finally{loading=false;render();}
}
document.addEventListener("nova-kraken-panel-open",refresh);
document.addEventListener("nova-online-change",function(){if(target())refresh();});
document.addEventListener("click",function(e){
 if(e.target.closest("[data-kraken-connect]"))action("connect");
 else if(e.target.closest("[data-kraken-disconnect]"))action("disconnect");
});
try{
 var state=new URLSearchParams(window.location.search).get("kraken");
 if(state){notice=state==="connected"?"Autorizarea a fost înregistrată; verifică starea contului.":"Autorizarea Kraken nu a fost finalizată.";
  if(window.history?.replaceState)window.history.replaceState(null,"",window.location.pathname);
 }
}catch(e){}
})();