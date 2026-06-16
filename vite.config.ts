import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

const vercelApiPlugin = () => ({
  name: 'vercel-api-fallback',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/api/')) {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const filePath = path.resolve(process.cwd(), '.' + urlObj.pathname + '.js');
          
          if (fs.existsSync(filePath)) {
            if (req.method === 'POST') {
              const buffers = [];
              for await (const chunk of req) buffers.push(chunk);
              try { req.body = JSON.parse(Buffer.concat(buffers).toString() || '{}'); } catch(e){}
            }
            
            req.query = Object.fromEntries(urlObj.searchParams);
            res.status = (code: any) => { res.statusCode = code; return res; };
            res.json = (data: any) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
            res.send = (data: any) => res.end(data);

            const moduleUrl = 'file://' + filePath + '?t=' + Date.now();
            const module = await import(moduleUrl);
            await module.default(req, res);
            return;
          }
        } catch (e) {
          console.error('Local API Plugin Error:', e);
        }
      }
      next();
    });
  }
});

export default defineConfig(() => {
  return {
  plugins: [
    vercelApiPlugin(),
    react(),
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
  ]
  };
});
