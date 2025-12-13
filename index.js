const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  IDX_WORKSPACE_URL: process.env.IDX_WORKSPACE_URL || 'https://your-workspace.idx.google.com',
  PING_INTERVAL_MS: parseInt(process.env.PING_INTERVAL_MS) || 5 * 60 * 1000, // 5 minutes default
  SESSION_COOKIE: process.env.IDX_SESSION_COOKIE || '', // Optional: Add session cookie if needed
  HEALTH_CHECK_PORT: parseInt(process.env.PORT) || 8080,
};

let pingCount = 0;
let lastPingStatus = 'never pinged';
let lastPingTime = null;

// Ping function
function pingIDXWorkspace() {
  const url = new URL(CONFIG.IDX_WORKSPACE_URL);
  const protocol = url.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'User-Agent': 'IDX-KeepAlive/1.0',
      'Accept': '*/*',
    },
    timeout: 30000, // 30 second timeout
  };

  // Add session cookie if provided
  if (CONFIG.SESSION_COOKIE) {
    options.headers['Cookie'] = CONFIG.SESSION_COOKIE;
  }

  const req = protocol.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      pingCount++;
      lastPingTime = new Date().toISOString();
      lastPingStatus = `HTTP ${res.statusCode}`;
      
      console.log(`[${lastPingTime}] Ping #${pingCount}: ${lastPingStatus} - ${CONFIG.IDX_WORKSPACE_URL}`);
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log(`✓ Workspace is alive`);
      } else {
        console.warn(`⚠ Unexpected status code: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    pingCount++;
    lastPingTime = new Date().toISOString();
    lastPingStatus = `ERROR: ${error.message}`;
    console.error(`[${lastPingTime}] Ping #${pingCount} failed:`, error.message);
  });

  req.on('timeout', () => {
    req.destroy();
    console.error(`[${new Date().toISOString()}] Ping timeout after 30s`);
  });

  req.end();
}

// Health check server for container orchestrators
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      pingCount,
      lastPingStatus,
      lastPingTime,
      config: {
        workspace: CONFIG.IDX_WORKSPACE_URL,
        intervalMinutes: CONFIG.PING_INTERVAL_MS / 60000,
      },
      uptime: process.uptime(),
    }, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start server
server.listen(CONFIG.HEALTH_CHECK_PORT, () => {
  console.log(`=== IDX Keep-Alive Pinger Started ===`);
  console.log(`Workspace: ${CONFIG.IDX_WORKSPACE_URL}`);
  console.log(`Ping interval: ${CONFIG.PING_INTERVAL_MS / 1000}s (${CONFIG.PING_INTERVAL_MS / 60000} minutes)`);
  console.log(`Health check: http://localhost:${CONFIG.HEALTH_CHECK_PORT}/health`);
  console.log(`Using session cookie: ${CONFIG.SESSION_COOKIE ? 'Yes' : 'No'}`);
  console.log(`=====================================\n`);

  // Initial ping
  pingIDXWorkspace();
  
  // Schedule periodic pings
  setInterval(pingIDXWorkspace, CONFIG.PING_INTERVAL_MS);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
