/* Explicit external crypto gateway, no exchange credentials inside NOVA.
 * Overlay is informational and links out to official Kraken-owned destinations.
 */
(function(){
"use strict";
var X=window.NovaExchange;
if(!X)return;
var root=document.createElement("div");
root.id="nova-real-crypto";
document.body.appendChild(root);
var opened=false;
function panel(){
 return '<div class="nrc-header"><span><span class="nrc-overline">NOVA • EXTERNAL CRYPTO</span><strong>Crypto Real</strong></span>'+
  '<button class="nrc-close" type="button" data-real-close aria-label="Închide">×</button></div>'+
  '<div class="nrc-scroll">'+
  '<section class="nrc-hero"><div class="nrc-pill">● CONT EXTERN · KRAKEN PRO</div>'+
  '<h2>Crypto-ul tău rămâne în contul tău.</h2>'+
  '<p>Poți depune, vedea soldul și tranzacționa crypto real direct la furnizorul extern. NOVA nu primește și nu controlează fonduri.</p>'+
  '<a class="nrc-primary" href="'+X.link("website")+'" target="_blank" rel="noopener noreferrer">Deschide Kraken Pro <span>↗</span></a>'+
  '<small>Vei ieși din NOVA către pro.kraken.com. Verifică domeniul înainte să introduci datele de conectare.</small>'+
  '</section>'+
  '<div class="nrc-split"><div><strong>Kraken Pro</strong><small>Fonduri reale, operațiuni externe</small></div>'+
   '<span>≠</span><div><strong>Harvest PAPER</strong><small>Bani virtuali, fără retrageri</small></div></div>'+
  '<section class="nrc-section"><h3>Cum alimentezi Kraken cu crypto</h3>'+
  '<ol class="nrc-steps"><li><b>Intră în propriul cont Kraken.</b><span>Folosește autentificarea oficială și, ideal, 2FA.</span></li>'+
  '<li><b>Alege Deposit.</b><span>Verifică exact moneda și rețeaua acceptată la Kraken.</span></li>'+
  '<li><b>Verifică adresa și eventualul memo.</b><span>O rețea sau adresă greșită poate duce la pierderea fondurilor.</span></li>'+
  '<li><b>Finalizează doar în Kraken.</b><span>Depunerea NU creditează portofelul DEMO sau soldul Harvest din NOVA.</span></li></ol>'+
  '<a class="nrc-link" target="_blank" rel="noopener noreferrer" href="'+X.link("depositGuide")+'">Ghid oficial de depunere în română <span>↗</span></a>'+
  '<a class="nrc-link" target="_blank" rel="noopener noreferrer" href="'+X.link("proDepositGuide")+'">Ghid de depunere și retragere Kraken Pro <span>↗</span></a>'+
  '</section>'+
  '<section class="nrc-section nrc-safe"><h3>Protecția fondurilor</h3>'+
  '<p>Nu cere nimănui să trimită fonduri într-un portofel NOVA: <b>NOVA nu oferă adrese de depozit.</b></p>'+
  '<p>Nu introdu niciodată în NOVA parola Kraken, cheia API, fraza seed sau cheia privată. Nu există comisioane din depuneri sau bonusuri financiare pentru echipa referral.</p>'+
  '<p><b>Conectarea soldului real prin OAuth este încă indisponibilă.</b> Necesită înregistrarea unei aplicații autorizate la Kraken și consimțământ pentru permisiuni de citire; momentan NOVA nu îți poate afișa soldul real.</p>'+
  '<a class="nrc-link" href="'+X.link("connectDocs")+'" target="_blank" rel="noopener noreferrer">Kraken Connect — documentație oficială <span>↗</span></a>'+
  '<div id="nrc-connect-status" class="nrc-oauth-status" aria-live="polite"><p>Se verifică disponibilitatea Kraken Connect…</p></div>'+
  '</section>'+
  '<button class="nrc-secondary" type="button" data-real-close>Înapoi în NOVA Paper Trading</button>'+
  '</div>';
}
function render(){
 root.innerHTML=(opened?'<div class="nrc-overlay" data-real-close></div><section class="nrc-panel" role="dialog" aria-modal="true" aria-label="Crypto Real extern">'+panel()+'</section>':'');
}
function toggle(flag){opened=flag;render();if(flag)document.dispatchEvent(new CustomEvent('nova-kraken-panel-open'));}
document.addEventListener("click",function(e){
 var launch=e.target.closest("[data-real-open]");
 if(launch){e.preventDefault();toggle(true);return;}
 if(e.target.closest("[data-real-close]")){e.preventDefault();toggle(false);}
});
document.addEventListener("keydown",function(e){if(opened&&e.key==="Escape")toggle(false);});
render();
})();
