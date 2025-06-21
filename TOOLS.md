# Twenty MCP Server - Tool Reference

This document provides detailed information about all 29 tools available in the Twenty MCP Server.

## Table of Contents

- [Contact Management Tools](#contact-management-tools)
- [Company Management Tools](#company-management-tools)
- [Opportunity Management Tools](#opportunity-management-tools)
- [Activity Management Tools](#activity-management-tools)
- [Task Management Tools](#task-management-tools)
- [Note Management Tools](#note-management-tools)
- [Relationship Management Tools](#relationship-management-tools)
- [Metadata Discovery Tools](#metadata-discovery-tools)

## Contact Management Tools

### create_contact
Creates a new contact in Twenty CRM.

**Parameters:**
- `firstName` (string, required): Contact's first name
- `lastName` (string, required): Contact's last name
- `email` (string, optional): Contact's email address
- `phoneNumber` (string, optional): Contact's phone number
- `position` (string, optional): Job title or position
- `companyId` (string, optional): ID of associated company
- `linkedinUrl` (string, optional): LinkedIn profile URL
- `address` (object, optional): Address with city, state, country fields

**Example:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "position": "Sales Manager",
  "companyId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### get_contact
Retrieves a contact by their ID.

**Parameters:**
- `id` (string, required): Contact's unique identifier

**Returns:** Complete contact information including relationships

### update_contact
Updates an existing contact's information.

**Parameters:**
- `id` (string, required): Contact's unique identifier
- All other parameters from `create_contact` (optional)

### search_contacts
Searches for contacts by name or email.

**Parameters:**
- `query` (string, required): Search query (searches in names and emails)
- `limit` (number, optional): Maximum results to return (default: 20)

**Returns:** Array of matching contacts

## Company Management Tools

### create_company
Creates a new company in Twenty CRM.

**Parameters:**
- `name` (string, required): Company name
- `domain` (string, optional): Company website domain
- `employees` (number, optional): Number of employees
- `industry` (string, optional): Industry sector
- `description` (string, optional): Company description
- `linkedinUrl` (string, optional): Company LinkedIn URL
- `address` (object, optional): Company address

**Example:**
```json
{
  "name": "Acme Corporation",
  "domain": "acme.com",
  "employees": 500,
  "industry": "Technology"
}
```

### get_company
Retrieves a company by ID.

**Parameters:**
- `id` (string, required): Company's unique identifier

### update_company
Updates an existing company's information.

**Parameters:**
- `id` (string, required): Company's unique identifier
- All other parameters from `create_company` (optional)

### search_companies
Searches for companies by name or domain.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Maximum results (default: 20)

## Opportunity Management Tools

### create_opportunity
Creates a new sales opportunity.

**Parameters:**
- `name` (string, required): Opportunity name
- `stage` (string, required): Current stage (e.g., "PROSPECT", "PROPOSAL", "CLOSED")
- `amount` (number, optional): Deal value
- `closeDate` (string, optional): Expected close date (ISO format)
- `probability` (number, optional): Win probability (0-100)
- `companyId` (string, optional): Associated company ID
- `personId` (string, optional): Associated contact ID
- `description` (string, optional): Opportunity details

### get_opportunity
Retrieves an opportunity by ID.

**Parameters:**
- `id` (string, required): Opportunity's unique identifier

### update_opportunity
Updates an existing opportunity.

**Parameters:**
- `id` (string, required): Opportunity's unique identifier
- All other parameters from `create_opportunity` (optional)

### search_opportunities
Advanced search for opportunities with filters.

**Parameters:**
- `stage` (string, optional): Filter by stage
- `minAmount` (number, optional): Minimum deal value
- `maxAmount` (number, optional): Maximum deal value
- `companyId` (string, optional): Filter by company
- `personId` (string, optional): Filter by contact
- `limit` (number, optional): Maximum results

### list_opportunities_by_stage
Lists opportunities grouped by sales stage.

**Parameters:**
- `includeAmount` (boolean, optional): Include total amounts per stage

**Returns:** Opportunities organized by pipeline stage

## Activity Management Tools

### get_activities
Retrieves a unified timeline of all activities (tasks, notes, comments).

**Parameters:**
- `limit` (number, optional): Maximum activities to return (default: 50)
- `offset` (number, optional): Pagination offset

**Returns:** Chronologically sorted activity timeline

### filter_activities
Filters activities by specific criteria.

**Parameters:**
- `type` (string, optional): Activity type (TASK, NOTE, COMMENT)
- `entityType` (string, optional): Related entity type (CONTACT, COMPANY, etc.)
- `entityId` (string, optional): Specific entity ID
- `startDate` (string, optional): Filter start date (ISO format)
- `endDate` (string, optional): Filter end date (ISO format)
- `limit` (number, optional): Maximum results

### create_comment
Creates a comment on any CRM record.

**Parameters:**
- `entityType` (string, required): Type of entity (CONTACT, COMPANY, OPPORTUNITY)
- `entityId` (string, required): Entity's unique identifier
- `content` (string, required): Comment text

### get_entity_activities
Gets all activities related to a specific entity.

**Parameters:**
- `entityType` (string, required): Type of entity
- `entityId` (string, required): Entity's unique identifier
- `includeComments` (boolean, optional): Include comments in results

## Task Management Tools

### create_task
Creates a new task.

**Parameters:**
- `title` (string, required): Task title
- `description` (string, optional): Task details
- `dueDate` (string, optional): Due date (ISO format)
- `assigneeId` (string, optional): Assigned user ID
- `status` (string, optional): Task status
- `relatedEntityType` (string, optional): Related entity type
- `relatedEntityId` (string, optional): Related entity ID

### get_tasks
Retrieves task list with optional filters.

**Parameters:**
- `status` (string, optional): Filter by status
- `assigneeId` (string, optional): Filter by assignee
- `includeCompleted` (boolean, optional): Include completed tasks
- `limit` (number, optional): Maximum results

## Note Management Tools

### create_note
Creates a note attached to an entity.

**Parameters:**
- `content` (string, required): Note content
- `entityType` (string, required): Related entity type
- `entityId` (string, required): Related entity ID
- `title` (string, optional): Note title

## Relationship Management Tools

### get_company_contacts
Gets all contacts associated with a specific company.

**Parameters:**
- `companyId` (string, required): Company's unique identifier
- `includeInactive` (boolean, optional): Include inactive contacts

### get_person_opportunities
Gets all opportunities associated with a specific contact.

**Parameters:**
- `personId` (string, required): Contact's unique identifier
- `includeClosedDeals` (boolean, optional): Include closed opportunities

### link_opportunity_to_company
Links an opportunity to a company and/or contact.

**Parameters:**
- `opportunityId` (string, required): Opportunity ID
- `companyId` (string, optional): Company ID to link
- `personId` (string, optional): Contact ID to link

### transfer_contact_to_company
Transfers a contact from one company to another.

**Parameters:**
- `contactId` (string, required): Contact ID
- `fromCompanyId` (string, required): Current company ID
- `toCompanyId` (string, required): Target company ID
- `preserveHistory` (boolean, optional): Keep activity history

### get_relationship_summary
Gets relationship statistics for an entity.

**Parameters:**
- `entityType` (string, required): Entity type
- `entityId` (string, required): Entity ID

**Returns:** Summary of all relationships and counts

### find_orphaned_records
Finds records missing important relationships.

**Parameters:**
- `recordType` (string, required): Type of records to check
- `checkType` (string, required): What to check for (NO_COMPANY, NO_CONTACTS, etc.)
- `limit` (number, optional): Maximum results

## Metadata Discovery Tools

### list_all_objects
Lists all available CRM objects and their metadata.

**Parameters:** None

**Returns:** Complete list of CRM objects with field counts and capabilities

### get_object_schema
Gets detailed schema information for a specific object type.

**Parameters:**
- `objectType` (string, required): Object type name

**Returns:** Complete field definitions, relationships, and constraints

### get_field_metadata
Gets metadata for specific fields of an object.

**Parameters:**
- `objectType` (string, required): Object type name
- `fieldNames` (array, optional): Specific fields to query

**Returns:** Detailed field metadata including types, constraints, and descriptions

## Usage Examples

### Creating a Complete Customer Record

```javascript
// 1. Create a company
const company = await tools.create_company({
  name: "Tech Innovators Inc",
  domain: "techinnovators.com",
  employees: 150,
  industry: "Software"
});

// 2. Create a contact at the company
const contact = await tools.create_contact({
  firstName: "John",
  lastName: "Doe",
  email: "john@techinnovators.com",
  position: "CTO",
  companyId: company.id
});

// 3. Create an opportunity
const opportunity = await tools.create_opportunity({
  name: "Enterprise Software Deal",
  stage: "PROPOSAL",
  amount: 150000,
  companyId: company.id,
  personId: contact.id,
  closeDate: "2024-03-31"
});

// 4. Add a note
await tools.create_note({
  content: "Initial meeting went well. They're interested in our enterprise package.",
  entityType: "OPPORTUNITY",
  entityId: opportunity.id
});
```

### Finding and Updating Records

```javascript
// Search for contacts
const contacts = await tools.search_contacts({
  query: "john@",
  limit: 10
});

// Update the first contact found
if (contacts.length > 0) {
  await tools.update_contact({
    id: contacts[0].id,
    position: "Chief Technology Officer",
    phoneNumber: "+1-555-123-4567"
  });
}
```

### Analyzing Relationships

```javascript
// Find companies without any contacts
const orphanedCompanies = await tools.find_orphaned_records({
  recordType: "COMPANY",
  checkType: "NO_CONTACTS",
  limit: 20
});

// Get relationship summary for a company
const summary = await tools.get_relationship_summary({
  entityType: "COMPANY",
  entityId: "company-id-here"
});
```

## Error Handling

All tools return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: firstName",
    "details": {
      "field": "firstName",
      "requirement": "required"
    }
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input parameters
- `NOT_FOUND`: Record not found
- `PERMISSION_DENIED`: Insufficient permissions
- `RATE_LIMITED`: API rate limit exceeded
- `SERVER_ERROR`: Twenty CRM server error

## Best Practices

1. **Always check for existing records** before creating duplicates
2. **Use batch operations** when processing multiple records
3. **Include error handling** in your workflows
4. **Respect rate limits** - the server implements automatic retry logic
5. **Use metadata tools** to discover available fields before operations

## Support

For issues or questions:
- Check the [Troubleshooting Guide](README.md#troubleshooting)
- Review [test examples](tests/) for usage patterns
- Open an issue on [GitHub](https://github.com/jezweb/twenty-mcp/issues)