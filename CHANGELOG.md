# Changelog

All notable changes to Twenty MCP Server will be documented in this file.

## [1.2.0] - 2025-06-24

### 🎉 Added
- **npx Support**: Try Twenty MCP Server instantly without installation!
  - Run `npx twenty-mcp-server setup` to get started immediately
  - No global installation required - perfect for evaluation
  - Configuration automatically persists between npx runs
  - Smart context detection for npx vs global installation
  
### 🚀 Features
- Execution context detection system (npx/global/local)
- Context-aware CLI messaging and headers
- npx-specific welcome messages and onboarding
- Performance tips for first-time npx users
- Clear migration path from npx to global installation
- Optimized package size (114.5 KB) for fast npx downloads

### 📚 Documentation
- README now prominently features npx as the quickest way to try
- Added npx examples throughout documentation
- IDE configuration notes for npx users
- Installation comparison table with npx option

### 🔧 Technical Improvements
- Created `src/cli/utils/execution-context.ts` for context detection
- Created `src/cli/utils/npx-helpers.ts` for npx-specific utilities
- Updated CLI entry point with context awareness
- Enhanced setup wizard with npx-specific guidance
- Smart postinstall script that detects execution context

### 🐛 Bug Fixes
- None in this release

### 💔 Breaking Changes
- None - full backward compatibility maintained

## [1.1.0] - Previous Release

- Initial OAuth 2.1 implementation
- IP address protection features
- Enhanced setup wizard
- Cross-platform compatibility improvements