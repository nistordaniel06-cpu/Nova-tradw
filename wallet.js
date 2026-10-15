/* NOVA educational crypto wallet. All balances and transfers are VIRTUAL.
 * There are no real deposits, wallet connections, blockchain sends or redemptions.
 */
(function(root,factory){
 const API=factory();
 if(typeof module==="object"&&module.exports)module.exports=API;
 else root.NovaWallet=API;
})(typeof window!=="undefined"?window:this,function(){
"use strict";
const STARTING_BALANCES=Object.freeze({USDT:1000,BTC:0.012,ETH:0.15,SOL:1.5});
const RATE_FEE=0.001; // visible 0.10% PAPER conversion cost for non-USDT holdings
const ASSETS=["USDT","BTC","ETH","SOL"];
const PRECISION={USDT:2,BTC:8,ETH:8,SOL:8};
function round(value,digits){const precision=10**(digits||2);return Math.round((value+Number.EPSILON)*precision)/precision;}
function validCount(n){return typeof n==="number"&&Number.isFinite(n)&&n>=0;}
function balance(s,asset){return s.walletDemo.balances[asset]||0;}
function normalize(s){
 if(!s||s.version!==1)throw Error("Cont virtual invalid.");
 if(!s.walletDemo){
   s.walletDemo={balances:{...STARTING_BALANCES},transfers:[],nextTransfer:1,version:1};
 }
 const w=s.walletDemo;
 if(w.version!==1||!w.balances||!Array.isArray(w.transfers)||!Number.isInteger(w.nextTransfer)||w.nextTransfer<1)
  throw Error("Portofel virtual corupt. Restabilește un cont demonstrativ curat.");
 if(!ASSETS.every(a=>validCount(w.balances[a])))throw Error("Sold virtual invalid.");
 return w;
}
function snapshot(s){
 const w=normalize(s);
 return {balances:{...w.balances},transfers:w.transfers.slice(),nextTransfer:w.nextTransfer};
}
function transferToHarvest(s,asset,input,quote){
 const w=normalize(s);
 if(!ASSETS.includes(asset))throw Error("Monedă DEMO necunoscută.");
 const amount=Number(input);
 if(!Number.isFinite(amount)||amount<=0||amount>1000000)throw Error("Introdu o sumă pozitivă, validă.");
 if(amount>balance(s,asset)+1e-10)throw Error("Sold virtual insuficient în portofel.");
 const digits=PRECISION[asset];
 if(Math.abs(amount-round(amount,digits))>1e-9)throw Error("Prea multe zecimale pentru monedă.");
 const isStable=asset==="USDT";
 if(!isStable&&(!quote||quote.asset!==asset||!validCount(quote.bid)||quote.bid<=0))
  throw Error("Cotația crypto lipsește sau este prea veche. Transferul demo a fost oprit.");
 const gross=round(isStable?amount:amount*quote.bid,2);
 const fee=round(isStable?0:gross*RATE_FEE,2);
 const net=round(gross-fee,2);
 if(net<=0)throw Error("Suma este prea mică după rotunjire și comision.");
 const n=JSON.parse(JSON.stringify(s)),wallet=normalize(n);
 wallet.balances[asset]=round(wallet.balances[asset]-amount,digits);
 n.cash=round(n.cash+net,2);
 const at=new Date().toISOString();
 wallet.transfers.unshift({
   id:"WT-"+wallet.nextTransfer++,at,asset,assetAmount:amount,
   direction:"wallet-to-harvest",paperPrice:isStable?1:quote.bid,
   quoteSource:isStable?"1:1 VIRTUAL":"Kraken Spot bid (referință USD)",
   gross,fee,net,cashAfter:n.cash
 });
 return {state:n,transfer:wallet.transfers[0]};
}
function transferBack(s,input){
 const w=normalize(s);
 const amount=Number(input);
 if(!Number.isFinite(amount)||amount<=0||amount>1000000)throw Error("Introdu o sumă validă de transfer.");
 if(round(amount,2)!==amount)throw Error("Folosește maximum două zecimale.");
 if(amount>s.cash+1e-9)throw Error("Sold disponibil insuficient în Harvest (marja deschisă nu se transferă).");
 const n=JSON.parse(JSON.stringify(s)),wallet=normalize(n);
 n.cash=round(n.cash-amount,2);
 wallet.balances.USDT=round(wallet.balances.USDT+amount,2);
 const at=new Date().toISOString();
 wallet.transfers.unshift({
   id:"WT-"+wallet.nextTransfer++,at,asset:"USDT",assetAmount:amount,
   direction:"harvest-to-wallet",paperPrice:1,quoteSource:"1:1 VIRTUAL",
   gross:amount,fee:0,net:amount,cashAfter:n.cash
 });
 return {state:n,transfer:wallet.transfers[0]};
}
return {STARTING_BALANCES,RATE_FEE,ASSETS,normalize,snapshot,transferToHarvest,transferBack};
});