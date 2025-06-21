#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

const server = spawn('npm', ['run', 'dev'], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Wait for server to start
server.stderr.once('data', (data) => {
  if (data.toString().includes('Twenty MCP Server running')) {
    console.log('✅ Server started, testing metadata tools...\n');
    
    // Test list_all_objects
    const message = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'list_all_objects',
        arguments: { includeCustom: true, includeSystem: false }
      },
      id: 1
    };
    
    const rl = readline.createInterface({
      input: server.stdout,
      terminal: false
    });
    
    rl.on('line', (line) => {
      try {
        const response = JSON.parse(line);
        if (response.id === 1) {
          console.log('📊 OBJECTS IN YOUR TWENTY INSTANCE:');
          console.log('=====================================');
          console.log(response.result.content[0].text);
          
          rl.close();
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Not JSON, ignore
      }
    });
    
    server.stdin.write(JSON.stringify(message) + '\n');
  }
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('❌ Test timeout');
  server.kill();
  process.exit(1);
}, 15000);