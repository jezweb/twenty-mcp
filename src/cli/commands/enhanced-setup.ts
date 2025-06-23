import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigManager, TwentyMCPConfig } from '../config-manager.js';
import crypto from 'crypto';
import { isIP } from 'node:net';
import { crossPlatformSpawn } from '../platform-utils.js';

interface SetupOptions {
  oauth?: boolean;
  ipProtection?: boolean;
  skipTests?: boolean;
  global?: boolean;
  import?: boolean;
  reset?: boolean;
}

export async function enhancedSetupCommand(options: SetupOptions) {
  console.log(chalk.bold.green('🛠️  Twenty MCP Server Enhanced Setup Wizard'));
  console.log(chalk.gray('Professional configuration for your Twenty MCP Server\n'));

  try {
    const configManager = new ConfigManager(options.global ? undefined : process.cwd());
    let config: TwentyMCPConfig;

    // Handle special modes
    if (options.reset) {
      return await resetConfiguration(configManager);
    }

    if (options.import) {
      return await importExistingConfig(configManager);
    }

    // Load or create configuration
    if (configManager.exists()) {
      console.log(chalk.blue('📋 Existing configuration found'));
      const shouldUpdate = await confirmUpdate();
      if (!shouldUpdate) {
        console.log(chalk.gray('Setup cancelled'));
        return;
      }
      config = configManager.load();
    } else {
      console.log(chalk.blue('🆕 Creating new configuration'));
      config = configManager.load(); // Gets defaults
    }

    // Welcome and overview
    await showWelcome();

    // Step 1: Twenty CRM Configuration
    config = await setupTwentyCRM(config);

    // Step 2: Authentication (optional or if --oauth flag)
    if (options.oauth || await shouldSetupFeature('OAuth 2.1 Authentication', 'Secure multi-user access')) {
      config = await setupAuthentication(config);
    }

    // Step 3: IP Protection (optional or if --ip-protection flag)
    if (options.ipProtection || await shouldSetupFeature('IP Address Protection', 'Network-level access control')) {
      config = await setupIPProtection(config);
    }

    // Step 4: Server Configuration
    config = await setupServerSettings(config);

    // Step 5: User Preferences
    config = await setupUserPreferences(config);

    // Step 6: Save configuration
    await saveConfiguration(configManager, config);

    // Step 7: Test configuration (unless --skip-tests)
    if (!options.skipTests) {
      await testConfiguration(configManager);
    }

    // Step 8: Show completion and next steps
    await showCompletion(config, configManager);

  } catch (error) {
    if (error instanceof Error && error.message === 'SETUP_CANCELLED') {
      console.log(chalk.yellow('\n⚠️  Setup cancelled by user'));
      return;
    }
    console.error(chalk.red('\n❌ Setup failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function confirmUpdate(): Promise<boolean> {
  const { update } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'update',
      message: 'Update existing configuration?',
      default: true,
    },
  ] as any) as any;
  return update;
}

async function showWelcome() {
  console.log(chalk.bold.cyan('\n🎉 Welcome to Twenty MCP Server Setup!'));
  console.log(chalk.gray('\nThis wizard will help you configure your Twenty CRM integration for AI assistants.'));
  console.log(chalk.gray('We\'ll walk through each feature and explain the benefits.\n'));
  
  const { ready } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ready',
      message: 'Ready to begin?',
      default: true,
    },
  ] as any) as any;

  if (!ready) {
    throw new Error('SETUP_CANCELLED');
  }
}

async function shouldSetupFeature(featureName: string, description: string): Promise<boolean> {
  console.log(chalk.bold.blue(`\n🤔 ${featureName}`));
  console.log(chalk.gray(description + '\n'));

  const { enable } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enable',
      message: `Configure ${featureName}?`,
      default: false,
    },
  ] as any) as any;
  return enable;
}

async function setupTwentyCRM(config: TwentyMCPConfig): Promise<TwentyMCPConfig> {
  console.log(chalk.bold.blue('\n📋 Step 1: Twenty CRM Connection'));
  console.log(chalk.gray('Connect your Twenty CRM instance for AI assistant access\n'));
  
  console.log(chalk.yellow('📚 How to get your Twenty API key:'));
  console.log('  1. Open your Twenty CRM instance');
  console.log('  2. Go to Settings → Developers → API Keys');
  console.log('  3. Create a new API key');
  console.log('  4. Copy the key (it won\'t be shown again!)\n');

  const questions = [
    {
      type: 'input',
      name: 'apiKey',
      message: 'Twenty API Key:',
      default: config.twenty.apiKey,
      validate: (input: string) => {
        if (!input.trim()) return 'API key is required';
        if (!input.startsWith('eyJ')) return 'API key should be a JWT token starting with "eyJ"';
        return true;
      },
    },
    {
      type: 'list',
      name: 'baseUrlChoice',
      message: 'Twenty instance type:',
      choices: [
        { name: 'Twenty Cloud (https://api.twenty.com)', value: 'cloud' },
        { name: 'Self-hosted instance', value: 'self' },
        { name: 'Local development (localhost)', value: 'local' },
      ],
      default: config.twenty.baseUrl === 'https://api.twenty.com' ? 'cloud' : 
               config.twenty.baseUrl?.includes('localhost') ? 'local' : 'self',
    },
  ];

  const answers = await inquirer.prompt(questions as any);
  
  let baseUrl = '';
  if (answers.baseUrlChoice === 'cloud') {
    baseUrl = 'https://api.twenty.com';
  } else if (answers.baseUrlChoice === 'local') {
    const { port } = await inquirer.prompt([
      {
        type: 'input',
        name: 'port',
        message: 'Local port:',
        default: '3000',
        validate: (input: string) => {
          const port = parseInt(input, 10);
          return port > 0 && port < 65536 ? true : 'Please enter a valid port number';
        },
      },
    ] as any) as any;
    baseUrl = `http://localhost:${port}`;
  } else {
    const { customUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customUrl',
        message: 'Your Twenty instance URL:',
        default: config.twenty.baseUrl,
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      },
    ] as any) as any;
    baseUrl = customUrl;
  }

  config.twenty.apiKey = answers.apiKey;
  config.twenty.baseUrl = baseUrl;

  console.log(chalk.green('✅ Twenty CRM configured'));
  return config;
}

async function setupAuthentication(config: TwentyMCPConfig): Promise<TwentyMCPConfig> {
  console.log(chalk.bold.blue('\n🔐 Step 2: OAuth 2.1 Authentication'));
  console.log(chalk.gray('Secure, user-specific access to your Twenty CRM\n'));

  console.log(chalk.yellow('🎯 Benefits of OAuth Authentication:'));
  console.log('  ✓ Each user has their own secure access');
  console.log('  ✓ No shared API keys - better security');
  console.log('  ✓ Easy user management via Clerk dashboard');
  console.log('  ✓ Industry-standard OAuth 2.1 protocol');
  console.log('  ✓ API keys encrypted at rest\n');

  const { setupAuth } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupAuth',
      message: 'Enable OAuth authentication?',
      default: config.auth.enabled,
    },
  ] as any) as any;

  if (!setupAuth) {
    config.auth.enabled = false;
    console.log(chalk.gray('OAuth authentication disabled'));
    return config;
  }

  console.log(chalk.yellow('\n📚 Setting up Clerk (Free tier available):'));
  console.log('  1. Visit: https://dashboard.clerk.com/apps');
  console.log('  2. Create an app or select existing');
  console.log('  3. Go to "API Keys" in sidebar');
  console.log('  4. Copy both keys below\n');

  const authQuestions = [
    {
      type: 'input',
      name: 'publishableKey',
      message: 'Clerk Publishable Key (pk_test_... or pk_live_...):',
      default: config.auth.clerkPublishableKey,
      validate: (input: string) => {
        if (!input.startsWith('pk_')) return 'Publishable key should start with "pk_"';
        return true;
      },
    },
    {
      type: 'input',
      name: 'secretKey',
      message: 'Clerk Secret Key (sk_test_... or sk_live_...):',
      default: config.auth.clerkSecretKey,
      validate: (input: string) => {
        if (!input.startsWith('sk_')) return 'Secret key should start with "sk_"';
        return true;
      },
    },
    {
      type: 'list',
      name: 'authMode',
      message: 'Authentication mode:',
      choices: [
        { 
          name: 'Flexible - Allow both OAuth and direct API key access', 
          value: 'flexible',
          short: 'Flexible'
        },
        { 
          name: 'Strict - Require OAuth login before API key access', 
          value: 'strict',
          short: 'Strict'
        },
      ],
      default: config.auth.requireAuth ? 'strict' : 'flexible',
    },
  ];

  const authAnswers = await inquirer.prompt(authQuestions as any);

  config.auth.enabled = true;
  config.auth.clerkPublishableKey = authAnswers.publishableKey;
  config.auth.clerkSecretKey = authAnswers.secretKey;
  config.auth.requireAuth = authAnswers.authMode === 'strict';
  config.auth.provider = 'clerk';

  // Generate encryption secret if not exists
  if (!config.auth.encryptionSecret) {
    config.auth.encryptionSecret = crypto.randomBytes(32).toString('hex');
  }

  // Extract domain from publishable key
  const domain = authAnswers.publishableKey.split('pk_test_')[1] || authAnswers.publishableKey.split('pk_live_')[1];
  if (domain) {
    config.auth.clerkDomain = domain.replace(/\$$/, '') + '.clerk.accounts.dev';
  }

  console.log(chalk.green('✅ OAuth authentication configured'));
  return config;
}

async function setupIPProtection(config: TwentyMCPConfig): Promise<TwentyMCPConfig> {
  console.log(chalk.bold.blue('\n🛡️  Step 3: IP Address Protection'));
  console.log(chalk.gray('Network-level security for your MCP server\n'));

  console.log(chalk.yellow('🎯 Benefits of IP Protection:'));
  console.log('  ✓ Restrict access to known networks');
  console.log('  ✓ Block unauthorized connections');
  console.log('  ✓ Corporate network security');
  console.log('  ✓ VPN-only access control\n');

  const { enableIP } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableIP',
      message: 'Enable IP address protection?',
      default: config.ipProtection.enabled,
    },
  ] as any) as any;

  if (!enableIP) {
    config.ipProtection.enabled = false;
    console.log(chalk.gray('IP protection disabled'));
    return config;
  }

  console.log(chalk.yellow('\n📋 IP Configuration Examples:'));
  console.log('  • Single IP: 192.168.1.100');
  console.log('  • CIDR range: 192.168.1.0/24');
  console.log('  • IPv6: 2001:db8::/32');
  console.log('  • Note: 127.0.0.1 (localhost) is always allowed\n');

  const ipQuestions = [
    {
      type: 'input',
      name: 'allowedIPs',
      message: 'Allowed IP addresses/CIDR blocks (comma-separated):',
      default: config.ipProtection.allowlist.join(','),
      filter: (input: string) => input.split(',').map(ip => ip.trim()).filter(ip => ip),
      validate: (input: string[]) => {
        const invalid = input.filter(ip => !validateIPOrCIDR(ip));
        if (invalid.length > 0) {
          return `Invalid IP/CIDR format: ${invalid.join(', ')}`;
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'setupProxies',
      message: 'Configure trusted reverse proxies?',
      default: config.ipProtection.trustedProxies.length > 0,
    },
  ];

  const ipAnswers = await inquirer.prompt(ipQuestions as any);
  
  config.ipProtection.enabled = true;
  config.ipProtection.allowlist = ipAnswers.allowedIPs;

  if (ipAnswers.setupProxies) {
    const { trustedProxies } = await inquirer.prompt([
      {
        type: 'input',
        name: 'trustedProxies',
        message: 'Trusted proxy IPs (comma-separated, optional):',
        default: config.ipProtection.trustedProxies.join(','),
        filter: (input: string) => input ? input.split(',').map(ip => ip.trim()).filter(ip => ip) : [],
        validate: (input: string[]) => {
          if (input.length === 0) return true;
          const invalid = input.filter(ip => !validateIPOrCIDR(ip));
          if (invalid.length > 0) {
            return `Invalid proxy IP format: ${invalid.join(', ')}`;
          }
          return true;
        },
      },
    ] as any) as any;
    config.ipProtection.trustedProxies = trustedProxies;
  }

  const { blockUnknown } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'blockUnknown',
      message: 'Block connections when client IP cannot be determined?',
      default: config.ipProtection.blockUnknownIPs,
    },
  ] as any) as any;
  config.ipProtection.blockUnknownIPs = blockUnknown;

  console.log(chalk.green('✅ IP protection configured'));
  return config;
}

async function setupServerSettings(config: TwentyMCPConfig): Promise<TwentyMCPConfig> {
  console.log(chalk.bold.blue('\n⚙️  Step 4: Server Configuration'));
  console.log(chalk.gray('Configure how your MCP server runs\n'));

  const serverQuestions = [
    {
      type: 'list',
      name: 'mode',
      message: 'Default server mode:',
      choices: [
        { name: 'HTTP Server - Web-based access, easier debugging', value: 'http' },
        { name: 'Stdio - Direct protocol communication', value: 'stdio' },
      ],
      default: config.server.mode,
    },
    {
      type: 'input',
      name: 'port',
      message: 'HTTP server port:',
      default: config.server.port.toString(),
      when: (answers: any) => answers.mode === 'http',
      validate: (input: string) => {
        const port = parseInt(input, 10);
        return port > 0 && port < 65536 ? true : 'Please enter a valid port number';
      },
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Enable verbose logging by default?',
      default: config.server.verbose,
    },
  ];

  const serverAnswers = await inquirer.prompt(serverQuestions as any);
  
  config.server.mode = serverAnswers.mode;
  config.server.port = serverAnswers.port ? parseInt(serverAnswers.port, 10) : config.server.port;
  config.server.verbose = serverAnswers.verbose;

  console.log(chalk.green('✅ Server settings configured'));
  return config;
}

async function setupUserPreferences(config: TwentyMCPConfig): Promise<TwentyMCPConfig> {
  console.log(chalk.bold.blue('\n🎛️  Step 5: User Preferences'));
  console.log(chalk.gray('Customize your Twenty MCP experience\n'));

  const prefQuestions = [
    {
      type: 'confirm',
      name: 'autoStart',
      message: 'Auto-start server when running commands?',
      default: config.preferences.autoStart,
    },
    {
      type: 'confirm',
      name: 'checkUpdates',
      message: 'Check for updates automatically?',
      default: config.preferences.checkUpdates,
    },
    {
      type: 'confirm',
      name: 'telemetry',
      message: 'Send anonymous usage telemetry to help improve the project?',
      default: config.preferences.telemetry,
    },
  ];

  const prefAnswers = await inquirer.prompt(prefQuestions as any);
  
  config.preferences.autoStart = prefAnswers.autoStart;
  config.preferences.checkUpdates = prefAnswers.checkUpdates;
  config.preferences.telemetry = prefAnswers.telemetry;

  console.log(chalk.green('✅ User preferences configured'));
  return config;
}

async function saveConfiguration(configManager: ConfigManager, config: TwentyMCPConfig) {
  console.log(chalk.bold.blue('\n💾 Saving Configuration'));
  
  try {
    configManager.save(config);
    configManager.syncToEnv(config);
    console.log(chalk.green('✅ Configuration saved successfully'));
    console.log(chalk.gray(`  Config: ${configManager.getConfigPath()}`));
    console.log(chalk.gray(`  Environment: ${configManager.getEnvPath()}`));
  } catch (error) {
    throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : error}`);
  }
}

async function testConfiguration(configManager: ConfigManager) {
  console.log(chalk.bold.blue('\n🧪 Testing Configuration'));
  
  // Load environment variables
  configManager.loadEnv();

  return new Promise<void>((resolve) => {
    const testProcess = crossPlatformSpawn('npm', ['run', 'validate'], {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    let output = '';
    testProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr?.on('data', (data) => {
      output += data.toString();
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ Configuration test passed'));
      } else {
        console.log(chalk.yellow('⚠️  Configuration test had issues, but setup completed'));
        console.log(chalk.gray('Run "twenty-mcp test" for detailed diagnostics'));
      }
      resolve();
    });

    testProcess.on('error', (error) => {
      console.log(chalk.yellow('⚠️  Could not run configuration test'));
      resolve();
    });
  });
}

async function showCompletion(config: TwentyMCPConfig, configManager: ConfigManager) {
  console.log(chalk.bold.green('\n🎉 Setup Complete!'));
  console.log(chalk.gray('Your Twenty MCP Server is professionally configured\n'));

  // Configuration summary
  console.log(chalk.bold.yellow('📋 Configuration Summary:'));
  console.log(`  Twenty CRM: ${chalk.green('✓')} ${config.twenty.baseUrl}`);
  console.log(`  OAuth Auth: ${config.auth.enabled ? chalk.green('✓ Enabled') : chalk.gray('✗ Disabled')}`);
  console.log(`  IP Protection: ${config.ipProtection.enabled ? chalk.green('✓ Enabled') : chalk.gray('✗ Disabled')}`);
  console.log(`  Server Mode: ${chalk.blue(config.server.mode.toUpperCase())}`);
  console.log(`  Port: ${chalk.blue(config.server.port)}\n`);

  // Next steps
  console.log(chalk.bold.yellow('🚀 Next Steps:'));
  console.log(chalk.cyan('  1. twenty-mcp test') + chalk.gray('     - Test your configuration'));
  console.log(chalk.cyan('  2. twenty-mcp start') + chalk.gray('    - Start the server'));
  console.log(chalk.cyan('  3. twenty-mcp status') + chalk.gray('   - Check server status\n'));

  // IDE integration
  console.log(chalk.bold.yellow('💻 IDE Integration:'));
  console.log(chalk.gray('  Use this path in your IDE configuration:'));
  console.log(chalk.cyan(`  ${process.cwd()}/dist/index.js\n`));

  // Additional resources
  console.log(chalk.bold.yellow('📚 Resources:'));
  console.log(chalk.gray('  • Configuration file: ') + chalk.cyan(configManager.getConfigPath()));
  console.log(chalk.gray('  • Environment file: ') + chalk.cyan(configManager.getEnvPath()));
  console.log(chalk.gray('  • Documentation: README.md'));
  console.log(chalk.gray('  • Tool reference: TOOLS.md\n'));

  if (config.auth.enabled) {
    console.log(chalk.bold.yellow('🔐 OAuth Setup:'));
    console.log(chalk.gray('  • Test OAuth: twenty-mcp test --oauth'));
    console.log(chalk.gray('  • OAuth docs: OAUTH.md\n'));
  }
}

function validateIPOrCIDR(input: string): boolean {
  if (input.includes('/')) {
    const [ip, prefix] = input.split('/');
    const prefixNum = parseInt(prefix, 10);
    
    if (isNaN(prefixNum)) return false;
    
    const ipVersion = isIP(ip);
    if (ipVersion === 4) {
      return prefixNum >= 0 && prefixNum <= 32;
    } else if (ipVersion === 6) {
      return prefixNum >= 0 && prefixNum <= 128;
    }
    return false;
  } else {
    return isIP(input) !== 0;
  }
}

async function resetConfiguration(configManager: ConfigManager) {
  console.log(chalk.bold.red('🔄 Reset Configuration'));
  console.log(chalk.gray('This will reset all settings to defaults\n'));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset all configuration?',
      default: false,
    },
  ] as any) as any;

  if (!confirm) {
    console.log(chalk.gray('Reset cancelled'));
    return;
  }

  configManager.reset();
  console.log(chalk.green('✅ Configuration reset to defaults'));
}

async function importExistingConfig(configManager: ConfigManager) {
  console.log(chalk.bold.blue('📥 Import Existing Configuration'));
  console.log(chalk.gray('Import settings from existing .env file\n'));

  const config = configManager.importFromEnv();
  console.log(chalk.green('✅ Configuration imported from .env file'));
  
  console.log(chalk.yellow('\nImported settings:'));
  if (config.twenty.apiKey) console.log(chalk.gray('  • Twenty API Key'));
  if (config.twenty.baseUrl) console.log(chalk.gray(`  • Base URL: ${config.twenty.baseUrl}`));
  if (config.auth.enabled) console.log(chalk.gray('  • OAuth authentication'));
  if (config.ipProtection.enabled) console.log(chalk.gray('  • IP protection'));
}