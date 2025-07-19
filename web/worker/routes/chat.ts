import { createOpenAI } from '@ai-sdk/openai';
import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { zValidator } from '@hono/zod-validator';
import { streamText } from 'ai';
import { Hono } from 'hono';
import { z } from 'zod';

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

  /**
   * POST /api/chat
   * AI chat endpoint that streams responses using OpenAI models
   * Body parameters:
   * - messages: Array of chat messages
   * - system: Optional system prompt
   * - tools: Optional tools configuration for function calling
   */
  .post('/api/chat', zValidator('json', PostRequestBodySchema), async (c) => {
    const { messages, system, tools } = c.req.valid('json');
    // console.log({ tools, system, messages: JSON.stringify(messages, null, 2) });

    // Initialize OpenAI client with API key from environment
    const openai = createOpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });
    // Stream text generation with tool calling support
    const result = streamText({
      model: openai('gpt-4o', { parallelToolCalls: false }),
      messages,
      toolCallStreaming: true,
      system,

      tools: {
        ...frontendTools(tools),
        // ...formTools, TODO: need to figure out how this works
      },

      // onError: console.log,
    });

    // Return streaming response
    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error('[Chat] Error:', error);
        return error instanceof Error ? error.message : 'Unknown error';
      },
    });
  });

export default chat;
