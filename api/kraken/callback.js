"use strict";
const K=require("../../lib/kraken-oauth");
function redirect(res,status){
  const u=process.env.NOVA_APP_ORIGIN+"/?kraken="+encodeURIComponent(status);
  res.statusCode=303;
  res.setHeader("Location",u);
  return res.end();
}
module.exports=async function handler(req,res){
  K.csp(res);
  res.setHeader("Set-Cookie",K.clearStateCookie());
  if(req.method!=="GET")return K.json(res,405,{error:"Method not allowed"});
  if(!K.configured())return K.json(res,503,{error:"Autorizarea Kraken nu este configurată."});
  if(typeof req.query.state!=="string")return redirect(res,"invalid");
  const uid=K.checkState(req.query.state,K.getCookie(req,"nova_kraken_state"));
  if(!uid)return redirect(res,"invalid");
  if(req.query.error)return redirect(res,"denied");
  if(typeof req.query.code!=="string")return redirect(res,"invalid");
  try{
    const bundle=await K.exchangeCode(req.query.code);
    const encoded=K.encryptTokenBundle(bundle);
    await K.supabaseAdmin("nova_kraken_connections?on_conflict=user_id",{
      method:"POST",
      headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
      body:{user_id:uid,encrypted_bundle:encoded,scope:K.SCOPE,
        expires_at:new Date(bundle.expiresAt).toISOString(),updated_at:new Date().toISOString()}
    });
    return redirect(res,"connected");
  }catch(e){
    // Never expose OAuth codes, tokens, provider errors or credentials.
    return redirect(res,"error");
  }
};