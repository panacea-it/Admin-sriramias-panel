/**
 * Server-side calls to the remote master-management API (no browser CORS).
 * Configure with REMOTE_API_URL in backend/.env (no trailing slash).
 */
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '../.env'), override: false })

function resolveRemoteApiBase() {
  const raw =
    process.env.REMOTE_API_URL?.trim() ||
    process.env.API_BASE_URL?.trim() ||
    process.env.VITE_API_BASE_URL?.trim() ||
    'https://new-sriramias.onrender.com'
  return raw.replace(/\/api\/?$/, '').replace(/\/$/, '')
}

export const REMOTE_API_BASE = resolveRemoteApiBase()

export async function forwardRemoteRequest(method, path, { body, authHeader } = {}) {
  const url = `${REMOTE_API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const headers = { 'Content-Type': 'application/json' }
  if (authHeader) headers.Authorization = authHeader

  const response = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  let data = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  return { status: response.status, data }
}
