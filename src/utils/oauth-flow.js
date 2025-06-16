import http from 'http';
import { URL } from 'url';
import open from 'open';
import { saveGlobalApiKey } from './global-config.js';

export async function startDashboardAuthFlow() {
  const isDev = process.env.NODE_ENV === 'development' || process.env.MANAGEMENT_API_URL?.includes('endgame-dev.dev');
  const dashboardUrl = isDev ? 'https://dashboard.endgame-dev.dev' : 'https://endgame.dev';
  
  const { server, port, tokenPromise } = await startCallbackServer();
  
  try {
    const authUrl = `${dashboardUrl}/login?mcp_auth=true&callback_port=${port}`;
    
    console.log(`Opening dashboard for authentication: ${authUrl}`);
    await open(authUrl);
    
    const apiKey = await Promise.race([
      tokenPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout after 5 minutes')), 300000)
      )
    ]);
    
    saveGlobalApiKey(apiKey);
    return apiKey;
  } finally {
    server.close();
  }
}

async function startCallbackServer() {
  return new Promise((resolve, reject) => {
    let tokenResolve, tokenReject;
    const tokenPromise = new Promise((res, rej) => {
      tokenResolve = res;
      tokenReject = rej;
    });
    
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost`);
      
      if (url.pathname === '/mcp/auth/callback') {
        const apiKey = url.searchParams.get('api_key');
        const error = url.searchParams.get('error');
        
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Failed</h1><p>You can close this window.</p>');
          tokenReject(new Error(`Authentication error: ${error}`));
          return;
        }
        
        if (!apiKey) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Failed</h1><p>No API key received.</p>');
          tokenReject(new Error('No API key received'));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authentication Successful!</h1><p>You can close this window and return to your IDE.</p>');
        
        tokenResolve(apiKey);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    let port = 8000;
    const tryPort = () => {
      server.listen(port, 'localhost', () => {
        resolve({ server, port, tokenPromise });
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          port++;
          if (port > 8010) {
            reject(new Error('No available ports for authentication callback'));
            return;
          }
          server.close();
          tryPort();
        } else {
          reject(err);
        }
      });
    };
    
    tryPort();
  });
}
