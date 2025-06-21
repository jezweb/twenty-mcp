import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TwentyClient } from '../client/twenty-client.js';

export function registerMetadataTools(server: McpServer, client: TwentyClient) {
  server.tool(
    'list_all_objects',
    'List all objects (entities) available in Twenty CRM with their metadata',
    {
      includeCustom: z.boolean().optional().default(true).describe('Include custom objects'),
      includeSystem: z.boolean().optional().default(false).describe('Include system objects'),
      activeOnly: z.boolean().optional().default(true).describe('Only include active objects'),
      groupBy: z.enum(['type', 'none']).optional().default('type').describe('How to group the results'),
    },
    async (args) => {
      try {
        const objectSummary = await client.listAllObjects({
          includeCustom: args.includeCustom,
          includeSystem: args.includeSystem,
          activeOnly: args.activeOnly,
        });

        if (args.groupBy === 'type') {
          const standardObjects = objectSummary.standard.map(obj => 
            `📊 ${obj.labelSingular} (${obj.nameSingular})`
          );
          
          const customObjects = objectSummary.custom.map(obj => 
            `🎨 ${obj.labelSingular} (${obj.nameSingular})`
          );
          
          const systemObjects = objectSummary.system.map(obj => 
            `⚙️ ${obj.labelSingular} (${obj.nameSingular})`
          );

          let content = `# Twenty CRM Objects Summary

## Overview
- **Total Objects**: ${objectSummary.totalCount}
- **Standard Objects**: ${objectSummary.standardCount}
- **Custom Objects**: ${objectSummary.customCount}`;

          if (args.includeSystem) {
            content += `\n- **System Objects**: ${objectSummary.systemCount}`;
          }

          if (standardObjects.length > 0) {
            content += `\n\n## Standard Objects (${standardObjects.length})\n${standardObjects.join('\n')}`;
          }

          if (customObjects.length > 0) {
            content += `\n\n## Custom Objects (${customObjects.length})\n${customObjects.join('\n')}`;
          }

          if (args.includeSystem && systemObjects.length > 0) {
            content += `\n\n## System Objects (${systemObjects.length})\n${systemObjects.join('\n')}`;
          }

          content += `\n\n💡 Use 'get_object_schema' with object name to see detailed field information.`;

          return {
            content: [{
              type: 'text' as const,
              text: content
            }]
          };
        } else {
          // Flat list
          const allObjects = [
            ...objectSummary.standard,
            ...objectSummary.custom,
            ...(args.includeSystem ? objectSummary.system : [])
          ];

          const objectList = allObjects.map((obj, index) => {
            const icon = obj.isCustom ? '🎨' : obj.isSystem ? '⚙️' : '📊';
            return `${index + 1}. ${icon} ${obj.labelSingular} (${obj.nameSingular}) - ${obj.description || 'No description'}`;
          }).join('\n');

          return {
            content: [{
              type: 'text' as const,
              text: `Twenty CRM Objects (${allObjects.length} total):\n\n${objectList}`
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error listing objects: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'get_object_schema',
    'Get detailed schema information for a specific object including all fields and their types',
    {
      objectName: z.string().describe('Object name (singular or plural) or ID to get schema for'),
      includeSystemFields: z.boolean().optional().default(false).describe('Include system fields in the output'),
    },
    async (args) => {
      try {
        const schema = await client.getObjectSchema(args.objectName);
        const object = schema.object;

        // Filter fields if needed
        let fields = schema.fields;
        if (!args.includeSystemFields) {
          fields = fields.filter(field => !field.isSystem);
        }

        const fieldList = fields.map(field => {
          const customIcon = field.isCustom ? '🎨' : '';
          const nullableText = field.isNullable ? '(optional)' : '(required)';
          const defaultText = field.defaultValue ? ` [default: ${field.defaultValue}]` : '';
          
          return `  ${customIcon} **${field.label}** (${field.name})
    Type: ${field.type} ${nullableText}${defaultText}
    ${field.description ? `Description: ${field.description}` : 'No description'}`;
        }).join('\n\n');

        const content = `# ${object.labelSingular} Schema

## Object Information
- **Name**: ${object.nameSingular} / ${object.namePlural}
- **Label**: ${object.labelSingular} / ${object.labelPlural}
- **Type**: ${object.isCustom ? 'Custom' : 'Standard'} Object
- **Status**: ${object.isActive ? 'Active' : 'Inactive'}
- **Icon**: ${object.icon || 'No icon'}
${object.description ? `- **Description**: ${object.description}` : ''}

## Fields (${fields.length})

${fieldList}

---
💡 **Legend**: 🎨 = Custom field | (required) = Must have value | (optional) = Can be empty
📝 Use field names in API calls and tool arguments.`;

        return {
          content: [{
            type: 'text' as const,
            text: content
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error getting object schema: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'get_field_metadata',
    'Get detailed information about fields, either for a specific object or across all objects',
    {
      objectName: z.string().optional().describe('Object name to get fields for (if not specified, gets all fields)'),
      fieldType: z.enum([
        'UUID', 'TEXT', 'PHONE', 'EMAIL', 'DATE_TIME', 'DATE', 'BOOLEAN', 
        'NUMBER', 'CURRENCY', 'FULL_NAME', 'LINK', 'LINKS', 'ADDRESS', 
        'RATING', 'SELECT', 'MULTI_SELECT', 'RELATION', 'RICH_TEXT', 'POSITION', 'RAW_JSON'
      ]).optional().describe('Filter by specific field type'),
      includeCustom: z.boolean().optional().default(true).describe('Include custom fields'),
      includeSystem: z.boolean().optional().default(false).describe('Include system fields'),
      activeOnly: z.boolean().optional().default(true).describe('Only include active fields'),
    },
    async (args) => {
      try {
        const fields = await client.getFieldMetadata({
          objectName: args.objectName,
          fieldType: args.fieldType,
          includeCustom: args.includeCustom,
          includeSystem: args.includeSystem,
          activeOnly: args.activeOnly,
        });

        if (fields.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No fields found matching the specified criteria.'
            }]
          };
        }

        // Group fields by type
        const fieldsByType: Record<string, typeof fields> = {};
        fields.forEach(field => {
          if (!fieldsByType[field.type]) {
            fieldsByType[field.type] = [];
          }
          fieldsByType[field.type].push(field);
        });

        let content = `# Field Metadata Summary\n\n`;
        
        if (args.objectName) {
          content += `**Object**: ${args.objectName}\n`;
        }
        
        content += `**Total Fields**: ${fields.length}\n`;
        
        if (args.fieldType) {
          content += `**Field Type Filter**: ${args.fieldType}\n`;
        }
        
        content += `\n## Fields by Type\n\n`;

        Object.entries(fieldsByType).forEach(([type, typeFields]) => {
          content += `### ${type} (${typeFields.length})\n\n`;
          
          typeFields.forEach(field => {
            const customIcon = field.isCustom ? '🎨 ' : '';
            const requiredText = field.isNullable ? '' : ' ⚠️';
            
            content += `- ${customIcon}**${field.label}** (${field.name})${requiredText}\n`;
            if (field.description) {
              content += `  ${field.description}\n`;
            }
            if (field.defaultValue) {
              content += `  Default: ${field.defaultValue}\n`;
            }
          });
          
          content += '\n';
        });

        content += `\n---\n💡 **Legend**: 🎨 = Custom field | ⚠️ = Required field\n📝 Total field types found: ${Object.keys(fieldsByType).length}`;

        return {
          content: [{
            type: 'text' as const,
            text: content
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error getting field metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );
}