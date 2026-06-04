/**
 * Frontend-only mode: no backend/API calls (Vercel static deploy).
 * Set VITE_FRONTEND_ONLY=true in .env.production (default for Vercel).
 */
export const isFrontendOnly =
  import.meta.env.VITE_FRONTEND_ONLY === 'true' ||
  (import.meta.env.PROD && import.meta.env.VITE_FRONTEND_ONLY !== 'false')

export const isDemoAuthEnabled =
  isFrontendOnly || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true'
