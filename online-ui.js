/* Separate account UI so an unconfigured backend never breaks the virtual simulator. */
(function(){
"use strict";
var Account=window.NovaAccount;
if(!Account)return;
var open=false,busy=false,flash="",submittedCode="",inviteCode="";
try{inviteCode=new URLSearchParams(location.search).get("team")||"";}catch(e){}
var root=document.createElement("div");root.id="nova-online";document.body.appendChild(root);
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function el(id){return root.querySelector("#"+id);}
function state(){return Account.snapshot();}
function panel(){
 var a=state(),title="NOVA Accounts",body="";
 if(!a.configured){
  body='<div class="nova-o-note"><b>Backend separat: în pregătire</b><p>Schema SQL pentru conturi și echipe NOVA este în GitHub. Un proiect Supabase dedicat trebuie creat și configurat înainte de autentificare.</p><p>Poți folosi în continuare Harvest, Easy, Pro, Battle Pass și invitațiile marcate DEMO. Datele virtuale sunt locale.</p></div>';
 }else if(a.status==="loading")body='<p>Se încarcă sesiunea securizată…</p>';
 else if(a.status==="error")body='<div class="nova-o-note"><p>'+esc(a.error)+'</p><button class="nova-o-btn" data-online="refresh">Reîncearcă</button></div>';
 else if(!a.authenticated){
  body='<p>Conturile online sunt folosite exclusiv pentru echipe și invitații verificate. Tranzacțiile rămân virtuale.</p>'+
   '<label class="nova-o-label" for="nova-email">Email</label><input id="nova-email" autocomplete="email" type="email" class="nova-o-input" placeholder="email@exemplu.ro">'+
   '<label class="nova-o-label" for="nova-password">Parolă (minim 8 caractere)</label><input id="nova-password" autocomplete="current-password" type="password" class="nova-o-input" placeholder="Parolă">'+
   '<div class="nova-o-row"><button class="nova-o-btn primary" data-online="login">Conectare</button><button class="nova-o-btn" data-online="signup">Creează cont</button></div>'+
   '<small>Înregistrarea necesită confirmarea adresei de email. Nu introduce datele unui cont financiar.</small>';
 }else{
  title="Contul și echipa NOVA";
  body='<p class="nova-o-acct">Conectat: <strong>'+esc(a.email)+'</strong></p>'+
   '<label class="nova-o-label">Nume afișat</label><input id="nova-display" class="nova-o-input" maxlength="40" value="'+esc(a.profile?.display_name||"Participant")+'">'+
   '<div class="nova-o-row"><button data-online="save-name" class="nova-o-btn">Salvează numele</button><button data-online="logout" class="nova-o-btn">Deconectare</button></div>'+
   '<h3>Echipa mea</h3>'+
   (a.team?'<div class="nova-o-note"><b>'+esc(a.team.name)+'</b><p>Membri direcți confirmați: '+a.members.length+'</p></div>'+
    '<label class="nova-o-label">Link de invitație validat pe server</label><input class="nova-o-input" readonly id="nova-invite-link" value="'+esc(Account.inviteUrl())+'">'+
    '<button data-online="copy" class="nova-o-btn">Copiază linkul</button>'+
    '<label class="nova-o-label">Redenumește echipa</label><input class="nova-o-input" id="nova-team-name" maxlength="32" value="'+esc(a.team.name)+'">'+
    '<button data-online="rename-team" class="nova-o-btn">Salvează numele echipei</button>'+
    '<h3>Membri care au acceptat</h3>'+ (a.members.length?a.members.map(function(m){return '<div class="nova-o-member"><b>'+esc(m.display_name)+'</b><small>'+(m.sharing_enabled?"Nume permis":"Nume ascuns")+'</small></div>';}).join(""):'<p>Încă nu există membri verificați.</p>'):
    '<label class="nova-o-label">Creează-ți o echipă</label><input class="nova-o-input" id="nova-create-name" maxlength="32" placeholder="NOVA Explorers"><button data-online="create-team" class="nova-o-btn primary">Creează echipa</button>')+
   '<h3>Echipa în care particip</h3>'+
   (a.parent?'<p>Faci parte din <b>'+esc(a.parent.team_name)+'</b>. Poți părăsi echipa oricând.</p>'+
    '<label class="nova-o-check"><input type="checkbox" id="nova-share" '+(a.parent.sharing_enabled?"checked":"")+'><span>Permit afișarea numelui meu invitatorului</span></label>'+
    '<div class="nova-o-row"><button data-online="privacy" class="nova-o-btn">Salvează preferința</button><button data-online="leave" class="nova-o-btn">Părăsește echipa</button></div>':
    '<p>Poți aparține unei echipe și, separat, poți crea una proprie. Nu există comisioane sau profit din recrutare.</p>'+
    '<label class="nova-o-label">Cod UUID de invitație</label><input class="nova-o-input" id="nova-join-code" value="'+esc(inviteCode)+'" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">'+
    '<button data-online="join" class="nova-o-btn primary">Acceptă invitația</button>')+
   '<p><small>Portofelul și Battle Pass-ul sunt încă demo locale și nu sunt sincronizate cu acest cont.</small></p>';
 }
 return '<div class="nova-o-head"><strong>'+title+'</strong><button data-online="close" class="nova-o-close" aria-label="Închide">✕</button></div><div class="nova-o-scroll">'+body+(flash?'<div class="nova-o-flash" role="status">'+esc(flash)+'</div>':"")+'</div>';
}
function render(){
 root.innerHTML='<button class="nova-o-launch" data-online="toggle" aria-haspopup="dialog" aria-expanded="'+open+'">♙ Cont online '+(state().authenticated?"●":"")+'</button>'+
 (open?'<div class="nova-o-backdrop" data-online="close"></div><section class="nova-o-panel" role="dialog" aria-modal="true" aria-label="NOVA Conturi și echipe">'+panel()+'</section>':"");
}
async function work(a){
 if(busy)return;
 if(a==="toggle"){open=!open;flash="";render();return;}
 if(a==="close"){open=false;flash="";render();return;}
 var E=Account;
 try{
  busy=true;flash="";
  if(a==="signup"){var v=await E.signup(el("nova-email").value.trim(),el("nova-password").value);flash=v.message;}
  else if(a==="login"){await E.login(el("nova-email").value.trim(),el("nova-password").value);flash="Autentificare reușită.";}
  else if(a==="logout"){await E.logout();flash="Deconectat.";}
  else if(a==="save-name"){await E.updateDisplayName(el("nova-display").value);flash="Numele a fost salvat.";}
  else if(a==="create-team"){await E.createTeam(el("nova-create-name").value);flash="Echipa este înregistrată.";}
  else if(a==="rename-team"){await E.renameTeam(el("nova-team-name").value);flash="Numele echipei este salvat.";}
  else if(a==="join"){await E.joinTeam(el("nova-join-code").value);flash="Ai intrat voluntar în echipă.";}
  else if(a==="leave"){if(!window.confirm("Vrei să părăsești echipa?"))return;await E.leaveTeam();flash="Ai părăsit echipa.";}
  else if(a==="privacy"){await E.shareDisplayName(el("nova-share").checked);flash="Preferința de confidențialitate este salvată.";}
  else if(a==="refresh"){await E.refresh();flash="Actualizat.";}
  else if(a==="copy"){var link=E.inviteUrl();if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(link);else window.prompt("Copiază linkul",link);flash="Linkul a fost copiat.";}
 }catch(err){flash=String(err?.message||err).slice(0,200);}
 finally{busy=false;render();}
}
root.addEventListener("click",function(e){var t=e.target.closest("[data-online]");if(!t)return;work(t.dataset.online);});
window.addEventListener("nova-online-change",function(){if(open&&!busy){var input=root.querySelector("input:focus");if(!input)render();}else if(!open)render();});
render();
})();