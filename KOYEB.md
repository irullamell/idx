# Deployment Guide - Koyeb

## Quick Setup for Koyeb

This guide shows you how to deploy the authenticated IDX keep-alive service to Koyeb using environment variables for cookies.

---

## Step 1: Local Setup & Get Cookies

### Install Dependencies
```powershell
npm install
```

### Login Locally to Get Cookies
```powershell
# Set your workspace URL
$env:IDX_WORKSPACE_URL="https://YOUR-WORKSPACE.idx.google.com"

# Run in non-headless mode for manual login
$env:HEADLESS="false"
$env:COOKIES_FILE="./cookies.json"

# Start the app
node index-authenticated.js
```

**What happens:**
1. Chrome window opens
2. You're redirected to Google login
3. **Login with your Google account**
4. After successful login, cookies are saved to `cookies.json`
5. Press Ctrl+C to stop

✅ **You now have authenticated cookies in cookies.json!**

---

## Step 2: Encode Cookies for Koyeb

Run the encoder script:

```powershell
.\encode-cookies.ps1
```

This will:
- Encode your `cookies.json` to base64
- Copy it to your clipboard
- Display instructions

**Copy the base64 string** - you'll need it in the next step.

---

## Step 3: Deploy to Koyeb

### Create New Web Service

1. Go to [Koyeb Dashboard](https://app.koyeb.com/)
2. Click **"Create Service"**
3. Choose deployment method:
   - **GitHub** (recommended - auto-deploy on push)
   - **Docker** (use pre-built image)
   - **Git** (any Git repository)

### Configure Service Settings

#### Builder Section
- **Repository:** Select your GitHub repo
- **Branch:** `main` (or your default branch)
- **Build command:** `npm install`
- **Run command:** `node index-authenticated.js`

Or if using Docker:
- **Docker image:** You can build from the included Dockerfile

#### Instance Settings
- **Name:** `idx-keepalive` (or any name)
- **Region:** Choose closest to you (e.g., `fra` for Europe, `was` for US East)
- **Instance type:** **Nano** (Free tier - 512MB RAM, shared CPU)

### Add Environment Variables

Click **"Environment variables"** and add:

| Variable | Value | Secret? |
|----------|-------|---------|
| `GOOGLE_COOKIES_BASE64` | [paste base64 from encode-cookies.ps1] | ✅ Yes |
| `IDX_WORKSPACE_URL` | `https://your-workspace.idx.google.com` | ❌ No |
| `PING_INTERVAL_MS` | `300000` (5 minutes) | ❌ No |
| `HEADLESS` | `true` | ❌ No |
| `PORT` | `8080` | ❌ No |

**Important:** Mark `GOOGLE_COOKIES_BASE64` as **Secret** for security!

### Expose Service (Health Check)

- **Port:** `8080`
- **Protocol:** `HTTP`
- **Path:** `/health` (for health checks)

### Deploy

Click **"Deploy"** - Koyeb will:
1. Clone/pull your repository
2. Build the app with `npm install`
3. Start the service with `node index-authenticated.js`
4. Assign a public URL (e.g., `https://idx-keepalive-yourapp.koyeb.app`)

---

## Step 4: Verify It's Working

### Check Logs

In Koyeb dashboard:
- Go to your service
- Click **"Logs"** tab
- Should see: `✓ Loaded cookies from environment variable`
- Should see: `✓ Workspace is alive and authenticated!`

### Visit Health Endpoint

Open: `https://your-app.koyeb.app/health`

Should return:
```json
{
  "status": "running",
  "pingCount": 1,
  "lastPingStatus": "HTTP 200",
  "lastPingTime": "2024-12-14T22:30:00.000Z",
  "config": {
    "workspace": "https://your-workspace.idx.google.com",
    "intervalMinutes": 5,
    "headless": true
  }
}
```

---

## Updating Cookies (When They Expire)

Google sessions expire after a few weeks. When that happens:

1. **Run locally again** with `HEADLESS=false` to re-login
2. **Re-encode cookies:**
   ```powershell
   .\encode-cookies.ps1
   ```
3. **Update Koyeb environment variable:**
   - Go to service → **Settings** → **Environment variables**
   - Edit `GOOGLE_COOKIES_BASE64` (marked as secret)
   - Paste new base64 string
   - Click **"Update"** (auto-redeploys)

---

## Configuration Options

All via environment variables in Koyeb dashboard:

| Variable | Description | Default |
|----------|-------------|---------|
| `IDX_WORKSPACE_URL` | Your IDX workspace URL | **Required** |
| `GOOGLE_COOKIES_BASE64` | Base64-encoded cookies.json | **Required** |
| `PING_INTERVAL_MS` | Ping interval in milliseconds | 300000 (5 min) |
| `HEADLESS` | Run browser headless | true |
| `PORT` | Health check port | 8080 |

---

## Troubleshooting

### ❌ "Authentication Required" in logs

**Cookies expired:**
1. Run locally: `$env:HEADLESS="false"; node index-authenticated.js`
2. Login again
3. Re-encode: `.\encode-cookies.ps1`
4. Update `GOOGLE_COOKIES_BASE64` in Koyeb

### ❌ "Failed to parse GOOGLE_COOKIES_BASE64"

**Encoding issue:**
- Make sure you copied the **entire** base64 string
- No extra spaces or line breaks
- Mark it as a **Secret** in Koyeb
- Re-run `.\encode-cookies.ps1` and copy again

### ❌ "Cannot find module 'puppeteer'"

**Build failed:**
- Check build logs in Koyeb
- Make sure build command is: `npm install`
- Check that `package.json` is committed to your repo

### ❌ Browser/Puppeteer crashes or OOM errors

**Not enough memory:**
Koyeb Nano (512MB) may be tight for Puppeteer. Upgrade instance:
- Go to **Settings** → **Instance**
- Upgrade to **Small** (2GB RAM, ~$7/month)

Or optimize Puppeteer args in `index-authenticated.js`:
```javascript
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--single-process', // Important for low memory
  '--no-zygote'
]
```

### ❌ Health check failing / Service not starting

**Port issue:**
- Make sure `PORT` environment variable is `8080`
- Check that service is exposed on port `8080`
- Koyeb will auto-set `PORT`, but verify in logs

---

## Cost on Koyeb

### Free Tier (Hobby Plan)
- **Includes:** $5.50 worth of free credits/month
- **Nano instance:** $2.74/month = ~2 services free
- **Small instance:** $10.96/month = needs paid plan

### What You Need
- **1 Nano instance:** ~$2.74/month (within free tier) ✅
- **Bandwidth:** Minimal (~5-10MB/month)
- **Build time:** Minimal (< 1 min per deploy)

**Should stay within free tier** ✅

---

## Advantages vs Other Platforms

### ✅ Koyeb Advantages
- **Always on** - No sleep on free tier (unlike Render)
- **GitHub integration** - Auto-deploy on push
- **Multiple regions** - Choose closest to your location
- **Good performance** - Better than most free tiers
- **Web terminal** - SSH-like access to containers

### ⚠️ Considerations
- **Memory limit** - 512MB on free tier (may need paid for Puppeteer)
- **Smaller free tier** - Less generous than Fly.io
- **Newer platform** - Less mature than alternatives

---

## Comparison with Other Platforms

| Feature | Koyeb Free | Render Free | Fly.io Free |
|---------|------------|-------------|-------------|
| **RAM** | 512MB | 512MB | 256MB (3x VMs) |
| **Always On** | ✅ Yes | ❌ Sleeps after 15min | ✅ Yes |
| **Auto-deploy** | ✅ GitHub | ✅ GitHub | ❌ Manual |
| **Web UI** | ✅ Easy | ✅ Easy | ⚠️ CLI-focused |
| **Regions** | 4+ | 2+ | 30+ |
| **Build time** | Fast | Medium | Fast |

**Best for:** Users who want always-on service with GitHub auto-deploy and don't want CLI complexity.

---

## Security Notes

🔒 **Your Google cookies are stored as environment variables**
- Encrypted at rest by Koyeb
- Only accessible by your service
- **Always mark as Secret** when adding
- **Never commit cookies.json to git** (already in .gitignore)

Consider creating a dedicated Google account just for IDX if security is a concern.

---

## GitHub Auto-Deploy Setup

If you deployed from GitHub, any push to your repository will trigger auto-deployment:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update configuration"
   git push
   ```
3. Koyeb automatically detects the push and redeploys

**Note:** Cookie updates via environment variables don't require code changes.

---

## Advanced: Using Docker Deployment

If you prefer Docker deployment:

1. Build locally (optional):
   ```bash
   docker build -t idx-keepalive .
   ```

2. Push to registry (Docker Hub, GitHub Container Registry, etc.)

3. In Koyeb, select **"Docker"** deployment method

4. Enter your image: `your-username/idx-keepalive:latest`

5. Add environment variables as above

6. Deploy

---

## Next Steps

Once deployed and working:
1. Monitor logs in Koyeb dashboard
2. Check health: `https://your-app.koyeb.app/health`
3. Set up alerts in Koyeb for service failures
4. Re-authenticate every few weeks when session expires

Your IDX workspace will stay alive 24/7! 🎉

---

## Support & Resources

- 📖 [Koyeb Documentation](https://www.koyeb.com/docs)
- 💬 [Koyeb Community](https://community.koyeb.com/)
- 🐛 [Report Issues](https://github.com/koyeb/koyeb-cli/issues)
