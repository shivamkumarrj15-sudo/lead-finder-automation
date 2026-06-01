import fs from 'fs';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { scrapeLeads } from './apifyScraper.js';
import { sendTelegramMessage } from './telegram.js';

// Load environment variables
dotenv.config();

// Execution logic for lead generation and sending to Telegram
async function executeLeadGeneration() {
  console.log('========================================================');
  console.log(`🚀 Starting Lead Generation Run at: ${new Date().toLocaleString()}`);
  console.log('========================================================');

  try {
    // 1. Determine the search query (Daily Category Rotation)
    const location = process.env.SEARCH_LOCATION || 'Jaipur';
    
    // Load categories list
    if (!fs.existsSync('./categories.json')) {
      throw new Error('categories.json file is missing in the project folder.');
    }
    const categories = JSON.parse(fs.readFileSync('./categories.json', 'utf-8'));
    
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error('categories.json must contain a non-empty array of business categories.');
    }

    // Calculate day of the year to rotate category
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Pick category based on day of year
    const selectedCategory = categories[dayOfYear % categories.length];
    const searchQuery = `${selectedCategory} in ${location}`;

    console.log(`[Rotation] Day of Year: ${dayOfYear}`);
    console.log(`[Rotation] Selected Category: "${selectedCategory}"`);
    console.log(`[Rotation] Search Location: "${location}"`);
    console.log(`[Rotation] Search Query: "${searchQuery}"`);

    const maxResults = parseInt(process.env.MAX_RESULTS_PER_SEARCH || '50', 10);
    const skipCount = parseInt(process.env.SKIP_TOP_RESULTS || '10', 10);
    const maxLeads = parseInt(process.env.MAX_LEADS_PER_DAY || '5', 10);
    const minReviews = parseInt(process.env.MIN_REVIEWS_COUNT || '10', 10);
    const minRating = parseFloat(process.env.MIN_RATING || '4.0');

    // 2. Run Apify Scraper to fetch raw results
    const rawLeads = await scrapeLeads([searchQuery], maxResults);
    
    if (rawLeads.length === 0) {
      console.log('❌ No results returned from Apify.');
      await sendTelegramMessage(`⚠️ *Lead Generation Report*\nNo results were returned by the scraper today for: _${searchQuery}_`);
      return;
    }

    // 3. Ignore top N results (e.g. top 10)
    console.log(`[Process] Skipping the top ${skipCount} results...`);
    const potentialLeads = rawLeads.slice(skipCount);

    // 4. Filter for businesses without website, with good reviews and rating
    console.log('[Process] Filtering businesses for prospects with NO website...');
    const filteredLeads = potentialLeads.filter(lead => {
      const hasNoWebsite = !lead.website || lead.website.trim() === '';
      const reviewsCount = lead.reviewsCount || 0;
      const hasGoodReviews = reviewsCount >= minReviews;
      const rating = lead.totalScore || 0;
      const hasGoodRating = rating >= minRating;

      return hasNoWebsite && hasGoodReviews && hasGoodRating;
    });

    // 5. Limit to top M leads (e.g. 5)
    const finalLeads = filteredLeads.slice(0, maxLeads);
    console.log(`[Process] Found ${filteredLeads.length} total matches. Selected first ${finalLeads.length} leads.`);

    if (finalLeads.length === 0) {
      const emptyMsg = `ℹ️ *Lead Generation Report*\n\nScraped ${rawLeads.length} businesses for: _${searchQuery}_\nIgnored top ${skipCount} results.\n*Status:* Found 0 active businesses without a website today.`;
      console.log('❌ No prospects found.');
      await sendTelegramMessage(emptyMsg);
      return;
    }

    // 6. Format message for Telegram
    let telegramText = `🎯 *Daily Lead Generation Report* 🎯\n`;
    telegramText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    telegramText += `🕐 *Time:* ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`;
    telegramText += `🔎 *Query:* _${searchQuery}_\n`;
    telegramText += `📊 *Status:* Found ${finalLeads.length} growing leads (Rank 11-50 without website)\n`;
    telegramText += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    finalLeads.forEach((lead, index) => {
      const name = lead.title || 'N/A';
      const rating = lead.totalScore || 'N/A';
      const reviews = lead.reviewsCount || 0;
      const phone = lead.phone || 'Contact not listed';
      const email = lead.email || (lead.emails && lead.emails[0]) || 'Email not listed';
      const address = lead.address || 'Address not listed';
      const mapUrl = lead.url || 'No Google Maps link';

      telegramText += `*${index + 1}. ${name}*\n`;
      telegramText += `⭐ *Rating:* ${rating} (${reviews} reviews)\n`;
      telegramText += `📞 *Phone:* \`${phone}\`\n`;
      telegramText += `📧 *Email:* \`${email}\`\n`;
      telegramText += `📍 *Address:* _${address}_\n`;
      telegramText += `🔗 [View on Google Maps](${mapUrl})\n\n`;
    });

    telegramText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    telegramText += `🚀 _Generated automatically by Apify Lead Finder_`;

    // 7. Send message to Telegram
    await sendTelegramMessage(telegramText);
    console.log('🏁 Lead Finder run completed and results sent to Telegram.');

  } catch (error) {
    console.error('❌ Run failed with error:', error.message);
    try {
      await sendTelegramMessage(`❌ *Automation Error*\nAn error occurred during execution: \`${error.message}\``);
    } catch (_) {}
  }
}

// Main execution block
const args = process.argv.slice(2);
const isCronMode = args.includes('--cron');

if (isCronMode) {
  // Cron schedule for 7:00 PM daily in Indian Time (Asia/Kolkata)
  // Format: 'Minute Hour DayOfMonth Month DayOfWeek'
  // '0 19 * * *' -> Daily at 19:00 (7:00 PM)
  console.log('========================================================');
  console.log('⏳ Starting Lead Finder Scheduler Mode');
  console.log('📅 Schedule: Daily at 7:00 PM IST (19:00 Asia/Kolkata)');
  console.log('========================================================');

  cron.schedule('0 19 * * *', () => {
    executeLeadGeneration();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
} else {
  // Direct CLI run mode
  console.log('[CLI] Running automation immediately once...');
  executeLeadGeneration();
}
