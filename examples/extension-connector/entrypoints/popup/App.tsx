/**
 * MCP Connector Extension - Popup UI Component
 *
 * This React component provides the user interface for the MCP Connector extension.
 * It displays connection status, lists available tools, and allows tool execution.
 *
 * Features:
 * - Real-time connection status display
 * - Tool discovery with category filtering (All/Extension/Website)
 * - Dynamic tool list updates via Chrome message passing
 * - JSON-based tool argument input
 * - Result display with error handling
 *
 * @module popup/App
 */

import { useState, useEffect } from 'react';
import type { Tool, ConnectionStatus } from '../background';

/**
 * Represents the result of a tool execution
 */
interface ToolResult {
  /** Whether the tool execution succeeded or failed */
  type: 'success' | 'error';
  /** The tool's return data (for successful executions) */
  data?: any;
  /** Error message (for failed executions) */
  error?: string;
}

/**
 * Main Popup Component
 *
 * This component manages:
 * - Connection lifecycle (connect/disconnect)
 * - Tool discovery and filtering
 * - Tool execution with arguments
 * - Real-time updates from background script
 */
export default function App() {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    extensionId: '',
  });

  // Tool management
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArgs, setToolArgs] = useState<string>('{}');

  // UI state
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'extension' | 'website'>('all');

  /**
   * Initialize component state from Chrome storage and set up listeners
   */
  useEffect(() => {
    // Load initial state from Chrome storage
    chrome.storage.local.get(['connectionStatus', 'availableTools'], (data) => {
      if (data.connectionStatus) {
        setConnectionStatus(data.connectionStatus);
      }
      if (data.availableTools) {
        setTools(data.availableTools);
      }
    });

    // Listen for storage changes (connection status, tool updates)
    const handleStorageChange = (changes: any) => {
      if (changes.connectionStatus) {
        setConnectionStatus(changes.connectionStatus.newValue);
      }
      if (changes.availableTools) {
        setTools(changes.availableTools.newValue || []);
      }
    };

    // Listen for real-time tool updates from background script
    // This handles dynamic tool registration from websites
    const handleMessage = (message: any) => {
      if (message.type === 'TOOLS_UPDATED' && message.tools) {
        console.log('[Popup] Received tools update:', message.tools);
        setTools(message.tools);
      }
    };

    // Register event listeners
    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup listeners on unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  /**
   * Connect to the MCP-B extension
   */
  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CONNECT' });
      if (response.error) {
        setResult({ type: 'error', error: response.error });
      }
    } catch (error) {
      setResult({
        type: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Disconnect from the MCP-B extension
   */
  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await chrome.runtime.sendMessage({ type: 'DISCONNECT' });
      setTools([]);
      setResult(null);
    } catch (error) {
      setResult({
        type: 'error',
        error: error instanceof Error ? error.message : 'Disconnect failed',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh the tool list based on active tab filter
   * Demonstrates how to use the special discovery tools
   */
  const handleRefreshTools = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'extension':
          // Use the special list_extension_tools discovery tool
          response = await chrome.runtime.sendMessage({ type: 'LIST_EXTENSION_TOOLS' });
          if (response.result) {
            setResult({ type: 'success', data: response.result });
          }
          break;
        case 'website':
          // Use the special list_website_tools discovery tool
          response = await chrome.runtime.sendMessage({ type: 'LIST_WEBSITE_TOOLS' });
          if (response.result) {
            setResult({ type: 'success', data: response.result });
          }
          break;
        default:
          // List all tools
          response = await chrome.runtime.sendMessage({ type: 'LIST_TOOLS' });
          if (response.tools) {
            setTools(response.tools);
            setResult({ type: 'success', data: { tools: response.tools } });
          }
      }

      if (response.error) {
        setResult({ type: 'error', error: response.error });
      }
    } catch (error) {
      setResult({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to refresh tools',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute the selected tool with provided arguments
   */
  const handleCallTool = async () => {
    if (!selectedTool) {
      setResult({ type: 'error', error: 'Please select a tool' });
      return;
    }

    setLoading(true);
    try {
      // Parse JSON arguments
      let args = {};
      try {
        args = JSON.parse(toolArgs);
      } catch {
        setResult({ type: 'error', error: 'Invalid JSON arguments' });
        setLoading(false);
        return;
      }

      // Call the tool via background script
      const response = await chrome.runtime.sendMessage({
        type: 'CALL_TOOL',
        toolName: selectedTool,
        arguments: args,
      });

      // Display result
      if (response.error) {
        setResult({ type: 'error', error: response.error });
      } else {
        setResult({ type: 'success', data: response.result });
      }
    } catch (error) {
      setResult({
        type: 'error',
        error: error instanceof Error ? error.message : 'Tool call failed',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter tools based on active tab selection
   */
  const filteredTools = tools.filter((tool) => {
    if (activeTab === 'extension') return tool.name.startsWith('extension_');
    if (activeTab === 'website') return tool.name.startsWith('website_');
    return true;
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MCP Connector Extension</h1>

      {/* Connection Status Section */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">Status: </span>
            <span className={connectionStatus.connected ? 'text-green-600' : 'text-red-600'}>
              {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            </span>
            {connectionStatus.extensionId && (
              <div className="text-xs text-gray-500 mt-1">
                Target: {connectionStatus.extensionId}
              </div>
            )}
            {connectionStatus.error && (
              <div className="text-xs text-red-500 mt-1">{connectionStatus.error}</div>
            )}
          </div>
          <button
            onClick={connectionStatus.connected ? handleDisconnect : handleConnect}
            disabled={loading}
            className={`px-4 py-2 rounded text-white font-semibold ${
              connectionStatus.connected
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
            } disabled:opacity-50`}
          >
            {connectionStatus.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Tools Section - Only shown when connected */}
      {connectionStatus.connected && (
        <>
          {/* Tool Category Tabs */}
          <div className="mb-4">
            <div className="flex space-x-2 mb-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                All Tools
              </button>
              <button
                onClick={() => setActiveTab('extension')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'extension'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Extension Tools
              </button>
              <button
                onClick={() => setActiveTab('website')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'website'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Website Tools
              </button>
              <button
                onClick={handleRefreshTools}
                disabled={loading}
                className="ml-auto px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Tool Selection Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Available Tools ({filteredTools.length})
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              <option value="">Select a tool...</option>
              {filteredTools.map((tool) => (
                <option key={tool.name} value={tool.name}>
                  {tool.name}
                  {tool.description && ` - ${tool.description.substring(0, 50)}...`}
                </option>
              ))}
            </select>
          </div>

          {/* Tool Arguments Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Arguments (JSON)</label>
            <textarea
              value={toolArgs}
              onChange={(e) => setToolArgs(e.target.value)}
              className="w-full p-2 border rounded font-mono text-sm"
              rows={3}
              placeholder='{"param": "value"}'
              disabled={loading}
            />
          </div>

          {/* Call Tool Button */}
          <div className="mb-4">
            <button
              onClick={handleCallTool}
              disabled={loading || !selectedTool}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Call Tool'}
            </button>
          </div>

          {/* Result Display */}
          {result && (
            <div
              className={`p-3 rounded ${result.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}
            >
              <div className="font-semibold mb-2">
                {result.type === 'success' ? 'Result:' : 'Error:'}
              </div>
              <pre className="text-xs overflow-auto max-h-48 p-2 bg-white rounded">
                {result.type === 'success' ? JSON.stringify(result.data, null, 2) : result.error}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
