#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import crypto from 'crypto';
import { isIP } from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SetupConfig {
  authEnabled: boolean;
  requireAuth: boolean;
  clerkPublishableKey?: string;
  clerkSecretKey?: string;
  clerkDomain?: string;
  encryptionSecret?: string;
  twentyApiKey?: string;
  twentyBaseUrl?: string;
  ipProtectionEnabled?: boolean;
  ipAllowlist?: string[];
  trustedProxies?: string[];
  blockUnknownIPs?: boolean;
}

class OAuthSetupCLI {
  private rl: readline.Interface;
  private config: SetupConfig = {
    authEnabled: false,
    requireAuth: false,
    ipProtectionEnabled: false,
    ipAllowlist: [],
    trustedProxies: [],
    blockUnknownIPs: true,
  };

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async confirm(prompt: string, defaultYes: boolean = false): Promise<boolean> {
    const suffix = defaultYes ? '(Y/n)' : '(y/N)';
    const answer = await this.question(`${prompt} ${suffix}: `);
    if (!answer.trim()) {
      return defaultYes;
    }
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  private generateEncryptionSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async validateClerkCredentials(publishableKey: string, secretKey: string): Promise<boolean> {
    try {
      // Basic format validation
      if (!publishableKey.startsWith('pk_')) {
        console.log('❌ Invalid publishable key format (should start with pk_)');
        return false;
      }
      if (!secretKey.startsWith('sk_')) {
        console.log('❌ Invalid secret key format (should start with sk_)');
        return false;
      }

      // Extract domain from publishable key
      const domain = publishableKey.split('pk_test_')[1] || publishableKey.split('pk_live_')[1];
      if (domain) {
        this.config.clerkDomain = domain.replace(/\$$/, '') + '.clerk.accounts.dev';
      }

      console.log('✅ Clerk credentials format validated');
      return true;
    } catch (error) {
      console.log('❌ Error validating Clerk credentials:', error);
      return false;
    }
  }

  private async setupAuth(): Promise<void> {
    console.log('--------------------------------------------------');
    console.log('Step 1 of 5: Enable OAuth Authentication');
    console.log('--------------------------------------------------\n');
    
    console.log('OAuth provides secure, user-specific access to your Twenty CRM.\n');
    console.log('Benefits:');
    console.log('  ✓ Each user has their own secure access');
    console.log('  ✓ No shared API keys');
    console.log('  ✓ Easy user management through Clerk dashboard');
    console.log('  ✓ Industry-standard security (OAuth 2.1)\n');

    const enableAuth = await this.confirm('Enable OAuth authentication?', true);
    this.config.authEnabled = enableAuth;

    if (!enableAuth) {
      console.log('\nℹ️ Authentication disabled - using API key mode only');
      return;
    }

    // Clerk setup
    console.log('\n--------------------------------------------------');
    console.log('Step 2 of 5: Clerk Configuration');
    console.log('--------------------------------------------------\n');
    
    console.log('📋 Get your Clerk credentials:\n');
    console.log('1. Open: https://dashboard.clerk.com/apps');
    console.log('2. Select your app (or create one)');
    console.log('3. Go to "API Keys" in the left sidebar');
    console.log('4. Copy the keys below\n');
    console.log('Need help? Visit: https://clerk.com/docs/quickstart\n');
    
    const publishableKey = await this.question('Publishable Key (starts with pk_test_ or pk_live_):\n> ');
    console.log('\n📝 Example: pk_test_b3V0Z29pbmctbW9zcXVpdG8...\n');
    
    const secretKey = await this.question('Secret Key (starts with sk_test_ or sk_live_):\n> ');

    if (!await this.validateClerkCredentials(publishableKey, secretKey)) {
      throw new Error('Invalid Clerk credentials');
    }

    this.config.clerkPublishableKey = publishableKey;
    this.config.clerkSecretKey = secretKey;

    // Auth requirements
    console.log('\n--------------------------------------------------');
    console.log('Step 3 of 5: Authentication Mode');
    console.log('--------------------------------------------------\n');
    
    console.log('🔑 Understanding Authentication vs CRM Access\n');
    console.log('Two things are needed to use this server:');
    console.log('  1. Twenty API Key (ALWAYS required) - gives access to your CRM data');
    console.log('  2. User Authentication (OPTIONAL) - identifies who is using the server\n');
    console.log('⚠️  Without a valid Twenty API key, connections will be refused.\n');
    
    console.log('How should user authentication work?\n');
    console.log('🔓 FLEXIBLE MODE (Recommended)');
    console.log('   • Users can connect with just their Twenty API key');
    console.log('   • OR login first with OAuth, then use their Twenty API key');
    console.log('   • Best for gradual migration and testing\n');
    
    console.log('🔒 STRICT MODE');
    console.log('   • Users MUST login with OAuth first');
    console.log('   • Then use their Twenty API key for CRM access');
    console.log('   • Maximum security and user management\n');
    
    console.log('Choose authentication mode:');
    console.log('  Enter N or press Enter → FLEXIBLE MODE (direct API key access allowed)');
    console.log('  Enter Y → STRICT MODE (OAuth login required first)\n');
    
    const requireAuth = await this.confirm('Use strict OAuth-only mode?', false);
    this.config.requireAuth = requireAuth;

    // Encryption secret
    console.log('\n--------------------------------------------------');
    console.log('Step 4 of 5: Security Configuration');
    console.log('--------------------------------------------------\n');
    
    console.log('🔐 API Key Encryption\n');
    console.log('User API keys need to be encrypted before storage.');
    console.log('We\'ll generate a secure encryption key for you.\n');
    console.log('This is like setting a master password that protects');
    console.log('all user passwords in a password manager.\n');
    
    const useGeneratedSecret = await this.confirm('Generate secure encryption key?', true);
    
    if (useGeneratedSecret) {
      this.config.encryptionSecret = this.generateEncryptionSecret();
      console.log('✅ Generated new encryption secret');
    } else {
      const customSecret = await this.question('Custom encryption secret (32+ chars): ');
      if (customSecret.length < 32) {
        throw new Error('Encryption secret must be at least 32 characters');
      }
      this.config.encryptionSecret = customSecret;
    }

    console.log('\n✅ OAuth authentication configured successfully!');
  }

  private validateIPOrCIDR(input: string): boolean {
    // Check for CIDR notation
    if (input.includes('/')) {
      const [ip, prefix] = input.split('/');
      const prefixNum = parseInt(prefix, 10);
      
      if (isNaN(prefixNum)) return false;
      
      // Validate IP and prefix range based on IP version
      const ipVersion = isIP(ip);
      if (ipVersion === 4) {
        return prefixNum >= 0 && prefixNum <= 32;
      } else if (ipVersion === 6) {
        return prefixNum >= 0 && prefixNum <= 128;
      }
      return false;
    } else {
      // Single IP address
      return isIP(input) !== 0;
    }
  }

  private async setupIPProtection(): Promise<void> {
    console.log('\\n--------------------------------------------------');
    console.log('Step 6 of 7: IP Address Protection (Optional)');
    console.log('--------------------------------------------------\\n');
    
    console.log('🛡️ Network-Level Security\\n');
    console.log('IP protection adds an extra security layer by restricting');
    console.log('which IP addresses can connect to your server.\\n');
    
    console.log('Use cases:');
    console.log('  • Corporate networks with known IP ranges');
    console.log('  • VPN-only access requirements');
    console.log('  • Additional security without user authentication');
    console.log('  • Prevent unauthorized network access\\n');
    
    const enableIP = await this.confirm('Enable IP address protection?');
    this.config.ipProtectionEnabled = enableIP;
    
    if (!enableIP) {
      console.log('\\nℹ️ IP protection disabled - all IPs allowed');
      return;
    }
    
    // Get IP allowlist
    console.log('\\n📝 Configure IP Allowlist\\n');
    console.log('Enter allowed IP addresses and CIDR blocks (one per line).');
    console.log('Examples:');
    console.log('  • Single IP: 192.168.1.100');
    console.log('  • CIDR range: 192.168.1.0/24');
    console.log('  • IPv6: 2001:db8::/32\\n');
    console.log('Note: 127.0.0.1 (localhost) is always allowed\\n');
    
    const allowedIPs: string[] = [];
    while (true) {
      const ip = await this.question('IP address/CIDR (or press Enter to finish): ');
      if (!ip.trim()) break;
      
      if (this.validateIPOrCIDR(ip.trim())) {
        allowedIPs.push(ip.trim());
        console.log(`✅ Added: ${ip.trim()}`);
      } else {
        console.log(`❌ Invalid format: ${ip.trim()}`);
      }
    }
    
    if (allowedIPs.length === 0) {
      console.log('\\n⚠️  No IPs specified - this will block all non-localhost connections!');
      const proceed = await this.confirm('Continue with empty allowlist?');
      if (!proceed) {
        return this.setupIPProtection();
      }
    }
    
    this.config.ipAllowlist = allowedIPs;
    
    // Trusted proxies setup
    console.log('\\n🔗 Reverse Proxy Configuration\\n');
    console.log('If using a reverse proxy (nginx, CloudFlare, etc.),');
    console.log('specify trusted proxy IPs to read X-Forwarded-For headers.\\n');
    
    const useProxies = await this.confirm('Configure trusted proxies?');
    
    if (useProxies) {
      const proxyIPs: string[] = [];
      while (true) {
        const proxy = await this.question('Trusted proxy IP/CIDR (or press Enter to finish): ');
        if (!proxy.trim()) break;
        
        if (this.validateIPOrCIDR(proxy.trim())) {
          proxyIPs.push(proxy.trim());
          console.log(`✅ Added proxy: ${proxy.trim()}`);
        } else {
          console.log(`❌ Invalid format: ${proxy.trim()}`);
        }
      }
      this.config.trustedProxies = proxyIPs;
    }
    
    // Unknown IP handling
    console.log('\\n🚫 Unknown IP Handling\\n');
    console.log('When client IP cannot be determined:');
    console.log('  • BLOCK (recommended): Deny access for security');
    console.log('  • ALLOW: Permit access but log warnings\\n');
    
    this.config.blockUnknownIPs = await this.confirm('Block connections with unknown IPs?', true);
    
    console.log('\\n✅ IP protection configured successfully!');
  }

  private async setupTwentyApi(): Promise<void> {
    console.log('\n--------------------------------------------------');
    console.log('Step 7 of 7: Default Twenty CRM Connection');
    console.log('--------------------------------------------------\n');
    
    console.log('🏢 Global Twenty API Key (Optional)\n');
    console.log('You can set a default Twenty API key that will be used when:');
    console.log('  • Testing the server');
    console.log('  • Users haven\'t configured their own key yet');
    console.log('  • Running in non-OAuth mode\n');
    
    console.log('Think of this as a "guest account" for Twenty CRM access.\n');
    
    console.log('📋 Get your Twenty API key:');
    console.log('1. Log into Twenty CRM');
    console.log('2. Go to Settings → Developers → API Keys');
    console.log('3. Create or copy an existing API key\n');

    const configureGlobal = await this.confirm('Configure default Twenty API key?');
    
    if (configureGlobal) {
      const apiKey = await this.question('Twenty API Key: ');
      const baseUrl = await this.question('Twenty Base URL (default: https://api.twenty.com): ');
      
      this.config.twentyApiKey = apiKey;
      this.config.twentyBaseUrl = baseUrl || 'https://api.twenty.com';
      
      console.log('\n✅ Global Twenty API configured successfully');
    } else {
      console.log('\nℹ️ Users will configure their own API keys when authenticated');
    }
  }

  private createEnvFile(): void {
    const envPath = join(process.cwd(), '.env');
    const envExamplePath = join(process.cwd(), '.env.example');
    
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
      ['AUTH_ENABLED', this.config.authEnabled.toString()],
      ['REQUIRE_AUTH', this.config.requireAuth.toString()],
      ['AUTH_PROVIDER', this.config.authEnabled ? 'clerk' : undefined],
      ['CLERK_PUBLISHABLE_KEY', this.config.clerkPublishableKey],
      ['CLERK_SECRET_KEY', this.config.clerkSecretKey],
      ['CLERK_DOMAIN', this.config.clerkDomain],
      ['API_KEY_ENCRYPTION_SECRET', this.config.encryptionSecret],
      ['TWENTY_API_KEY', this.config.twentyApiKey],
      ['TWENTY_BASE_URL', this.config.twentyBaseUrl],
      ['MCP_SERVER_URL', 'http://localhost:3000'],
      ['IP_PROTECTION_ENABLED', this.config.ipProtectionEnabled?.toString()],
      ['IP_ALLOWLIST', this.config.ipAllowlist?.join(',')],
      ['TRUSTED_PROXIES', this.config.trustedProxies?.join(',')],
      ['IP_BLOCK_UNKNOWN', this.config.blockUnknownIPs?.toString()],
    ];

    // Add new vars that don't exist
    newVars.forEach(([key, value]) => {
      if (value && !existingVars.has(key)) {
        envContent += `${key}=${value}\n`;
      }
    });

    writeFileSync(envPath, envContent);
    console.log('✅ Environment file created/updated');
  }

  private displaySummary(): void {
    console.log('\n==================================================');
    console.log('        ✅ OAuth Setup Complete!        ');
    console.log('==================================================\n');
    
    console.log('Configuration Summary:');
    console.log(`  • OAuth: ${this.config.authEnabled ? 'Enabled ✓' : 'Disabled ✗'}`);
    
    if (this.config.authEnabled) {
      console.log(`  • Mode: ${this.config.requireAuth ? 'Strict (OAuth only)' : 'Flexible (OAuth + API Key)'} ✓`);
      console.log(`  • Encryption: Secured ✓`);
      console.log(`  • Clerk: Connected ✓`);
    }
    
    if (this.config.twentyApiKey) {
      console.log(`  • Default API Key: Configured ✓`);
    } else {
      console.log(`  • Default API Key: Not configured`);
    }
    
    if (this.config.ipProtectionEnabled) {
      console.log(`  • IP Protection: Enabled (${this.config.ipAllowlist?.length || 0} IPs) ✓`);
    } else {
      console.log(`  • IP Protection: Disabled`);
    }
  }

  private displayNextSteps(): void {
    console.log('\nNext Steps:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Test OAuth: npm run test:oauth');
    console.log('  3. View examples: open examples/oauth-web-example.html');
    
    console.log('\nDocumentation: OAUTH.md');
    console.log('Need help? https://github.com/jezweb/twenty-mcp/issues');
  }

  public async run(): Promise<void> {
    try {
      console.log('\n==================================================');
      console.log('        🔐 Twenty MCP OAuth Setup Wizard         ');
      console.log('==================================================\n');
      console.log('This wizard will help you set up secure authentication for');
      console.log('your Twenty MCP server using OAuth 2.1 with Clerk.\n');
      console.log('What you\'ll need:');
      console.log('  • A Clerk account (free tier available at https://clerk.com)');
      console.log('  • Your Twenty CRM API key (optional)');
      console.log('  • 5 minutes to complete setup\n');
      
      await this.question('Press Enter to continue...');
      console.log('');

      await this.setupAuth();
      await this.setupIPProtection();
      await this.setupTwentyApi();
      
      this.createEnvFile();
      this.displaySummary();
      this.displayNextSteps();

      console.log('');
    } catch (error) {
      console.error('\n❌ Setup failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run the CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new OAuthSetupCLI();
  cli.run().catch(console.error);
}

export { OAuthSetupCLI };