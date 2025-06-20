# Twenty MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Twenty CRM](https://img.shields.io/badge/Twenty-CRM-blue)](https://twenty.com/)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-Compatible-green)](https://modelcontextprotocol.io/)

A Model Context Protocol (MCP) server that provides seamless integration with the Twenty CRM API, enabling LLM agents to interact with your CRM data through well-defined, typed tools.

## Overview

This MCP server transforms your Twenty CRM instance into a powerful tool accessible by Claude and other MCP-compatible AI assistants. It provides comprehensive access to contacts, companies, tasks, and notes with full TypeScript support and robust error handling.

## Features

- **Contact Management**: Create, retrieve, update, and search contacts
- **Company Management**: Create, retrieve, update, and search companies  
- **Task Management**: Create tasks and retrieve task lists
- **Note Management**: Create notes for tracking information
- **Full TypeScript Support**: Comprehensive type definitions and validation

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the following environment variables:

```bash
export TWENTY_API_KEY="your-twenty-api-key"
export TWENTY_BASE_URL="https://your-twenty-instance.com"  # For self-hosted instances
```

### Example for self-hosted instance:
```bash
export TWENTY_API_KEY="your-actual-api-key-here"
export TWENTY_BASE_URL="https://your-twenty-instance.com"
```

## Usage

### Running the Server

```bash
npm start
```

### Development

```bash
npm run dev
```

### Available Tools

#### Contact Tools
- `create_contact` - Create a new contact
- `get_contact` - Retrieve contact by ID
- `update_contact` - Update existing contact
- `search_contacts` - Search contacts by name or email

#### Company Tools  
- `create_company` - Create a new company
- `get_company` - Retrieve company by ID
- `update_company` - Update existing company
- `search_companies` - Search companies by name or domain

#### Task Tools
- `create_task` - Create a new task
- `get_tasks` - Retrieve task list

#### Note Tools
- `create_note` - Create a new note

#### Opportunity Tools
- `create_opportunity` - Create a new opportunity/deal
- `get_opportunity` - Retrieve opportunity by ID
- `update_opportunity` - Update existing opportunity
- `search_opportunities` - Search with advanced filters
- `list_opportunities_by_stage` - View sales pipeline

## Testing

The project includes comprehensive test suites:

```bash
# Run smoke tests (no API key needed)
npm run test:smoke

# Run integration tests (requires API key)
source .env && npm test
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

## API Key Setup

1. Log into your Twenty CRM instance
2. Navigate to Settings > API & Webhooks (under Developers)
3. Generate a new API key
4. Copy the key and set it as the `TWENTY_API_KEY` environment variable

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type check
npm run typecheck
```

## Architecture

### Project Structure
```
twenty-mcp-server/
├── src/
│   ├── client/
│   │   └── twenty-client.ts    # GraphQL client for Twenty API
│   ├── tools/
│   │   └── index.ts            # MCP tool implementations
│   ├── types/
│   │   └── twenty.ts           # TypeScript interfaces
│   └── index.ts                # Main server entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Key Components

- **TwentyClient**: GraphQL client that handles API communication with Twenty CRM
- **MCP Tools**: 11 tools that provide CRM functionality to AI assistants
- **Type System**: Comprehensive TypeScript definitions for Twenty's data structures
- **Schema Transformation**: Converts flat tool inputs to Twenty's nested GraphQL schema

## IDE Integration

### Claude Desktop

To use this server with Claude Desktop, add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "twenty-crm": {
      "command": "node",
      "args": ["/path/to/twenty-mcp/dist/index.js"],
      "env": {
        "TWENTY_API_KEY": "your-api-key-here",
        "TWENTY_BASE_URL": "https://your-twenty-instance.com"
      }
    }
  }
}
```

### Smithery

This server is fully compatible with [Smithery](https://smithery.ai/), the MCP client for developers. The included `smithery.yaml` configuration file provides automatic setup.

1. Install Smithery globally:
   ```bash
   npm install -g @smithery/cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Start the server with Smithery:
   ```bash
   smithery run
   ```

4. Configure your Twenty CRM credentials when prompted:
   - **API Key**: Your Twenty CRM API key (from Settings > API & Webhooks)
   - **Base URL**: Your Twenty instance URL (e.g., `https://your-instance.twenty.com`)

### Cursor IDE

To integrate with [Cursor](https://cursor.so/), add this MCP server configuration:

1. Open Cursor Settings
2. Navigate to Extensions → MCP Servers
3. Add a new server with:
   ```json
   {
     "name": "twenty-crm",
     "command": "node",
     "args": ["/path/to/twenty-mcp/dist/index.js"],
     "env": {
       "TWENTY_API_KEY": "your-api-key-here",
       "TWENTY_BASE_URL": "https://your-twenty-instance.com"
     }
   }
   ```

### Roo Code

For [Roo Code](https://roo.codes/) integration:

1. Install the MCP extension in Roo Code
2. Add the server configuration to your workspace settings:
   ```json
   {
     "mcp.servers": {
       "twenty-crm": {
         "command": "node",
         "args": ["/path/to/twenty-mcp/dist/index.js"],
         "env": {
           "TWENTY_API_KEY": "your-api-key-here",
           "TWENTY_BASE_URL": "https://your-twenty-instance.com"
         }
       }
     }
   }
   ```

### Cline (VS Code Extension)

To use with [Cline](https://github.com/clinebot/cline) in VS Code:

1. Install the Cline extension from the VS Code marketplace
2. Open VS Code settings (JSON format)
3. Add the MCP server configuration:
   ```json
   {
     "cline.mcpServers": {
       "twenty-crm": {
         "command": "node",
         "args": ["/path/to/twenty-mcp/dist/index.js"],
         "env": {
           "TWENTY_API_KEY": "your-api-key-here",
           "TWENTY_BASE_URL": "https://your-twenty-instance.com"
         }
       }
     }
   }
   ```

### HTTP Server Mode

For web-based integrations or custom implementations, you can run the server in HTTP mode:

```bash
npm run start
```

The server will be available at `http://localhost:3000/mcp` and accepts configuration via query parameters:
```
http://localhost:3000/mcp?apiKey=your-api-key&baseUrl=https://your-instance.twenty.com
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper TypeScript types
4. Add tests if applicable
5. Run linting and type checking: `npm run lint && npm run typecheck`
6. Commit your changes: `git commit -m 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## Troubleshooting

### Common Issues

**Server fails to start:**
- Verify `TWENTY_API_KEY` is set correctly
- Check that `TWENTY_BASE_URL` points to your Twenty instance
- Ensure your Twenty instance is accessible

**GraphQL errors:**
- Confirm your API key has the necessary permissions
- Check that your Twenty instance supports the GraphQL endpoints used

**Tool execution errors:**
- Review the error messages returned by the tools
- Verify the input parameters match the expected schema

### Debugging

Enable debug logging by setting:
```bash
export DEBUG=twenty-mcp:*
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Twenty CRM](https://twenty.com/) for providing the open-source CRM platform
- [Model Context Protocol](https://modelcontextprotocol.io/) for the integration standard
- [Anthropic](https://anthropic.com/) for Claude and the MCP framework