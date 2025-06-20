#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🔥 Twenty MCP Server Smoke Test');
console.log('================================');

const results = [];
let passed = 0;
let failed = 0;

// Test 1: Server starts without API key (should fail gracefully)
async function testServerStartup() {
  console.log('\n▶ Test: Server startup without API key');
  
  return new Promise((resolve) => {
    const server = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, TWENTY_API_KEY: undefined },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    server.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    setTimeout(() => {
      server.kill();
      if (output.includes('TWENTY_API_KEY environment variable is required')) {
        console.log('✅ PASSED: Server correctly requires API key');
        passed++;
        results.push({ test: 'Server startup validation', status: 'passed' });
      } else {
        console.log('❌ FAILED: Server did not validate API key');
        failed++;
        results.push({ test: 'Server startup validation', status: 'failed' });
      }
      resolve();
    }, 2000);
  });
}

// Test 2: Build process
async function testBuild() {
  console.log('\n▶ Test: TypeScript build');
  
  return new Promise((resolve) => {
    const build = spawn('npm', ['run', 'build'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    build.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PASSED: Build completed successfully');
        passed++;
        results.push({ test: 'TypeScript build', status: 'passed' });
      } else {
        console.log('❌ FAILED: Build failed');
        failed++;
        results.push({ test: 'TypeScript build', status: 'failed' });
      }
      resolve();
    });
  });
}

// Test 3: Check required files exist
async function testFileStructure() {
  console.log('\n▶ Test: File structure');
  
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'src/index.ts',
    'src/client/twenty-client.ts',
    'src/tools/index.ts',
    'src/tools/opportunities.ts',
    'src/types/twenty.ts',
    'src/types/opportunities.ts'
  ];
  
  const fs = await import('fs');
  let allExist = true;
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.log(`❌ Missing: ${file}`);
      allExist = false;
    }
  }
  
  if (allExist) {
    console.log('✅ PASSED: All required files exist');
    passed++;
    results.push({ test: 'File structure', status: 'passed' });
  } else {
    console.log('❌ FAILED: Some files are missing');
    failed++;
    results.push({ test: 'File structure', status: 'failed' });
  }
}

// Run all tests
async function runSmokeTests() {
  const startTime = Date.now();
  
  await testBuild();
  await testServerStartup();
  await testFileStructure();
  
  const duration = Date.now() - startTime;
  
  // Generate summary
  console.log('\n📊 Smoke Test Summary');
  console.log('====================');
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${duration}ms`);
  
  // Save results
  const summary = {
    timestamp: new Date().toISOString(),
    duration,
    total: passed + failed,
    passed,
    failed,
    results
  };
  
  writeFileSync('test-results/smoke-test-results.json', JSON.stringify(summary, null, 2));
  
  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

runSmokeTests().catch(console.error);