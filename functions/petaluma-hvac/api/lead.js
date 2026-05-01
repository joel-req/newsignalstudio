// Bisect probe v3: body + env + Telegram fetch

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return new Response(JSON.stringify({
        error: 'env missing',
        keys: Object.keys(env || {})
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const tokenLen = String(token).length;
    const chatStr = String(chatId).trim();

    const url = 'https://api.telegram.org/bot' + String(token).trim() + '/sendMessage';

    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatStr,
        text: 'Test from Petaluma HVAC lander\nName: ' + (body.name || '') + '\nBiz: ' + (body.business || '')
      })
    });

    const tgText = await tgRes.text();

    return new Response(JSON.stringify({
      ok: tgRes.ok,
      status: tgRes.status,
      tg_response: tgText.slice(0, 500),
      token_length: tokenLen,
      chat_id: chatStr,
      marker: 'v3-fetch'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'caught',
      message: String(err && err.message || err),
      stack: String(err && err.stack || '').slice(0, 500)
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequest(context) {
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}
