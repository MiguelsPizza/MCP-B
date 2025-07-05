import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import { ArrowRight, Check, Copy, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FullSpecMcpB from '../assets/full-spec-mcp-b.svg?react';
import LocalMcp from '../assets/local-mcp.svg?react';
import MultiSiteWorkflow from '../assets/multi-site-workflow.svg?react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="h-9 px-3 text-sm bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 shadow-md"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg sm:rounded-xl border border-zinc-800 shadow-lg">
        <div className="flex items-center justify-between bg-zinc-900 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm text-zinc-400">
          <span className="font-mono">{language}</span>
        </div>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#1e1e1e',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            overflow: 'auto',
            maxWidth: '100%',
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

const BlogPost = () => {
  const { isConnected } = useMcpClient();
  // const [, setDemoState] = useState({
  //   authFlowDemo: false,
  // });

  // const runDemo = async (demoName: string) => {
  //   if (!client || !isConnected) {
  //     toast.error('mcp-b extension not detected. Install it to try the demos!');
  //     return;
  //   }

  //   if (demoName === 'authFlow') {
  //     // Placeholder for auth flow comparison demo
  //     setDemoState((prev) => ({ ...prev, authFlowDemo: true }));
  //     toast.success('Authentication flow demo completed!');
  //   }
  // };

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pb-20 sm:pb-24 lg:pb-32">
      {/* Header */}
      <header className="mb-8 sm:mb-12 lg:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
          MCP is great, but we're putting our servers in the wrong place
        </h1>
      </header>

      {/* MCP Status indicator */}
      {isConnected && (
        <div className="mb-6 sm:mb-8 lg:mb-12 p-4 sm:p-5 lg:p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
          <p className="text-sm sm:text-base font-medium text-green-800 dark:text-green-200">
            ✓ mcp-b is active on this page. Try the interactive demos below!
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none space-y-6 sm:space-y-8">
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8 sm:mb-10 lg:mb-12 italic">
          This Article assumes you have some knowledge of the Model Context Protocol (MCP). if you
          are not a dev, or just want to use the extension,{' '}
          <a href="/" className="text-blue-600 dark:text-blue-400 underline">
            The MCP-B landing page
          </a>{' '}
          is a better place to go.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          The Current Architecture and Its Limitations
        </h2>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          Today's MCP implementations follow a predictable pattern. Developers run MCP servers
          locally, either exposing system processes or wrapping API clients that execute on their
          machines. Authentication is handled through environment variables or configuration files
          containing API keys. This works well enough for the intended audience (developers
          comfortable with command-line tools and JSON configurations) but it creates an
          insurmountable barrier for everyone else.
        </p>

        <div className="my-8 sm:my-12 lg:my-16 not-prose">
          <LocalMcp />
        </div>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          The MCP creators recognized this limitation and proposed a solution: remote MCP servers
          authenticated via OAuth 2.1. Instead of running locally, these servers live in the cloud
          and expose their functionality via URLs. Users simply add the URL to their configuration,
          and theoretically, anyone can benefit from MCP's capabilities.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          Remote MCPs Have a Serious Auth Problem
        </h2>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          Moving MCP servers to the cloud introduces a fundamental challenge: authentication and
          authorization. When a server runs locally, it implicitly operates with the user's
          permissions. Move that same server to a shared environment, and suddenly you need to
          answer difficult questions. Which users can access this server? What data are they allowed
          to see? What actions can they perform?
        </p>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          The MCP specification addresses this through OAuth 2.1, a robust but notoriously complex
          authentication framework. To understand why this is problematic, consider what's required
          for a single authenticated request: This is just the authentication flow. The
          implementation requires discovery endpoints, dynamic client registration, PKCE (Proof Key
          for Code Exchange) to prevent authorization code interception, token refresh logic, and
          audience validation on every request. What started as a simple protocol for tool
          integration has morphed into a distributed systems problem requiring expertise in both
          OAuth and secure API design.
        </p>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          Even if you successfully implement OAuth, you haven't solved the underlying security
          challenge. The MCP server still needs to enforce access controls, validate that users can
          only access their own data, and ensure that the AI assistant operating on their behalf
          doesn't exceed their permissions. You're essentially rebuilding the entire authentication
          and authorization layer that already exists in your web application.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          A Different Approach: Browser-Native MCP & Turning Your Website into an MCP Server
        </h2>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          What if we're thinking about this problem incorrectly? Instead of trying to recreate
          authentication infrastructure, what if we leverage the authentication that already exists?
        </p>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          Web browsers have spent decades solving exactly these problems. They manage user sessions,
          handle authentication cookies, enforce same-origin policies, and provide secure
          communication channels. Every web application already has authentication built in. Why not
          use it?
        </p>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          This is the core insight behind MCP-B: instead of running MCP servers as separate
          processes or cloud services, we embed them directly into web pages. The MCP server becomes
          part of your web application, using the same authenticated APIs that your frontend already
          uses.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          How MCP-B Works
        </h2>

        <p className="leading-loose text-lg mb-8">
          The architecture consists of three main components:
        </p>

        <div className="my-8 sm:my-12 lg:my-16 not-prose">
          <FullSpecMcpB />
        </div>

        <p className="leading-loose text-lg mb-8">
          <strong>Tab MCP Servers</strong> run inside web pages, implemented in JavaScript alongside
          your application code. They expose tools that interact with your authenticated APIs using
          the browser's built-in credential management. When a tool needs to create an invoice, it
          simply calls your existing API endpoint (which is hopefully properly authenticated) and
          the browser automatically attaches the appropriate cookies or authorization headers.
        </p>

        <p className="leading-loose text-lg mb-8">
          <strong>The MCP-B Extension</strong> acts as a bridge between tab servers and AI
          assistants. Its content script communicates with TabServerTransports servers via a
          TabClientTransport, while a background service worker aggregates all available MCP servers
          across open tabs. This hub maintains a unified tool registry and routes requests to the
          appropriate tab.
        </p>

        <p className="leading-loose text-lg mb-8">
          <strong>Transport Layers</strong> handle the communication between components. The
          TabBrowserTransport enables secure message passing between content scripts and tab
          servers, while the ExtensionTransport facilitates communication between the background hub
          and any connected clients, including the built-in chat interface.
        </p>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          The beauty of this approach is its simplicity. Authentication just works: Compare this to
          the OAuth flow we examined earlier. No discovery endpoints, no token management, no PKCE
          challenges. The browser handles everything using the same session management your users
          already rely on.
        </p>

        <div className="my-8 sm:my-12 lg:my-16 not-prose"></div>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          How Is This Different From Other Browser Automation MCPs?
        </h2>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          At this point I should probably call out the existing solutions in the space, and how
          MCP-B is different.
        </p>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          The idea of browser automation through MCP is not unique to MCP-B, the difference is how
          we are going about it. MCP-B is purely JSON-RPC from browser tab, to extension to the
          local MCP host of your choosing. You are not asking the model to look at a screen shot,
          use clunky browser automation apis and guess about how to interact with a page. MCP-B
          exposes exactly what a website wants to open to the AI. Simply put, it gives the model a
          solid and consistent Agent Experience.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          Implementation Details
        </h2>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          Creating a MCP-B server requires minimal code changes to your existing application. Here's
          a complete implementation:
        </p>

        <div className="my-8 sm:my-12 lg:my-16 not-prose">
          <div className="my-12">
            <CodeBlock
              language="typescript"
              code={`import { TabServerTransport } from '@webmcp/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'invoice-system',
  version: '1.0.0'
});

server.tool('createInvoice', 'Create a new invoice', {
  customerEmail: z.string().email(),
  items: z.array(z.object({
    description: z.string(),
    amount: z.number()
  }))
}, async ({ customerEmail, items }) => {
  // This is just a normal fetch to your existing API
  const response = await yourPreAuthorizedApiClient('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerEmail, items })
  });

  if (!response.ok) {
    throw new Error(\`Failed to create invoice: \${response.statusText}\`);
  }
  // You get full control over what the model get's to know about the response
  return { content: [{ type: 'text', text: JSON.stringify(await response.json())  }] };
});

const transport = new TabServerTransport();
// This server is now callable by the mcp-b chrome extension
await server.connect(transport);`}
            />
          </div>
        </div>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          The key insight here is that your MCP tools are just thin wrappers around your existing
          APIs. You don't need to implement new authentication, create separate endpoints, or manage
          additional infrastructure. The same APIs your React components call can now be called by
          AI assistants, with the same security guarantees.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          Try It Live: Extension + MCP in Action
        </h2>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          Want to see MCP-B in action right now? This page has an MCP server built in, and you can
          use the extension to interact with it.
        </p>

        <div className="my-8 sm:my-12 lg:my-16 not-prose">
          <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 shadow-xl">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-lg">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">
                    Live Demo: Create a Todo with MCP-B
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                    Experience the power of browser-native MCP with this simple demo:
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">
                          Install the MCP-B Extension
                        </p>
                        <a
                          href="https://chromewebstore.google.com/detail/mcp-b/daohopfhkdelnpemnhlekblhnikhdhfa"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Download from Chrome Web Store
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">
                          Open the Extension
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Click the extension icon in your browser toolbar
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">
                          Create a Todo
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Type "Create a todo: Learn about MCP-B" in the chat
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs sm:text-sm">
                      <strong>What's happening:</strong> The extension is calling the{' '}
                      <code className="px-1 sm:px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">
                        createTodo
                      </code>{' '}
                      tool exposed by this page's MCP server. The todo will appear in the list
                      above!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          This simple demo showcases the core innovation of MCP-B: your web pages become MCP servers
          that AI assistants can interact with using your existing authentication. No OAuth flows,
          no API keys, no complex setup—just the browser you already trust.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          Cross-Site Workflows: The Real Power
        </h2>
        <div className="my-16">
          <MultiSiteWorkflow />
        </div>
        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          Where MCP-B truly shines is in enabling workflows that span multiple web applications.
          Each system maintains its own authentication and access controls. The AI assistant
          operates with exactly the permissions of the logged-in user—no more, no less. If the user
          doesn't have access to create purchase orders above a certain amount, neither does the AI.
          This security model is both simple and robust because it relies on existing, battle-tested
          mechanisms.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          The Path Forward
        </h2>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          MCP-B represents a fundamental shift in how we think about AI tool integration. Instead of
          building new infrastructure and authentication systems, we're leveraging the web
          platform's existing capabilities. This approach offers several advantages:
        </p>

        <p className="leading-loose text-lg mb-8">
          For developers, implementation is straightforward. You're not learning new authentication
          frameworks or managing additional infrastructure. Your existing APIs become AI-accessible
          with minimal code changes.
        </p>

        <p className="leading-loose text-lg mb-8">
          For users, there's no configuration required. They sign into websites normally, and AI
          assistants automatically gain appropriate access. The security model is intuitive because
          it mirrors their existing mental model of web permissions.
        </p>

        <p className="leading-loose text-lg mb-8">
          For enterprises, MCP-B provides control without complexity. The MCP server is part of your
          application, running your code, using your authentication. There's no third-party service
          to trust, no additional attack surface to defend.
        </p>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          Most importantly, this approach scales. As more websites add MCP-B support, AI assistants
          become increasingly capable of complex, cross-application workflows. The same network
          effects that made the web successful can now apply to AI automation.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold mt-12 sm:mt-14 lg:mt-16 mb-6 sm:mb-8">
          Getting Started
        </h2>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          To experiment with MCP-B, start by installing the Chrome extension and visiting a demo
          site. For your own applications, the @MCP-B/transports package provides everything needed
          to add MCP support to existing web applications. The implementation typically requires
          less than 50 lines of code and can be gradually rolled out alongside existing
          functionality.
        </p>

        <p className="leading-loose text-lg mb-8">
          The protocol is open, the transports are extensible, and the potential applications are
          limited only by imagination. By putting MCP servers where authentication already lives—in
          the browser—we can finally deliver on the promise of AI automation for everyone, not just
          developers.
        </p>

        <p className="leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          The future of AI assistance isn't in complex OAuth flows or managed infrastructure. It's
          in the browser you already have open.
        </p>

        <p className="mt-16 leading-loose text-lg mb-6">
          The one thing that is nice about the MCP-B extension is that it acts as an MCP of MCP that
          other extensions can connect to. If you want to add MCP-B support to your AI extension,
          please reach out and I will help you onboard it.
        </p>

        <p className="mt-8 leading-loose text-lg">
          For implementation details, examples, and to contribute to the project, visit my{' '}
          <a
            href="https://github.com/MiguelsPizza/WebMCP"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            GitHub repository
          </a>{' '}
          or reach out at{' '}
          <a
            href="mailto:alexmnahas@gmail.com"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            alexmnahas@gmail.com
          </a>
        </p>
      </div>
    </article>
  );
};

export default BlogPost;
