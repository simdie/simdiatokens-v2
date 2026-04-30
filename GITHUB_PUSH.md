# Push to GitHub — Step by Step

## What I Already Did
- Initialized a git repo in `/Users/simdia/Desktop/Fullsystem/`
- Removed embedded git repos (frontend/backend had their own .git)
- Added `.gitignore` to exclude secrets, node_modules, build artifacts
- Created one clean commit with all 124 files (33,382 lines)

## What You Must Do (I Cannot Do This For You)

I **cannot** log into your GitHub account, create repos, or push code. Only you can do this with your credentials.

Here are the exact commands to run in your terminal:

---

## Step 1: Create Empty Repo on GitHub

1. Go to https://github.com/new
2. **Repository name:** `simdiatokens-v2` (or any name you want)
3. **Visibility:** Private (recommended)
4. **DO NOT** initialize with README, .gitignore, or license
5. Click **Create repository**

You'll see a page with commands. Copy the HTTPS or SSH URL, e.g.:
```
https://github.com/YOUR_USERNAME/simdiatokens-v2.git
```

---

## Step 2: Push Local Code to GitHub

Open terminal and run these commands exactly:

```bash
# Navigate to the project root
cd /Users/simdia/Desktop/Fullsystem

# Optional: set your git identity (if you see warnings)
git config user.name "Your Name"
git config user.email "your@email.com"

# Rename branch to main (GitHub default)
git branch -m main

# Connect to your new GitHub repo
# REPLACE with your actual repo URL:
git remote add origin https://github.com/YOUR_USERNAME/simdiatokens-v2.git

# Push everything
git push -u origin main
```

You'll be prompted for your GitHub username and password (or personal access token).

---

## Step 3: Verify

Refresh your GitHub repo page. You should see:
- 124 files
- Folders: `SimdiaTokens/`, `SimdiaTokens-frontend/`, `.github/workflows/`
- `DEPLOY.md` at root

---

## What's NOT in the Repo (Correctly Excluded)

| File | Why Excluded |
|------|-------------|
| `.env` | Contains secrets |
| `.env.local` | Contains secrets |
| `.railway.env` | Contains secrets |
| `node_modules/` | Auto-generated, huge |
| `target/` | Rust build artifacts |
| `*.db` | SQLite database files |
| `*.log` | Log files |

---

## After Pushing: Deploy from GitHub

### Railway
1. Railway Dashboard → New Project → Deploy from GitHub repo
2. Select `simdiatokens-v2`
3. Set root directory: `SimdiaTokens/simdiatokens_server`
4. Add env vars (from `.railway.env`)
5. Deploy

### Vercel
1. Vercel Dashboard → Import GitHub repo
2. Select `simdiatokens-v2`
3. Set root directory: `SimdiaTokens-frontend`
4. Add env vars
5. Deploy

---

## Need Help?

If you get stuck on any step, tell me the exact error message and I'll fix it.
