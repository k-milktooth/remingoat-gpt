import { PineconeClient } from "@pinecone-database/pinecone";

// Initialize the Pinecone client
if (
  !process.env.PINECONE_API_KEY ||
  !process.env.PINECONE_ENVIRONMENT ||
  !process.env.PINECONE_INDEX
) {
  throw new Error(
    "PINECONE_ENVIRONMENT and PINECONE_API_KEY and PINECONE_INDEX must be set"
  );
}

async function initPinecone() {
  try {
    const pineconeClient = new PineconeClient();

    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });

    return pinecone;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to initialize Pinecone client");
  }
}

export const pinecone = await initPinecone();
