# Vercel deployment

This repo supports two deployment modes. **Use Option A unless you explicitly need the Express API on Vercel.**

## Option A — Frontend only (recommended)

Static Vite SPA with demo auth and `localStorage` data. **No MongoDB, no `/api` on Vercel.**

### Vercel project settings


| Setting            | Value                              |
| ------------------ | ---------------------------------- |
| Framework Presethi | **Vite** (not “Services”)          |
| Root Directory     | `.`                                |
| Build Command      | `npm run build` (or leave default) |
| Output Directory   | `dist`                             |
| Install Command    | `npm install`                      |


Do **not** add `experimentalServices` in the dashboard or in `vercel.json` for this mode.

### What runs


| URL                                     | Serves                     |
| --------------------------------------- | -------------------------- |
| `https://your-app.vercel.app/`          | React app (`dist/`)        |
| `https://your-app.vercel.app/any/route` | `index.html` (SPA rewrite) |


### Environment variables

Usually **none**. Production build uses `.env.production` (`VITE_FRONTEND_ONLY=true`).

Optional overrides in the Vercel dashboard:


| Variable                 | Value  |
| ------------------------ | ------ |
| `VITE_ENABLE_DEMO_LOGIN` | `true` |
| `VITE_FRONTEND_ONLY`     | `true` |


Do **not** set `VITE_API_BASE_URL` for demo deploys.

### Deploy

**GitHub:** [vercel.com/new](https://vercel.com/new) → import repo → Framework **Vite** → Deploy.

**CLI:**

```bash
npm i -g vercel
vercel login
cd path/to/admin-panel
vercel link
vercel --prod
```

### Demo login

See `src/data/demoAuthUsers.js` (e.g. `superadmin@sriramias.com` / `Super@123` with role **Super Admin**).

---

## Option B — Vercel Services (`experimentalServices`)

Only if your Vercel team has **Services** enabled and you want frontend + Express backend on one domain.

### Common mistakes (why deploy fails)

1. **Wrong field name** — use `entrypoint`, not `root`:
  ```json
   "backend": {
     "entrypoint": "backend",
     "routePrefix": "/_/backend",
     "framework": "express"
   }
  ```
2. **Framework Preset mismatch** — dashboard must be **Services**, and `vercel.json` must define `experimentalServices` (see `vercel.services.json.example`).
3. **Mixing configs** — do not keep top-level `"framework": "vite"` + SPA `rewrites` **and** `experimentalServices` in the same file. For Services, replace `vercel.json` with the example file (rename/copy).
4. **Missing `entrypoint` on frontend**:
  ```json
   "frontend": {
     "entrypoint": ".",
     "routePrefix": "/",
     "framework": "vite"
   }
  ```
5. **MongoDB** — backend service needs `MONGO_URI` (and related vars) in Vercel → Settings → Environment Variables.
6. **Frontend still in frontend-only mode** — set `VITE_FRONTEND_ONLY=false` and point the app at the backend URL (e.g. `VITE_API_BASE_URL` or service URL env vars from Vercel).

### Setup steps

1. Copy `vercel.services.json.example` → `vercel.json` (back up the current file first).
2. Vercel → Project → Settings → General → Framework Preset: **Services**.
3. Add env vars: `MONGO_URI`, `CLIENT_ORIGIN` / `FRONTEND_URL` = your Vercel URL.
4. Redeploy.

API paths will be under `https://your-app.vercel.app/_/backend/api/...` unless you adjust routes and `VITE_API_BASE_URL`.

---

## Troubleshooting


| Symptom                                    | Fix                                                                                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build fails on `/api` or `backend/app.js`  | You are deploying the API by accident. Use **Option A**, keep root `vercel.json`, and do **not** restore `/api/index.js` unless you follow `backend/vercel-serverless.example.js`. |
| “Services” / `experimentalServices` errors | Switch Framework Preset to **Vite** and use the default `vercel.json`, **or** fully switch to Option B with `vercel.services.json.example`.                                        |
| `centers?.find` / app errors after deploy  | App bug — unrelated to Vercel; pull latest frontend fixes.                                                                                                                         |
| Blank page on refresh                      | SPA rewrite missing — ensure `vercel.json` `rewrites` send routes to `/index.html`.                                                                                                |
| Login works locally, not on Vercel         | Use demo credentials + correct **role**; ensure `VITE_FRONTEND_ONLY` is not set to `false` without a working API.                                                                  |


## Local development

**Matches Vercel (frontend only):**

```bash
# .env.local
VITE_FRONTEND_ONLY=true
VITE_ENABLE_DEMO_LOGIN=true
npm run dev
```

**With local API:**

```bash
npm run dev          # terminal 1
npm run dev:api      # terminal 2 — uses backend/.env
```

## Verify production (Option A)

1. Login page loads.
2. Demo login succeeds.
3. Finance / Academics / CRM work without “Database unavailable”.
4. Deep link refresh works (e.g. `/academics/categories/class-rooms`).

