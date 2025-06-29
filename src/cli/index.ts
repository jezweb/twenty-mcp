#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import command handlers
import { enhancedSetupCommand } from './commands/enhanced-setup.js';
import { startCommand } from './commands/start.js';
import { testCommand } from './commands/test.js';
import { statusCommand } from './commands/status.js';

// Import execution context utilities
import { getExecutionContext } from './utils/execution-context.js';
import { 
  showContextHeader, 
  showContextualHelp, 
  showNPXWelcome,
  showNPXPerformanceTip
} from './utils/npx-helpers.js';

const program = new Command();

// Get execution context for context-aware behavior
const executionContext = getExecutionContext();

// Get package version
function getVersion(): string {
  try {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch {
    return '1.0.0';
  }
}

// Context-aware CLI header
function showHeader() {
  showContextHeader(executionContext);
  
  // Show npx-specific welcome message for first-time users
  if (executionContext.type === 'npx') {
    showNPXPerformanceTip(executionContext);
  }
}

// Configure CLI
program
  .name('twenty-mcp')
  .description('Twenty MCP Server - Model Context Protocol for Twenty CRM')
  .version(getVersion())
  .hook('preAction', () => {
    showHeader();
  });

// Setup command - Interactive wizard to configure the server
program
  .command('setup')
  .description('Interactive setup wizard for Twenty MCP Server')
  .option('--oauth', 'Enable OAuth 2.1 authentication setup')
  .option('--ip-protection', 'Enable IP address protection setup')
  .option('--skip-tests', 'Skip running tests after setup')
  .option('--global', 'Use global configuration directory')
  .option('--import', 'Import existing .env configuration')
  .option('--reset', 'Reset configuration to defaults')
  .action(enhancedSetupCommand);

// Start command - Start the MCP server
program
  .command('start')
  .description('Start the Twenty MCP Server')
  .option('-p, --port <port>', 'HTTP server port (default: 3000)', '3000')
  .option('--stdio', 'Use stdio transport instead of HTTP')
  .option('--verbose', 'Enable verbose logging')
  .action(startCommand);

// Test command - Run tests and validation
program
  .command('test')
  .description('Test the Twenty MCP Server configuration and connection')
  .option('--full', 'Run full test suite including API tests')
  .option('--oauth', 'Test OAuth authentication endpoints')
  .option('--smoke', 'Run smoke tests only (no API calls)')
  .action(testCommand);

// Status command - Show server status and configuration
program
  .command('status')
  .description('Show server status and configuration details')
  .option('--json', 'Output status in JSON format')
  .option('--verbose', 'Show detailed configuration')
  .action(statusCommand);

// Help command
program
  .command('help [command]')
  .description('Show help for commands')
  .action((command) => {
    if (command) {
      program.help();
    } else {
      showHeader();
      showContextualHelp(executionContext);
      console.log('');
      program.outputHelp();
      console.log('');
    }
  });

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Unexpected error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n❌ Unhandled promise rejection:'), reason);
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  showHeader();
  
  // Show npx welcome for first-time npx users
  if (executionContext.type === 'npx') {
    showNPXWelcome(executionContext);
  }
  
  showContextualHelp(executionContext);
  console.log('');
  program.outputHelp();
  console.log('');
} else {
  // Parse arguments and run
  program.parse();
}