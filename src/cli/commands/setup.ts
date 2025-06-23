import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { isIP } from 'node:net';
import { spawn } from 'child_process';

interface SetupOptions {
  oauth?: boolean;
  ipProtection?: boolean;
  skipTests?: boolean;
}

interface SetupConfig {
  twentyApiKey?: string;
  twentyBaseUrl?: string;
  authEnabled: boolean;
  requireAuth: boolean;
  clerkPublishableKey?: string;
  clerkSecretKey?: string;
  clerkDomain?: string;
  encryptionSecret?: string;
  ipProtectionEnabled?: boolean;
  ipAllowlist?: string[];
  trustedProxies?: string[];
  blockUnknownIPs?: boolean;
}

export async function setupCommand(options: SetupOptions) {
  console.log(chalk.bold.green('🛠️  Twenty MCP Server Setup Wizard'));
  console.log(chalk.gray('This wizard will help you configure your Twenty MCP Server\n'));

  try {
    const config: SetupConfig = {
      authEnabled: false,
      requireAuth: false,
      ipProtectionEnabled: false,
      ipAllowlist: [],
      trustedProxies: [],
      blockUnknownIPs: true,
    };

    // Step 1: Twenty CRM Configuration
    await setupTwentyCRM(config);

    // Step 2: Authentication (optional or if --oauth flag)
    if (options.oauth || await shouldSetupAuth()) {
      await setupAuthentication(config);
    }

    // Step 3: IP Protection (optional or if --ip-protection flag)
    if (options.ipProtection || await shouldSetupIPProtection()) {
      await setupIPProtection(config);
    }

    // Step 4: Write configuration
    await writeConfiguration(config);

    // Step 5: Test configuration (unless --skip-tests)
    if (!options.skipTests) {
      await testConfiguration();
    }

    // Step 6: Show next steps
    showNextSteps();

  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function setupTwentyCRM(config: SetupConfig) {
  console.log(chalk.bold.blue('\n📋 Step 1: Configure Twenty CRM Connection'));
  console.log(chalk.gray('Connect to your Twenty CRM instance\n'));

  const questions = [
    {
      type: 'input',
      name: 'apiKey',
      message: 'Twenty API Key:',
      validate: (input: string) => {
        if (!input.trim()) return 'API key is required';
        if (!input.startsWith('eyJ')) return 'API key should be a JWT token starting with "eyJ"';
        return true;
      },
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Twenty Base URL:',
      default: 'https://api.twenty.com',
      validate: (input: string) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
  ];

  const answers = await inquirer.prompt(questions as any);
  config.twentyApiKey = answers.apiKey;
  config.twentyBaseUrl = answers.baseUrl;

  console.log(chalk.green('✅ Twenty CRM configured'));
}

async function shouldSetupAuth(): Promise<boolean> {
  const { enableAuth } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableAuth',
      message: 'Enable OAuth 2.1 authentication? (Recommended for multi-user setups)',
      default: false,
    },
  ]);
  return enableAuth;
}

async function setupAuthentication(config: SetupConfig) {
  console.log(chalk.bold.blue('\n🔐 Step 2: Configure OAuth Authentication'));
  console.log(chalk.gray('Set up secure user authentication with Clerk\n'));

  const questions = [
    {
      type: 'input',
      name: 'publishableKey',
      message: 'Clerk Publishable Key (pk_test_... or pk_live_...):',
      validate: (input: string) => {
        if (!input.startsWith('pk_')) return 'Publishable key should start with "pk_"';
        return true;
      },
    },
    {
      type: 'input',
      name: 'secretKey',
      message: 'Clerk Secret Key (sk_test_... or sk_live_...):',
      validate: (input: string) => {
        if (!input.startsWith('sk_')) return 'Secret key should start with "sk_"';
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'requireAuth',
      message: 'Require OAuth login for all connections? (If false, allows direct API key access)',
      default: false,
    },
  ];

  const answers = await inquirer.prompt(questions as any);
  
  config.authEnabled = true;
  config.clerkPublishableKey = answers.publishableKey;
  config.clerkSecretKey = answers.secretKey;
  config.requireAuth = answers.requireAuth;
  config.encryptionSecret = crypto.randomBytes(32).toString('hex');

  // Extract domain from publishable key
  const domain = answers.publishableKey.split('pk_test_')[1] || answers.publishableKey.split('pk_live_')[1];
  if (domain) {
    config.clerkDomain = domain.replace(/\$$/, '') + '.clerk.accounts.dev';
  }

  console.log(chalk.green('✅ OAuth authentication configured'));
}

async function shouldSetupIPProtection(): Promise<boolean> {
  const { enableIP } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableIP',
      message: 'Enable IP address protection? (Restrict access to specific IPs/networks)',
      default: false,
    },
  ]);
  return enableIP;
}

async function setupIPProtection(config: SetupConfig) {
  console.log(chalk.bold.blue('\n🛡️  Step 3: Configure IP Address Protection'));
  console.log(chalk.gray('Control which IP addresses can access your server\n'));

  const questions = [
    {
      type: 'input',
      name: 'allowedIPs',
      message: 'Allowed IP addresses/CIDR blocks (comma-separated):',
      default: '127.0.0.1,192.168.1.0/24',
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
      type: 'input',
      name: 'trustedProxies',
      message: 'Trusted proxy IPs (comma-separated, optional):',
      default: '',
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
    {
      type: 'confirm',
      name: 'blockUnknown',
      message: 'Block connections when client IP cannot be determined?',
      default: true,
    },
  ];

  const answers = await inquirer.prompt(questions as any);
  
  config.ipProtectionEnabled = true;
  config.ipAllowlist = answers.allowedIPs;
  config.trustedProxies = answers.trustedProxies;
  config.blockUnknownIPs = answers.blockUnknown;

  console.log(chalk.green('✅ IP protection configured'));
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

async function writeConfiguration(config: SetupConfig) {
  console.log(chalk.bold.blue('\n💾 Writing Configuration'));
  
  const envPath = join(process.cwd(), '.env');
  let envContent = '';

  // Read existing .env if it exists
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8');
  }

  // Parse existing env vars to avoid duplicates
  const existingVars = new Set<string>();
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=/);
    if (match) {
      existingVars.add(match[1]);
    }
  });

  const newVars: Array<[string, string | undefined]> = [
    ['TWENTY_API_KEY', config.twentyApiKey],
    ['TWENTY_BASE_URL', config.twentyBaseUrl],
    ['AUTH_ENABLED', config.authEnabled.toString()],
    ['REQUIRE_AUTH', config.requireAuth.toString()],
    ['AUTH_PROVIDER', config.authEnabled ? 'clerk' : undefined],
    ['CLERK_PUBLISHABLE_KEY', config.clerkPublishableKey],
    ['CLERK_SECRET_KEY', config.clerkSecretKey],
    ['CLERK_DOMAIN', config.clerkDomain],
    ['API_KEY_ENCRYPTION_SECRET', config.encryptionSecret],
    ['MCP_SERVER_URL', 'http://localhost:3000'],
    ['IP_PROTECTION_ENABLED', config.ipProtectionEnabled?.toString()],
    ['IP_ALLOWLIST', config.ipAllowlist?.join(',')],
    ['TRUSTED_PROXIES', config.trustedProxies?.join(',')],
    ['IP_BLOCK_UNKNOWN', config.blockUnknownIPs?.toString()],
  ];

  // Add new vars that don't exist
  newVars.forEach(([key, value]) => {
    if (value && !existingVars.has(key)) {
      envContent += `${key}=${value}\n`;
    }
  });

  writeFileSync(envPath, envContent);
  console.log(chalk.green('✅ Configuration saved to .env'));
}

async function testConfiguration() {
  console.log(chalk.bold.blue('\n🧪 Testing Configuration'));
  
  return new Promise<void>((resolve, reject) => {
    const testProcess = spawn('npm', ['run', 'validate'], {
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
        resolve();
      } else {
        console.log(chalk.yellow('⚠️  Configuration test had issues, but setup completed'));
        console.log(chalk.gray('Run "twenty-mcp test" for detailed diagnostics'));
        resolve(); // Don't fail setup for test issues
      }
    });

    testProcess.on('error', (error) => {
      console.log(chalk.yellow('⚠️  Could not run configuration test'));
      resolve(); // Don't fail setup for test issues
    });
  });
}

function showNextSteps() {
  console.log(chalk.bold.green('\n🎉 Setup Complete!'));
  console.log(chalk.gray('Your Twenty MCP Server is ready to use\n'));

  console.log(chalk.bold.yellow('Next Steps:'));
  console.log(chalk.cyan('  1. twenty-mcp test') + chalk.gray('     - Test your configuration'));
  console.log(chalk.cyan('  2. twenty-mcp start') + chalk.gray('    - Start the server'));
  console.log(chalk.cyan('  3. twenty-mcp status') + chalk.gray('   - Check server status'));
  console.log('');

  console.log(chalk.bold.yellow('IDE Integration:'));
  console.log(chalk.gray('  Add this server to your IDE with the path:'));
  const currentPath = process.cwd();
  console.log(chalk.cyan(`  ${currentPath}/dist/index.js`));
  console.log('');

  console.log(chalk.bold.yellow('Documentation:'));
  console.log(chalk.gray('  README.md - Complete setup guide'));
  console.log(chalk.gray('  OAUTH.md - OAuth authentication details'));
  console.log(chalk.gray('  TOOLS.md - Available MCP tools'));
  console.log('');
}