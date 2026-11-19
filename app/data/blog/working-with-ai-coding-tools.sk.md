Claude Code používam denne, na klientskych projektoch aj na vlastných produktoch. Nie som v tom žiadny guru, ale za ten čas sa mi ustálilo pár pravidiel, bez ktorých by mi AI viac pokazila, než pomohla.

## 1. Najprv špecifikácia, potom kód

„Sprav mi RAG“ alebo „sprav mi web“ dopadne ako priemer všetkého, čo model kedy videl. Keď najprv napíšem, čo presne má modul robiť, aké má rozhrania a čo do neho nepatrí, a až potom pustím AI ku kódu, výsledok je iný. Pri RAG projekte má každý modul vlastný súbor so špecifikáciou a písať sa začne až po jej odsúhlasení.

## 2. Malé kroky a každý cez pull request

AI vie za minútu prepísať pol projektu. Práve preto chcem každú zmenu samostatne: vlastný pull request, vlastný náhľad na Netlify, pozriem diff a skúsim to v prehliadači. Keď sa niečo pokazí, viem presne kde. Tento web vznikol takto za jednu noc a stále viem, ktorý krok čo zmenil.

## 3. Fakty, nie voľná ruka

Modely radi dopĺňajú čísla, ktoré znejú dobre. V produkte JAPS, ktorý generuje portfólio z nasadených webov a ich repozitárov, preto platí jednoduché pravidlo: texty vznikajú len z vytiahnutých faktov a každé číslo, ktoré vo faktoch nie je, sa zamietne. To isté robím aj pri bežnej práci. Čím viac kontextu a dát dám, tým menej si AI musí domýšľať.

## 4. Merať, nie odhadovať

Pri AI funkciách je lákavé povedať „zdá sa, že to funguje“. Lepšie je mať pár desiatok otázok so známou správnou odpoveďou a po každej zmene ich spustiť znova. Pri bežnom kóde tú istú úlohu robia testy. Ak sa to nedá overiť, neviem, či zmena pomohla.

## 5. AI môže robiť review, rozhodujem ja

Mám nastavené code review pull requestov s Claude cez GitHub Actions, automatické aj na požiadanie. Nájde veci, ktoré by som prehliadol. Merge však robí človek.

## 6. AI v produkcii potrebuje limity

Keď AI beží pre návštevníkov, ako asistent na tomto webe, musí mať limity na počet správ a strop na denné náklady. Nastavuje sa to päť minút a ušetrí to nepríjemné ráno.

## Čo ostáva na mne

Pochopiť problém, rozhodnúť, čo sa stavia a čo nie, a povedať „toto vyzerá ako každé iné AI portfólio, skúsme niečo iné“. AI výrazne zrýchlila písanie kódu. O to dôležitejšie je, kto rozhoduje, čo sa píše.
