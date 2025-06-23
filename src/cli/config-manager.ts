import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { getPlatformConfigDir } from './platform-utils.js';

export interface TwentyMCPConfig {
  version: string;
  installation: {
    installPath: string;
    installedAt: string;
    lastUpdated?: string;
  };
  twenty: {
    apiKey?: string;
    baseUrl?: string;
  };
  auth: {
    enabled: boolean;
    requireAuth: boolean;
    provider?: 'clerk';
    clerkPublishableKey?: string;
    clerkSecretKey?: string;
    clerkDomain?: string;
    encryptionSecret?: string;
  };
  ipProtection: {
    enabled: boolean;
    allowlist: string[];
    trustedProxies: string[];
    blockUnknownIPs: boolean;
  };
  server: {
    port: number;
    mode: 'stdio' | 'http';
    verbose: boolean;
  };
  preferences: {
    autoStart: boolean;
    checkUpdates: boolean;
    telemetry: boolean;
  };
}

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private envPath: string;

  constructor(projectPath?: string) {
    if (projectPath) {
      // Local project configuration
      this.configDir = projectPath;
      this.configPath = join(projectPath, '.twenty-mcp.json');
      this.envPath = join(projectPath, '.env');
    } else {
      // Global user configuration - platform-specific
      const platformConfigDir = getPlatformConfigDir();
      this.configDir = join(platformConfigDir, 'twenty-mcp');
      this.configPath = join(this.configDir, 'config.json');
      this.envPath = join(this.configDir, '.env');
    }
  }

  private ensureConfigDir(): void {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
  }

  private getDefaultConfig(): TwentyMCPConfig {
    return {
      version: '1.1.0',
      installation: {
        installPath: process.cwd(),
        installedAt: new Date().toISOString(),
      },
      twenty: {},
      auth: {
        enabled: false,
        requireAuth: false,
      },
      ipProtection: {
        enabled: false,
        allowlist: ['127.0.0.1'],
        trustedProxies: [],
        blockUnknownIPs: true,
      },
      server: {
        port: 3000,
        mode: 'http',
        verbose: false,
      },
      preferences: {
        autoStart: false,
        checkUpdates: true,
        telemetry: false,
      },
    };
  }

  public load(): TwentyMCPConfig {
    if (!existsSync(this.configPath)) {
      return this.getDefaultConfig();
    }

    try {
      const configData = readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData) as Partial<TwentyMCPConfig>;
      
      // Merge with defaults to ensure all fields exist
      const defaultConfig = this.getDefaultConfig();
      return this.mergeConfigs(defaultConfig, config);
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Invalid config file, using defaults'));
      return this.getDefaultConfig();
    }
  }

  private mergeConfigs(defaultConfig: TwentyMCPConfig, userConfig: Partial<TwentyMCPConfig>): TwentyMCPConfig {
    return {
      version: userConfig.version || defaultConfig.version,
      installation: {
        ...defaultConfig.installation,
        ...userConfig.installation,
      },
      twenty: {
        ...defaultConfig.twenty,
        ...userConfig.twenty,
      },
      auth: {
        ...defaultConfig.auth,
        ...userConfig.auth,
      },
      ipProtection: {
        ...defaultConfig.ipProtection,
        ...userConfig.ipProtection,
      },
      server: {
        ...defaultConfig.server,
        ...userConfig.server,
      },
      preferences: {
        ...defaultConfig.preferences,
        ...userConfig.preferences,
      },
    };
  }

  public save(config: TwentyMCPConfig): void {
    this.ensureConfigDir();
    
    // Update last updated timestamp
    config.installation.lastUpdated = new Date().toISOString();
    
    try {
      const configData = JSON.stringify(config, null, 2);
      writeFileSync(this.configPath, configData, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save config: ${error instanceof Error ? error.message : error}`);
    }
  }

  public updateTwentyConfig(apiKey: string, baseUrl: string): void {
    const config = this.load();
    config.twenty.apiKey = apiKey;
    config.twenty.baseUrl = baseUrl;
    this.save(config);
    this.syncToEnv(config);
  }

  public updateAuthConfig(authConfig: Partial<TwentyMCPConfig['auth']>): void {
    const config = this.load();
    config.auth = { ...config.auth, ...authConfig };
    this.save(config);
    this.syncToEnv(config);
  }

  public updateIPProtectionConfig(ipConfig: Partial<TwentyMCPConfig['ipProtection']>): void {
    const config = this.load();
    config.ipProtection = { ...config.ipProtection, ...ipConfig };
    this.save(config);
    this.syncToEnv(config);
  }

  public updateServerConfig(serverConfig: Partial<TwentyMCPConfig['server']>): void {
    const config = this.load();
    config.server = { ...config.server, ...serverConfig };
    this.save(config);
  }

  public updatePreferences(preferences: Partial<TwentyMCPConfig['preferences']>): void {
    const config = this.load();
    config.preferences = { ...config.preferences, ...preferences };
    this.save(config);
  }

  // Sync configuration to .env file for backward compatibility
  public syncToEnv(config?: TwentyMCPConfig): void {
    const configData = config || this.load();
    
    const envVars = new Map<string, string>();

    // Twenty CRM configuration
    if (configData.twenty.apiKey) {
      envVars.set('TWENTY_API_KEY', configData.twenty.apiKey);
    }
    if (configData.twenty.baseUrl) {
      envVars.set('TWENTY_BASE_URL', configData.twenty.baseUrl);
    }

    // Auth configuration
    envVars.set('AUTH_ENABLED', configData.auth.enabled.toString());
    envVars.set('REQUIRE_AUTH', configData.auth.requireAuth.toString());
    
    if (configData.auth.provider) {
      envVars.set('AUTH_PROVIDER', configData.auth.provider);
    }
    if (configData.auth.clerkPublishableKey) {
      envVars.set('CLERK_PUBLISHABLE_KEY', configData.auth.clerkPublishableKey);
    }
    if (configData.auth.clerkSecretKey) {
      envVars.set('CLERK_SECRET_KEY', configData.auth.clerkSecretKey);
    }
    if (configData.auth.clerkDomain) {
      envVars.set('CLERK_DOMAIN', configData.auth.clerkDomain);
    }
    if (configData.auth.encryptionSecret) {
      envVars.set('API_KEY_ENCRYPTION_SECRET', configData.auth.encryptionSecret);
    }

    // IP Protection configuration
    envVars.set('IP_PROTECTION_ENABLED', configData.ipProtection.enabled.toString());
    if (configData.ipProtection.allowlist.length > 0) {
      envVars.set('IP_ALLOWLIST', configData.ipProtection.allowlist.join(','));
    }
    if (configData.ipProtection.trustedProxies.length > 0) {
      envVars.set('TRUSTED_PROXIES', configData.ipProtection.trustedProxies.join(','));
    }
    envVars.set('IP_BLOCK_UNKNOWN', configData.ipProtection.blockUnknownIPs.toString());

    // Server configuration
    envVars.set('MCP_SERVER_URL', `http://localhost:${configData.server.port}`);

    // Write to .env file
    let envContent = '';
    envVars.forEach((value, key) => {
      envContent += `${key}=${value}\n`;
    });

    try {
      writeFileSync(this.envPath, envContent, 'utf8');
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not write .env file'));
    }
  }

  // Load environment variables into current process
  public loadEnv(): void {
    if (!existsSync(this.envPath)) {
      return;
    }

    try {
      const envContent = readFileSync(this.envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([A-Z_]+)=(.*)$/);
        if (match) {
          process.env[match[1]] = match[2];
        }
      });
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not load .env file'));
    }
  }

  public getConfigPath(): string {
    return this.configPath;
  }

  public getEnvPath(): string {
    return this.envPath;
  }

  public exists(): boolean {
    return existsSync(this.configPath);
  }

  public reset(): void {
    const defaultConfig = this.getDefaultConfig();
    this.save(defaultConfig);
    this.syncToEnv(defaultConfig);
  }

  // Import from existing .env file
  public importFromEnv(): TwentyMCPConfig {
    const config = this.getDefaultConfig();
    
    if (!existsSync(this.envPath)) {
      return config;
    }

    try {
      const envContent = readFileSync(this.envPath, 'utf8');
      const envVars = new Map<string, string>();
      
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([A-Z_]+)=(.*)$/);
        if (match) {
          envVars.set(match[1], match[2]);
        }
      });

      // Import Twenty configuration
      if (envVars.has('TWENTY_API_KEY')) {
        config.twenty.apiKey = envVars.get('TWENTY_API_KEY');
      }
      if (envVars.has('TWENTY_BASE_URL')) {
        config.twenty.baseUrl = envVars.get('TWENTY_BASE_URL');
      }

      // Import auth configuration
      if (envVars.has('AUTH_ENABLED')) {
        config.auth.enabled = envVars.get('AUTH_ENABLED') === 'true';
      }
      if (envVars.has('REQUIRE_AUTH')) {
        config.auth.requireAuth = envVars.get('REQUIRE_AUTH') === 'true';
      }
      if (envVars.has('CLERK_PUBLISHABLE_KEY')) {
        config.auth.clerkPublishableKey = envVars.get('CLERK_PUBLISHABLE_KEY');
      }
      if (envVars.has('CLERK_SECRET_KEY')) {
        config.auth.clerkSecretKey = envVars.get('CLERK_SECRET_KEY');
      }

      // Import IP protection configuration
      if (envVars.has('IP_PROTECTION_ENABLED')) {
        config.ipProtection.enabled = envVars.get('IP_PROTECTION_ENABLED') === 'true';
      }
      if (envVars.has('IP_ALLOWLIST')) {
        const allowlist = envVars.get('IP_ALLOWLIST');
        if (allowlist) {
          config.ipProtection.allowlist = allowlist.split(',').map(ip => ip.trim());
        }
      }

      this.save(config);
      return config;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not import from .env file'));
      return config;
    }
  }
}