import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { zValidator } from '@hono/zod-validator';
import { convertToModelMessages, streamText } from 'ai';

import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { Context, Env, Hono } from 'hono';
import { z } from 'zod';
import '../../worker-configuration.d.ts';

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

    const result = streamText({
      model: getModel(c),

      system,
      messages: convertToModelMessages(messages),
      tools: {
        ...frontendTools(tools),
      },
    });

    return result.toUIMessageStreamResponse();
  }
);

export default chat;
