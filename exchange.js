/* NOVA Real Crypto gateway: fixed links ONLY to the external regulated exchange.
 * NOVA does not receive crypto, sign transactions, or custody user funds.
 * Never paste passwords, seed phrases, deposit addresses, or API keys into NOVA.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.NovaExchange=api;
})(typeof window!=="undefined"?window:this,function(){
"use strict";
const PROVIDER=Object.freeze({
  id:"kraken",name:"Kraken Pro",
  website:"https://pro.kraken.com",
  depositGuide:"https://support.kraken.com/ro/articles/360000672643-how-to-deposit-cryptocurrencies-to-your-kraken-account",
  proDepositGuide:"https://support.kraken.com/articles/deposit-withdraw-on-the-kraken-pro-app",
  connectDocs:"https://docs-legacy.kraken.com/api/docs/oauth/kraken-connect/"
});
const SECURITY=Object.freeze({
 realFundsInNova:false,
 walletCustody:false,
 depositsToHarvest:false,
 privateKeysCollected:false,
 withdrawInNova:false,
 paperBalancesRedeemable:false,
 oauthConnected:false
});
function link(type){
 const value=PROVIDER[type];
 if(typeof value!=="string"||!value.startsWith("https://"))throw Error("Link extern neacceptat.");
 return value;
}
function status(){return {provider:PROVIDER.name,connected:false,service:"external",realFundsInNova:false,oauthRegistered:false};}
return {PROVIDER,SECURITY,link,status};
});