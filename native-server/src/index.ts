#!/usr/bin/env node
import { appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import nativeMessagingHostInstance from './native-messaging-host';
import serverInstance from './server';
import { logger } from './util/logger';

// const logFile = join(__dirname, 'native-server.log');

// const log = (message: string) => {
//   const timestamp = new Date().toISOString();
//   const logMessage = `[${timestamp}] ${message}\n`;
//   try {
//     appendFileSync(logFile, logMessage);
//   } catch (error) {
//     // If we can't write to log, silently continue
//   }
// };

try {
  logger.info('Starting native server...');
  serverInstance.setNativeHost(nativeMessagingHostInstance); // Server needs setNativeHost method
  nativeMessagingHostInstance.setServer(serverInstance); // NativeHost needs setServer method
  nativeMessagingHostInstance.start();
  logger.info('Native server started successfully');
} catch (error) {
  logger.error(`Error starting server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

process.on('error', (error) => {
  logger.error(`Process error: ${error.message}`);
  process.exit(1);
});

// Handle process signals and uncaught exceptions
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('exit', (code) => {
  logger.info(`Process exiting with code: ${code}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}\nStack: ${error.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  // Don't exit immediately, let the program continue running
});
