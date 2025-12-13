# Step-by-Step Deployment Guide

## Prerequisites
- Your IDX workspace URL (e.g., `https://1234567890.idx.google.com`)
- Fly.io account (free - sign up at fly.io)
- Node.js installed on your PC

---

## STEP 1: Install Dependencies Locally

Open PowerShell in this folder and run:

```powershell
npm install
```

Wait for Puppeteer to download (~300MB). This is normal.

---

## STEP 2: Login Locally to Get Cookies

### Set your workspace URL:
```powershell
$env:IDX_WORKSPACE_URL="https://YOUR-WORKSPACE-ID.idx.google.com"
```
**Replace with your actual IDX workspace URL!**

### Run in visible browser mode:
```powershell
$env:HEADLESS="false"
$env:COOKIES_FILE="./cookies.json"
node index-authenticated.js
```

### What happens:
1. A Chrome window will open
2. It will navigate to your IDX workspace
3. Google will ask you to login
4. **Login with your Google account** (the one you use for IDX)
5. After login, you'll see your IDX workspace load
6. In the terminal, you'll see: `✓ Login successful! Cookies saved for future use.`
7. Press **Ctrl+C** to stop the script

### Verify cookies were saved:
```powershell
ls cookies.json
```
You should see a `cookies.json` file in this folder.

---

## STEP 3: Install Fly.io CLI

```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

Close and reopen PowerShell after installation.

---

## STEP 4: Login to Fly.io

```powershell
fly auth login
```

This will open your browser to login/signup to Fly.io (free account).

---

## STEP 5: Create the App

```powershell
fly apps create idx-keepalive
```

**Note:** If this name is taken, use a different name like `idx-keepalive-yourname`

---

## STEP 6: Create Persistent Volume for Cookies

```powershell
fly volumes create idx_cookies --size 1 --region iad
```

**Note:** If you want a different region, replace `iad` with your closest:
- `iad` - Washington DC (East US)
- `lax` - Los Angeles (West US)
- `lhr` - London
- `fra` - Frankfurt
- `syd` - Sydney

---

## STEP 7: Set Your Workspace URL as Secret

```powershell
fly secrets set IDX_WORKSPACE_URL="https://YOUR-WORKSPACE-ID.idx.google.com"
```

**Again, use your actual workspace URL!**

---

## STEP 8: Deploy the App

```powershell
fly deploy
```

This will:
- Build the Docker image (takes 2-3 minutes first time)
- Deploy to Fly.io
- Start the app

**Wait for it to complete.** You'll see build logs.

---

## STEP 9: Upload Your Cookies

Now we need to copy your local `cookies.json` to the server.

### Option A: Using fly ssh sftp (Recommended)

```powershell
fly ssh sftp shell
```

In the SFTP prompt that appears:
```
put cookies.json /data/cookies.json
exit
```

### Option B: Using fly ssh console (if SFTP doesn't work)

```powershell
# First, display your cookies content
Get-Content cookies.json

# Copy the entire output
# Then SSH into the server
fly ssh console

# Once connected, create the cookies file
cat > /data/cookies.json << 'EOF'
# PASTE YOUR COOKIES HERE (the content you copied)
# Press Ctrl+D when done
EOF

# Exit SSH
exit
```

### Option C: Using secrets (if cookies are small)

```powershell
# Read cookies file
$cookies = Get-Content cookies.json -Raw

# Set as secret (might be too large, try it)
fly secrets set GOOGLE_COOKIES=$cookies
```

If you use Option C, you need to modify the code slightly (I can help with this).

---

## STEP 10: Restart the App

After uploading cookies:

```powershell
fly apps restart idx-keepalive
```

---

## STEP 11: Verify It's Working

### Check logs:
```powershell
fly logs
```

**You should see:**
```
✓ Loaded saved cookies
Navigating to https://your-workspace.idx.google.com...
✓ Current URL: https://your-workspace.idx.google.com
✓ Workspace is alive and authenticated!
```

### Check status:
```powershell
fly status
```

Should show: `1 machine running`

### Check health endpoint:

Visit in your browser:
```
https://idx-keepalive.fly.dev/health
```

**You should see JSON with:**
```json
{
  "status": "running",
  "pingCount": 1,
  "lastPingStatus": "HTTP 200",
  ...
}
```

---

## DONE! 🎉

Your IDX workspace will now receive an authenticated ping every 5 minutes.

The app will:
- ✅ Keep your IDX VM alive
- ✅ Run 24/7 on Fly.io free tier
- ✅ Use your Google session cookies
- ✅ Restart automatically if it crashes

---

## What to Do If Cookies Expire

Google sessions can expire after a few weeks. If you see in logs:

```
⚠️  Authentication required!
```

Just repeat **STEP 2** to get fresh cookies, then **STEP 9** to upload them again.

---

## Monitoring Commands

```powershell
# View live logs
fly logs

# Check app status
fly status

# SSH into the app
fly ssh console

# Restart the app
fly apps restart idx-keepalive

# Check health
# Visit: https://idx-keepalive.fly.dev/health
```

---

## Troubleshooting

### ❌ "No such volume"
You forgot STEP 6. Run:
```powershell
fly volumes create idx_cookies --size 1 --region iad
fly deploy
```

### ❌ "AUTH_REQUIRED" in logs
Cookies missing or expired:
1. Re-run STEP 2 locally to get fresh cookies
2. Re-run STEP 9 to upload them
3. Restart: `fly apps restart idx-keepalive`

### ❌ Build fails with "npm ci" error
Already fixed in the Dockerfile, but if it happens:
```powershell
npm install
fly deploy
```

### ❌ "App not found"
You didn't create the app or used a different name. Run:
```powershell
fly apps list
```
Use the correct app name in all commands.

---

## Need Help?

Common issues:
1. **Wrong workspace URL** - Double-check it's your actual IDX workspace URL
2. **Cookies not uploaded** - Make sure STEP 9 completed successfully
3. **Volume not created** - STEP 6 is critical, don't skip it

Check logs first: `fly logs` - they usually show what's wrong.
