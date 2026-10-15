# Kraken Connect — OAuth cu acces exclusiv de citire

> Status 15.10.2026: codul este pregătit, **nu este activat**. NOVA nu are OAuth Client ID provizionat de Kraken. Niciun sold Kraken real nu este accesat sau afișat, iar soldul Harvest rămâne numai PAPER.

## 1. Solicitarea înregistrării aplicației la Kraken

Conectează-te în contul tău Kraken și folosește [Kraken Support](https://support.kraken.com/articles/360022839971-support-and-malfunction-reporting). Solicită integrarea Kraken Connect OAuth pentru aplicația „NOVA Trade” — un **portfolio tracker read-only**, fără tranzacționare/depunere/retragere executată de NOVA.

Specifică:
- OAuth **Confidential Client** (server Vercel), scop unic \`account.fast-api-key:funds-query\`. NU solicita \`trades-modify\`, \`funds-add\`, \`withdraw\` ori \`account.fast-api-key:write\`.
- Redirect URI fix **după integrarea pe domeniul aprobat de utilizator**: \`https://nova-trade-harvest.vercel.app/api/kraken/callback\`.
- Solicită OAuth Client ID, metoda de provisionare și returnare a Secretului; Kraken cere cheie publică RSA pentru clienții confidențiali și poate livra un secret criptat cu cheia ta publică.
- Confirmă în mod explicit cu Kraken ce API și ce permisiune sunt necesare pentru a citi soldul. Documentația listează scope-ul \`funds-query\`, dar ruta de consultare a soldului cu un token OAuth trebuie validată înainte de implementarea vizualizării live.
- Nu trimite prin chat/email parole Kraken, seed phrase, chei API sau chei private RSA. Configurează exclusiv secretul final pe server.

Sursă oficială: https://docs-legacy.kraken.com/api/docs/oauth/kraken-connect/

## 2. Configurarea secretelor în Vercel (doar după aprobare)

Niciun secret nu se comite în GitHub, config.js sau localStorage.

În setările proiectului Vercel NOVA, adaugă variabile de mediu **numai în mediul producție aprobat**:

\`\`\`text
KRAKEN_OAUTH_ENABLED=false
KRAKEN_OAUTH_CLIENT_ID=<client id aprobat de Kraken>
KRAKEN_OAUTH_CLIENT_SECRET=<secret descifrat de către administrator, pe server>
KRAKEN_OAUTH_STATE_KEY=<secret aleator de cel puțin 32 caractere>
KRAKEN_TOKEN_ENCRYPTION_KEY=<32 octeți aleatori, codificați base64>
NOVA_APP_ORIGIN=https://nova-trade-harvest.vercel.app
NOVA_KRAKEN_CALLBACK_URL=https://nova-trade-harvest.vercel.app/api/kraken/callback
NOVA_SUPABASE_URL=https://ddhilzlkxmsgmggftwmy.supabase.co
NOVA_SUPABASE_PUBLISHABLE_KEY=<cheie publică>
NOVA_SUPABASE_SERVICE_ROLE_KEY=<cheie privilegiată SUPABASE DOAR server-side>
\`\`\`

### Important

- Lasă \`KRAKEN_OAUTH_ENABLED=false\` până când au trecut toate verificările și Kraken confirmă scope-ul cerut. Activează \`true\` numai după aprobare.
- \`NOVA_SUPABASE_SERVICE_ROLE_KEY\` și \`KRAKEN_OAUTH_CLIENT_SECRET\` nu se expun niciodată browserului.
- Configurează exact aceeași origine și redirect URI în Kraken și Vercel. Preview-uri Vercel cu adrese aleatoare nu sunt potrivite pentru testarea OAuth până la înregistrarea explicită a redirectului.
- Cheile de criptare trebuie să fie generate printr-un manager securizat de secrete; pierderea cheii de criptare face tokenurile deja salvate inutilizabile.
- Planifică politica de rotație a secretelor, audit de acces, eliminare la ștergerea contului și răspuns la incidente.

## 3. Baza de date

Migrarea de pregătire este \`supabase/migrations/20261015_nova_kraken_oauth_connections.sql\`.

**Nu a fost aplicată pe baza de date live.** Este nevoie de revizuire și de aplicare în proiectul NOVA dedicat (ref \`ddhilzlkxmsgmggftwmy\`) înainte de activare.

Tabelul \`nova_kraken_connections\` stochează numai tokenuri OAuth **criptate AES-256-GCM** și metadate despre scop/expirare. RLS este activ. Nu există politici client-side, iar accesul este rezervat serverului cu service-role.

## 4. API-ul pregătit

- \`GET /api/kraken/connect\`: verifică dacă integrarea e configurată și dacă utilizatorul are o autorizare salvată. Nu transmite tokenuri și **nu afișează soldul real**.
- \`POST /api/kraken/connect\`: necesită JWT NOVA autentificat, email confirmat și origine validă; generează state HMAC/cookie HttpOnly, apoi furnizează URL de consimțământ oficial Kraken.
- \`GET /api/kraken/callback\`: verifică state + cookie + expirare, schimbă codul contra token și acceptă exclusiv \`account.fast-api-key:funds-query\`; apoi criptează și salvează tokenurile pe server.
- \`DELETE /api/kraken/connect\`: șterge tokenurile locale. Utilizatorul trebuie să revoce și autorizarea de la Kraken; ștergerea locală nu garantează revocarea furnizorului.

**Nu există endpoint de tranzacționare, depozit sau retragere.** Nu există nici endpoint de sold real până la validarea oficială și testarea permisiunilor Kraken.

## 5. Ordinea de activare

1. Se obține aprobarea Kraken + Client ID + condițiile de acces.
2. Se face revizia de securitate și se aplică migrarea NOVA; nu modifica alte proiecte.
3. Se configurează toate variabilele server-side cu \`KRAKEN_OAUTH_ENABLED=false\`.
4. Se testează autentificarea NOVA, respingerea solicitărilor neautorizate, CSRF/state, excluderea scope-urilor de tranzacționare și fluxul cu cont real de test.
5. Se activează \`KRAKEN_OAUTH_ENABLED=true\` și se verifică schimbul de tokenuri + deconectarea.
6. Se implementează separat vizualizarea soldului REAL, după clarificarea API-ului și acordul furnizorului; aceasta trebuie marcată distinct, fără să modifice portofelul DEMO.

Verificări CI: \`node --test tests.test.js online.test.js market.test.js wallet.test.js exchange.test.js kraken-oauth.test.js\`.

## 6. Separarea fondurilor

- Cont Kraken real: gestionat extern de Kraken, fără fonduri în NOVA.
- Portofel NOVA DEMO și Harvest PAPER: exclusiv bani fictivi, fără opțiuni de conversie/retragere.
- Zero recompense, XP, comisioane sau „profit” pe baza depunerilor reale sau recrutării.
