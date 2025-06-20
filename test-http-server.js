import { spawn } from 'child_process';
import fetch from 'node-fetch';

async function testHttpServer() {
  console.log('Testing HTTP MCP server...');
  
  const apiKey = process.env.TWENTY_API_KEY;
  const baseUrl = process.env.TWENTY_BASE_URL || 'https://twenty.app.jezweb.com';
  
  if (!apiKey) {
    console.error('TWENTY_API_KEY environment variable is required');
    console.error('Run: source .env && node test-http-server.js');
    process.exit(1);
  }
  
  // Start the HTTP server
  const serverProcess = spawn('node', ['dist/http-server.js'], {
    env: { ...process.env, PORT: '3001' },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let serverStarted = false;
  
  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.log('Server:', output.trim());
    if (output.includes('running on HTTP port')) {
      serverStarted = true;
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log('Server stdout:', data.toString());
  });

  // Wait for server to start
  while (!serverStarted) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  try {
    // Test initialization
    console.log('\n=== Testing Initialize ===');
    const initResponse = await fetch(`http://localhost:3001/mcp?apiKey=${encodeURIComponent(apiKey)}&baseUrl=${encodeURIComponent(baseUrl)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      })
    });

    console.log('Initialize status:', initResponse.status);
    const initData = await initResponse.text();
    console.log('Initialize response:', initData);

    // Test tools list
    console.log('\n=== Testing Tools List ===');
    const toolsResponse = await fetch(`http://localhost:3001/mcp?apiKey=${encodeURIComponent(apiKey)}&baseUrl=${encodeURIComponent(baseUrl)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': 'test-session'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      })
    });

    console.log('Tools list status:', toolsResponse.status);
    const toolsData = await toolsResponse.text();
    console.log('Tools response length:', toolsData.length);
    
    if (toolsData.length > 100) {
      const parsed = JSON.parse(toolsData);
      console.log('Tools found:', parsed.result?.tools?.length || 0);
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    serverProcess.kill();
  }
}

testHttpServer().catch(console.error);