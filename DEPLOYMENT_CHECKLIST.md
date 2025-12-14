# Email Feature - Deployment Checklist

## Phase 1: Preparation (5 minutes)

- [ ] **Read Documentation**
  - [ ] EMAIL_QUICKSTART.md (quick overview)
  - [ ] EMAIL_SETUP.md (detailed guide for your email provider)

- [ ] **Prepare Email Credentials**
  - [ ] For Gmail:
    - [ ] Enable 2FA at https://myaccount.google.com/security
    - [ ] Wait a few minutes
    - [ ] Generate app password at https://myaccount.google.com/apppasswords
    - [ ] Copy 16-character password (remove spaces)
  - [ ] For Outlook/Other:
    - [ ] Gather SMTP credentials
    - [ ] Test credentials locally if possible

- [ ] **Decide Recipients**
  - [ ] EMAIL_USER (sender - your app email)
  - [ ] EMAIL_RECIPIENT (alerts go here - can be different)

## Phase 2: Local Testing (10 minutes) - OPTIONAL but RECOMMENDED

- [ ] **Install Packages**
  ```bash
  npm install
  ```

- [ ] **Set Environment Variables**
  ```powershell
  # Windows PowerShell
  $env:EMAIL_ENABLED="true"
  $env:EMAIL_SERVICE="gmail"
  $env:EMAIL_USER="your-email@gmail.com"
  $env:EMAIL_PASSWORD="your-16-char-app-password"
  $env:EMAIL_RECIPIENT="your-email@gmail.com"
  $env:IDX_WORKSPACE_URL="https://your-workspace.idx.google.com"
  ```

- [ ] **Start Service**
  ```bash
  npm start
  ```

- [ ] **Check Logs**
  - [ ] Look for: `[EMAIL] Email notifications enabled`
  - [ ] If error, see troubleshooting section below

- [ ] **Test Email (Optional)**
  - [ ] Let service run until 3 consecutive errors occur
  - [ ] Or manually modify code to trigger email
  - [ ] Check inbox and spam folder

- [ ] **Stop Service**
  ```
  Ctrl+C
  ```

## Phase 3: Deployment Configuration (5 minutes)

### For Render.com:
- [ ] Go to Render Dashboard
- [ ] Select your IDX service
- [ ] Click "Settings"
- [ ] Go to "Environment" tab
- [ ] Add variables one by one:
  - [ ] `EMAIL_ENABLED` = `true`
  - [ ] `EMAIL_SERVICE` = `gmail`
  - [ ] `EMAIL_USER` = your app email
  - [ ] `EMAIL_PASSWORD` = your app password
  - [ ] `EMAIL_RECIPIENT` = notification email
  - [ ] `ERROR_EMAIL_THRESHOLD` = `3` (or your preference)
  - [ ] `COOKIE_EXPIRY_WARNING_DAYS` = `7` (or your preference)
- [ ] Click "Save & Deploy"
- [ ] Wait for deployment to complete

### For Fly.io:
- [ ] Open terminal
- [ ] Run commands (one at a time):
  ```bash
  fly secrets set EMAIL_ENABLED=true
  fly secrets set EMAIL_SERVICE=gmail
  fly secrets set EMAIL_USER=your-email@gmail.com
  fly secrets set EMAIL_PASSWORD=your-app-password
  fly secrets set EMAIL_RECIPIENT=your-email@gmail.com
  fly secrets set ERROR_EMAIL_THRESHOLD=3
  fly secrets set COOKIE_EXPIRY_WARNING_DAYS=7
  ```
- [ ] Deploy:
  ```bash
  fly deploy
  ```
- [ ] Wait for deployment to complete

## Phase 4: Verification (5 minutes)

- [ ] **Check Deployment Logs**
  - [ ] Render: Logs tab in service dashboard
  - [ ] Fly.io: `fly logs`
  - [ ] Look for: `[EMAIL] Email notifications enabled`

- [ ] **View Health Endpoint**
  - [ ] Render: `https://your-service.onrender.com/health`
  - [ ] Fly.io: `https://your-app.fly.dev/health`
  - [ ] Should show JSON status

- [ ] **Monitor Initial Pings**
  - [ ] Watch logs for ping results
  - [ ] Should see `Ping #1: HTTP 200` etc.

## Phase 5: Cookie Management (5 minutes)

- [ ] **Check Current Cookie Status**
  ```bash
  node check-cookie-expiry.js
  ```
  - [ ] Review expiry status
  - [ ] Note any expired cookies

- [ ] **Update Expired Cookies**
  ```powershell
  .\encode-cookies.ps1
  ```
  - [ ] Follow the instructions shown
  - [ ] Copy the base64 string
  - [ ] Update your deployment environment variable

- [ ] **Optional: Set Up Scheduled Monitoring**
  - [ ] Linux/Mac (cron):
    ```bash
    0 9 * * * /usr/bin/node /path/to/cookie-monitor.js
    ```
  - [ ] Windows (Task Scheduler):
    - [ ] Open Task Scheduler
    - [ ] Create Basic Task
    - [ ] Set trigger (daily at 9 AM)
    - [ ] Set action: Run `node C:\path\to\cookie-monitor.js`

## Phase 6: Test Email Alerts (OPTIONAL)

### Method 1: Wait for Natural Error
- [ ] Stop your IDX workspace or block network
- [ ] Wait for 3 consecutive ping failures
- [ ] Check inbox/spam for email

### Method 2: Simulate Error (Advanced)
- [ ] Edit index.js temporarily
- [ ] In pingIDXWorkspace(), add error simulation
- [ ] Redeploy
- [ ] Check email received
- [ ] Remove code changes
- [ ] Redeploy again

## Troubleshooting Checklist

### Emails Not Received?

- [ ] **Check Logs**
  - [ ] Do you see `[EMAIL] Email notifications enabled`?
  - [ ] Or `[EMAIL] Email enabled but credentials missing`?

- [ ] **Verify Gmail Credentials**
  - [ ] Is 2FA enabled on Gmail account?
  - [ ] Did you use app password (16 chars), not main password?
  - [ ] Did you remove spaces from app password?
  - [ ] Is EMAIL_USER the Gmail address?

- [ ] **Check Email Configuration**
  - [ ] Is EMAIL_ENABLED set to `true`?
  - [ ] Is EMAIL_RECIPIENT set correctly?
  - [ ] Is EMAIL_SERVICE set to `gmail`?

- [ ] **Check Spam Folder**
  - [ ] Email might be in spam
  - [ ] Mark as "Not Spam"

- [ ] **Verify Error Threshold**
  - [ ] Reduce ERROR_EMAIL_THRESHOLD to 2 for testing
  - [ ] Makes it easier to trigger

### Too Many Emails?

- [ ] **Increase Threshold**
  - [ ] Set ERROR_EMAIL_THRESHOLD to 5 or higher
  - [ ] Redeploy

- [ ] **Check Service Health**
  - [ ] Are there actual errors happening?
  - [ ] Or is network flaky?

### Service Crashes on Email Error?

- [ ] This shouldn't happen (email errors are caught)
- [ ] Check logs for specific error message
- [ ] See EMAIL_SETUP.md troubleshooting section

## Post-Deployment Checklist

- [ ] ✅ Email notifications working
- [ ] ✅ Logs show `[EMAIL] Email notifications enabled`
- [ ] ✅ Cookies checked and updated if needed
- [ ] ✅ Health endpoint responds
- [ ] ✅ Service is pinging workspace
- [ ] ✅ Test email received (optional)

## Maintenance Checklist (Monthly)

- [ ] Check cookie expiry: `node check-cookie-expiry.js`
- [ ] Review email alerts (check folder)
- [ ] Verify service is running: Check /health endpoint
- [ ] Rotate Gmail app password (optional but recommended)
- [ ] Update cookies before expiry

## Documentation Reference

Keep these files handy:
- 📖 **EMAIL_QUICKSTART.md** - Quick overview
- 📖 **EMAIL_SETUP.md** - Detailed setup guide
- 📖 **EMAIL_FEATURE_SUMMARY.md** - Feature overview
- 📖 **ARCHITECTURE.md** - System design
- 📖 **.env.example** - Configuration reference

## Quick Command Reference

```bash
# Check cookie status
node check-cookie-expiry.js

# Encode cookies (copy to clipboard)
.\encode-cookies.ps1

# Encode cookies with email
.\encode-cookies.ps1 -EmailAddress "your@email.com" -SendEmail

# Monitor cookies
node cookie-monitor.js

# Start service
npm start

# Install dependencies
npm install

# Check syntax
node -c index.js
node -c check-cookie-expiry.js
```

## Support Resources

If something goes wrong:
1. Check EMAIL_SETUP.md troubleshooting section
2. Review deployment platform logs
3. Verify all environment variables set
4. Test credentials locally
5. Check spam folder
6. Increase threshold to reduce noise

---

## Completion Checklist

- [ ] Phase 1: Preparation complete
- [ ] Phase 2: Local testing passed (or skipped)
- [ ] Phase 3: Deployed to cloud platform
- [ ] Phase 4: Verified logs and health
- [ ] Phase 5: Cookies updated
- [ ] Phase 6: Email alerts tested (or will test naturally)
- [ ] Post-deployment checks complete

**Status:** ✅ Ready to use when all items checked!

---

**Estimated Total Time:** 25-30 minutes (including local testing)
**Minimal Setup Time:** 10 minutes (skip Phase 2)
