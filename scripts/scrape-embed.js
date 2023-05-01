const { DOMParser } = require("xmldom");

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
  console.log(urls);

  return urls;
}

(async function run() {
  try {
    console.log();
    const urls = await getUrlsFromSitemap(REMINGOAT_SITEMAP_URL);
  } catch (error) {
    console.error("Error occured:", error);
  }
})();
