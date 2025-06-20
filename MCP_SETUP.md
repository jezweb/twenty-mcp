# MCP Server Setup Guide

## Option 1: Claude Desktop App

1. Copy this configuration to your Claude Desktop config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add this to the config:
```json
{
  "mcpServers": {
    "twenty": {
      "command": "node",
      "args": ["/home/jez/claude/twenty-mcp/dist/index.js"],
      "env": {
        "TWENTY_API_KEY": "your-api-key-here",
        "TWENTY_BASE_URL": "https://twenty.app.jezweb.com"
      }
    }
  }
}
```

3. Restart Claude Desktop

## Option 2: VS Code Extension

If you have an MCP-compatible VS Code extension, you can use the HTTP server:

1. Start the server: `npm run dev:http`
2. Connect to: `http://localhost:3000/mcp?apiKey=YOUR_API_KEY&baseUrl=https://twenty.app.jezweb.com`

## Option 3: Test Client

Run the included test client:
```bash
# Load environment variables and run test
source .env && node test-mcp-client.js
```

## Option 4: Using npx

You can also run directly with npx:
```bash
TWENTY_API_KEY=your-key TWENTY_BASE_URL=https://twenty.app.jezweb.com npx -y @modelcontextprotocol/inspector dist/index.js
```

This will open the MCP Inspector in your browser for interactive testing.