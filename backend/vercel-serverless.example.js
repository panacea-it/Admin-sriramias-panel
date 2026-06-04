/**
 * Optional legacy Vercel serverless entry (NOT used by default deploy).
 * To use: copy to /api/index.js and add API rewrites before the SPA rule in vercel.json.
 * Requires MONGO_URI and other backend env vars on Vercel.
 * @see DEPLOYMENT.md
 */
import app from './app.js'

export default app
