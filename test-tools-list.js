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
    console.log('✅ Server started, listing tools...\n');
    
    // Test tools/list to see all available tools
    const message = {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
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
          console.log('📊 AVAILABLE TOOLS:');
          console.log('==================');
          const tools = response.result.tools;
          console.log(`Total tools: ${tools.length}`);
          
          // Group by category
          const categories = {};
          tools.forEach(tool => {
            const category = getToolCategory(tool.name);
            if (!categories[category]) categories[category] = [];
            categories[category].push(tool.name);
          });
          
          Object.entries(categories).forEach(([category, toolNames]) => {
            console.log(`\n${category}:`);
            toolNames.forEach(name => console.log(`  - ${name}`));
          });
          
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

function getToolCategory(toolName) {
  if (toolName.includes('contact') || toolName.includes('person')) return 'Contacts';
  if (toolName.includes('company')) return 'Companies';
  if (toolName.includes('opportunity')) return 'Opportunities';
  if (toolName.includes('task')) return 'Tasks';
  if (toolName.includes('note')) return 'Notes';
  if (toolName.includes('activity') || toolName.includes('comment')) return 'Activities';
  if (toolName.includes('object') || toolName.includes('metadata') || toolName.includes('field')) return 'Metadata';
  if (toolName.includes('relationship') || toolName.includes('orphaned') || toolName.includes('link') || toolName.includes('transfer')) return 'Relationships';
  return 'Other';
}

// Timeout after 15 seconds
setTimeout(() => {
  console.log('❌ Test timeout');
  server.kill();
  process.exit(1);
}, 15000);