const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  IDX_WORKSPACE_URL: process.env.IDX_WORKSPACE_URL || 'https://your-workspace.idx.google.com',
  PING_INTERVAL_MS: parseInt(process.env.PING_INTERVAL_MS) || 2 * 60 * 1000, // 2 minutes
  HEALTH_CHECK_PORT: parseInt(process.env.PORT) || 8080,
  COOKIES_FILE: process.env.COOKIES_FILE || '/data/cookies.json',
  HEADLESS: process.env.HEADLESS !== 'false',
};

let pingCount = 0;
let lastPingStatus = 'never pinged';
let lastPingTime = null;
let browser = null;

// Load cookies from environment variable or file
async function loadCookies() {
  // First, try loading from base64-encoded environment variable (for Render.com)
  if (process.env.GOOGLE_COOKIES_BASE64) {
    try {
      console.log('Loading cookies from GOOGLE_COOKIES_BASE64 environment variable...');
      const json = Buffer.from(process.env.GOOGLE_COOKIES_BASE64, 'base64').toString('utf-8');
      const cookies = JSON.parse(json);
      console.log(`✓ Loaded ${cookies.length} cookies from environment variable`);
      return cookies;
    } catch (err) {
      console.error('Failed to parse GOOGLE_COOKIES_BASE64:', err.message);
      // Fall through to file-based loading
    }
  }
  
  // Fallback to file-based loading (for Fly.io or local)
  try {
    const cookiesData = await fs.readFile(CONFIG.COOKIES_FILE, 'utf8');
    return JSON.parse(cookiesData);
  } catch (err) {
    console.log('No saved cookies found, will need fresh login');
    return null;
  }
}

// Check if cookies are expired or about to expire
function areCookiesExpiring(cookies, bufferMinutes = 10) {
  if (!cookies || cookies.length === 0) return true;
  
  const now = Date.now() / 1000; // Convert to seconds
  const bufferSeconds = bufferMinutes * 60;
  
  // Check critical Google auth cookies
  const criticalCookies = cookies.filter(c => 
    c.name.includes('SIDTS') || 
    c.name.includes('SIDCC') ||
    c.name === '__Secure-1PSID' ||
    c.name === '__Secure-3PSID'
  );
  
  if (criticalCookies.length === 0) {
    console.log('⚠️  No critical auth cookies found');
    return true;
  }
  
  for (const cookie of criticalCookies) {
    if (cookie.expirationDate) {
      const timeUntilExpiry = cookie.expirationDate - now;
      if (timeUntilExpiry < bufferSeconds) {
        const minutesLeft = Math.floor(timeUntilExpiry / 60);
        console.log(`⏰ Cookie ${cookie.name} expires in ${minutesLeft} minutes`);
        return true;
      }
    }
  }
  
  return false;
}

// Save cookies to file
async function saveCookies(cookies) {
  try {
    const dir = path.dirname(CONFIG.COOKIES_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CONFIG.COOKIES_FILE, JSON.stringify(cookies, null, 2));
    console.log('✓ Cookies saved');
  } catch (err) {
    console.error('Failed to save cookies:', err.message);
  }
}

// Initialize browser
async function initBrowser() {
  if (browser) return browser;
  
  console.log('Launching browser...');
  
  const launchOptions = {
    headless: CONFIG.HEADLESS,
    protocolTimeout: 180000, // 3 minutes timeout
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  };
  
  // Only use single-process and custom executable in production (Linux)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    launchOptions.args.push(
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    );
  }
  
  browser = await puppeteer.launch(launchOptions);
  
  return browser;
}

// Ping IDX workspace with authenticated browser
async function pingIDXWorkspace() {
  let page = null;
  
  try {
    const browser = await initBrowser();
    page = await browser.newPage();
    
    // Increase default timeout for all operations
    page.setDefaultTimeout(120000); // 2 minutes
    page.setDefaultNavigationTimeout(120000);
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Load saved cookies if available
    const cookies = await loadCookies();
    
    if (cookies) {
      await page.setCookie(...cookies);
      console.log(`✓ Loaded saved cookies (${cookies.length} cookies)`);
      
      // Check if cookies are expiring soon (for logging purposes)
      if (areCookiesExpiring(cookies)) {
        console.log('⚠️  Cookies are expiring soon, will refresh from Google');
      }
    } else {
      console.log('No saved cookies found, authentication required');
    }
    
    // Always refresh cookies on every ping for maximum reliability
    // Google's session tokens expire server-side regardless of cookie dates
    const needsRefresh = true;
    
    console.log(`Navigating to ${CONFIG.IDX_WORKSPACE_URL}...`);
    
    // Navigate to workspace with more lenient waiting
    const response = await page.goto(CONFIG.IDX_WORKSPACE_URL, {
      waitUntil: 'domcontentloaded', // Less strict than networkidle2
      timeout: 120000, // 2 minutes
    });
    
    // Wait a bit for any redirects
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const url = page.url();
    const status = response.status();
    
    pingCount++;
    lastPingTime = new Date().toISOString();
    
    // Check if we're logged in or need authentication
    if (url.includes('accounts.google.com') || url.includes('login')) {
      lastPingStatus = 'AUTH_REQUIRED';
      console.error('⚠️  Authentication required! Please login manually.');
      console.error('   Set HEADLESS=false and run locally to login, then cookies will be saved.');
      console.error(`   Current URL: ${url}`);
      
      // Alert for authentication failure
      if (lastPingStatus === 'AUTH_REQUIRED') {
        // Send alert via webhook, email, etc.
        // For now, just log prominently
        console.error('🚨 RE-AUTHENTICATION NEEDED! Cookies expired.');
      }
      
      // If not headless, wait for manual login
      if (!CONFIG.HEADLESS) {
        console.log('\n=== MANUAL LOGIN REQUIRED ===');
        console.log('Please login in the browser window that opened.');
        console.log('Waiting for navigation to IDX workspace...\n');
        
        await page.waitForNavigation({ 
          waitUntil: 'domcontentloaded',
          timeout: 300000, // 5 minutes for user to login
        });
        
        // Wait for workspace to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Save cookies after successful login
        const newCookies = await page.cookies();
        await saveCookies(newCookies);
        
        lastPingStatus = 'LOGIN_SUCCESS';
        console.log(`✓ Login successful! Saved ${newCookies.length} cookies for future use.`);
      }
    } else {
      lastPingStatus = `HTTP ${status}`;
      console.log(`[${lastPingTime}] Ping #${pingCount}: ${lastPingStatus}`);
      console.log(`✓ Current URL: ${url}`);
      
      // Check if we're actually in the IDX workspace
      const title = await page.title();
      console.log(`✓ Page title: ${title}`);
      
      if (url.includes('idx.google.com') && !url.includes('login')) {
        console.log('✓ Workspace is alive and authenticated!');
        
        // Always get fresh cookies from Google to maintain active session
        const currentCookies = await page.cookies();
        
        // Verify we got fresh session tokens
        if (areCookiesExpiring(currentCookies, 0)) {
          console.warn('⚠️  Warning: Fresh cookies still appear to be expiring soon');
        } else {
          console.log('✓ Refreshed session tokens from Google');
        }
        
        await saveCookies(currentCookies);
        console.log(`✓ Saved ${currentCookies.length} cookies`);
        
        // Optional: Interact with the page to simulate activity
        try {
          await page.evaluate(() => {
            // Simulate some activity
            if (window.localStorage) {
              window.localStorage.setItem('keepalive_ping', Date.now());
            }
          });
        } catch (e) {
          // Ignore errors in page interaction
        }
      } else {
        console.warn('⚠️  Unexpected page, may not be in workspace');
      }
    }
    
  } catch (error) {
    pingCount++;
    lastPingTime = new Date().toISOString();
    lastPingStatus = `ERROR: ${error.message}`;
    console.error(`[${lastPingTime}] Ping #${pingCount} failed:`, error.message);
    
    // If browser crashed, reset it
    if (error.message.includes('closed') || error.message.includes('detached')) {
      console.log('Browser may have crashed, will restart on next ping...');
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore
        }
        browser = null;
      }
    }
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore errors closing page
      }
    }
  }
}

// Health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: lastPingStatus === 'AUTH_REQUIRED' ? 'auth_required' : 'running',
      pingCount,
      lastPingStatus,
      lastPingTime,
      config: {
        workspace: CONFIG.IDX_WORKSPACE_URL,
        intervalMinutes: CONFIG.PING_INTERVAL_MS / 60000,
        headless: CONFIG.HEADLESS,
      },
      uptime: process.uptime(),
    }, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start server
server.listen(CONFIG.HEALTH_CHECK_PORT, async () => {
  console.log(`=== IDX Keep-Alive Pinger (Authenticated) ===`);
  console.log(`Workspace: ${CONFIG.IDX_WORKSPACE_URL}`);
  console.log(`Ping interval: ${CONFIG.PING_INTERVAL_MS / 60000} minutes`);
  console.log(`Health check: http://localhost:${CONFIG.HEALTH_CHECK_PORT}/health`);
  console.log(`Headless mode: ${CONFIG.HEADLESS}`);
  console.log(`Cookies file: ${CONFIG.COOKIES_FILE}`);
  console.log(`=============================================\n`);

  // Initial ping
  await pingIDXWorkspace();
  
  // Schedule periodic pings
  setInterval(pingIDXWorkspace, CONFIG.PING_INTERVAL_MS);
});

// Graceful shutdown
async function shutdown() {
  console.log('\nShutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
