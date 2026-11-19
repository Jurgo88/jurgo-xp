S mojím predošlým webom som nebol spokojný. Nie po vizuálnej stránke, vyzeral v pohode. Chcel som ale niečo osobnejšie a originálne, nie ďalší web, ktorý už na prvý pohľad kričí, že ho spravila AI.

Nápad s plochou Windows XP v prehliadači som mal už v roku 2022. Prvú verziu som robil čisto v JavaScripte, v januári 2024 som ju prerobil do Vue a teraz som jej konečne dal finálnu podobu. Tentoraz to už nie je hračka bokom, ale celý môj web.

## Čo tu nájdeš

- Každé okno je samostatná stránka s vlastnou URL (`/frontend`, `/cv`, `/sk/floorball`...). Všetko sa prerenderuje, takže recruiter môže poslať priamy odkaz a vyhľadávač vidí reálny obsah.
- Winamp je skutočný Winamp, presnejšie Webamp. V playliste je, čo práve počúvam na Spotify, a prehrávač je pripnutý pod ním.
- Florbalové okno ukazuje štatistiky môjho tímu Dynamo TyPilsi. Skript si ich stiahne z webu ligy a GitHub Action ho spúšťa dvakrát do týždňa, takže čísla sa obnovujú samé.
- AI asistent v štýle MSN Messengera odpovedá na otázky o mne. Beží na Claude API cez Netlify funkciu, odpovede streamuje a má limity aj tvrdý denný strop na náklady.
- V Koši je modrá obrazovka smrti, v Hrách Hľadanie mín a Solitér a po chvíli nečinnosti naskočí šetrič.
- Na mobile je mriežka ikon a pre tých, čo chcú len fakty, je tu klasický pohľad na CV.

## Ako to vzniklo

Technicky je to Nuxt 4, Vue 3, TypeScript, Pinia, xp.css a Webamp, hostované na Netlify. Prvý commit je z večera 18. novembra, posledné úpravy CV z rána, a medzi tým je trinásť pull requestov.

Väčšinu kódu napísal Claude Code. Moja práca bola rozhodovať, čo chcem, kontrolovať, čo vzniklo, a skúšať to v prehliadači. Každá zmena išla cez vlastný pull request a Netlify náhľad, takže som videl výsledok skôr, než išiel von.

## Čo si z toho beriem

AI mi ušetrila hodiny písania kódu, ale nerozhodla za mňa, ako má web vyzerať. Generický web, ktorý kričí „AI“, je presne to, čo dostaneš, keď rozhodovanie necháš na nej. Čím rýchlejšie sa dá kód napísať, tým viac záleží na tom, čo vlastne chceš postaviť.

A je to zábava. Dlho som nemal z vlastného webu takú radosť.
