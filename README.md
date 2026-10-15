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
## Comunitate: Battle Pass și echipe (Demo)

- Fiecare cont local primește 20 de tranzacții simulate disponibile pe zi. Nivelurile Battle Pass cresc capacitatea la 40 / 60 / 80 / 100, nu reprezintă un minim obligatoriu.
- XP pentru maximum primele cinci tranzacții demo închise într-o zi (+15 XP per închidere, maxim 75 XP/zi).
- Patru micro-lecții cu întrebări (+30 XP o singură dată pentru răspuns corect la fiecare). Utilizatorii pot progresa fără referral.
- Battle Pass: Rookie (0 XP / 20), Bronze (40 XP / 40), Silver (90 XP / 60), Gold (170 XP / 80), Diamond (280 XP / 100).
- Cod de invitație demo, link de partajare și acceptare locală în browser. În acest MVP NU există conturi sincronizate, echipe verificate sau membri confirmați.
- Invitațiile nu acordă bani, XP automat sau avantaje din depunerile ori recrutarea altora.
- Sezonul actual e demonstrativ și nu are încă dată de încheiere; resetarea contului demo resetează progresul.

### De implementat pentru echipe reale
1. Auth cu confirmare email și conturi unice, server-side; fără posibilitate ca un utilizator să-și genereze singur „membri validați”.
2. Tabele cu utilizatori / echipe / invitații și o relație opțională mentor–membru; fără comisioane financiare în lanț.
3. Acceptarea unei invitații o singură dată, cu verificare și audit server-side; fără recompense pentru depuneri.
4. Pagina echipei arată doar membri reali verificați care și-au dat consimțământul.
5. Motorul de cote și XP trebuie mutat pe backend înainte de clasamente, recompense sau abonamente plătite.
6. Orice sistem de referral comercial viitor poate recompensa numai vânzarea unui produs educațional real, transparent și conform legislației; nu înscrieri / depuneri / investiții.

Teste: `node --check engine.js && node --check progression.js && node --check community.js && node --check app.js && node --test tests.test.js`.