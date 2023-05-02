# RemingoatGPT - AI-powered chatbot for theRemingoat switch reviews 🐐🤖

[https://remingoat-gpt.netlify.app/](https://remingoat-gpt.netlify.app/)

## Motivation

It's no surprise that [theRemingoat switch reviews](https://www.theremingoat.com/), coming in at thousands of words each, are the most detailed switch reviews available. However, this verbosity has one major downside: it becomes unwieldy to read any given review, not to mention multiple reviews for when you're comparing many switches.

The obvious alternative is to not read the reviews and simply browse the provided score sheets. This shortcut is more time-efficient but ultimately lacks nuance. The scores simply reflect theRemingoat's preferences, which you won't be mirroring. In other words, without context, scores are meaningless.

RemingoatGPT seeks to mitigate the downsides of **both** long-winded reviews and reductionist score sheets. An AI-powered Q&A chatbot that lets you query detailed data as needed could be the perfect synthesis of detail and efficiency—simply query and read what's relevant to you.

We hope RemingoatGPT facilitates an easier and more successful switch discovery and research process!

## Development

1. Clone the repo

```
git clone https://github.com/k-milktooth/remingoat-gpt.git
```

2. Install packages

```
npm i
```

3. Set up your `.env` file

- Copy `.env.local.example` into `.env`
- Fill in API keys
  - Visit [OpenAI](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key) to retrieve your OpenAI API key.
  - Visit [Pinecone](https://pinecone.io/) to create an index. Then, from the dashboard, retrieve the appropriate Pinecone API key, environment and index name.

4. Ingest data

- Run `npm run ingest`
  - First, we scrape [theremingoat.com](https://www.theremingoat.com/) for switch reviews
  - Then, we create embeddings and save them to our Pinecone index

5. Run the app

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
