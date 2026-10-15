const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Market=require("./market.js");
const handler=require("./api/market.js");
const read=(p)=>fs.readFileSync(path.join(__dirname,p),"utf8");
function res(){
 return {statusCode:200,headers:{},payload:null,
 status(n){this.statusCode=n;return this;},
 setHeader(k,v){this.headers[k]=v;return this;},
 json(d){this.payload=d;return this;}};
}
function krakenTicker(){return {error:[],result:{XXBTZUSD:{
 a:["70500","1"],b:["70490","1"],c:["70495","1"],v:["1","1567"],o:"70300"
}}};}
test("public market API rejects unapproved symbols",async()=>{
 const r=res();await handler({method:"GET",query:{asset:"DOGE"}},r);
 assert.equal(r.statusCode,400);
});
test("public market API disallows deposits, POST or order placement",async()=>{
 const r=res();await handler({method:"POST",query:{asset:"BTC"}},r);
 assert.equal(r.statusCode,405);
 assert.equal(r.headers.Allow,"GET");
 const src=read("api/market.js");
 assert.ok(!/service_role|private.key|withdrawAddress|createOrder/i.test(src));
});
test("public ticker includes genuine bid and ask and provenance",async()=>{
 const old=global.fetch;
 global.fetch=async()=>({ok:true,json:async()=>krakenTicker()});
 try{
  const r=res();await handler({method:"GET",query:{asset:"BTC"}},r);
  assert.equal(r.statusCode,200);
  assert.equal(r.payload.source,"Kraken Spot");
  assert.equal(r.payload.currency,"USD");
  assert.equal(r.payload.ask,70500);
  assert.equal(r.payload.bid,70490);
  assert.equal(r.payload.last,70495);
  assert.equal(r.payload.spread,10);
  assert.ok(!Object.hasOwn(r.payload,"open24h"));
 }finally{global.fetch=old;}
});
test("invalid market quote causes an explicit unavailable response",async()=>{
 const old=global.fetch;
 global.fetch=async()=>({ok:true,json:async()=>({error:[],result:{XETHZUSD:{a:["0"],b:["-5"],c:["1"],v:["1","0"],o:"2"}}})});
 try{
  const r=res();await handler({method:"GET",query:{asset:"ETH"}},r);
  assert.equal(r.statusCode,503);
  assert.match(r.payload.error,/indisponibil/);
 }finally{global.fetch=old;}
});
test("market feed refuses stale quotes, not synthetic substitute",async()=>{
 assert.equal(Market.quote("BTC"),null);
 const src=read("market.js");
 assert.match(src,/STALENESS_MS=30000/);
 assert.match(src,/if\(!validQuote\(json,asset\)\)/);
 const app=read("app.js");
 assert.match(app,/function tradingQuote\(asset\)/);
 assert.match(app,/throw Error\("Cotația live/);
 assert.match(app,/entry:q.ask/);
 assert.match(app,/E.close\(state,id,now.bid,"harvest"\)/);
});
test("trading UI has no fixed winning scenario and forbids deposit collection",()=>{
 const app=read("app.js"),html=read("index.html");
 assert.ok(html.includes('src="./market.js"'));
 assert.ok(!app.includes('data-action="scenario"'));
 assert.ok(!app.includes("E.harvestExit(position"));
 assert.ok(app.includes("Nu acceptăm depuneri"));
 assert.ok(app.includes("USDT demo"));
});
