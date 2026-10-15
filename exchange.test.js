"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const X=require("./exchange.js");
const read=p=>fs.readFileSync(p,"utf8");

test("real crypto gateway has only immutable official Kraken links",()=>{
 assert.equal(X.link("website"),"https://pro.kraken.com");
 assert.match(X.link("depositGuide"),/^https:\/\/support\.kraken\.com\/ro\//);
 assert.match(X.link("proDepositGuide"),/^https:\/\/support\.kraken\.com\/articles\//);
 assert.match(X.link("connectDocs"),/^https:\/\/docs-legacy\.kraken\.com\//);
 assert.throws(()=>X.link("fake-wallet"),/neacceptat/);
 assert.ok(Object.isFrozen(X.PROVIDER));
});

test("real and paper funds have explicit hard separation",()=>{
 assert.deepEqual(X.SECURITY,{
  realFundsInNova:false,walletCustody:false,depositsToHarvest:false,
  privateKeysCollected:false,withdrawInNova:false,
  paperBalancesRedeemable:false,oauthConnected:false
 });
 const flags=X.status();
 assert.equal(flags.connected,false);
 assert.equal(flags.realFundsInNova,false);
 const w=read("./wallet.js");
 assert.ok(!w.includes("walletconnect"));
});

test("external Kraken links never request secrets or simulate connection",()=>{
 const ui=read("./real-crypto-ui.js");
 const app=read("./app.js");
 assert.ok(ui.includes('target="_blank" rel="noopener noreferrer"'));
 assert.ok(!ui.includes("signTransaction"));
 assert.ok(!ui.includes("seed phrase"));
 assert.ok(ui.includes("Conectarea soldului real prin OAuth este încă indisponibilă"));
 assert.ok(app.includes("data-real-open"));
 assert.ok(ui.includes("fonduri")&&ui.includes("NOVA"));
});

test("Crypto Real panel opens and exits without writing demo cash or balance",()=>{
 const listeners={},app={appendChild(n){this.child=n;}};
 const document={
   createElement(){return {id:"",innerHTML:""};},
   body:app,
   addEventListener(event,fn){listeners[event]=fn;}
 };
 const win={NovaExchange:X};
 new Function("window","document",read("./real-crypto-ui.js"))(win,document);
 assert.ok(app.child);
 assert.ok(!app.child.innerHTML.includes("nrc-panel"));
 let stopped=false;
 listeners.click({target:{closest(s){return s==="[data-real-open]"?{}:null;}},preventDefault(){stopped=true;}});
 assert.equal(stopped,true);
 assert.match(app.child.innerHTML,/pro\.kraken\.com/);
 assert.match(app.child.innerHTML,/FONDURI/);
 assert.match(app.child.innerHTML,/Kraken Pro/);
 assert.match(app.child.innerHTML,/NOVA nu primește și nu controlează fonduri/);
 listeners.keydown({key:"Escape"});
 assert.ok(!app.child.innerHTML.includes("nrc-panel"));
});

test("real crypto scripts load after paper wallet and do not modify the simulation engine",()=>{
 const html=read("./index.html");
 const scripts=["engine.js","wallet.js","exchange.js","app.js","real-crypto-ui.js"];
 for(const n of scripts)assert.ok(html.includes('src="./'+n+'"'),"Missing script "+n);
 assert.ok(html.indexOf('src="./wallet.js"')<html.indexOf('src="./exchange.js"'));
 assert.ok(html.indexOf('src="./app.js"')<html.indexOf('src="./real-crypto-ui.js"'));
 const engine=read("./engine.js");
 assert.match(engine,/No real orders or financial promises/);
 const wallet=read("./wallet.js");
 assert.match(wallet,/All balances and transfers are VIRTUAL/);
});
