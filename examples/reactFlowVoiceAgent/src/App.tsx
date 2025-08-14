import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  type Edge, // Add this import
} from 'reactflow';
import 'reactflow/dist/style.css';

import LLMNode from './components/nodes/LLMNode';
import MCPServerNode from './components/nodes/MCPServerNode';

import ChatSection from './components/ChatPanel';

import { useGemini } from './ai/geminiContext.tsx';

import { CONST_CONFIG } from './config/ai_config.tsx';

import { initialNodes, isMCPServer, getServerName } from './lib/utils';

const nodeTypes: NodeTypes = {
  llm: LLMNode,
  mcpServer: MCPServerNode,
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { mcpConnect, mcpDisconnect, tools, liveConnected } = useGemini();

  const updateNode = useCallback(
    (nodeId: string, description: string, isConnected: boolean) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, description, connected: isConnected } }
            : node
        )
      );
    },
    [setNodes]
  );

  // EDGE DELETION HANDLER
  const onEdgesDelete = useCallback(
    async (edgesToDelete: Edge[]) => {
      for (const edge of edgesToDelete) {
        if (edge.source === CONST_CONFIG.LLM_NODE_ID && isMCPServer(edge.target)) {
          console.log(`🔌 Disconnecting from ${getServerName(edge.target)} due to edge deletion`);

          // Disconnect from MCP
          await mcpDisconnect();

          // Update the node to show disconnected state
          const serverName = getServerName(edge.target);
          updateNode(edge.target, `${serverName} - Not connected`, false);
        }
      }
    },
    [mcpDisconnect, updateNode]
  );

  // CONNECTIONS
  const disconnectAllEdges = async () => {
    await mcpDisconnect();
    setEdges([]);
  };

  const disconnectExistingMCP = useCallback(
    async (excludeTargetId?: string) => {
      const mcpEdges = edges.filter(
        (edge) =>
          edge.source === CONST_CONFIG.LLM_NODE_ID &&
          isMCPServer(edge.target) &&
          edge.target !== excludeTargetId
      );

      if (mcpEdges.length > 0) {
        console.log('🔌 Auto-disconnecting previous MCP connection...');
        await mcpDisconnect();

        setEdges((eds) =>
          eds.filter(
            (edge) =>
              !(
                edge.source === CONST_CONFIG.LLM_NODE_ID &&
                isMCPServer(edge.target) &&
                edge.target !== excludeTargetId
              )
          )
        );

        mcpEdges.forEach((edge) => {
          const serverName = getServerName(edge.target);
          updateNode(edge.target, `${serverName} - Not connected`, false);
        });
      } else if (liveConnected) {
        await mcpDisconnect();
      }
    },
    [edges, setEdges, updateNode, mcpDisconnect, liveConnected]
  );

  const connectToMCP = useCallback(
    async (targetId: string) => {
      await disconnectExistingMCP(targetId);

      const success = await mcpConnect(targetId);
      const toolCount = tools.length;
      const serverName = getServerName(targetId);

      if (success) {
        updateNode(targetId, `${serverName} - ${toolCount} tools`, true);
      } else {
        await disconnectAllEdges();
      }
    },
    [updateNode, mcpConnect, tools, disconnectAllEdges, disconnectExistingMCP]
  );

  const onConnect = useCallback(
    async (params: Connection) => {
      if (params.source === CONST_CONFIG.LLM_NODE_ID && isMCPServer(params.target)) {
        setEdges((eds) => addEdge(params, eds));
        await connectToMCP(params.target);
      } else {
        console.log('connecting to sth else', params.target);
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [setEdges, connectToMCP]
  );

  useEffect(() => {
    localStorage.clear();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        backgroundColor: '#1a1a1a',
        color: '#e0e0e0',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div className="w-full h-full border border-solid border-[#333] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete} // Add this line
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}
          elementsSelectable={true}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
        >
          <Background color="#333" />
          <Controls />
        </ReactFlow>
      </div>

      <ChatSection disconnectNode={disconnectExistingMCP} />
    </div>
  );
}

export default App;
