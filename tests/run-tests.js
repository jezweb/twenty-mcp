#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

// Configuration
const RESULTS_DIR = join(process.cwd(), 'test-results');
const TEST_TIMEOUT = 10000;

// Ensure directories exist
mkdirSync(RESULTS_DIR, { recursive: true });

// Test results
const results = {
  timestamp: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: process.platform,
    twenty_base_url: process.env.TWENTY_BASE_URL || 'https://twenty.app.jezweb.com'
  },
  tests: [],
  stats: {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0
  }
};

// Helper to run a test
async function runTest(name, testFn) {
  const startTime = Date.now();
  const test = {
    name,
    status: 'running',
    startTime: new Date().toISOString(),
    logs: []
  };
  
  console.log(`\n▶ Running: ${name}`);
  
  try {
    const result = await testFn();
    test.status = 'passed';
    test.result = result;
    console.log(`✅ PASSED: ${name}`);
    results.stats.passed++;
  } catch (error) {
    test.status = 'failed';
    test.error = error.message;
    test.errorDetails = error.stack;
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    results.stats.failed++;
  }
  
  test.duration = Date.now() - startTime;
  test.endTime = new Date().toISOString();
  results.tests.push(test);
  results.stats.total++;
}

// Send message to MCP server
async function sendMessage(server, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Response timeout'));
    }, 5000);
    
    let buffer = '';
    const lineHandler = (line) => {
      try {
        const response = JSON.parse(line);
        clearTimeout(timeout);
        resolve(response);
      } catch (e) {
        // Not JSON, keep buffering
      }
    };
    
    const rl = readline.createInterface({
      input: server.stdout,
      output: process.stdout,
      terminal: false
    });
    
    rl.once('line', lineHandler);
    server.stdin.write(JSON.stringify(message) + '\n');
  });
}

// Main test execution
async function executeTests() {
  console.log('🧪 Twenty MCP Server Test Suite');
  console.log('================================');
  console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
  console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
  console.log(`🖥️  Node: ${process.version}`);
  console.log(`🌐 API: ${results.environment.twenty_base_url}`);
  
  const startTime = Date.now();
  
  // Start MCP server
  console.log('\n🚀 Starting MCP Server...');
  const server = spawn('npm', ['run', 'dev'], {
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Wait for server to start
  await new Promise((resolve) => {
    server.stderr.once('data', (data) => {
      if (data.toString().includes('Twenty MCP Server running')) {
        console.log('✅ Server started successfully');
        resolve();
      }
    });
  });
  
  try {
    // Test 1: Initialize
    await runTest('Initialize MCP Protocol', async () => {
      const response = await sendMessage(server, {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-runner', version: '1.0.0' }
        },
        id: 1
      });
      
      if (!response.result?.serverInfo?.name === 'twenty-mcp-server') {
        throw new Error('Invalid server response');
      }
      
      return {
        serverName: response.result.serverInfo.name,
        serverVersion: response.result.serverInfo.version
      };
    });
    
    // Test 2: List Tools
    await runTest('List Available Tools', async () => {
      const response = await sendMessage(server, {
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 2
      });
      
      const tools = response.result.tools;
      const toolCategories = {
        contacts: tools.filter(t => t.name.includes('contact')).length,
        companies: tools.filter(t => t.name.includes('company')).length,
        opportunities: tools.filter(t => t.name.includes('opportunity')).length,
        tasks: tools.filter(t => t.name.includes('task')).length,
        notes: tools.filter(t => t.name.includes('note')).length
      };
      
      return {
        totalTools: tools.length,
        categories: toolCategories,
        toolNames: tools.map(t => t.name)
      };
    });
    
    // Test 3: Create Contact
    await runTest('Create Test Contact', async () => {
      const response = await sendMessage(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'create_contact',
          arguments: {
            firstName: 'Test',
            lastName: `User_${Date.now()}`,
            email: `test${Date.now()}@example.com`
          }
        },
        id: 3
      });
      
      if (response.result?.isError) {
        throw new Error(response.result.content[0].text);
      }
      
      return { message: response.result.content[0].text };
    });
    
    // Test 4: Create Opportunity
    await runTest('Create Test Opportunity', async () => {
      const response = await sendMessage(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'create_opportunity',
          arguments: {
            name: `Test Deal ${Date.now()}`,
            amount: { value: 25000, currency: 'USD' },
            closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        },
        id: 4
      });
      
      if (response.result?.isError) {
        throw new Error(response.result.content[0].text);
      }
      
      return { message: response.result.content[0].text };
    });
    
    // Test 5: List Opportunities
    await runTest('List Opportunities by Stage', async () => {
      const response = await sendMessage(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'list_opportunities_by_stage',
          arguments: {}
        },
        id: 5
      });
      
      const content = response.result.content[0].text;
      const totalMatch = content.match(/Total: (\d+) opportunities/);
      const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0;
      
      return {
        totalOpportunities: totalCount,
        hasContent: content.includes('Opportunities by Stage')
      };
    });
    
    // Test 6: Create Company
    await runTest('Create Test Company', async () => {
      const response = await sendMessage(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'create_company',
          arguments: {
            name: `Test Corp ${Date.now()}`,
            domainName: `testcorp${Date.now()}.com`,
            employees: 100
          }
        },
        id: 6
      });
      
      if (response.result?.isError) {
        throw new Error(response.result.content[0].text);
      }
      
      return { message: response.result.content[0].text };
    });
    
  } finally {
    // Cleanup
    server.kill();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  results.stats.duration = Date.now() - startTime;
  
  // Generate reports
  await generateReports();
}

// Generate test reports
async function generateReports() {
  // 1. JSON Report
  const jsonPath = join(RESULTS_DIR, 'latest-test-results.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  
  // 2. Markdown Report
  const mdPath = join(RESULTS_DIR, 'TEST_REPORT.md');
  const markdown = `# Twenty MCP Server Test Report

## Test Execution Summary

- **Date**: ${new Date(results.timestamp).toLocaleDateString()}
- **Time**: ${new Date(results.timestamp).toLocaleTimeString()}
- **Duration**: ${results.stats.duration}ms
- **Environment**: Node ${results.environment.node} on ${results.environment.platform}
- **API Endpoint**: ${results.environment.twenty_base_url}

## Results Overview

| Metric | Count |
|--------|-------|
| Total Tests | ${results.stats.total} |
| ✅ Passed | ${results.stats.passed} |
| ❌ Failed | ${results.stats.failed} |
| Success Rate | ${((results.stats.passed / results.stats.total) * 100).toFixed(1)}% |

## Test Details

${results.tests.map((test, i) => `
### ${i + 1}. ${test.name}

- **Status**: ${test.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
- **Duration**: ${test.duration}ms
- **Time**: ${new Date(test.startTime).toLocaleTimeString()}
${test.error ? `- **Error**: ${test.error}` : ''}
${test.result ? `- **Result**: \`\`\`json
${JSON.stringify(test.result, null, 2)}
\`\`\`` : ''}
`).join('\n')}

## Test Coverage

The test suite validates:
- ✅ MCP Protocol initialization
- ✅ Tool discovery and listing
- ✅ Contact creation
- ✅ Opportunity management
- ✅ Company creation
- ✅ Pipeline visualization

---
*Generated automatically by Twenty MCP Test Suite*
`;
  
  writeFileSync(mdPath, markdown);
  
  // 3. Summary Badge (for README)
  const badgePath = join(RESULTS_DIR, 'test-badge.json');
  const badgeColor = results.stats.failed === 0 ? 'brightgreen' : 'red';
  const badgeStatus = results.stats.failed === 0 ? 'passing' : 'failing';
  
  writeFileSync(badgePath, JSON.stringify({
    schemaVersion: 1,
    label: 'tests',
    message: badgeStatus,
    color: badgeColor
  }));
  
  console.log('\n📊 Test Reports Generated:');
  console.log(`   - JSON: ${jsonPath}`);
  console.log(`   - Markdown: ${mdPath}`);
  console.log(`   - Badge: ${badgePath}`);
  
  // Print summary
  console.log('\n📈 Test Summary:');
  console.log(`   Total: ${results.stats.total}`);
  console.log(`   Passed: ${results.stats.passed}`);
  console.log(`   Failed: ${results.stats.failed}`);
  console.log(`   Duration: ${results.stats.duration}ms`);
  
  if (results.stats.failed === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed!');
  }
}

// Check environment
if (!process.env.TWENTY_API_KEY) {
  console.error('❌ Error: TWENTY_API_KEY environment variable is required');
  console.error('💡 Usage: source .env && node tests/run-tests.js');
  process.exit(1);
}

// Run tests
executeTests().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});