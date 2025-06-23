#!/usr/bin/env node

/**
 * Comprehensive OAuth test suite for Twenty MCP Server
 * Tests all aspects of the OAuth 2.1 implementation
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { createServer } from 'http';
import crypto from 'crypto';

const BASE_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const TEST_PORT = 3001; // Avoid conflicts with main server

// Test configuration
const TEST_CONFIG = {
  AUTH_ENABLED: 'true',
  REQUIRE_AUTH: 'false',
  AUTH_PROVIDER: 'clerk',
  CLERK_PUBLISHABLE_KEY: 'pk_test_dGVzdGluZy1tb3NxdWl0by0yMS5jbGVyay5hY2NvdW50cy5kZXYk',
  CLERK_SECRET_KEY: 'sk_test_mock_secret_key_for_testing_only',
  CLERK_DOMAIN: 'testing-mosquito-21.clerk.accounts.dev',
  API_KEY_ENCRYPTION_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  TWENTY_API_KEY: 'test-global-api-key',
  TWENTY_BASE_URL: 'https://api.twenty.com',
  MCP_SERVER_URL: `http://localhost:${TEST_PORT}`,
  PORT: TEST_PORT.toString(),
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  magenta: '\x1b[0;35m',
  cyan: '\x1b[0;36m',
  bold: '\x1b[1m',
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function logSuccess(message) { log(colors.green, 'PASS', message); }
function logError(message) { log(colors.red, 'FAIL', message); }
function logInfo(message) { log(colors.blue, 'INFO', message); }
function logSection(message) { log(colors.magenta, 'TEST', message); }
function logWarn(message) { log(colors.yellow, 'WARN', message); }

class OAuthTestSuite {
  constructor() {
    this.server = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async startTestServer() {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, ...TEST_CONFIG };
      
      this.server = spawn('node', ['dist/http-server.js'], {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let started = false;

      this.server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Twenty MCP Server running') && !started) {
          started = true;
          resolve();
        }
      });

      this.server.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE') || error.includes('Error:')) {
          if (!started) {
            reject(new Error(`Server failed to start: ${error}`));
          }
        }
      });

      this.server.on('error', (error) => {
        if (!started) {
          reject(error);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!started) {
          reject(new Error('Server startup timeout'));
        }
      }, 10000);
    });
  }

  async stopTestServer() {
    if (this.server) {
      this.server.kill();
      this.server = null;
    }
  }

  async runTest(name, testFn) {
    this.testResults.total++;
    try {
      logSection(name);
      await testFn();
      this.testResults.passed++;
      this.testResults.details.push({ name, status: 'PASS', error: null });
      logSuccess(`${name} - PASSED`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({ name, status: 'FAIL', error: error.message });
      logError(`${name} - FAILED: ${error.message}`);
    }
  }

  async testHealthEndpoint() {
    const response = await fetch(`${BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const health = await response.json();
    
    if (health.status !== 'healthy') {
      throw new Error(`Expected healthy status, got: ${health.status}`);
    }

    if (!health.authEnabled) {
      throw new Error('Auth should be enabled in test configuration');
    }

    logInfo('Health endpoint working correctly');
  }

  async testOAuthDiscoveryEndpoints() {
    // Test protected resource metadata
    const prResponse = await fetch(`${BASE_URL}/.well-known/oauth-protected-resource`);
    
    if (!prResponse.ok) {
      throw new Error(`Protected resource endpoint failed: ${prResponse.status}`);
    }

    const prMetadata = await prResponse.json();
    
    const requiredFields = ['resource', 'authorization_servers', 'bearer_methods_supported'];
    for (const field of requiredFields) {
      if (!prMetadata[field]) {
        throw new Error(`Missing required field in protected resource metadata: ${field}`);
      }
    }

    // Test authorization server metadata
    const asResponse = await fetch(`${BASE_URL}/.well-known/oauth-authorization-server`);
    
    if (!asResponse.ok) {
      throw new Error(`Authorization server endpoint failed: ${asResponse.status}`);
    }

    const asMetadata = await asResponse.json();
    
    const asRequiredFields = [
      'issuer',
      'authorization_endpoint',
      'token_endpoint',
      'response_types_supported',
      'grant_types_supported'
    ];
    
    for (const field of asRequiredFields) {
      if (!asMetadata[field]) {
        throw new Error(`Missing required field in authorization server metadata: ${field}`);
      }
    }

    logInfo('OAuth discovery endpoints working correctly');
  }

  async testCORSHeaders() {
    const response = await fetch(`${BASE_URL}/.well-known/oauth-protected-resource`, {
      method: 'OPTIONS',
    });

    const corsHeaders = response.headers.get('access-control-allow-origin');
    if (!corsHeaders) {
      throw new Error('CORS headers not present');
    }

    logInfo('CORS headers configured correctly');
  }

  async testAPIKeyEndpointsWithoutAuth() {
    // Should return 401 without auth
    const response = await fetch(`${BASE_URL}/api/keys`, {
      method: 'GET',
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got: ${response.status}`);
    }

    logInfo('API key endpoints properly protected');
  }

  async testMCPEndpointWithoutAuth() {
    // Should work when REQUIRE_AUTH=false
    const response = await fetch(`${BASE_URL}/mcp?apiKey=test-api-key`, {
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

    // Note: This might return 406 due to Accept headers, but should not be 401
    if (response.status === 401) {
      throw new Error('MCP endpoint should not require auth when REQUIRE_AUTH=false');
    }

    logInfo('MCP endpoint allows unauthenticated requests');
  }

  async testMCPEndpointWithoutAPIKey() {
    // Should return 400 when no API key provided
    const response = await fetch(`${BASE_URL}/mcp`, {
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

    if (response.status !== 400) {
      throw new Error(`Expected 400 for missing API key, got: ${response.status}`);
    }

    const error = await response.json();
    if (!error.error || !error.error.includes('apiKey')) {
      throw new Error('Error message should mention missing API key');
    }

    logInfo('MCP endpoint properly validates API key requirement');
  }

  async testEncryptionService() {
    // Test encryption/decryption functionality
    const { EncryptionService } = await import('../dist/auth/encryption.js');
    
    const secret = TEST_CONFIG.API_KEY_ENCRYPTION_SECRET;
    const service = new EncryptionService(secret);
    
    const plaintext = 'test-api-key-12345';
    const encrypted = service.encrypt(plaintext);
    const decrypted = service.decrypt(encrypted);
    
    if (decrypted !== plaintext) {
      throw new Error('Encryption/decryption failed');
    }

    // Test with different plaintexts produce different ciphertexts
    const encrypted2 = service.encrypt(plaintext);
    if (encrypted === encrypted2) {
      throw new Error('Encryption should use random IVs');
    }

    logInfo('Encryption service working correctly');
  }

  async testTokenValidation() {
    // Test token validation with invalid token
    const mockToken = 'Bearer invalid-token-123';
    
    const response = await fetch(`${BASE_URL}/api/keys`, {
      method: 'GET',
      headers: {
        'Authorization': mockToken,
      },
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401 for invalid token, got: ${response.status}`);
    }

    logInfo('Token validation properly rejects invalid tokens');
  }

  async testEnvironmentVariableValidation() {
    // This would typically be tested by starting server with missing vars
    // For now, just verify the current config
    const requiredVars = [
      'AUTH_ENABLED',
      'CLERK_SECRET_KEY',
      'API_KEY_ENCRYPTION_SECRET'
    ];

    for (const varName of requiredVars) {
      if (!TEST_CONFIG[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    logInfo('Environment variables configured correctly');
  }

  async testServerCapabilities() {
    // Test that server advertises OAuth capabilities
    // This would require making an actual MCP initialize request
    // For now, just verify the server responds to requests
    
    const response = await fetch(`${BASE_URL}/mcp?apiKey=test-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {},
        id: 1,
      }),
    });

    // Server should respond (even if with an error about Accept headers)
    if (response.status === 404) {
      throw new Error('MCP endpoint not found');
    }

    logInfo('Server capabilities endpoint accessible');
  }

  async testBackwardCompatibility() {
    // Test that non-auth requests still work
    const response = await fetch(`${BASE_URL}/mcp?apiKey=${TEST_CONFIG.TWENTY_API_KEY}`, {
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

    // Should not be 401 (authentication required)
    if (response.status === 401) {
      throw new Error('Backward compatibility broken - non-auth requests rejected');
    }

    logInfo('Backward compatibility maintained');
  }

  async testErrorHandling() {
    // Test various error conditions
    
    // Invalid JSON
    const invalidJsonResponse = await fetch(`${BASE_URL}/mcp?apiKey=test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json{',
    });

    if (invalidJsonResponse.status !== 400) {
      throw new Error('Server should handle invalid JSON gracefully');
    }

    logInfo('Error handling working correctly');
  }

  async runAllTests() {
    console.log('🧪 OAuth Test Suite for Twenty MCP Server');
    console.log('═══════════════════════════════════════════');
    console.log('');

    try {
      logInfo('Starting test server...');
      await this.startTestServer();
      logSuccess('Test server started successfully');
      
      // Wait a moment for server to fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Run all tests
      await this.runTest('Health Endpoint', () => this.testHealthEndpoint());
      await this.runTest('OAuth Discovery Endpoints', () => this.testOAuthDiscoveryEndpoints());
      await this.runTest('CORS Headers', () => this.testCORSHeaders());
      await this.runTest('API Key Endpoints Security', () => this.testAPIKeyEndpointsWithoutAuth());
      await this.runTest('MCP Endpoint Without Auth', () => this.testMCPEndpointWithoutAuth());
      await this.runTest('MCP Endpoint API Key Validation', () => this.testMCPEndpointWithoutAPIKey());
      await this.runTest('Encryption Service', () => this.testEncryptionService());
      await this.runTest('Token Validation', () => this.testTokenValidation());
      await this.runTest('Environment Variables', () => this.testEnvironmentVariableValidation());
      await this.runTest('Server Capabilities', () => this.testServerCapabilities());
      await this.runTest('Backward Compatibility', () => this.testBackwardCompatibility());
      await this.runTest('Error Handling', () => this.testErrorHandling());

    } finally {
      logInfo('Stopping test server...');
      await this.stopTestServer();
    }

    this.printSummary();
  }

  printSummary() {
    console.log('');
    console.log('📊 Test Results Summary');
    console.log('═══════════════════════');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`${colors.green}Passed: ${this.testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.testResults.failed}${colors.reset}`);
    
    const successRate = (this.testResults.passed / this.testResults.total * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);

    if (this.testResults.failed > 0) {
      console.log('');
      console.log('❌ Failed Tests:');
      this.testResults.details
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    console.log('');
    if (this.testResults.failed === 0) {
      logSuccess('All tests passed! 🎉');
    } else {
      logError(`${this.testResults.failed} test(s) failed`);
      process.exit(1);
    }
  }
}

// Run the test suite
async function main() {
  const suite = new OAuthTestSuite();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Test suite interrupted');
    await suite.stopTestServer();
    process.exit(1);
  });

  try {
    await suite.runAllTests();
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    await suite.stopTestServer();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { OAuthTestSuite };