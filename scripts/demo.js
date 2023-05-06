const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { VectorDBQAChain } = require("langchain/chains");
const { PineconeClient } = require("@pinecone-database/pinecone");
const { OpenAI } = require("langchain/llms/openai");
require("dotenv").config();

// Test various queries
async function demoQuery() {
  if (
    !process.env.PINECONE_API_KEY ||
    !process.env.PINECONE_ENVIRONMENT ||
    !process.env.PINECONE_INDEX ||
    !process.env.PINECONE_NAMESPACE
  ) {
    throw new Error(
      "PINECONE_ENVIRONMENT and PINECONE_API_KEY and PINECONE_INDEX and PINECONE_NAMESPACE must be set"
    );
  }

  const pineconeClient = new PineconeClient();
  await pineconeClient.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });

  const pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX);

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    {
      pineconeIndex,
      namespace: process.env.PINECONE_NAMESPACE,
    }
  );

  const model = new OpenAI();
  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 4,
    returnSourceDocuments: true,
  });

  // Ask a question

  const queries = [
    "Describe to me the Oil Kings",
    "What's the sound signature of the Jwick Semi-Silents?",
    "If I can't stand scratchiness, should I get the Novelkeys Creams?",
  ];

  for (const query of queries) {
    console.log(`${query}`);
    const response = await chain.call({ query: query });
    console.log(response.text);
    console.log();
    console.log();
    console.log();
  }
}

(async () => {
  await demoQuery();
})();
