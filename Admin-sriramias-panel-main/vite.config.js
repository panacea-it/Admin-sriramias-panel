import path from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const apiTarget =
    env.VITE_BASE_URL?.replace(/\/api\/?$/, '') ||
    env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ||
    'https://new-sriramias.onrender.com'

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
      chunkSizeWarningLimit: 700,
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
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
