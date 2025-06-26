import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface PromptApiToolsOptions {
  checkAvailability?: boolean;
  getParams?: boolean;
  createSession?: boolean;
  prompt?: boolean;
  promptStreaming?: boolean;
  append?: boolean;
  measureInputUsage?: boolean;
  manageSession?: boolean;
}

export class PromptApiTools extends BaseApiTools {
  protected apiName = 'Prompt API (LanguageModel)';
  private sessions: Map<string, LanguageModel> = new Map();
  private sessionCounter = 0;

  constructor(server: McpServer, options: PromptApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (typeof LanguageModel === 'undefined') {
        return {
          available: false,
          message: 'LanguageModel API is not defined',
          details:
            'The Prompt API requires Chrome with Gemini Nano support. Check hardware requirements: Windows 10/11, macOS 13+, or Linux with 22GB+ storage and GPU with 4GB+ VRAM.',
        };
      }

      // Check if key methods exist
      if (
        typeof LanguageModel.create !== 'function' ||
        typeof LanguageModel.availability !== 'function' ||
        typeof LanguageModel.params !== 'function'
      ) {
        return {
          available: false,
          message: 'LanguageModel API methods are not available',
          details: 'The API appears to be partially available. Ensure Chrome flags are enabled.',
        };
      }

      return {
        available: true,
        message: 'Prompt API is available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access LanguageModel API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('checkAvailability')) {
      this.registerCheckAvailability();
    }

    if (this.shouldRegisterTool('getParams')) {
      this.registerGetParams();
    }

    if (this.shouldRegisterTool('createSession')) {
      this.registerCreateSession();
    }

    if (this.shouldRegisterTool('prompt')) {
      this.registerPrompt();
    }

    if (this.shouldRegisterTool('promptStreaming')) {
      this.registerPromptStreaming();
    }

    if (this.shouldRegisterTool('append')) {
      this.registerAppend();
    }

    if (this.shouldRegisterTool('measureInputUsage')) {
      this.registerMeasureInputUsage();
    }

    if (this.shouldRegisterTool('manageSession')) {
      this.registerManageSession();
    }
  }

  private registerCheckAvailability(): void {
    this.server.registerTool(
      'check_language_model_availability',
      {
        description: 'Check if the language model is available with specific options',
        inputSchema: {
          topK: z.number().optional().describe('Top-K value for the model'),
          temperature: z.number().optional().describe('Temperature value (0.0-2.0)'),
          expectedInputTypes: z
            .array(z.enum(['text', 'image', 'audio']))
            .optional()
            .describe('Expected input types'),
          expectedInputLanguages: z
            .array(z.string())
            .optional()
            .describe('Expected input languages (ISO codes)'),
          expectedOutputLanguages: z
            .array(z.string())
            .optional()
            .describe('Expected output languages (ISO codes)'),
        },
      },
      async (params) => {
        try {
          const options: any = {};

          if (params.topK !== undefined) options.topK = params.topK;
          if (params.temperature !== undefined) options.temperature = params.temperature;

          // Build expected inputs/outputs
          if (params.expectedInputTypes || params.expectedInputLanguages) {
            options.expectedInputs = (params.expectedInputTypes || ['text']).map((type) => ({
              type,
              languages: params.expectedInputLanguages,
            }));
          }

          if (params.expectedOutputLanguages) {
            options.expectedOutputs = [
              {
                type: 'text',
                languages: params.expectedOutputLanguages,
              },
            ];
          }

          const availability = await LanguageModel.availability(options);

          return this.formatJson({
            availability,
            description:
              availability === 'unavailable'
                ? 'Model or requested options not supported'
                : availability === 'downloadable'
                  ? 'Model needs to be downloaded'
                  : availability === 'downloading'
                    ? 'Model is currently downloading'
                    : 'Model is ready to use',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetParams(): void {
    this.server.registerTool(
      'get_language_model_params',
      {
        description: "Get the language model's parameter limits and defaults",
        inputSchema: {},
      },
      async () => {
        try {
          const params = await LanguageModel.params();

          if (!params) {
            return this.formatError('Language model not available');
          }

          return this.formatJson({
            defaultTopK: params.defaultTopK,
            maxTopK: params.maxTopK,
            defaultTemperature: params.defaultTemperature,
            maxTemperature: params.maxTemperature,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCreateSession(): void {
    this.server.registerTool(
      'create_language_model_session',
      {
        description: 'Create a new language model session',
        inputSchema: {
          systemPrompt: z
            .string()
            .optional()
            .describe('System prompt to set the context for the session'),
          temperature: z.number().optional().describe('Temperature value (0.0-2.0)'),
          topK: z.number().optional().describe('Top-K value for the model'),
          initialMessages: z
            .array(
              z.object({
                role: z.enum(['user', 'assistant']).describe('Message role'),
                content: z.string().describe('Message content'),
              })
            )
            .optional()
            .describe('Initial conversation messages after system prompt'),
        },
      },
      async ({ systemPrompt, temperature, topK, initialMessages }) => {
        try {
          const createOptions: any = {};

          // Add parameters if provided
          if (temperature !== undefined) createOptions.temperature = temperature;
          if (topK !== undefined) createOptions.topK = topK;

          // Build initial prompts
          if (systemPrompt || initialMessages) {
            createOptions.initialPrompts = [];
            if (systemPrompt) {
              createOptions.initialPrompts.push({
                role: 'system',
                content: systemPrompt,
              });
            }
            if (initialMessages) {
              createOptions.initialPrompts.push(...initialMessages);
            }
          }

          const session = await LanguageModel.create(createOptions);

          // Store session with an ID
          const sessionId = `session_${++this.sessionCounter}`;
          this.sessions.set(sessionId, session);

          return this.formatSuccess('Language model session created successfully', {
            sessionId,
            temperature: session.temperature,
            topK: session.topK,
            inputQuota: session.inputQuota,
            inputUsage: session.inputUsage,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerPrompt(): void {
    this.server.registerTool(
      'prompt_language_model',
      {
        description: 'Send a prompt to a language model session and get the complete response',
        inputSchema: {
          sessionId: z.string().describe('The ID of the session to prompt'),
          prompt: z.string().describe('The prompt text to send'),
          responseConstraint: z
            .union([
              z.object({}).passthrough().describe('JSON schema constraint'),
              z
                .string()
                .regex(/^\/.*\/[gimsuvy]*$/)
                .describe('RegExp pattern as string'),
            ])
            .optional()
            .describe('Constraint for the response format'),
        },
      },
      async ({ sessionId, prompt, responseConstraint }) => {
        try {
          const session = this.sessions.get(sessionId);
          if (!session) {
            return this.formatError(`Session ${sessionId} not found`);
          }

          const options: any = {};

          // Handle response constraint
          if (responseConstraint) {
            if (typeof responseConstraint === 'string') {
              // Convert string regex to RegExp
              const match = responseConstraint.match(/^\/(.*)\/([gimsuvy]*)$/);
              if (match) {
                options.responseConstraint = new RegExp(match[1], match[2]);
              }
            } else {
              options.responseConstraint = responseConstraint;
            }
          }

          const response = await session.prompt(prompt, options);

          return this.formatSuccess('Prompt completed successfully', {
            response,
            inputUsage: session.inputUsage,
            remainingQuota: session.inputQuota - session.inputUsage,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerPromptStreaming(): void {
    this.server.registerTool(
      'prompt_language_model_streaming',
      {
        description:
          'Send a prompt to a language model session and get a streaming response (returns first chunk)',
        inputSchema: {
          sessionId: z.string().describe('The ID of the session to prompt'),
          prompt: z.string().describe('The prompt text to send'),
          maxChunks: z
            .number()
            .optional()
            .default(5)
            .describe('Maximum number of chunks to collect before returning'),
        },
      },
      async ({ sessionId, prompt, maxChunks = 5 }) => {
        try {
          const session = this.sessions.get(sessionId);
          if (!session) {
            return this.formatError(`Session ${sessionId} not found`);
          }

          const stream = session.promptStreaming(prompt);
          const chunks: string[] = [];
          let chunkCount = 0;

          for await (const chunk of stream as any) {
            chunks.push(chunk);
            chunkCount++;
            if (chunkCount >= maxChunks) {
              break;
            }
          }

          return this.formatSuccess('Streaming prompt started', {
            collectedChunks: chunks,
            totalChunksCollected: chunkCount,
            partialResponse: chunks.join(''),
            note: `Collected first ${chunkCount} chunks. Full response continues streaming.`,
            inputUsage: session.inputUsage,
            remainingQuota: session.inputQuota - session.inputUsage,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerAppend(): void {
    this.server.registerTool(
      'append_to_language_model_session',
      {
        description: 'Append messages to a session without prompting for a response',
        inputSchema: {
          sessionId: z.string().describe('The ID of the session to append to'),
          messages: z
            .array(
              z.object({
                role: z.enum(['user', 'assistant']).describe('Message role'),
                content: z.string().describe('Message content'),
              })
            )
            .describe('Messages to append to the session'),
        },
      },
      async ({ sessionId, messages }) => {
        try {
          const session = this.sessions.get(sessionId);
          if (!session) {
            return this.formatError(`Session ${sessionId} not found`);
          }

          await session.append(messages);

          return this.formatSuccess('Messages appended successfully', {
            messagesAppended: messages.length,
            inputUsage: session.inputUsage,
            remainingQuota: session.inputQuota - session.inputUsage,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerMeasureInputUsage(): void {
    this.server.registerTool(
      'measure_language_model_input_usage',
      {
        description: 'Measure how many tokens a prompt would consume without sending it',
        inputSchema: {
          sessionId: z.string().describe('The ID of the session'),
          prompt: z.string().describe('The prompt text to measure'),
        },
      },
      async ({ sessionId, prompt }) => {
        try {
          const session = this.sessions.get(sessionId);
          if (!session) {
            return this.formatError(`Session ${sessionId} not found`);
          }

          const usage = await session.measureInputUsage(prompt);

          return this.formatJson({
            tokenUsage: usage,
            currentUsage: session.inputUsage,
            totalQuota: session.inputQuota,
            remainingQuota: session.inputQuota - session.inputUsage,
            wouldFitInContext: usage <= session.inputQuota - session.inputUsage,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerManageSession(): void {
    // List sessions
    this.server.registerTool(
      'list_language_model_sessions',
      {
        description: 'List all active language model sessions',
        inputSchema: {},
      },
      async () => {
        try {
          const sessionList = Array.from(this.sessions.entries()).map(([id, session]) => ({
            sessionId: id,
            temperature: session.temperature,
            topK: session.topK,
            inputUsage: session.inputUsage,
            inputQuota: session.inputQuota,
            usagePercentage: Math.round((session.inputUsage / session.inputQuota) * 100),
          }));

          return this.formatJson({
            count: sessionList.length,
            sessions: sessionList,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    // Clone session
    this.server.registerTool(
      'clone_language_model_session',
      {
        description: 'Clone an existing language model session',
        inputSchema: {
          sessionId: z.string().describe('The ID of the session to clone'),
        },
      },
      async ({ sessionId }) => {
        try {
          const session = this.sessions.get(sessionId);
          if (!session) {
            return this.formatError(`Session ${sessionId} not found`);
          }

          const clonedSession = await session.clone();
          const clonedSessionId = `session_${++this.sessionCounter}`;
          this.sessions.set(clonedSessionId, clonedSession);

          return this.formatSuccess('Session cloned successfully', {
            originalSessionId: sessionId,
            clonedSessionId,
            temperature: clonedSession.temperature,
            topK: clonedSession.topK,
            inputQuota: clonedSession.inputQuota,
            inputUsage: clonedSession.inputUsage,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    // Destroy session
    this.server.registerTool(
      'destroy_language_model_session',
      {
        description: 'Destroy a language model session and free resources',
        inputSchema: {
          sessionId: z.string().describe('The ID of the session to destroy'),
        },
      },
      async ({ sessionId }) => {
        try {
          const session = this.sessions.get(sessionId);
          if (!session) {
            return this.formatError(`Session ${sessionId} not found`);
          }

          session.destroy();
          this.sessions.delete(sessionId);

          return this.formatSuccess('Session destroyed successfully', {
            sessionId,
            remainingSessions: this.sessions.size,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
