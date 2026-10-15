# NOVA Online: Supabase Auth + echipe reale (etapa de integrare)

> IMPORTANT: Acest PR pregătește codul, NU modifică nicio bază de date existentă. Nu este activă încă înregistrarea reală. Harvest/Long/Short/XP/sold rămân exclusiv simulări locale.

## Pași de activare (după aprobarea proiectului și a costului Supabase)

1. Creează **un proiect Supabase nou și dedicat NOVA**, diferit de SalonOS, Barbercraft, Booking, Domn etc. Nu aplica scriptul în alte proiecte.
2. În noul proiect, aplică migrarea `supabase/migrations/20261015_nova_auth_teams.sql` prin Supabase migrations / SQL Editor sau prin integrarea Supabase după aprobarea utilizatorului. Scriptul creează numai tabelele `nova_*` și un trigger limitat la baza dedicată.
3. În Supabase > Authentication > Providers, activează Email și confirmarea adresei de email. Folosește parole de minimum 8 caractere; recomandat: protecție antibot și rate limiting.
4. În Authentication > URL Configuration, configurează **Site URL** cu domeniul NOVA și adaugă în **Redirect URLs** domeniul de preview și de producție. Nu pune localhost pentru producție.
5. În Project Settings > API, copiază `Project URL` și **publishable API key**. Introdu doar aceste două valori în `config.js` (cheie PUBLICĂ). **Nu** introduce `service_role`, `sb_secret`, acces DB sau alte chei private în GitHub/browser.
6. Publică din nou branch-ul după configurare. Apasă `Cont online` în aplicație și verifică emailul de confirmare.
7. Creează un cont A și o echipă A. Copiază linkul UUID al echipei. Creează un cont B cu alt email confirmat; deschide linkul, autentifică-te și acceptă invitația.
8. Verifică afișarea membrilor direcți în contul A, ascunderea numelui implicit, opțiunea voluntară de partajare a numelui și părăsirea echipei.

## Ce funcționează online după activare

- Supabase Auth: înregistrare, email de verificare, logare și deconectare.
- Profil separat pentru cont; numele poate fi modificat doar de proprietarul său verificat prin RPC.
- O echipă proprie per persoană cu nume și cod de invitație UUID unic.
- Fiecare persoană poate fi invitată voluntar de un singur părinte/mentor și își poate crea, independent, propria echipă — arbore de recomandări.
- Interzicere auto-invitare, prevenire cicluri, verificare email, audit de bază prin timestamp.
- Numai membrul își decide afișarea numelui către invitator. Altfel apare «Participant anonim». Nu sunt afișate emailurile altor persoane.

## Ce NU funcționează încă

- NU sunt sincronizate pe server portofelul demo, tranzacțiile, cote zilnice, Battle Pass sau XP.
- NU există clasament server-authoritative, comisioane sau bani reali, plăți, retrageri, randamente garantate, recompense pentru depuneri.
- NU există management de expirare/rotație a invitațiilor, moderare, limite antifraudă avansate, audit formal ori test end-to-end pe baza de date. Codurile UUID oferă entropie mare, dar nu înlocuiesc toate controalele de producție.
- NU există sincronizare automată GitHub–Vercel; publicarea preview-ului este separată.

## Securitate implementată în schema pregătită

- Row Level Security activ pe toate tabelele NOVA. Citire directă: profilul propriu și echipa proprie; fără acces direct la relațiile referral.
- Funcțiile RPC `SECURITY DEFINER` validează `auth.uid()` și emailul confirmat, folosesc `search_path=''`, blochează înscrieri duplicate și auto-invitarea.
- Arborele poate avea subechipe; un utilizator își poate crea echipa proprie chiar dacă are un invitator.
- Datele personale nu se publică prin invitație; numai numele echipei poate fi previzualizat prin cod.
- Funcțiile nu dau bani, XP sau alte avantaje economice pentru înscriere.

## Dezvoltare / verificări

`node --check engine.js && node --check progression.js && node --check community.js && node --check account.js && node --check online-ui.js && node --check app.js`

`node --test tests.test.js online.test.js`

**Notă:** testele de cod nu înlocuiesc migrarea executată într-un Supabase dedicat și o revizie SQL/RLS plus teste autentificate cu două conturi.

## Schema

| Tabel | Ce conține |
|---|---|
| `nova_profiles` | identificator Auth, nume afișat |
| `nova_teams` | echipe și coduri UUID de invitație pentru proprietar |
| `nova_referrals` | relație membru -> invitator, consimțământ pentru nume |

Următoarea etapă după testare: server-side daily usage, progres Battle Pass semnat și un jurnal auditabil de tranzacții demo, fără depuneri financiare sau remunerație piramidală.