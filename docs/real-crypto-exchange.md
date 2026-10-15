# Crypto Real — Gateway extern Kraken Pro, fără custodie NOVA

## Funcțional, acum

În **Wallet → Crypto Real**, utilizatorul poate accesa https://pro.kraken.com într-o pagină separată, poate citi instrucțiunile de depunere/retragere direct de la Kraken și poate reveni în NOVA.

Linkurile sunt fixe, oficiale, fără adrese de depunere inventate sau URL-uri controlate de utilizatori. Browserul deschide o pagină externă cu `noopener noreferrer`.

- Kraken Pro (cont extern): https://pro.kraken.com
- Depuneri crypto, ghid RO: https://support.kraken.com/ro/articles/360000672643-how-to-deposit-cryptocurrencies-to-your-kraken-account
- Depuneri/retrageri Kraken Pro: https://support.kraken.com/articles/deposit-withdraw-on-the-kraken-pro-app
- Kraken Connect OAuth: https://docs-legacy.kraken.com/api/docs/oauth/kraken-connect/

**Toate fondurile reale rămân în contul utilizatorului la Kraken.** NOVA nu are acces la soldul lor, nu primește depuneri, nu intermediază tranzacții și nu oferă custodie. Utilizatorul nu introduce în NOVA parole, seed phrase, chei private sau chei API.

## Strictă separare PAPER/REAL

- Wallet DEMO rămâne complet fictiv (BTC/ETH/SOL/USDT virtual).
- Harvest folosește numai soldul virtual și date publice Kraken Spot; niciun depozit Kraken real nu este reflectat în cash, PnL, XP sau Battle Pass.
- Nu se atribuie bonusuri de recrutare sau comisioane din plăți ori depuneri.
- Modul Crypto Real nu are endpoint de transfer, nu colectează adrese blockchain și nu poate executa ordine reale.

## Viitor: autentificare Kraken Connect **doar pentru citire**

Pentru a vedea soldul extern într-un tab distinct fără chei copiate este necesar:
1. Înregistrarea NOVA ca client OAuth Kraken Connect și obținerea unui `client_id` valabil, cu URI de redirect verificat de furnizor.
2. Confirmarea condițiilor Kraken pentru clienți publici/confidențiali și cerințelor de securitate/tokens.
3. Limitarea permisiunilor la `account.fast-api-key:funds-query`; **fără** `funds-add`, `trades-modify`, `trades-close`, retrageri sau comenzi.
4. Cod de autorizare securizat, stare anti-CSRF, revocare sesiune, consimțământ, retenție minimă și stocare sigură a tokenurilor, cu verificare la furnizor.
5. Teste pe conturi de dezvoltare și revizuire juridică pentru modul real din UE/România înainte de activare. Verifică autorizarea furnizorului prin registrul oficial ESMA: https://www.esma.europa.eu/publications-and-data/databases-and-registers.

**Nu avem client_id Kraken provisionat și NU pretindem că există un cont OAuth conectat.** Până atunci modulul deschide numai site-ul Kraken.

## Verificare

`node --check exchange.js && node --check real-crypto-ui.js && node --test tests.test.js online.test.js market.test.js wallet.test.js exchange.test.js`

Din aplicație: `Wallet` → `Crypto Real` → `Deschide Kraken Pro`. Orice depunere se face numai prin UI-ul oficial Kraken, nu în NOVA.