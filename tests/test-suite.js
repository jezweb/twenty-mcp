#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds per test
const RESULTS_DIR = join(process.cwd(), 'test-results');

// Ensure results directory exists
mkdirSync(RESULTS_DIR, { recursive: true });

// Test results collector
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd()
  },
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Logger that writes to both console and file
class TestLogger {
  constructor(filename) {
    this.filename = join(RESULTS_DIR, filename);
    this.content = '';
  }

  log(message) {
    console.log(message);
    this.content += message + '\n';
  }

  save() {
    writeFileSync(this.filename, this.content);
  }
}

const logger = new TestLogger(`test-run-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Test runner
class MCPTestRunner {
  constructor() {
    this.server = null;
    this.testCount = 0;
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      logger.log('Starting MCP server...');
      
      this.server = spawn('npm', ['run', 'dev'], {
        env: {
          ...process.env,
          TWENTY_API_KEY: process.env.TWENTY_API_KEY,
          TWENTY_BASE_URL: process.env.TWENTY_BASE_URL || 'https://twenty.app.jezweb.com'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.server.stderr.once('data', (data) => {
        const output = data.toString();
        if (output.includes('Twenty MCP Server running')) {
          logger.log('✓ Server started successfully');
          resolve();
        }
      });

      this.server.on('error', reject);
      
      setTimeout(() => reject(new Error('Server startup timeout')), 10000);
    });
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Response timeout'));
      }, 5000);

      const responseHandler = (data) => {
        clearTimeout(timeout);
        this.server.stdout.removeListener('data', responseHandler);
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      };

      this.server.stdout.on('data', responseHandler);
      this.server.stdin.write(JSON.stringify(message) + '\n');
    });
  }

  async runTest(name, testFn) {
    this.testCount++;
    const testNumber = this.testCount;
    const startTime = Date.now();
    
    try {
      logger.log(`\n# Test ${testNumber}: ${name}`);
      await testFn();
      const duration = Date.now() - startTime;
      logger.log(`ok ${testNumber} - ${name} (${duration}ms)`);
      
      testResults.tests.push({
        id: testNumber,
        name,
        status: 'passed',
        duration
      });
      testResults.summary.passed++;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.log(`not ok ${testNumber} - ${name} (${duration}ms)`);
      logger.log(`  ---`);
      logger.log(`  error: ${error.message}`);
      logger.log(`  ---`);
      
      testResults.tests.push({
        id: testNumber,
        name,
        status: 'failed',
        duration,
        error: error.message
      });
      testResults.summary.failed++;
    }
    
    testResults.summary.total++;
  }

  async cleanup() {
    if (this.server) {
      logger.log('\nCleaning up...');
      this.server.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Test assertions
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertExists(value, name) {
  assert(value !== undefined && value !== null, `${name} should exist`);
}

function assertType(value, type, name) {
  assert(typeof value === type, `${name} should be of type ${type}, got ${typeof value}`);
}

// Main test suite
async function runTests() {
  logger.log('TAP version 14');
  logger.log(`# Twenty MCP Server Test Suite`);
  logger.log(`# Started at: ${new Date().toISOString()}`);
  logger.log(`# Environment: Node ${process.version} on ${process.platform}`);
  
  const runner = new MCPTestRunner();
  
  try {
    // Start server
    await runner.startServer();
    
    // Test 1: Initialize protocol
    await runner.runTest('Protocol initialization', async () => {
      const response = await runner.sendMessage({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-suite',
            version: '1.0.0'
          }
        },
        id: 1
      });
      
      assertExists(response.result, 'response.result');
      assert(response.result.protocolVersion === '2024-11-05', 'Protocol version mismatch');
      assertExists(response.result.serverInfo, 'serverInfo');
      assert(response.result.serverInfo.name === 'twenty-mcp-server', 'Server name mismatch');
    });
    
    // Test 2: List available tools
    await runner.runTest('List available tools', async () => {
      const response = await runner.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 2
      });
      
      assertExists(response.result, 'response.result');
      assertExists(response.result.tools, 'tools array');
      assert(Array.isArray(response.result.tools), 'Tools should be an array');
      assert(response.result.tools.length > 0, 'Should have at least one tool');
      
      // Check for specific tools
      const toolNames = response.result.tools.map(t => t.name);
      assert(toolNames.includes('create_contact'), 'Should have create_contact tool');
      assert(toolNames.includes('create_opportunity'), 'Should have create_opportunity tool');
      assert(toolNames.includes('create_company'), 'Should have create_company tool');
      
      logger.log(`  Found ${response.result.tools.length} tools`);
    });
    
    // Test 3: Create a contact
    await runner.runTest('Create contact', async () => {
      const response = await runner.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'create_contact',
          arguments: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com'
          }
        },
        id: 3
      });
      
      assertExists(response.result, 'response.result');
      assertExists(response.result.content, 'content');
      assert(response.result.content[0].type === 'text', 'Content should be text');
      assert(response.result.content[0].text.includes('Contact created successfully'), 'Should confirm creation');
    });
    
    // Test 4: Create an opportunity
    await runner.runTest('Create opportunity', async () => {
      const response = await runner.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'create_opportunity',
          arguments: {
            name: 'Test Deal',
            amount: {
              value: 10000,
              currency: 'USD'
            }
          }
        },
        id: 4
      });
      
      assertExists(response.result, 'response.result');
      assertExists(response.result.content, 'content');
      assert(!response.result.isError, 'Should not be an error');
      assert(response.result.content[0].text.includes('Created opportunity'), 'Should confirm creation');
    });
    
    // Test 5: List opportunities by stage
    await runner.runTest('List opportunities by stage', async () => {
      const response = await runner.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'list_opportunities_by_stage',
          arguments: {}
        },
        id: 5
      });
      
      assertExists(response.result, 'response.result');
      assertExists(response.result.content, 'content');
      assert(response.result.content[0].text.includes('Opportunities by Stage'), 'Should show pipeline view');
    });
    
    // Test 6: Search contacts
    await runner.runTest('Search contacts', async () => {
      const response = await runner.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'search_contacts',
          arguments: {
            query: 'test',
            limit: 5
          }
        },
        id: 6
      });
      
      assertExists(response.result, 'response.result');
      assertExists(response.result.content, 'content');
      assertType(response.result.content[0].text, 'string', 'Response text');
    });
    
    // Test 7: Create a company
    await runner.runTest('Create company', async () => {
      const response = await runner.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'create_company',
          arguments: {
            name: 'Test Company Inc',
            domainName: 'testcompany.com',
            employees: 50
          }
        },
        id: 7
      });
      
      assertExists(response.result, 'response.result');
      assert(response.result.content[0].text.includes('Company created successfully'), 'Should confirm creation');
    });
    
    // Test 8: Create a task
    await runner.runTest('Create task', async () => {
      const response = await runner.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'create_task',
          arguments: {
            title: 'Follow up with test contact',
            body: 'Send proposal document',
            status: 'TODO'
          }
        },
        id: 8
      });
      
      assertExists(response.result, 'response.result');
      assert(response.result.content[0].text.includes('Task created successfully'), 'Should confirm creation');
    });
    
  } finally {
    await runner.cleanup();
  }
  
  // Print summary
  logger.log(`\n# Test Summary`);
  logger.log(`# Total: ${testResults.summary.total}`);
  logger.log(`# Passed: ${testResults.summary.passed}`);
  logger.log(`# Failed: ${testResults.summary.failed}`);
  logger.log(`# Duration: ${Date.now() - Date.parse(testResults.timestamp)}ms`);
  logger.log(`\n1..${testResults.summary.total}`);
  
  // Save results
  logger.save();
  writeFileSync(
    join(RESULTS_DIR, 'test-results.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Check for required environment variables
if (!process.env.TWENTY_API_KEY) {
  console.error('Error: TWENTY_API_KEY environment variable is required');
  console.error('Usage: source .env && npm test');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  logger.log(`\n# Fatal error: ${error.message}`);
  logger.save();
  process.exit(1);
});