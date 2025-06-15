import React, { useState } from 'react';
import {
  ArrowRight,
  Book,
  Box,
  Check,
  ChevronRight,
  Code,
  Copy,
  FileCode,
  Globe,
  Package,
  Puzzle,
  Rocket,
  Terminal,
  Zap,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Code block component with copy functionality
const CodeBlock = ({
  code,
  language,
  title,
}: {
  code: string;
  language: string;
  title?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 text-xs text-zinc-400">
          <span className="font-mono">{title || language}</span>
        </div>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#1e1e1e',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Navigation item component
const NavItem = ({
  href,
  title,
  active,
  onClick,
}: {
  href: string;
  title: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <a
    href={href}
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={cn(
      'block px-3 py-2 text-sm rounded-md transition-colors',
      active
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    )}
  >
    {title}
  </a>
);

export const Documentation = () => {
  const [activeSection, setActiveSection] = useState('introduction');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigation = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'quick-start', title: 'Quick Start' },
    { id: 'architecture', title: 'Architecture' },
    { id: 'tab-transport', title: 'Tab Transport' },
    { id: 'extension-transport', title: 'Extension Transport' },
    { id: 'react-hooks', title: 'React Hooks' },
    { id: 'examples', title: 'Examples' },
    { id: 'api-reference', title: 'API Reference' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-muted/30 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5" />
            Documentation
          </h2>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavItem
                key={item.id}
                href={`#${item.id}`}
                title={item.title}
                active={activeSection === item.id}
                onClick={() => scrollToSection(item.id)}
              />
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-8 border-t">
          <h3 className="text-sm font-semibold mb-3">Resources</h3>
          <div className="space-y-2">
            <a
              href="https://github.com/alxnahas/B-MCP"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Code className="h-4 w-4" />
              GitHub Repository
            </a>
            <a
              href="https://npmjs.com/package/@mcp-b/transports"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Package className="h-4 w-4" />
              NPM Package
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">B-MCP Documentation</h1>
              <p className="text-xl text-muted-foreground mt-1">
                Browser-based Model Context Protocol
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Badge variant="secondary">v1.0.0</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">React</Badge>
          </div>
        </header>

        {/* Introduction Section */}
        <section id="introduction" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Introduction</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What is B-MCP?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                B-MCP brings the power of the Model Context Protocol (MCP) to the browser, enabling
                AI agents to interact with web applications using existing authentication and
                structured data access instead of screen scraping.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex gap-3">
                  <Zap className="h-5 w-5 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Use Existing Auth</h4>
                    <p className="text-sm text-muted-foreground">
                      Leverage browser cookies, sessions, and OAuth
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Puzzle className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Structured Access</h4>
                    <p className="text-sm text-muted-foreground">
                      MCP tools instead of HTML parsing
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Cross-Domain Workflows</h4>
                    <p className="text-sm text-muted-foreground">
                      Orchestrate across multiple web apps
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Box className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Browser Security</h4>
                    <p className="text-sm text-muted-foreground">
                      Operates within existing permissions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h3 className="text-xl font-semibold mb-4">The Problem</h3>
            <p className="text-muted-foreground mb-4">
              Most white-collar work happens in the browser, yet MCP's solution has been to bypass
              browsers entirely and connect directly to APIs. This creates two major issues:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span>
                  <strong>Authentication complexity</strong> - MCP is essentially reinventing auth
                  systems that browsers have already solved
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span>
                  <strong>Poor agent experience</strong> - Browser automation tools force LLMs to
                  parse visual content and irrelevant HTML
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Quick Start Section */}
        <section id="quick-start" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Quick Start</h2>

          <Tabs defaultValue="web" className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="web">Web Developers</TabsTrigger>
              <TabsTrigger value="extension">Extension Users</TabsTrigger>
            </TabsList>

            <TabsContent value="web" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Install the package</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    language="bash"
                    code="npm install @mcp-b/transports @modelcontextprotocol/sdk"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Create an MCP server in your web app</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    language="typescript"
                    title="app.ts"
                    code={`import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';

// Create your MCP server
const server = new McpServer({
  name: 'MyWebApp',
  version: '1.0.0',
});

// Expose your app's functionality as tools
server.tool(
  'createItem',
  { name: z.string(), description: z.string() },
  async ({ name, description }) => {
    const item = await api.createItem({ name, description });
    return {
      content: [{
        type: 'text',
        text: \`Created item: \${item.id}\`
      }]
    };
  }
);

// Connect to make it discoverable
const transport = new TabServerTransport();
await server.connect(transport);`}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. That's it!</CardTitle>
                  <CardDescription>
                    Your web app now exposes MCP tools that AI agents can use
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="extension" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Clone and build</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    language="bash"
                    code={`git clone https://github.com/alxnahas/B-MCP.git
cd B-MCP
pnpm install
pnpm build`}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Load the extension</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    <li>
                      1. Open Chrome and navigate to{' '}
                      <code className="px-1 py-0.5 bg-muted rounded">chrome://extensions</code>
                    </li>
                    <li>2. Enable "Developer mode"</li>
                    <li>3. Click "Load unpacked"</li>
                    <li>
                      4. Select the{' '}
                      <code className="px-1 py-0.5 bg-muted rounded">extension/dist</code> folder
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Visit B-MCP enabled sites</CardTitle>
                  <CardDescription>
                    The extension will automatically detect and connect to MCP servers on any page
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Architecture</h2>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <pre className="inline-block text-sm text-left">
                    {`┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Page      │     │ Content Script  │     │   Extension     │
│                 │     │                 │     │                 │
│ MCP Server      │<--->│     Relay      │<--->│  MCP Client    │
│ (Tab Transport) │     │                 │     │  + LLM Chat    │
└─────────────────┘     └─────────────────┘     └─────────────────┘`}
                  </pre>
                </div>

                <div className="grid gap-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Web Page</h4>
                      <p className="text-sm text-muted-foreground">
                        Runs an MCP server using TabServerTransport, exposing it on window.mcp
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Content Script</h4>
                      <p className="text-sm text-muted-foreground">
                        Injected by the extension to relay messages between the page and background
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Extension</h4>
                      <p className="text-sm text-muted-foreground">
                        Contains the MCP client and AI chat interface, connects via
                        ExtensionClientTransport
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h3 className="text-xl font-semibold mb-4">How It Works</h3>
            <p className="text-muted-foreground">
              B-MCP introduces two new transport layers that enable MCP communication in browser
              environments:
            </p>
          </div>
        </section>

        {/* Tab Transport Section */}
        <section id="tab-transport" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Tab Transport</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                In-Page Communication
              </CardTitle>
              <CardDescription>
                Use when your MCP server and client are running in the same browser tab
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                The Tab Transport uses a MessageChannel and a global window.mcp object for
                communication. This is perfect for single-page applications that want to expose
                functionality to AI agents.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Server Setup</h3>
              <CodeBlock
                language="typescript"
                title="server.ts"
                code={`import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';

// 1. Create an MCP server
const server = new McpServer({
  name: 'WebAppServer',
  version: '1.0.0',
});

// 2. Add tools
server.tool(
  'add',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }],
  })
);

// 3. Connect to transport
const transport = new TabServerTransport();
await server.connect(transport);

console.log('MCP Tab Server is running.');`}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Client Setup</h3>
              <CodeBlock
                language="typescript"
                title="client.ts"
                code={`import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

// 1. Create transport
const transport = new TabClientTransport('mcp', {
  clientInstanceId: 'my-web-app-client',
});

// 2. Create client
const client = new Client({
  name: 'WebAppClient',
  version: '1.0.0',
});

// 3. Connect and use
await client.connect(transport);
const result = await client.callTool({
  name: 'add',
  arguments: { a: 5, b: 10 },
});

console.log('Result:', result.content[0].text); // "15"`}
              />
            </div>
          </div>
        </section>

        {/* Extension Transport Section */}
        <section id="extension-transport" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Extension Transport</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Puzzle className="h-5 w-5" />
                Cross-Context Communication
              </CardTitle>
              <CardDescription>
                Allows browser extensions to communicate with MCP servers running in web pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The Extension Transport enables communication across browser contexts through a
                relay system: Extension UI ↔ Background Script ↔ Content Script ↔ Page Script
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Background Script</h3>
              <CodeBlock
                language="typescript"
                title="background.ts"
                code={`import { setupBackgroundBridge } from '@mcp-b/transports/extension';

// Set up the central bridge to route messages
setupBackgroundBridge();`}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Content Script</h3>
              <CodeBlock
                language="typescript"
                title="contentScript.ts"
                code={`import { mcpRelay } from '@mcp-b/transports/extension';

// Relay messages between page and background
mcpRelay();`}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Extension UI</h3>
              <CodeBlock
                language="typescript"
                title="popup.tsx"
                code={`import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

// 1. Create extension transport
const transport = new ExtensionClientTransport({
  clientInstanceId: 'my-extension-ui-client',
});

// 2. Create MCP client
const client = new Client({
  name: 'MyExtensionUI',
  version: '1.0.0',
});

// 3. Connect and use
await client.connect(transport);
const result = await client.callTool({
  name: 'add',
  arguments: { a: 20, b: 22 },
});

console.log('Result from page:', result.content[0].text); // "42"`}
              />
            </div>
          </div>
        </section>

        {/* React Hooks Section */}
        <section id="react-hooks" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">React Hooks</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                @mcp-b/mcp-react-hooks
              </CardTitle>
              <CardDescription>
                Simplify MCP integration in React applications with ready-to-use hooks
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Installation</h3>
              <CodeBlock language="bash" code="npm install @mcp-b/mcp-react-hooks" />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Basic Usage</h3>
              <CodeBlock
                language="typescript"
                title="App.tsx"
                code={`import { McpProvider, useMcpClient } from '@mcp-b/mcp-react-hooks';
import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

// Create transport and client outside components
const transport = new TabClientTransport('mcp', {
  clientInstanceId: 'my-react-app',
});

const mcpClient = new Client({
  name: 'MyReactApp',
  version: '1.0.0',
});

// Wrap your app
function App() {
  return (
    <McpProvider transport={transport} mcpClient={mcpClient}>
      <MyComponent />
    </McpProvider>
  );
}

// Use the hook in components
function MyComponent() {
  const { client, tools, resources, isConnected } = useMcpClient();

  if (!isConnected) {
    return <div>Connecting to MCP Server...</div>;
  }

  return (
    <div>
      <h2>Available Tools</h2>
      {tools.map(tool => (
        <div key={tool.name}>{tool.name}</div>
      ))}
    </div>
  );
}`}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Dynamic Tool Registration</h3>
              <CodeBlock
                language="typescript"
                title="DynamicTool.tsx"
                code={`import { useEffect } from 'react';
import { useMcpServer } from '@mcp-b/mcp-react-hooks';
import { z } from 'zod';

function DynamicGreeterTool() {
  const server = useMcpServer();

  useEffect(() => {
    const tool = server.tool(
      'greet',
      { name: z.string() },
      async ({ name }) => ({
        content: [{ 
          type: 'text', 
          text: \`Hello, \${name}!\` 
        }],
      })
    );

    // Cleanup on unmount
    return () => tool.remove();
  }, [server]);

  return <div>Greet tool is active</div>;
}`}
              />
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Examples</h2>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Todo Application</CardTitle>
                <CardDescription>
                  A simple todo app that exposes CRUD operations as MCP tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="typescript"
                  code={`server.tool('createTodo', { text: z.string() }, async ({ text }) => {
  const todo = await db.todos.create({ text, completed: false });
  return { content: [{ type: 'text', text: \`Created: \${todo.id}\` }] };
});

server.tool('completeTodo', { id: z.string() }, async ({ id }) => {
  await db.todos.update(id, { completed: true });
  return { content: [{ type: 'text', text: 'Todo completed' }] };
});

server.tool('listTodos', {}, async () => {
  const todos = await db.todos.findAll();
  return { 
    content: [{ 
      type: 'text', 
      text: JSON.stringify(todos, null, 2) 
    }] 
  };
});`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>E-commerce Integration</CardTitle>
                <CardDescription>
                  Expose product search and cart operations to AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="typescript"
                  code={`server.tool(
  'searchProducts',
  { query: z.string(), maxResults: z.number().optional() },
  async ({ query, maxResults = 10 }) => {
    const products = await productAPI.search(query, { limit: maxResults });
    return {
      content: [{
        type: 'text',
        text: products.map(p => \`\${p.name} - $\${p.price}\`).join('\\n')
      }]
    };
  }
);

server.tool(
  'addToCart',
  { productId: z.string(), quantity: z.number() },
  async ({ productId, quantity }) => {
    const item = await cartAPI.addItem(productId, quantity);
    return {
      content: [{
        type: 'text',
        text: \`Added \${quantity}x \${item.name} to cart\`
      }]
    };
  }
);`}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* API Reference Section */}
        <section id="api-reference" className="mb-16">
          <h2 className="text-3xl font-bold mb-6">API Reference</h2>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>TabServerTransport</CardTitle>
                <CardDescription>Transport for MCP servers running in web pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-sm mb-2">
                      constructor(options?: TabServerTransportOptions)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Creates a new TabServerTransport instance
                    </p>
                  </div>
                  <div>
                    <h4 className="font-mono text-sm mb-2">connect(): Promise&lt;void&gt;</h4>
                    <p className="text-sm text-muted-foreground">
                      Establishes the connection and exposes the server on window.mcp
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>TabClientTransport</CardTitle>
                <CardDescription>
                  Transport for MCP clients connecting to in-page servers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-sm mb-2">
                      constructor(namespace: string, options: TabClientTransportOptions)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Creates a new TabClientTransport instance
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-mono mb-1">Parameters:</p>
                      <ul className="text-xs space-y-1">
                        <li>
                          <code>namespace</code> - The window property where the server is exposed
                          (e.g., 'mcp')
                        </li>
                        <li>
                          <code>options.clientInstanceId</code> - Unique identifier for this client
                          instance
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ExtensionClientTransport</CardTitle>
                <CardDescription>
                  Transport for browser extensions to connect to page MCP servers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-sm mb-2">
                      constructor(options: ExtensionClientTransportOptions)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Creates a new ExtensionClientTransport instance
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-mono mb-1">Parameters:</p>
                      <ul className="text-xs space-y-1">
                        <li>
                          <code>options.clientInstanceId</code> - Unique identifier for this client
                          instance
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>React Hooks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-mono text-sm mb-2">useMcpClient(opts?)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Hook for accessing MCP client data and status
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-mono mb-1">Returns:</p>
                      <ul className="text-xs space-y-1">
                        <li>
                          <code>client</code> - The MCP Client instance
                        </li>
                        <li>
                          <code>resources</code> - Array of available resources
                        </li>
                        <li>
                          <code>tools</code> - Array of available tools
                        </li>
                        <li>
                          <code>isLoading</code> - Loading state
                        </li>
                        <li>
                          <code>error</code> - Any connection error
                        </li>
                        <li>
                          <code>isConnected</code> - Connection status
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-mono text-sm mb-2">useMcpServer()</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Hook for accessing the shared MCP server instance
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-mono mb-1">Returns:</p>
                      <ul className="text-xs space-y-1">
                        <li>
                          <code>McpServer</code> - The server instance for dynamic tool registration
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              B-MCP is not affiliated with Anthropic or the official Model Context Protocol project.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/alxnahas/B-MCP"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href="mailto:alexmnahas@gmail.com"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
