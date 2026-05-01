// Cloudflare Pages Function — POST /petaluma-hvac/api/lead
// Receives a lead form submission and forwards it to Telegram.
// Env vars (set in Cloudflare Pages → Settings → Environment variables):
//   TELEGRAM_BOT_TOKEN  — secret bot token from @BotFather
//   TELEGRAM_CHAT_ID    — chat or group ID where messages should land

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
  const { request, env } = context;

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    // Diagnostic: list env keys (NO VALUES) so we can see what the function actually receives.
    const keys = Object.keys(env || {}).sort();
    return jsonResponse(500, {
      error: 'telegram env vars not configured',
      env_keys_visible_to_function: keys,
      has_TELEGRAM_BOT_TOKEN: 'TELEGRAM_BOT_TOKEN' in env,
      has_TELEGRAM_CHAT_ID: 'TELEGRAM_CHAT_ID' in env,
      chat_id_value_if_present: typeof env.TELEGRAM_CHAT_ID === 'string' ? env.TELEGRAM_CHAT_ID : null
    });
  }

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return jsonResponse(400, { error: 'invalid json' });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
      return jsonResponse(400, { error: `missing field: ${field}` });
    }
  }

  const lines = [
    '🛠 <b>New Petaluma HVAC lead</b>',
    '',
    `<b>Name:</b> ${escapeHtml(data.name)}`,
    `<b>Business:</b> ${escapeHtml(data.business)}`,
    `<b>Phone:</b> ${escapeHtml(data.phone)}`,
    `<b>Email:</b> ${escapeHtml(data.email)}`,
    `<b>ZIP:</b> ${escapeHtml(data.zip)}`,
    '',
    `<i>Source: ${escapeHtml(data.source || 'petaluma-hvac-lander')}</i>`,
    `<i>Time: ${new Date().toISOString()}</i>`
  ];

  const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const tgRes = await fetch(tgUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  if (!tgRes.ok) {
    const detail = await tgRes.text();
    return jsonResponse(502, { error: 'telegram send failed', detail });
  }

  return jsonResponse(200, { ok: true });
}

export async function onRequest(context) {
  return jsonResponse(405, { error: 'method not allowed' });
}
