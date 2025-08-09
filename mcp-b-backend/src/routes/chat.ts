import { createOpenAI } from '@ai-sdk/openai';
import { zValidator } from '@hono/zod-validator';
import { streamText } from 'ai';
import { Env, Hono } from 'hono';
import { z } from 'zod';
import '../../worker-configuration.d.ts';

import { jsonSchema } from "ai";
import { JSONSchema7 } from 'json-schema';

function cleanJsonSchema(schema: JSONSchema7): JSONSchema7 {
  const cloned: any = JSON.parse(JSON.stringify(schema));

  // Helper to process any schema recursively
  function processSchema(s: any): any {
    if (!s || typeof s !== 'object') return s;

    // Handle arrays - ensure they have items
    if (s.type === 'array' || (Array.isArray(s.type) && s.type.includes('array'))) {
      if (!s.items) {
        // Default to object items if not specified
        s.items = { type: 'object' };
      } else {
        s.items = processSchema(s.items);
      }
    }

    // Handle any type - convert to a union of basic types
    if (!s.type && !s.properties && !s.anyOf && !s.oneOf && !s.allOf) {
      // This is likely z.any() - convert to a safe union
      s.anyOf = [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
        { type: 'array', items: { type: 'object' } },
        { type: 'null' }
      ];
    }

    // Process properties recursively
    if (s.properties) {
      for (const key in s.properties) {
        s.properties[key] = processSchema(s.properties[key]);
      }
    }

    // Process array schemas in combinators
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
      if (Array.isArray(s[key])) {
        s[key] = s[key].map(processSchema);
      }
    }

    // Ensure object schemas have proper format
    if (s.type === 'object' || s.properties) {
      s.type = 'object';
      s.properties = s.properties || {};
      const originalRequired = s.required || [];
      s.additionalProperties = false;

      // Process each property
      for (const key in s.properties) {
        const prop = s.properties[key];
        // For properties not originally required, make them accept null
        if (!originalRequired.includes(key)) {
          // Ensure the property accepts null
          if (prop.type && !Array.isArray(prop.type)) {
            prop.type = [prop.type, 'null'];
          } else if (Array.isArray(prop.type) && !prop.type.includes('null')) {
            prop.type.push('null');
          } else if (!prop.type && !prop.anyOf && !prop.oneOf && !prop.allOf) {
            // If no type specified, default to accepting any type including null
            prop.type = ['string', 'number', 'boolean', 'object', 'array', 'null'];
          }
        }
      }

      // For OpenAI strict mode, all properties must be in required array
      s.required = Object.keys(s.properties);
    }

    return s;
  }

  return processSchema(cloned);
}

export const frontendTools = (
  tools: Record<string, { description?: string; parameters: JSONSchema7 }>,
) =>
  Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [
      name,
      {
        description: tool.description,
        parameters: jsonSchema(cleanJsonSchema(tool.parameters)),
      },
    ]),
  );
/**
 * Request body schema for chat endpoint
 */
const PostRequestBodySchema = z.object({
  messages: z.array(z.any()),
  system: z.string().optional(),
  tools: z.any().optional(),
});

/**
 * Chat route handler
 * Handles AI chat functionality using OpenAI models
 */
const chat = new Hono<{ Bindings: Env }>()
  .post('/chat', zValidator('json', PostRequestBodySchema), async (c) => {
    const { messages, system, tools } = c.req.valid('json');
    console.log({ tools, system, messages: JSON.stringify(messages, null, 3) });
    const newTools = frontendTools(tools)

    console.log({ newTools: JSON.stringify(newTools, null, 3) })

    const openai = createOpenAI({
      // @ts-ignore
      apiKey: c.env.OPENAI_API_KEY,
    });

    const result = streamText({
      model: openai('gpt-5', {
        parallelToolCalls: false,
        reasoningEffort: 'low'
      }),
      messages,
      toolCallStreaming: true,
      system,
      tools: {
        ...newTools,
      },
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error('[Chat] Error:', error);
        return error instanceof Error ? error.message : 'Unknown error';
      },
    });
  });

export default chat;