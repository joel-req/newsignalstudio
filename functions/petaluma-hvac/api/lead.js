// Cloudflare Pages Function — POST /petaluma-hvac/api/lead
// Step-by-step diagnostic build.

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const trace = [];
  try {
    trace.push('start');
    const { request, env } = context;
    trace.push('got context');

    const envKeys = Object.keys(env || {});
    trace.push('env keys: ' + envKeys.join(','));

    const tokenRaw = env.TELEGRAM_BOT_TOKEN;
    const chatRaw = env.TELEGRAM_CHAT_ID;
    trace.push('token type: ' + typeof tokenRaw + ' length: ' + (tokenRaw ? String(tokenRaw).length : 'n/a'));
    trace.push('chat type: ' + typeof chatRaw + ' length: ' + (chatRaw ? String(chatRaw).length : 'n/a'));

    if (!tokenRaw || !chatRaw) {
      return jsonResponse(500, { error: 'env not set', trace });
    }

    let body;
    try {
      body = await request.json();
      trace.push('parsed body, keys: ' + Object.keys(body).join(','));
    } catch (e) {
      return jsonResponse(400, { error: 'invalid json', trace });
    }

    const token = String(tokenRaw).trim();
    const chatId = String(chatRaw).trim();
    const tgUrl = 'https://api.telegram.org/bot' + token + '/sendMessage';
    trace.push('built url, url length: ' + tgUrl.length);

    const text = 'New Petaluma HVAC lead\n\n' +
      'Name: ' + (body.name || '') + '\n' +
      'Business: ' + (body.business || '') + '\n' +
      'Phone: ' + (body.phone || '') + '\n' +
      'Email: ' + (body.email || '') + '\n' +
      'ZIP: ' + (body.zip || '') + '\n' +
      'Source: ' + (body.source || 'lander') + '\n' +
      'Time: ' + new Date().toISOString();

    let tgRes;
    try {
      trace.push('fetching telegram');
      tgRes = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
      });
      trace.push('fetch returned, status: ' + tgRes.status);
    } catch (fe) {
      return jsonResponse(500, {
        error: 'fetch threw',
        message: String(fe && fe.message || fe),
        trace
      });
    }

    let detail = '';
    try { detail = await tgRes.text(); } catch (e) { detail = '(unreadable)'; }
    trace.push('read body, length: ' + detail.length);

    if (!tgRes.ok) {
      return jsonResponse(502, {
        error: 'telegram error',
        status: tgRes.status,
        detail,
        trace
      });
    }

    return jsonResponse(200, { ok: true, trace });
  } catch (err) {
    return jsonResponse(500, {
      error: 'outer threw',
      message: String(err && err.message || err),
      stack: String(err && err.stack || ''),
      trace
    });
  }
}

export async function onRequest(context) {
  return jsonResponse(405, { error: 'method not allowed' });
}
