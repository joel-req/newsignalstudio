// Minimal probe — does Cloudflare actually run my POST handler?

export async function onRequestPost(context) {
  return new Response(JSON.stringify({ ok: true, marker: 'minimal-probe-v1' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequest(context) {
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}
