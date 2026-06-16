export default async function handler(req, res) {
  // req.query.path contains the path segments (e.g. /r/funny/.rss)
  // Additional query params like ?limit=25 are also in req.query
  const { path, ...rest } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  // SSRF protection: only allow known Reddit path prefixes
  const validPrefixes = ['/r/', '/api/', '/user/'];
  const hasValidPrefix = validPrefixes.some(p => path.startsWith(p));
  if (!hasValidPrefix) {
    return res.status(400).json({ error: 'Invalid path parameter' });
  }

  // Build the query string from remaining params (e.g. limit=25)
  const extraParams = new URLSearchParams(rest).toString();
  const targetUrl = `https://www.reddit.com${path}${extraParams ? `?${extraParams}` : ''}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': `TRN-App-RSS-Reader/1.0.0 (by /u/developer-${Math.random()})`,
        'Accept': 'application/atom+xml,application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Reddit request failed' });
    }

    const text = await response.text();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).send(text);
  } catch (err) {
    console.error('Reddit proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
}

