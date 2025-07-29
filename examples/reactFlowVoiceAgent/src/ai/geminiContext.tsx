import { createContext, useContext, useState, useEffect, type ReactNode, useRef, useMemo, useCallback } from 'react';

import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { setupMCPServer } from '../mcpServers/_shared';
import type { ToolCall, LiveFunctionResponse, MCPTool } from '../lib/live-types';
import { MultimodalLiveClient } from './liveClient';


import { CONST_CONFIG } from '../config/ai_config';

import { audioContext, createLiveConfigWithTools } from '../lib/utils';
import VolMeterWorket from "../lib/audio/worklets/vol-meter";
import { AudioRecorder } from '../lib/audio/audio-recorder';
import { AudioStreamer } from '../lib/audio/audio-streamer';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';




interface GeminiContextType {
  mcpConnect: (serverType: string) => Promise<boolean>;
  mcpDisconnect: () => Promise<void>;
  liveConnect: (mcpTools?: MCPTool[]) => Promise<boolean>;
  liveDisconnect: () => Promise<void>;
  
  liveConnected: boolean; 
  setLiveConnected: (connected: boolean) => void;
  
  tools: MCPTool[];
  setTools: (tools: MCPTool[]) => void;
  

  voiceModeEnabled: boolean;
  toggleVoiceMode: () => void;

  sendMessage: (message: string) => void;
  setApiKey: (apiKey: string) => void;

  liveClient: MultimodalLiveClient;
}


const GeminiContext = createContext<GeminiContextType | undefined>(undefined);


export const GeminiProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState("");
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [currentServer, setCurrentServer] = useState<McpServer | null>(null);

  const [liveConnected, setLiveConnected] = useState(false);

  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const audioStreamerRef = useRef<AudioStreamer | null>(null);  
  
  // Create voice client with API key
  const liveClient = useMemo(
    () => new MultimodalLiveClient({ url: CONST_CONFIG.uri, apiKey: apiKey }),
    [apiKey],
  );
  


  // ########################################################################
  // ###################### LIVE CLIENT EVENT HANDLERS ######################
  // ########################################################################
  useEffect(() => {
    const stopAudioStreamer = () => audioStreamerRef.current?.stop();
    const onAudio = (data: ArrayBuffer) => audioStreamerRef.current?.addPCM16(new Uint8Array(data));
    
    liveClient
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("toolcall", callTool);

    return () => {
      liveClient
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .off("toolcall", callTool)
    };
  }, [liveClient, mcpClient]);



  // ######################################################################
  // ###################### UTILITY FUNCTIONS #############################
  // ######################################################################
  const toggleVoiceMode = () => setVoiceModeEnabled(prev => !prev);

  const callTool = async (toolCall: ToolCall) => {
    if (mcpClient) {
      const functionResponses: LiveFunctionResponse[] = [];
      for (const call of toolCall.functionCalls) {
        try {
          // console.log(`📞 Calling MCP tool: ${call.name}, args: ${JSON.stringify(call.args)}, id: ${call.id}`);
          
          const toolResult = await mcpClient.callTool({
            name: call.name,
            arguments: call.args as any || {}
          });
          
          // console.log(`✅ Tool result for ${call.name}:`, toolResult);
          
          functionResponses.push({
            id: call.id,
            response: toolResult
          });
        } catch (error) {
          console.error(`❌ Tool call failed for ${call.name}:`, error);
          functionResponses.push({
            id: call.id,
            response: { 
              error: `Tool call failed: ${error instanceof Error ? error.message : String(error)}` 
            }
          });
        }
      }
      
      // Send tool responses to the LLM
      // console.log('📤 Sending tool responses:', functionResponses);
      liveClient.sendToolResponse({ functionResponses });
    } else {
      console.warn('⚠️ No MCP client available for tool calls');
      
      // Send error response back to the WebSocket
      const errorResponses: LiveFunctionResponse[] = toolCall.functionCalls.map(call => ({
        id: call.id,
        response: { error: "MCP client not available" }
      }));
      liveClient.sendToolResponse({ functionResponses: errorResponses });
    }
  };
  
  

// ########################################################################
// ###################### LIVE WEBSOCKET CONNECT ##########################
// ########################################################################
  const liveDisconnect = useCallback(async () => {
    liveClient.disconnect();
    setLiveConnected(false);
    
  }, [liveClient]);


  const liveConnect = useCallback(async (mcpTools?: MCPTool[]): Promise<boolean> => {
    const tools = mcpTools || [];
    
    // console.log('🔧 API key:', apiKey);
    if (!apiKey) return false;

    try {
      const liveConfig = createLiveConfigWithTools(tools);
      console.log('📋 Live config with tools:', liveConfig);
      
      await liveDisconnect();
      await liveClient.connect(liveConfig);      
      
      setLiveConnected(true);
      return true;      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      return false;
    }
  }, [apiKey, liveClient, createLiveConfigWithTools]);


// ########################################################################
// ###################### MCP SERVER CONNECT ##############################
// ########################################################################
  
  const mcpDisconnect = useCallback(async () => {
    // Close the WebSocket
    if (liveConnected) await liveDisconnect();
    
    
    // Close the MCP client
    if (mcpClient) {
      try {
        mcpClient.close();
      } catch (error) {
        console.warn('Error closing MCP client:', error);
      }
      setMcpClient(null);
    }
    
    // Close the MCP server        
    if (currentServer) {
      try {
        if (typeof currentServer.close === 'function') {
          await currentServer.close();
        }
      } catch (error) {
        console.warn('Error closing MCP server:', error);
      }
      setCurrentServer(null);
    }
    
    // Reset the tools
    setTools([]);
    
    // Wait for the server to close
    await new Promise(resolve => setTimeout(resolve, 200));
  }, [liveConnected, liveClient, mcpClient, currentServer]);

 
  
  const mcpConnect = useCallback(async (serverType: string): Promise<boolean> => {
    try {
      await mcpDisconnect();
      
      // Add a delay to allow the old server transport to fully close
      await new Promise(resolve => setTimeout(resolve, 500));
      

      // Create and connect to the MCP server
      const server = await setupMCPServer(serverType);
      setCurrentServer(server);      

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const transport = new TabClientTransport({
        targetOrigin: window.location.origin
      });
      
      const newClient = new Client({
        name: 'WebAppClient',
        version: '1.0.0',
      });


      ///
      newClient.setNotificationHandler(ToolListChangedNotificationSchema, (notification) => {
        console.log('🔧 Tool list changed:', notification);
      });
      ///

      await newClient.connect(transport);
      setMcpClient(newClient);

      // Get tools
      const toolList = await newClient.listTools();
      const newTools = toolList.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || tool.name,
        parameters: tool.inputSchema || { type: "object", properties: {}, required: [] }
      }));
      
      setTools(newTools);

      // console.log(`✅ Connected to ${serverType} with ${newTools.length} tools:`, newTools.map(t => t.name));

      // Connect to WebSocket with the new tools
      const response = await liveConnect(newTools);
      if (!response) return false;

      return true;
    } catch (error) {
      console.error('❌ MCP Connection failed:', error);
      return false;
    }
  }, [mcpDisconnect, liveConnect]);


  
// ########################################################################
// ###################### LLM INTERACTION ################################
// ########################################################################

  // TEXT MESSAGE
  const sendMessage = useCallback(async (message: string) => {
    if (liveConnected) {
        liveClient.send([{ text: message }]);
    } else {
      console.warn('⚠️ WebSocket not connected');
    }
  }, [liveConnected, liveClient]);    


  // MICROPHONE
  useEffect(() => {
    const onData = (base64: string) => {
      if (liveConnected) {
        liveClient.sendRealtimeInput([
          {
            mimeType: "audio/pcm;rate=16000",
            data: base64,
          },
        ]);
      }
    };

    if (liveConnected && voiceModeEnabled && audioRecorder) {
      audioRecorder.on("data", onData).start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off("data", onData)
    };
  }, [liveConnected, liveClient, voiceModeEnabled, audioRecorder]);


  // SPEAKER
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, () => {
            // Volume meter callback
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);



  return (
    <GeminiContext.Provider value={{
      mcpConnect,
      mcpDisconnect,
      liveConnect,
      liveDisconnect,
      
      
      liveConnected,
      setLiveConnected,
      
      tools,
      setTools,
      
      voiceModeEnabled,
      toggleVoiceMode,
      

      sendMessage,
      setApiKey,    
      liveClient,
    }}>
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => {
  const context = useContext(GeminiContext);
  if (context === undefined) {
    throw new Error('useGemini must be used within a GeminiProvider');
  }
  return context;
};
