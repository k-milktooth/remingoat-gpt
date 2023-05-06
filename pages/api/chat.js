import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { makeChain } from "@/utils/makechain";
import { pinecone } from "@/utils/pinecone-client";
import { end, message, sourceDocuments } from "@/utils/object-identifiers";

export default async function handler(req, res) {
  if (
    !process.env.PINECONE_API_KEY ||
    !process.env.PINECONE_ENVIRONMENT ||
    !process.env.PINECONE_INDEX ||
    !process.env.PINECONE_NAMESPACE
  ) {
    res.status(500).json({
      error: "Pinecone environment variables not set",
    });
    return;
  }

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

  // Create vectorstore
  const pineconeIndex = pinecone.Index(`${process.env.PINECONE_INDEX}`);
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    {
      pineconeIndex,
      namespace: process.env.PINECONE_NAMESPACE,
    }
  );

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    /**
     * Important to set no-transform to avoid compression, which will delay
     * writing response chunks to the client.
     * See https://github.com/vercel/next.js/issues/9965
     */
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  // Send real-time updates to the client
  const sendData = (data) => {
    /**
     * The message is formatted as an SSE event by prefixing it with "data: "
     * and appending two newlines ("\n\n") to indicate the end of the message.
     * Using two "\n" characters in SSE ensures that messages are properly
     * separated and received by the client.
     */
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendData({ object: message, data: "" });

  // Create chain
  const chain = makeChain(vectorStore, (token) => {
    // Stream response in real-time (token-by-token) to front-end
    sendData({ object: message, data: token });
  });

  // Ask a question using chat history
  try {
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    // Send the sourceDocuments to front-end
    sendData({
      object: sourceDocuments,
      data: response.sourceDocuments,
    });
  } catch (error) {
    console.error("Error: ", error.message);
  } finally {
    // Tell front-end that the stream has ended
    sendData({ object: end, data: "[DONE]" });

    res.end();
  }
}
