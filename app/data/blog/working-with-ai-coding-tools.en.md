I use Claude Code every day, on client projects and on my own products. I'm no guru, but over time I've settled on a few rules without which AI would break more things than it fixes.

## 1. Spec first, code second

"Build me a RAG" or "build me a website" ends up as the average of everything the model has ever seen. When I first write down what exactly a module should do, what its interfaces are and what doesn't belong in it, and only then let the AI write code, the result is different. In my RAG project every module has its own spec file, and coding starts only after it's agreed.

## 2. Small steps, each through a pull request

AI can rewrite half a project in a minute. That's exactly why I want every change on its own: its own pull request, its own Netlify preview, I read the diff and try it in the browser. When something breaks, I know exactly where. This website was built like that in one night, and I still know which step changed what.

## 3. Facts, not free rein

Models love filling in numbers that sound good. In JAPS, my product that generates a portfolio from deployed sites and their repos, there's a simple rule: copy is generated only from extracted facts, and any number that isn't in the facts gets rejected. I do the same in everyday work. The more context and data I give, the less the AI has to guess.

## 4. Measure, don't guess

With AI features it's tempting to say "looks like it works". Better to have a few dozen questions with known correct answers and rerun them after every change. For regular code, tests do the same job. If I can't check it, I don't know whether the change helped.

## 5. AI can review, I decide

I have pull request code review with Claude set up through GitHub Actions, both automatic and on request. It catches things I would miss. But a human does the merge.

## 6. AI in production needs limits

When AI runs for visitors, like the assistant on this site, it needs a cap on messages and a cap on daily cost. It takes five minutes to set up and saves you an unpleasant morning.

## What stays with me

Understanding the problem, deciding what gets built and what doesn't, and saying "this looks like every other AI portfolio, let's try something else". AI made writing code a lot faster. That makes it matter even more who decides what gets written.
