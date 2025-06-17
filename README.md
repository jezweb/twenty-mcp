# Twenty MCP Server

A Model Context Protocol (MCP) server that provides integration with the Twenty CRM API, enabling LLM agents to interact with your CRM data.

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
export TWENTY_BASE_URL="https://twenty.app.jezweb.com"  # For your self-hosted instance
```

### For the jezweb.com instance specifically:
```bash
export TWENTY_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOTg5ZGQzZC00NTZiLTQzNmEtOTYyYi0yNzMwMWRmM2VkM2EiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiYjk4OWRkM2QtNDU2Yi00MzZhLTk2MmItMjczMDFkZjNlZDNhIiwiaWF0IjoxNzUwMTQwMjEyLCJleHAiOjQ5MDM3NDAyMTEsImp0aSI6ImExZTdjNDIwLTQ2ZjUtNGMxMC04MTRkLTAyM2E3ZmViYmRhNiJ9.fRe_E8TyCBbCq90kC2xuv9Q8t6F_6mkaJcqhYS3i16M"
export TWENTY_BASE_URL="https://twenty.app.jezweb.com"
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

## License

MIT