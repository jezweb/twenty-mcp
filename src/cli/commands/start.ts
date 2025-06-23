import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { crossPlatformSpawn, killProcess } from '../platform-utils.js';

interface StartOptions {
  port?: string;
  stdio?: boolean;
  verbose?: boolean;
}

export async function startCommand(options: StartOptions) {
  console.log(chalk.bold.green('🚀 Starting Twenty MCP Server'));
  
  // Check if project is built
  const distPath = join(process.cwd(), 'dist');
  if (!existsSync(distPath)) {
    console.log(chalk.yellow('⚠️  Project not built. Building now...'));
    await buildProject();
  }

  // Check configuration
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    console.log(chalk.red('❌ No configuration found. Run "twenty-mcp setup" first.'));
    process.exit(1);
  }

  const mode = options.stdio ? 'stdio' : 'http';
  const port = options.port || '3000';

  console.log(chalk.gray(`Starting server in ${mode} mode...`));
  
  if (options.verbose) {
    process.env.DEBUG = 'twenty-mcp:*';
  }

  // Start the appropriate server
  const serverScript = options.stdio ? 'dist/index.js' : 'dist/http-server.js';
  const serverPath = join(process.cwd(), serverScript);

  if (!existsSync(serverPath)) {
    console.log(chalk.red(`❌ Server file not found: ${serverScript}`));
    console.log(chalk.gray('Try running: npm run build'));
    process.exit(1);
  }

  const args = [serverPath];
  if (!options.stdio) {
    process.env.PORT = port;
  }

  console.log(chalk.cyan(`Starting: node ${serverPath}`));
  if (!options.stdio) {
    console.log(chalk.gray(`HTTP server will be available at: http://localhost:${port}`));
  }
  console.log(chalk.gray('Press Ctrl+C to stop\n'));

  const serverProcess = crossPlatformSpawn('node', args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Stopping server...'));
    killProcess(serverProcess, 'SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n🛑 Stopping server...'));
    killProcess(serverProcess, 'SIGTERM');
  });

  serverProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(chalk.red(`❌ Server exited with code ${code}`));
    } else {
      console.log(chalk.green('✅ Server stopped'));
    }
    process.exit(code || 0);
  });

  serverProcess.on('error', (error) => {
    console.error(chalk.red('❌ Failed to start server:'), error.message);
    process.exit(1);
  });
}

async function buildProject(): Promise<void> {
  return new Promise((resolve, reject) => {
    const buildProcess = crossPlatformSpawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ Build completed'));
        resolve();
      } else {
        console.log(chalk.red('❌ Build failed'));
        reject(new Error(`Build failed with code ${code}`));
      }
    });

    buildProcess.on('error', (error) => {
      console.error(chalk.red('❌ Build error:'), error.message);
      reject(error);
    });
  });
}