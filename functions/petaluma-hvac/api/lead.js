// Cloudflare Pages Function — POST /petaluma-hvac/api/lead
// Forwards lead form submissions to Telegram.
// Env vars (Production scope, Cloudflare Pages → Variables and Secrets):
//   TELEGRAM_BOT_TOKEN  (Secret)    — bot token from @BotFather
//   TELEGRAM_CHAT_ID    (Plaintext) — chat or group ID to receive messages

const REQUIRED_FIELDS = ['name', 'business', 'phone', 'email', 'zip'];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return jsonResponse(500, { error: 'env not configured' });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse(400, { error: 'invalid json' });
    }

    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || typeof body[field] !== 'string' || body[field].trim() === '') {
        return jsonResponse(400, { error: 'missing field: ' + field });
      }
    }

    const text = [
      '🛠 <b>New Petaluma HVAC lead</b>',
      '',
      '<b>Name:</b> ' + escapeHtml(body.name),
      '<b>Business:</b> ' + escapeHtml(body.business),
      '<b>Phone:</b> ' + escapeHtml(body.phone),
      '<b>Email:</b> ' + escapeHtml(body.email),
      '<b>ZIP:</b> ' + escapeHtml(body.zip),
      '',
      '<i>Source: ' + escapeHtml(body.source || 'petaluma-hvac-lander') + '</i>',
      '<i>Time: ' + new Date().toISOString() + '</i>'
    ].join('\n');

    const token = String(env.TELEGRAM_BOT_TOKEN).trim();
    const chatId = String(env.TELEGRAM_CHAT_ID).trim();
    const url = 'https://api.telegram.org/bot' + token + '/sendMessage';

    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!tgRes.ok) {
      const detail = await tgRes.text().catch(() => '(unreadable)');
      return jsonResponse(502, { error: 'telegram send failed', status: tgRes.status, detail });
    }

    return jsonResponse(200, { ok: true });
  } catch (err) {
    return jsonResponse(500, {
      error: 'handler threw',
      message: String(err && err.message || err)
    });
  }
}

export async function onRequest() {
  return jsonResponse(405, { error: 'method not allowed' });
}
