# NOVA Paper Trading V2 — cotații reale, fonduri virtuale

## Implementare

- Flux public **Kraken Spot**, read-only: BTC/USD, ETH/USD, SOL/USD.
- Proxy Vercel `api/market.js`: doar GET, simboluri allow-list, fără credențiale, timeout, validări, cache scurt.
- Browser `market.js`: actualizează cotațiile aproximativ la 12 secunde și lumânările OHLC la 60 de secunde. Dacă o cotație are peste 30 secunde, aplicația refuză să deschidă/închidă ordine noi pe acea pereche.
- Graficele folosesc OHLC obținute de la Kraken, agregate la 1m/5m/15m; nu generăm lumânări false când nu avem date.
- Harvest PAPER: cumpără virtual la ASK din snapshot public Kraken și vinde virtual la BID din snapshotul de după ~2 secunde. Comision demo de 0,05% pe fiecare sens. Profitul NU este garantat. De fapt, spread-ul și comisioanele produc frecvent PnL negativ.
- Manual Long/Short PAPER: Long intră la ASK și iese la BID; Short intră la BID și iese la ASK; comisioane identice. Soldul este fictiv, iar valorile în USD sunt folosite drept prețuri de referință pentru unitățile virtuale USDT ale aplicației, aproximativ 1:1 pentru scopul demo.
- Dacă fluxul e indisponibil, tranzacțiile noi sunt blocate. Pozițiile deschise rămân în jurnal pentru închidere după reconectare; vizualizarea portofoliului poate arăta ultima cotație cunoscută.
- Battle Pass 20–100 ordine/zi, Easy/Pro și echipele sunt păstrate ca demo, fără plăți reale.

## Depuneri crypto — intenția de produs, NU implementare

Utilizatorul dorește posibilitatea de a plăti cu crypto. Nu implementăm adrese de depunere, acceptarea custodială a activelor, criptoalimentarea soldului demo sau investițiile cu randament promis. Cu o astfel de combinație, confuzia dintre profitul simulat, MLM și banii reali ar fi inacceptabilă.

Singura integrare crypto planificată pe termen scurt este un checkout pentru un **abonament educațional real**; banii ar fi procesați de un furnizor verificat, nu de un wallet controlat de NOVA. Înainte de activare trebuie:

1. Un produs real clar descris (ex. materiale NOVA Pro, suport, analize educaționale), cu tarif afișat, condiții de utilizare și politică de anulare/rambursare.
2. Verificare juridică și contabilă UE/România: MiCA, AML/CFT, obligații fiscale, obligații consumator, posibilă necesitate de provider autorizat pentru anumite servicii.
3. Alegerea unui procesator de plăți adecvat jurisdicției, documentarea KYC/KYB și administrarea plăților fără custodie proprie.
4. Webhook verificat pe server, idempotency, reconciliere, facturare, suport pentru erori/refunduri; niciun eveniment din client nu acordă singur abonamente.
5. Fondurile din abonament **nu cresc soldul virtual** și nu activează bonusuri pe lanțuri de referral.

Surse oficiale: https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-60-provision-crypto-asset-services
și https://www.esma.europa.eu/sites/default/files/2026-04/ESMA75-113276571-1679_Statement_on_the_end_of_transitional_periods_under_MiCA.pdf

## Teste

`node --check api/market.js && node --check market.js && node --check app.js`

`node --test tests.test.js online.test.js market.test.js`

Acest simulator nu este adecvat pentru utilizare ca exchange, broker, custode sau platformă de depozite.