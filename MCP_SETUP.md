# MCP Server Setup Guide

The Twenty MCP Server supports both traditional API key authentication and OAuth 2.1 authentication. Choose the setup method that best fits your needs.

## Authentication Options

### 🔑 API Key Mode (Simple)
- Single API key for all users
- Quick setup for personal use
- Configuration via environment variables

### 🔐 OAuth Mode (Advanced)
- User-specific encrypted API keys
- Multi-user support
- Enhanced security with Clerk authentication
- See [OAUTH.md](OAUTH.md) for detailed setup

## Option 0: Docker MCP (Recommended for Docker Desktop Users)

The easiest way to get started if you have Docker Desktop with MCP Toolkit enabled.

### Via Docker Desktop UI
1. Open Docker Desktop
2. Go to **MCP Catalog**
3. Search for "Twenty CRM"
4. Click **Install**
5. Configure your API key and base URL when prompted

### Via Docker CLI
```bash
docker mcp install twenty-mcp
```

When prompted, enter:
- **TWENTY_API_KEY**: Your API key from Twenty CRM (Settings → Developers → API & Webhooks)
- **TWENTY_BASE_URL**: Your Twenty instance URL (e.g., `https://api.twenty.com`)

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

### OAuth Configuration (Advanced)

For OAuth-enabled setup, configure the HTTP server instead:

```json
{
  "mcpServers": {
    "twenty": {
      "command": "node",
      "args": ["/home/jez/claude/twenty-mcp/dist/http-server.js"],
      "env": {
        "AUTH_ENABLED": "true",
        "CLERK_SECRET_KEY": "sk_test_your_clerk_secret_key",
        "CLERK_PUBLISHABLE_KEY": "pk_test_your_clerk_publishable_key",
        "API_KEY_ENCRYPTION_SECRET": "your-32-byte-encryption-secret",
        "PORT": "3000"
      }
    }
  }
}
```

Then connect to the HTTP endpoint with Bearer authentication:
- URL: `http://localhost:3000/mcp`
- Authentication: Bearer token from OAuth flow
- See [OAUTH.md](OAUTH.md) for complete setup

## Option 2: VS Code Extension

### API Key Mode
1. Start the server: `npm run dev:http`
2. Connect to: `http://localhost:3000/mcp?apiKey=YOUR_API_KEY&baseUrl=https://twenty.app.jezweb.com`

### OAuth Mode
1. Set up OAuth: `npm run setup:oauth`
2. Start the server: `npm start`
3. Connect with Bearer authentication
4. Configure API keys via `/api/keys` endpoint

## Option 3: Test Client

### API Key Mode
```bash
# Load environment variables and run test
source .env && node test-mcp-client.js
```

### OAuth Mode
```bash
# Test OAuth flow
npm run test:oauth

# Interactive OAuth examples
node examples/oauth-client.js
open examples/oauth-web-example.html
```

## Option 4: Using npx

### API Key Mode
```bash
TWENTY_API_KEY=your-key TWENTY_BASE_URL=https://twenty.app.jezweb.com npx -y @modelcontextprotocol/inspector dist/index.js
```

### OAuth Mode
```bash
# Set up OAuth first
npm run setup:oauth

# Run with OAuth enabled
AUTH_ENABLED=true npm start

# Then use MCP Inspector with Bearer authentication
```

This will open the MCP Inspector in your browser for interactive testing.

## Quick Setup Commands

### For API Key Mode
```bash
# Clone and set up with API key
git clone https://github.com/jezweb/twenty-mcp.git
cd twenty-mcp
npm install && npm run build
cp .env.example .env
# Edit .env with your API key
npm start
```

### For OAuth Mode
```bash
# Clone and set up with OAuth
git clone https://github.com/jezweb/twenty-mcp.git
cd twenty-mcp
npm install && npm run build
npm run setup:oauth  # Interactive OAuth setup
npm start
```

## Next Steps

- **API Key Mode**: Add your Twenty API key to `.env` and start using
- **OAuth Mode**: Complete Clerk setup and configure user API keys via `/api/keys`
- **Documentation**: See [OAUTH.md](OAUTH.md) for detailed OAuth guide
- **Examples**: Check the `examples/` directory for integration examples