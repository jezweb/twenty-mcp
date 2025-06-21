# Twenty MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Twenty CRM](https://img.shields.io/badge/Twenty-CRM-blue)](https://twenty.com/)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-Compatible-green)](https://modelcontextprotocol.io/)

A Model Context Protocol (MCP) server that provides seamless integration with the Twenty CRM API, enabling LLM agents to interact with your CRM data through well-defined, typed tools.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Verification](#verification)
- [IDE Integration](#ide-integration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Overview

This MCP server transforms your Twenty CRM instance into a powerful tool accessible by Claude and other MCP-compatible AI assistants. It provides comprehensive access to contacts, companies, tasks, and notes with full TypeScript support and robust error handling.

### Key Features

- **🤝 Contact Management**: Create, retrieve, update, and search contacts
- **🏢 Company Management**: Full company lifecycle management
- **💼 Opportunity Tracking**: Complete sales pipeline management
- **📝 Activity Management**: Unified timeline view with filtering
- **✅ Task Management**: Create and manage tasks
- **🔗 Relationship Management**: Link entities and analyze connections
- **🔍 Metadata Discovery**: Explore CRM schema and field definitions
- **🔒 Full TypeScript Support**: Type-safe operations with validation

**Total: 29 MCP Tools** providing comprehensive CRM automation capabilities. [See full tool list →](TOOLS.md)

## Understanding MCP Servers

MCP (Model Context Protocol) servers are tools that extend AI assistants like Claude with new capabilities. Once configured, this server allows Claude to:

- 🔍 **Read** your CRM data (contacts, companies, opportunities)
- ✍️ **Create** new records directly from conversations
- 🔄 **Update** existing information
- 🤖 **Automate** CRM workflows through natural language

Think of it as giving Claude direct access to your Twenty CRM, turning it into a powerful CRM assistant.

## Prerequisites

Before installing, ensure you have:

- ✅ **Node.js 18 or higher** - [Download from nodejs.org](https://nodejs.org/)
- ✅ **npm** (included with Node.js)
- ✅ **Git** for cloning the repository
- ✅ **Twenty CRM instance** with API access
- ✅ **Text editor** for configuration files

### Checking Prerequisites

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm is installed
npm --version

# Check git is installed
git --version
```

> **⚠️ Windows Users**: The quick install script requires Git Bash or WSL. See [Windows Installation Guide](#windows-installation-guide) for alternatives.

## 🚀 Quick Start

For experienced users who want to get up and running quickly:

```bash
# Clone, install, configure, and run
git clone https://github.com/jezweb/twenty-mcp.git && \
cd twenty-mcp && \
chmod +x install.sh && \
./install.sh && \
cp .env.example .env && \
echo "Now edit .env with your API key and base URL" && \
nano .env
```

Then configure your IDE using the absolute path shown by the installer.

## Installation

### 🗺️ Installation Overview

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│ 1. Install      │ --> │ 2. Configure │ --> │ 3. Verify    │ --> │ 4. Connect  │
│    - Clone repo │     │    - API key │     │    - Validate│     │    - IDE    │
│    - Build      │     │    - Base URL│     │    - Test    │     │    - Use!   │
└─────────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
     (~3 min)                (~2 min)             (~1 min)            (~2 min)
```

### Choose Your Installation Method

| Method | When to Use | Time | Platform |
|--------|------------|------|----------|
| **🎯 Quick Install** | Recommended for most users | ~2 minutes | Linux/macOS/Git Bash |
| **🔧 Manual Install** | Windows Command Prompt users or custom setup needs | ~5 minutes | All platforms |
| **📦 Windows Guide** | Windows users without Git Bash | ~5 minutes | Windows only |

### Option 1: Quick Install (Recommended)

The installation script automates the entire setup process:

```bash
# Step 1: Clone the repository
git clone https://github.com/jezweb/twenty-mcp.git
cd twenty-mcp

# Step 2: Make install script executable (Linux/macOS only)
chmod +x install.sh

# Step 3: Run the installation
./install.sh
```

The install script will:
- ✅ Check Node.js version (18+ required)
- ✅ Install all dependencies
- ✅ Build the TypeScript project
- ✅ Run tests (if API key is configured)
- ✅ Show your absolute path for IDE configuration
- ✅ Provide next steps

> **📝 Note**: Save the absolute path shown by the installer - you'll need it for IDE configuration!

### Option 2: Manual Installation

Perfect for Windows Command Prompt users or those who prefer manual control:

```bash
# Step 1: Clone the repository
git clone https://github.com/jezweb/twenty-mcp.git
cd twenty-mcp

# Step 2: Install dependencies
npm install

# Step 3: Build the TypeScript project
npm run build

# Step 4: Verify the build succeeded
# Linux/macOS:
ls -la dist/index.js

# Windows:
dir dist\index.js
```

✅ If you see `dist/index.js`, the build succeeded!

### 📍 Finding Your Installation Path (IMPORTANT!)

> **🚨 Critical**: You MUST use the absolute path to `dist/index.js` for IDE configuration. Relative paths will NOT work!

<details>
<summary><b>🐧 Linux/macOS</b></summary>

```bash
# Get your absolute path
pwd
# Example output: /home/username/twenty-mcp

# Your MCP server path will be:
# /home/username/twenty-mcp/dist/index.js
```
</details>

<details>
<summary><b>🪟 Windows</b></summary>

```bash
# Command Prompt
cd
# Example output: C:\Users\username\twenty-mcp
# Your path: C:\Users\username\twenty-mcp\dist\index.js

# PowerShell
Get-Location
# Example output: C:\Users\username\twenty-mcp
# Your path: C:\Users\username\twenty-mcp\dist\index.js

# Git Bash
pwd
# Example output: /c/Users/username/twenty-mcp
# Your path: C:/Users/username/twenty-mcp/dist/index.js
```

⚠️ **Warning**: If your path contains spaces (e.g., "Program Files"), use quotes in your IDE configuration!
</details>

**Your MCP server path will be: `[absolute-path]/dist/index.js`**

### 🧪 Installation Quick Check

Before proceeding to configuration, verify your installation:

```bash
# 1. Check Node modules installed
test -d node_modules && echo "✅ Dependencies installed" || echo "❌ Run: npm install"

# 2. Check build completed
test -f dist/index.js && echo "✅ Build successful" || echo "❌ Run: npm run build"

# 3. Check your path
echo "📍 Your MCP path: $(pwd)/dist/index.js"
```

## Windows Installation Guide

> **🪟 Windows Users**: See our detailed [Windows Installation Guide](WINDOWS_INSTALL.md) for step-by-step instructions with Command Prompt, PowerShell, and Git Bash options.

## Configuration

### Step 1: Get Your Twenty CRM API Key

1. **Log into your Twenty CRM instance**
   - For Twenty Cloud: https://app.twenty.com
   - For self-hosted: Your instance URL

2. **Navigate to Settings**
   - Click on your profile avatar (top right)
   - Select "Settings" from the dropdown

3. **Find API & Webhooks**
   - Look in the "Developers" section
   - Click on "API & Webhooks"

4. **Generate Your API Key**
   - Click "Generate API Key" button
   - **Important**: Copy the key immediately - it won't be shown again!
   - Store it securely (password manager recommended)

### Step 2: Configure Environment Variables

#### Option A: Using .env File (Recommended)

```bash
# Copy the example configuration
cp .env.example .env

# Edit with your favorite editor
nano .env  # or vim, code, notepad, etc.
```

Add your configuration to the `.env` file:

```env
# Your Twenty CRM API Key (from Step 1)
TWENTY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your Twenty instance URL (no trailing slash!)
TWENTY_BASE_URL=https://api.twenty.com
```

**Common Base URLs:**
- Twenty Cloud: `https://api.twenty.com`
- Self-hosted: `https://your-company.twenty.com`
- Local development: `http://localhost:3000`

#### Option B: Using Export Commands

```bash
# Linux/macOS
export TWENTY_API_KEY="your-api-key-here"
export TWENTY_BASE_URL="https://api.twenty.com"

# Windows (Command Prompt)
set TWENTY_API_KEY=your-api-key-here
set TWENTY_BASE_URL=https://api.twenty.com

# Windows (PowerShell)
$env:TWENTY_API_KEY="your-api-key-here"
$env:TWENTY_BASE_URL="https://api.twenty.com"
```

### Step 3: Load Your Configuration

> **📌 Important**: Environment variables must be loaded in your current shell session!

<details>
<summary><b>Understanding .env Files</b></summary>

`.env` files store configuration but don't automatically load into your shell:
- **Linux/macOS**: Must use `source .env` to load variables
- **Windows**: The npm scripts automatically read .env files
- **IDE Configuration**: Usually reads .env files directly

</details>

If using a `.env` file:

```bash
# Linux/macOS - Load variables into current session
source .env

# Verify they're loaded
echo $TWENTY_API_KEY  # Should show your key

# Windows - npm scripts read .env automatically
# No manual loading needed for npm commands
```

## Verification

Before configuring your IDE, verify everything is working:

### 1. Run Configuration Validator

```bash
npm run validate
```

**Expected output when everything is configured:**
```
==================================================
  Twenty MCP Server Configuration Validator
==================================================

[INFO] Checking environment variables...
[SUCCESS] TWENTY_API_KEY is set
[SUCCESS] API key appears to be in JWT format
[SUCCESS] TWENTY_BASE_URL is set: https://api.twenty.com
[SUCCESS] Base URL is valid
[INFO] Checking configuration files...
[SUCCESS] .env file exists
[INFO] Checking project build...
[SUCCESS] Project is built (dist/index.js exists)
[SUCCESS] Dependencies are installed
[INFO] Testing API connection...
[SUCCESS] API connection successful!
[INFO] Connected as: John Doe

==================================================
[SUCCESS] Configuration is valid! 🎉
```

### 2. Test Your Configuration

```bash
# Make sure environment is loaded
source .env  # Linux/macOS only

# Run basic tests
npm test
```

### 3. Optional: Start HTTP Server

```bash
npm start
```

You should see: `Server running on http://localhost:3000`

## IDE Integration

### 📋 Before You Begin - Checklist

- [ ] Installation complete (`dist/index.js` exists)
- [ ] Configuration valid (`npm run validate` passes)
- [ ] Absolute path noted (from installation step)
- [ ] API key and base URL ready

### 🖥️ Claude Desktop

Configure Claude Desktop to use your Twenty MCP server:

#### 1. Find Your Configuration File

| Platform | Location |
|----------|----------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

#### 2. Edit Configuration

Add your Twenty MCP server configuration:

```json
{
  "mcpServers": {
    "twenty-crm": {
      "command": "node",
      "args": ["REPLACE_WITH_YOUR_ABSOLUTE_PATH/dist/index.js"],
      "env": {
        "TWENTY_API_KEY": "REPLACE_WITH_YOUR_API_KEY",
        "TWENTY_BASE_URL": "REPLACE_WITH_YOUR_BASE_URL"
      }
    }
  }
}
```

> **⚠️ Common Mistakes to Avoid:**
> - Using relative paths (e.g., `./dist/index.js`) - won't work!
> - Forgetting to restart Claude Desktop after changes
> - Missing quotes around paths with spaces
> - Using wrong slashes on Windows (use `/` or `\\`)

#### 3. Real Examples

**macOS Example:**
```json
{
  "mcpServers": {
    "twenty-crm": {
      "command": "node",
      "args": ["/Users/johndoe/projects/twenty-mcp/dist/index.js"],
      "env": {
        "TWENTY_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "TWENTY_BASE_URL": "https://api.twenty.com"
      }
    }
  }
}
```

**Windows Example:**
```json
{
  "mcpServers": {
    "twenty-crm": {
      "command": "node",
      "args": ["C:\\Users\\johndoe\\projects\\twenty-mcp\\dist\\index.js"],
      "env": {
        "TWENTY_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "TWENTY_BASE_URL": "https://api.twenty.com"
      }
    }
  }
}
```

#### 4. Verify Connection

1. **Restart Claude Desktop** (required!)
2. Ask Claude: "What MCP tools do you have available?"
3. Test with: "Show me my contacts from Twenty CRM"

### 💻 Other IDE Integrations

<details>
<summary><b>Cursor IDE</b></summary>

1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Navigate to Extensions → MCP Servers
3. Add configuration:
   ```json
   {
     "name": "twenty-crm",
     "command": "node",
     "args": ["/absolute/path/to/twenty-mcp/dist/index.js"],
     "env": {
       "TWENTY_API_KEY": "your-api-key",
       "TWENTY_BASE_URL": "https://your-instance.com"
     }
   }
   ```
4. Restart Cursor
</details>

<details>
<summary><b>Smithery</b></summary>

1. Install Smithery: `npm install -g @smithery/cli`
2. Run: `smithery run` in the twenty-mcp directory
3. Configure credentials when prompted
</details>

<details>
<summary><b>Cline (VS Code)</b></summary>

1. Install Cline extension from VS Code marketplace
2. Add to VS Code settings.json:
   ```json
   {
     "cline.mcpServers": {
       "twenty-crm": {
         "command": "node",
         "args": ["/path/to/twenty-mcp/dist/index.js"],
         "env": {
           "TWENTY_API_KEY": "your-api-key",
           "TWENTY_BASE_URL": "https://your-instance.com"
         }
       }
     }
   }
   ```
</details>

<details>
<summary><b>HTTP Server Mode</b></summary>

For web integrations, run as HTTP server:
```bash
npm start
# Server available at http://localhost:3000/mcp
```

Configure via query parameters:
```
http://localhost:3000/mcp?apiKey=your-key&baseUrl=https://your-instance.com
```
</details>

## Usage

### Basic Commands

Once configured in your IDE, you can ask your AI assistant to:

- **"Show me all contacts in Twenty CRM"**
- **"Create a new company called Acme Corp"**
- **"Find all opportunities in the proposal stage"**
- **"Add a task to follow up with John Doe"**
- **"Show me all activities from last week"**

### Example Conversations

```
You: "Create a new contact for Jane Smith at jane@example.com"
Claude: I'll create a new contact for Jane Smith in your Twenty CRM...

You: "Find all opportunities worth over $10,000"
Claude: Let me search for high-value opportunities in your CRM...

You: "Show me companies without any contacts"
Claude: I'll find orphaned company records in your system...
```

[See full tool documentation →](TOOLS.md)

## Troubleshooting

### 🔧 Quick Diagnostic

First, run the configuration validator:

```bash
npm run validate
```

This will identify most common issues and suggest fixes.

### 🚫 Common Issues & Solutions

#### Installation Issues

<details>
<summary><b>Error: "Node.js version 18+ is required"</b></summary>

**Solution:** Update Node.js
```bash
# Check current version
node --version

# Install Node.js 18+ from https://nodejs.org
# Or use nvm:
nvm install 18
nvm use 18
```
</details>

<details>
<summary><b>Error: "Cannot find module 'dist/index.js'"</b></summary>

**Solution:** Build the project
```bash
npm run build

# Verify build succeeded
ls -la dist/index.js
```
</details>

<details>
<summary><b>Error: "Permission denied" running install.sh</b></summary>

**Solution:** Make script executable
```bash
chmod +x install.sh
./install.sh
```
</details>

#### Configuration Issues

<details>
<summary><b>Error: "TWENTY_API_KEY environment variable is required"</b></summary>

**Solution:** Set your environment variables
```bash
# Option 1: Load from .env file
source .env

# Option 2: Export directly
export TWENTY_API_KEY="your-key-here"
export TWENTY_BASE_URL="https://your-instance.com"
```
</details>

<details>
<summary><b>Error: "401 Unauthorized" or "Authentication failed"</b></summary>

**Solution:** 
1. Verify API key is correct (no extra spaces)
2. Check key hasn't expired
3. Regenerate key in Twenty CRM Settings
4. Ensure you're using the correct base URL
</details>

<details>
<summary><b>Error: "Network error" or "fetch failed"</b></summary>

**Solution:**
1. Check base URL is correct (no trailing slash!)
2. Verify Twenty instance is accessible
3. Check firewall/proxy settings
4. Test with curl:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://your-instance.com/graphql
   ```
</details>

#### IDE Integration Issues

<details>
<summary><b>Claude Desktop doesn't see the MCP server</b></summary>

**Solution:**
1. Verify absolute path is correct:
   ```bash
   # Get the correct path
   cd twenty-mcp && pwd
   ```
2. Check config file location is correct for your OS
3. Ensure JSON syntax is valid (no trailing commas!)
4. **Restart Claude Desktop** (required!)
5. Check Claude's developer console for errors
</details>

<details>
<summary><b>Windows path issues</b></summary>

**Solution:** Use proper Windows paths
```json
// Correct Windows paths:
"args": ["C:\\Users\\name\\twenty-mcp\\dist\\index.js"]
// or
"args": ["C:/Users/name/twenty-mcp/dist/index.js"]

// Incorrect:
"args": ["~/twenty-mcp/dist/index.js"]  // Won't work on Windows
```
</details>

### 🔍 Advanced Debugging

Enable debug logging for more details:

```bash
# Enable all debug output
DEBUG=twenty-mcp:* npm start

# Test specific GraphQL queries
node test-graphql.js
```

### 🆘 Getting Help

If you're still stuck:

1. **Check existing issues**: [GitHub Issues](https://github.com/jezweb/twenty-mcp/issues)
2. **Read test documentation**: [TESTING.md](TESTING.md)
3. **Create a new issue** with:
   - Your OS and Node.js version
   - Complete error message
   - Output from `npm run validate`
   - Steps to reproduce

## Additional Resources

### 📚 Documentation

- [Full Tool Reference](TOOLS.md) - Detailed documentation of all 29 tools
- [Testing Guide](TESTING.md) - How to run and write tests
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project

### 🏗️ Architecture

The Twenty MCP Server is built with:
- **TypeScript** for type safety
- **GraphQL** for Twenty API communication  
- **MCP SDK** for protocol implementation
- **Zod** for runtime validation

[See architecture details →](#architecture)

### 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Setting up development environment
- Running tests
- Submitting pull requests
- Code style guidelines

### 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- [Twenty CRM](https://twenty.com/) for the open-source CRM platform
- [Model Context Protocol](https://modelcontextprotocol.io/) for the integration standard
- [Anthropic](https://anthropic.com/) for Claude and the MCP framework

---

<details>
<summary><b>Architecture Details</b></summary>

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
├── tests/                      # Test suites
├── dist/                       # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
└── README.md
```

### Key Components

- **TwentyClient**: GraphQL client that handles API communication with Twenty CRM
- **MCP Tools**: 29 tools that provide comprehensive CRM functionality to AI assistants
- **Type System**: Comprehensive TypeScript definitions for Twenty's data structures
- **Schema Transformation**: Converts flat tool inputs to Twenty's nested GraphQL schema
</details>

<details>
<summary><b>Development Commands</b></summary>

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Run development HTTP server
npm run dev:http

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run typecheck

# Run all tests
npm test

# Run specific test suites
npm run test:smoke     # Quick tests (no API)
npm run test:full      # Comprehensive tests
```
</details>