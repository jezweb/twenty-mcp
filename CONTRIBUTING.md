# Contributing to Twenty MCP Server

Thank you for your interest in contributing to the Twenty MCP Server! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Adding New Tools](#adding-new-tools)

## Code of Conduct

This project follows a standard code of conduct to ensure a welcoming environment for all contributors:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/twenty-mcp.git
   cd twenty-mcp
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/jezweb/twenty-mcp.git
   ```

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm
- A Twenty CRM instance for testing
- Git

### Initial Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Twenty CRM credentials
nano .env

# Build the project
npm run build

# Run tests to verify setup
npm test
```

### Development Workflow

```bash
# Start development mode with hot reload
npm run dev

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm test
```

## Making Changes

### 1. Create a Feature Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing patterns and conventions
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:smoke

# Run with debug output
DEBUG=twenty-mcp:* npm test
```

### 4. Commit Your Changes

We follow conventional commit format:

```bash
# Format: <type>(<scope>): <subject>

git commit -m "feat(tools): add bulk contact import tool"
git commit -m "fix(client): handle network timeouts properly"
git commit -m "docs(readme): update installation instructions"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

## Testing

### Running Tests

```bash
# Quick smoke tests (no API needed)
npm run test:smoke

# Integration tests (requires API key)
npm test

# Full test suite with detailed output
npm run test:full
```

### Writing Tests

Add tests for new features in the appropriate test file:

```javascript
// tests/test-new-feature.js
await runTest('New Feature Test', async () => {
  const response = await sendMessage(server, {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'your_new_tool',
      arguments: { /* test args */ }
    },
    id: testId++
  });
  
  // Validate response
  assert(response.result, 'Expected result');
  return { success: true };
});
```

### Test Coverage

Ensure your changes include:
- ✅ Happy path tests
- ✅ Error handling tests
- ✅ Edge case tests
- ✅ Integration tests if adding new tools

## Submitting Changes

### 1. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 2. Create a Pull Request

1. Go to the [Twenty MCP repository](https://github.com/jezweb/twenty-mcp)
2. Click "Pull requests" → "New pull request"
3. Click "compare across forks"
4. Select your fork and branch
5. Fill out the PR template:

```markdown
## Description
Brief description of your changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Ran `npm test` successfully
- [ ] Added new tests for changes
- [ ] Tested manually with Twenty CRM instance

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I've added documentation for new features
- [ ] All tests pass locally
- [ ] I've updated the README if needed
```

### 3. Respond to Review Feedback

- Address reviewer comments
- Push additional commits to your branch
- Mark conversations as resolved
- Request re-review when ready

## Style Guidelines

### TypeScript

```typescript
// Use explicit types
function createContact(data: ContactInput): Promise<Contact> {
  // Implementation
}

// Use interfaces for complex types
interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string;
}

// Document complex functions
/**
 * Creates a new contact in Twenty CRM
 * @param data Contact information
 * @returns Created contact with ID
 */
```

### General Guidelines

- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Prefer `async/await` over callbacks
- Handle errors appropriately

### File Organization

```
src/
├── client/          # Twenty API client
├── tools/           # MCP tool implementations
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Main entry point
```

## Adding New Tools

### 1. Define the Tool

Add to `src/tools/index.ts`:

```typescript
{
  name: "your_new_tool",
  description: "Clear description of what the tool does",
  inputSchema: {
    type: "object",
    properties: {
      requiredParam: {
        type: "string",
        description: "Parameter description"
      },
      optionalParam: {
        type: "number",
        description: "Optional parameter"
      }
    },
    required: ["requiredParam"]
  }
}
```

### 2. Implement the Handler

```typescript
case "your_new_tool": {
  const { requiredParam, optionalParam } = args;
  
  try {
    const result = await client.yourOperation({
      required: requiredParam,
      optional: optionalParam
    });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    return handleError(error);
  }
}
```

### 3. Add Client Method

In `src/client/twenty-client.ts`:

```typescript
async yourOperation(params: YourParams): Promise<YourResult> {
  const query = gql`
    mutation YourMutation($input: YourInput!) {
      yourOperation(input: $input) {
        id
        // other fields
      }
    }
  `;
  
  return this.request(query, { input: params });
}
```

### 4. Add Tests

Create tests for your new tool:

```javascript
await runTest('Your New Tool - Success', async () => {
  // Test implementation
});

await runTest('Your New Tool - Error Handling', async () => {
  // Test error cases
});
```

### 5. Update Documentation

- Add tool to README.md tool count
- Add detailed documentation to TOOLS.md
- Update any relevant examples

## Questions?

If you have questions:

1. Check existing [issues](https://github.com/jezweb/twenty-mcp/issues)
2. Review [discussions](https://github.com/jezweb/twenty-mcp/discussions)
3. Open a new issue with the "question" label

Thank you for contributing to Twenty MCP Server! 🎉