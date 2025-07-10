import type { z } from 'zod';
import { convertJsonSchemaToZod } from 'zod-from-json-schema';
import type { PendingRequest, RequestResponse } from '../../types';

/**
 * Manages async request/response communication with content scripts
 */
export class RequestManager {
  private pending = new Map<string, PendingRequest>();

  create<T = unknown>(port: chrome.runtime.Port, message: object): Promise<T> {
    const requestId = `${Date.now()}-${Math.random()}`;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      port.postMessage({ ...message, requestId });

      // 30-second timeout
      setTimeout(() => {
        if (this.pending.has(requestId)) {
          this.pending.delete(requestId);
          reject(new Error(`Request timed out`));
        }
      }, 30000);
    });
  }

  resolve<T = unknown>(requestId: string, data: RequestResponse<T>) {
    const callbacks = this.pending.get(requestId);
    if (callbacks) {
      if (data.success) {
        callbacks.resolve(data.payload);
      } else {
        callbacks.reject(new Error(String(data.payload)));
      }
      this.pending.delete(requestId);
    }
  }
}

export function jsonSchemaToZodShapeCustom(jsonSchema: any) {
  if (!jsonSchema.properties) {
    throw new Error('JSON Schema must have properties');
  }

  const zodShape: Record<string, z.ZodTypeAny> = {};

  // Convert each property individually
  for (const [key, propertySchema] of Object.entries(jsonSchema.properties)) {
    zodShape[key] = convertJsonSchemaToZod(propertySchema as any) as any;
  }

  return zodShape;
}
