# NOVA Trade — Harvest Demo

Demo de prezentare, exclusiv cu bani virtuali.

## Funcționalități
- Ecran premium pentru telefon, în română
- Buton **Harvest**: tranzacție simulată de cumpărare + vânzare după aproximativ două secunde
- Scenarii explicite **Profit demonstrativ** / **Pierdere demonstrativă** (NU predicții ale pieței)
- Cont și sold în USDT fictivi, comision demo, grafic cu prețuri sintetice
- Registru cu toate tranzacțiile în ordinea efectuării, PnL, dată, sold după tranzacție
- Long/Short manual, închiderea pozițiilor, levier (virtual), resetarea contului
- Salvare locală în browser prin `localStorage`

**AVERTISMENT:** Nu este un exchange, nu tranzacționează active reale și nu garantează randamente. Prețurile și rezultatele sunt generate pentru o simulare educațională. Nu solicită plăți, portofele crypto sau conturi bancare.

## Pornire locală
Deschide `index.html` într-un browser modern sau servește fișierele static prin `python3 -m http.server 8080`.
Nu sunt necesare API keys, instalări sau costuri de infrastructură.

## Publicare
Conectează acest repository la Vercel, cu Framework Preset = Other, Root Directory = / și Build Command gol. Site static.

## Securitate
Datele sunt salvate doar pe dispozitiv, în browser. Nu folosi aplicația pentru fonduri reale. Nu există autentificare sau backend în versiunea demo.

## Easy / Pro — progresie educațională

NOVA **Easy** afișează un panou simplificat: Harvest DEMO, sold virtual, istoric și progres.
NOVA **Pro** activează tranzacții virtuale manuale Long/Short și grafice avansate numai după atingerea pragurilor de experiență.

| Nivel | Capital virtual maxim atins | Tranzacții finalizate | Beneficiu |
| --- | ---: | ---: | --- |
| Easy Explorer | Start | 0 | Harvest și portofel demo |
| Easy Plus | 5.005 USDT | 2 | Istoric și progres |
| Pro Trader | 5.025 USDT | 5 | Long/Short manual |
| Pro Elite | 5.100 USDT | 12 | Statut Elite |

La deblocare nivelul rămâne câștigat chiar dacă equity scade ulterior. Valorile sunt pur **virtuale** și verificabile în `progression.js`. Progresul se resetează odată cu contul demo. Datele se salvează local și pot fi modificate în browser, deci NU sunt potrivite pentru premii sau clasamente reale fără server și antifraudă.

## Model de afaceri permis / planificat (NU implementat)
- Abonament educațional opțional pentru materiale, analize AI și exerciții; fără randamente garantate
- Licențe B2B pentru școli și traineri
- Un eventual program transparent de afiliere cu recompensă fixă pentru vânzarea unui serviciu real, nu pentru depuneri ori recrutare în lanț

**Nu implementăm** piramide financiare, plăți către nivelurile superioare din depunerile membrilor, comisioane de la investiții, recrutare remunerată în lanț sau solduri reale mascate.

## Teste
Rulează `node --check app.js`, `node --check progression.js`, `node --check engine.js` și `node --test tests.test.js`.