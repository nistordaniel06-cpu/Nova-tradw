# Portofel crypto DEMO → Harvest PAPER

## Ce funcționează

- Contul demonstrativ începe cu **5.000 USDT virtuali** în Harvest, plus un **portofel crypto de exercițiu** cu 1.000 USDT / 0,012 BTC / 0,15 ETH / 1,5 SOL fictive.
- Din pagina Wallet, poți muta USDT demo în Harvest 1:1. BTC/ETH/SOL demo se convertesc după cotația publică Kraken bid și un **comision fictiv 0,10%**.
- Dacă cotația pentru BTC/ETH/SOL lipsește ori expiră, mutarea e refuzată. Nu se inventează prețuri pentru creditarea Harvest.
- Poți muta înapoi exclusiv din numerarul virtual disponibil Harvest către soldul USDT demo; nu din marja deja blocată în poziții.
- Fiecare transfer este înregistrat în `state.walletDemo.transfers` cu cantitate, monedă, preț de referință, comision, sold și timestamp.
- Rezultatele și progresia Easy/Pro exclud transferurile dintre portofele; fondurile virtuale transferate nu se contabilizează ca profit.
- Datele sunt stocate local în browser, nu au verificare anti-fraudă și NU sunt potrivite pentru competiții reale sau plăți.

## Delimitare obligatorie

**Aceasta NU este alimentare cu crypto real.** Nu există adrese blockchain, depuneri on-chain, tranzacții reale, custodie, schimb de active reale, încasări de la utilizatori sau retrageri. Soldurile demonstrative nu pot fi convertite în bani, nu produc dobândă și nu garantează un randament.

Motiv: Harvest este un simulator PAPER. Utilizarea depunerilor reale pentru a crea un sold cu rezultate virtuale, într-un produs care include referral și niveluri, ar putea induce utilizatorii în eroare și ar crea riscuri serioase de conformitate. Echipele și referral-ul nu primesc comisioane din transferuri.

## Dacă se dorește ulterior crypto real

Înainte de orice tranzacție reală: produs financiar separat, analiză juridică MiCA/AML/KYC și jurisdicții, furnizor autorizat, segregare fonduri, registre server-authoritative, reconciliere cu blockchain și mecanisme de retragere transparente. În niciun caz fonduri realimentate în randamente simulatoare ori plăți MLM din depuneri.

Pentru plăți reale ale abonamentelor educaționale, poate fi proiectat un checkout separat cu procesator de plăți, preț, factură, verificare webhook și rambursări.

## Verificare

`node --check wallet.js && node --check app.js && node --test tests.test.js online.test.js market.test.js wallet.test.js`

Demo prezentare: Navigator → Wallet → Transferă în Harvest (DEMO) → Harvest. După transfer, verificați în istoric că soldul a crescut, dar rezultatul tranzacționării și XP-ul nu au fost afectate.