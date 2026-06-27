import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const { firecrawlService } = await import("../services/firecrawl/firecrawl.service.ts");

const main = await firecrawlService.scrapeUrl(
  "https://www.lodhagroup.com/projects/residential-property-in-worli/lodha-park"
);
const md = main.markdown ?? "";
console.log("PRICE SCAN:", [...md.matchAll(/(?:₹|Rs\.?\s*|INR\s*)[\d,.]+(?:\s*(?:Cr|CR|crore|Lakh|Lac|L))/gi)].map((m) => m[0]).slice(0, 10));
console.log("STARTING:", md.match(/starting[^\n]{0,80}/gi));
console.log("AMENITIES sample:", md.match(/swimming|clubhouse|gym|tennis/gi)?.slice(0, 8));

const urls = [
  "https://www.lodhagroup.com/projects/residential-property-in-worli/lodha-park",
  "https://www.lodhagroup.com/projects/residential-property-in-worli/lodha-park/gallery",
  "https://www.lodhagroup.com/projects/residential-property-in-worli/lodha-park/plans",
  "https://www.lodhagroup.com/projects/residential-property-in-worli/lodha-park/location",
];

for (const url of urls) {
  const scrape = await firecrawlService.scrapeUrl(url);
  const md = scrape.markdown ?? "";
  console.log(JSON.stringify({
    url,
    title: scrape.metadata?.title,
    ogTitle: scrape.metadata?.ogTitle,
    markdownLen: md.length,
    markdownHead: md.slice(0, 500),
    reraMatches: [...md.matchAll(/rera[^\n]{0,100}/gi)].slice(0, 5).map((m) => m[0]),
    priceMatches: [...md.matchAll(/(?:₹|Rs\.?|INR)[^\n]{0,60}/gi)].slice(0, 5).map((m) => m[0]),
    bhkMatches: [...md.matchAll(/\d\s*bhk/gi)].slice(0, 5).map((m) => m[0]),
  }, null, 2));
}
