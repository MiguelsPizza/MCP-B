import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

interface MCPServerNodeData {
  label: string;
  url: string;
  connected: boolean;
}

const MCPServerNode: React.FC<NodeProps<MCPServerNodeData>> = ({ data }) => {
  const isConnected = data.connected;

  return (
    <div
      style={{
        background: '#ffffff',
        border: `2px solid ${isConnected ? '#22c55e' : '#94a3b8'}`,
        borderRadius: '8px',
        padding: '16px',
        minWidth: '170px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      }}
    >
      {/* Status stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: isConnected ? '#22c55e' : '#94a3b8',
          borderRadius: '6px 6px 0 0',
        }}
      />

      <div
        style={{
          fontSize: '15px',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '6px',
        }}
      >
        🔧 {data.label}
      </div>

      <div
        style={{
          fontSize: '9px',
          color: '#94a3b8',
          marginBottom: '10px',
          fontFamily: 'monospace',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {data.url}
      </div>

      <div
        style={{
          fontSize: '10px',
          fontWeight: '500',
          color: isConnected ? '#22c55e' : '#94a3b8',
        }}
      >
        {isConnected ? '● Connected' : '○ Disconnected'}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: isConnected ? '#22c55e' : '#94a3b8',
          width: '10px',
          height: '10px',
          border: 'none',
        }}
      />
    </div>
  );
};

export default memo(MCPServerNode);
