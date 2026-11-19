Väčšina RAG ukážok vyzerá dobre, kým sa ich neopýtaš niečo, čo v dátach nie je. Vtedy model sebavedomo odpovie aj tak. Chcel som postaviť asistenta, ktorý to nerobí, a chcel som to vedieť zmerať, nie len tvrdiť.

Projekt sa volá RAG Against the Machine. Je to slovenský asistent nad internou znalostnou bázou firmy. Odpovedá len z dodaných dokumentov, každé tvrdenie cituje a keď odpoveď v dátach nie je, povie to.

## Ako funguje

Dokumenty v Markdowne sa rozdelia podľa nadpisov. Kúsok textu nikdy nepresiahne hranicu sekcie, takže každý má jasnú cestu nadpisov, napríklad „Dovolenka > Prenos dovolenky“. Táto cesta ide aj do embeddingu, lebo krátke kúsky textu sa bez kontextu hľadajú zle.

Embeddingy sú v Postgrese s pgvector. Funguje to lokálne v Dockeri aj na Supabase, líši sa len connection string. Na otázku sa nájde päť najpodobnejších kúskov a model dostane pokyn odpovedať len z nich a citovať ich ako [1], [2].

## Dve poistky

Odmietnutie je v tomto projekte platná odpoveď, nie chyba. Preto sú dve poistky:

- Ak je aj najpodobnejší kúsok pod nastaveným prahom podobnosti, jazykový model sa vôbec nezavolá. Ušetrí to peniaze aj vymýšľanie.
- Ak model zavolaný je, má presne danú vetu, ktorou odmieta: „V dostupných dokumentoch som odpoveď nenašiel.“ Vďaka tomu eval spoľahlivo pozná, kedy odmietol.

Text v dokumentoch sa navyše berie ako dáta, nie pokyny, aby sa asistent nedal ovládať cez obsah, ktorý číta.

## Eval namiesto pocitu

Súčasťou repa je eval set so 40 otázkami nad syntetickou zamestnaneckou príručkou vymyslenej firmy. Na 35 z nich odpoveď v dátach je, na 5 nie je a systém ich musí odmietnuť. Eval meria, či sa našla správna sekcia, či odpoveď obsahuje očakávané fakty, či sedia citácie a koľko odmietnutí bolo správnych alebo zbytočných. Každý beh sa uloží aj s nastavením, takže viem porovnať, čo zmenila iná veľkosť kúskov, iný prah alebo iný model.

Úprimne: prvý ostrý beh s reálnymi modelmi a ladenie parametrov je ďalší krok, takže čísla zatiaľ nemám. Zverejním ich, keď budú.

## Čo som sa naučil už teraz

- Rozhrania od začiatku. Embeddingy, jazykový model aj úložisko sú vymeniteľné cez premennú prostredia. Testovacie „fake“ verzie spustia celú pipeline bez API kľúča a bez nákladov.
- Opakovaný import nesmie nič rozbiť. Nezmenený dokument sa podľa hashu preskočí, zmenený sa vymení naraz.
- Najprv špecifikácia, potom kód. Každý modul má najprv popis a až keď sedí, ide sa písať. S Claude Code to funguje výrazne lepšie než „sprav mi RAG“.

Ďalej v pláne: hybridné vyhľadávanie s fulltextom pre slovenčinu, LLM ako sudca pre presnosť odpovedí a eval priamo v CI, kde regresia znamená červený build.
