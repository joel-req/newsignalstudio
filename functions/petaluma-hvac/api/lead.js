// Bisect probe v2: minimal + read body

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    return new Response(JSON.stringify({ ok: true, marker: 'v2-body', got: Object.keys(body) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'caught', message: String(err && err.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequest(context) {
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}
