"use strict";
// Kraken Connect OAuth confidential-client helpers. SERVER ONLY, never import in browser.
// No deposits, trading or withdrawals. User tokens stored encrypted in Supabase.
const crypto=require("node:crypto");
const SCOPE="account.fast-api-key:funds-query";
const REQUIRED=["KRAKEN_OAUTH_CLIENT_ID","KRAKEN_OAUTH_CLIENT_SECRET","KRAKEN_OAUTH_STATE_KEY","KRAKEN_TOKEN_ENCRYPTION_KEY","NOVA_APP_ORIGIN","NOVA_KRAKEN_CALLBACK_URL","NOVA_SUPABASE_URL","NOVA_SUPABASE_PUBLISHABLE_KEY","NOVA_SUPABASE_SERVICE_ROLE_KEY"];
function configured(env=process.env){
  return env.KRAKEN_OAUTH_ENABLED==="true"&&REQUIRED.every(k=>typeof env[k]==="string"&&env[k].length>0)
   && env.KRAKEN_OAUTH_STATE_KEY.length>=32
   && Buffer.from(env.KRAKEN_TOKEN_ENCRYPTION_KEY||"","base64").length===32
   && /^https:\/\//.test(env.NOVA_SUPABASE_URL||"")
   && /^https:\/\//.test(env.NOVA_APP_ORIGIN||"")
   && env.NOVA_APP_ORIGIN===new URL(env.NOVA_APP_ORIGIN).origin
   && env.NOVA_KRAKEN_CALLBACK_URL===env.NOVA_APP_ORIGIN+"/api/kraken/callback";
}
function csp(res){
  res.setHeader("Cache-Control","no-store, private");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
}
function json(res,status,value){csp(res);return res.status(status).json(value);}
function isSameOrigin(req,env=process.env){return req.headers.origin===env.NOVA_APP_ORIGIN;}
function authHeader(req){
  const h=req.headers.authorization||"";
  return /^Bearer [A-Za-z0-9._~-]{15,5000}$/.test(h)?h:null;
}
async function authenticatedUser(req,env=process.env,fetcher=fetch){
  const token=authHeader(req);
  if(!token)throw Error("AUTH");
  const resp=await fetcher(env.NOVA_SUPABASE_URL+"/auth/v1/user",{
    headers:{Authorization:token,apikey:env.NOVA_SUPABASE_PUBLISHABLE_KEY},
    signal:AbortSignal.timeout(7000)
  });
  if(!resp.ok)throw Error("AUTH");
  const u=await resp.json();
  if(!/^[0-9a-f-]{36}$/i.test(u.id||"")||!u.email_confirmed_at)throw Error("AUTH");
  return u.id;
}
function stateSignature(body,key){return crypto.createHmac("sha256",key).update(body).digest("base64url");}
function makeState(userId,env=process.env){
  const nonce=crypto.randomBytes(24).toString("base64url");
  const expires=Date.now()+5*60*1000;
  const body=Buffer.from(JSON.stringify({u:userId,n:nonce,e:expires}),"utf8").toString("base64url");
  return {value:body+"."+stateSignature(body,env.KRAKEN_OAUTH_STATE_KEY),nonce,expires};
}
function getCookie(req,name){
  const source=String(req.headers.cookie||"");
  const part=source.split(";").map(s=>s.trim()).find(s=>s.startsWith(name+"="));
  return part?part.slice(name.length+1):"";
}
function checkState(raw,cookie,env=process.env,now=Date.now()){
  if(!raw||raw.length>1200||typeof cookie!=="string"||cookie.length>100)return null;
  const [body,sig,...extra]=raw.split(".");
  if(!body||!sig||extra.length)return null;
  const expected=stateSignature(body,env.KRAKEN_OAUTH_STATE_KEY);
  const a=Buffer.from(sig),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
  let item;try{item=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));}catch{return null;}
  if(!/^[0-9a-f-]{36}$/i.test(item?.u||"")||typeof item.n!=="string"||item.n!==cookie||!Number.isSafeInteger(item.e)||item.e<now||item.e>now+300000)return null;
  return item.u;
}
function stateCookie(nonce){return "nova_kraken_state="+nonce+"; Path=/api/kraken/callback; Secure; HttpOnly; SameSite=Lax; Max-Age=300";}
function clearStateCookie(){return "nova_kraken_state=; Path=/api/kraken/callback; Secure; HttpOnly; SameSite=Lax; Max-Age=0";}
function encryptionKey(env=process.env){
  const b=Buffer.from(env.KRAKEN_TOKEN_ENCRYPTION_KEY||"","base64");
  if(b.length!==32)throw Error("ENCRYPTION_NOT_CONFIGURED");
  return b;
}
function encryptTokenBundle(bundle,env=process.env){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",encryptionKey(env),iv);
  const ct=Buffer.concat([cipher.update(JSON.stringify(bundle),"utf8"),cipher.final()]);
  return "v1:"+iv.toString("base64url")+":"+cipher.getAuthTag().toString("base64url")+":"+ct.toString("base64url");
}
function decryptTokenBundle(raw,env=process.env){
  const [v,iv,tag,ct]=String(raw).split(":");
  if(v!=="v1"||!iv||!tag||!ct)throw Error("TOKEN_CORRUPT");
  const decipher=crypto.createDecipheriv("aes-256-gcm",encryptionKey(env),Buffer.from(iv,"base64url"));
  decipher.setAuthTag(Buffer.from(tag,"base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ct,"base64url")),decipher.final()]).toString("utf8"));
}
async function supabaseAdmin(path,options={},env=process.env,fetcher=fetch){
  const resp=await fetcher(env.NOVA_SUPABASE_URL+"/rest/v1/"+path,{
    method:options.method||"GET",
    headers:{
      "apikey":env.NOVA_SUPABASE_SERVICE_ROLE_KEY,
      "Authorization":"Bearer "+env.NOVA_SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type":"application/json",
      ...(options.headers||{})
    },
    body:options.body?JSON.stringify(options.body):undefined,
    signal:AbortSignal.timeout(7000)
  });
  if(!resp.ok)throw Error("SERVER_STORAGE");
  const t=await resp.text();
  return t?JSON.parse(t):null;
}
async function exchangeCode(code,env=process.env,fetcher=fetch){
  if(!/^[\w.~-]{10,3000}$/.test(code))throw Error("CODE_INVALID");
  const basic=Buffer.from(env.KRAKEN_OAUTH_CLIENT_ID+":"+env.KRAKEN_OAUTH_CLIENT_SECRET).toString("base64");
  const form=new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:env.NOVA_KRAKEN_CALLBACK_URL});
  const r=await fetcher("https://api.kraken.com/oauth/token",{
    method:"POST",
    headers:{"Authorization":"Basic "+basic,"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},
    body:form.toString(),
    signal:AbortSignal.timeout(9000)
  });
  if(!r.ok)throw Error("KRAKEN_OAUTH_EXCHANGE");
  const payload=await r.json();
  if(typeof payload.access_token!=="string"||payload.access_token.length<10)throw Error("KRAKEN_INVALID_TOKEN");
  const granted=String(payload.scope||"").trim().split(/\s+/).filter(Boolean);
  // Fail closed if Kraken does not explicitly confirm the exact read-only scope.
  if(granted.length!==1||granted[0]!==SCOPE)throw Error("KRAKEN_SCOPE_MISMATCH");
  return {
    accessToken:payload.access_token,refreshToken:payload.refresh_token||null,
    expiresAt:Date.now()+Math.min(Math.max(Number(payload.expires_in)||3600,60),86400)*1000,
    scope:SCOPE
  };
}
module.exports={SCOPE,REQUIRED,configured,csp,json,isSameOrigin,authenticatedUser,makeState,checkState,getCookie,stateCookie,clearStateCookie,encryptTokenBundle,decryptTokenBundle,supabaseAdmin,exchangeCode};
