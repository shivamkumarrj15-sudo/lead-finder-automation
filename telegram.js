import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends a Markdown formatted message to Telegram
 * @param {string} text - The message body in Markdown
 */
export async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in the environment configuration.');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  console.log(`[Telegram] Sending message to Chat ID: ${chatId}...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(`Telegram API Error: ${result.description || response.statusText}`);
  }

  console.log(`[Telegram] Message sent successfully! Message ID: ${result.result.message_id}`);
}
