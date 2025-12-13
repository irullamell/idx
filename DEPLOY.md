# Deployment Guide - Authenticated IDX Keep-Alive

## ⚠️ Important: Initial Setup Required

This pinger uses **real browser automation** with Puppeteer to maintain an authenticated Google session. You need to login **once** locally, then deploy.

---

## Step 1: Local Setup & Authentication

### Install Dependencies
```powershell
npm install
```

### Login Locally (One-Time)
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
1. A Chrome window will open
2. You'll be redirected to Google login
3. **Login with your Google account**
4. After successful login, cookies are saved to `cookies.json`
5. Press Ctrl+C to stop

✅ **You now have authenticated cookies!**

---

## Step 2: Deploy to Fly.io

### Create Volume for Persistent Cookies
```powershell
fly auth login

fly apps create idx-keepalive

# Create volume to persist cookies across deploys
fly volumes create idx_cookies --size 1 --region iad
```

### Set Workspace URL
```powershell
fly secrets set IDX_WORKSPACE_URL="https://YOUR-WORKSPACE.idx.google.com"
```

### Deploy
```powershell
fly deploy
```

### Upload Cookies to Volume
After first deployment, upload your cookies:

```powershell
# SSH into the VM
fly ssh console

# Exit the SSH session
exit
```

**Better method - Use fly sftp:**
```powershell
fly ssh sftp shell

# In SFTP shell:
put cookies.json /data/cookies.json
exit
```

---

## Step 3: Verify It's Working

```powershell
# Check logs - should show successful pings
fly logs

# Check health endpoint
fly status
# Visit: https://your-app.fly.dev/health
```

**Successful log output looks like:**
```
✓ Loaded saved cookies
Navigating to https://your-workspace.idx.google.com...
✓ Workspace is alive and authenticated!
```

---

## Alternative: Simpler Cookie Export Method

If SSH/SFTP is complex, use this approach:

### Option A: Manual Cookie Collection

1. **After local login**, your `cookies.json` file contains the session
2. **Deploy without cookies first**: `fly deploy`
3. **Set cookies as secret (not recommended for large data)**:
   ```powershell
   # Read cookies file and encode
   $cookies = Get-Content cookies.json -Raw
   fly secrets set GOOGLE_COOKIES="$cookies"
   ```

4. **Modify code to read from env var** (add to index-authenticated.js):
   ```javascript
   async function loadCookies() {
     // Try environment variable first
     if (process.env.GOOGLE_COOKIES) {
       return JSON.parse(process.env.GOOGLE_COOKIES);
     }
     // Then try file...
   }
   ```

### Option B: Use Fly.io Secrets for Individual Cookies

Extract key cookies from `cookies.json` and set as secrets:

```powershell
# Find the important session cookies in cookies.json
# Look for cookies from .google.com domain
# Set them individually
fly secrets set GOOGLE_SID="your_sid_value"
fly secrets set GOOGLE_HSID="your_hsid_value"
# ... etc
```

---

## Troubleshooting

### ❌ "Authentication Required" in logs

**Cookies expired or missing:**
1. Run locally again with `HEADLESS=false`
2. Re-login to get fresh cookies
3. Re-upload cookies.json to `/data/` volume

### ❌ High memory usage

Browser automation uses more memory. Increase in `fly.toml`:
```toml
[[vm]]
  memory_mb = 1024  # Increase to 1GB
```

### ❌ Cookies keep expiring

Google sessions can expire. Options:
1. **Refresh token approach** (complex, requires OAuth app)
2. **Periodic re-authentication** (add logic to detect auth failure and trigger re-login)
3. **Use service account** (if IDX supports it)

### ✅ Longer-term cookie persistence

Add to index-authenticated.js to detect auth failure and alert:
```javascript
if (lastPingStatus === 'AUTH_REQUIRED') {
  // Send alert via webhook, email, etc.
  // For now, just log prominently
  console.error('🚨 RE-AUTHENTICATION NEEDED! Cookies expired.');
}
```

---

## Configuration Options

All via environment variables (use `fly secrets set`):

| Variable | Description | Default |
|----------|-------------|---------|
| `IDX_WORKSPACE_URL` | Your IDX workspace URL | Required |
| `PING_INTERVAL_MS` | Ping interval in ms | 300000 (5 min) |
| `HEADLESS` | Run browser headless | true |
| `COOKIES_FILE` | Cookie storage path | /data/cookies.json |

---

## Cost on Fly.io

- **Free tier includes:** 3 shared-cpu VMs + 160GB transfer
- **This app uses:** 1 VM with 512MB RAM
- **Volume:** 1GB (free tier includes 3GB total)
- **Bandwidth:** ~5-10MB/month (minimal)

**Should stay within free tier** ✅

---

## Security Notes

🔒 **Your Google cookies are stored on Fly.io volume**
- Volume is encrypted at rest
- Only your app can access it
- **Never commit cookies.json to git** (already in .gitignore)

Consider creating a dedicated Google account just for IDX if security is a concern.

---

## Next Steps

Once deployed and working:
1. Monitor logs periodically: `fly logs`
2. Check health: `https://your-app.fly.dev/health`
3. Expect to re-authenticate every few weeks when Google session expires

Your IDX workspace will stay alive 24/7! 🎉

