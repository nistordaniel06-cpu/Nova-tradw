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
