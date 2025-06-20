# Twenty MCP Server Test Report

## Test Execution Summary

- **Date**: 21/06/2025
- **Time**: 7:15:35 am
- **Duration**: 8301ms
- **Environment**: Node v22.14.0 on linux
- **API Endpoint**: https://twenty.app.jezweb.com

## Results Overview

| Metric | Count |
|--------|-------|
| Total Tests | 6 |
| ✅ Passed | 5 |
| ❌ Failed | 1 |
| Success Rate | 83.3% |

## Test Details


### 1. Initialize MCP Protocol

- **Status**: ❌ FAILED
- **Duration**: 5005ms
- **Time**: 7:15:36 am
- **Error**: Response timeout



### 2. List Available Tools

- **Status**: ✅ PASSED
- **Duration**: 15ms
- **Time**: 7:15:41 am

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
- **Duration**: 1473ms
- **Time**: 7:15:41 am

- **Result**: ```json
{
  "message": "Contact created successfully: Test User_1750454141213 (ID: ef91bd4a-3cfa-4fc6-95d3-7d23b33a6b00)"
}
```


### 4. Create Test Opportunity

- **Status**: ✅ PASSED
- **Duration**: 305ms
- **Time**: 7:15:42 am

- **Result**: ```json
{
  "message": "Created opportunity: Test Deal 1750454142686 (ID: 222ec1fe-b702-4541-b558-c752cb5975d5)"
}
```


### 5. List Opportunities by Stage

- **Status**: ✅ PASSED
- **Duration**: 45ms
- **Time**: 7:15:42 am

- **Result**: ```json
{
  "totalOpportunities": 3,
  "hasContent": true
}
```


### 6. Create Test Company

- **Status**: ✅ PASSED
- **Duration**: 95ms
- **Time**: 7:15:43 am

- **Result**: ```json
{
  "message": "Company created successfully: Test Corp 1750454143036 (ID: c10bf9f8-ab73-462a-8e74-4f3478b0502e)"
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
