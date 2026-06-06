import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [
    react(),
    {
      name: 'api-mock',
      configureServer(server) {
        // Body parser for JSON
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/deepseek' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
              try {
                const parsedBody = JSON.parse(body);
                const apiKey = env.VITE_DEEPSEEK_API_KEY || 'MISSING_KEY';
                
                let response;
                let retries = 2;
                while (retries >= 0) {
                  try {
                    response = await fetch('https://api.deepseek.com/chat/completions', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                      },
                      body: JSON.stringify(parsedBody),
                    });
                    break;
                  } catch (err: any) {
                    if (retries === 0) throw err;
                    retries--;
                    await new Promise(r => setTimeout(r, 1000));
                  }
                }
                
                if (!response) throw new Error("Fetch failed completely");
                
                if (parsedBody.stream) {
                  if (!response.ok) {
                    const text = await response.text();
                    let data;
                    try {
                      data = JSON.parse(text);
                    } catch (err) {
                      data = { error: { message: `DeepSeek API Error (${response.status}): ${text.substring(0, 100)}` } };
                    }
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = response.status;
                    res.end(JSON.stringify(data));
                    return;
                  }

                  if (!response.body) throw new Error('No response body');
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
                } else {
                  const text = await response.text();
                  let data;
                  try {
                    data = JSON.parse(text);
                  } catch (err) {
                    data = { error: { message: `DeepSeek API Error (${response.status}): ${text.substring(0, 100)}` } };
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = response.status;
                  res.end(JSON.stringify(data));
                }
              } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: { message: `Vite Proxy Error: ${e.message || String(e)}` } }));
              }
            });
          } else {
            next();
          }
        });
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'offline.html'],
      manifest: {
        name: 'The Real Neighbors',
        short_name: 'TRN',
        description: 'Neighborhood social network',
        theme_color: '#8b5cf6',
        background_color: '#1a1a1a',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/reddit-api': {
        target: 'https://www.reddit.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/reddit-api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.5');
          });
        },
      }
    }
  }
  };
});
