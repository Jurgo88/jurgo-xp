Most RAG demos look great until you ask them something that isn't in the data. Then the model answers confidently anyway. I wanted to build an assistant that doesn't do that, and I wanted to be able to measure it, not just claim it.

The project is called RAG Against the Machine. It's a Slovak-language assistant over a company's internal knowledge base. It answers only from the documents it's given, cites every claim, and when the answer isn't in the data, it says so.

## How it works

Markdown documents are split by headings. A chunk never crosses a section boundary, so each one has a clear heading path, like "Vacation > Carrying over days". That path also goes into the embedding, because short chunks are hard to find without context.

Embeddings live in Postgres with pgvector. It runs locally in Docker or on Supabase, only the connection string differs. For each question the five most similar chunks are retrieved, and the model is told to answer only from them and cite them as [1], [2].

## Two safety nets

In this project a refusal is a valid answer, not a failure. So there are two safety nets:

- If even the best match is below a similarity threshold, the language model isn't called at all. That saves money and prevents made-up answers.
- If the model is called, it has one exact sentence to refuse with. That way the eval can reliably tell when it refused.

Text inside the documents is also treated as data, not instructions, so nobody can steer the assistant through the content it reads.

## Evals instead of gut feeling

The repo includes an eval set of 40 questions over a synthetic employee handbook of a made-up company. 35 have their answer in the data, 5 don't, and the system has to refuse those. The eval measures whether the right section was retrieved, whether the answer contains the expected facts, whether the citations are right, and how many refusals were correct or unnecessary. Every run is saved together with its settings, so I can compare what a different chunk size, threshold or model actually changed.

To be honest: the first real run with live models and the tuning are the next step, so I don't have numbers yet. I'll publish them when I do.

## What I've already learned

- Interfaces from day one. Embeddings, the language model and the vector store are all swappable with an environment variable. "Fake" versions run the whole pipeline without an API key and without costs.
- Re-importing must never break anything. An unchanged document is skipped based on its hash, a changed one is replaced in one go.
- Spec first, code second. Every module gets a written spec before any code, and only once it's right do we start. With Claude Code that works far better than "build me a RAG".

Next up: hybrid search with Slovak full-text, an LLM judge for answer groundedness, and running the eval in CI, where a regression means a red build.
