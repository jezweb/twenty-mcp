# Windows Installation Guide for Twenty MCP Server

This guide provides detailed instructions for Windows users to install and configure the Twenty MCP Server.

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** installed - [Download](https://nodejs.org/)
- ✅ **Git** installed - [Download](https://git-scm.com/download/win)
- ✅ **Twenty CRM account** with API access

## Installation Options

### Option 1: Using Git Bash (Recommended)

Git Bash provides a Linux-like environment on Windows, making it compatible with our install script.

1. **Open Git Bash** (installed with Git for Windows)

2. **Clone and install**:
```bash
# Clone the repository
git clone https://github.com/jezweb/twenty-mcp.git
cd twenty-mcp

# Make install script executable
chmod +x install.sh

# Run installation
./install.sh
```

3. **Note your path**:
```bash
pwd
# Example: /c/Users/YourName/twenty-mcp
# Your server path: C:/Users/YourName/twenty-mcp/dist/index.js
```

### Option 2: Using Command Prompt

If you prefer using Windows Command Prompt:

1. **Open Command Prompt** (cmd.exe)

2. **Clone the repository**:
```cmd
git clone https://github.com/jezweb/twenty-mcp.git
cd twenty-mcp
```

3. **Install and build**:
```cmd
npm install
npm run build
```

4. **Get your path**:
```cmd
echo %cd%
REM Example: C:\Users\YourName\twenty-mcp
REM Your server path: C:\Users\YourName\twenty-mcp\dist\index.js
```

### Option 3: Using PowerShell

For PowerShell users:

1. **Open PowerShell**

2. **Clone and install**:
```powershell
git clone https://github.com/jezweb/twenty-mcp.git
cd twenty-mcp
npm install
npm run build
```

3. **Get your path**:
```powershell
Get-Location
# Example: C:\Users\YourName\twenty-mcp
# Your server path: C:\Users\YourName\twenty-mcp\dist\index.js
```

## Configuration

### Step 1: Create Configuration File

```cmd
copy .env.example .env
```

### Step 2: Edit Configuration

Open `.env` in your text editor (Notepad, VS Code, etc.) and add:

```env
TWENTY_API_KEY=your-api-key-here
TWENTY_BASE_URL=https://api.twenty.com
```

### Step 3: Set Environment Variables (Optional)

If you prefer using system environment variables:

**Command Prompt:**
```cmd
set TWENTY_API_KEY=your-api-key-here
set TWENTY_BASE_URL=https://api.twenty.com
```

**PowerShell:**
```powershell
$env:TWENTY_API_KEY="your-api-key-here"
$env:TWENTY_BASE_URL="https://api.twenty.com"
```

## Common Windows Issues

### Issue: "Permission denied" errors

**Solution**: Run your terminal as Administrator

### Issue: Path contains spaces

**Solution**: Use quotes in configurations:
```json
{
  "args": ["C:/Program Files/twenty-mcp/dist/index.js"]
}
```

### Issue: Backslashes in JSON

**Solution**: Use forward slashes or double backslashes:
- ✅ `C:/Users/Name/twenty-mcp/dist/index.js`
- ✅ `C:\\Users\\Name\\twenty-mcp\\dist\\index.js`
- ❌ `C:\Users\Name\twenty-mcp\dist\index.js`

### Issue: "node" command not found

**Solution**: 
1. Restart your terminal after installing Node.js
2. Or add Node.js to PATH manually

## IDE Configuration for Windows

### Claude Desktop

1. **Find config file**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Example configuration**:
```json
{
  "mcpServers": {
    "twenty-crm": {
      "command": "node",
      "args": ["C:/Users/YourName/twenty-mcp/dist/index.js"],
      "env": {
        "TWENTY_API_KEY": "your-key-here",
        "TWENTY_BASE_URL": "https://api.twenty.com"
      }
    }
  }
}
```

### Cursor IDE

Use forward slashes in the configuration:
```json
{
  "args": ["C:/Users/YourName/twenty-mcp/dist/index.js"]
}
```

## Verification

Test your installation:

```cmd
npm run validate
```

Expected output:
```
[SUCCESS] Configuration is valid! 🎉
```

## Need Help?

- Check the main [README](README.md) for more details
- Run `npm run validate` to diagnose issues
- Report problems at [GitHub Issues](https://github.com/jezweb/twenty-mcp/issues)