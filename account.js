/* NOVA online accounts (optional): enabled only with a dedicated Supabase project.
 * This file contains no private keys, account records or real trading orders.
 */
(function(){
"use strict";
var client=null,ready=false,status="not_configured",errorMessage="",session=null,profile=null,team=null,parent=null,members=[];
var config=window.NOVA_SUPABASE_CONFIG||{},url=String(config.url||"").trim(),key=String(config.publishableKey||"").trim();
var configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)&&(/^(sb_publishable_|eyJ)/.test(key));
var requestId=0;
function emit(){window.dispatchEvent(new CustomEvent("nova-online-change"));}
function sanitizeErr(err){var m=String(err&&err.message||err||"Operațiunea nu a reușit.");return m.slice(0,230);}
function snapshot(){
 return {status:status,configured:configured,error:errorMessage,authenticated:!!session?.user,
  email:session?.user?.email||null,profile:profile,team:team,parent:parent,members:members.slice()};
}
async function refresh(){
 if(!client){return snapshot();}
 var id=++requestId;
 try{
  var data=await client.auth.getSession();
  if(data.error)throw data.error;
  session=data.data.session;
  if(!session?.user){
   profile=null;team=null;parent=null;members=[];status="ready";errorMessage="";emit();return snapshot();
  }
  var userId=session.user.id;
  var out=await Promise.all([
   client.from("nova_profiles").select("display_name").eq("id",userId).maybeSingle(),
   client.from("nova_teams").select("name,invite_code").eq("owner_id",userId).maybeSingle(),
   client.rpc("nova_my_parent")
  ]);
  if(id!==requestId)return snapshot();
  for(var x of out)if(x.error)throw x.error;
  profile=out[0].data||null;
  team=out[1].data||null;
  parent=Array.isArray(out[2].data)?out[2].data[0]||null:null;
  members=[];
  if(team){
   var roster=await client.rpc("nova_my_team_members");
   if(roster.error)throw roster.error;
   if(id!==requestId)return snapshot();
   members=roster.data||[];
  }
  status="ready";errorMessage="";
 }catch(e){status="error";errorMessage=sanitizeErr(e);}
 emit();return snapshot();
}
async function initialize(){
 if(!configured){status="not_configured";emit();return;}
 status="loading";emit();
 try{
  // Imported only after a real project config is provided; demo needs no CDN.
  var sdk=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm");
  client=sdk.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  client.auth.onAuthStateChange(function(){setTimeout(refresh,0);});
  ready=true;await refresh();
 }catch(e){status="error";errorMessage="Nu pot încărca autentificarea: "+sanitizeErr(e);emit();}
}
async function signup(email,password,displayName){
 if(!ready)throw Error("Supabase nu este configurat.");
 if(!email||!password)throw Error("Introdu emailul și parola.");
 if(password.length<8)throw Error("Folosește minimum 8 caractere pentru parolă.");
 var opts={emailRedirectTo:location.origin+location.pathname};
 var result=await client.auth.signUp({email:email,password:password,options:opts});
 if(result.error)throw result.error;
 // Never expose whether an unverified email already exists.
 return {message:"Dacă adresa este eligibilă, vei primi un email de confirmare. Verifică Inbox/Spam.",requiresConfirmation:!result.data.session};
}
async function login(email,password){
 if(!ready)throw Error("Supabase nu este configurat.");
 var result=await client.auth.signInWithPassword({email:email,password:password});
 if(result.error)throw result.error;
 await refresh();
 return result.data.user;
}
async function logout(){
 if(!ready)throw Error("Supabase nu este configurat.");
 var r=await client.auth.signOut();
 if(r.error)throw r.error;
 await refresh();
}
function assertLogin(){if(!session?.user)throw Error("Conectează-te și confirmă emailul pentru a folosi echipele.");}
async function rpc(name,args){
 assertLogin();var result=await client.rpc(name,args||{});
 if(result.error)throw result.error;
 await refresh();return result.data;
}
function inviteUrl(){
 if(!team?.invite_code)return "";
 var base=location.origin+location.pathname;
 return base+"?team="+encodeURIComponent(team.invite_code);
}
function isValidCode(c){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(c||"").trim());}
async function join(code){
 if(!isValidCode(code))throw Error("Codul online trebuie să fie un UUID valid dintr-un link al unei echipe verificate.");
 return rpc("nova_join_team",{p_code:code.trim()});
}
async function getAccessToken(){if(!client)return null;const r=await client.auth.getSession();if(r.error)return null;return r.data.session?.access_token||null;}
window.NovaAccount={
 snapshot:snapshot,getAccessToken:getAccessToken,initialize:initialize,refresh:refresh,signup:signup,login:login,logout:logout,
 createTeam:function(name){return rpc("nova_create_team",{p_name:name});},
 renameTeam:function(name){return rpc("nova_rename_team",{p_name:name});},
 joinTeam:join,
 leaveTeam:function(){return rpc("nova_leave_parent");},
 shareDisplayName:function(enabled){return rpc("nova_set_share_name",{p_share:!!enabled});},
 updateDisplayName:function(name){return rpc("nova_update_display_name",{p_name:name});},
 previewInvite:async function(code){if(!isValidCode(code))throw Error("Cod de invitație invalid.");return rpc("nova_preview_team",{p_code:code});},
 inviteUrl:inviteUrl,isValidCode:isValidCode
};
initialize();
})();