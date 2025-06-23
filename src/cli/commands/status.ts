import chalk from 'chalk';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface StatusOptions {
  json?: boolean;
  verbose?: boolean;
}

interface ServerStatus {
  installation: {
    projectBuilt: boolean;
    nodeModulesInstalled: boolean;
    configurationExists: boolean;
    lastBuilt?: string;
  };
  configuration: {
    twentyApiKey: boolean;
    twentyBaseUrl: string | null;
    authEnabled: boolean;
    ipProtectionEnabled: boolean;
    environment: string;
  };
  server: {
    httpServerRunning: boolean;
    port?: number;
    processId?: number;
  };
  validation: {
    configValid: boolean;
    apiConnectionWorking: boolean;
    lastValidated?: string;
  };
}

export async function statusCommand(options: StatusOptions) {
  if (!options.json) {
    console.log(chalk.bold.blue('📊 Twenty MCP Server Status'));
    console.log(chalk.gray('Checking server status and configuration\n'));
  }

  try {
    const status = await gatherStatus(options.verbose || false);

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      displayStatus(status, options.verbose || false);
    }

  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: error instanceof Error ? error.message : error }, null, 2));
    } else {
      console.error(chalk.red('❌ Failed to get status:'), error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}

async function gatherStatus(verbose: boolean): Promise<ServerStatus> {
  const status: ServerStatus = {
    installation: {
      projectBuilt: false,
      nodeModulesInstalled: false,
      configurationExists: false,
    },
    configuration: {
      twentyApiKey: false,
      twentyBaseUrl: null,
      authEnabled: false,
      ipProtectionEnabled: false,
      environment: 'development',
    },
    server: {
      httpServerRunning: false,
    },
    validation: {
      configValid: false,
      apiConnectionWorking: false,
    },
  };

  // Check installation
  await checkInstallation(status);
  
  // Check configuration
  await checkConfiguration(status);
  
  // Check server status
  await checkServerStatus(status);
  
  // Check validation (if verbose)
  if (verbose) {
    await checkValidation(status);
  }

  return status;
}

async function checkInstallation(status: ServerStatus) {
  // Check if project is built
  const distPath = join(process.cwd(), 'dist/index.js');
  status.installation.projectBuilt = existsSync(distPath);
  
  if (status.installation.projectBuilt) {
    const stats = statSync(distPath);
    status.installation.lastBuilt = stats.mtime.toISOString();
  }

  // Check node modules
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  status.installation.nodeModulesInstalled = existsSync(nodeModulesPath);

  // Check configuration file
  const envPath = join(process.cwd(), '.env');
  status.installation.configurationExists = existsSync(envPath);
}

async function checkConfiguration(status: ServerStatus) {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const envContent = readFileSync(envPath, 'utf8');
  const envVars = new Map<string, string>();
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      envVars.set(match[1], match[2]);
    }
  });

  // Check Twenty configuration
  status.configuration.twentyApiKey = envVars.has('TWENTY_API_KEY') && !!envVars.get('TWENTY_API_KEY');
  status.configuration.twentyBaseUrl = envVars.get('TWENTY_BASE_URL') || null;

  // Check auth configuration
  status.configuration.authEnabled = envVars.get('AUTH_ENABLED') === 'true';

  // Check IP protection
  status.configuration.ipProtectionEnabled = envVars.get('IP_PROTECTION_ENABLED') === 'true';

  // Determine environment
  if (envVars.has('NODE_ENV')) {
    status.configuration.environment = envVars.get('NODE_ENV') || 'development';
  }
}

async function checkServerStatus(status: ServerStatus) {
  try {
    // Try to connect to HTTP server on default port
    const response = await checkHttpServer(3000);
    if (response) {
      status.server.httpServerRunning = true;
      status.server.port = 3000;
    }
  } catch {
    // Server not running or not accessible
    status.server.httpServerRunning = false;
  }

  // Try to find running Node.js processes
  try {
    const { stdout } = await execAsync('pgrep -f "twenty-mcp"');
    const pids = stdout.trim().split('\n').filter(pid => pid);
    if (pids.length > 0) {
      status.server.processId = parseInt(pids[0], 10);
    }
  } catch {
    // No process found or command failed
  }
}

async function checkHttpServer(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/health',
      method: 'GET',
      timeout: 2000,
    }, (res: any) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function checkValidation(status: ServerStatus) {
  try {
    // Run validation script
    const { stdout, stderr } = await execAsync('npm run validate');
    status.validation.configValid = !stderr && stdout.includes('SUCCESS');
    status.validation.lastValidated = new Date().toISOString();
    
    // Basic API connection test
    if (status.configuration.twentyApiKey && status.configuration.twentyBaseUrl) {
      status.validation.apiConnectionWorking = await testApiConnection(
        status.configuration.twentyBaseUrl
      );
    }
  } catch {
    status.validation.configValid = false;
    status.validation.apiConnectionWorking = false;
  }
}

async function testApiConnection(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TWENTY_API_KEY}`,
      },
      body: JSON.stringify({
        query: '{ __typename }',
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function displayStatus(status: ServerStatus, verbose: boolean) {
  // Installation Status
  console.log(chalk.bold.yellow('🏗️  Installation:'));
  console.log(`  Project Built: ${status.installation.projectBuilt ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
  console.log(`  Dependencies: ${status.installation.nodeModulesInstalled ? chalk.green('✅ Installed') : chalk.red('❌ Missing')}`);
  console.log(`  Configuration: ${status.installation.configurationExists ? chalk.green('✅ Found') : chalk.red('❌ Missing')}`);
  
  if (verbose && status.installation.lastBuilt) {
    console.log(`  Last Built: ${chalk.gray(new Date(status.installation.lastBuilt).toLocaleString())}`);
  }

  // Configuration Status
  console.log(chalk.bold.yellow('\n⚙️  Configuration:'));
  console.log(`  Twenty API Key: ${status.configuration.twentyApiKey ? chalk.green('✅ Set') : chalk.red('❌ Missing')}`);
  console.log(`  Twenty Base URL: ${status.configuration.twentyBaseUrl ? chalk.green(status.configuration.twentyBaseUrl) : chalk.red('❌ Not set')}`);
  console.log(`  OAuth Auth: ${status.configuration.authEnabled ? chalk.green('✅ Enabled') : chalk.gray('❌ Disabled')}`);
  console.log(`  IP Protection: ${status.configuration.ipProtectionEnabled ? chalk.green('✅ Enabled') : chalk.gray('❌ Disabled')}`);
  console.log(`  Environment: ${chalk.blue(status.configuration.environment)}`);

  // Server Status
  console.log(chalk.bold.yellow('\n🚀 Server:'));
  console.log(`  HTTP Server: ${status.server.httpServerRunning ? chalk.green('✅ Running') : chalk.red('❌ Not running')}`);
  
  if (status.server.port) {
    console.log(`  Port: ${chalk.cyan(status.server.port)}`);
  }
  
  if (status.server.processId) {
    console.log(`  Process ID: ${chalk.gray(status.server.processId)}`);
  }

  // Validation Status (if verbose)
  if (verbose) {
    console.log(chalk.bold.yellow('\n🔍 Validation:'));
    console.log(`  Config Valid: ${status.validation.configValid ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
    console.log(`  API Connection: ${status.validation.apiConnectionWorking ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
    
    if (status.validation.lastValidated) {
      console.log(`  Last Checked: ${chalk.gray(new Date(status.validation.lastValidated).toLocaleString())}`);
    }
  }

  // Overall Status Summary
  console.log(chalk.bold.yellow('\n📋 Summary:'));
  
  const isHealthy = status.installation.projectBuilt && 
                   status.installation.nodeModulesInstalled && 
                   status.installation.configurationExists && 
                   status.configuration.twentyApiKey;

  if (isHealthy) {
    console.log(chalk.green('✅ Server is ready to use'));
    
    if (!status.server.httpServerRunning) {
      console.log(chalk.blue('💡 Run "twenty-mcp start" to start the server'));
    }
  } else {
    console.log(chalk.red('❌ Server needs configuration'));
    console.log(chalk.blue('💡 Run "twenty-mcp setup" to configure'));
  }

  console.log('');
}