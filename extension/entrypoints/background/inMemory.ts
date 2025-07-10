import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const transport = InMemoryTransport.createLinkedPair();
export const [clientTransport, serverTransport] = transport;
