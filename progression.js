/* Progressive learning levels for NOVA Trade DEMO.
 * No real-money deposits, recruitment rewards, or guaranteed returns.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.NovaProgress=api;
})(typeof window!=="undefined"?window:this,function(){
"use strict";
var TIERS=[
  {id:"easy",mode:"EASY",label:"Easy • Explorer",minEquity:0,minTrades:0,benefit:"Harvest și portofel virtual"},
  {id:"easy-plus",mode:"EASY",label:"Easy • Plus",minEquity:5005,minTrades:2,benefit:"Istoric și statistici de progres"},
  {id:"pro",mode:"PRO",label:"Pro • Trader",minEquity:5025,minTrades:5,benefit:"Long / Short manual și grafice avansate"},
  {id:"pro-elite",mode:"PRO",label:"Pro • Elite",minEquity:5100,minTrades:12,benefit:"Statut Elite și provocări de învățare"}
];
function round(n){return Math.round(n*100)/100;}
function normalize(state){
  if(!state.progress||typeof state.progress!=="object")state.progress={peakEquity:5000,highestLevel:0,mode:"EASY"};
  var p=state.progress;
  if(!Number.isFinite(p.peakEquity)||p.peakEquity<0)p.peakEquity=5000;
  if(!Number.isInteger(p.highestLevel)||p.highestLevel<0||p.highestLevel>=TIERS.length)p.highestLevel=0;
  if(p.mode!=="EASY"&&p.mode!=="PRO")p.mode="EASY";
  return p;
}
function completed(state){return Array.isArray(state.executions)?state.executions.length:0;}
function evaluate(state,currentEquity){
  var p=normalize(state),amount=Number.isFinite(currentEquity)?Math.max(0,currentEquity):5000;
  p.peakEquity=round(Math.max(p.peakEquity,amount));
  var trades=completed(state),level=p.highestLevel;
  for(var i=0;i<TIERS.length;i++){
    if(p.peakEquity>=TIERS[i].minEquity&&trades>=TIERS[i].minTrades)level=Math.max(level,i);
  }
  p.highestLevel=level;
  if(p.mode==="PRO"&&level<2)p.mode="EASY";
  var next=TIERS[Math.min(level+1,TIERS.length-1)];
  return {
    level:level,
    tier:TIERS[level],
    next:level===TIERS.length-1?null:next,
    trades:trades,
    peakEquity:p.peakEquity,
    xp:trades*20+(state.executions||[]).filter(function(x){return x.cause==="manual";}).length*10,
    canPro:level>=2,
    mode:p.mode,
    missingEquity:level===TIERS.length-1?0:round(Math.max(0,next.minEquity-p.peakEquity)),
    missingTrades:level===TIERS.length-1?0:Math.max(0,next.minTrades-trades)
  };
}
function setMode(state,mode,currentEquity){
  var status=evaluate(state,currentEquity);
  if(mode!=="EASY"&&mode!=="PRO")throw Error("Mod invalid.");
  if(mode==="PRO"&&!status.canPro)throw Error("NOVA Pro este încă blocat. Deblochează-l din progresul contului demo.");
  state.progress.mode=mode;
  return evaluate(state,currentEquity);
}
return {tiers:TIERS,evaluate:evaluate,setMode:setMode};
});