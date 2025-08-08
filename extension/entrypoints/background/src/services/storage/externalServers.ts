import { storage } from '#imports';

export interface ExternalServerMeta {
  name: string;
  lastConnectedAt: number;
  lastDisconnectedAt?: number;
}

export type ExternalServersMap = Record<string, ExternalServerMeta>;

export const externalServersItem = storage.defineItem<ExternalServersMap>(
  'local:external-servers',
  {
    fallback: {},
    version: 1,
  }
);

export async function upsertExternalServer(
  extensionId: string,
  meta: Omit<ExternalServerMeta, 'lastDisconnectedAt'>
): Promise<void> {
  const current = (await externalServersItem.getValue()) ?? {};
  await externalServersItem.setValue({
    ...current,
    [extensionId]: { ...current[extensionId], ...meta },
  });
}

export async function markExternalServerDisconnected(extensionId: string): Promise<void> {
  const current = (await externalServersItem.getValue()) ?? {};
  if (!current[extensionId]) return;
  await externalServersItem.setValue({
    ...current,
    [extensionId]: {
      ...current[extensionId],
      lastDisconnectedAt: Date.now(),
    },
  });
}

export async function removeExternalServer(extensionId: string): Promise<void> {
  const current = (await externalServersItem.getValue()) ?? {};
  if (!(extensionId in current)) return;
  const { [extensionId]: _, ...rest } = current;
  await externalServersItem.setValue(rest);
}

