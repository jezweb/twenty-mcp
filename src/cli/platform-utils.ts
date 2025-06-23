import { platform } from 'os';
import { spawn, SpawnOptions } from 'child_process';

export function isWindows(): boolean {
  return platform() === 'win32';
}

export function isMacOS(): boolean {
  return platform() === 'darwin';
}

export function isLinux(): boolean {
  return platform() === 'linux';
}

export function getPlatformName(): string {
  const platforms: Record<string, string> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux',
    freebsd: 'FreeBSD',
    openbsd: 'OpenBSD',
    aix: 'AIX',
    sunos: 'SunOS',
  };
  return platforms[platform()] || platform();
}

// Cross-platform spawn wrapper
export function crossPlatformSpawn(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
) {
  // On Windows, we need to handle .cmd files and use shell
  if (isWindows()) {
    // For npm commands on Windows, use npm.cmd
    if (command === 'npm') {
      return spawn('npm.cmd', args, { ...options, shell: true });
    }
    // For node commands, ensure proper execution
    if (command === 'node') {
      return spawn('node.exe', args, options);
    }
    // For other commands, use shell
    return spawn(command, args, { ...options, shell: true });
  }
  
  // Unix-like systems
  return spawn(command, args, options);
}

// Cross-platform signal handling
export function killProcess(process: any, signal: string = 'SIGTERM') {
  if (isWindows()) {
    // Windows doesn't support POSIX signals in the same way
    // Use 'SIGINT' or just kill() without signal
    if (signal === 'SIGTERM' || signal === 'SIGINT') {
      process.kill();
    } else {
      process.kill(signal);
    }
  } else {
    // Unix-like systems support POSIX signals
    process.kill(signal);
  }
}

// Get platform-specific config directory
export function getPlatformConfigDir(): string {
  if (isWindows()) {
    return process.env.APPDATA || process.env.USERPROFILE || process.cwd();
  } else if (isMacOS()) {
    return process.env.HOME + '/Library/Application Support' || process.cwd();
  } else {
    // Linux and other Unix-like
    return process.env.XDG_CONFIG_HOME || process.env.HOME + '/.config' || process.cwd();
  }
}

// Cross-platform executable extension
export function getExecutableExtension(): string {
  return isWindows() ? '.exe' : '';
}

// Cross-platform script extension
export function getScriptExtension(): string {
  return isWindows() ? '.cmd' : '.sh';
}

// Platform-specific path examples for documentation
export function getPlatformPathExamples(): {
  configPath: string;
  installPath: string;
  separator: string;
} {
  if (isWindows()) {
    return {
      configPath: 'C:\\Users\\username\\AppData\\Roaming\\twenty-mcp\\config.json',
      installPath: 'C:\\Users\\username\\twenty-mcp\\dist\\index.js',
      separator: '\\',
    };
  } else if (isMacOS()) {
    return {
      configPath: '/Users/username/Library/Application Support/twenty-mcp/config.json',
      installPath: '/Users/username/twenty-mcp/dist/index.js',
      separator: '/',
    };
  } else {
    return {
      configPath: '/home/username/.config/twenty-mcp/config.json',
      installPath: '/home/username/twenty-mcp/dist/index.js',
      separator: '/',
    };
  }
}

// Check if running in elevated/admin mode
export function isElevated(): boolean {
  if (isWindows()) {
    // On Windows, check if running as admin
    try {
      require('child_process').execSync('net session', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  } else {
    // On Unix-like systems, check if running as root
    return !!(process.getuid && process.getuid() === 0);
  }
}

// Get platform-specific installation instructions
export function getPlatformInstallInstructions(): {
  globalInstall: string[];
  localInstall: string[];
  prerequisites: string[];
} {
  const common = {
    globalInstall: ['npm install -g twenty-mcp-server'],
    localInstall: ['npm install twenty-mcp-server'],
  };

  if (isWindows()) {
    return {
      ...common,
      prerequisites: [
        'Install Node.js 18+ from https://nodejs.org',
        'Open Command Prompt or PowerShell as Administrator (for global install)',
        'Ensure npm is in your PATH',
      ],
    };
  } else if (isMacOS()) {
    return {
      ...common,
      prerequisites: [
        'Install Node.js 18+ from https://nodejs.org or use Homebrew: brew install node',
        'Open Terminal',
        'May need sudo for global install: sudo npm install -g twenty-mcp-server',
      ],
    };
  } else {
    return {
      ...common,
      prerequisites: [
        'Install Node.js 18+ from your package manager or https://nodejs.org',
        'Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm',
        'CentOS/RHEL: sudo yum install nodejs npm',
        'May need sudo for global install: sudo npm install -g twenty-mcp-server',
      ],
    };
  }
}