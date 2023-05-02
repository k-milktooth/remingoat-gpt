const { DOMParser } = require("xmldom");
const cheerio = require("cheerio");
const axios = require("axios");

// Sitemap URL
const REMINGOAT_SITEMAP_URL = "https://www.theremingoat.com/sitemap.xml";

async function getUrlsFromSitemap() {
  // Load the sitemap XML
  const response = await fetch(REMINGOAT_SITEMAP_URL);
  const xmlString = await response.text();

  // Create a new DOMParser object
  const parser = new DOMParser();

  // Parse the sitemap XML
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Get all the loc elements from the sitemap
  const locs = xmlDoc.getElementsByTagName("loc");

  // Return the loc URLs as an array of strings
  const urls = Array.from(locs).map((loc) => loc.textContent);

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

  // Clean up the article contents
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

  console.log(metadata);

  return cleanedArticleContents;
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
