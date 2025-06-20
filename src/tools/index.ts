import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TwentyClient } from '../client/twenty-client.js';
import { registerOpportunityTools } from './opportunities.js';

export function registerPersonTools(server: McpServer, client: TwentyClient) {
  server.tool(
    'create_contact',
    'Create a new contact (person) in Twenty CRM',
    {
      firstName: z.string().describe('First name of the contact'),
      lastName: z.string().describe('Last name of the contact'),
      email: z.string().email().optional().describe('Email address'),
      phone: z.string().optional().describe('Phone number'),
      companyId: z.string().optional().describe('ID of associated company'),
      jobTitle: z.string().optional().describe('Job title'),
      linkedinUrl: z.string().url().optional().describe('LinkedIn profile URL'),
      city: z.string().optional().describe('City where the contact is located'),
    },
    async (args) => {
    try {
      // Transform flat input to Twenty's nested structure
      const personData = {
        name: {
          firstName: args.firstName,
          lastName: args.lastName,
        },
        ...(args.email && {
          emails: {
            primaryEmail: args.email,
          },
        }),
        ...(args.phone && {
          phones: {
            primaryPhoneNumber: args.phone,
          },
        }),
        ...(args.companyId && { companyId: args.companyId }),
        ...(args.jobTitle && { jobTitle: args.jobTitle }),
        ...(args.linkedinUrl && {
          linkedinLink: {
            primaryLinkUrl: args.linkedinUrl,
          },
        }),
        ...(args.city && { city: args.city }),
      };

      const person = await client.createPerson(personData);
      return {
        content: [{
          type: 'text' as const,
          text: `Contact created successfully: ${person.name.firstName} ${person.name.lastName} (ID: ${person.id})`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error creating contact: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool(
    'get_contact',
    'Retrieve a contact by ID from Twenty CRM',
    {
      id: z.string().describe('Contact ID to retrieve'),
    },
    async (args) => {
    try {
      const person = await client.getPerson(args.id);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(person, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error retrieving contact: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool(
    'update_contact',
    'Update an existing contact in Twenty CRM',
    {
      id: z.string().describe('Contact ID to update'),
      firstName: z.string().optional().describe('First name'),
      lastName: z.string().optional().describe('Last name'),
      email: z.string().email().optional().describe('Email address'),
      phone: z.string().optional().describe('Phone number'),
      companyId: z.string().optional().describe('ID of associated company'),
      jobTitle: z.string().optional().describe('Job title'),
      linkedinUrl: z.string().url().optional().describe('LinkedIn profile URL'),
      city: z.string().optional().describe('City'),
    },
    async (args) => {
    try {
      const { id, ...updates } = args;
      const person = await client.updatePerson(id, updates);
      return {
        content: [{
          type: 'text' as const,
          text: `Contact updated successfully: ${person.name.firstName} ${person.name.lastName}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error updating contact: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool(
    'search_contacts',
    'Search for contacts in Twenty CRM',
    {
      query: z.string().describe('Search query (searches name and email)'),
      limit: z.number().optional().default(20).describe('Maximum number of results'),
      offset: z.number().optional().default(0).describe('Number of results to skip'),
    },
    async (args) => {
    try {
      const people = await client.searchPeople(args.query, {
        limit: args.limit,
        offset: args.offset,
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(people, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error searching contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });
}

export function registerCompanyTools(server: McpServer, client: TwentyClient) {
  server.tool(
    'create_company',
    'Create a new company in Twenty CRM',
    {
      name: z.string().describe('Company name'),
      domainName: z.string().optional().describe('Company domain name'),
      address: z.string().optional().describe('Company address'),
      employees: z.number().optional().describe('Number of employees'),
      linkedinUrl: z.string().url().optional().describe('LinkedIn company URL'),
      xUrl: z.string().url().optional().describe('X (Twitter) company URL'),
      annualRecurringRevenue: z.number().optional().describe('Annual recurring revenue'),
      idealCustomerProfile: z.boolean().optional().describe('Is this an ideal customer profile'),
    },
    async (args) => {
    try {
      // Transform flat input to Twenty's nested structure
      const companyData = {
        name: args.name,
        ...(args.domainName && {
          domainName: {
            primaryLinkUrl: args.domainName,
          },
        }),
        ...(args.address && {
          address: {
            addressStreet1: args.address,
          },
        }),
        ...(args.employees && { employees: args.employees }),
        ...(args.linkedinUrl && {
          linkedinLink: {
            primaryLinkUrl: args.linkedinUrl,
          },
        }),
        ...(args.xUrl && {
          xLink: {
            primaryLinkUrl: args.xUrl,
          },
        }),
        ...(args.annualRecurringRevenue && {
          annualRecurringRevenue: {
            amountMicros: args.annualRecurringRevenue * 1000000, // Convert to micros
            currencyCode: 'USD',
          },
        }),
        ...(args.idealCustomerProfile !== undefined && { idealCustomerProfile: args.idealCustomerProfile }),
      };

      const company = await client.createCompany(companyData);
      return {
        content: [{
          type: 'text' as const,
          text: `Company created successfully: ${company.name} (ID: ${company.id})`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error creating company: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool(
    'get_company',
    'Retrieve a company by ID from Twenty CRM',
    {
      id: z.string().describe('Company ID to retrieve'),
    },
    async (args) => {
    try {
      const company = await client.getCompany(args.id);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(company, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error retrieving company: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool(
    'update_company',
    'Update an existing company in Twenty CRM',
    {
      id: z.string().describe('Company ID to update'),
      name: z.string().optional().describe('Company name'),
      domainName: z.string().optional().describe('Company domain name'),
      address: z.string().optional().describe('Company address'),
      employees: z.number().optional().describe('Number of employees'),
      linkedinUrl: z.string().url().optional().describe('LinkedIn company URL'),
      xUrl: z.string().url().optional().describe('X (Twitter) company URL'),
      annualRecurringRevenue: z.number().optional().describe('Annual recurring revenue'),
      idealCustomerProfile: z.boolean().optional().describe('Is this an ideal customer profile'),
    },
    async (args) => {
    try {
      const { id, ...updateData } = args;
      
      // Transform flat input to Twenty's nested structure
      const updates = {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.domainName && {
          domainName: {
            primaryLinkUrl: updateData.domainName,
          },
        }),
        ...(updateData.address && {
          address: {
            addressStreet1: updateData.address,
          },
        }),
        ...(updateData.employees && { employees: updateData.employees }),
        ...(updateData.linkedinUrl && {
          linkedinLink: {
            primaryLinkUrl: updateData.linkedinUrl,
          },
        }),
        ...(updateData.xUrl && {
          xLink: {
            primaryLinkUrl: updateData.xUrl,
          },
        }),
        ...(updateData.annualRecurringRevenue && {
          annualRecurringRevenue: {
            amountMicros: updateData.annualRecurringRevenue * 1000000,
            currencyCode: 'USD',
          },
        }),
        ...(updateData.idealCustomerProfile !== undefined && { idealCustomerProfile: updateData.idealCustomerProfile }),
      };

      const company = await client.updateCompany(id, updates);
      return {
        content: [{
          type: 'text' as const,
          text: `Company updated successfully: ${company.name}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error updating company: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool(
    'search_companies',
    'Search for companies in Twenty CRM',
    {
      query: z.string().describe('Search query (searches name and domain)'),
      limit: z.number().optional().default(20).describe('Maximum number of results'),
      offset: z.number().optional().default(0).describe('Number of results to skip'),
    },
    async (args) => {
    try {
      const companies = await client.searchCompanies(args.query, {
        limit: args.limit,
        offset: args.offset,
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(companies, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error searching companies: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });
}

export function registerTaskTools(server: McpServer, client: TwentyClient) {
  server.tool(
    'create_task',
    'Create a new task in Twenty CRM',
    {
      title: z.string().describe('Task title'),
      body: z.string().optional().describe('Task description'),
      dueAt: z.string().optional().describe('Due date (ISO 8601 format)'),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional().default('TODO').describe('Task status'),
      assigneeId: z.string().optional().describe('ID of the person assigned to the task'),
    },
    async (args) => {
    try {
      const task = await client.createTask(args);
      return {
        content: [{
          type: 'text' as const,
          text: `Task created successfully: ${task.title} (ID: ${task.id})`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool(
    'get_tasks',
    'Retrieve tasks from Twenty CRM',
    {
      limit: z.number().optional().default(20).describe('Maximum number of results'),
      offset: z.number().optional().default(0).describe('Number of results to skip'),
    },
    async (args) => {
    try {
      const tasks = await client.getTasks({
        limit: args.limit,
        offset: args.offset,
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(tasks, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error retrieving tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool(
    'create_note',
    'Create a new note in Twenty CRM',
    {
      title: z.string().optional().describe('Note title'),
      body: z.string().describe('Note content'),
      authorId: z.string().optional().describe('ID of the note author'),
    },
    async (args) => {
    try {
      const note = await client.createNote(args);
      return {
        content: [{
          type: 'text' as const,
          text: `Note created successfully: ${note.title || 'Untitled'} (ID: ${note.id})`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error creating note: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });
}

export { registerOpportunityTools };