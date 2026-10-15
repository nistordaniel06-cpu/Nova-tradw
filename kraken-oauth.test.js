"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const K=require("./lib/kraken-oauth.js");
const api=require("./api/kraken/connect.js");
const callback=require("./api/kraken/callback.js");
const uid="123e4567-e89b-42d3-a456-426614174000";
const env={
 KRAKEN_OAUTH_ENABLED:"true",
 KRAKEN_OAUTH_CLIENT_ID:"registered-kraken-app-id",
 KRAKEN_OAUTH_CLIENT_SECRET:"server-side-secret",
 KRAKEN_OAUTH_STATE_KEY:"secret-more-than-32-characters-long-for-tests",
 KRAKEN_TOKEN_ENCRYPTION_KEY:crypto.randomBytes(32).toString("base64"),
 NOVA_APP_ORIGIN:"https://nova.example",
 NOVA_KRAKEN_CALLBACK_URL:"https://nova.example/api/kraken/callback",
 NOVA_SUPABASE_URL:"https://project.supabase.co",
 NOVA_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test",
 NOVA_SUPABASE_SERVICE_ROLE_KEY:"test-service-role-key"
};
function res(){return {headers:{},statusCode:200,
 setHeader(k,v){this.headers[k]=v;return this},
 status(n){this.statusCode=n;return this},
 json(x){this.body=x;return this},
 end(){this.ended=true;return this}};}
test("OAuth is OFF by default until app registration and secure Vercel env setup",()=>{
 assert.equal(K.configured({}),false);
 assert.equal(K.configured({...env,KRAKEN_OAUTH_ENABLED:"false"}),false);
 assert.equal(K.configured({...env,KRAKEN_TOKEN_ENCRYPTION_KEY:"weak"}),false);
 assert.equal(K.configured({...env,NOVA_KRAKEN_CALLBACK_URL:"https://evil.example/steal"}),false);
 assert.equal(K.configured(env),true);
});
test("signed single-browser state rejects tampering, replay after expiry and missing cookie",()=>{
 const state=K.makeState(uid,env);
 assert.equal(K.checkState(state.value,state.nonce,env,Date.now()),uid);
 assert.equal(K.checkState(state.value,state.nonce+"x",env,Date.now()),null);
 assert.equal(K.checkState(state.value+"x",state.nonce,env,Date.now()),null);
 assert.equal(K.checkState(state.value,state.nonce,env,state.expires+1),null);
 assert.match(K.stateCookie(state.nonce),/HttpOnly; SameSite=Lax/);
 assert.match(K.clearStateCookie(),/Max-Age=0/);
});
test("OAuth tokens are AES-256-GCM encrypted and authenticated",()=>{
 const original={accessToken:"real-token-value-is-only-for-test",refreshToken:"refresh-value",scope:K.SCOPE,expiresAt:1234};
 const encrypted=K.encryptTokenBundle(original,env);
 assert.ok(!encrypted.includes(original.accessToken));
 assert.ok(!encrypted.includes(original.refreshToken));
 assert.deepEqual(K.decryptTokenBundle(encrypted,env),original);
 assert.throws(()=>K.decryptTokenBundle(encrypted.slice(0,-3)+"xyz",env));
});
test("OAuth token exchange asks only for balance scope, no trading privileges",async()=>{
 const result=await K.exchangeCode("valid-code-long-enough",env,async(url,opts)=>{
  assert.equal(url,"https://api.kraken.com/oauth/token");
  assert.equal(opts.method,"POST");
  const p=new URLSearchParams(opts.body);
  assert.equal(p.get("grant_type"),"authorization_code");
  assert.equal(p.get("redirect_uri"),env.NOVA_KRAKEN_CALLBACK_URL);
  return {ok:true,async json(){return {access_token:"really-long-OAuth-access-token",refresh_token:"ref",
    scope:K.SCOPE,expires_in:3600}}};
 });
 assert.equal(result.scope,K.SCOPE);
 assert.ok(result.expiresAt>Date.now());
 await assert.rejects(
  K.exchangeCode("valid-code-long-enough",env,async()=>({ok:true,async json(){return {
   access_token:"really-long-OAuth-access-token",scope:K.SCOPE+" account.fast-api-key:trades-modify"
  }}})),
  /KRAKEN_SCOPE_MISMATCH/
 );
});
test("NOVA user must have verified email to initiate real OAuth",async()=>{
 const fetcher=async(url,opts)=>{
  assert.equal(url,env.NOVA_SUPABASE_URL+"/auth/v1/user");
  assert.equal(opts.headers.apikey,env.NOVA_SUPABASE_PUBLISHABLE_KEY);
  return {ok:true,async json(){return {id:uid,email_confirmed_at:"2026-10-15T00:00:00Z"}}};
 };
 assert.equal(await K.authenticatedUser({headers:{authorization:"Bearer abcdef0123456789.abcdef.12345"}},env,fetcher),uid);
 await assert.rejects(K.authenticatedUser({headers:{}},env,fetcher),/AUTH/);
});
test("without Kraken client provisioning API refuses authorization and never claims real funds",async()=>{
 const original=process.env.KRAKEN_OAUTH_ENABLED;
 delete process.env.KRAKEN_OAUTH_ENABLED;
 try{
  const r=res();await api({method:"GET",headers:{}},r);
  assert.equal(r.body.oauthAvailable,false);
  assert.equal(r.body.connected,false);
  assert.equal(r.body.realFundsInNova,false);
  assert.equal(r.body.harvestFundingAllowed,false);
  const s=res();await api({method:"POST",headers:{}},s);
  assert.equal(s.body.oauthAvailable,false);
  const c=res();await callback({method:"GET",headers:{},query:{}},c);
  assert.equal(c.statusCode,503);
 }finally{if(original===undefined)delete process.env.KRAKEN_OAUTH_ENABLED;else process.env.KRAKEN_OAUTH_ENABLED=original;}
});
test("token vault private SQL excludes client access and direct authenticated grants",()=>{
 const sql=fs.readFileSync("supabase/migrations/20261015_nova_kraken_oauth_connections.sql","utf8");
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public.nova_kraken_connections from public, anon, authenticated/);
 assert.match(sql,/account.fast-api-key:funds-query/);
 assert.ok(!sql.includes("create policy"));
});
test("connection UI never stores real balances, Kraken credentials or authorizes orders",()=>{
 const script=fs.readFileSync("kraken-connect-ui.js","utf8");
 const app=fs.readFileSync("app.js","utf8");
 assert.ok(script.includes("Conectarea directă și afișarea soldului real nu sunt disponibile"));
 assert.ok(script.includes("id.kraken.com"));
 assert.ok(script.includes("getAccessToken"));
 assert.ok(!/localStorage|service_role|trades-modify|funds-add|sendTransaction/.test(script));
 assert.ok(app.includes("NU E CRYPTO REAL"));
});
