#!/usr/bin/env node

/**
 * Test script for OAuth authentication flow
 * This tests the discovery endpoints and basic auth setup
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function logSuccess(message) { log(colors.green, 'SUCCESS', message); }
function logError(message) { log(colors.red, 'ERROR', message); }
function logInfo(message) { log(colors.blue, 'INFO', message); }

async function testAuthFlow() {
  console.log('='.repeat(50));
  console.log('  OAuth Authentication Flow Test');
  console.log('='.repeat(50));
  console.log('');
  
  const authEnabled = process.env.AUTH_ENABLED === 'true';
  
  // Test 1: Health check
  logInfo('Testing health endpoint...');
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    
    logSuccess(`Server is ${health.status}`);
    logInfo(`Auth enabled: ${health.authEnabled}`);
    
    if (!health.authEnabled && authEnabled) {
      logError('Server reports auth disabled but AUTH_ENABLED=true');
      return;
    }
  } catch (error) {
    logError(`Failed to connect to server: ${error.message}`);
    logInfo('Make sure the server is running: npm start');
    return;
  }
  
  if (!authEnabled) {
    logInfo('AUTH_ENABLED=false, skipping OAuth tests');
    logInfo('Set AUTH_ENABLED=true to test OAuth flow');
    return;
  }
  
  // Test 2: Protected Resource Metadata
  logInfo('Testing OAuth protected resource metadata...');
  try {
    const prRes = await fetch(`${BASE_URL}/.well-known/oauth-protected-resource`);
    
    if (prRes.status === 404) {
      logError('Protected resource endpoint returned 404');
      logInfo('Make sure AUTH_ENABLED=true');
      return;
    }
    
    const prMetadata = await prRes.json();
    logSuccess('Protected resource metadata retrieved');
    logInfo(`Resource: ${prMetadata.resource}`);
    logInfo(`Auth servers: ${prMetadata.authorization_servers.join(', ')}`);
    
    // Validate required fields
    const requiredFields = ['resource', 'authorization_servers', 'bearer_methods_supported'];
    for (const field of requiredFields) {
      if (!prMetadata[field]) {
        logError(`Missing required field: ${field}`);
      }
    }
  } catch (error) {
    logError(`Failed to get protected resource metadata: ${error.message}`);
  }
  
  // Test 3: Authorization Server Metadata
  logInfo('Testing OAuth authorization server metadata...');
  try {
    const asRes = await fetch(`${BASE_URL}/.well-known/oauth-authorization-server`);
    
    if (asRes.status === 404) {
      logError('Authorization server endpoint returned 404');
      return;
    }
    
    const asMetadata = await asRes.json();
    logSuccess('Authorization server metadata retrieved');
    logInfo(`Issuer: ${asMetadata.issuer}`);
    logInfo(`Auth endpoint: ${asMetadata.authorization_endpoint}`);
    logInfo(`Token endpoint: ${asMetadata.token_endpoint}`);
    
    // Validate required fields
    const requiredFields = [
      'issuer',
      'authorization_endpoint',
      'token_endpoint',
      'response_types_supported',
      'grant_types_supported'
    ];
    
    for (const field of requiredFields) {
      if (!asMetadata[field]) {
        logError(`Missing required field: ${field}`);
      }
    }
  } catch (error) {
    logError(`Failed to get authorization server metadata: ${error.message}`);
  }
  
  // Test 4: MCP endpoint without auth
  logInfo('Testing MCP endpoint without authentication...');
  try {
    const mcpRes = await fetch(`${BASE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {},
        id: 1,
      }),
    });
    
    if (process.env.REQUIRE_AUTH === 'true' && mcpRes.status !== 401) {
      logError('Expected 401 when REQUIRE_AUTH=true but got ' + mcpRes.status);
    } else if (mcpRes.status === 401) {
      logSuccess('Server correctly requires authentication');
      const error = await mcpRes.json();
      logInfo(`Error: ${error.error_description}`);
    } else {
      logSuccess('Anonymous access allowed (REQUIRE_AUTH=false)');
    }
  } catch (error) {
    logError(`Failed to test MCP endpoint: ${error.message}`);
  }
  
  // Test 5: CORS headers
  logInfo('Testing CORS support...');
  try {
    const corsRes = await fetch(`${BASE_URL}/.well-known/oauth-protected-resource`, {
      method: 'OPTIONS',
    });
    
    const corsHeaders = corsRes.headers.get('access-control-allow-origin');
    if (corsHeaders) {
      logSuccess('CORS headers present: ' + corsHeaders);
    } else {
      logError('No CORS headers found');
    }
  } catch (error) {
    logError(`CORS test failed: ${error.message}`);
  }
  
  console.log('');
  console.log('='.repeat(50));
  logSuccess('OAuth discovery endpoints are working!');
  console.log('');
  logInfo('Next steps:');
  console.log('1. Configure Clerk credentials in .env');
  console.log('2. Test with a real Clerk token');
  console.log('3. Implement user API key mapping');
  console.log('');
}

// Handle missing fetch in older Node versions
if (typeof fetch === 'undefined') {
  console.error('This test requires Node.js 18+ or node-fetch package');
  process.exit(1);
}

testAuthFlow().catch(console.error);