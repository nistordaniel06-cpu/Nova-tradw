"use strict";
const K=require("../../lib/kraken-oauth");
const TABLE="nova_kraken_connections";
module.exports=async function handler(req,res){
  K.csp(res);
  if(!["GET","POST","DELETE"].includes(req.method)){
    res.setHeader("Allow","GET, POST, DELETE");
    return K.json(res,405,{error:"Method not allowed"});
  }
  // Keep the OAuth flow totally disabled until Kraken has provisioned this app.
  if(!K.configured())return K.json(res,200,{
    provider:"Kraken",oauthAvailable:false,connected:false,reason:"NOVA așteaptă OAuth Client ID de la Kraken.",
    scope:K.SCOPE,realFundsInNova:false,harvestFundingAllowed:false
  });
  try{
    if(req.method!=="GET"&&!K.isSameOrigin(req))return K.json(res,403,{error:"Origine neacceptată"});
    const uid=await K.authenticatedUser(req);
    if(req.method==="GET"){
      const list=await K.supabaseAdmin(TABLE+"?user_id=eq."+encodeURIComponent(uid)+"&select=scope,expires_at,created_at&limit=1");
      const item=list?.[0]||null;
      return K.json(res,200,{
        provider:"Kraken",oauthAvailable:true,connected:!!item,scope:K.SCOPE,
        expiresAt:item?.expires_at||null,realFundsInNova:false,harvestFundingAllowed:false,
        // Reading actual balances is intentionally withheld until provider API scope validation.
        balanceReadVerified:false
      });
    }
    if(req.method==="POST"){
      const state=K.makeState(uid);
      res.setHeader("Set-Cookie",K.stateCookie(state.nonce));
      const p=new URLSearchParams({
        response_type:"code",
        client_id:process.env.KRAKEN_OAUTH_CLIENT_ID,
        redirect_uri:process.env.NOVA_KRAKEN_CALLBACK_URL,
        scope:K.SCOPE,
        state:state.value
      });
      return K.json(res,200,{authorizationUrl:"https://id.kraken.com/oauth/authorize?"+p.toString(),scope:K.SCOPE});
    }
    // DELETE: remove NOVA's stored tokens. Provider-level revocation still
    // requires disconnecting at Kraken as documented in the UX.
    await K.supabaseAdmin(TABLE+"?user_id=eq."+encodeURIComponent(uid),{method:"DELETE"});
    return K.json(res,200,{disconnected:true,note:"Accesul local șters. Revocă și autorizarea din contul Kraken."});
  }catch(e){
    if(e.message==="AUTH")return K.json(res,401,{error:"Autentifică-te în NOVA și confirmă emailul."});
    return K.json(res,503,{error:"Conexiunea Kraken nu este disponibilă momentan."});
  }
};