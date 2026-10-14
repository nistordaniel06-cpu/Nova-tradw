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
