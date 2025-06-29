# Testing Guide for Twenty MCP Server

This document describes the testing infrastructure and how to run tests for the Twenty MCP Server.

## Test Suites

### 1. Smoke Tests (No API Key Required)
Quick validation tests that don't require a Twenty API connection:

```bash
npm run test:smoke
```

Tests:
- TypeScript build process
- Server startup validation
- File structure integrity

### 2. Integration Tests (API Key Required)
Full integration tests that interact with the Twenty API:

```bash
# Load environment variables first
source .env

# Run standard test suite
npm test

# Run comprehensive test suite with TAP output
npm run test:full
```

Tests:
- MCP protocol initialization
- All tool operations (create, read, update, search)
- Opportunities management
- Contact management
- Company management
- Task creation

### 3. OAuth Test Suite (OAuth Configuration Required)
Comprehensive OAuth 2.1 authentication testing:

```bash
# Run OAuth test suite
npm run test:oauth
```

Tests:
- OAuth discovery endpoints
- Token validation and security
- API key encryption/decryption
- Authentication middleware
- Protected resource access
- Error handling and edge cases
- CORS configuration
- Backward compatibility

**Prerequisites for OAuth Testing:**
- OAuth must be enabled (`AUTH_ENABLED=true`)
- Valid Clerk credentials in environment
- Encryption secret configured
- Server running on test port

## Test Output

Test results are saved in the `test-results/` directory:

- `TEST_REPORT.md` - Human-readable test report
- `latest-test-results.json` - Machine-readable results
- `test-badge.json` - Status badge data
- `test-run-*.log` - Detailed test logs (TAP format)

## CI/CD Integration

The repository includes GitHub Actions workflows for automated testing:

- **On Push/PR**: Runs smoke tests
- **Manual Trigger**: Can run full integration tests with API key
- **Multi-Node**: Tests against Node.js 18.x, 20.x, and 22.x

## Running Tests Locally

### Prerequisites

1. **For Basic Testing** - Create a `.env` file with your Twenty API credentials:
```env
TWENTY_API_KEY=your_api_key_here
TWENTY_BASE_URL=https://twenty.app.jezweb.com
```

2. **For OAuth Testing** - Additional OAuth configuration:
```env
# OAuth Configuration
AUTH_ENABLED=true
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_DOMAIN=your-app.clerk.accounts.dev
API_KEY_ENCRYPTION_SECRET=your-32-byte-hex-string-here

# Server Configuration
MCP_SERVER_URL=http://localhost:3000
PORT=3000
```

You can set up OAuth quickly with:
```bash
npm run setup:oauth
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Test Commands

```bash
# Quick smoke test (no API needed)
npm run test:smoke

# Standard integration test
npm test

# Full test suite with detailed output
npm run test:full

# OAuth test suite (requires OAuth setup)
npm run test:oauth

# Run specific test file
node tests/run-tests.js

# Run all test suites
npm run test:smoke && npm test && npm run test:oauth
```

### Test Sequence Recommendation

For comprehensive testing, run in this order:

```bash
# 1. Smoke tests (quick validation)
npm run test:smoke

# 2. Integration tests (with Twenty API)
npm test

# 3. OAuth tests (with OAuth configuration)
npm run test:oauth
```

## Test Coverage

Our test suite validates:

- ✅ Server initialization and configuration
- ✅ MCP protocol compliance
- ✅ Tool discovery and metadata
- ✅ CRUD operations for all entity types
- ✅ Error handling and edge cases
- ✅ Response format validation
- ✅ Performance (timeouts and response times)

## Writing New Tests

To add new tests, edit `tests/run-tests.js` or `tests/test-suite.js`:

```javascript
await runTest('Your Test Name', async () => {
  const response = await sendMessage(server, {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'your_tool_name',
      arguments: { /* your args */ }
    },
    id: testId++
  });
  
  // Validate response
  if (!response.result) {
    throw new Error('Expected result');
  }
  
  return { success: true };
});
```

## Viewing Test Results

After running tests, you can:

1. Check the console output for immediate results
2. Open `test-results/TEST_REPORT.md` for a formatted report
3. Parse `test-results/latest-test-results.json` for programmatic access

## Troubleshooting

### Common Issues

1. **"TWENTY_API_KEY environment variable is required"**
   - Solution: Run `source .env` before testing

2. **"Response timeout" errors**
   - The Twenty API might be slow or unavailable
   - Try increasing timeout values in test files

3. **"Cannot find module" errors**
   - Run `npm install` and `npm run build` first

### Debug Mode

For verbose output during tests:

```bash
DEBUG=* npm test
```

## Contributing

When submitting PRs:

1. Ensure all smoke tests pass
2. Include test results in PR description
3. Add tests for new features
4. Update this document if test procedures change