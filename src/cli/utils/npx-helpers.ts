import chalk from 'chalk';
import { ExecutionContext } from './execution-context.js';

/**
 * Display npx-specific welcome message for first-time users
 */
export function showNPXWelcome(context: ExecutionContext): void {
  if (context.type !== 'npx') return;
  
  console.log(chalk.bold.cyan('🚀 Welcome to Twenty MCP Server Trial!'));
  console.log(chalk.gray('You\'re trying this tool without installing it globally.\n'));
  
  if (context.packageCached) {
    console.log(chalk.green('✅ Running from npm cache (faster startup)'));
  } else {
    console.log(chalk.yellow('📦 First run - package downloaded successfully'));
  }
  
  console.log(chalk.cyan('\n💡 Key Benefits of npx usage:'));
  console.log(chalk.gray('  • No global installation required'));
  console.log(chalk.gray('  • Always runs the latest version'));
  console.log(chalk.gray('  • Configuration persists between runs'));
  console.log(chalk.gray('  • Perfect for trying before committing\n'));
  
  console.log(chalk.yellow('💫 Like this tool? Install permanently:'));
  console.log(chalk.cyan('   npm install -g twenty-mcp-server'));
  console.log(chalk.gray('   Then use: twenty-mcp [command]\n'));
}

/**
 * Show context-appropriate header based on execution type
 */
export function showContextHeader(context: ExecutionContext): void {
  switch (context.type) {
    case 'npx':
      showNPXHeader(context);
      break;
    case 'global':
      showGlobalHeader();
      break;
    case 'local':
      showLocalHeader();
      break;
  }
}

/**
 * Display npx-specific header
 */
function showNPXHeader(context: ExecutionContext): void {
  console.log(chalk.blue('┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.blue('│') + chalk.bold.yellow('              Twenty MCP Server (via npx)               ') + chalk.blue('│'));
  console.log(chalk.blue('│') + chalk.gray('            Trying temporarily - no installation           ') + chalk.blue('│'));
  console.log(chalk.blue('└─────────────────────────────────────────────────────────────┘'));
  
  if (context.packageCached) {
    console.log(chalk.green('✅ Running from npm cache (faster startup)'));
  } else {
    console.log(chalk.yellow('📦 First run - downloading package...'));
  }
  console.log('');
}

/**
 * Display global installation header
 */
function showGlobalHeader(): void {
  console.log(chalk.blue('┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.blue('│') + chalk.bold.white('                   Twenty MCP Server                    ') + chalk.blue('│'));
  console.log(chalk.blue('│') + chalk.gray('         Model Context Protocol for Twenty CRM          ') + chalk.blue('│'));
  console.log(chalk.blue('└─────────────────────────────────────────────────────────────┘'));
  console.log('');
}

/**
 * Display local development header
 */
function showLocalHeader(): void {
  console.log(chalk.blue('┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.blue('│') + chalk.bold.magenta('           Twenty MCP Server (Development)             ') + chalk.blue('│'));
  console.log(chalk.blue('│') + chalk.gray('         Model Context Protocol for Twenty CRM          ') + chalk.blue('│'));
  console.log(chalk.blue('└─────────────────────────────────────────────────────────────┘'));
  console.log('');
}

/**
 * Show context-appropriate quick start guide
 */
export function showContextualQuickStart(context: ExecutionContext): void {
  console.log(chalk.bold.yellow('🚀 Quick Start:'));
  console.log('');
  
  switch (context.type) {
    case 'npx':
      showNPXQuickStart();
      break;
    case 'global':
      showGlobalQuickStart();
      break;
    case 'local':
      showLocalQuickStart();
      break;
  }
}

/**
 * NPX-specific quick start guide
 */
function showNPXQuickStart(): void {
  console.log('  1. ' + chalk.cyan('npx twenty-mcp-server setup') + '  - Configure (saves globally)');
  console.log('  2. ' + chalk.cyan('npx twenty-mcp-server test') + '   - Test configuration');
  console.log('  3. ' + chalk.cyan('npx twenty-mcp-server start') + '  - Start server');
  console.log('');
  console.log(chalk.yellow('💡 Install globally for easier access:'));
  console.log('    ' + chalk.cyan('npm install -g twenty-mcp-server'));
  console.log('    Then use: ' + chalk.cyan('twenty-mcp [command]'));
}

/**
 * Global installation quick start guide
 */
function showGlobalQuickStart(): void {
  console.log('  1. ' + chalk.cyan('twenty-mcp setup') + '     - Configure your server');
  console.log('  2. ' + chalk.cyan('twenty-mcp test') + '      - Validate configuration');
  console.log('  3. ' + chalk.cyan('twenty-mcp start') + '     - Start the server');
}

/**
 * Local development quick start guide
 */
function showLocalQuickStart(): void {
  console.log('  1. ' + chalk.cyan('npm run build') + '       - Build the project');
  console.log('  2. ' + chalk.cyan('twenty-mcp setup') + '     - Configure your server');
  console.log('  3. ' + chalk.cyan('twenty-mcp start') + '     - Start the server');
  console.log('');
  console.log(chalk.gray('💻 Development mode detected'));
}

/**
 * Show context-appropriate help information
 */
export function showContextualHelp(context: ExecutionContext): void {
  showContextualQuickStart(context);
  
  console.log('');
  console.log(chalk.bold.yellow('📚 Commands:'));
  console.log('');
  
  // Commands are the same across contexts, but examples differ
  const commandPrefix = context.type === 'npx' ? 'npx twenty-mcp-server' : 'twenty-mcp';
  
  console.log(`  ${chalk.cyan(commandPrefix + ' setup')}      - Interactive setup wizard`);
  console.log(`  ${chalk.cyan(commandPrefix + ' start')}      - Start the MCP server`);
  console.log(`  ${chalk.cyan(commandPrefix + ' test')}       - Test configuration and connection`);
  console.log(`  ${chalk.cyan(commandPrefix + ' status')}     - Show server status`);
  console.log(`  ${chalk.cyan(commandPrefix + ' help')}       - Show detailed help`);
  
  console.log('');
  console.log(chalk.bold.yellow('🔗 Resources:'));
  console.log('');
  console.log('  Documentation: ' + chalk.underline('https://github.com/jezweb/twenty-mcp#readme'));
  console.log('  Issues: ' + chalk.underline('https://github.com/jezweb/twenty-mcp/issues'));
  console.log('  Twenty CRM: ' + chalk.underline('https://twenty.com'));
  
  if (context.type === 'npx') {
    console.log('');
    console.log(chalk.yellow('🎯 Running via npx:'));
    console.log('  • Configuration will be saved globally for future npx runs');
    console.log('  • No global installation required');
    console.log('  • Consider installing globally if you use this frequently');
  }
}

/**
 * Show npx-specific completion message
 */
export function showNPXCompletion(): void {
  console.log(chalk.bold.green('🎉 npx Trial Complete!'));
  console.log(chalk.gray('Your configuration has been saved for future npx runs.\n'));
  
  console.log(chalk.bold.yellow('🚀 Next Steps:'));
  console.log(chalk.cyan('  • npx twenty-mcp-server start') + chalk.gray(' - Start using your configured server'));
  console.log(chalk.cyan('  • npm install -g twenty-mcp-server') + chalk.gray(' - Install permanently'));
  console.log(chalk.gray('  • Share with your team - they can try it instantly with npx!\n'));
  
  console.log(chalk.bold.yellow('💫 Benefits of Global Install:'));
  console.log(chalk.gray('  • Faster startup (no download wait)'));
  console.log(chalk.gray('  • Shorter commands (twenty-mcp vs npx twenty-mcp-server)'));
  console.log(chalk.gray('  • Works offline'));
  console.log(chalk.gray('  • Better IDE integration\n'));
}

/**
 * Show configuration persistence explanation for npx users
 */
export function explainNPXConfiguration(): void {
  console.log(chalk.bold.blue('📋 Configuration Note for npx Users:'));
  console.log(chalk.gray('Your settings are saved globally and will persist between npx runs.'));
  console.log(chalk.gray('This means you only need to configure once, even when using npx!\n'));
  
  console.log(chalk.yellow('🔍 Configuration Location:'));
  console.log(chalk.gray('  • Windows: %APPDATA%\\twenty-mcp\\config.json'));
  console.log(chalk.gray('  • macOS: ~/Library/Application Support/twenty-mcp/config.json'));
  console.log(chalk.gray('  • Linux: ~/.config/twenty-mcp/config.json\n'));
}

/**
 * Show migration guidance from npx to global install
 */
export function showMigrationGuidance(): void {
  console.log(chalk.bold.yellow('🔄 Upgrade to Global Installation:'));
  console.log('');
  console.log(chalk.gray('Since you\'ve configured Twenty MCP Server via npx,'));
  console.log(chalk.gray('you can now install it globally for a better experience:'));
  console.log('');
  console.log(chalk.cyan('  npm install -g twenty-mcp-server'));
  console.log('');
  console.log(chalk.gray('Your configuration will be automatically preserved!'));
  console.log('');
  console.log(chalk.bold.green('Benefits after global install:'));
  console.log(chalk.gray('  ✓ Faster startup (no download)'));
  console.log(chalk.gray('  ✓ Shorter commands'));
  console.log(chalk.gray('  ✓ Works offline'));
  console.log(chalk.gray('  ✓ Better performance'));
  console.log('');
}

/**
 * Format execution context for status display
 */
export function formatExecutionContext(context: ExecutionContext): string {
  const parts = [];
  
  parts.push(`Type: ${chalk.cyan(context.type)}`);
  
  if (context.type === 'npx') {
    parts.push(`Cached: ${context.packageCached ? chalk.green('Yes') : chalk.yellow('No')}`);
    if (context.npmCacheDir) {
      parts.push(`Cache: ${chalk.gray(context.npmCacheDir)}`);
    }
  }
  
  if (context.installLocation) {
    parts.push(`Location: ${chalk.gray(context.installLocation)}`);
  }
  
  return parts.join(' | ');
}

/**
 * Get appropriate command examples based on execution context
 */
export function getCommandExamples(context: ExecutionContext): {
  setup: string;
  start: string;
  test: string;
  status: string;
} {
  const prefix = context.type === 'npx' ? 'npx twenty-mcp-server' : 'twenty-mcp';
  
  return {
    setup: `${prefix} setup`,
    start: `${prefix} start`,
    test: `${prefix} test`,
    status: `${prefix} status`
  };
}

/**
 * Show performance tip for npx users
 */
export function showNPXPerformanceTip(context: ExecutionContext): void {
  if (context.type !== 'npx') return;
  
  if (!context.packageCached) {
    console.log(chalk.yellow('💡 Performance Tip:'));
    console.log(chalk.gray('This was your first npx run, so the package was downloaded.'));
    console.log(chalk.gray('Subsequent npx runs will be much faster (cached)!\n'));
  }
}