import { buildZodFieldConfig } from '@autoform/react';
import { ZodProvider } from '@autoform/zod';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { FieldTypes } from '../components/ui/autoform';

const fieldConfig = buildZodFieldConfig<FieldTypes>();

interface JsonSchemaProperty {
  type?: string | string[];
  enum?: string[];
  description?: string;
  format?: string;
  pattern?: string;
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JsonSchemaProperty;
}

function formatFieldLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function jsonSchemaToZod(
  prop: JsonSchemaProperty,
  isRequired: boolean = true,
  fieldName?: string
): z.ZodTypeAny {
  let zodType: z.ZodTypeAny;

  const propType = Array.isArray(prop.type) ? prop.type[0] : prop.type;

  switch (propType) {
    case 'string':
      if (prop.enum && prop.enum.length > 0) {
        // Create enum with proper typing
        zodType = z.enum(prop.enum as [string, ...string[]]);
      } else {
        zodType = z.string();

        // Apply string validations
        if (prop.minLength !== undefined) {
          zodType = (zodType as z.ZodString).min(prop.minLength, {
            message: `Must be at least ${prop.minLength} characters`,
          });
        }
        if (prop.maxLength !== undefined) {
          zodType = (zodType as z.ZodString).max(prop.maxLength, {
            message: `Must be at most ${prop.maxLength} characters`,
          });
        }
        if (prop.pattern) {
          zodType = (zodType as z.ZodString).regex(new RegExp(prop.pattern), {
            message: `Must match pattern: ${prop.pattern}`,
          });
        }

        // Handle specific formats
        if (prop.format === 'email') {
          zodType = (zodType as z.ZodString).email();
        } else if (prop.format === 'uri' || prop.format === 'url') {
          zodType = (zodType as z.ZodString).url();
        } else if (prop.format === 'date-time') {
          zodType = z.coerce.date();
        }
      }
      break;

    case 'number':
    case 'integer': {
      zodType = z.coerce.number();

      // Apply number validations - need to cast to ZodNumber
      const numberZod = zodType as z.ZodNumber;
      if (prop.minimum !== undefined) {
        zodType = numberZod.min(prop.minimum, {
          message: `Must be at least ${prop.minimum}`,
        });
      }
      if (prop.maximum !== undefined) {
        zodType = numberZod.max(prop.maximum, {
          message: `Must be at most ${prop.maximum}`,
        });
      }
      if (propType === 'integer') {
        zodType = numberZod.int({ message: 'Must be an integer' });
      }
      break;
    }

    case 'boolean':
      zodType = z.boolean();
      break;

    case 'array':
      if (prop.items) {
        const itemSchema = jsonSchemaToZod(prop.items, true);
        zodType = z.array(itemSchema);
      } else {
        zodType = z.array(z.unknown());
      }
      break;

    case 'object':
      if (prop.properties) {
        const shape: z.ZodRawShape = {};
        const requiredFields = prop.required || [];

        Object.entries(prop.properties).forEach(([key, subProp]) => {
          const isSubRequired = requiredFields.includes(key);
          shape[key] = jsonSchemaToZod(subProp, isSubRequired, key);
        });

        const objectZod = z.object(shape);

        if (prop.additionalProperties === false) {
          zodType = objectZod.strict();
        } else {
          zodType = objectZod;
        }
      } else {
        zodType = z.record(z.unknown());
      }
      break;

    default:
      zodType = z.unknown();
  }

  // Set the label using describe (this will be the field name)
  if (fieldName) {
    zodType = zodType.describe(formatFieldLabel(fieldName));
  }

  // Add default value
  if (prop.default !== undefined) {
    zodType = zodType.default(prop.default);
  }

  // Make optional if not required (except for booleans which should always be required)
  if (!isRequired && propType !== 'boolean') {
    zodType = zodType.optional();
  }

  // Apply field config for additional UI customization including description
  const configOptions: Parameters<typeof fieldConfig>[0] = {};

  // Add description as a separate field (not as the label)
  if (prop.description) {
    configOptions.description = prop.description;
  }

  // Add input type hints based on format
  if (prop.format === 'password') {
    configOptions.inputProps = {
      type: 'password',
      placeholder:
        prop.description ||
        `Enter ${fieldName ? formatFieldLabel(fieldName).toLowerCase() : 'value'}`,
    };
  } else if (prop.format === 'email') {
    configOptions.inputProps = {
      type: 'email',
      placeholder: prop.description || 'Enter email address',
    };
  } else if (prop.format === 'tel') {
    configOptions.inputProps = {
      type: 'tel',
      placeholder: prop.description || 'Enter phone number',
    };
  } else if (prop.format === 'url') {
    configOptions.inputProps = {
      type: 'url',
      placeholder: prop.description || 'Enter URL',
    };
  } else if (prop.description) {
    // For other fields, use description as placeholder
    configOptions.inputProps = {
      placeholder: prop.description,
    };
  }

  // Only apply superRefine if we have config options
  if (Object.keys(configOptions).length > 0) {
    zodType = zodType.superRefine(fieldConfig(configOptions));
  }

  return zodType;
}

/**
 * Convert MCP tools to Zod schemas for AutoForm
 */
export function mcpToolsToZodSchemas(mcpTools: McpTool[]): Record<string, ZodProvider<any>> {
  const schemas: Record<string, ZodProvider<any>> = {};

  mcpTools.forEach((tool) => {
    if (tool.inputSchema?.type === 'object' && tool.inputSchema.properties) {
      const schemaShape: z.ZodRawShape = {};
      const requiredFields = (tool.inputSchema.required as string[]) || [];

      Object.entries(tool.inputSchema.properties as Record<string, JsonSchemaProperty>).forEach(
        ([key, prop]) => {
          const isRequired = requiredFields.includes(key);
          schemaShape[key] = jsonSchemaToZod(prop, isRequired, key);
        }
      );

      const zodSchema = z.object(schemaShape);
      const strictSchema =
        tool.inputSchema.additionalProperties === false ? zodSchema.strict() : zodSchema;

      schemas[tool.name] = new ZodProvider(strictSchema);
    } else if (
      !tool.inputSchema ||
      (tool.inputSchema.type === 'object' && !tool.inputSchema.properties)
    ) {
      // Handle tools with no input or empty object input
      schemas[tool.name] = new ZodProvider(z.object({}));
    }
  });

  return schemas;
}
