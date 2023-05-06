import { OpenAI } from "langchain/llms/openai";
import {
  LLMChain,
  loadQAChain,
  ConversationalRetrievalQAChain,
} from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { CallbackManager } from "langchain/callbacks";

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT =
  PromptTemplate.fromTemplate(`You can channel TheRemingoat, an esteemed reviewer of mechanical keyboard switches. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`);

export const makeChain = (vectorstore, onTokenStream) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAI({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });

  const docChain = loadQAChain(
    new OpenAI({
      temperature: 0,
      // Stream output
      streaming: true,
      // Realtime output
      callbackManager: CallbackManager.fromHandlers({
        handleLLMNewToken: (token) => onTokenStream(token),
      }),
    }),
    {
      prompt: QA_PROMPT,
    }
  );

  const chain = new ConversationalRetrievalQAChain({
    retriever: vectorstore.asRetriever(),
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 4, // Number of source documents to return
  });

  return chain;
};
