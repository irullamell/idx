# Quick Start: Email Notifications

## What's New?

Your IDX Keep-Alive service now supports email alerts for:
- ✅ Service failures (ping errors)
- ✅ Cookie expiry checks
- ✅ Cookie encoding with email delivery (PowerShell script)

## Quick Setup (5 minutes)

### 1. Get a Gmail App Password

If you don't have 2FA enabled:
1. Go to [Google Account](https://myaccount.google.com/account)
2. Enable 2-Step Verification
3. Wait a few minutes, then continue

If 2FA is enabled:
1. Go to [App passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password

### 2. Update Your Deployment

**For Render.com:**
1. Go to Dashboard → Your Service → Settings → Environment
2. Add these variables:
   ```
   EMAIL_ENABLED=true
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password-16-chars
   EMAIL_RECIPIENT=your-email@gmail.com
   ERROR_EMAIL_THRESHOLD=3
   ```
3. Click "Save & Deploy"

**For Fly.io:**
```bash
fly secrets set EMAIL_ENABLED=true
fly secrets set EMAIL_SERVICE=gmail
fly secrets set EMAIL_USER=your-email@gmail.com
fly secrets set EMAIL_PASSWORD=your-app-password
fly secrets set EMAIL_RECIPIENT=your-email@gmail.com
fly secrets set ERROR_EMAIL_THRESHOLD=3
fly deploy
```

**For Local Testing:**
```powershell
# Windows PowerShell
$env:EMAIL_ENABLED="true"
$env:EMAIL_USER="your-email@gmail.com"
$env:EMAIL_PASSWORD="your-app-password"
$env:EMAIL_RECIPIENT="your-email@gmail.com"
npm start
```

### 3. Test the Setup

Check your deployment logs:
```
[EMAIL] Email notifications enabled
```

The service will send a test email on first ping failure after 3 consecutive errors.

## Using the Encode-Cookies Script with Email

```powershell
# Basic usage (copies to clipboard)
.\encode-cookies.ps1

# With email notification
.\encode-cookies.ps1 -EmailAddress "your@email.com" -SendEmail
```

## Check Cookie Expiry Dates

```bash
node check-cookie-expiry.js
```

This will show:
- 🔴 Expired cookies (need immediate action)
- 🟡 Expiring soon (update within 7 days)
- 🟢 Healthy cookies

## Email Alert Examples

### Service Failure Alert

You'll receive an email when:
- Ping fails 3 times in a row
- Includes error message and timestamp
- Only sends once until service recovers

### Cookie Expiry Alert

Coming soon: Automatic emails when cookies are expiring.

## Troubleshooting

### Not receiving emails?

1. **Check deployment logs** for `[EMAIL] Email notifications enabled`
2. **Verify credentials**:
   - Use 16-char app password (not regular password)
   - No spaces in the password
   - 2FA must be enabled for Gmail
3. **Check spam folder** - emails might be there
4. **Test manually**:
   ```javascript
   // Add this to index.js to test
   sendEmailAlert('Test', '<p>This is a test</p>');
   ```

### Too many emails?

Increase `ERROR_EMAIL_THRESHOLD` from 3 to 5 or higher

### Want to disable emails?

Set `EMAIL_ENABLED=false` and redeploy

## Files Changed

- **index.js**: Added email notification logic
- **encode-cookies.ps1**: Added `-SendEmail` parameter
- **check-cookie-expiry.js**: New utility to check cookie dates
- **package.json**: Added nodemailer dependency
- **EMAIL_SETUP.md**: Detailed configuration guide
- **.env.example**: Updated with email variables

## Next Steps

1. Update your deployment with email credentials
2. Wait for the service to start
3. Check logs for `[EMAIL] Email notifications enabled`
4. Test by running the cookie checker or waiting for an error
5. Adjust `ERROR_EMAIL_THRESHOLD` if needed

## Security Reminder

🔒 Never commit `.env` file or credentials to git!
- Use deployment platform's secret management
- Use app-specific passwords (not your main password)
- Rotate passwords periodically

## Support

See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed troubleshooting and advanced configuration.
