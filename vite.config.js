import path from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function normalizeApiHost(raw) {
  if (!raw?.trim()) return ''
  return raw.trim().replace(/\/api\/?$/, '').replace(/\/$/, '')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const apiTarget =
    normalizeApiHost(env.VITE_API_BASE_URL) ||
    normalizeApiHost(env.VITE_API_URL) ||
    normalizeApiHost(env.VITE_BASE_URL) ||
    'https://new-sriramias.onrender.com'

  const localApiTarget =
    normalizeApiHost(env.VITE_LOCAL_API_URL) ||
    (apiTarget.includes('localhost') || apiTarget.includes('127.0.0.1')
      ? apiTarget
      : 'http://localhost:5000')

  const isHttpsTarget = apiTarget.startsWith('https://')

  if (mode === 'development') {
    console.log(`[vite] /api proxy → ${apiTarget} (secure: ${isHttpsTarget})`)
  }

  return {
    envPrefix: ['VITE_', 'REACT_APP_'],
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-react',
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              },
              {
                name: 'vendor-motion',
                test: /node_modules[\\/]framer-motion[\\/]/,
              },
              {
                name: 'vendor-charts',
                test: /node_modules[\\/](recharts|d3-[^/]+)[\\/]/,
              },
              {
                name: 'vendor-xlsx',
                test: /node_modules[\\/]xlsx[\\/]/,
              },
              {
                name: 'vendor-pdf',
                test: /node_modules[\\/]pdfjs-dist[\\/]/,
              },
              {
                name: 'vendor-dnd',
                test: /node_modules[\\/]@dnd-kit[\\/]/,
              },
              {
                name: 'vendor-misc',
                test: /node_modules[\\/]/,
              },
            ],
          },
        },
      },
    },
    plugins: [react(), tailwindcss()],
    server: {
      warmup: {
        clientFiles: [
          './src/routes/lazyRoute.js',
          './src/pages/LazyLoadErrorPage.jsx',
          './src/routes/lazyPages.js',
        ],
      },
      proxy: {
        '/api/batch-enrollments': {
          target: localApiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              console.error(
                `[vite proxy] ${req.method} ${req.url} → ${localApiTarget}: ${err.message}`,
              )
              if (res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' })
                res.end(
                  JSON.stringify({
                    success: false,
                    message:
                      'Batch enrollment API unavailable. Start the local backend with npm run dev:api.',
                  }),
                )
              }
            })
          },
        },
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: isHttpsTarget,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (mode !== 'development' || !req.url?.includes('/auth/login')) return
              console.log(`[vite proxy] ${req.method} ${req.url} → ${apiTarget}${req.url}`)
            })
            proxy.on('error', (err, req, res) => {
              console.error(
                `[vite proxy] ${req.method} ${req.url} → ${apiTarget}: ${err.message}`,
              )
              if (res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' })
                res.end(
                  JSON.stringify({
                    success: false,
                    message: `Backend unavailable at ${apiTarget}. Start the API server or update VITE_API_BASE_URL, then restart npm run dev.`,
                  }),
                )
              }
            })
          },
        },
      },
    },
  }
})
