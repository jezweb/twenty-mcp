#!/usr/bin/env node

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { TwentyClient } from './client/twenty-client.js';
import { registerPersonTools, registerCompanyTools, registerTaskTools, registerOpportunityTools } from './tools/index.js';

async function main() {
  const port = parseInt(process.env.PORT || '3000');
  
  // Parse configuration from multiple sources
  function parseConfig(url: string) {
    const urlObj = new URL(url, `http://localhost:${port}`);
    const params = urlObj.searchParams;
    
    // Priority: URL params > Environment variables > Smithery config
    return {
      apiKey: params.get('apiKey') || 
              process.env.TWENTY_API_KEY || 
              process.env.SMITHERY_CONFIG_APIKEY || 
              process.env.apiKey,
      baseUrl: params.get('baseUrl') || 
               process.env.TWENTY_BASE_URL || 
               process.env.SMITHERY_CONFIG_BASEURL || 
               process.env.baseUrl ||
               'https://api.twenty.com',
    };
  }

  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    // Handle health check endpoint
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', service: 'twenty-mcp-server' }));
      return;
    }

    // Only handle /mcp endpoint
    if (!req.url?.startsWith('/mcp')) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    try {
      // Parse configuration from query parameters
      const config = parseConfig(req.url);
      
      if (!config.apiKey) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Missing required apiKey parameter'
        }));
        return;
      }

      // Create MCP server with Twenty client
      const server = new McpServer({
        name: 'twenty-mcp-server',
        version: '1.0.0',
      });

      const client = new TwentyClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });

      // Register tools
      registerPersonTools(server, client);
      registerCompanyTools(server, client);
      registerTaskTools(server, client);
      registerOpportunityTools(server, client);

      // Create streamable HTTP transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });

      // Connect server to transport
      await server.connect(transport);

      // Parse request body for POST requests
      let body: any = undefined;
      if (req.method === 'POST') {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const bodyText = Buffer.concat(chunks).toString();
            if (bodyText.trim()) {
              body = JSON.parse(bodyText);
            }
            await transport.handleRequest(req, res, body);
          } catch (error) {
            console.error('Error parsing request body:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
          }
        });
      } else {
        // Handle GET/DELETE requests
        await transport.handleRequest(req, res, body);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  });

  httpServer.listen(port, () => {
    console.log(`Twenty MCP Server running at http://localhost:${port}/mcp`);
    console.log(`Health check available at http://localhost:${port}/health`);
    
    // Log configuration source for debugging
    if (process.env.SMITHERY_CONFIG_APIKEY) {
      console.log('Running in Smithery environment');
    } else if (process.env.TWENTY_API_KEY) {
      console.log('Using environment variables for configuration');
    } else {
      console.log(`Example: http://localhost:${port}/mcp?apiKey=YOUR_API_KEY&baseUrl=https://api.twenty.com`);
    }
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});