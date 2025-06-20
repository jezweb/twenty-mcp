import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TwentyClient } from '../client/twenty-client.js';

export function registerOpportunityTools(server: McpServer, client: TwentyClient) {
  server.tool(
    'create_opportunity',
    'Create a new opportunity/deal in Twenty CRM',
    {
      name: z.string().describe('Opportunity name'),
      amount: z.object({
        value: z.number().describe('Amount in currency units (e.g., 1000.50 for $1,000.50)'),
        currency: z.string().default('USD').describe('Currency code (e.g., USD, EUR)')
      }).optional().describe('Deal amount'),
      stage: z.string().optional().describe('Sales stage (e.g., NEW, SCREENING, MEETING, PROPOSAL, CUSTOMER)'),
      closeDate: z.string().optional().describe('Expected close date (ISO 8601 format)'),
      companyId: z.string().optional().describe('ID of associated company'),
      pointOfContactId: z.string().optional().describe('ID of main contact person')
    },
    async ({ name, amount, stage, closeDate, companyId, pointOfContactId }) => {
      try {
        const opportunityData: any = { name };
        
        if (amount) {
          opportunityData.amount = {
            amountMicros: Math.round(amount.value * 1000000),
            currencyCode: amount.currency
          };
        }
        
        if (stage) opportunityData.stage = stage;
        if (closeDate) opportunityData.closeDate = closeDate;
        if (companyId) opportunityData.companyId = companyId;
        if (pointOfContactId) opportunityData.pointOfContactId = pointOfContactId;
        
        const opportunity = await client.createOpportunity(opportunityData);
        
        return {
          content: [{
            type: 'text',
            text: `Created opportunity: ${opportunity.name} (ID: ${opportunity.id})`
          }],
          data: opportunity
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to create opportunity: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_opportunity',
    'Retrieve an opportunity by ID from Twenty CRM',
    {
      id: z.string().describe('Opportunity ID to retrieve')
    },
    async ({ id }) => {
      try {
        const opportunity = await client.getOpportunity(id);
        
        if (!opportunity) {
          return {
            content: [{
              type: 'text',
              text: `Opportunity with ID ${id} not found`
            }],
            isError: true
          };
        }
        
        const amountStr = opportunity.amount 
          ? `${opportunity.amount.currencyCode} ${(opportunity.amount.amountMicros / 1000000).toFixed(2)}`
          : 'Not specified';
        
        return {
          content: [{
            type: 'text',
            text: `Opportunity: ${opportunity.name}
Amount: ${amountStr}
Stage: ${opportunity.stage || 'Not specified'}
Close Date: ${opportunity.closeDate || 'Not specified'}
Company ID: ${opportunity.companyId || 'None'}
Contact ID: ${opportunity.pointOfContactId || 'None'}`
          }],
          data: opportunity
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve opportunity: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'update_opportunity',
    'Update an existing opportunity in Twenty CRM',
    {
      id: z.string().describe('Opportunity ID to update'),
      name: z.string().optional().describe('Opportunity name'),
      amount: z.object({
        value: z.number().describe('Amount in currency units'),
        currency: z.string().describe('Currency code')
      }).optional().describe('Deal amount'),
      stage: z.string().optional().describe('Sales stage'),
      closeDate: z.string().optional().describe('Expected close date'),
      companyId: z.string().optional().describe('ID of associated company'),
      pointOfContactId: z.string().optional().describe('ID of main contact person')
    },
    async (input) => {
      try {
        const updateData: any = {};
        
        if (input.name) updateData.name = input.name;
        if (input.amount) {
          updateData.amount = {
            amountMicros: Math.round(input.amount.value * 1000000),
            currencyCode: input.amount.currency
          };
        }
        if (input.stage) updateData.stage = input.stage;
        if (input.closeDate) updateData.closeDate = input.closeDate;
        if (input.companyId) updateData.companyId = input.companyId;
        if (input.pointOfContactId) updateData.pointOfContactId = input.pointOfContactId;
        
        const opportunity = await client.updateOpportunity({
          id: input.id,
          ...updateData
        });
        
        return {
          content: [{
            type: 'text',
            text: `Updated opportunity: ${opportunity.name} (ID: ${opportunity.id})`
          }],
          data: opportunity
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to update opportunity: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'search_opportunities',
    'Search for opportunities in Twenty CRM with various filters',
    {
      query: z.string().optional().describe('Search query for opportunity name'),
      stage: z.string().optional().describe('Filter by specific stage'),
      minAmount: z.number().optional().describe('Minimum deal amount'),
      maxAmount: z.number().optional().describe('Maximum deal amount'),
      startDate: z.string().optional().describe('Start date for close date range (ISO 8601)'),
      endDate: z.string().optional().describe('End date for close date range (ISO 8601)'),
      companyId: z.string().optional().describe('Filter by company ID'),
      limit: z.number().default(20).describe('Maximum number of results'),
      offset: z.number().default(0).describe('Number of results to skip')
    },
    async (input) => {
      try {
        const opportunities = await client.searchOpportunities(input);
        
        if (opportunities.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No opportunities found matching the search criteria'
            }],
            data: []
          };
        }
        
        const opportunityList = opportunities.map(opp => {
          const amount = opp.amount 
            ? `${opp.amount.currencyCode} ${(opp.amount.amountMicros / 1000000).toFixed(2)}`
            : 'N/A';
          return `- ${opp.name} (${opp.stage || 'No stage'}) - ${amount}`;
        }).join('\n');
        
        return {
          content: [{
            type: 'text',
            text: `Found ${opportunities.length} opportunities:\n${opportunityList}`
          }],
          data: opportunities
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to search opportunities: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'list_opportunities_by_stage',
    'List all opportunities grouped by their sales stage (pipeline view)',
    {},
    async () => {
      try {
        const opportunitiesByStage = await client.listOpportunitiesByStage();
        
        let output = 'Opportunities by Stage:\n\n';
        let totalCount = 0;
        let totalValue = 0;
        
        for (const [stage, opportunities] of Object.entries(opportunitiesByStage)) {
          const stageValue = opportunities.reduce((sum, opp) => {
            return sum + (opp.amount ? opp.amount.amountMicros / 1000000 : 0);
          }, 0);
          
          output += `${stage} (${opportunities.length} opportunities, $${stageValue.toFixed(2)}):\n`;
          
          opportunities.forEach(opp => {
            const amount = opp.amount 
              ? `$${(opp.amount.amountMicros / 1000000).toFixed(2)}`
              : 'No amount';
            output += `  - ${opp.name}: ${amount}\n`;
          });
          
          output += '\n';
          totalCount += opportunities.length;
          totalValue += stageValue;
        }
        
        output += `\nTotal: ${totalCount} opportunities worth $${totalValue.toFixed(2)}`;
        
        return {
          content: [{
            type: 'text',
            text: output
          }],
          data: opportunitiesByStage
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to list opportunities by stage: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
}