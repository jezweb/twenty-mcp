#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

// Set up environment variables - make sure to load from .env file or set them before running
if (!process.env.TWENTY_API_KEY) {
  console.error('TWENTY_API_KEY environment variable is required');
  console.error('Run: source .env && node test-mcp-client.js');
  process.exit(1);
}
process.env.TWENTY_BASE_URL = process.env.TWENTY_BASE_URL || 'https://twenty.app.jezweb.com';

// Spawn the MCP server
const server = spawn('npm', ['run', 'dev'], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Create readline interface for server output
const rl = readline.createInterface({
  input: server.stdout,
  output: process.stdout,
  terminal: false
});

// Handle server stderr
server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Send JSON-RPC messages
function sendMessage(message) {
  const json = JSON.stringify(message);
  console.log('Sending:', json);
  server.stdin.write(json + '\n');
}

// Handle server responses
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.log('Received:', JSON.stringify(response, null, 2));
  } catch (e) {
    console.log('Server output:', line);
  }
});

// Test sequence
setTimeout(() => {
  // 1. Initialize
  sendMessage({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    },
    id: 1
  });
}, 1000);

setTimeout(() => {
  // 2. List tools
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 2
  });
}, 2000);

setTimeout(() => {
  // 3. Call a tool (create opportunity)
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'create_opportunity',
      arguments: {
        name: 'Test Deal - Software License',
        amount: {
          value: 50000,
          currency: 'USD'
        },
        closeDate: '2024-03-31'
      }
    },
    id: 3
  });
}, 3000);

setTimeout(() => {
  // 4. List opportunities by stage
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'list_opportunities_by_stage',
      arguments: {}
    },
    id: 4
  });
}, 4000);

// Exit after tests
setTimeout(() => {
  console.log('\nTest completed!');
  server.kill();
  process.exit(0);
}, 6000);