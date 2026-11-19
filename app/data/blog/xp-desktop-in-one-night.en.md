I wasn't happy with my previous website. Not because of how it looked, it looked fine. I just wanted something more personal and original, not another site that screams "made by AI" at first glance.

I first had the idea of a Windows XP desktop in the browser back in 2022. I built the first version in plain JavaScript, rewrote it in Vue in January 2024, and now I've finally given it its final form. This time it isn't a side toy, it's my whole website.

## What you'll find here

- Every window is its own page with its own URL (`/frontend`, `/cv`, `/sk/floorball`...). Everything is prerendered, so a recruiter can share a direct link and search engines see real content.
- Winamp is a real Winamp, well, Webamp. The playlist shows what I'm listening to on Spotify right now, with the player docked underneath.
- The floorball window shows my team Dynamo TyPilsi. A script pulls the stats from the league website and a GitHub Action runs it twice a week, so the numbers update themselves.
- An MSN Messenger style AI assistant answers questions about me. It runs on the Claude API through a Netlify Function, streams its answers and has rate limits plus a hard daily cost cap.
- There's a Blue Screen of Death in the Recycle Bin, Minesweeper and Solitaire in Games, and a screensaver kicks in when you go idle.
- On mobile you get an icon grid, and if you just want the facts there's a classic CV view.

## How it was built

Under the hood it's Nuxt 4, Vue 3, TypeScript, Pinia, xp.css and Webamp, hosted on Netlify. The first commit is from the evening of November 18, the last CV tweaks from the morning after, and there are thirteen pull requests in between.

Claude Code wrote most of the code. My job was deciding what I wanted, checking what came out and trying it in the browser. Every change went through its own pull request and a Netlify preview, so I saw the result before it went live.

## What I take from it

AI saved me hours of typing code, but it didn't decide what the site should look like. A generic site that screams "AI" is exactly what you get when you leave the deciding to it. The faster code gets written, the more it matters what you actually want to build.

And it's fun. I haven't enjoyed my own website this much in a long time.
