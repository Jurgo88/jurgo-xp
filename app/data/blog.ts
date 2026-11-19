import type { L10n } from './l10n'

// Blog posts. Each one opens as a .txt file in Notepad (/notepad?file=<slug>).
// Body is plain text: a blank line starts a new paragraph (the Notepad window uses white-space: pre-wrap).
// Only real facts here, no invented numbers.

export interface BlogPost {
  slug: string
  date: string
  title: L10n
  /** one or two sentences; used by the AI assistant instead of the whole body */
  summary: L10n
  body: L10n
  draft?: boolean
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'xp-desktop-in-one-night',
    date: '2026-11-19',
    title: {
      sk: 'Ako som si za jednu noc prerobil web na Windows XP',
      en: 'How I rebuilt my website as Windows XP in one night',
    },
    summary: {
      sk: 'Prvý návrh nového webu vyzeral ako každé AI portfólio, tak som z neho spravil plochu Windows XP. S Claude Code za jeden večer a noc: Nuxt 4, Webamp so Spotify, florbalové štatistiky a AI asistent v štýle MSN.',
      en: 'The first draft of my new site looked like every AI portfolio, so I turned it into a Windows XP desktop. Built with Claude Code over one evening and night: Nuxt 4, Webamp with Spotify, floorball stats and an MSN-style AI assistant.',
    },
    body: {
      sk: `Hľadám prácu, takže som potreboval nový web. Prvý návrh som mal rýchlo: rozdelená obrazovka, veľký nadpis, pár kariet s projektmi. Vyzeral presne ako každé druhé portfólio, ktoré dnes vypadne z AI. Nebolo na ňom nič moje.

Tak som sa vrátil k niečomu, čo som už raz robil: plocha Windows XP v prehliadači. Mal som k tomu starší projekt a XP mám rád. Tentoraz to ale mal byť celý web, nie hračka.

ČO TU NÁJDEŠ

- Každé okno je samostatná stránka s vlastnou URL (/frontend, /cv, /sk/floorball...). Všetko sa prerenderuje, takže recruiter môže poslať priamy odkaz a vyhľadávač vidí reálny obsah.
- Winamp je skutočný Winamp, presnejšie Webamp. V playliste je, čo práve počúvam na Spotify, a prehrávač je pripnutý pod ním.
- Florbalové okno ukazuje štatistiky môjho tímu Dynamo TyPilsi. Skript si ich stiahne z webu ligy a GitHub Action ho spúšťa dvakrát do týždňa, takže čísla sa obnovujú samé.
- AI asistent v štýle MSN Messengera odpovedá na otázky o mne. Beží na Claude API cez Netlify funkciu, odpovede streamuje a má limity aj tvrdý denný strop na náklady.
- V Koši je modrá obrazovka smrti, v Hrách Hľadanie mín a Solitér a po chvíli nečinnosti naskočí šetrič.
- Na mobile je mriežka ikon a pre tých, čo chcú len fakty, je tu klasický pohľad na CV.

AKO TO VZNIKLO

Technicky je to Nuxt 4, Vue 3, TypeScript, Pinia, xp.css a Webamp, hostované na Netlify. Prvý commit je z večera 18. novembra, posledné úpravy CV z rána, a medzi tým je trinásť pull requestov.

Väčšinu kódu napísal Claude Code. Moja práca bola rozhodovať, čo chcem, kontrolovať, čo vzniklo, a skúšať to v prehliadači. Každá zmena išla cez vlastný pull request a Netlify náhľad, takže som videl výsledok skôr, než išiel von.

ČO SI Z TOHO BERIEM

AI mi ušetrila hodiny písania kódu, ale nerozhodla za mňa, ako má web vyzerať. Ten prvý generický návrh bol presne to, čo dostaneš, keď rozhodovanie nechá na nej. Čím rýchlejšie sa dá kód napísať, tým viac záleží na tom, čo vlastne chceš postaviť.

A je to zábava. Dlho som nemal z vlastného webu takú radosť.`,
      en: `I'm looking for a job, so I needed a new website. The first draft came together fast: split screen, big headline, a few project cards. It looked exactly like every other portfolio an AI spits out today. Nothing about it was mine.

So I went back to something I had built before: a Windows XP desktop in the browser. I had an older project like that and I just like XP. This time it had to be the whole site, not a toy.

WHAT YOU'LL FIND HERE

- Every window is its own page with its own URL (/frontend, /cv, /sk/floorball...). Everything is prerendered, so a recruiter can share a direct link and search engines see real content.
- Winamp is a real Winamp, well, Webamp. The playlist shows what I'm listening to on Spotify right now, with the player docked underneath.
- The floorball window shows my team Dynamo TyPilsi. A script pulls the stats from the league website and a GitHub Action runs it twice a week, so the numbers update themselves.
- An MSN Messenger style AI assistant answers questions about me. It runs on the Claude API through a Netlify Function, streams its answers and has rate limits plus a hard daily cost cap.
- There's a Blue Screen of Death in the Recycle Bin, Minesweeper and Solitaire in Games, and a screensaver kicks in when you go idle.
- On mobile you get an icon grid, and if you just want the facts there's a classic CV view.

HOW IT WAS BUILT

Under the hood it's Nuxt 4, Vue 3, TypeScript, Pinia, xp.css and Webamp, hosted on Netlify. The first commit is from the evening of November 18, the last CV tweaks from the morning after, and there are thirteen pull requests in between.

Claude Code wrote most of the code. My job was deciding what I wanted, checking what came out and trying it in the browser. Every change went through its own pull request and a Netlify preview, so I saw the result before it went live.

WHAT I TAKE FROM IT

AI saved me hours of typing code, but it didn't decide what the site should look like. That first generic draft is exactly what you get when you leave the deciding to it. The faster code gets written, the more it matters what you actually want to build.

And it's fun. I haven't enjoyed my own website this much in a long time.`,
    },
  },
  {
    slug: 'rag-that-says-i-dont-know',
    date: '2026-11-19',
    title: {
      sk: 'RAG, ktorý vie povedať „neviem“',
      en: 'A RAG assistant that can say "I don\'t know"',
    },
    summary: {
      sk: 'RAG Against the Machine: slovenský RAG asistent, ktorý odpovedá len z dokumentov, cituje zdroje a radšej odmietne, než by si vymýšľal. Kvalitu meria eval set so 40 otázkami.',
      en: 'RAG Against the Machine: a Slovak RAG assistant that answers only from documents, cites its sources and refuses rather than makes things up. Quality is measured with a 40-question eval set.',
    },
    body: {
      sk: `Väčšina RAG ukážok vyzerá dobre, kým sa ich neopýtaš niečo, čo v dátach nie je. Vtedy model sebavedomo odpovie aj tak. Chcel som postaviť asistenta, ktorý to nerobí, a chcel som to vedieť zmerať, nie len tvrdiť.

Projekt sa volá RAG Against the Machine. Je to slovenský asistent nad internou znalostnou bázou firmy. Odpovedá len z dodaných dokumentov, každé tvrdenie cituje a keď odpoveď v dátach nie je, povie to.

AKO FUNGUJE

Dokumenty v Markdowne sa rozdelia podľa nadpisov. Kúsok textu nikdy nepresiahne hranicu sekcie, takže každý má jasnú cestu nadpisov, napríklad „Dovolenka > Prenos dovolenky“. Táto cesta ide aj do embeddingu, lebo krátke kúsky textu sa bez kontextu hľadajú zle.

Embeddingy sú v Postgrese s pgvector. Funguje to lokálne v Dockeri aj na Supabase, líši sa len connection string. Na otázku sa nájde päť najpodobnejších kúskov a model dostane pokyn odpovedať len z nich a citovať ich ako [1], [2].

DVE POISTKY

Odmietnutie je v tomto projekte platná odpoveď, nie chyba. Preto sú dve poistky:

- Ak je aj najpodobnejší kúsok pod nastaveným prahom podobnosti, jazykový model sa vôbec nezavolá. Ušetrí to peniaze aj vymýšľanie.
- Ak model zavolaný je, má presne danú vetu, ktorou odmieta: „V dostupných dokumentoch som odpoveď nenašiel.“ Vďaka tomu eval spoľahlivo pozná, kedy odmietol.

Text v dokumentoch sa navyše berie ako dáta, nie pokyny, aby sa asistent nedal ovládať cez obsah, ktorý číta.

EVAL NAMIESTO POCITU

Súčasťou repa je eval set so 40 otázkami nad syntetickou zamestnaneckou príručkou vymyslenej firmy. Na 35 z nich odpoveď v dátach je, na 5 nie je a systém ich musí odmietnuť. Eval meria, či sa našla správna sekcia, či odpoveď obsahuje očakávané fakty, či sedia citácie a koľko odmietnutí bolo správnych alebo zbytočných. Každý beh sa uloží aj s nastavením, takže viem porovnať, čo zmenila iná veľkosť kúskov, iný prah alebo iný model.

Úprimne: prvý ostrý beh s reálnymi modelmi a ladenie parametrov je ďalší krok, takže čísla zatiaľ nemám. Zverejním ich, keď budú.

ČO SOM SA NAUČIL UŽ TERAZ

- Rozhrania od začiatku. Embeddingy, jazykový model aj úložisko sú vymeniteľné cez premennú prostredia. Testovacie „fake“ verzie spustia celú pipeline bez API kľúča a bez nákladov.
- Opakovaný import nesmie nič rozbiť. Nezmenený dokument sa podľa hashu preskočí, zmenený sa vymení naraz.
- Najprv špecifikácia, potom kód. Každý modul má najprv popis a až keď sedí, ide sa písať. S Claude Code to funguje výrazne lepšie než „sprav mi RAG“.

Ďalej v pláne: hybridné vyhľadávanie s fulltextom pre slovenčinu, LLM ako sudca pre presnosť odpovedí a eval priamo v CI, kde regresia znamená červený build.`,
      en: `Most RAG demos look great until you ask them something that isn't in the data. Then the model answers confidently anyway. I wanted to build an assistant that doesn't do that, and I wanted to be able to measure it, not just claim it.

The project is called RAG Against the Machine. It's a Slovak-language assistant over a company's internal knowledge base. It answers only from the documents it's given, cites every claim, and when the answer isn't in the data, it says so.

HOW IT WORKS

Markdown documents are split by headings. A chunk never crosses a section boundary, so each one has a clear heading path, like "Vacation > Carrying over days". That path also goes into the embedding, because short chunks are hard to find without context.

Embeddings live in Postgres with pgvector. It runs locally in Docker or on Supabase, only the connection string differs. For each question the five most similar chunks are retrieved, and the model is told to answer only from them and cite them as [1], [2].

TWO SAFETY NETS

In this project a refusal is a valid answer, not a failure. So there are two safety nets:

- If even the best match is below a similarity threshold, the language model isn't called at all. That saves money and prevents made-up answers.
- If the model is called, it has one exact sentence to refuse with. That way the eval can reliably tell when it refused.

Text inside the documents is also treated as data, not instructions, so nobody can steer the assistant through the content it reads.

EVALS INSTEAD OF GUT FEELING

The repo includes an eval set of 40 questions over a synthetic employee handbook of a made-up company. 35 have their answer in the data, 5 don't, and the system has to refuse those. The eval measures whether the right section was retrieved, whether the answer contains the expected facts, whether the citations are right, and how many refusals were correct or unnecessary. Every run is saved together with its settings, so I can compare what a different chunk size, threshold or model actually changed.

To be honest: the first real run with live models and the tuning are the next step, so I don't have numbers yet. I'll publish them when I do.

WHAT I'VE ALREADY LEARNED

- Interfaces from day one. Embeddings, the language model and the vector store are all swappable with an environment variable. "Fake" versions run the whole pipeline without an API key and without costs.
- Re-importing must never break anything. An unchanged document is skipped based on its hash, a changed one is replaced in one go.
- Spec first, code second. Every module gets a written spec before any code, and only once it's right do we start. With Claude Code that works far better than "build me a RAG".

Next up: hybrid search with Slovak full-text, an LLM judge for answer groundedness, and running the eval in CI, where a regression means a red build.`,
    },
  },
  {
    slug: 'working-with-ai-coding-tools',
    date: '2026-11-19',
    title: {
      sk: 'Ako pracujem s AI pri programovaní',
      en: 'How I work with AI coding tools',
    },
    summary: {
      sk: 'Praktické poznámky fullstack vývojára, ktorý s Claude Code pracuje denne: špecifikácia pred kódom, malé kroky cez pull requesty, fakty namiesto voľnej ruky, merať namiesto odhadovať a rozhodnutia nechať človeku.',
      en: 'Practical notes from a fullstack developer who uses Claude Code every day: spec before code, small steps through pull requests, facts instead of free rein, measure instead of guess, and keep the decisions human.',
    },
    body: {
      sk: `Claude Code používam denne, na klientskych projektoch aj na vlastných produktoch. Nie som v tom žiadny guru, ale za ten čas sa mi ustálilo pár pravidiel, bez ktorých by mi AI viac pokazila, než pomohla.

1. NAJPRV ŠPECIFIKÁCIA, POTOM KÓD

„Sprav mi RAG“ alebo „sprav mi web“ dopadne ako priemer všetkého, čo model kedy videl. Keď najprv napíšem, čo presne má modul robiť, aké má rozhrania a čo do neho nepatrí, a až potom pustím AI ku kódu, výsledok je iný. Pri RAG projekte má každý modul vlastný súbor so špecifikáciou a písať sa začne až po jej odsúhlasení.

2. MALÉ KROKY A KAŽDÝ CEZ PULL REQUEST

AI vie za minútu prepísať pol projektu. Práve preto chcem každú zmenu samostatne: vlastný pull request, vlastný náhľad na Netlify, pozriem diff a skúsim to v prehliadači. Keď sa niečo pokazí, viem presne kde. Tento web vznikol takto za jednu noc a stále viem, ktorý krok čo zmenil.

3. FAKTY, NIE VOĽNÁ RUKA

Modely radi dopĺňajú čísla, ktoré znejú dobre. V produkte JAPS, ktorý generuje portfólio z nasadených webov a ich repozitárov, preto platí jednoduché pravidlo: texty vznikajú len z vytiahnutých faktov a každé číslo, ktoré vo faktoch nie je, sa zamietne. To isté robím aj pri bežnej práci. Čím viac kontextu a dát dám, tým menej si AI musí domýšľať.

4. MERAŤ, NIE ODHADOVAŤ

Pri AI funkciách je lákavé povedať „zdá sa, že to funguje“. Lepšie je mať pár desiatok otázok so známou správnou odpoveďou a po každej zmene ich spustiť znova. Pri bežnom kóde tú istú úlohu robia testy. Ak sa to nedá overiť, neviem, či zmena pomohla.

5. AI MÔŽE ROBIŤ REVIEW, ROZHODUJEM JA

Mám nastavené code review pull requestov s Claude cez GitHub Actions, automatické aj na požiadanie. Nájde veci, ktoré by som prehliadol. Merge však robí človek.

6. AI V PRODUKCII POTREBUJE LIMITY

Keď AI beží pre návštevníkov, ako asistent na tomto webe, musí mať limity na počet správ a strop na denné náklady. Nastavuje sa to päť minút a ušetrí to nepríjemné ráno.

ČO OSTÁVA NA MNE

Pochopiť problém, rozhodnúť, čo sa stavia a čo nie, a povedať „toto vyzerá ako každé iné AI portfólio, skúsme niečo iné“. AI výrazne zrýchlila písanie kódu. O to dôležitejšie je, kto rozhoduje, čo sa píše.`,
      en: `I use Claude Code every day, on client projects and on my own products. I'm no guru, but over time I've settled on a few rules without which AI would break more things than it fixes.

1. SPEC FIRST, CODE SECOND

"Build me a RAG" or "build me a website" ends up as the average of everything the model has ever seen. When I first write down what exactly a module should do, what its interfaces are and what doesn't belong in it, and only then let the AI write code, the result is different. In my RAG project every module has its own spec file, and coding starts only after it's agreed.

2. SMALL STEPS, EACH THROUGH A PULL REQUEST

AI can rewrite half a project in a minute. That's exactly why I want every change on its own: its own pull request, its own Netlify preview, I read the diff and try it in the browser. When something breaks, I know exactly where. This website was built like that in one night, and I still know which step changed what.

3. FACTS, NOT FREE REIN

Models love filling in numbers that sound good. In JAPS, my product that generates a portfolio from deployed sites and their repos, there's a simple rule: copy is generated only from extracted facts, and any number that isn't in the facts gets rejected. I do the same in everyday work. The more context and data I give, the less the AI has to guess.

4. MEASURE, DON'T GUESS

With AI features it's tempting to say "looks like it works". Better to have a few dozen questions with known correct answers and rerun them after every change. For regular code, tests do the same job. If I can't check it, I don't know whether the change helped.

5. AI CAN REVIEW, I DECIDE

I have pull request code review with Claude set up through GitHub Actions, both automatic and on request. It catches things I would miss. But a human does the merge.

6. AI IN PRODUCTION NEEDS LIMITS

When AI runs for visitors, like the assistant on this site, it needs a cap on messages and a cap on daily cost. It takes five minutes to set up and saves you an unpleasant morning.

WHAT STAYS WITH ME

Understanding the problem, deciding what gets built and what doesn't, and saying "this looks like every other AI portfolio, let's try something else". AI made writing code a lot faster. That makes it matter even more who decides what gets written.`,
    },
  },
]
