const POLAR_ORIGIN = 'https://data.offshoreweatherrouting.com/polars';

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

function badRequest(message) {
  return new Response(message, {
    status: 400,
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/cf-polars/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders('*') });
      }
      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
      }

      const encodedName = url.pathname.slice('/cf-polars/'.length);
      if (!encodedName) {
        return badRequest('Missing polar file name');
      }

      const decodedName = decodeURIComponent(encodedName);
      // Restrict to expected filename-safe characters to avoid path traversal.
      if (!/^[A-Za-z0-9._-]+\.pol$/.test(decodedName)) {
        return badRequest('Invalid polar file name');
      }

      const upstreamUrl = `${POLAR_ORIGIN}/${encodeURIComponent(decodedName)}`;
      const upstream = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain,text/*,*/*'
        }
      });

      const headers = new Headers(upstream.headers);
      headers.set('Cache-Control', 'public, max-age=3600');
      headers.set('Content-Type', headers.get('Content-Type') || 'text/plain; charset=utf-8');
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers
      });
    }

    return env.ASSETS.fetch(request);
  }
};
