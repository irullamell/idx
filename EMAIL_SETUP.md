# Email Notifications Setup Guide

This guide explains how to configure email alerts for cookie expiry warnings and service failures.

## Overview

The IDX Keep-Alive service can send email notifications in two ways:

1. **Service Failures**: Automatic alerts when the ping service encounters errors
2. **Cookie Encoding**: Manual email when encoding cookies for deployment

## Node.js Service Configuration

### Prerequisites

- Node.js service running (index.js)
- SMTP email credentials (Gmail recommended)

### Environment Variables

Add these environment variables to your deployment platform:

```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_RECIPIENT=your-email@gmail.com
ERROR_EMAIL_THRESHOLD=3
COOKIE_EXPIRY_WARNING_DAYS=7
```

### Setting Up Gmail

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Select "App passwords" (only appears with 2FA enabled)
   - Choose "Mail" and "Windows Computer" (or your device)
   - Copy the generated 16-character password
3. **Use the App Password** as `EMAIL_PASSWORD` in your environment variables

### Setting Up Other Email Services

For Outlook/Microsoft:
```
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

For other SMTP services, you can specify custom SMTP settings by modifying index.js.

## PowerShell Cookie Encoder Email

### Local SMTP Option

Use the encode-cookies.ps1 script with email:

```powershell
.\encode-cookies.ps1 -EmailAddress "your@email.com" -SendEmail
```

This requires a local SMTP server configured on your machine.

### Recommended: Use Node.js Service Email

The Node.js service provides more reliable email delivery. Simply configure the environment variables as shown above.

## Alert Types

### Service Failure Alerts

Triggered when:
- Consecutive ping errors exceed the threshold (default: 3)
- Connection errors to the IDX workspace
- Timeout errors

**Email includes:**
- Error message
- Number of consecutive errors
- Workspace URL
- Timestamp

### Cookie Expiry Alerts (Future)

Can be added to check cookie expiration dates and send proactive warnings.

## Render.com Deployment

### Step-by-Step

1. Go to your Render.com dashboard
2. Select your service
3. Go to **Settings** → **Environment**
4. Add these environment variables:

```
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-app-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_RECIPIENT=your-notification-email@gmail.com
ERROR_EMAIL_THRESHOLD=3
```

5. Save and trigger a manual deploy

## Fly.io Deployment

```bash
fly secrets set EMAIL_ENABLED=true
fly secrets set EMAIL_SERVICE=gmail
fly secrets set EMAIL_USER=your-app-email@gmail.com
fly secrets set EMAIL_PASSWORD=your-16-char-app-password
fly secrets set EMAIL_RECIPIENT=your-notification-email@gmail.com
fly secrets set ERROR_EMAIL_THRESHOLD=3
```

Then deploy:
```bash
fly deploy
```

## Testing Email Configuration

### From Node.js Service

The service will automatically test email connectivity on startup. Check logs for:
- `[EMAIL] Email notifications enabled`
- Or `[EMAIL] Email enabled but credentials missing`

### Manual Test

Create a test script:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_RECIPIENT,
  subject: 'Test Email',
  text: 'This is a test email from IDX Keep-Alive',
}, (err, info) => {
  if (err) console.error(err);
  else console.log('Email sent:', info.response);
});
```

## Troubleshooting

### Email Not Sending

1. **Check Gmail App Password**
   - Ensure 2FA is enabled
   - Use 16-character app password (spaces removed)
   - Not your regular Gmail password

2. **Check Email Service Status**
   - Verify SMTP credentials are correct
   - Test with a simple email script
   - Check if your email provider blocks "less secure apps"

3. **Check Render/Fly.io Logs**
   - Look for error messages in deployment logs
   - Verify environment variables are set correctly

### Email Arrives But Content is Wrong

- Update index.js to customize the HTML email template
- Modify the `sendEmailAlert()` function as needed

### Too Many Emails

- Increase `ERROR_EMAIL_THRESHOLD` to reduce email frequency
- The service only sends one email per error event to prevent spam

## Security Notes

⚠️ **Never commit credentials to git!**

- Use environment variables for all sensitive data
- Gmail app passwords are safer than your actual password
- Rotate passwords periodically
- Never share email configuration

## Future Enhancements

Planned features:
- Cookie expiry date parsing and proactive warnings
- Configurable email templates
- Email digest summaries
- Multiple recipient support
- Webhook integration

## Support

For issues:
1. Check the logs in your deployment platform
2. Verify environment variables are set
3. Test email credentials manually
4. Review this guide for your specific platform
