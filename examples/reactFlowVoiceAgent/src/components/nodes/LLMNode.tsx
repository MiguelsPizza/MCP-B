import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

interface LLMNodeData {
  label: string;
}

const LLMNode: React.FC<NodeProps<LLMNodeData>> = ({ data }) => {
  return (
    <div style={{
      background: '#e3f2fd',
      border: '2px solid #1976d2',
      borderRadius: '10px',
      padding: '15px',
      minWidth: '150px',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#1976d2'
    }}>
      <div>🤖 {data.label}</div>
      <div style={{ fontSize: '12px', marginTop: '5px', fontWeight: 'normal' }}>
        LLM Client
      </div>
      
      {/* Output handle to connect to MCP servers */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#1976d2',
          width: '12px',
          height: '12px'
        }}
      />
    </div>
  );
};

export default memo(LLMNode); 