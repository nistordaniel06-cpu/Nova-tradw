# NOVA Teams — proiect tehnic (nu este încă activ)

## Obiectiv
Fiecare utilizator autentificat poate crea o echipă, poate invita alți participanți printr-un cod unic și își poate vizualiza membrii care au acceptat voluntar invitația. Echipele pot avea subechipe, dar sistemul nu distribuie bani pe niveluri și nu recompensează depuneri ori recrutare în cascadă.

## MVP funcțional în GitHub
- Cod de invitație generat local, marcat DEMO
- Partajare link ?ref=CODE
- Salvarea locală a codului unui invitator după acceptare
- Battle Pass cu XP educațional și 20/40/60/80/100 tranzacții demo disponibile/zi
- Nicio înscriere verificată, nicio listă de membri sincronizată și nicio recompensă financiară

## Arhitectură necesară pentru echipe reale
1. Supabase Auth: email verificat și autentificare securizată. Profil unic, identificator UUID generat pe server.
2. `profiles`: user_id (PK, FK auth.users), display_name, created_at.
3. `teams`: id UUID (PK), owner_id (FK profiles, UNIQUE pentru o singură echipă proprie per utilizator), name, created_at.
4. `invites`: id UUID, team_id, inviter_id, token_hash (UNIQUE), expires_at, max_uses, used_count, is_active. Tokenurile reale trebuie generate criptografic pe server; nu se stochează public ca text.
5. `memberships`: member_id UUID (PK), team_id UUID, invited_by UUID NULL, accepted_at TIMESTAMPTZ, left_at NULL, consent boolean; un utilizator poate intra într-o echipă activă la un moment dat.
6. `learning_events`: id UUID, user_id, event_type, source_ref, points INT, created_at; UNIQUE pe (user_id, event_type, source_ref) pentru acordarea XP o singură dată.
7. `daily_usage`: user_id, local_day DATE, orders_opened INT, PRIMARY KEY (user_id, local_day); actualizat atomic și verificat server-side.
8. `battle_pass_progress`: user_id, season_id, total_xp, level; calcul și atribuire numai server-side, fără posibilitatea de a modifica XP de la client.

## Reguli obligatorii de siguranță
- RLS pe toate tabelele; interogările de echipă returnează date minime doar membrilor care au consimțit. Fără afișarea publică a datelor personale sau a lanțurilor de contacte.
- Atribuirea invitației se face la prima înregistrare verificată. O singură atribuire, fără invitarea propriei persoane, fără cicluri, fără plăți între niveluri.
- Referral-ul este opțional; progresul complet în aplicație poate fi obținut prin lecții și tranzacții în simulator. Nu există limite minime de activitate obligatorie.
- Dacă ulterior un referral verificat va acorda puncte, acestea vor fi **doar XP/insigne non-redeemable**, plafonate pe sezon, fără beneficii financiare sau comisioane multi-level.
- Evidența `daily_usage` și ledger-ul tranzacțiilor virtuale sunt calculabile doar pe server dacă sunt folosite pentru clasamente, competiții sau abonamente; localStorage este doar demo.
- Rate limiting, detectare multi-account, verificare email, rotație tokenuri, audit trail și opțiune de părăsire a echipei.
- Nu depozităm / distribuim bani reali. Nu există profit garantat sau randamente bazate pe depunerile altora.

## Etapele recomandate
- Faza 1: demo GitHub și test mobil, fără backend.
- Faza 2: implementare Supabase separată pentru NOVA; migrări SQL și RLS; conturi reale de test.
- Faza 3: invitații verificate și arbori de echipe nefinanciare (numai cu consimțământ).
- Faza 4: Battle Pass server-authoritative, limite 20-100 / zi și anti-abuz.
- Faza 5: monetizare doar prin abonamente educaționale și licențe B2B transparente, după revizuirea conformității.
