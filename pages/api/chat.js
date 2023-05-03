import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { makeChain } from "@/utils/makechain";
import { pinecone } from "@/utils/pinecone-client";

export default async function handler(req, res) {
  const { question, history } = req.body;

  // Only accept post requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Check if question is empty
  if (!question) {
    res.status(400).json({ error: "Question is empty" });
    return;
  }

  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll("\n", " ");

  try {
    const pineconeIndex = pinecone.Index(`${process.env.PINECONE_INDEX}`);

    // Create vectorstore
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        pineconeIndex,
      }
    );

    // Create chain
    const chain = makeChain(vectorStore, (token) => {
      sendData(JSON.stringify({ data: token }));
    });

    // Ask a question using chat history
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    res.status(200).json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
}
