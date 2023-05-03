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

  // Ad-hoc "pipe" to send stuff to front-end
  const sendData = (data) => {
    console.log(`${JSON.stringify(data)}`);
    res.write(`${JSON.stringify(data)}`);
  };

  // FIXME: not sure if this is necessary?
  sendData({ object: "token", data: "" });

  // Create chain
  const chain = makeChain(vectorStore, (token) => {
    sendData({ object: "token", data: token });
  });

  // Ask a question using chat history
  try {
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    // TODO: send an array of sources (pagecontent + metadata) that u can then fix up
    const sources = response.sourceDocuments.map((doc) => {
      return {
        content: doc.pageContent,
        metadata: doc.metadata,
      };
    });
    sendData({ object: "sources", data: sources });
  } catch (error) {
    console.error("Error: ", error.message);
  } finally {
    sendData({ object: "done", data: "[DONE]" });
    res.end();
  }
}
