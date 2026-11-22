import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { defineConfig } from 'vite'

import { validateSkiRental } from './api/send-email.js'

export default defineConfig({
  plugins: [
    {
      name: 'ski-rental-validation',
      configureServer(server) {
        server.middlewares.use('/api/validate-ski-rental', async (request, response) => {
          response.setHeader('Content-Type', 'application/json')
          if (request.method !== 'POST') {
            response.setHeader('Allow', 'POST')
            response.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          try {
            let raw = ''
            for await (const chunk of request) {
              raw += chunk
              if (raw.length > 16_384) {
                response.writeHead(413).end(JSON.stringify({ error: 'Request body too large' }))
                return
              }
            }
            const body = JSON.parse(raw)
            const result = validateSkiRental(body ?? {})
            response.writeHead(result.status).end(JSON.stringify(result.body))
          } catch {
            response.writeHead(400).end(JSON.stringify({ error: 'Invalid JSON body' }))
          }
        })
      },
    },
    vue({
      template: { transformAssetUrls },
    }),
    quasar(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __SKI_RENTAL_VERCEL__: JSON.stringify(process.env.VERCEL === '1'),
  },
  css: {
    devSourcemap: true,
  },
})
