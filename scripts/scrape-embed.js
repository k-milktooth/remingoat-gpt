const { XMLParser } = require("fast-xml-parser");
const cheerio = require("cheerio");
const axios = require("axios");
const { Document } = require("langchain/document");

// Sitemap URL
const REMINGOAT_SITEMAP_URL = "https://www.theremingoat.com/sitemap.xml";

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
    .find("figcaption, figure") // Remove captions and figures/images
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

(async function run() {
  try {
    console.log();
    const urls = await getUrlsFromSitemap(REMINGOAT_SITEMAP_URL);

    //for (const url of urls) {
    //await getEssay(url);
    //}

    await getEssay(urls[51]);
  } catch (error) {
    console.error("Error occured:", error);
  }
})();
