#!/usr/bin/env node

/**
 * Twenty MCP Server Configuration Validator
 * This script helps users troubleshoot their configuration
 */

import { GraphQLClient } from 'graphql-request';
import fs from 'fs';
import path from 'path';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m'
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function logSuccess(message) { log(colors.green, 'SUCCESS', message); }
function logError(message) { log(colors.red, 'ERROR', message); }
function logWarning(message) { log(colors.yellow, 'WARNING', message); }
function logInfo(message) { log(colors.blue, 'INFO', message); }

async function validateConfiguration() {
  console.log('='.repeat(50));
  console.log('  Twenty MCP Server Configuration Validator');
  console.log('='.repeat(50));
  console.log('');

  let hasErrors = false;

  // Check environment variables
  logInfo('Checking environment variables...');
  
  const apiKey = process.env.TWENTY_API_KEY;
  const baseUrl = process.env.TWENTY_BASE_URL;
  const authEnabled = process.env.AUTH_ENABLED === 'true';

  if (!apiKey) {
    logError('TWENTY_API_KEY environment variable is not set');
    logInfo('Please set it with: export TWENTY_API_KEY="your-api-key"');
    hasErrors = true;
  } else {
    logSuccess('TWENTY_API_KEY is set');
    
    // Validate API key format (JWT-like)
    if (apiKey.startsWith('eyJ')) {
      logSuccess('API key appears to be in JWT format');
    } else {
      logWarning('API key does not appear to be in JWT format');
    }
  }

  if (!baseUrl) {
    logError('TWENTY_BASE_URL environment variable is not set');
    logInfo('Please set it with: export TWENTY_BASE_URL="https://your-instance.com"');
    hasErrors = true;
  } else {
    logSuccess('TWENTY_BASE_URL is set: ' + baseUrl);
    
    // Validate URL format
    try {
      new URL(baseUrl);
      logSuccess('Base URL is valid');
    } catch (error) {
      logError('Base URL is not valid: ' + error.message);
      hasErrors = true;
    }
  }
  
  // Check auth configuration if enabled
  if (authEnabled) {
    logInfo('Checking OAuth authentication configuration...');
    
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
    const clerkDomain = process.env.CLERK_DOMAIN;
    const encryptionSecret = process.env.API_KEY_ENCRYPTION_SECRET;
    
    if (!clerkSecretKey) {
      logError('CLERK_SECRET_KEY is required when AUTH_ENABLED=true');
      hasErrors = true;
    } else if (!clerkSecretKey.startsWith('sk_')) {
      logWarning('CLERK_SECRET_KEY should start with "sk_"');
    } else {
      logSuccess('CLERK_SECRET_KEY is set');
    }
    
    if (!clerkPublishableKey) {
      logWarning('CLERK_PUBLISHABLE_KEY is not set (optional but recommended)');
    } else if (!clerkPublishableKey.startsWith('pk_')) {
      logWarning('CLERK_PUBLISHABLE_KEY should start with "pk_"');
    } else {
      logSuccess('CLERK_PUBLISHABLE_KEY is set');
    }
    
    if (!clerkDomain) {
      logError('CLERK_DOMAIN is required when AUTH_ENABLED=true');
      hasErrors = true;
    } else {
      logSuccess(`CLERK_DOMAIN is set: ${clerkDomain}`);
    }
    
    if (!encryptionSecret) {
      logError('API_KEY_ENCRYPTION_SECRET is required when AUTH_ENABLED=true');
      logInfo('Generate one with: openssl rand -hex 32');
      hasErrors = true;
    } else if (encryptionSecret.length < 32) {
      logWarning('API_KEY_ENCRYPTION_SECRET should be at least 32 characters');
    } else {
      logSuccess('API_KEY_ENCRYPTION_SECRET is set');
    }
    
    const serverUrl = process.env.MCP_SERVER_URL;
    if (!serverUrl) {
      logWarning('MCP_SERVER_URL is not set (defaults to http://localhost:3000)');
    } else {
      logSuccess(`MCP_SERVER_URL is set: ${serverUrl}`);
    }
  }

  // Check if .env file exists
  logInfo('Checking configuration files...');
  
  if (fs.existsSync('.env')) {
    logSuccess('.env file exists');
  } else {
    logWarning('.env file not found (using environment variables directly)');
    if (fs.existsSync('.env.example')) {
      logInfo('Tip: Copy .env.example to .env and fill in your values');
    }
  }

  // Check if project is built
  logInfo('Checking project build...');
  
  if (fs.existsSync('dist/index.js')) {
    logSuccess('Project is built (dist/index.js exists)');
    
    // Get absolute path for IDE configuration
    const absolutePath = path.resolve('dist/index.js');
    console.log(`${colors.cyan}IDE Configuration Path:${colors.reset} ${absolutePath}`);
  } else {
    logError('Project is not built - run "npm run build"');
    hasErrors = true;
  }

  // Check dependencies
  logInfo('Checking dependencies...');
  
  if (fs.existsSync('node_modules')) {
    logSuccess('Dependencies are installed');
  } else {
    logError('Dependencies not installed - run "npm install"');
    hasErrors = true;
  }

  // Test API connection if we have credentials
  if (apiKey && baseUrl && !hasErrors) {
    logInfo('Testing API connection...');
    
    try {
      const client = new GraphQLClient(`${baseUrl}/graphql`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Simple query to test connection
      const query = `
        query TestConnection {
          currentUser {
            id
            firstName
            lastName
          }
        }
      `;

      const result = await client.request(query);
      logSuccess('API connection successful!');
      logInfo(`Connected as: ${result.currentUser.firstName} ${result.currentUser.lastName}`);
      
    } catch (error) {
      logError('API connection failed: ' + error.message);
      
      if (error.message.includes('401')) {
        logError('Authentication failed - check your API key');
      } else if (error.message.includes('fetch')) {
        logError('Network error - check your base URL');
      } else if (error.message.includes('GraphQL')) {
        logWarning('GraphQL error - your instance might use a different schema');
      }
      
      hasErrors = true;
    }
  }

  // Summary
  console.log('');
  console.log('='.repeat(50));
  
  if (hasErrors) {
    logError('Configuration has issues that need to be fixed');
    console.log('');
    logInfo('Common fixes:');
    console.log('  1. Set environment variables: source .env');
    console.log('  2. Install dependencies: npm install');
    console.log('  3. Build project: npm run build');
    console.log('  4. Check API key permissions in Twenty CRM');
    console.log('');
    process.exit(1);
  } else {
    logSuccess('Configuration is valid! 🎉');
    console.log('');
    logInfo('Next steps:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Configure your IDE with the path shown above');
    console.log('  3. Test with: npm test');
    console.log('');
  }
}

// Run validation
validateConfiguration().catch((error) => {
  logError('Validation failed: ' + error.message);
  process.exit(1);
});