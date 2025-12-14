# Platform Quick Reference

## Which Platform Should I Choose?

### 🥇 Koyeb (Recommended)
**Best for:** Most users, always-on service with GitHub auto-deploy

✅ **Pros:**
- Always on (no sleep)
- GitHub auto-deploy
- Easy web UI
- 512MB RAM free
- Multiple regions

❌ **Cons:**
- Smaller free tier credits than Fly.io
- May need paid plan for heavy Puppeteer usage

📖 **Guide:** [KOYEB.md](KOYEB.md)

---

### 🥈 Render.com
**Best for:** Beginners, simplest setup

✅ **Pros:**
- Easiest web UI
- GitHub auto-deploy
- 512MB RAM free
- Simple environment variables

❌ **Cons:**
- **Sleeps after 15 min inactivity** (defeats purpose!)
- Need paid plan ($7/mo) for 24/7 uptime

📖 **Guide:** [RENDER.md](RENDER.md)

**⚠️ Note:** Free tier not recommended for this use case due to sleep behavior.

---

### 🥉 Fly.io
**Best for:** Advanced users, need specific regions

✅ **Pros:**
- Most generous free tier
- 30+ regions worldwide
- Always on
- 3x 256MB VMs free

❌ **Cons:**
- CLI-only (no web UI)
- More complex setup
- Manual deployment
- Cookie upload via SFTP

📖 **Guide:** [DEPLOY.md](DEPLOY.md)

---

## Quick Setup Comparison

| Step | Koyeb | Render | Fly.io |
|------|-------|--------|--------|
| **1. Get cookies** | `.\encode-cookies.ps1` | `.\encode-cookies.ps1` | Manual login |
| **2. Create service** | Web UI | Web UI | CLI: `fly apps create` |
| **3. Add cookies** | Env var (paste base64) | Env var (paste base64) | SFTP upload |
| **4. Deploy** | Click "Deploy" | Click "Deploy" | CLI: `fly deploy` |
| **5. Updates** | Git push auto-deploys | Git push auto-deploys | Manual `fly deploy` |

---

## Environment Variables Needed

All platforms need these environment variables:

| Variable | Value | Required? |
|----------|-------|-----------|
| `GOOGLE_COOKIES_BASE64` | Output from `encode-cookies.ps1` | ✅ Yes (Koyeb/Render only) |
| `IDX_WORKSPACE_URL` | `https://your-workspace.idx.google.com` | ✅ Yes (all platforms) |
| `PING_INTERVAL_MS` | `300000` (5 minutes) | ⚪ Optional |
| `HEADLESS` | `true` | ⚪ Optional |
| `PORT` | `8080` | ⚪ Auto-set by platform |

**Fly.io:** Uses file-based cookies instead of `GOOGLE_COOKIES_BASE64`

---

## Cost Comparison (Free Tier)

| Platform | Monthly Cost | Always On? | Suitable? |
|----------|--------------|------------|-----------|
| **Koyeb** | $0 (within $5.50 credits) | ✅ Yes | ✅ **Best** |
| **Render** | $0 (but sleeps) | ❌ No | ⚠️ Limited |
| **Render Paid** | $7/month | ✅ Yes | ✅ Good |
| **Fly.io** | $0 (within free tier) | ✅ Yes | ✅ Good |

---

## Setup Time

| Platform | Estimated Time | Difficulty |
|----------|----------------|------------|
| **Koyeb** | ~10 minutes | 🟢 Easy |
| **Render** | ~10 minutes | 🟢 Easy |
| **Fly.io** | ~20 minutes | 🟡 Medium |

---

## When Cookies Expire (Every 2-4 weeks)

### Koyeb/Render:
1. Run locally: `$env:HEADLESS="false"; node index-authenticated.js`
2. Login again
3. Encode: `.\encode-cookies.ps1`
4. Update `GOOGLE_COOKIES_BASE64` in platform dashboard
5. Auto-redeploys

**Time:** ~5 minutes

### Fly.io:
1. Run locally to get fresh cookies
2. SSH/SFTP to upload new cookies.json
3. Restart service

**Time:** ~10 minutes

---

## Recommendation Matrix

| Your Situation | Choose |
|----------------|--------|
| Want easiest setup | **Koyeb** |
| Want GitHub auto-deploy | **Koyeb** or **Render ($7/mo)** |
| Want most free resources | **Fly.io** |
| Need specific region | **Fly.io** (30+ regions) |
| Don't mind CLI | **Fly.io** |
| Want web UI only | **Koyeb** or **Render** |
| Budget: $0/month | **Koyeb** or **Fly.io** |
| Budget: $7/month | **Render** (simplest paid) |

---

## TL;DR - Just Tell Me What To Do

### For Most Users:
1. ✅ Use **Koyeb**
2. Follow [KOYEB.md](KOYEB.md)
3. Done in 10 minutes

### For Advanced Users:
1. ✅ Use **Fly.io** if you want more control
2. Follow [DEPLOY.md](DEPLOY.md)
3. Done in 20 minutes

### For Simplicity Lovers:
1. ⚠️ Use **Render** paid plan ($7/mo)
2. Follow [RENDER.md](RENDER.md)
3. Done in 10 minutes
4. Pay $7/month to keep it always on

---

## Support

- **Koyeb Issues:** [community.koyeb.com](https://community.koyeb.com/)
- **Render Issues:** [community.render.com](https://community.render.com/)
- **Fly.io Issues:** [community.fly.io](https://community.fly.io/)
- **This Project:** Open an issue on GitHub
