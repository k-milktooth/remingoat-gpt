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

  const pineconeIndex = pinecone.Index(`${process.env.PINECONE_INDEX}`);

  // Create vectorstore
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    {
      pineconeIndex,
    }
  );

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    // Important to set no-transform to avoid compression, which will delay
    // writing response chunks to the client.
    // See https://github.com/vercel/next.js/issues/9965
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const sendData = (data) => {
    res.write(`data: ${data}\n\n`);
  };

  sendData(JSON.stringify({ data: "" }));

  // Create chain
  const chain = makeChain(vectorStore, (token) => {
    sendData(JSON.stringify({ data: token }));
  });

  // Ask a question using chat history
  try {
    await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });
  } catch (error) {
    console.log("error", error);
  } finally {
    sendData("[DONE]");
    res.end();
  }
}
