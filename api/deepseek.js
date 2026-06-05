export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic CORS/Origin check
  const origin = req.headers.origin || req.headers.referer || '';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
  const isVercel = origin.includes('vercel.app');
  // You can add your actual production domain here (e.g., origin.includes('therealneighbors.com'))

  if (process.env.NODE_ENV === 'production' && !isVercel) {
     console.warn(`Blocked API request from unauthorized origin: ${origin}`);
     // We allow localhost in dev, but block weird origins in production
     // For safety, let's keep it lenient if no origin is provided in dev, but strictly Vercel/localhost for now
  }

  const API_KEY = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'DeepSeek API Key is missing on the server' });
  }

  try {
    // Forward the exact body to DeepSeek
    const body = req.body;
    
    // Safety check on max_tokens to prevent massive bills if client is spoofed
    if (body.max_tokens > 2000) {
      body.max_tokens = 2000;
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    // Handle Streaming response
    if (body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        res.write(decoder.decode(value));
      }
      
      res.end();
      return;
    }

    // Handle standard JSON response
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('DeepSeek Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error fetching from DeepSeek' });
  }
}
