import http from 'http';
import { URL } from 'url';
import open from 'open';
import { saveGlobalApiKey } from './global-config.js';

export async function startOAuthFlow() {
  const baseUrl = process.env.MANAGEMENT_API_URL || 'https://api.endgame.dev';
  
  const { server, port, tokenPromise } = await startCallbackServer();
  
  try {
    const authUrlResponse = await fetch(`${baseUrl}/auth/google/auth-url`, {
      headers: { 
        'Origin': `http://localhost:${port}`,
        'Host': `localhost:${port}`
      }
    });
    
    if (!authUrlResponse.ok) {
      throw new Error(`Failed to generate OAuth URL: ${authUrlResponse.statusText}`);
    }
    
    const { authUrl } = await authUrlResponse.json();
    
    const modifiedAuthUrl = authUrl.replace(
      /redirect_uri=[^&]+/,
      `redirect_uri=${encodeURIComponent(`http://localhost:${port}/auth/google/callback`)}`
    );
    
    console.log(`Opening browser for Google authentication...`);
    await open(modifiedAuthUrl);
    
    const apiKey = await Promise.race([
      tokenPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OAuth timeout after 5 minutes')), 300000)
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
      
      if (url.pathname === '/auth/google/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Failed</h1><p>You can close this window.</p>');
          tokenReject(new Error(`OAuth error: ${error}`));
          return;
        }
        
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Failed</h1><p>No authorization code received.</p>');
          tokenReject(new Error('No authorization code received'));
          return;
        }
        
        try {
          const apiKey = await exchangeCodeForApiKey(code, server.address().port);
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Successful!</h1><p>You can close this window and return to your IDE.</p>');
          
          tokenResolve(apiKey);
        } catch (exchangeError) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Failed</h1><p>Failed to retrieve API key.</p>');
          tokenReject(exchangeError);
        }
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
            reject(new Error('No available ports for OAuth callback'));
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

async function exchangeCodeForApiKey(code, port) {
  const baseUrl = process.env.MANAGEMENT_API_URL || 'https://api.endgame.dev';
  
  const response = await fetch(`${baseUrl}/auth/google/callback?code=${code}`, {
    headers: {
      'Host': `localhost:${port}`,
      'Origin': `http://localhost:${port}`
    },
    redirect: 'manual'
  });
  
  const location = response.headers.get('location');
  if (!location) {
    throw new Error('No redirect location in OAuth response');
  }
  
  const redirectUrl = new URL(location);
  const token = redirectUrl.searchParams.get('token');
  
  if (!token) {
    const error = redirectUrl.searchParams.get('error');
    throw new Error(`OAuth failed: ${error || 'No token received'}`);
  }
  
  const apiKeyResponse = await fetch(`${baseUrl}/account/api-key`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!apiKeyResponse.ok) {
    throw new Error('Failed to retrieve API key from management API');
  }
  
  const { apiKey } = await apiKeyResponse.json();
  
  if (!apiKey) {
    const createResponse = await fetch(`${baseUrl}/account/api-key`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!createResponse.ok) {
      throw new Error('Failed to create API key');
    }
    
    const { apiKey: newApiKey } = await createResponse.json();
    return newApiKey;
  }
  
  return apiKey;
}
