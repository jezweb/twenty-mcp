# Twenty CRM MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with the Twenty CRM API, enabling LLM agents to interact with your CRM data through 29 well-defined, typed tools.

## Features

- **Contact Management**: Create, retrieve, update, and search contacts
- **Company Management**: Full company lifecycle management
- **Opportunity Tracking**: Complete sales pipeline management
- **Activity Management**: Unified timeline view with filtering
- **Task Management**: Create and manage tasks
- **Relationship Management**: Link entities and analyze connections
- **Metadata Discovery**: Explore CRM schema and field definitions

## Configuration

### Required

- **TWENTY_API_KEY**: Your Twenty CRM API key
  - Get it from: Settings > Developers > API & Webhooks
  - Format: JWT token

### Optional

- **TWENTY_BASE_URL**: Your Twenty CRM instance URL
  - Default: `https://api.twenty.com`
  - For self-hosted: `https://your-instance.twenty.com`

## Usage

Once configured, you can ask your AI assistant to:

- "Show me all contacts in Twenty CRM"
- "Create a new company called Acme Corp"
- "Find all opportunities in the proposal stage"
- "Add a task to follow up with John Doe"
- "Show me all activities from last week"

## Links

- [Documentation](https://github.com/jezweb/twenty-mcp#readme)
- [Tool Reference](https://github.com/jezweb/twenty-mcp/blob/main/TOOLS.md)
- [Twenty CRM](https://twenty.com)
