import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Scrapes Google Maps business leads using Apify's google-maps-scraper actor.
 * @param {string[]} queries - Array of search queries (e.g., ["cafes in Noida"])
 * @param {number} maxResults - Max results per query
 * @returns {Promise<Object[]>} - Array of scraped places
 */
export async function scrapeLeads(queries, maxResults = 30) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('APIFY_TOKEN is missing in the environment configuration.');
  }

  const client = new ApifyClient({ token });

  console.log(`[Apify] Starting Google Maps scraper for queries: ${JSON.stringify(queries)}`);
  console.log(`[Apify] Max results per search: ${maxResults}`);

  // Actor ID for Google Maps Scraper on Apify
  const actorId = 'compass/crawler-google-places';

  // Input configuration for the actor
  const input = {
    searchStringsArray: queries,
    maxCrawledPlacesPerSearch: maxResults,
    onlyDataFromSearchPage: false, 
    scrapeReviewerName: false,
    deduplicatePlaces: true,
  };

  try {
    // Start the actor and wait for it to finish
    console.log('[Apify] Running actor (this may take a few minutes)...');
    const run = await client.actor(actorId).call(input);

    console.log(`[Apify] Actor finished successfully with run ID: ${run.id}`);
    console.log('[Apify] Fetching dataset items...');

    // Get the dataset items
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[Apify] Successfully retrieved ${items.length} total results from Apify.`);

    return items;
  } catch (error) {
    console.error('[Apify] Error during lead scraping:', error);
    throw error;
  }
}
