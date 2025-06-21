#!/bin/bash

# Twenty MCP Server Installation Script
# This script automates the installation and setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main installation function
main() {
    echo "================================================"
    echo "      Twenty MCP Server Installation"
    echo "================================================"
    echo ""

    # Check prerequisites
    log_info "Checking prerequisites..."

    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi

    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm (usually comes with Node.js)"
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node -v | cut -c 2-)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    if [ $NODE_MAJOR -lt 18 ]; then
        log_error "Node.js version 18+ is required. Current version: $NODE_VERSION"
        exit 1
    fi

    log_success "Node.js $NODE_VERSION detected"

    # Install dependencies
    log_info "Installing dependencies..."
    if npm install; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi

    # Build the project
    log_info "Building the project..."
    if npm run build; then
        log_success "Project built successfully"
    else
        log_error "Failed to build project"
        exit 1
    fi

    # Run tests if API key is available
    if [ -n "$TWENTY_API_KEY" ]; then
        log_info "API key detected, running tests..."
        if npm test; then
            log_success "All tests passed"
        else
            log_warning "Some tests failed, but installation is complete"
        fi
    else
        log_warning "TWENTY_API_KEY not set, skipping tests"
    fi

    # Installation complete
    echo ""
    echo "================================================"
    log_success "Installation completed successfully!"
    echo "================================================"
    echo ""

    # Configuration instructions
    log_info "Next steps:"
    echo ""
    echo "1. Get your Twenty CRM API key:"
    echo "   - Log into your Twenty CRM instance"
    echo "   - Go to Settings > API & Webhooks"
    echo "   - Generate a new API key"
    echo ""
    echo "2. Set environment variables:"
    echo "   export TWENTY_API_KEY=\"your-api-key-here\""
    echo "   export TWENTY_BASE_URL=\"https://your-twenty-instance.com\""
    echo ""
    echo "3. Test the installation:"
    echo "   npm test"
    echo ""
    echo "4. Start the server:"
    echo "   npm start"
    echo ""
    
    # Get current path for IDE configuration
    CURRENT_PATH=$(pwd)
    echo "5. Configure your IDE to use this MCP server:"
    echo "   Server path: $CURRENT_PATH/dist/index.js"
    echo "   See README.md for specific IDE configuration examples"
    echo ""
    
    log_info "Installation directory: $CURRENT_PATH"
    log_info "Documentation: README.md"
    log_info "Issues: https://github.com/jezweb/twenty-mcp/issues"
}

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    log_error "Please run this script from the twenty-mcp directory"
    log_info "Usage: cd twenty-mcp && ./install.sh"
    exit 1
fi

# Run main installation
main

echo ""
echo "🎉 Happy CRM automation with Twenty MCP Server!"
echo ""