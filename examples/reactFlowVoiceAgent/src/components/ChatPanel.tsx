import { use, useCallback, useEffect, useState } from 'react';
import { Mic, Send, StopCircle } from 'lucide-react';
import type { MCPTool } from '../lib/live-types.ts';

import { useGemini } from '../ai/geminiContext.tsx';

export default function ChatSection({ disconnectNode }: { disconnectNode: () => void }) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<string[]>([
    '🎉 Ready! Connect the LLM to any MCP server to start.',
  ]);
  const [apiKeyInput, setApiKeyInput] = useState(''); // Add state for API key input

  const {
    liveClient,
    liveConnected,
    sendMessage,
    setTools,
    tools,
    mcpDisconnect,
    liveConnect,
    liveDisconnect,
    setLiveConnected,
    voiceModeEnabled,
    toggleVoiceMode,
    setApiKey,
  } = useGemini();

  // CHAT HISTORY
  const addChatMessage = useCallback((message: string) => {
    setChatHistory((prev) => [...prev, message]);
  }, []);

  useEffect(() => {
    const onClose = (reason: string) => {
      setLiveConnected(false);
      addChatMessage(`🔌 Disconnected! ${reason}`);

      reason ? disconnectNode() : mcpDisconnect();

      setTools([]);
    };

    liveClient.on('close', onClose);

    return () => {
      liveClient.off('close', onClose);
    };
  }, [liveClient, liveConnected]);

  const handleDisconnectNode = () => {
    disconnectNode();
    addChatMessage('🔌 Disconnected from MCP server');
  };

  const handleConnectNode = async () => {
    const success = await liveConnect([]);

    const message = success
      ? '🔌 Connected to MCP server'
      : '❌ Failed to connect to MCP server. Make sure you have set an API key.';
    addChatMessage(message);
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    setChatMessage('');

    try {
      addChatMessage(`You: ${chatMessage}`);
      sendMessage(chatMessage);
    } catch (error) {
      addChatMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      if (liveConnected) {
        addChatMessage('🔌 Disconnected due to new API key');
        disconnectNode();
      }

      setApiKey(apiKeyInput.trim());
      addChatMessage('🔑 API Key set. You may now connect.');
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
  };

  useEffect(() => {
    const handleTurnComplete = (fullResponse: string) => {
      addChatMessage(`Gemini: ${fullResponse}`);
    };

    liveClient.on('turncomplete', handleTurnComplete);

    return () => {
      liveClient.off('turncomplete', handleTurnComplete);
    };
  }, [liveClient, addChatMessage]);

  return (
    <div className="w-[600px] min-w-[300px] max-w-[600px] h-screen p-6 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="m-0 text-2xl font-bold text-blue-400">🤖 Gemini Chat</h2>

        <div
          className="px-3 py-2 bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-40 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 data-[connected=false]:bg-gray-500 data-[connected=false]:bg-opacity-20 data-[connected=false]:text-gray-400 data-[connected=false]:border-gray-500 data-[connected=false]:border-opacity-40"
          data-connected={liveConnected}
        >
          {liveConnected ? 'active' : 'inactive'}
        </div>

        <button
          onClick={() => (liveConnected ? handleDisconnectNode() : handleConnectNode())}
          className={`px-4 py-2 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 shadow-lg ${
            liveConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {liveConnected ? 'Disconnect' : 'Just Chat'}
        </button>
      </div>

      {/* API Key Form - Fixed */}
      <div className="mb-6 p-5 bg-slate-800 rounded-xl border border-slate-700">
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder="Enter Gemini API Key"
          className="w-full p-3 mb-3 border border-slate-600 rounded-lg bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          className="w-full p-3 bg-blue-600 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-blue-700"
          onClick={handleApiKeySubmit}
        >
          Set API Key
        </button>
      </div>

      {/* Tools Info */}
      <div className="mb-6 p-5 bg-emerald-900 bg-opacity-30 rounded-xl border border-emerald-700 border-opacity-50">
        <h4 className="m-0 mb-3 text-lg font-semibold text-emerald-300">
          🔧 Available Tools: {tools.length}
        </h4>

        <div className="max-h-[120px] overflow-y-auto">
          {tools.map((tool: MCPTool) => (
            <div
              key={tool.name}
              className="text-sm text-emerald-200 mb-2 font-mono bg-slate-800 bg-opacity-50 px-3 py-1 rounded"
            >
              • {tool.name}
            </div>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto bg-slate-800 rounded-xl mb-5 p-5 min-h-[200px] border border-slate-700">
        {chatHistory.length === 0 ? (
          <div className="text-slate-400 italic text-center mt-8 text-lg">
            No messages yet. Start a conversation!
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap break-words border ${
                msg.startsWith('You:')
                  ? 'bg-blue-600 bg-opacity-20 border-blue-500 border-opacity-30 text-blue-100'
                  : msg.startsWith('Error:')
                    ? 'bg-red-600 bg-opacity-20 border-red-500 border-opacity-30 text-red-100'
                    : 'bg-slate-700 border-slate-600 text-slate-200'
              }`}
            >
              {msg}
            </div>
          ))
        )}
      </div>

      {/* Chat Input */}
      <div className="flex gap-3 mb-4">
        <textarea
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about weather, GitHub repos, users, or anything else..."
          className="flex-1 p-4 min-h-[60px] max-h-[120px] resize-y border border-slate-600 rounded-lg bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!liveConnected}
        />
        <button
          onClick={handleSendChatMessage}
          disabled={!chatMessage.trim() || !liveConnected}
          className={`px-6 py-4 min-h-[60px] text-white border-none rounded-lg text-sm transition-all duration-200 shadow-lg ${
            !chatMessage.trim() || !liveConnected
              ? 'bg-slate-600 cursor-not-allowed opacity-50'
              : 'bg-blue-600 cursor-pointer hover:bg-blue-700'
          }`}
        >
          <Send />
        </button>

        <button
          onClick={toggleVoiceMode}
          disabled={!liveConnected}
          className={`p-4 min-h-[60px] text-white border-none rounded-lg text-sm transition-all duration-200 shadow-lg ${
            !liveConnected
              ? 'bg-slate-600 cursor-not-allowed opacity-50'
              : voiceModeEnabled
                ? 'bg-red-600 cursor-pointer hover:bg-red-700'
                : 'bg-slate-600 cursor-pointer hover:bg-slate-700'
          }`}
        >
          {voiceModeEnabled ? <StopCircle /> : <Mic />}
        </button>
      </div>

      <button
        onClick={handleClearChat}
        className="w-full p-3 bg-slate-700 rounded-lg text-white border border-slate-600 cursor-pointer hover:bg-slate-600 transition-colors duration-200 text-sm font-medium"
      >
        Clear Chat
      </button>
    </div>
  );
}
