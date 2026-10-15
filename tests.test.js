const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("./engine.js");

test("new demo account starts with 5,000 virtual USDT", () => {
  const s = E.startingState();
  assert.equal(s.cash, 5000);
  assert.equal(s.positions.length, 0);
  assert.ok(E.validate(s));
});

test("harvest profit produces paired entry and exit plus positive net PnL", () => {
  const start = E.startingState();
  const {state, position} = E.open(start,{asset:"BTC",side:"LONG",margin:175,leverage:1,entry:68000,automated:true});
  const done = E.close(state,position.id,E.harvestExit(position,"profit"),"harvest");
  assert.ok(done.execution.pnl > 0);
  assert.equal(done.state.ledger.length,2);
  assert.equal(done.state.positions.length,0);
  assert.equal(done.state.executions.length,1);
  assert.ok(done.state.cash > 5000);
});

test("harvest loss example reduces balance, not a guarantee of profits", () => {
  const {state,position}=E.open(E.startingState(),{asset:"BTC",side:"LONG",margin:175,leverage:1,entry:68000,automated:true});
  const done=E.close(state,position.id,E.harvestExit(position,"loss"),"harvest");
  assert.ok(done.execution.pnl < 0);
  assert.ok(done.state.cash < 5000);
});

test("short profits when price goes down", () => {
  const {state,position}=E.open(E.startingState(),{asset:"ETH",side:"SHORT",margin:200,leverage:2,entry:3000});
  const done=E.close(state,position.id,2950);
  assert.ok(done.execution.pnl > 0);
  assert.ok(done.state.cash > 5000);
});

test("fees and margin cannot exceed available funds", () => {
  assert.throws(()=>E.open(E.startingState(),{asset:"BTC",side:"LONG",margin:5000,leverage:10,entry:68000}),/insuficient/);
});

test("unrealized PnL changes account equity", () => {
  const {state}=E.open(E.startingState(),{asset:"ETH",side:"LONG",margin:100,leverage:2,entry:3000});
  const a=E.metrics(state,()=>3000),b=E.metrics(state,()=>3100);
  assert.ok(b.equity > a.equity);
  assert.ok(a.frozen===100);
});

test("invalid or fabricated demo account is rejected", () => {
  assert.equal(E.validate({cash:"5000"}),false);
  assert.equal(E.validate(E.startingState()),true);
});


const P = require("./progression.js");

test("starts in Easy Explorer, with Pro unavailable", () => {
  const state = E.startingState();
  const level = P.evaluate(state, E.DEFAULT_BALANCE);
  assert.equal(level.level, 0);
  assert.equal(level.mode, "EASY");
  assert.equal(level.canPro, false);
  assert.throws(() => P.setMode(state, "PRO", E.DEFAULT_BALANCE), /blocat/);
});

test("progresses one level at a time based on virtual equity and completed trades", () => {
  const state = E.startingState();
  state.executions = [{cause:"harvest"},{cause:"harvest"}];
  const easyPlus = P.evaluate(state, 5005);
  assert.equal(easyPlus.tier.id, "easy-plus");
  assert.equal(easyPlus.missingTrades, 3);
  assert.equal(easyPlus.canPro, false);
  state.executions.push({cause:"harvest"},{cause:"manual"},{cause:"manual"});
  const pro = P.evaluate(state, 5025);
  assert.equal(pro.tier.id, "pro");
  assert.equal(pro.canPro, true);
  assert.equal(pro.xp, 120);
});

test("unlocked Pro remains available after a simulated losing trade", () => {
  const state = E.startingState();
  state.executions = Array.from({length:5},() => ({cause:"harvest"}));
  P.setMode(state, "PRO", 5030);
  const afterLoss=P.evaluate(state, 4770);
  assert.equal(afterLoss.mode, "PRO");
  assert.equal(afterLoss.peakEquity, 5030);
  assert.equal(afterLoss.level, 2);
});

test("resetting demo account restores progression to Easy and removes old unlocked status", () => {
  const state = E.startingState();
  state.executions = Array.from({length:15},()=>({cause:"manual"}));
  P.setMode(state, "PRO", 5200);
  const reset = E.startingState();
  assert.equal(P.evaluate(reset,5000).mode, "EASY");
  assert.equal(P.evaluate(reset,5000).level, 0);
});

test("tier thresholds are virtual milestones and contain no recruitment payouts", () => {
  assert.deepEqual(P.tiers.map(x=>x.minTrades), [0,2,5,12]);
  assert.deepEqual(P.tiers.map(x=>x.minEquity), [0,5005,5025,5100]);
  assert.ok(P.tiers.every(x=>!Object.hasOwn(x,"commission")&&!Object.hasOwn(x,"downline")));
});
