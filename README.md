# IDX Keep-Alive Pinger

A lightweight, always-on service that pings your Google IDX workspace to prevent idle timeout. Designed for deployment on free-tier platforms like Fly.io.

## Features

- 🔄 Periodic HTTP pings to keep IDX workspace alive
- 🏥 Built-in health check endpoint for monitoring
- 🔐 Optional session cookie authentication
- 📊 Ping statistics and status tracking
- 🐳 Docker-ready with Fly.io configuration
- ⚡ Ultra-lightweight (< 20MB container)

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

### Deploy to Fly.io (Free Tier)

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

## Configuration

Configure via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `IDX_WORKSPACE_URL` | Your IDX workspace URL (required) | - |
| `PING_INTERVAL_MS` | Ping interval in milliseconds | 300000 (5 min) |
| `IDX_SESSION_COOKIE` | Session cookie for authenticated requests | - |
| `PORT` | Health check server port | 8080 |

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
