// import Dexie, { type EntityTable } from 'dexie';

// // Import entity types and schemas
// import {
//     type UserScriptAddData,
//     type UserScript as UserScriptType,
//     type UserScriptUpdateData,
//     userScriptAddSchema,
//     userScriptSchema
// } from './entities/UserScript';
// import {
//     type UserScriptExecutionAddData,
//     type UserScriptExecution as UserScriptExecutionType,
//     userScriptExecutionAddSchema,
//     userScriptExecutionSchema
// } from './entities/UserScriptExecution';
// import {
//     type UserScriptSettingsAddData,
//     type UserScriptSettings as UserScriptSettingsType,
//     type UserScriptSettingsUpdateData,
//     userScriptSettingsAddSchema,
//     userScriptSettingsSchema
// } from './entities/UserScriptSettings';
// import {
//     type UserScriptVersionAddData,
//     type UserScriptVersion as UserScriptVersionType,
//     userScriptVersionAddSchema,
//     userScriptVersionSchema
// } from './entities/UserScriptVersion';

// class UserScriptDatabase extends Dexie {
//     // Define tables using EntityTable for better type safety
//     userScripts!: EntityTable<UserScriptType, 'id'>;
//     userScriptVersions!: EntityTable<UserScriptVersionType, 'id'>;
//     userScriptExecutions!: EntityTable<UserScriptExecutionType, 'id'>;
//     userScriptSettings!: EntityTable<UserScriptSettingsType, 'id'>;

//     constructor() {
//         super('UserScriptDB'); // Database name

//         // Define schema version 1
//         this.version(1).stores({
//             userScripts: '++id, name, namespace, enabled, version, createdAt, updatedAt, *matches, *excludes',
//             userScriptVersions: '++id, userScriptId, version, isActive, createdAt',
//             userScriptExecutions: '++id, userScriptId, tabId, status, domain, createdAt',
//             userScriptSettings: '++id, userScriptId, priority, injectionMode, updatedAt',
//         });
//     }

//     // --- Helper to handle errors ---
//     private handleError(operation: string, error: unknown): never {
//         console.error(`[UserScriptDB] ${operation} failed:`, error);
//         throw new Error(`${operation} failed: ${error instanceof Error ? error.message : String(error)}`);
//     }

//     // == UserScript Methods ==

//     async addUserScript(data: UserScriptAddData): Promise<number> {
//         try {
//             const validatedData = userScriptAddSchema.parse(data);

//             // Check for duplicate name/namespace combination
//             const existing = await this.userScripts
//                 .where('name')
//                 .equals(validatedData.name)
//                 .and(script => script.namespace === validatedData.namespace)
//                 .first();

//             if (existing) {
//                 throw new Error(`UserScript with name "${validatedData.name}" and namespace "${validatedData.namespace}" already exists`);
//             }

//             const now = new Date();
//             const scriptToAdd: Omit<UserScriptType, 'id'> = {
//                 ...validatedData,
//                 createdAt: now,
//                 updatedAt: now,
//                 lastModified: now,
//             };

//             const scriptId = await this.userScripts.add(scriptToAdd);

//             // Create default settings for the script
//             const defaultSettings: UserScriptSettingsAddData = {
//                 userScriptId: scriptId,
//                 autoUpdate: true,
//                 updateInterval: 24, // 24 hours
//                 requireSecureOrigin: true,
//                 enabledDomains: null,
//                 disabledDomains: null,
//                 customHeaders: null,
//                 storageData: null,
//                 grantedPermissions: data.metadata?.grant || [],
//                 injectionMode: 'isolated',
//                 priority: 0,
//             };

//             await this.addUserScriptSettings(defaultSettings);

//             // Create initial version entry
//             const versionData: UserScriptVersionAddData = {
//                 userScriptId: scriptId,
//                 version: validatedData.version,
//                 source: validatedData.source,
//                 metadata: validatedData.metadata,
//                 changeLog: null,
//             };

//             await this.addUserScriptVersion(versionData);

//             console.log(`[UserScriptDB] UserScript added with ID: ${scriptId}, name: ${validatedData.name}`);
//             return scriptId;
//         } catch (error) {
//             this.handleError('Add UserScript', error);
//         }
//     }

//     async getUserScriptById(id: number): Promise<UserScriptType | undefined> {
//         try {
//             const script = await this.userScripts.get(id);
//             return script ? userScriptSchema.parse(script) : undefined;
//         } catch (error) {
//             console.error(`[UserScriptDB] Failed to get or validate userscript ID ${id}:`, error);
//             return undefined;
//         }
//     }

//     async getUserScriptsByUrl(url: string): Promise<UserScriptType[]> {
//         try {
//             const allScripts = await this.userScripts
//                 .where('enabled')
//                 .equals('true')
//                 .toArray();

//             // Filter scripts that match the URL
//             const matchingScripts = allScripts.filter(script => {
//                 // Check if URL matches any of the match patterns
//                 const matchesPattern = script.matches.some(pattern =>
//                     this.matchesUrlPattern(url, pattern)
//                 );

//                 // Check if URL is excluded
//                 const isExcluded = script.excludes?.some(pattern =>
//                     this.matchesUrlPattern(url, pattern)
//                 ) || false;

//                 return matchesPattern && !isExcluded;
//             });

//             // Get settings to sort by priority
//             const scriptsWithPriority = await Promise.all(
//                 matchingScripts.map(async script => {
//                     const settings = await this.getUserScriptSettings(script.id);
//                     return { script, priority: settings?.priority || 0 };
//                 })
//             );

//             // Sort by priority (higher priority executes first)
//             scriptsWithPriority.sort((a, b) => b.priority - a.priority);

//             return scriptsWithPriority.map(item => userScriptSchema.parse(item.script));
//         } catch (error) {
//             this.handleError(`Get UserScripts for URL ${url}`, error);
//         }
//     }

//     async updateUserScript(id: number, changes: UserScriptUpdateData): Promise<number> {
//         try {
//             const validatedChanges = userScriptSchema.partial().parse(changes);

//             // Add updatedAt timestamp
//             const finalChanges = {
//                 ...validatedChanges,
//                 updatedAt: new Date(),
//             };

//             const updatedCount = await this.userScripts.update(id, finalChanges);

//             if (updatedCount > 0) {
//                 console.log(`[UserScriptDB] UserScript ID ${id} updated successfully`);
//             }

//             return updatedCount;
//         } catch (error) {
//             this.handleError(`Update UserScript ID ${id}`, error);
//         }
//     }

//     async deleteUserScript(id: number): Promise<void> {
//         return this.transaction('rw', this.userScripts, this.userScriptVersions, this.userScriptExecutions, this.userScriptSettings, async () => {
//             try {
//                 // Delete related data first
//                 await this.userScriptVersions.where('userScriptId').equals(id).delete();
//                 await this.userScriptExecutions.where('userScriptId').equals(id).delete();
//                 await this.userScriptSettings.where('userScriptId').equals(id).delete();

//                 // Delete the script itself
//                 await this.userScripts.delete(id);

//                 console.log(`[UserScriptDB] UserScript ID ${id} and all related data deleted`);
//             } catch (error) {
//                 this.handleError(`Delete UserScript ID ${id}`, error);
//             }
//         });
//     }

//     // == UserScriptVersion Methods ==

//     async addUserScriptVersion(data: UserScriptVersionAddData): Promise<number> {
//         return this.transaction('rw', this.userScriptVersions, async () => {
//             try {
//                 const validatedData = userScriptVersionAddSchema.parse(data);

//                 // Deactivate all previous versions
//                 await this.userScriptVersions
//                     .where('userScriptId')
//                     .equals(validatedData.userScriptId)
//                     .modify({ isActive: false });

//                 const versionToAdd: Omit<UserScriptVersionType, 'id'> = {
//                     ...validatedData,
//                     isActive: true,
//                     createdAt: new Date(),
//                 };

//                 const id = await this.userScriptVersions.add(versionToAdd);
//                 console.log(`[UserScriptDB] Version ${validatedData.version} added for UserScript ID ${validatedData.userScriptId}`);
//                 return id;
//             } catch (error) {
//                 this.handleError('Add UserScript Version', error);
//             }
//         });
//     }

//     async getActiveVersion(userScriptId: number): Promise<UserScriptVersionType | undefined> {
//         try {
//             const version = await this.userScriptVersions
//                 .where({ userScriptId, isActive: true })
//                 .first();
//             return version ? userScriptVersionSchema.parse(version) : undefined;
//         } catch (error) {
//             console.error(`[UserScriptDB] Failed to get active version for script ID ${userScriptId}:`, error);
//             return undefined;
//         }
//     }

//     async getVersionHistory(userScriptId: number, limit: number = 10): Promise<UserScriptVersionType[]> {
//         try {
//             const versions = await this.userScriptVersions
//                 .where('userScriptId')
//                 .equals(userScriptId)
//                 .reverse()
//                 .sortBy('createdAt');

//             return versions.slice(0, limit).map(v => userScriptVersionSchema.parse(v));
//         } catch (error) {
//             this.handleError(`Get version history for UserScript ID ${userScriptId}`, error);
//         }
//     }

//     // == UserScriptExecution Methods ==

//     async logExecution(data: UserScriptExecutionAddData): Promise<number> {
//         try {
//             const validatedData = userScriptExecutionAddSchema.parse(data);

//             const executionToAdd: Omit<UserScriptExecutionType, 'id'> = {
//                 ...validatedData,
//                 createdAt: new Date(),
//             };

//             const id = await this.userScriptExecutions.add(executionToAdd);
//             console.log(`[UserScriptDB] Execution logged for script ID ${validatedData.userScriptId}, status: ${validatedData.status}`);
//             return id;
//         } catch (error) {
//             this.handleError('Log UserScript Execution', error);
//         }
//     }

//     async getExecutionHistory(userScriptId: number, limit: number = 100): Promise<UserScriptExecutionType[]> {
//         try {
//             const executions = await this.userScriptExecutions
//                 .where('userScriptId')
//                 .equals(userScriptId)
//                 .reverse()
//                 .sortBy('createdAt');

//             return executions.slice(0, limit).map(e => userScriptExecutionSchema.parse(e));
//         } catch (error) {
//             this.handleError(`Get execution history for UserScript ID ${userScriptId}`, error);
//         }
//     }

//     async cleanOldExecutions(daysToKeep: number = 7): Promise<number> {
//         try {
//             const cutoffDate = new Date();
//             cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

//             const oldExecutions = await this.userScriptExecutions
//                 .where('createdAt')
//                 .below(cutoffDate)
//                 .toArray();

//             const idsToDelete = oldExecutions.map(e => e.id);

//             if (idsToDelete.length > 0) {
//                 await this.userScriptExecutions.bulkDelete(idsToDelete);
//                 console.log(`[UserScriptDB] Cleaned ${idsToDelete.length} old execution logs`);
//             }

//             return idsToDelete.length;
//         } catch (error) {
//             this.handleError('Clean old executions', error);
//         }
//     }

//     // == UserScriptSettings Methods ==

//     async addUserScriptSettings(data: UserScriptSettingsAddData): Promise<number> {
//         try {
//             const validatedData = userScriptSettingsAddSchema.parse(data);

//             const now = new Date();
//             const settingsToAdd: Omit<UserScriptSettingsType, 'id'> = {
//                 ...validatedData,
//                 createdAt: now,
//                 updatedAt: now,
//             };

//             const id = await this.userScriptSettings.add(settingsToAdd);
//             console.log(`[UserScriptDB] Settings added for UserScript ID ${validatedData.userScriptId}`);
//             return id;
//         } catch (error) {
//             this.handleError('Add UserScript Settings', error);
//         }
//     }

//     async getUserScriptSettings(userScriptId: number): Promise<UserScriptSettingsType | undefined> {
//         try {
//             const settings = await this.userScriptSettings
//                 .where('userScriptId')
//                 .equals(userScriptId)
//                 .first();
//             return settings ? userScriptSettingsSchema.parse(settings) : undefined;
//         } catch (error) {
//             console.error(`[UserScriptDB] Failed to get settings for script ID ${userScriptId}:`, error);
//             return undefined;
//         }
//     }

//     async updateUserScriptSettings(userScriptId: number, changes: UserScriptSettingsUpdateData): Promise<number> {
//         try {
//             const validatedChanges = userScriptSettingsSchema.partial().parse(changes);

//             const settings = await this.getUserScriptSettings(userScriptId);
//             if (!settings) {
//                 throw new Error(`Settings not found for UserScript ID ${userScriptId}`);
//             }

//             const finalChanges = {
//                 ...validatedChanges,
//                 updatedAt: new Date(),
//             };

//             const updatedCount = await this.userScriptSettings.update(settings.id, finalChanges);

//             if (updatedCount > 0) {
//                 console.log(`[UserScriptDB] Settings updated for UserScript ID ${userScriptId}`);
//             }

//             return updatedCount;
//         } catch (error) {
//             this.handleError(`Update settings for UserScript ID ${userScriptId}`, error);
//         }
//     }

//     // == Helper Methods ==

//     private matchesUrlPattern(url: string, pattern: string): boolean {
//         // Convert userscript match pattern to regex
//         // Handle special cases: *, http://*/, https://*/
//         if (pattern === '*' || pattern === 'http://*/' || pattern === 'https://*/') {
//             return true;
//         }

//         // Escape special regex characters except * and ?
//         let regexPattern = pattern
//             .replace(/[.+^${}()|[\]\\]/g, '\\$&')
//             .replace(/\*/g, '.*')
//             .replace(/\?/g, '.');

//         try {
//             const regex = new RegExp(`^${regexPattern}$`);
//             return regex.test(url);
//         } catch {
//             console.warn(`[UserScriptDB] Invalid URL pattern: ${pattern}`);
//             return false;
//         }
//     }

//     // == Storage Methods (for GM_setValue/GM_getValue) ==

//     async setStorageValue(userScriptId: number, key: string, value: any): Promise<void> {
//         try {
//             const settings = await this.getUserScriptSettings(userScriptId);
//             if (!settings) {
//                 throw new Error(`Settings not found for UserScript ID ${userScriptId}`);
//             }

//             const storageData = settings.storageData || {};
//             storageData[key] = value;

//             await this.updateUserScriptSettings(userScriptId, { storageData });
//         } catch (error) {
//             this.handleError(`Set storage value for UserScript ID ${userScriptId}`, error);
//         }
//     }

//     async getStorageValue(userScriptId: number, key: string): Promise<any> {
//         try {
//             const settings = await this.getUserScriptSettings(userScriptId);
//             return settings?.storageData?.[key];
//         } catch (error) {
//             console.error(`[UserScriptDB] Failed to get storage value for script ID ${userScriptId}:`, error);
//             return undefined;
//         }
//     }

//     async deleteStorageValue(userScriptId: number, key: string): Promise<void> {
//         try {
//             const settings = await this.getUserScriptSettings(userScriptId);
//             if (!settings?.storageData) return;

//             const storageData = { ...settings.storageData };
//             delete storageData[key];

//             await this.updateUserScriptSettings(userScriptId, { storageData });
//         } catch (error) {
//             this.handleError(`Delete storage value for UserScript ID ${userScriptId}`, error);
//         }
//     }

//     async listStorageKeys(userScriptId: number): Promise<string[]> {
//         try {
//             const settings = await this.getUserScriptSettings(userScriptId);
//             return settings?.storageData ? Object.keys(settings.storageData) : [];
//         } catch (error) {
//             console.error(`[UserScriptDB] Failed to list storage keys for script ID ${userScriptId}:`, error);
//             return [];
//         }
//     }
// }

// export default new UserScriptDatabase();
