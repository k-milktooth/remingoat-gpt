import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAI } from "langchain/llms/openai";
import {
  LLMChain,
  loadQAChain,
  ConversationalRetrievalQAChain,
} from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { CallbackManager } from "langchain/callbacks";

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up
question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT =
  PromptTemplate.fromTemplate(`You can channel TheRemingoat, an esteemed reviewer of mechanical keyboard switches.
Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are
related to the context.

{context}

Question: {question}
Helpful answer in markdown:`);

export const runtime = "edge";

export async function POST(req) {
  try {
    const { question, history } = await req.json();

    // OpenAI recommends replacing newlines with spaces for best results
    const sanitizedQuestion = question.trim().replaceAll("\n", " ");

    const streaming = req.headers.get("accept") === "text/event-stream";
    console.log("server streaming", streaming);

    // Init pinecone
    const pinecone = new PineconeClient();

    await pinecone.init({
      apiKey: `${process.env.PINECONE_API_KEY}`,
      environment: process.env.PINECONE_ENVIRONMENT,
    });

    const pineconeIndex = pinecone.Index(`${process.env.PINECONE_INDEX}`);
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        pineconeIndex,
        namespace: process.env.PINECONE_NAMESPACE,
      }
    );

    const questionGenerator = new LLMChain({
      llm: new OpenAI({ temperature: 0 }),
      prompt: CONDENSE_PROMPT,
    });

    if (streaming) {
      // For a streaming response we need to use a TransformStream to
      // convert the LLM's callback-based API into a stream-based API.
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      console.log("creating loadQAChain");

      const docChain = loadQAChain(
        new OpenAI({
          temperature: 0,
          streaming,

          // Realtime output
          callbackManager: CallbackManager.fromHandlers({
            handleLLMNewToken: async (token) => {
              await writer.ready;
              await writer.write(encoder.encode(`data: ${token}\n\n`));
            },
            handleLLMEnd: async () => {
              await writer.ready;
              await writer.close();
            },
            handleLLMError: async (e) => {
              await writer.ready;
              await writer.abort(e);
            },
          }),
        }),
        {
          prompt: QA_PROMPT,
        }
      );

      console.log("creating ConversationalRetrievalQAChain");

      const chain = new ConversationalRetrievalQAChain({
        retriever: vectorStore.asRetriever(),
        combineDocumentsChain: docChain,
        questionGeneratorChain: questionGenerator,
        returnSourceDocuments: true,
        k: 4, // Number of source documents to return
      });

      chain
        .call({
          question: sanitizedQuestion,
          chat_history: history || [],
        })
        .catch((e) => {
          console.error(e);
        });

      console.log("returning response");

      return new Response(stream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
        },
      });
    } else {
      // For a non-streaming response we can just await the result of the
      // chain.run() call and return it.

      const docChain = loadQAChain(
        new OpenAI({
          temperature: 0,
        }),
        {
          prompt: QA_PROMPT,
        }
      );

      const chain = new ConversationalRetrievalQAChain({
        retriever: vectorStore.asRetriever(),
        combineDocumentsChain: docChain,
        questionGeneratorChain: questionGenerator,
        returnSourceDocuments: true,
        k: 4, // Number of source documents to return
      });

      const response = await chain.call({
        question: sanitizedQuestion,
        chat_history: history || [],
      });

      return new Response(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.error(error);
  }
}
