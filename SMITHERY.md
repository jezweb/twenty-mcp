# Twenty MCP Server on Smithery

This guide explains how to deploy and use the Twenty MCP Server on [Smithery](https://smithery.ai), the platform for AI-native services.

## What is Smithery?

Smithery is a platform that makes it easy to:
- Deploy MCP servers without managing infrastructure
- Share your MCP servers with the community
- Discover and use other MCP servers
- Configure servers through a simple UI

## Quick Start with Smithery

### Option 1: Use the Published Server

1. **Find the Server**
   - Visit [smithery.ai](https://smithery.ai)
   - Search for "Twenty MCP" or "Twenty CRM"
   - Click on the server to view details

2. **Configure**
   - Click "Use this server"
   - Enter your Twenty CRM credentials:
     - API Key: Get from Twenty CRM → Settings → API & Webhooks
     - Base URL: Your Twenty instance URL (default: https://api.twenty.com)

3. **Connect to Your IDE**
   - Follow Smithery's IDE connection guide
   - The server URL and configuration will be provided automatically

### Option 2: Deploy Your Own Instance

If you want to deploy a customized version:

1. **Install Smithery CLI**
   ```bash
   npm install -g @smithery/cli
   ```

2. **Clone and Prepare**
   ```bash
   git clone https://github.com/jezweb/twenty-mcp.git
   cd twenty-mcp
   npm install
   npm run build
   ```

3. **Test Locally**
   ```bash
   smithery dev
   ```
   This will:
   - Start the server locally
   - Open a playground for testing
   - Allow you to configure and test all 29 tools

4. **Deploy to Smithery**
   ```bash
   smithery deploy
   ```
   This will:
   - Build and validate your server
   - Deploy to Smithery's infrastructure
   - Provide you with a server URL

## Configuration

The Twenty MCP Server accepts configuration through Smithery's UI:

| Field | Description | Required |
|-------|-------------|----------|
| `apiKey` | Your Twenty CRM API key | Yes |
| `baseUrl` | Your Twenty instance URL | Yes |

### Getting Your API Key

1. Log into your Twenty CRM instance
2. Navigate to Settings → API & Webhooks
3. Click "Generate API Key"
4. Copy the key immediately (it won't be shown again)

## Features on Smithery

When deployed on Smithery, you get:

### 🎮 Interactive Playground
- Test all 29 tools without IDE setup
- See real-time results
- Validate your configuration

### 🔒 Secure Configuration
- Credentials are encrypted
- Environment isolation
- No need to manage secrets in config files

### 🚀 Automatic Scaling
- Handles multiple concurrent connections
- No server management required
- Always available

### 📊 Usage Analytics
- See how your server is being used
- Monitor performance
- Track errors

## Available Tools

The server provides 29 tools across 8 categories:

- **Contact Management** (4 tools)
- **Company Management** (4 tools)
- **Opportunity Management** (5 tools)
- **Activity Management** (4 tools)
- **Task Management** (2 tools)
- **Note Management** (1 tool)
- **Relationship Management** (6 tools)
- **Metadata Discovery** (3 tools)

See [TOOLS.md](TOOLS.md) for detailed documentation.

## Docker Support

The server includes Docker support for Smithery deployment:

```bash
# Build locally
npm run docker:build

# Run locally
npm run docker:run
```

## Environment Variables

When running on Smithery, the platform automatically sets:
- `SMITHERY_CONFIG_APIKEY` - Your Twenty API key
- `SMITHERY_CONFIG_BASEURL` - Your Twenty base URL

The server automatically detects and uses these variables.

## Troubleshooting

### Server Not Starting
- Check logs in Smithery dashboard
- Verify your API key is valid
- Ensure base URL is correct (no trailing slash)

### Tools Not Working
- Test with the playground first
- Check API key permissions in Twenty CRM
- Verify your Twenty instance is accessible

### Configuration Issues
- Use the validation endpoint: `/health`
- Check Smithery logs for errors
- Ensure all required fields are filled

## Development

To contribute or customize:

1. Fork the repository
2. Make your changes
3. Test with `smithery dev`
4. Submit a pull request

For Smithery-specific features:
- Update `smithery.yaml` for configuration changes
- Modify `Dockerfile` for deployment changes
- Update health check endpoint for monitoring

## Support

- **Twenty MCP Issues**: [GitHub Issues](https://github.com/jezweb/twenty-mcp/issues)
- **Smithery Platform**: [support@smithery.ai](mailto:support@smithery.ai)
- **Twenty CRM**: [Twenty Documentation](https://docs.twenty.com)

## Links

- [Smithery Platform](https://smithery.ai)
- [Twenty MCP on Smithery](https://smithery.ai/server/twenty-mcp)
- [GitHub Repository](https://github.com/jezweb/twenty-mcp)
- [Twenty CRM](https://twenty.com)