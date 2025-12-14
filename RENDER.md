# Deployment Guide - Render.com

## Quick Setup for Render.com

This guide shows you how to deploy the authenticated IDX keep-alive service to Render.com using environment variables for cookies.

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

## Step 2: Encode Cookies for Render.com

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

## Step 3: Deploy to Render.com

### Create New Web Service

1. Go to [Render.com Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository (or deploy from GitHub)

### Configure Service

**Build & Deploy Settings:**
- **Name:** `idx-keepalive` (or any name)
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node index-authenticated.js`
- **Instance Type:** `Free` (512MB RAM is enough)

### Add Environment Variables

Click **"Environment"** and add these variables:

| Key | Value |
|-----|-------|
| `GOOGLE_COOKIES_BASE64` | [paste the base64 string from encode-cookies.ps1] |
| `IDX_WORKSPACE_URL` | `https://your-workspace.idx.google.com` |
| `PING_INTERVAL_MS` | `300000` (5 minutes, optional) |
| `HEADLESS` | `true` (optional, default is true) |

### Deploy

Click **"Create Web Service"** - Render will:
1. Clone your repo
2. Install dependencies
3. Start the service
4. Assign a URL (e.g., `https://idx-keepalive-abc123.onrender.com`)

---

## Step 4: Verify It's Working

### Check Logs

In Render dashboard:
- Go to your service
- Click **"Logs"** tab
- Should see: `✓ Loaded cookies from environment variable`

### Visit Health Endpoint

Open: `https://your-app.onrender.com/health`

Should return:
```json
{
  "status": "running",
  "pingCount": 1,
  "lastPingStatus": "HTTP 200",
  "lastPingTime": "2024-01-10T12:34:56.789Z"
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
3. **Update Render.com environment variable:**
   - Go to Environment tab
   - Edit `GOOGLE_COOKIES_BASE64`
   - Paste new base64 string
   - Save (auto-redeploys)

---

## Configuration Options

All via environment variables in Render dashboard:

| Variable | Description | Default |
|----------|-------------|---------|
| `IDX_WORKSPACE_URL` | Your IDX workspace URL | **Required** |
| `GOOGLE_COOKIES_BASE64` | Base64-encoded cookies.json | **Required** |
| `PING_INTERVAL_MS` | Ping interval in ms | 300000 (5 min) |
| `HEADLESS` | Run browser headless | true |
| `PORT` | Health check port | 8080 (auto-set by Render) |

---

## Troubleshooting

### ❌ "Authentication Required" in logs

**Cookies expired:**
1. Run locally: `$env:HEADLESS="false"; node index-authenticated.js`
2. Login again
3. Re-encode: `.\encode-cookies.ps1`
4. Update `GOOGLE_COOKIES_BASE64` in Render

### ❌ "Failed to parse GOOGLE_COOKIES_BASE64"

**Encoding issue:**
- Make sure you copied the **entire** base64 string
- No extra spaces or line breaks
- Re-run `.\encode-cookies.ps1` and copy again

### ❌ High memory usage / crashes

Browser automation needs more RAM. Upgrade instance:
- Go to **Settings** → **Instance Type**
- Upgrade to **Starter** ($7/month, 512MB → 2GB)

### ❌ Service keeps restarting

Check logs for errors:
- Missing environment variables?
- Invalid base64 encoding?
- Out of memory?

---

## Cost on Render.com

- **Free tier includes:** 750 hours/month per service
- **This app uses:** 1 web service, always running (744 hours/month)
- **Memory:** 512MB (free tier)

**Should stay within free tier** ✅

**Note:** Free tier services may spin down after 15 min of inactivity. Use a paid plan ($7/month) for 24/7 uptime.

---

## Advantages vs Fly.io

✅ **Simpler deployment** - No volume setup, just environment variables  
✅ **Web UI** - Easier to manage than CLI  
✅ **Auto-deploys** - Connect to GitHub for automatic deployments  

❌ **Sleep on free tier** - Services sleep after 15 min inactivity (use paid plan to avoid)  
❌ **No persistent disk on free tier** - Must use environment variables for cookies  

---

## Security Notes

🔒 **Your Google cookies are stored as environment variables**
- Encrypted at rest by Render
- Only accessible by your service
- **Never commit cookies.json to git** (already in .gitignore)

Consider creating a dedicated Google account just for IDX if security is a concern.

---

## Next Steps

Once deployed and working:
1. Monitor logs in Render dashboard
2. Check health: `https://your-app.onrender.com/health`
3. Re-authenticate every few weeks when session expires

Your IDX workspace will stay alive 24/7! 🎉
