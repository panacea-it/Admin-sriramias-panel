/**
 * Frontend-only mode: no live API calls (static demo / localStorage).
 * Set VITE_FRONTEND_ONLY=true only when you intentionally skip the backend.
 */
export const isFrontendOnly = import.meta.env.VITE_FRONTEND_ONLY === 'true'

export const isDemoAuthEnabled =
  isFrontendOnly || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true'
