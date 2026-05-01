// Cloudflare Pages Function — POST /petaluma-hvac/api/lead

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
      const keys = Object.keys(env || {}).sort();
      return jsonResponse(500, {
        error: 'telegram env vars not configured',
        env_keys_visible_to_function: keys
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
        return jsonResponse(400, { error: 'missing field: ' + field });
      }
    }

    const lines = [
      '🛠 <b>New Petaluma HVAC lead</b>',
      '',
      '<b>Name:</b> ' + escapeHtml(data.name),
      '<b>Business:</b> ' + escapeHtml(data.business),
      '<b>Phone:</b> ' + escapeHtml(data.phone),
      '<b>Email:</b> ' + escapeHtml(data.email),
      '<b>ZIP:</b> ' + escapeHtml(data.zip),
      '',
      '<i>Source: ' + escapeHtml(data.source || 'petaluma-hvac-lander') + '</i>',
      '<i>Time: ' + new Date().toISOString() + '</i>'
    ];

    const token = String(env.TELEGRAM_BOT_TOKEN).trim();
    const chatId = String(env.TELEGRAM_CHAT_ID).trim();
    const tgUrl = 'https://api.telegram.org/bot' + token + '/sendMessage';

    let tgRes;
    try {
      tgRes = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines.join('\n'),
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
    } catch (fetchErr) {
      return jsonResponse(500, {
        error: 'fetch threw',
        message: String(fetchErr && fetchErr.message || fetchErr),
        token_length: token.length,
        chat_id_value: chatId
      });
    }

    if (!tgRes.ok) {
      let detail = '';
      try { detail = await tgRes.text(); } catch (e) { detail = '(could not read)'; }
      return jsonResponse(502, {
        error: 'telegram send failed',
        status: tgRes.status,
        detail: detail,
        token_length: token.length,
        chat_id_value: chatId
      });
    }

    return jsonResponse(200, { ok: true });
  } catch (outerErr) {
    return jsonResponse(500, {
      error: 'handler threw',
      message: String(outerErr && outerErr.message || outerErr),
      stack: String(outerErr && outerErr.stack || '')
    });
  }
}

export async function onRequest(context) {
  return jsonResponse(405, { error: 'method not allowed' });
}
