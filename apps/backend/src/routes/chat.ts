import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { zValidator } from '@hono/zod-validator';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';

import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { Context, Env, Hono } from 'hono';
import { z } from 'zod';

/**
 * Request body schema for chat endpoint
 */
const PostRequestBodySchema = z.object({
  messages: z.array(z.any()),
  system: z.string().optional(),
  tools: z.any().optional(),
});

export const maxDuration = 30;

function getModel(c: Context<{ Bindings: Env }>) {
  // @ts-ignore
  if (c.env.MODEL_PROVIDER) {
    // @ts-ignore
    if (c.env.MODEL_PROVIDER === 'openai') {
      // @ts-ignore
      const modelName = c.env.OPENAI_MODEL_NAME ?? 'gpt-4o-mini';
      return openai(modelName);
    }
    // @ts-ignore
    if (c.env.MODEL_PROVIDER === 'anthropic') {
      // @ts-ignore
      return anthropic(c.env.ANTHROPIC_MODEL_NAME ?? 'claude-sonnet-4-20250514');
    }
  }
  // default fallback
  return anthropic('claude-sonnet-4-20250514');
}

/**
 * Chat route handler
 * Handles AI chat functionality using OpenAI models
 */
const chat = new Hono<{ Bindings: Env }>().post(
  '/chat',
  zValidator('json', PostRequestBodySchema),
  async (c) => {
    const { messages, system, tools } = c.req.valid('json');
    const frontendToolsThatDoNotRegisterAsTools = frontendTools(tools);

    const result = streamText({
      model: getModel(c),
      system,
      messages: convertToModelMessages(messages),
      stopWhen: (params) =>{
        console.log(params.steps);
        if (stepCountIs(10)) {
          return true;
        }
        return false;
      },
      tools: {
        ...frontendToolsThatDoNotRegisterAsTools,
        toolThatRegistersAsATool: {
          description: 'Will wait for a given number of seconds',
          inputSchema: z.object({
            time: z.number(),
          }),
          execute: async (input) => {
            await new Promise((resolve) => setTimeout(resolve, input.time * 1000));
            return {
              content: 'Tool executed',
            };
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  }
);

export default chat;
