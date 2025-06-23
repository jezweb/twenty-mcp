import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { crossPlatformSpawn } from '../platform-utils.js';

interface TestOptions {
  full?: boolean;
  oauth?: boolean;
  smoke?: boolean;
}

export async function testCommand(options: TestOptions) {
  console.log(chalk.bold.green('🧪 Testing Twenty MCP Server'));
  console.log(chalk.gray('Running diagnostics and validation tests\n'));

  try {
    // Step 1: Check basic setup
    await checkBasicSetup();

    // Step 2: Run appropriate test suite
    if (options.smoke) {
      await runSmokeTests();
    } else if (options.oauth) {
      await runOAuthTests();
    } else if (options.full) {
      await runFullTestSuite();
    } else {
      await runDefaultTests();
    }

    console.log(chalk.bold.green('\n✅ All tests completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Tests failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function checkBasicSetup() {
  console.log(chalk.bold.blue('📋 Basic Setup Check'));
  
  const checks = [
    {
      name: 'Project built',
      path: join(process.cwd(), 'dist/index.js'),
      required: true,
    },
    {
      name: 'Configuration file',
      path: join(process.cwd(), '.env'),
      required: true,
    },
    {
      name: 'Node modules',
      path: join(process.cwd(), 'node_modules'),
      required: true,
    },
    {
      name: 'Package.json',
      path: join(process.cwd(), 'package.json'),
      required: true,
    },
  ];

  for (const check of checks) {
    if (existsSync(check.path)) {
      console.log(chalk.green(`  ✅ ${check.name}`));
    } else {
      console.log(chalk.red(`  ❌ ${check.name}`));
      if (check.required) {
        throw new Error(`Required file missing: ${check.path}`);
      }
    }
  }

  // Check environment variables
  console.log(chalk.bold.blue('\n🔧 Environment Configuration'));
  await checkEnvironmentConfig();
}

async function checkEnvironmentConfig() {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    console.log(chalk.red('  ❌ .env file not found'));
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

  const requiredVars = ['TWENTY_API_KEY', 'TWENTY_BASE_URL'];
  const optionalVars = ['AUTH_ENABLED', 'IP_PROTECTION_ENABLED'];

  for (const varName of requiredVars) {
    if (envVars.has(varName) && envVars.get(varName)) {
      console.log(chalk.green(`  ✅ ${varName} is set`));
    } else {
      console.log(chalk.red(`  ❌ ${varName} is missing or empty`));
    }
  }

  for (const varName of optionalVars) {
    if (envVars.has(varName)) {
      const value = envVars.get(varName);
      console.log(chalk.blue(`  ℹ️  ${varName} = ${value}`));
    }
  }
}

async function runSmokeTests() {
  console.log(chalk.bold.blue('\n💨 Running Smoke Tests'));
  console.log(chalk.gray('Quick tests without API calls\n'));

  await runNpmScript('test:smoke');
}

async function runOAuthTests() {
  console.log(chalk.bold.blue('\n🔐 Running OAuth Tests'));
  console.log(chalk.gray('Testing OAuth authentication endpoints\n'));

  await runNpmScript('test:oauth');
}

async function runFullTestSuite() {
  console.log(chalk.bold.blue('\n🔬 Running Full Test Suite'));
  console.log(chalk.gray('Comprehensive tests including API calls\n'));

  await runNpmScript('test:full');
}

async function runDefaultTests() {
  console.log(chalk.bold.blue('\n🎯 Running Default Tests'));
  console.log(chalk.gray('Standard validation and basic API tests\n'));

  // First run validation
  try {
    await runNpmScript('validate');
  } catch (error) {
    console.log(chalk.yellow('⚠️  Configuration validation had issues'));
  }

  // Then run basic tests
  await runNpmScript('test');
}

async function runNpmScript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyan(`Running: npm run ${script}`));
    
    const testProcess = crossPlatformSpawn('npm', ['run', script], {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Show real-time output for important messages
      if (text.includes('SUCCESS') || text.includes('ERROR') || text.includes('WARNING')) {
        process.stdout.write(text);
      }
    });

    testProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      // Show errors in real-time
      process.stderr.write(text);
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${script} completed successfully`));
        resolve();
      } else {
        console.log(chalk.red(`❌ ${script} failed with code ${code}`));
        if (errorOutput) {
          console.log(chalk.gray('Error details:'));
          console.log(errorOutput);
        }
        reject(new Error(`Test script ${script} failed`));
      }
    });

    testProcess.on('error', (error) => {
      console.error(chalk.red(`❌ Failed to run ${script}:`), error.message);
      reject(error);
    });
  });
}