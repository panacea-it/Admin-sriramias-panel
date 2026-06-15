import { forwardRemoteRequest } from '../utils/remoteApi.js'

/** Master-management paths served by the remote API (browser calls local backend → no CORS). */
const MASTER_API_PREFIXES = [
  '/api/programs',
  '/api/categories',
  '/api/sub-categories',
  '/api/subjects',
  '/api/topics',
  '/api/teachers',
  '/api/cities',
  '/api/legacy-categories',
  '/api/centers',
]

function isMasterApiPath(url) {
  const path = String(url || '').split('?')[0]
  return MASTER_API_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

function shouldSkipProxy(req) {
  const path = req.originalUrl.split('?')[0]
  return path.endsWith('/bulk-status')
}

export function masterApiProxy(req, res, next) {
  if (req.method === 'OPTIONS') return next()
  if (!isMasterApiPath(req.originalUrl)) return next()
  if (shouldSkipProxy(req)) return next()

  forwardRemoteRequest(req.method, req.originalUrl, {
    body: req.body && Object.keys(req.body).length ? req.body : undefined,
    authHeader: req.headers.authorization,
  })
    .then(({ status, data }) => {
      if (data == null || data === '') {
        res.status(status).end()
        return
      }
      res.status(status).json(data)
    })
    .catch(next)
}
