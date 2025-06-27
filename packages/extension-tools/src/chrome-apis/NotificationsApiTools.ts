import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface NotificationsApiToolsOptions {
  createNotification?: boolean;
  updateNotification?: boolean;
  clearNotification?: boolean;
  getAllNotifications?: boolean;
  getPermissionLevel?: boolean;
}

export class NotificationsApiTools extends BaseApiTools {
  protected apiName = 'Notifications';

  constructor(server: McpServer, options: NotificationsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.notifications) {
        return {
          available: false,
          message: 'chrome.notifications API is not defined',
          details: 'This extension needs the "notifications" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.notifications.getPermissionLevel !== 'function') {
        return {
          available: false,
          message: 'chrome.notifications.getPermissionLevel is not available',
          details:
            'The notifications API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.notifications.getPermissionLevel((_level) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Notifications API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.notifications API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('createNotification')) {
      this.registerCreateNotification();
    }

    if (this.shouldRegisterTool('updateNotification')) {
      this.registerUpdateNotification();
    }

    if (this.shouldRegisterTool('clearNotification')) {
      this.registerClearNotification();
    }

    if (this.shouldRegisterTool('getAllNotifications')) {
      this.registerGetAllNotifications();
    }

    if (this.shouldRegisterTool('getPermissionLevel')) {
      this.registerGetPermissionLevel();
    }
  }

  private registerCreateNotification(): void {
    this.server.registerTool(
      'extension_tool_create_notification',
      {
        description: 'Create and display a notification',
        inputSchema: {
          notificationId: z
            .string()
            .optional()
            .describe(
              'Identifier of the notification. If not set, an ID will be auto-generated. Max 500 characters'
            ),
          type: z
            .enum(['basic', 'image', 'list', 'progress'])
            .describe('Type of notification template to use'),
          iconUrl: z.string().describe('URL to the notification icon'),
          title: z.string().describe('Title of the notification'),
          message: z.string().describe('Main notification content'),
          contextMessage: z
            .string()
            .optional()
            .describe('Alternate notification content with lower-weight font'),
          priority: z
            .number()
            .min(-2)
            .max(2)
            .optional()
            .describe('Priority from -2 (lowest) to 2 (highest). Default is 0'),
          eventTime: z
            .number()
            .optional()
            .describe('Timestamp in milliseconds past epoch (e.g. Date.now() + n)'),
          buttons: z
            .array(
              z.object({
                title: z.string().describe('Button text'),
                iconUrl: z.string().optional().describe('Button icon URL (deprecated on Mac)'),
              })
            )
            .max(2)
            .optional()
            .describe('Up to two notification action buttons'),
          imageUrl: z
            .string()
            .optional()
            .describe('URL to image thumbnail for image-type notifications (deprecated on Mac)'),
          items: z
            .array(
              z.object({
                title: z.string().describe('Item title'),
                message: z.string().describe('Item details'),
              })
            )
            .optional()
            .describe('Items for list-type notifications (only first item visible on Mac)'),
          progress: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe('Progress value from 0 to 100 for progress-type notifications'),
          isClickable: z
            .boolean()
            .optional()
            .describe('Whether notification is clickable (deprecated since Chrome 67)'),
          requireInteraction: z
            .boolean()
            .optional()
            .describe('Whether notification should remain visible until user interaction'),
          silent: z.boolean().optional().describe('Whether to suppress sounds and vibrations'),
        },
      },
      async ({
        notificationId,
        type,
        iconUrl,
        title,
        message,
        contextMessage,
        priority,
        eventTime,
        buttons,
        imageUrl,
        items,
        progress,
        isClickable,
        requireInteraction,
        silent,
      }) => {
        try {
          const options: chrome.notifications.NotificationCreateOptions = {
            type: type as chrome.notifications.TemplateType,
            iconUrl,
            title,
            message,
          };

          if (contextMessage !== undefined) options.contextMessage = contextMessage;
          if (priority !== undefined) options.priority = priority;
          if (eventTime !== undefined) options.eventTime = eventTime;
          if (buttons !== undefined) options.buttons = buttons;
          if (imageUrl !== undefined) options.imageUrl = imageUrl;
          if (items !== undefined) options.items = items;
          if (progress !== undefined) options.progress = progress;
          if (isClickable !== undefined) options.isClickable = isClickable;
          if (requireInteraction !== undefined) options.requireInteraction = requireInteraction;
          if (silent !== undefined) options.silent = silent;

          const createdId = await new Promise<string>((resolve, reject) => {
            if (notificationId) {
              chrome.notifications.create(notificationId, options, (id) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(id);
                }
              });
            } else {
              chrome.notifications.create(options, (id) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(id);
                }
              });
            }
          });

          return this.formatSuccess('Notification created successfully', {
            notificationId: createdId,
            type,
            title,
            message,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateNotification(): void {
    this.server.registerTool(
      'extension_tool_update_notification',
      {
        description: 'Update an existing notification',
        inputSchema: {
          notificationId: z.string().describe('ID of the notification to update'),
          type: z
            .enum(['basic', 'image', 'list', 'progress'])
            .optional()
            .describe('Type of notification template to use'),
          iconUrl: z.string().optional().describe('URL to the notification icon'),
          title: z.string().optional().describe('Title of the notification'),
          message: z.string().optional().describe('Main notification content'),
          contextMessage: z
            .string()
            .optional()
            .describe('Alternate notification content with lower-weight font'),
          priority: z
            .number()
            .min(-2)
            .max(2)
            .optional()
            .describe('Priority from -2 (lowest) to 2 (highest)'),
          eventTime: z.number().optional().describe('Timestamp in milliseconds past epoch'),
          buttons: z
            .array(
              z.object({
                title: z.string().describe('Button text'),
                iconUrl: z.string().optional().describe('Button icon URL'),
              })
            )
            .max(2)
            .optional()
            .describe('Up to two notification action buttons'),
          imageUrl: z.string().optional().describe('URL to image thumbnail'),
          items: z
            .array(
              z.object({
                title: z.string().describe('Item title'),
                message: z.string().describe('Item details'),
              })
            )
            .optional()
            .describe('Items for list-type notifications'),
          progress: z.number().min(0).max(100).optional().describe('Progress value from 0 to 100'),
          requireInteraction: z
            .boolean()
            .optional()
            .describe('Whether notification should remain visible until user interaction'),
          silent: z.boolean().optional().describe('Whether to suppress sounds and vibrations'),
        },
      },
      async ({
        notificationId,
        type,
        iconUrl,
        title,
        message,
        contextMessage,
        priority,
        eventTime,
        buttons,
        imageUrl,
        items,
        progress,
        requireInteraction,
        silent,
      }) => {
        try {
          const options: chrome.notifications.NotificationOptions = {};

          if (type !== undefined) options.type = type as chrome.notifications.TemplateType;
          if (iconUrl !== undefined) options.iconUrl = iconUrl;
          if (title !== undefined) options.title = title;
          if (message !== undefined) options.message = message;
          if (contextMessage !== undefined) options.contextMessage = contextMessage;
          if (priority !== undefined) options.priority = priority;
          if (eventTime !== undefined) options.eventTime = eventTime;
          if (buttons !== undefined) options.buttons = buttons;
          if (imageUrl !== undefined) options.imageUrl = imageUrl;
          if (items !== undefined) options.items = items;
          if (progress !== undefined) options.progress = progress;
          if (requireInteraction !== undefined) options.requireInteraction = requireInteraction;
          if (silent !== undefined) options.silent = silent;

          const wasUpdated = await new Promise<boolean>((resolve, reject) => {
            chrome.notifications.update(notificationId, options, (wasUpdated) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(wasUpdated);
              }
            });
          });

          if (wasUpdated) {
            return this.formatSuccess('Notification updated successfully', {
              notificationId,
              updatedFields: Object.keys(options),
            });
          } else {
            return this.formatSuccess('Notification not found or could not be updated', {
              notificationId,
            });
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearNotification(): void {
    this.server.registerTool(
      'extension_tool_clear_notification',
      {
        description: 'Clear a specific notification',
        inputSchema: {
          notificationId: z.string().describe('ID of the notification to clear'),
        },
      },
      async ({ notificationId }) => {
        try {
          const wasCleared = await new Promise<boolean>((resolve, reject) => {
            chrome.notifications.clear(notificationId, (wasCleared) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(wasCleared);
              }
            });
          });

          if (wasCleared) {
            return this.formatSuccess('Notification cleared successfully', { notificationId });
          } else {
            return this.formatSuccess('Notification not found or already cleared', {
              notificationId,
            });
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAllNotifications(): void {
    this.server.registerTool(
      'extension_tool_get_all_notifications',
      {
        description: 'Get all active notifications for this extension',
        inputSchema: {},
      },
      async () => {
        try {
          const notifications = await new Promise<{ [key: string]: any }>((resolve, reject) => {
            chrome.notifications.getAll((notifications) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(notifications);
              }
            });
          });

          const notificationIds = Object.keys(notifications);

          return this.formatJson({
            count: notificationIds.length,
            notificationIds,
            notifications,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPermissionLevel(): void {
    this.server.registerTool(
      'extension_tool_get_permission_level',
      {
        description: 'Get the current notification permission level for this extension',
        inputSchema: {},
      },
      async () => {
        try {
          const level = await new Promise<chrome.notifications.PermissionLevel>(
            (resolve, reject) => {
              chrome.notifications.getPermissionLevel((level) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(level as any);
                }
              });
            }
          );

          return this.formatJson({
            permissionLevel: level,
            canShowNotifications: level === 'granted',
            description:
              level === 'granted'
                ? 'User has granted permission to show notifications'
                : 'User has denied permission to show notifications',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
