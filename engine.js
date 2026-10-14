/* NOVA Trade – educational trading simulation engine. No real orders or financial promises. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NovaEngine = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  var DEFAULT_BALANCE = 5000;
  var FEE_RATE = 0.0005;
  var ASSETS = {
    BTC: { symbol: "₿", name: "Bitcoin", base: 68450, phase: 0 },
    ETH: { symbol: "Ξ", name: "Ethereum", base: 3210, phase: 1.9 },
    SOL: { symbol: "◎", name: "Solana", base: 184.8, phase: 3.4 }
  };
  function round(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function startingState() { return { version: 1, cash: DEFAULT_BALANCE, positions: [], ledger: [], executions: [], next: 1 }; }
  function priceAt(asset, tick) {
    var item = ASSETS[asset];
    if (!item) throw Error("Pereche invalidă.");
    var x = tick + item.phase;
    return round(item.base * (1 + 0.012 * Math.sin(x * .033) + 0.004 * Math.sin(x * .13 + item.phase) + 0.0018 * Math.sin(x * .34)));
  }
  function cashAvailable(s) { return round(s.cash); }
  function unrealized(p, currentPrice) {
    return (p.side === "LONG" ? 1 : -1) * p.quantity * (currentPrice - p.entry);
  }
  function metrics(s, priceForAsset) {
    var locked = 0, floating = 0;
    s.positions.forEach(function (p) { locked += p.margin; floating += unrealized(p, priceForAsset(p.asset)); });
    return { available: round(s.cash), frozen: round(locked), pnl: round(floating), equity: round(s.cash + locked + floating) };
  }
  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function open(s, order) {
    var asset = order.asset, side = order.side, margin = Number(order.margin), leverage = Number(order.leverage), entry = Number(order.entry);
    if (!ASSETS[asset] || (side !== "LONG" && side !== "SHORT")) throw Error("Pereche sau direcție invalidă.");
    if (!Number.isFinite(margin) || margin < 1 || margin > 1000000) throw Error("Introdu o marjă validă de cel puțin 1 USDT.");
    if (![1,2,3,5,10].includes(leverage) || !Number.isFinite(entry) || entry <= 0) throw Error("Levier sau preț invalid.");
    var notional = margin * leverage, fee = round(notional * FEE_RATE);
    if (round(margin + fee) > s.cash) throw Error("Sold virtual insuficient pentru marjă și comision.");
    var n = copy(s), id = "D" + n.next++, date = new Date().toISOString();
    var p = { id: id, asset: asset, side: side, margin: margin, leverage: leverage, entry: entry, quantity: notional / entry, feeOpen: fee, openedAt: date, automated: Boolean(order.automated) };
    n.cash = round(n.cash - margin - fee);
    n.positions.unshift(p);
    n.ledger.unshift({ id:id+"-O", positionId:id, type:"open", side:side, asset:asset, amount:round(notional), fee:fee, price:entry, balance:n.cash, at:date });
    return { state:n, position:p };
  }
  function close(s, id, exitPrice, cause) {
    var p = s.positions.find(function (x) { return x.id === id; });
    if (!p) throw Error("Poziția nu există.");
    if (!Number.isFinite(Number(exitPrice)) || Number(exitPrice) <= 0) throw Error("Prețul de închidere este invalid.");
    var n = copy(s), gross = unrealized(p, Number(exitPrice));
    var feeClose = round(p.quantity * Number(exitPrice) * FEE_RATE);
    /* Liquidation caps losses to the margin in this educational simulator. */
    var realPnl = Math.max(-p.margin, round(gross - feeClose - p.feeOpen));
    var returned = Math.max(0, round(p.margin + gross - feeClose));
    returned = Math.min(returned, Math.max(0, round(p.margin + realPnl + p.feeOpen)));
    n.cash = round(n.cash + returned);
    n.positions = n.positions.filter(function (x) { return x.id !== id; });
    var at = new Date().toISOString();
    var item = { id:id+"-C", positionId:id, type:"close", cause:cause || "manual", side:p.side, asset:p.asset, amount:round(p.quantity * Number(exitPrice)), price:Number(exitPrice), fee:feeClose, pnl:realPnl, balance:n.cash, at:at };
    n.ledger.unshift(item);
    n.executions.unshift({id:id,side:p.side,asset:p.asset,entry:p.entry,exit:Number(exitPrice),margin:p.margin,leverage:p.leverage,pnl:realPnl,openedAt:p.openedAt,closedAt:at,cause:cause || "manual",automated:p.automated});
    return {state:n, execution:item};
  }
  function harvestExit(p, scenario) {
    var rate = scenario === "loss" ? -0.0027 : 0.0034;
    return round(p.entry * (1 + (p.side === "LONG" ? rate : -rate)));
  }
  function validate(s) {
    return !!s && s.version === 1 && Number.isFinite(s.cash) && s.cash >= 0 && Array.isArray(s.positions) && Array.isArray(s.ledger) && Array.isArray(s.executions) && Number.isInteger(s.next);
  }
  return { ASSETS:ASSETS, FEE_RATE:FEE_RATE, DEFAULT_BALANCE:DEFAULT_BALANCE, startingState:startingState, priceAt:priceAt, unrealized:unrealized, metrics:metrics, cashAvailable:cashAvailable, open:open, close:close, harvestExit:harvestExit, validate:validate, round:round };
});
