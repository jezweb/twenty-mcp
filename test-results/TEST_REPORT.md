# Twenty MCP Server Test Report

## Test Execution Summary

- **Date**: 21/06/2025
- **Time**: 9:23:05 am
- **Duration**: 2618ms
- **Environment**: Node v22.14.0 on linux
- **API Endpoint**: https://twenty.app.jezweb.com

## Results Overview

| Metric | Count |
|--------|-------|
| Total Tests | 7 |
| ✅ Passed | 7 |
| ❌ Failed | 0 |
| Success Rate | 100.0% |

## Test Details


### 1. Initialize MCP Protocol

- **Status**: ✅ PASSED
- **Duration**: 9ms
- **Time**: 9:23:06 am

- **Result**: ```json
{
  "serverName": "twenty-mcp-server",
  "serverVersion": "1.0.0"
}
```


### 2. List Available Tools

- **Status**: ✅ PASSED
- **Duration**: 5ms
- **Time**: 9:23:06 am

- **Result**: ```json
{
  "totalTools": 23,
  "categories": {
    "contacts": 4,
    "companies": 3,
    "opportunities": 3,
    "tasks": 2,
    "notes": 1,
    "activities": 4
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
    "list_opportunities_by_stage",
    "get_activities",
    "filter_activities",
    "create_comment",
    "get_entity_activities",
    "list_all_objects",
    "get_object_schema",
    "get_field_metadata"
  ]
}
```


### 3. Create Test Contact

- **Status**: ✅ PASSED
- **Duration**: 247ms
- **Time**: 9:23:06 am

- **Result**: ```json
{
  "message": "Contact created successfully: Test User_1750461786099 (ID: 83d914cf-e44c-4198-91ec-f030a6c16515)"
}
```


### 4. Create Test Opportunity

- **Status**: ✅ PASSED
- **Duration**: 157ms
- **Time**: 9:23:06 am

- **Result**: ```json
{
  "message": "Created opportunity: Test Deal 1750461786346 (ID: 5410cdb4-8c28-4283-92f3-af2b97f7788a)"
}
```


### 5. List Opportunities by Stage

- **Status**: ✅ PASSED
- **Duration**: 88ms
- **Time**: 9:23:06 am

- **Result**: ```json
{
  "totalOpportunities": 8,
  "hasContent": true
}
```


### 6. Create Test Company

- **Status**: ✅ PASSED
- **Duration**: 144ms
- **Time**: 9:23:06 am

- **Result**: ```json
{
  "message": "Company created successfully: Test Corp 1750461786592 (ID: a8867733-cf5e-4bef-90e7-3890a631275b)"
}
```


### 7. Get Activities Timeline

- **Status**: ✅ PASSED
- **Duration**: 86ms
- **Time**: 9:23:06 am

- **Result**: ```json
{
  "hasTimelineContent": true,
  "contentPreview": "Activities Timeline (4 total, showing 4):\n\n[TASK] Client Contact  (13/06/2025)\nAuthor: Deepinder Kaur\n\nID: e94fc175-18db-4dc3-982f-6e3f63f31f11\n---\n\n[TASK] Support Ticket Invoices (13/06/2025)\nAuthor:..."
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
