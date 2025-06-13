import React, { useEffect, useState } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle,
  Clock,
  Copy,
  FileText,
  Loader2,
  Mail,
  Package,
  Play,
  ShoppingCart,
  Terminal,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

// Code block component with copy functionality and syntax highlighting
const CodeBlock = ({ code, language }: { code: string; language: string }) => {
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

const BlogPost = () => {
  const { client, isConnected, connect } = useMcpClient({});
  const [demoState, setDemoState] = useState({
    createdFirstTodo: false,
    workflowSteps: [] as string[],
    isRunningWorkflow: false,
    currentStep: -1,
  });

  useEffect(() => {
    connect().catch((error) => {
      console.error('Failed to connect to MCP server', error);
    });
  }, []);

  const runDemo = async (demoName: string) => {
    if (!client || !isConnected) {
      toast.error('mcp-b extension not detected. Install it to try the demos!');
      return;
    }

    if (demoName === 'firstTodo') {
      try {
        await client.callTool({
          name: 'createTodo',
          arguments: { todoText: 'Learn about mcp-b' },
        });
        setDemoState((prev) => ({ ...prev, createdFirstTodo: true }));
        toast.success('Created your first mcp-b todo!');
      } catch (error: any) {
        console.error('First todo creation failed:', error);
        toast.error('Failed to create todo', {
          description: error.message || 'Unknown error',
        });
      }
    }

    if (demoName === 'workflow') {
      const steps = [
        { text: 'Send PO to accounting', icon: FileText },
        { text: 'Check inventory for sub-parts', icon: Package },
        { text: 'Order missing parts from McMaster-Carr', icon: ShoppingCart },
        { text: 'Schedule machine time', icon: Clock },
        { text: 'Calculate delivery date', icon: Calculator },
        { text: 'Email timeline to customer', icon: Mail },
      ];

      setDemoState((prev) => ({ ...prev, isRunningWorkflow: true, currentStep: -1 }));

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setDemoState((prev) => ({ ...prev, currentStep: i }));

        try {
          await client.callTool({
            name: 'createTodo',
            arguments: { todoText: step.text },
          });
          setDemoState((prev) => ({
            ...prev,
            workflowSteps: [...prev.workflowSteps, step.text],
          }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error('Workflow step failed:', error);
          toast.error(`Failed at step: ${step.text}`, {
            description: error.message || 'Unknown error',
          });
          setDemoState((prev) => ({ ...prev, isRunningWorkflow: false }));
          break;
        }
      }

      if (demoState.workflowSteps.length === steps.length - 1) {
        toast.success('Workflow simulation complete!', {
          description: 'All tasks have been created successfully',
        });
      }
      setDemoState((prev) => ({ ...prev, isRunningWorkflow: false, currentStep: -1 }));
    }
  };

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">
          mcp-b: Bringing the benefits of MCP to the browser
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          And solving some key pain points in the process
        </p>
      </header>

      {/* MCP Status indicator */}
      {isConnected && (
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            ✓ mcp-b is active on this page. Try the interactive demos below!
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>
          I think it's fair to say that MCP has become the de facto standard for allowing LLMs to
          interact with the external world. I've had a number of conversations that sound something
          like this:
        </p>

        <blockquote className="my-6 pl-6 border-l-4 border-gray-300 dark:border-gray-700">
          <p className="italic">"MCP is what is going to replace white collar jobs"</p>
        </blockquote>

        <p>
          As much as this might be true for things like Excel, most white collar jobs take place in
          some large part, in the browser. The MCP solution to this so far has been "bypass the
          browser and go straight to the API". As a result, MCP is now trying to re-invent Auth. I
          think this is a noble cause, and one that has much promise, but it will be some time
          before you see teams putting any important workflows behind an MCP.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Agents as Users</h2>

        <p>
          If you want an agent to act on your behalf, you are essentially allowing this agent to be
          you as far as the backend is concerned. So the obvious solution is to allow the agent to
          automate the browser since this is where all of the user authentication is already built
          and presumably stable.
        </p>

        <p>
          Some very notable projects in this space are BrowserMCP and Playwright MCP. Both aim to
          interact with backends via the browser instead of interacting with APIs directly. The
          issue with this approach is the agent experience is terrible. LLM performance
          significantly degrades when using these automation tools since it forces them to ingest
          lots of irrelevant context often through its less preferred medium (vision instead of
          text).
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">The Solution</h2>

        <p>
          So how do we solve this? How do we get the benefits and safety from existing client side
          APIs while still providing good AIX for our models?
        </p>

        <p>
          Well, why not use MCP? But instead of declaring the MCP server locally as a script that
          runs on the computer, just have the MCP server be inside the webpage. That means that any
          MCP host can connect to this MCP server by visiting the website and leverage existing auth
          mechanics already in place in the client side API.
        </p>

        {/* First Demo */}
        {isConnected && !demoState.createdFirstTodo && (
          <div className="my-8 not-prose">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <p className="text-sm mb-4">
                  This page is running a mcp-b server right now. Try it:
                </p>
                <Button
                  onClick={() => runDemo('firstTodo')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Your First mcp-b Todo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {demoState.createdFirstTodo && (
          <div className="my-8 not-prose">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Success! You just created a todo using mcp-b.
              </span>
            </div>
          </div>
        )}

        <p>
          Ok great! We've got the server down, but how do we call it? We still need a client and an
          LLM to use that client. Does that mean we have to ship a chat app inside every website?
          That seems like a lot for not much gain. Plus we are still not getting the benefits of
          multi-domain workflows like you get with existing browser automation MCPs.
        </p>

        <p>
          What if you had a chat application as a browser extension that would automatically connect
          to the tab's MCP server when the user visits the page? Turns out that is possible and,
          well, I wrote it.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">mcp-b Architecture</h2>

        <p>mcp-b introduces two new transports:</p>

        <ol className="my-6 space-y-2">
          <li>
            <strong>Tab Transports</strong> - For MCP servers running in web pages
          </li>
          <li>
            <strong>Extension Transports</strong> - For browser extensions to connect as MCP clients
          </li>
        </ol>

        <p>The flow is as follows:</p>

        <div className="my-8 not-prose">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-gray-500" />
                  <span>Tab opens → MCP server initializes on window.mcp</span>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span>Extension detects server and injects relay script</span>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span>Background service worker establishes connection</span>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span>Extension UI can now call tools on the page</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mt-12 mb-6">Real World Example</h2>

        <p>
          So what does this look like from a user perspective? Let's say John Smith working at a
          machine shop just got an order for 4 valves. His day looks like this:
        </p>

        <ol className="my-6 space-y-2">
          <li>Send the PO over to accounting</li>
          <li>Check the internal IMS to see if they have the right sub parts in stock</li>
          <li>Go to McMasterCarr.com to order the missing subparts</li>
          <li>Register the request with the machine shop with the order and required parts</li>
          <li>Calculate an estimated delivery time</li>
          <li>Relay this estimate back to the customer</li>
        </ol>

        <p>
          If you wanted to realistically have a model automate this workflow, you would need it to
          visit 6 websites, send emails, read emails and more.
        </p>

        <p>
          Let's assume now that each of these websites has their own MCP. An agent in the Chrome
          sidebar could connect to each of them and know which website to go to based on context.
          Since this happens in the browser, all auth that is already saved in the browser can be
          re-used for those domains.
        </p>

        {/* Workflow Demo */}
        {isConnected && !demoState.isRunningWorkflow && demoState.workflowSteps.length === 0 && (
          <div className="my-8 not-prose">
            <Card className="border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Terminal className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Try the Workflow Demo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Watch mcp-b simulate John's multi-step workflow by creating todos for each
                      task
                    </p>
                    <Button
                      onClick={() => runDemo('workflow')}
                      variant="default"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run Workflow Simulation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(demoState.isRunningWorkflow || demoState.workflowSteps.length > 0) && (
          <div className="my-8 not-prose">
            <Card className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Workflow Automation in Progress</h3>
                  {demoState.isRunningWorkflow && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Send PO to accounting', icon: FileText },
                    { text: 'Check inventory for sub-parts', icon: Package },
                    { text: 'Order missing parts from McMaster-Carr', icon: ShoppingCart },
                    { text: 'Schedule machine time', icon: Clock },
                    { text: 'Calculate delivery date', icon: Calculator },
                    { text: 'Email timeline to customer', icon: Mail },
                  ].map((step, i) => {
                    const isCompleted = demoState.workflowSteps.includes(step.text);
                    const isActive = demoState.currentStep === i;
                    const Icon = step.icon;

                    return (
                      <div
                        key={i}
                        className={`
                          relative flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                          ${
                            isCompleted
                              ? 'bg-green-50 dark:bg-green-950/20'
                              : isActive
                                ? 'bg-blue-50 dark:bg-blue-950/20 shadow-sm'
                                : 'bg-gray-50 dark:bg-gray-950/20'
                          }
                        `}
                      >
                        <div
                          className={`
                          flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                          ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isActive
                                ? 'bg-blue-500 text-white animate-pulse'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                          }
                        `}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : isActive ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1">
                          <p
                            className={`
                            text-sm font-medium transition-colors duration-300
                            ${
                              isCompleted
                                ? 'text-green-700 dark:text-green-300'
                                : isActive
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-gray-500 dark:text-gray-400'
                            }
                          `}
                          >
                            {step.text}
                          </p>
                          {isActive && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Creating todo item...
                            </p>
                          )}
                        </div>

                        {i < 5 && (
                          <div
                            className={`
                            absolute left-[29px] top-[52px] w-0.5 h-6 transition-colors duration-300
                            ${isCompleted ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'}
                          `}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {!demoState.isRunningWorkflow && demoState.workflowSteps.length > 0 && (
                  <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Workflow completed! {demoState.workflowSteps.length} tasks created
                        successfully.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <h2 className="text-2xl font-bold mt-12 mb-6">Code Example</h2>

        <p>Here's how simple it is to add mcp-b to your web app:</p>

        <div className="my-8 not-prose">
          <CodeBlock
            language="typescript"
            code={`// In your web application
import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

// Create your MCP server
const server = new McpServer({
  name: 'TodoApp',
  version: '1.0.0',
});

// Expose your APIs as tools
server.tool('createTodo', 
  { text: z.string() }, 
  async ({ text }) => {
    // This runs with full auth context
    const todo = await todoAPI.create({ 
      text, 
      userId: currentUser.id 
    });
    return { content: [{ 
      type: 'text', 
      text: \`Created: \${todo.text}\` 
    }]};
  }
);

// Make it discoverable
const transport = new TabServerTransport();
await server.connect(transport);`}
          />
        </div>

        <h2 className="text-2xl font-bold mt-12 mb-6">Expanding Further</h2>

        <p>
          I have not built it out yet but there is no reason we cannot extend this relay from the
          extension to a locally running host like Cline or Claude Desktop. In fact BrowserMCP
          already has this working, just for a different type of browser automation.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Why Not Add This to MCP?</h2>

        <p>
          Well someone already tried that (props to them) and it was turned down by the maintainers.
          That's understandable. They want to focus on keeping the language SDKs consistent and
          TypeScript (JavaScript) is the only language that can run in the browser.
        </p>

        <p>
          MCP started as a strict, one server to one client protocol. The Streamable HTTP transport
          also supports multiple clients (thank god) which is why I based the mcp-b protocol on it.
        </p>

        <p>
          At the moment, mcp-b servers also append the MCP server to window.mcp. There isn't a
          strong design justification for this. It just felt right. I'm open to changing it to be
          completely event driven, but I honestly like the idea of moving away from the traditional
          MCP implementation and going all in on window.mcp.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Dynamic MCPs</h2>

        <p>
          One of the exciting things about mcp-b that gives it an advantage over standard MCP
          servers is the fact that it can leverage simple dynamicism. At Amazon, we have a community
          driven MCP server for internal applications with many tools. The result? It's basically
          useless because it gives the model so many options that getting the model to interact well
          with the tools is difficult and flaky at best.
        </p>

        <p>
          In the browser? We already have tons of tools dynamically changing content on the web.
          I've got a couple of React hooks but there is so much more that can be done with them.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Get Involved</h2>

        <p>
          Anyway, I need more contributors so please come to the repo and take a look. I will help
          you onboard an MCP server onto your website for testing. Please reach out to me at{' '}
          <a
            href="mailto:alexmnahas@gmail.com"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            alexmnahas@gmail.com
          </a>
        </p>

        <p className="mt-6">
          At the moment the extension is not open source. I'll open source it as soon as it's posted
          to the Chrome store with some recognition (I've been burned by open sourcing extension
          code too soon before).
        </p>
      </div>
    </article>
  );
};

export default BlogPost;
