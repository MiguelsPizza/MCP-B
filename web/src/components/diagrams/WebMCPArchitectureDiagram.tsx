import React from 'react';

// Define marker for arrowheads
const ArrowMarker = ({ id, color }: { id: string; color: string }) => (
  <defs>
    <marker
      id={id}
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L0,6 L9,3 z" fill={color} />
    </marker>
  </defs>
);

// Component for a box with text
const Box = ({ 
  x, 
  y, 
  width, 
  height, 
  fill, 
  stroke, 
  strokeWidth = 2, 
  rx = 8,
  children,
  className = ''
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth?: number;
  rx?: number;
  children: React.ReactNode;
  className?: string;
}) => (
  <g className={className}>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      rx={rx}
    />
    {children}
  </g>
);

// Component for multi-line text
const MultilineText = ({ 
  x, 
  y, 
  lines, 
  fontSize = 14, 
  fontWeight = 'normal',
  fill = '#333',
  textAnchor = 'middle',
  lineHeight = 1.2
}: {
  x: number;
  y: number;
  lines: string[];
  fontSize?: number;
  fontWeight?: string;
  fill?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  lineHeight?: number;
}) => (
  <>
    {lines.map((line, i) => (
      <text
        key={i}
        x={x}
        y={y + i * fontSize * lineHeight}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={fill}
        textAnchor={textAnchor}
        dominantBaseline="middle"
      >
        {line}
      </text>
    ))}
  </>
);

// Component for a connection line
const Connection = ({ 
  x1, 
  y1, 
  x2, 
  y2, 
  color, 
  strokeWidth = 2, 
  markerId,
  label,
  labelBg = '#fff',
  animated = false
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth?: number;
  markerId?: string;
  label?: string;
  labelBg?: string;
  animated?: boolean;
}) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        markerEnd={markerId ? `url(#${markerId})` : undefined}
        className={animated ? 'animate-dash' : ''}
        strokeDasharray={animated ? '5,5' : undefined}
      />
      {label && (
        <>
          <rect
            x={midX - 40}
            y={midY - 10}
            width={80}
            height={20}
            fill={labelBg}
            rx={10}
          />
          <text
            x={midX}
            y={midY}
            fontSize={12}
            fill={color}
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="500"
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
};

export function WebMCPArchitectureDiagram() {
  return (
    <div className="w-full">
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -10;
            }
          }
          .animate-dash {
            animation: dash 1s linear infinite;
          }
        `}
      </style>
      <svg viewBox="0 0 1200 900" className="w-full h-auto">
        {/* Arrow markers */}
        <ArrowMarker id="arrow-blue" color="#1976d2" />
        <ArrowMarker id="arrow-purple" color="#7b1fa2" />
        <ArrowMarker id="arrow-green" color="#388e3c" />
        <ArrowMarker id="arrow-orange" color="#f57c00" />
        
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1200" height="900" fill="white" />
        <rect width="1200" height="900" fill="url(#grid)" />
        
        {/* Browser Environment Section */}
        <Box x={20} y={20} width={1160} height={500} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1}>
          <MultilineText 
            x={600} 
            y={45} 
            lines={['Browser Environment']} 
            fontSize={24} 
            fontWeight="bold"
          />
        </Box>
        
        {/* Domain Labels */}
        <MultilineText x={150} y={90} lines={['acme-store.com']} fontSize={12} fill="#6b7280" />
        <MultilineText x={150} y={240} lines={['inventory.corp.com']} fontSize={12} fill="#6b7280" />
        <MultilineText x={150} y={390} lines={['billing-platform.io']} fontSize={12} fill="#6b7280" />
        
        {/* MCP Servers (Browser Tabs) */}
        <Box x={50} y={110} width={200} height={100} fill="#dbeafe" stroke="#3b82f6" strokeWidth={3}>
          <MultilineText 
            x={150} 
            y={140} 
            lines={['E-commerce Site', 'MCP Server']} 
            fontSize={14} 
            fontWeight="bold"
            fill="#1e40af"
          />
          <MultilineText 
            x={150} 
            y={185} 
            lines={['🛒 searchProducts', '📦 addToCart']} 
            fontSize={11} 
            fill="#3730a3"
          />
        </Box>
        
        <Box x={50} y={260} width={200} height={100} fill="#dbeafe" stroke="#3b82f6" strokeWidth={3}>
          <MultilineText 
            x={150} 
            y={290} 
            lines={['Inventory System', 'MCP Server']} 
            fontSize={14} 
            fontWeight="bold"
            fill="#1e40af"
          />
          <MultilineText 
            x={150} 
            y={335} 
            lines={['📊 checkStock', '🔍 findSupplier']} 
            fontSize={11} 
            fill="#3730a3"
          />
        </Box>
        
        <Box x={50} y={410} width={200} height={100} fill="#dbeafe" stroke="#3b82f6" strokeWidth={3}>
          <MultilineText 
            x={150} 
            y={440} 
            lines={['Billing Platform', 'MCP Server']} 
            fontSize={14} 
            fontWeight="bold"
            fill="#1e40af"
          />
          <MultilineText 
            x={150} 
            y={485} 
            lines={['💳 processPayment', '📧 sendInvoice']} 
            fontSize={11} 
            fill="#3730a3"
          />
        </Box>
        
        {/* Content Scripts */}
        <Box x={350} y={130} width={140} height={60} fill="#e8eaf6" stroke="#5e35b1">
          <MultilineText 
            x={420} 
            y={160} 
            lines={['Content Script', '(Tool Discovery)']} 
            fontSize={12}
            fill="#4527a0"
          />
        </Box>
        
        <Box x={350} y={280} width={140} height={60} fill="#e8eaf6" stroke="#5e35b1">
          <MultilineText 
            x={420} 
            y={310} 
            lines={['Content Script', '(Tool Discovery)']} 
            fontSize={12}
            fill="#4527a0"
          />
        </Box>
        
        <Box x={350} y={430} width={140} height={60} fill="#e8eaf6" stroke="#5e35b1">
          <MultilineText 
            x={420} 
            y={460} 
            lines={['Content Script', '(Tool Discovery)']} 
            fontSize={12}
            fill="#4527a0"
          />
        </Box>
        
        {/* MCP Hub */}
        <Box x={590} y={200} width={260} height={180} fill="#fef3c7" stroke="#f59e0b" strokeWidth={4}>
          <MultilineText 
            x={720} 
            y={230} 
            lines={['Background Service Worker', 'MCP Tool Hub']} 
            fontSize={16} 
            fontWeight="bold"
            fill="#92400e"
          />
          <Box x={610} y={270} width={220} height={90} fill="#fffbeb" stroke="#f59e0b" strokeWidth={1}>
            <MultilineText 
              x={720} 
              y={285} 
              lines={['Aggregated Tools:']} 
              fontSize={11} 
              fontWeight="bold"
              fill="#78350f"
            />
            <MultilineText 
              x={720} 
              y={305} 
              lines={[
                'tab1_searchProducts',
                'tab1_addToCart',
                'tab2_checkStock',
                'tab2_findSupplier',
                'tab3_processPayment',
                'tab3_sendInvoice'
              ]} 
              fontSize={10} 
              fill="#92400e"
              lineHeight={1.4}
            />
          </Box>
        </Box>
        
        {/* Chat Sidebar */}
        <Box x={950} y={240} width={180} height={100} fill="#e0f2fe" stroke="#0284c7">
          <MultilineText 
            x={1040} 
            y={280} 
            lines={['Chat Sidebar', 'MCP Client']} 
            fontSize={14} 
            fontWeight="bold"
            fill="#075985"
          />
        </Box>
        
        {/* Connections - Discovery */}
        <Connection 
          x1={250} y1={160} 
          x2={350} y2={160} 
          color="#1976d2" 
          markerId="arrow-blue"
          label="Discover"
          animated={true}
        />
        <Connection 
          x1={250} y1={310} 
          x2={350} y2={310} 
          color="#1976d2" 
          markerId="arrow-blue"
          label="Discover"
          animated={true}
        />
        <Connection 
          x1={250} y1={460} 
          x2={350} y2={460} 
          color="#1976d2" 
          markerId="arrow-blue"
          label="Discover"
          animated={true}
        />
        
        {/* Connections - Register Tools */}
        <Connection 
          x1={490} y1={160} 
          x2={590} y2={240} 
          color="#f57c00" 
          markerId="arrow-orange"
          label="Register Tools"
          strokeWidth={3}
        />
        <Connection 
          x1={490} y1={310} 
          x2={590} y2={290} 
          color="#f57c00" 
          markerId="arrow-orange"
          label="Register Tools"
          strokeWidth={3}
        />
        <Connection 
          x1={490} y1={460} 
          x2={590} y2={340} 
          color="#f57c00" 
          markerId="arrow-orange"
          label="Register Tools"
          strokeWidth={3}
        />
        
        {/* Connection - Hub to Sidebar */}
        <Connection 
          x1={850} y1={290} 
          x2={950} y2={290} 
          color="#7b1fa2" 
          markerId="arrow-purple"
          label="Expose All Tools"
          strokeWidth={3}
        />
        
        {/* Local Development Environment Section */}
        <Box x={20} y={540} width={1160} height={340} fill="#f0fdf4" stroke="#bbf7d0" strokeWidth={1}>
          <MultilineText 
            x={600} 
            y={565} 
            lines={['Local Development Environment']} 
            fontSize={24} 
            fontWeight="bold"
          />
        </Box>
        
        {/* Native Messaging Host */}
        <Box x={510} y={600} width={220} height={100} fill="#c8e6c9" stroke="#388e3c" strokeWidth={3}>
          <MultilineText 
            x={620} 
            y={640} 
            lines={['Native Messaging Host', '(Chrome MCP)']} 
            fontSize={14} 
            fontWeight="bold"
            fill="#1b5e20"
          />
        </Box>
        
        {/* IDE Clients */}
        <Box x={200} y={760} width={140} height={80} fill="#e0f2fe" stroke="#0284c7">
          <MultilineText 
            x={270} 
            y={800} 
            lines={['Cursor', 'MCP Client']} 
            fontSize={14} 
            fontWeight="bold"
            fill="#075985"
          />
        </Box>
        
        <Box x={530} y={760} width={140} height={80} fill="#e0f2fe" stroke="#0284c7">
          <MultilineText 
            x={600} 
            y={800} 
            lines={['Cline', 'MCP Client']} 
            fontSize={14} 
            fontWeight="bold"
            fill="#075985"
          />
        </Box>
        
        <Box x={860} y={760} width={140} height={80} fill="#e0f2fe" stroke="#0284c7">
          <MultilineText 
            x={930} 
            y={800} 
            lines={['Claude Desktop', 'MCP Client']} 
            fontSize={14} 
            fontWeight="bold"
            fill="#075985"
          />
        </Box>
        
        {/* Connection - Hub to Native Host */}
        <Connection 
          x1={720} y1={380} 
          x2={620} y2={600} 
          color="#388e3c" 
          markerId="arrow-green"
          label="Bridge to Native"
          strokeWidth={4}
        />
        
        {/* Connections - Native Host to IDEs */}
        <Connection 
          x1={560} y1={700} 
          x2={310} y2={760} 
          color="#388e3c" 
          markerId="arrow-green"
          strokeWidth={2}
        />
        <Connection 
          x1={620} y1={700} 
          x2={600} y2={760} 
          color="#388e3c" 
          markerId="arrow-green"
          strokeWidth={2}
        />
        <Connection 
          x1={680} y1={700} 
          x2={890} y2={760} 
          color="#388e3c" 
          markerId="arrow-green"
          strokeWidth={2}
        />
        
        {/* Transport Labels */}
        <Box x={120} y={190} width={140} height={25} fill="#e3f2fd" stroke="none">
          <MultilineText 
            x={190} 
            y={202} 
            lines={['TabBrowserTransport']} 
            fontSize={11} 
            fill="#1565c0"
            fontStyle="italic"
          />
        </Box>
        
        <Box x={650} y={410} width={140} height={25} fill="#e8eaf6" stroke="none">
          <MultilineText 
            x={720} 
            y={422} 
            lines={['ExtensionTransport']} 
            fontSize={11} 
            fill="#4527a0"
            fontStyle="italic"
          />
        </Box>
        
        <Box x={740} y={480} width={160} height={25} fill="#c8e6c9" stroke="none">
          <MultilineText 
            x={820} 
            y={492} 
            lines={['Native App Messaging']} 
            fontSize={11} 
            fill="#2e7d32"
            fontStyle="italic"
          />
        </Box>
        
        {/* Communication method annotations */}
        <MultilineText 
          x={190} 
          y={145} 
          lines={['window.postMessage']} 
          fontSize={10} 
          fill="#6b7280"
          fontStyle="italic"
        />
        <MultilineText 
          x={740} 
          y={265} 
          lines={['chrome.runtime.Port']} 
          fontSize={10} 
          fill="#6b7280"
          fontStyle="italic"
        />
      </svg>
    </div>
  );
}