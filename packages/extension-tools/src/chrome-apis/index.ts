// Active exports
export * from './AlarmsApiTools';
export * from './AudioApiTools';
export * from './BookmarksApiTools';
export * from './BrowsingDataApiTools';
export * from './CertificateProviderApiTools';
export * from './CommandsApiTools';
export * from './ContentSettingsApiTools';
export * from './ContextMenusApiTools';
export * from './CookiesApiTools';
export * from './DebuggerApiTools';
export * from './DeclarativeContentApiTools';
export * from './DeclarativeNetRequestApiTools';
export * from './DesktopCaptureApiTools';
export * from './DevtoolsInspectedWindowApiTools';
export * from './DevtoolsNetworkApiTools';
export * from './DevtoolsPanelsApiTools';
export * from './DocumentScanApiTools';
export * from './DomApiTools';
export * from './DownloadsApiTools';
export * from './EnterpriseDeviceAttributesApiTools';
export * from './EnterpriseHardwarePlatformApiTools';
export * from './EnterpriseNetworkingAttributesApiTools';
export * from './EnterprisePlatformKeysApiTools';
export * from './ExtensionApiTools';
export * from './FileBrowserHandlerApiTools';
export * from './FileSystemProviderApiTools';
export * from './FontSettingsApiTools';
export * from './GcmApiTools';
export * from './HistoryApiTools';
export * from './I18nApiTools';
export * from './IdentityApiTools';
export * from './IdleApiTools';
export * from './InputImeApiTools';
export * from './InstanceIDApiTools';
export * from './LoginStateApiTools';
export * from './ManagementApiTools';
export * from './NotificationsApiTools';
export * from './OffscreenApiTools';
export * from './OmniboxApiTools';
export * from './PageCaptureApiTools';
export * from './PermissionsApiTools';
export * from './PlatformKeysApiTools';
export * from './PowerApiTools';
export * from './PrintingApiTools';
export * from './PrintingMetricsApiTools';
export * from './ProxyApiTools';
export * from './ReadingListApiTools';
export * from './RuntimeApiTools';
export * from './ScriptingApiTools';
export * from './SearchApiTools';
export * from './SessionsApiTools';
export * from './SidePanelApiTools';
export * from './StorageApiTools';
export * from './SystemCpuApiTools';
export * from './SystemLogApiTools';
export * from './SystemMemoryApiTools';
export * from './SystemStorageApiTools';
export * from './TabCaptureApiTools';
export * from './TabGroupsApiTools';
export * from './TabsApiTools';
export * from './TopSitesApiTools';
export * from './TtsApiTools';
export * from './TtsEngineApiTools';
export * from './UserScriptsApiTools';
export * from './VpnProviderApiTools';
export * from './WallpaperApiTools';
export * from './WebAuthenticationProxyApiTools';
export * from './WebNavigationApiTools';
export * from './WebRequestApiTools';
export * from './WindowsApiTools';

// ===== UNDER CONSTRUCTION =====
// The following exports are commented out while their implementations are being completed:

// export * from './AccessibilityFeaturesApiTools';
// export * from './ActionApiTools';
// export * from './DevtoolsPerformanceApiTools';
// export * from './DevtoolsRecorderApiTools';
// export * from './DnsApiTools';
// export * from './EventsApiTools';
// export * from './ExtensionTypesApiTools';
// export * from './PrinterProviderApiTools';
// export * from './PrivacyApiTools';
// export * from './ProcessesApiTools';
// export * from './SystemDisplayApiTools';

// ===== REGISTRY IMPLEMENTATION (UNDER CONSTRUCTION) =====
// import { BaseApiTools } from '../BaseApiTools';
// import { ChromeApi } from '../chromeApiRegistry';

// Registry of all Chrome API tool implementations
// export const CHROME_API_TOOLS: Record<ChromeApi, typeof BaseApiTools> = {
//   [ChromeApi.accessibilityFeatures]: AccessibilityFeaturesApiTools,
//   [ChromeApi.action]: ActionApiTools,
//   [ChromeApi.alarms]: AlarmsApiTools,
//   [ChromeApi.audio]: AudioApiTools,
//   [ChromeApi.bookmarks]: BookmarksApiTools,
//   [ChromeApi.browsingData]: BrowsingDataApiTools,
//   [ChromeApi.certificateProvider]: CertificateProviderApiTools,
//   [ChromeApi.commands]: CommandsApiTools,
//   [ChromeApi.contentSettings]: ContentSettingsApiTools,
//   [ChromeApi.contextMenus]: ContextMenusApiTools,
//   [ChromeApi.cookies]: CookiesApiTools,
//   [ChromeApi.debugger]: DebuggerApiTools,
//   [ChromeApi.declarativeContent]: DeclarativeContentApiTools,
//   [ChromeApi.declarativeNetRequest]: DeclarativeNetRequestApiTools,
//   [ChromeApi.desktopCapture]: DesktopCaptureApiTools,
//   [ChromeApi.devtools.inspectedWindow]: DevtoolsInspectedWindowApiTools,
//   [ChromeApi.devtools.network]: DevtoolsNetworkApiTools,
//   [ChromeApi.devtools.panels]: DevtoolsPanelsApiTools,
//   [ChromeApi.devtools.performance]: DevtoolsPerformanceApiTools,
//   [ChromeApi.devtools.recorder]: DevtoolsRecorderApiTools,
//   [ChromeApi.dns]: DnsApiTools,
//   [ChromeApi.documentScan]: DocumentScanApiTools,
//   [ChromeApi.dom]: DomApiTools,
//   [ChromeApi.downloads]: DownloadsApiTools,
//   [ChromeApi.enterprise.deviceAttributes]: EnterpriseDeviceAttributesApiTools,
//   [ChromeApi.enterprise.hardwarePlatform]: EnterpriseHardwarePlatformApiTools,
//   [ChromeApi.enterprise.networkingAttributes]: EnterpriseNetworkingAttributesApiTools,
//   [ChromeApi.enterprise.platformKeys]: EnterprisePlatformKeysApiTools,
//   [ChromeApi.events]: EventsApiTools,
//   [ChromeApi.extension]: ExtensionApiTools,
//   [ChromeApi.extensionTypes]: ExtensionTypesApiTools,
//   [ChromeApi.fileBrowserHandler]: FileBrowserHandlerApiTools,
//   [ChromeApi.fileSystemProvider]: FileSystemProviderApiTools,
//   [ChromeApi.fontSettings]: FontSettingsApiTools,
//   [ChromeApi.gcm]: GcmApiTools,
//   [ChromeApi.history]: HistoryApiTools,
//   [ChromeApi.i18n]: I18nApiTools,
//   [ChromeApi.identity]: IdentityApiTools,
//   [ChromeApi.idle]: IdleApiTools,
//   [ChromeApi.input.ime]: InputImeApiTools,
//   [ChromeApi.instanceID]: InstanceIDApiTools,
//   [ChromeApi.loginState]: LoginStateApiTools,
//   [ChromeApi.management]: ManagementApiTools,
//   [ChromeApi.notifications]: NotificationsApiTools,
//   [ChromeApi.offscreen]: OffscreenApiTools,
//   [ChromeApi.omnibox]: OmniboxApiTools,
//   [ChromeApi.pageCapture]: PageCaptureApiTools,
//   [ChromeApi.permissions]: PermissionsApiTools,
//   [ChromeApi.platformKeys]: PlatformKeysApiTools,
//   [ChromeApi.power]: PowerApiTools,
//   [ChromeApi.printerProvider]: PrinterProviderApiTools,
//   [ChromeApi.printing]: PrintingApiTools,
//   [ChromeApi.printingMetrics]: PrintingMetricsApiTools,
//   [ChromeApi.privacy]: PrivacyApiTools,
//   [ChromeApi.processes]: ProcessesApiTools,
//   [ChromeApi.proxy]: ProxyApiTools,
//   [ChromeApi.readingList]: ReadingListApiTools,
//   [ChromeApi.runtime]: RuntimeApiTools,
//   [ChromeApi.scripting]: ScriptingApiTools,
//   [ChromeApi.search]: SearchApiTools,
//   [ChromeApi.sessions]: SessionsApiTools,
//   [ChromeApi.sidePanel]: SidePanelApiTools,
//   [ChromeApi.storage]: StorageApiTools,
//   [ChromeApi.system.cpu]: SystemCpuApiTools,
//   [ChromeApi.system.display]: SystemDisplayApiTools,
//   [ChromeApi.system.memory]: SystemMemoryApiTools,
//   [ChromeApi.system.storage]: SystemStorageApiTools,
//   [ChromeApi.systemLog]: SystemLogApiTools,
//   [ChromeApi.tabCapture]: TabCaptureApiTools,
//   [ChromeApi.tabGroups]: TabGroupsApiTools,
//   [ChromeApi.tabs]: TabsApiTools,
//   [ChromeApi.topSites]: TopSitesApiTools,
//   [ChromeApi.tts]: TtsApiTools,
//   [ChromeApi.ttsEngine]: TtsEngineApiTools,
//   [ChromeApi.types]: TypesApiTools,
//   [ChromeApi.userScripts]: UserScriptsApiTools,
//   [ChromeApi.vpnProvider]: VpnProviderApiTools,
//   [ChromeApi.wallpaper]: WallpaperApiTools,
//   [ChromeApi.webAuthenticationProxy]: WebAuthenticationProxyApiTools,
//   [ChromeApi.webNavigation]: WebNavigationApiTools,
//   [ChromeApi.webRequest]: WebRequestApiTools,
//   [ChromeApi.windows]: WindowsApiTools,
// };

// Helper to get API tools by enum
// export function getApiTools(api: ChromeApi): typeof BaseApiTools | undefined {
//   return CHROME_API_TOOLS[api];
// }
