const { XMLParser } = require("fast-xml-parser");
const cheerio = require("cheerio");
const axios = require("axios");
const { Document } = require("langchain/document");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { PineconeClient } = require("@pinecone-database/pinecone");
const fs = require("fs");

require("dotenv").config();

// Sitemap URL
const REMINGOAT_SITEMAP_URL = "https://www.theremingoat.com/sitemap.xml";

// JSON file containing the scraped data
const JSON_FILENAME = "remingoat.json";

async function getUrlsFromSitemap() {
  // Load the sitemap XML
  const response = await fetch(REMINGOAT_SITEMAP_URL);
  const xmlString = await response.text();

  // Parse the sitemap XML
  const parser = new XMLParser();
  const parsedXml = parser.parse(xmlString);

  // Get all the loc elements from the sitemap
  const urls = parsedXml.urlset.url.map((url) => url.loc);

  return urls;
}

async function getEssay(essayUrl) {
  console.log(`Fetching ${essayUrl}`);
  const html = await axios.get(essayUrl);
  const $ = cheerio.load(html.data);

  // Get text from the article
  const articleContents = $(".blog-item-inner-wrapper")
    .clone()
    .find("figcaption, figure, div.gallery-block, div.blog-item-meta-wrapper") // Remove captions, figures/images
    .remove()
    .end()
    .text();

  const cleanedArticleContents = articleContents
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .replace(/Sponsors\/Affiliates.*/gi, "") // Remove text after "Sponsors/Affiliates"
    .trim(); // Trim whitespace from the beginning and end

  const metadata = {
    source: essayUrl,
    title: $("h1.entry-title").text(),
    date: $("meta[itemprop='datePublished']").attr("content"),
    contentLength: cleanedArticleContents?.match(/\b\w+\b/g)?.length ?? 0,
  };

  return [new Document({ pageContent: cleanedArticleContents, metadata })];
}

async function splitDocsIntoChunks(docs) {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });

  return await textSplitter.splitDocuments(docs);
}

async function embedDocuments(docs) {
  // Create and store embeddings
  const embeddings = new OpenAIEmbeddings();

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

  const pineconeClient = new PineconeClient();
  await pineconeClient.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
  const pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX);

  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex,
  });
}

(async function run() {
  try {
    const urls = await getUrlsFromSitemap(REMINGOAT_SITEMAP_URL);

    const rawDocs = [];

    for (const url of urls) {
      const doc = await getEssay(url);

      // If content length is 0 then it's not a post we're interested in
      if (doc[0].metadata.contentLength > 0) {
        rawDocs.push(...doc);
      }
    }

    console.log("Data extracted from URLs");

    // This is mainly for checking work
    const json = JSON.stringify(rawDocs);
    fs.writeFileSync(JSON_FILENAME, json);
    console.log(`Data written to ${JSON_FILENAME}`);

    // Split docs into chunks for OpenAI context window
    const docs = await splitDocsIntoChunks(rawDocs);

    // Embed docs into Pinecone
    await embedDocuments(docs);
  } catch (error) {
    console.error("Error occured:", error);
  }
})();
