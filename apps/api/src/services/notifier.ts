export async function sendTelegramAlert(
  token: string,
  chatId: string,
  text: string,
): Promise<void> {
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      console.error(`Telegram notify failed: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('Telegram notify error:', err);
  }
}
