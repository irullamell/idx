# IDX Keep-Alive Pinger

A lightweight, always-on service that pings your Google IDX ([idx.google.com](https://idx.google.com/)) workspace to prevent idle timeout. Designed for deployment on free-tier platforms like Fly.io.

## Features

- 🔄 Periodic HTTP pings to keep IDX workspace alive
- 📧 **Email alerts** for service failures and cookie expiry
- 🏥 Built-in health check endpoint for monitoring
- 🔐 Optional session cookie authentication
- 📊 Ping statistics and status tracking
- 🍪 Cookie expiry monitoring and analysis
- 🐳 Docker-ready with Fly.io configuration
- ⚡ Ultra-lightweight (< 70MB container)

![til](https://dysmorphia.dpdns.org/api/shares/e5bd97f7-9e5b-4d2f-9842-d19ef1dd5382/files/019b1ebd-7eb1-7f68-9631-f6dc0d860a6a/example.gif)   

## Quick Start

### Local Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set your IDX workspace URL:**
   ```bash
   # Windows (PowerShell)
   $env:IDX_WORKSPACE_URL="https://your-workspace.idx.google.com"
   
   # Linux/Mac
   export IDX_WORKSPACE_URL="https://your-workspace.idx.google.com"
   ```

3. **Run locally:**
   ```bash
   npm start
   ```

4. **Check health:**
   Open `http://localhost:8080/health` in your browser

### Deploy to Cloud Platforms (Free Tier)

**Choose your platform:**
- 📘 **[Render.com Deployment Guide](RENDER.md)** - Easiest setup with web UI
- 📗 **[Fly.io Deployment Guide](DEPLOY.md)** - CLI-based deployment
- 📙 **[Koyeb Deployment Guide](KOYEB.md)** - GitHub integration option

#### Quick Deploy to Fly.io

1. **Install Fly CLI:**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # Mac/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io:**
   ```bash
   fly auth login
   ```

3. **Create and configure your app:**
   ```bash
   fly apps create idx-keepalive  # Or your preferred name
   ```

4. **Set your workspace URL as a secret:**
   ```bash
   fly secrets set IDX_WORKSPACE_URL="https://your-workspace.idx.google.com"
   ```

5. **Optional: Add session cookie for authenticated pings:**
   ```bash
   fly secrets set IDX_SESSION_COOKIE="your_session_cookie_here"
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

7. **Verify it's running:**
   ```bash
   fly status
   fly logs
   ```

#### Quick Deploy to Koyeb

1. **Go to Koyeb Dashboard:**
   Navigate to https://app.koyeb.com/

2. **Create Service:**
   Click "Create Service" and choose GitHub or Docker

3. **Configure Service:**
   - Repository: Your GitHub repo
   - Build: `npm install`
   - Run: `node index-authenticated.js`
   - Region: Choose closest to you

4. **Encode your cookies:**
   ```bash
   .\encode-cookies.ps1
   ```
   Copy the base64 string

5. **Add Environment Variables:**
   - `GOOGLE_COOKIES_BASE64` = [your base64 string] (mark as Secret)
   - `IDX_WORKSPACE_URL` = https://your-workspace.idx.google.com
   - `HEADLESS` = true
   - `PORT` = 8080

6. **Deploy:**
   Submit and Koyeb will auto-deploy

See [KOYEB.md](KOYEB.md) for detailed instructions.

## Configuration

Configure via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `IDX_WORKSPACE_URL` | Your IDX workspace URL (required) | - |
| `PING_INTERVAL_MS` | Ping interval in milliseconds | 300000 (5 min) |
| `IDX_SESSION_COOKIE` | Session cookie for authenticated requests | - |
| `PORT` | Health check server port | 8080 |
| `EMAIL_ENABLED` | Enable email alerts (new) | false |
| `EMAIL_SERVICE` | Email provider: gmail, outlook, etc | gmail |
| `EMAIL_USER` | Sender email address | - |
| `EMAIL_PASSWORD` | Email app password | - |
| `EMAIL_RECIPIENT` | Email recipient for alerts | - |
| `ERROR_EMAIL_THRESHOLD` | Errors before sending alert | 3 |
| `COOKIE_EXPIRY_WARNING_DAYS` | Days before warning about expiry | 7 |

## Email Notifications (NEW!)

Get alerts for service failures and cookie expiry issues:

### Quick Setup (5 minutes)

1. **Get Gmail App Password:**
   - Enable 2FA at https://myaccount.google.com/security
   - Generate app password at https://myaccount.google.com/apppasswords
   - Copy the 16-character password

2. **Add Email Variables:**
   ```bash
   # Fly.io example:
   fly secrets set EMAIL_ENABLED=true
   fly secrets set EMAIL_SERVICE=gmail
   fly secrets set EMAIL_USER=your-email@gmail.com
   fly secrets set EMAIL_PASSWORD=your-app-password
   fly secrets set EMAIL_RECIPIENT=your-email@gmail.com
   fly secrets set ERROR_EMAIL_THRESHOLD=3
   fly deploy
   ```

3. **Verify in logs:**
   ```bash
   fly logs | grep EMAIL
   # Should see: [EMAIL] Email notifications enabled
   ```

### What You'll Get

- 📧 **Service Failure Alerts** - Email after 3 consecutive ping errors
- 🍪 **Cookie Expiry Warnings** - Know when cookies need updating
- 📊 **Detailed Reports** - Error messages, timestamps, next steps

### Check Cookie Status

```bash
node check-cookie-expiry.js
```

Shows: Expired 🔴 | Expiring Soon 🟡 | Healthy 🟢

### Monitor Cookies on Schedule

```bash
node cookie-monitor.js
```

Can be run manually or scheduled as cron job/Windows Task.

### Encode Cookies with Email

```powershell
# Encode to base64
.\encode-cookies.ps1

# Send via email
.\encode-cookies.ps1 -EmailAddress "your@email.com" -SendEmail
```

### Full Documentation

For detailed setup, troubleshooting, and advanced options:
- 📖 **[START_HERE.md](START_HERE.md)** - Overview
- 📖 **[EMAIL_QUICKSTART.md](EMAIL_QUICKSTART.md)** - 5-minute guide
- 📖 **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - Detailed platform guides
- 📖 **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Step-by-step

## Cookie Management Tools

New utilities for managing and monitoring cookies:

### check-cookie-expiry.js
Analyze your cookies.json file to see expiration dates:
```bash
node check-cookie-expiry.js
```
Output:
- 🔴 **Expired** - Need immediate update
- 🟡 **Expiring Soon** - Update within warning period
- 🟢 **Healthy** - All good for now

### cookie-monitor.js
Monitor cookies and send email alerts:
```bash
node cookie-monitor.js
```
Can be scheduled as:
- **Linux/Mac cron:** `0 9 * * * node /path/to/cookie-monitor.js`
- **Windows Task Scheduler:** Run daily at 9 AM

### encode-cookies.ps1 (Enhanced)
Now supports email delivery:
```powershell
# Copy to clipboard
.\encode-cookies.ps1

# Email the encoded cookies
.\encode-cookies.ps1 -EmailAddress "your@email.com" -SendEmail
```

## Getting Your Session Cookie (if needed)

If unauthenticated pings don't work, capture your session cookie:

1. Open your IDX workspace in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Reload the page
5. Click any request to idx.google.com
6. Copy the `Cookie` header value
7. Set it as `IDX_SESSION_COOKIE` secret

**Note:** Session cookies may expire. You may need to refresh them periodically or implement automated auth.

## Alternative Deployments

### Railway.app
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
railway variables set IDX_WORKSPACE_URL="your-url"
```

### Render.com
1. Connect your GitHub repo
2. Create a new Web Service
3. Set environment variables in dashboard
4. Deploy

### Digital Ocean App Platform
Use the Dockerfile for container deployment with free tier allowance.

## Advanced: Automated Authentication

If cookies expire frequently, create `auth.js`:

```javascript
// Example using Playwright for automated auth
const { chromium } = require('playwright');

async function getSessionCookie() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate and authenticate
  await page.goto('https://idx.google.com');
  // Add your auth flow here
  
  const cookies = await context.cookies();
  await browser.close();
  
  return cookies.find(c => c.name === 'session_cookie_name');
}
```

## Monitoring

Health endpoint returns JSON with:
- Current status
- Total ping count
- Last ping status and time
- Configuration details
- Service uptime

Access via: `https://your-app.fly.dev/health`

## Troubleshooting

**Pings fail with 401/403:**
- Add session cookie authentication
- Verify workspace URL is correct

**Service stops after deployment:**
- Ensure `auto_stop_machines = false` in fly.toml
- Check Fly.io logs: `fly logs`

**High memory usage:**
- Current setup uses ~20-30MB
- Adjust VM size if needed in fly.toml

## Cost

- **Fly.io Free Tier:** 3 shared-cpu-1x VMs + 160GB/month transfer
- This service uses ~1 VM, minimal bandwidth
- Should stay within free tier limits

## License

MIT
