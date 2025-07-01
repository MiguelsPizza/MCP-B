import { Position } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

export const nodeDefaults = {
  type: 'default',
  style: {
    borderRadius: '8px',
    padding: '10px',
    fontWeight: 500,
    fontSize: '14px',
    borderWidth: '2px',
    borderStyle: 'solid',
  },
};

export const transportNodeStyle = {
  ...nodeDefaults.style,
  backgroundColor: '#e1f5fe',
  borderColor: '#01579b',
  color: '#01579b',
};

export const serverNodeStyle = {
  ...nodeDefaults.style,
  backgroundColor: '#fff3e0',
  borderColor: '#e65100',
  color: '#e65100',
};

export const clientNodeStyle = {
  ...nodeDefaults.style,
  backgroundColor: '#f3e5f5',
  borderColor: '#4a148c',
  color: '#4a148c',
};

export const hubNodeStyle = {
  ...nodeDefaults.style,
  backgroundColor: '#fbb',
  borderColor: '#333',
  borderWidth: '4px',
  color: '#333',
};

export const proxyNodeStyle = {
  ...nodeDefaults.style,
  backgroundColor: '#bfb',
  borderColor: '#333',
  color: '#333',
};

export const edgeDefaults = {
  type: 'smoothstep',
  animated: true,
  style: {
    stroke: '#666',
    strokeWidth: 2,
  },
};

export const createHandle = (
  type: 'source' | 'target',
  position: Position,
  nodeWidth: number,
  nodeHeight: number
) => {
  const x =
    position === Position.Left ? 0 : position === Position.Right ? nodeWidth : nodeWidth / 2;
  const y =
    position === Position.Top ? 0 : position === Position.Bottom ? nodeHeight : nodeHeight / 2;
  return { type, position, x, y };
};

export const createNode = (
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  style: any,
  handlePositions: Position[] = [Position.Top, Position.Bottom]
): Node => ({
  id,
  position: { x, y },
  data: { label },
  width,
  height,
  style,
  handles: handlePositions.map((pos) =>
    createHandle(
      pos === Position.Top || pos === Position.Left ? 'target' : 'source',
      pos,
      width,
      height
    )
  ),
});

export const sequenceNodeStyle = {
  ...nodeDefaults.style,
  backgroundColor: '#fff',
  borderColor: '#ddd',
  color: '#333',
  borderRadius: '4px',
};

export const noteNodeStyle = {
  ...nodeDefaults.style,
  backgroundColor: '#fffbdd',
  borderColor: '#f6d55c',
  color: '#666',
  borderStyle: 'dashed',
  fontStyle: 'italic',
};
