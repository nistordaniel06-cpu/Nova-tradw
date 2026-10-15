/* NOVA Community & Battle Pass: a virtual-only learning demo.
 * No referral payouts, deposit-based rewards, guaranteed profits or multilevel commissions.
 * Client-side data is illustrative; real invite verification requires a secure backend.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.NovaCommunity=api;
})(typeof window!=="undefined"?window:this,function(){
"use strict";
const QUOTAS=[20,40,60,80,100];
const PASS_LEVELS=[
 {title:"Rookie",xp:0,quota:20,badge:"Începător"},
 {title:"Bronze",xp:40,quota:40,badge:"Explorator"},
 {title:"Silver",xp:90,quota:60,badge:"Analist"},
 {title:"Gold",xp:170,quota:80,badge:"Strateg"},
 {title:"Diamond",xp:280,quota:100,badge:"Maestru virtual"}
];
const LESSONS=[
 {id:"long",title:"Ce înseamnă Long?",question:"Într-o poziție Long, ce mișcare a prețului îți este favorabilă?",choices:["Prețul crește","Prețul scade","Prețul rămâne neschimbat"],correct:0},
 {id:"short",title:"Ce înseamnă Short?",question:"Într-o poziție Short, ce mișcare a prețului îți este favorabilă?",choices:["Prețul crește","Prețul scade","Nu contează"],correct:1},
 {id:"risk",title:"Înțelege riscul",question:"Ce poate face levierul într-o tranzacție reală?",choices:["Garantează profitul","Elimină pierderile","Amplifică atât profiturile, cât și pierderile"],correct:2},
 {id:"sim",title:"Ce este Harvest DEMO?",question:"Ce reprezintă profitul afișat în simularea Harvest?",choices:["Un câștig garantat","Un rezultat virtual prestabilit","Un transfer bancar real"],correct:1}
];
function pad(n){return String(n).padStart(2,"0");}
function dayKey(date){const d=new Date(date||Date.now());return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function code(seed){
  // This is a DEMO invitation code, not an authenticated account token.
  return "NOVA-"+String(seed||"DEMO000").replace(/[^A-Z0-9]/gi,"").toUpperCase().slice(0,8);
}
function fresh(seed){
 return {day:dayKey(),used:0,tradesEarned:0,seasonXp:0,lessons:[],inviteCode:code(seed),invitedBy:null,teamName:"Echipa mea"};
}
function ensure(state,now,seed){
 if(!state.community || typeof state.community!=="object")state.community=fresh(seed);
 const c=state.community;
 if(!Number.isFinite(c.used)||c.used<0)c.used=0;
 if(!Number.isFinite(c.tradesEarned)||c.tradesEarned<0)c.tradesEarned=0;
 if(!Number.isFinite(c.seasonXp)||c.seasonXp<0)c.seasonXp=0;
 if(!Array.isArray(c.lessons))c.lessons=[];
 if(!/^NOVA-[A-Z0-9]{1,8}$/.test(c.inviteCode||""))c.inviteCode=code(seed);
 if(typeof c.teamName!=="string")c.teamName="Echipa mea";
 if(typeof c.invitedBy!=="string")c.invitedBy=null;
 const today=dayKey(now);
 if(c.day!==today){c.day=today;c.used=0;c.tradesEarned=0;}
 return c;
}
function levelIndex(c){
 let result=0;
 for(let i=0;i<PASS_LEVELS.length;i++)if(c.seasonXp>=PASS_LEVELS[i].xp)result=i;
 return result;
}
function progress(state,now,seed){
 const c=ensure(state,now,seed),level=levelIndex(c),current=PASS_LEVELS[level];
 const next=level===PASS_LEVELS.length-1?null:PASS_LEVELS[level+1];
 return {level:level+1,passTitle:current.title,badge:current.badge,xp:c.seasonXp,
  next:next,quota:current.quota,used:c.used,remaining:Math.max(0,current.quota-c.used),
  day:c.day,inviteCode:c.inviteCode,invitedBy:c.invitedBy,teamName:c.teamName,
  lessonsDone:c.lessons.slice(),xpFromTradesToday:c.tradesEarned};
}
function canTrade(state,now){return progress(state,now).remaining>0;}
function recordOpen(state,now){
 const c=ensure(state,now);
 if(c.used>=PASS_LEVELS[levelIndex(c)].quota)throw Error("Ai atins limita zilnică de tranzacții demo. Revino mâine sau continuă lecțiile.");
 c.used+=1;
 return progress(state,now);
}
function recordClose(state,now){
 const c=ensure(state,now);
 // XP capped to first five completed simulations per day to avoid encouraging repetitive trading.
 if(c.tradesEarned<5){c.tradesEarned+=1;c.seasonXp+=15;}
 return progress(state,now);
}
function completeLesson(state,lessonId,answer,now){
 const lesson=LESSONS.find(x=>x.id===lessonId);
 if(!lesson)throw Error("Lecție invalidă.");
 if(!Number.isInteger(answer)||answer<0||answer>=lesson.choices.length)throw Error("Răspuns invalid.");
 const c=ensure(state,now);
 if(c.lessons.includes(lessonId))return {correct:true,alreadyDone:true,...progress(state,now)};
 if(answer!==lesson.correct)return {correct:false,alreadyDone:false,...progress(state,now)};
 c.lessons.push(lessonId);c.seasonXp+=30;
 return {correct:true,alreadyDone:false,...progress(state,now)};
}
function joinPreview(state,invite,now){
 const c=ensure(state,now);
 const raw=String(invite||"").trim().toUpperCase();
 if(!/^NOVA-[A-Z0-9]{1,8}$/.test(raw))throw Error("Cod de invitație invalid.");
 if(raw===c.inviteCode)throw Error("Nu te poți invita singur.");
 if(c.invitedBy && c.invitedBy!==raw)throw Error("Ai deja un invitator demo asociat.");
 c.invitedBy=raw;
 // Does NOT credit or verify the inviting user without authenticated backend registration.
 return progress(state,now);
}
function renameTeam(state,name,now){
 const c=ensure(state,now),s=String(name||"").trim();
 if(s.length<2||s.length>32)throw Error("Numele echipei trebuie să aibă între 2 și 32 de caractere.");
 c.teamName=s;
 return progress(state,now);
}
return {QUOTAS,PASS_LEVELS,LESSONS,dayKey,ensure,progress,canTrade,recordOpen,recordClose,completeLesson,joinPreview,renameTeam};
});