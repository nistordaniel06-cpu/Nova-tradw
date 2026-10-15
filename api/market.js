"use strict";
/**
 * Read-only Kraken market data for paper trading.
 * No credentials, wallets, orders, custody, deposits or user funds.
 * Fixed allow-list protects against request proxying / SSRF.
 */
const PAIRS={BTC:"XBTUSD",ETH:"ETHUSD",SOL:"SOLUSD"};
const cache=new Map();
async function kraken(path,asset,ttl){
  const key=asset+":"+path;
  const hit=cache.get(key),now=Date.now();
  if(hit&&now-hit.at<ttl)return hit.value;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6500);
  try{
    const url="https://api.kraken.com/0/public/"+path+"?pair="+encodeURIComponent(PAIRS[asset])+
      (path==="OHLC"?"&interval=1":"");
    const resp=await fetch(url,{signal:controller.signal,headers:{Accept:"application/json","User-Agent":"NovaTradePaperSimulator/1.0"}});
    if(!resp.ok)throw Error("Kraken upstream HTTP "+resp.status);
    const json=await resp.json();
    if(!json||!Array.isArray(json.error)||json.error.length||!json.result)throw Error("Kraken returned error");
    const marketKey=Object.keys(json.result).find(k=>k!=="last");
    if(!marketKey)throw Error("Market pair missing");
    const value=json.result[marketKey];
    cache.set(key,{at:now,value});
    return value;
  }finally{clearTimeout(timeout);}
}
module.exports=async function handler(req,res){
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed"});}
  const asset=String(req.query.asset||"").toUpperCase();
  if(!Object.hasOwn(PAIRS,asset))return res.status(400).json({error:"Use BTC, ETH or SOL"});
  const candles=req.query.candles==="1";
  try{
    if(candles){
      const raw=await kraken("OHLC",asset,60000);
      if(!Array.isArray(raw))throw Error("Invalid OHLC response");
      const parsed=raw.slice(-96).map(x=>({
        time:Number(x[0]),open:Number(x[1]),high:Number(x[2]),
        low:Number(x[3]),close:Number(x[4]),volume:Number(x[6])
      })).filter(c=>Number.isFinite(c.time)&&
        ["open","high","low","close","volume"].every(k=>Number.isFinite(c[k])&&c[k]>=0)&&c.low<=c.high);
      if(parsed.length<2)throw Error("Insufficient candles");
      return res.status(200).setHeader("Cache-Control","public, s-maxage=45, stale-while-revalidate=10").json({
        source:"Kraken Spot",type:"candles",asset,pair:PAIRS[asset],currency:"USD",intervalSeconds:60,
        receivedAt:new Date().toISOString(),candles:parsed
      });
    }
    const ticker=await kraken("Ticker",asset,8500);
    const ask=Number(ticker.a?.[0]),bid=Number(ticker.b?.[0]),last=Number(ticker.c?.[0]),
      open=Number(ticker.o),volume=Number(ticker.v?.[1]);
    if(![ask,bid,last,open,volume].every(Number.isFinite)||ask<=0||bid<=0||bid>ask||last<=0){
      throw Error("Invalid Kraken quote");
    }
    return res.status(200).setHeader("Cache-Control","public, s-maxage=8, stale-while-revalidate=4").json({
      source:"Kraken Spot",type:"ticker",asset,pair:PAIRS[asset],currency:"USD",
      bid,ask,last,open24h:open,volume24h:volume,spread:ask-bid,receivedAt:new Date().toISOString()
    });
  }catch(e){return res.status(503).setHeader("Cache-Control","no-store").json({error:"Cotația live este indisponibilă. Tranzacțiile sunt temporar blocate.",source:"Kraken Spot"});}
};
