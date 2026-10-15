"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const E=require("./engine.js");
const W=require("./wallet.js");
const P=require("./progression.js");
test("wallet is independent and seeded with imaginary BTC ETH SOL USDT",()=>{
 const state=E.startingState();
 const {balances,transfers}=W.snapshot(state);
 assert.deepEqual(balances,{USDT:1000,BTC:0.012,ETH:0.15,SOL:1.5});
 assert.equal(state.cash,5000);
 assert.equal(transfers.length,0);
});
test("USDT virtual top-up credits Harvest and debits wallet atomically",()=>{
 const initial=E.startingState();W.normalize(initial);
 const r=W.transferToHarvest(initial,"USDT",150,null);
 assert.equal(r.state.cash,5150);
 assert.equal(r.state.walletDemo.balances.USDT,850);
 assert.equal(r.transfer.net,150);
 assert.equal(r.transfer.fee,0);
 assert.equal(initial.cash,5000);
 assert.equal(initial.walletDemo.balances.USDT,1000);
});
test("BTC demo conversion follows bid and deducts shown 0.1% demo fee",()=>{
 const initial=E.startingState();
 const x=W.transferToHarvest(initial,"BTC",0.001,{asset:"BTC",bid:69000,ask:69010});
 assert.equal(x.transfer.gross,69);
 assert.equal(x.transfer.fee,0.07);
 assert.equal(x.transfer.net,68.93);
 assert.equal(x.state.cash,5068.93);
 assert.equal(x.state.walletDemo.balances.BTC,0.011);
});
test("fake crypto funding requires trustworthy quote and cannot exceed virtual holdings",()=>{
 const x=E.startingState();
 assert.throws(()=>W.transferToHarvest(x,"BTC",0.001,null),/Cotația crypto/);
 assert.throws(()=>W.transferToHarvest(x,"BTC",0.02,{asset:"BTC",bid:70000}),/insuficient/);
 assert.throws(()=>W.transferToHarvest(x,"ETH",0.02,{asset:"BTC",bid:100}),/Cotația crypto/);
 assert.throws(()=>W.transferToHarvest(x,"USDT",1001,null),/insuficient/);
 assert.throws(()=>W.transferToHarvest(x,"USDT",-3,null),/sumă/);
 assert.equal(x.cash,5000);
});
test("paper return transfer is limited to Harvest available cash and never redeems crypto",()=>{
 const initial=E.startingState();W.normalize(initial);
 const x=W.transferToHarvest(initial,"USDT",400,null);
 const opened=E.open(x.state,{asset:"BTC",side:"LONG",margin:5100,leverage:1,entry:69000,automated:true});
 assert.equal(opened.state.cash,297.45); // 5400 - 5100 - 2.55 commission
 assert.throws(()=>W.transferBack(opened.state,350),/insuficient/);
 const y=W.transferBack(opened.state,100);
 assert.equal(y.state.cash,197.45);
 assert.equal(y.state.walletDemo.balances.USDT,700);
 assert.equal(y.state.walletDemo.transfers.length,2);
 assert.equal(y.state.walletDemo.transfers[0].direction,"harvest-to-wallet");
});
test("internal funding never counts as earned progress in Easy Pro logic",()=>{
 const source=fs.readFileSync("./app.js","utf8");
 assert.match(source,/paperEquityWithoutTransfers/);
 assert.match(source,/metrics\(\)\.equity-netWalletTransfers\(\)/);
 assert.match(source,/P\.evaluate\(state,paperEquityWithoutTransfers\(\)\)/);
 const state=E.startingState();W.normalize(state);
 const x=W.transferToHarvest(state,"USDT",300,null);
 const adjusted=x.state.cash - x.state.walletDemo.transfers.reduce((s,t)=>s+(t.direction==="wallet-to-harvest"?t.net:-t.net),0);
 assert.equal(P.evaluate(x.state,adjusted).level,0);
});
test("all crypto funding is demo only without any onchain payment or withdrawal",()=>{
 const js=fs.readFileSync("./wallet.js","utf8"),app=fs.readFileSync("./app.js","utf8"),html=fs.readFileSync("./index.html","utf8");
 assert.ok(html.includes('src="./wallet.js"'));
 assert.ok(app.includes("NU E CRYPTO REAL"));
 assert.ok(app.includes("Nu trimite criptomonede reale"));
 assert.ok(!/signTransaction|sendTransaction|transferFrom|createDepositAddress|secretKey|privateKey/.test(js));
});
