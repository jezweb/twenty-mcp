import { existsSync } from 'fs';
import { join } from 'path';
import { isWindows, isMacOS, isLinux } from '../platform-utils.js';

export interface ExecutionContext {
  type: 'global' | 'npx' | 'local';
  isTemporary: boolean;
  packageCached: boolean;
  npmCacheDir?: string;
  installLocation?: string;
}

export interface NPXEnvironment {
  npmExecPath?: string;
  npmCommand?: string;
  npmConfigCache?: string;
  initCwd?: string;
  npmLifecycleEvent?: string;
}

/**
 * Detects the execution context of the Twenty MCP Server CLI
 * Determines if running via npx, global install, or local development
 */
export function detectExecutionContext(): ExecutionContext {
  const env = extractNPXEnvironment();
  
  // Check if running via npx
  if (isNPXExecution(env)) {
    return {
      type: 'npx',
      isTemporary: true,
      packageCached: checkNPMCache(env),
      npmCacheDir: env.npmConfigCache,
      installLocation: 'temporary'
    };
  }
  
  // Check if globally installed
  if (isGlobalInstallation()) {
    return {
      type: 'global',
      isTemporary: false,
      packageCached: false,
      installLocation: getGlobalInstallPath()
    };
  }
  
  // Local development or project-specific installation
  return {
    type: 'local',
    isTemporary: false,
    packageCached: false,
    installLocation: process.cwd()
  };
}

/**
 * Extract NPX-related environment variables
 */
function extractNPXEnvironment(): NPXEnvironment {
  return {
    npmExecPath: process.env.npm_execpath,
    npmCommand: process.env.npm_command,
    npmConfigCache: process.env.npm_config_cache,
    initCwd: process.env.INIT_CWD,
    npmLifecycleEvent: process.env.npm_lifecycle_event
  };
}

/**
 * Determine if the current execution is via npx
 */
function isNPXExecution(env: NPXEnvironment): boolean {
  // Primary indicators of npx execution
  const indicators = [
    // npm_command is 'exec' when using npx
    env.npmCommand === 'exec',
    
    // npm_execpath contains 'npx' in the path
    env.npmExecPath && env.npmExecPath.includes('npx'),
    
    // Check for npx-specific environment patterns
    env.npmExecPath && env.npmExecPath.includes('_npx'),
    
    // Alternative detection for newer npm versions
    process.env.npm_config_user_config?.includes('npx'),
    
    // Process arguments analysis
    process.argv[1] && process.argv[1].includes('_npx')
  ];
  
  return indicators.some(indicator => indicator === true);
}

/**
 * Check if the package is running from a global installation
 */
function isGlobalInstallation(): boolean {
  const execPath = process.argv[1];
  
  if (!execPath) return false;
  
  // Platform-specific global installation paths
  const globalPaths = getGlobalNodeModulesPaths();
  
  return globalPaths.some(globalPath => execPath.includes(globalPath));
}

/**
 * Get platform-specific global node_modules paths
 */
function getGlobalNodeModulesPaths(): string[] {
  const paths: string[] = [];
  
  if (isWindows()) {
    // Windows global paths
    paths.push(
      'node_modules\\.bin',
      'AppData\\Roaming\\npm\\node_modules',
      'Program Files\\nodejs\\node_modules'
    );
  } else if (isMacOS()) {
    // macOS global paths
    paths.push(
      '/usr/local/lib/node_modules',
      '/usr/local/bin',
      '/opt/homebrew/lib/node_modules',
      '/opt/homebrew/bin'
    );
  } else if (isLinux()) {
    // Linux global paths
    paths.push(
      '/usr/lib/node_modules',
      '/usr/local/lib/node_modules',
      '/usr/bin',
      '/usr/local/bin'
    );
  }
  
  // Node Version Manager paths (cross-platform)
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (homeDir) {
    paths.push(
      join(homeDir, '.nvm'),
      join(homeDir, '.nodenv'),
      join(homeDir, '.node_modules')
    );
  }
  
  return paths;
}

/**
 * Check if the package is cached by npm for faster subsequent runs
 */
function checkNPMCache(env: NPXEnvironment): boolean {
  if (!env.npmConfigCache) {
    return false;
  }
  
  try {
    // Check if twenty-mcp-server is in the npm cache
    const cachePath = join(env.npmConfigCache, '_npx');
    const packageCachePath = join(cachePath, 'twenty-mcp-server');
    
    return existsSync(packageCachePath);
  } catch {
    return false;
  }
}

/**
 * Get the global installation path if available
 */
function getGlobalInstallPath(): string | undefined {
  try {
    const execPath = process.argv[1];
    if (!execPath) return undefined;
    
    // Extract the global installation directory
    const globalPaths = getGlobalNodeModulesPaths();
    const matchingPath = globalPaths.find(path => execPath.includes(path));
    
    return matchingPath ? execPath : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get execution context summary for debugging
 */
export function getExecutionContextSummary(context: ExecutionContext): string {
  const lines = [
    `Execution Type: ${context.type}`,
    `Temporary: ${context.isTemporary}`,
    `Cached: ${context.packageCached}`
  ];
  
  if (context.installLocation) {
    lines.push(`Location: ${context.installLocation}`);
  }
  
  if (context.npmCacheDir) {
    lines.push(`Cache Dir: ${context.npmCacheDir}`);
  }
  
  return lines.join('\n');
}

/**
 * Validate execution context detection
 * Returns true if detection was successful and confident
 */
export function validateExecutionContext(context: ExecutionContext): boolean {
  // Basic validation - we should always be able to determine the type
  if (!['global', 'npx', 'local'].includes(context.type)) {
    return false;
  }
  
  // npx executions should be temporary
  if (context.type === 'npx' && !context.isTemporary) {
    return false;
  }
  
  // global installations should not be temporary
  if (context.type === 'global' && context.isTemporary) {
    return false;
  }
  
  return true;
}

/**
 * Performance-optimized context detection
 * Caches the result to avoid repeated environment analysis
 */
let cachedContext: ExecutionContext | null = null;

export function getExecutionContext(): ExecutionContext {
  if (cachedContext === null) {
    cachedContext = detectExecutionContext();
    
    // Validate the detection result
    if (!validateExecutionContext(cachedContext)) {
      // Fallback to local if detection is uncertain
      cachedContext = {
        type: 'local',
        isTemporary: false,
        packageCached: false,
        installLocation: process.cwd()
      };
    }
  }
  
  return cachedContext;
}