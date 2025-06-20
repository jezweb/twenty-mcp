# Twenty MCP Server Test Report

## Test Execution Summary

- **Date**: 21/06/2025
- **Time**: 7:59:43 am
- **Duration**: 2875ms
- **Environment**: Node v22.14.0 on linux
- **API Endpoint**: https://twenty.app.jezweb.com

## Results Overview

| Metric | Count |
|--------|-------|
| Total Tests | 6 |
| ✅ Passed | 6 |
| ❌ Failed | 0 |
| Success Rate | 100.0% |

## Test Details


### 1. Initialize MCP Protocol

- **Status**: ✅ PASSED
- **Duration**: 6ms
- **Time**: 7:59:44 am

- **Result**: ```json
{
  "serverName": "twenty-mcp-server",
  "serverVersion": "1.0.0"
}
```


### 2. List Available Tools

- **Status**: ✅ PASSED
- **Duration**: 8ms
- **Time**: 7:59:44 am

- **Result**: ```json
{
  "totalTools": 16,
  "categories": {
    "contacts": 4,
    "companies": 3,
    "opportunities": 3,
    "tasks": 2,
    "notes": 1
  },
  "toolNames": [
    "create_contact",
    "get_contact",
    "update_contact",
    "search_contacts",
    "create_company",
    "get_company",
    "update_company",
    "search_companies",
    "create_task",
    "get_tasks",
    "create_note",
    "create_opportunity",
    "get_opportunity",
    "update_opportunity",
    "search_opportunities",
    "list_opportunities_by_stage"
  ]
}
```


### 3. Create Test Contact

- **Status**: ✅ PASSED
- **Duration**: 302ms
- **Time**: 7:59:44 am

- **Result**: ```json
{
  "message": "Contact created successfully: Test User_1750456784202 (ID: e228cb96-cf72-4114-8d67-03a5286a291a)"
}
```


### 4. Create Test Opportunity

- **Status**: ✅ PASSED
- **Duration**: 396ms
- **Time**: 7:59:44 am

- **Result**: ```json
{
  "message": "Created opportunity: Test Deal 1750456784504 (ID: 64c6fed3-5d8d-48c5-ab79-fcbde71d06c5)"
}
```


### 5. List Opportunities by Stage

- **Status**: ✅ PASSED
- **Duration**: 64ms
- **Time**: 7:59:44 am

- **Result**: ```json
{
  "totalOpportunities": 4,
  "hasContent": true
}
```


### 6. Create Test Company

- **Status**: ✅ PASSED
- **Duration**: 249ms
- **Time**: 7:59:44 am

- **Result**: ```json
{
  "message": "Company created successfully: Test Corp 1750456784964 (ID: 3f49a325-4573-40a3-bc0a-85ef71a0ddde)"
}
```


## Test Coverage

The test suite validates:
- ✅ MCP Protocol initialization
- ✅ Tool discovery and listing
- ✅ Contact creation
- ✅ Opportunity management
- ✅ Company creation
- ✅ Pipeline visualization

---
*Generated automatically by Twenty MCP Test Suite*
