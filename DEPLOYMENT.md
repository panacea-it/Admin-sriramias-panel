# Netlify deployment

This frontend is a **Vite + React SPA**. The API runs separately (e.g. Render). Netlify serves only the static `dist/` build.

## Netlify project settings

| Setting            | Value              |
| ------------------ | ------------------ |
| Build command      | `npm run build`    |
| Publish directory  | `dist`             |
| Node version       | 20 (see `netlify.toml`) |

`netlify.toml` already defines SPA redirects and default build env vars.

## Environment variables (Netlify UI)

Set under **Site settings → Environment variables** (Production):

| Variable                 | Example                                      | Purpose                          |
| ------------------------ | -------------------------------------------- | -------------------------------- |
| `VITE_API_BASE_URL`      | `https://new-sriramias.onrender.com`         | Backend host (no `/api` suffix)  |
| `VITE_FRONTEND_ONLY`     | `false`                                      | Required for live Super Admin login |
| `VITE_ENABLE_DEMO_LOGIN` | `false`                                      | Optional demo fallback           |

Redeploy after changing env vars (Vite bakes them at build time).

## Local development

```bash
npm install
npm run dev
```

Use `.env` (see `.env.example`):

- `VITE_API_BASE_URL` — proxied via Vite to `/api/*` in dev
- `VITE_FRONTEND_ONLY=false` — call live API for Super Admin
- `VITE_ENABLE_DEMO_LOGIN=false` — no demo fallback on API errors

## Super Admin login

`POST {VITE_API_BASE_URL}/api/auth/login-super-admin` with JSON body `{ "email", "password" }`.

Use credentials issued by your backend — demo UI prefills are for offline roles only.

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| Login works locally, not on Netlify | Set `VITE_FRONTEND_ONLY=false` and `VITE_API_BASE_URL` in Netlify, then redeploy |
| Blank page on refresh | Ensure `netlify.toml` SPA redirect is present |
| CORS errors | Add your Netlify URL to backend `CLIENT_ORIGIN` / allowed origins |
| Wrong API host | Confirm `VITE_API_BASE_URL` has no trailing slash |
