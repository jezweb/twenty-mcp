#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TwentyClient } from './client/twenty-client.js';
import { registerPersonTools, registerCompanyTools, registerTaskTools, registerOpportunityTools, registerActivityTools, registerMetadataTools, registerRelationshipTools } from './tools/index.js';

async function main() {
  const apiKey = process.env.TWENTY_API_KEY;
  const baseUrl = process.env.TWENTY_BASE_URL;

  if (!apiKey) {
    console.error('TWENTY_API_KEY environment variable is required');
    process.exit(1);
  }

  const authEnabled = process.env.AUTH_ENABLED === 'true';
  
  const server = new McpServer({
    name: 'twenty-mcp-server',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
      experimental: {
        authentication: {
          type: 'oauth2',
          required: false,  // Stdio mode doesn't require auth
          enabled: authEnabled
        }
      }
    }
  });

  const client = new TwentyClient({
    apiKey,
    baseUrl,
  });

  registerPersonTools(server, client);
  registerCompanyTools(server, client);
  registerTaskTools(server, client);
  registerOpportunityTools(server, client);
  registerActivityTools(server, client);
  registerMetadataTools(server, client);
  registerRelationshipTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Twenty MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});