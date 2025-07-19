/**
 * Extension configuration management with Zod validation
 * Handles environment variables and provides typed access to configuration values
 */

import { z } from 'zod';

/**
 * Configuration schema using Zod
 */
const ConfigSchema = z.object({
  api: z.object({
    baseUrl: z.string().url('API base URL must be a valid URL'),
    chatEndpoint: z.string().min(1, 'Chat endpoint cannot be empty'),
    fullChatUrl: z.string().url('Chat API URL must be a valid URL'),
  }),
  features: z.object({
    enableDebugLogging: z.boolean(),
    maxChatSteps: z.number().int().min(1).max(100),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Get environment variable value
 */
function getEnvVar(key: string): string | undefined {
  // In Vite, environment variables are available on import.meta.env
  // @ts-ignore - import.meta.env is available in Vite
  return import.meta.env?.[key];
}

/**
 * Parse and validate configuration from environment variables
 * Throws an error if configuration is invalid
 */
function loadConfig(): Config {
  try {
    // Get raw values from environment
    const rawConfig = {
      api: {
        baseUrl: getEnvVar('VITE_API_BASE_URL') || 'https://my-react-app.alexmnahas.workers.dev',
        chatEndpoint: getEnvVar('VITE_API_CHAT_ENDPOINT') || '/api/chat',
        fullChatUrl: '', // Will be computed below
      },
      features: {
        enableDebugLogging: getEnvVar('VITE_ENABLE_DEBUG_LOGGING') === 'true',
        maxChatSteps: parseInt(getEnvVar('VITE_MAX_CHAT_STEPS') || '5', 10),
      },
    };

    // Handle full chat URL override or construct from parts
    const chatUrlOverride = getEnvVar('VITE_CHAT_API_URL');
    rawConfig.api.fullChatUrl = chatUrlOverride || 
      `${rawConfig.api.baseUrl}${rawConfig.api.chatEndpoint}`;

    // Validate configuration
    const validatedConfig = ConfigSchema.parse(rawConfig);
    
    // Log configuration in development mode if debug logging is enabled
    if (import.meta.env?.DEV && validatedConfig.features.enableDebugLogging) {
      console.log('[Config] Loaded configuration:', {
        api: {
          baseUrl: validatedConfig.api.baseUrl,
          chatEndpoint: validatedConfig.api.chatEndpoint,
          fullChatUrl: validatedConfig.api.fullChatUrl,
        },
        features: validatedConfig.features,
      });
    }

    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(
        `Invalid extension configuration:\n${errorMessages}\n\n` +
        `Please check your environment variables in .env file.`
      );
    }
    
    throw new Error(
      `Failed to load extension configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extension configuration singleton
 * Validates and loads configuration on first access
 */
export const config: Config = loadConfig();

/**
 * Re-export the Config type for use in other files
 */
export type { Config as ExtensionConfig }; 