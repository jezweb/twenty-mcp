#!/usr/bin/env node

/**
 * Example OAuth client for Twenty MCP Server
 * Demonstrates the complete OAuth 2.1 flow
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import { createServer } from 'http';
import { parse } from 'url';
import open from 'open';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const CLIENT_PORT = 8080;
const REDIRECT_URI = `http://localhost:${CLIENT_PORT}/callback`;

class OAuthClient {
  constructor() {
    this.accessToken = null;
    this.codeVerifier = null;
    this.state = null;
  }

  // Generate PKCE parameters
  generatePKCE() {
    this.codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(this.codeVerifier)
      .digest('base64url');
    
    return {
      codeVerifier: this.codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  // Generate random state parameter
  generateState() {
    this.state = crypto.randomBytes(16).toString('hex');
    return this.state;
  }

  // Step 1: Discover OAuth endpoints
  async discoverEndpoints() {
    console.log('🔍 Discovering OAuth endpoints...');
    
    const response = await fetch(`${MCP_SERVER_URL}/.well-known/oauth-protected-resource`);
    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.status}`);
    }

    const metadata = await response.json();
    console.log('✅ OAuth endpoints discovered');
    console.log(`   Resource: ${metadata.resource}`);
    console.log(`   Auth Servers: ${metadata.authorization_servers.join(', ')}`);
    
    return metadata;
  }

  // Step 2: Get authorization server metadata
  async getAuthServerMetadata() {
    console.log('📋 Getting authorization server metadata...');
    
    const response = await fetch(`${MCP_SERVER_URL}/.well-known/oauth-authorization-server`);
    if (!response.ok) {
      throw new Error(`Auth server discovery failed: ${response.status}`);
    }

    const metadata = await response.json();
    console.log('✅ Authorization server metadata retrieved');
    console.log(`   Issuer: ${metadata.issuer}`);
    console.log(`   Auth Endpoint: ${metadata.authorization_endpoint}`);
    console.log(`   Token Endpoint: ${metadata.token_endpoint}`);
    
    return metadata;
  }

  // Step 3: Start authorization flow
  async startAuthFlow(authServerMetadata) {
    const { codeChallenge, codeChallengeMethod } = this.generatePKCE();
    const state = this.generateState();
    
    // In a real implementation, you'd need to register your client with Clerk
    // For this example, we'll show the URL that would be used
    const authUrl = new URL(authServerMetadata.authorization_endpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', 'YOUR_CLIENT_ID'); // Would be from Clerk
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'twenty:read twenty:write');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', codeChallengeMethod);
    authUrl.searchParams.set('state', state);

    console.log('🚀 Starting OAuth authorization flow...');
    console.log('   Authorization URL:', authUrl.toString());
    
    // For demo purposes, we'll simulate getting an auth code
    console.log('ℹ️  In a real app, user would be redirected to authorize');
    console.log('ℹ️  For this demo, we\\'ll simulate the callback with a mock token');
    
    return this.simulateCallback();
  }

  // Simulate the OAuth callback (in real app, this would be handled by redirect)
  async simulateCallback() {
    console.log('🔄 Simulating OAuth callback...');
    
    // In a real implementation, this would be a real authorization code
    // For demo purposes, we'll use a mock access token
    this.accessToken = 'mock_access_token_' + crypto.randomBytes(16).toString('hex');
    
    console.log('✅ Authorization completed (simulated)');
    console.log(`   Access Token: ${this.accessToken.substring(0, 20)}...`);
    
    return this.accessToken;
  }

  // Step 4: Store user's Twenty API key
  async storeApiKey(apiKey, baseUrl = 'https://api.twenty.com') {
    console.log('💾 Storing Twenty API key...');
    
    const response = await fetch(`${MCP_SERVER_URL}/api/keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        baseUrl,
      }),
    });

    if (response.status === 401) {
      console.log('❌ Authentication failed (expected with mock token)');
      console.log('ℹ️  In production, use real Clerk tokens');
      return false;
    }

    if (!response.ok) {
      throw new Error(`Failed to store API key: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ API key stored successfully');
    return true;
  }

  // Step 5: Get API key metadata
  async getApiKeyMetadata() {
    console.log('📊 Getting API key metadata...');
    
    const response = await fetch(`${MCP_SERVER_URL}/api/keys`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (response.status === 401) {
      console.log('❌ Authentication failed (expected with mock token)');
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get metadata: ${response.status}`);
    }

    const metadata = await response.json();
    console.log('✅ API key metadata retrieved');
    console.log(`   Has Key: ${metadata.hasKey}`);
    console.log(`   Base URL: ${metadata.baseUrl || 'default'}`);
    console.log(`   Updated: ${metadata.updatedAt || 'never'}`);
    
    return metadata;
  }

  // Step 6: Make authenticated MCP request
  async makeMCPRequest() {
    console.log('🔗 Making authenticated MCP request...');
    
    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {},
        id: 1,
      }),
    });

    if (response.status === 401) {
      console.log('❌ Authentication failed (expected with mock token)');
      console.log('ℹ️  In production, use real Clerk tokens');
      return null;
    }

    if (response.status === 400) {
      const error = await response.json();
      if (error.error === 'No API key configured') {
        console.log('ℹ️  User needs to configure their Twenty API key first');
        return null;
      }
    }

    console.log(`📤 MCP Response Status: ${response.status}`);
    const result = await response.text();
    console.log(`📥 MCP Response: ${result.substring(0, 200)}...`);
    
    return result;
  }

  // Complete OAuth flow demo
  async runCompleteFlow() {
    try {
      console.log('🎯 OAuth 2.1 Flow Demo for Twenty MCP Server');
      console.log('═══════════════════════════════════════════════');
      console.log('');

      // Step 1: Discovery
      const endpoints = await this.discoverEndpoints();
      console.log('');

      // Step 2: Get auth server metadata
      const authMetadata = await this.getAuthServerMetadata();
      console.log('');

      // Step 3: Authorization flow
      await this.startAuthFlow(authMetadata);
      console.log('');

      // Step 4: Store API key
      const testApiKey = 'demo-twenty-api-key-12345';
      await this.storeApiKey(testApiKey);
      console.log('');

      // Step 5: Get metadata
      await this.getApiKeyMetadata();
      console.log('');

      // Step 6: Make MCP request
      await this.makeMCPRequest();
      console.log('');

      console.log('🎉 OAuth flow demo completed!');
      console.log('');
      console.log('📝 Summary:');
      console.log('   ✅ OAuth endpoints discovered');
      console.log('   ✅ Authorization flow initiated');
      console.log('   ✅ API key management tested');
      console.log('   ✅ MCP request attempted');
      console.log('');
      console.log('ℹ️  To test with real tokens:');
      console.log('   1. Set up Clerk application');
      console.log('   2. Configure client credentials');
      console.log('   3. Implement real authorization flow');
      console.log('   4. Use real Bearer tokens');

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      process.exit(1);
    }
  }
}

// Real OAuth callback server (for production use)
class CallbackServer {
  constructor(client) {
    this.client = client;
    this.server = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        const parsedUrl = parse(req.url, true);
        
        if (parsedUrl.pathname === '/callback') {
          const { code, state, error } = parsedUrl.query;
          
          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<h1>Authorization Error</h1><p>${error}</p>`);
            return;
          }

          if (state !== this.client.state) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Invalid State</h1><p>State parameter mismatch</p>');
            return;
          }

          try {
            // Exchange code for token (would implement token exchange here)
            console.log('📨 Received authorization code:', code);
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <h1>Authorization Successful!</h1>
              <p>You can close this window and return to the application.</p>
              <script>window.close();</script>
            `);
            
            resolve(code);
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Error</h1><p>${error.message}</p>`);
            reject(error);
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>Not Found</h1>');
        }
      });

      this.server.listen(CLIENT_PORT, () => {
        console.log(`🌐 Callback server listening on http://localhost:${CLIENT_PORT}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

// Run the demo
async function main() {
  const client = new OAuthClient();
  
  // Check if MCP server is running
  try {
    const healthResponse = await fetch(`${MCP_SERVER_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('Server not responding');
    }
    const health = await healthResponse.json();
    if (!health.authEnabled) {
      console.log('⚠️  Warning: Auth is not enabled on the MCP server');
      console.log('   Run "npm run setup:oauth" to enable authentication');
    }
  } catch (error) {
    console.error('❌ Cannot connect to MCP server at', MCP_SERVER_URL);
    console.error('   Make sure the server is running: npm start');
    process.exit(1);
  }

  await client.runCompleteFlow();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { OAuthClient, CallbackServer };