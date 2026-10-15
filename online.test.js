const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const AccountCode=fs.readFileSync(require("node:path").join(__dirname,"account.js"),"utf8");
const DrawerCode=fs.readFileSync(require("node:path").join(__dirname,"online-ui.js"),"utf8");
const SQL=fs.readFileSync(require("node:path").join(__dirname,"supabase/migrations/20261015_nova_auth_teams.sql"),"utf8");
test("unconfigured Supabase leaves virtual trading demo usable",()=>{
 const messages=[],win={NOVA_SUPABASE_CONFIG:{url:"",publishableKey:""},dispatchEvent(e){messages.push(e.type);}};
 class Event{constructor(type){this.type=type;}}
 new Function("window","CustomEvent","setTimeout",AccountCode)(win,Event,()=>{});
 assert.equal(win.NovaAccount.snapshot().configured,false);
 assert.equal(win.NovaAccount.snapshot().authenticated,false);
 assert.equal(win.NovaAccount.snapshot().status,"not_configured");
 assert.ok(messages.includes("nova-online-change"));
});
test("NOVA online account interface explains missing backend rather than pretending signup succeeds",()=>{
 const win={NOVA_SUPABASE_CONFIG:{url:"",publishableKey:""},dispatchEvent(){},addEventListener(){}};
 class Event{constructor(type){this.type=type;}}
 new Function("window","CustomEvent","setTimeout",AccountCode)(win,Event,()=>{});
 const nodes=[],listeners={};
 const doc={createElement(){const n={innerHTML:"",addEventListener(type,fn){listeners[type]=fn;},querySelector(){return null;}};return n;},body:{appendChild(node){nodes.push(node);}}};
 new Function("window","document","location","URLSearchParams",DrawerCode)(win,doc,{search:""},URLSearchParams);
 assert.equal(nodes.length,1);
 assert.ok(nodes[0].innerHTML.includes("Cont online"));
 assert.ok(listeners.click);
 listeners.click({target:{closest(){return {dataset:{online:"toggle"}};}}});
 assert.ok(nodes[0].innerHTML.includes("Backend separat: în pregătire"));
 assert.ok(nodes[0].innerHTML.includes("Supabase dedicat"));
});
test("online client never embeds privileged Supabase secrets",()=>{
 assert.ok(AccountCode.includes("publishableKey"));
 assert.ok(!AccountCode.includes("service_role"));
 assert.ok(!AccountCode.includes("supabaseAdmin"));
 assert.ok(!DrawerCode.includes("profit garantat"));
});
test("backend only exposes consent-sensitive names and disallows raw referral table access",()=>{
 for(const keyword of ["nova_profiles enable row level security","nova_teams enable row level security","nova_referrals enable row level security",
 "revoke all on public.nova_profiles, public.nova_teams, public.nova_referrals from anon, authenticated",
 "nova_join_team","nova_leave_parent","nova_my_team_members","nova_require_verified","email_confirmed_at",
 "case when r.share_display_name then p.display_name else 'Participant anonim'"]){
  assert.ok(SQL.includes(keyword),"SQL missing: "+keyword);
 }
 assert.ok(!SQL.includes("parent_display_name"));
});
test("team model lets a member also own a team to form voluntary subteams",()=>{
 assert.ok(SQL.includes("owner_id uuid not null unique"));
 assert.ok(SQL.includes("child_id uuid primary key"));
 assert.ok(SQL.includes("parent_id uuid not null"));
 assert.ok(!SQL.includes("downline_payout"));
});
