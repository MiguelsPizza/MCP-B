import { createFileRoute, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import {
  ArrowRight,
  Award,
  BookOpen,
  Boxes,
  Building2,
  Check,
  CheckCircle,
  ChevronRight,
  Chrome,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  GitBranch,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Monitor,
  Network,
  PlayCircle,
  Rocket,
  Server,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { indexSearchSchema } from '../paramSchemas';

export const Route = createFileRoute('/')({
  component: IndexRoute,
});

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

function IndexRoute() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background/95 to-muted/20 px-4 py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-10 h-72 w-72 bg-gradient-to-br from-primary/30 to-blue-600/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-gradient-to-br from-blue-600/20 to-primary/20 rounded-full blur-3xl animate-float-delayed" />

        <div className="container relative mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <Badge
              variant="secondary"
              className="mb-4 animate-fadeInUp bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/20 backdrop-blur-sm"
            >
              <Sparkles className="mr-1 h-3 w-3 animate-pulse" />
              Introducing MCP-B
            </Badge>

            <h1
              className="animate-fadeInUp mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ animationDelay: '100ms' }}
            >
              Model Context Protocol
              <span className="block bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent animate-gradient-x">
                for the Browser
              </span>
            </h1>

            <p
              className="animate-fadeInUp mb-4 max-w-3xl text-lg text-muted-foreground sm:text-xl"
              style={{ animationDelay: '200ms' }}
            >
              MCP is great, but we're putting our servers in the wrong place. MCP-B runs servers
              directly inside web pages, solving the authentication problem once and for all.
            </p>

            <p
              className="animate-fadeInUp mb-12 max-w-2xl text-base text-muted-foreground"
              style={{ animationDelay: '250ms' }}
            >
              Web browsers have spent decades solving authentication. Every web app already has it
              built in. Why not use it? No OAuth flows, no API keys, no complex setups.
            </p>

            {/* Primary CTA buttons */}
            <div
              className="animate-fadeInUp mb-8 flex flex-col gap-4 sm:flex-row justify-center"
              style={{ animationDelay: '300ms' }}
            >
              <Button
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                asChild
              >
                <Link to="/assistant">
                  <span className="relative z-10 flex items-center">
                    <Zap className="mr-2 h-4 w-4 animate-pulse" />
                    Try The MCP-B Demo
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              </Button>

              <Button
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                asChild
              >
                <Link to="/blogs">
                  <span className="relative z-10 flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Read More about MCP-B
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              </Button>
            </div>

            {/* Secondary CTA buttons with glass morphism effect */}
            <div
              className="animate-fadeInUp grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto"
              style={{ animationDelay: '400ms' }}
            >
              <Button
                size="lg"
                variant="outline"
                className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary/40"
                asChild
              >
                <Link to="/docs">
                  <span className="relative z-10 flex items-center">
                    <Code2 className="mr-2 h-4 w-4 text-primary" />
                    Add to Your Website
                    <ExternalLink className="ml-2 h-3 w-3 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="group relative overflow-hidden border-2 border-blue-600/20 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-blue-600/40"
                asChild
              >
                <a
                  href="https://chromewebstore.google.com/detail/mcp-bextension/daohopfhkdelnpemnhlekblhnikhdhfa"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="relative z-10 flex items-center">
                    <Chrome className="mr-2 h-4 w-4 text-blue-600" />
                    Get Browser Extension
                    <ExternalLink className="ml-2 h-3 w-3 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-600/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="px-4 py-20 relative overflow-hidden border-t">
        <div className="container mx-auto max-w-4xl relative">
          <div className="mb-8 text-center">
            <h2 className="animate-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">
              See MCP-B in Action
            </h2>
            <p
              className="animate-fadeInUp text-lg text-muted-foreground"
              style={{ animationDelay: '100ms' }}
            >
              Watch how AI assistants work across multiple websites with zero configuration
            </p>
          </div>

          <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
              <div className="aspect-video relative bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center overflow-hidden">
                {/* Video Placeholder */}
                <div className="text-center relative z-10">
                  <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 mb-4 group-hover:scale-110 transition-transform">
                    <PlayCircle className="h-16 w-16 text-primary animate-pulse" />
                  </div>
                  <p className="text-lg font-medium text-foreground/80">Demo Video Coming Soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Real-world workflows across multiple sites
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Revolutionary Architecture Section */}
      <section className="border-t bg-gradient-to-b from-muted/30 to-background px-4 py-20 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative">
          <div className="mb-12 text-center">
            <Badge className="mb-4 bg-gradient-to-r from-destructive/10 to-orange-600/10 border-destructive/20 backdrop-blur-sm">
              <Sparkles className="mr-1 h-3 w-3 text-destructive" />
              Industry First
            </Badge>
            <h2 className="animate-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground via-destructive/60 to-foreground bg-clip-text text-transparent">
              Why MCP-B Changes Everything
            </h2>
            <p
              className="animate-fadeInUp text-lg text-muted-foreground max-w-3xl mx-auto"
              style={{ animationDelay: '100ms' }}
            >
              Today's MCP servers run locally with API keys or in the cloud with complex OAuth. We
              put them where authentication already lives — in the browser.
            </p>
          </div>

          <div className="grid gap-8 mb-12">
            {/* The Core Innovation */}
            <Card className="animate-fadeInUp overflow-hidden border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <div className="p-8">
                <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white border-0">
                  <Zap className="mr-1 h-3 w-3" />
                  The Breakthrough
                </Badge>
                <h3 className="mb-4 text-2xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Browser-Native MCP Servers
                </h3>
                <p className="mb-6 text-muted-foreground">
                  Instead of running MCP servers as separate processes or cloud services, we embed
                  them directly into web pages. The MCP server becomes part of your web application.
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-primary">The Challenge</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        Remote MCPs need complex OAuth 2.1
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        Local MCPs require API keys everywhere
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        White-collar work happens in browsers
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-primary">Our Solution</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        Run MCP servers inside web pages
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        Use existing browser authentication
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        Bridge to any MCP client via extension
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-primary">The Result</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">→</span>
                        Authentication just works
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">→</span>
                        No API keys or OAuth flows
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">→</span>
                        Works with any website
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Problems Solved */}
            <div className="grid gap-8 lg:grid-cols-2">
              <Card
                className="animate-fadeInUp border-destructive/20 bg-gradient-to-br from-destructive/5 via-background/95 to-background/80 backdrop-blur-sm hover:border-destructive/30 transition-all duration-300"
                style={{ animationDelay: '200ms' }}
              >
                <div className="p-6">
                  <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-destructive" />
                    Solves MCP's Authentication Problem
                  </h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>Remote MCP's OAuth 2.1 requires:</p>
                    <ul className="space-y-2 text-sm ml-4">
                      <li>• Discovery endpoints & dynamic registration</li>
                      <li>• PKCE for code interception prevention</li>
                      <li>• Token refresh logic & audience validation</li>
                      <li>• Complete auth layer reimplementation</li>
                    </ul>
                    <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20">
                      <p className="text-sm font-medium text-primary">
                        MCP-B just calls your existing APIs — the browser handles everything.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className="animate-fadeInUp border-orange-600/20 bg-gradient-to-br from-orange-600/5 via-background/95 to-background/80 backdrop-blur-sm hover:border-orange-600/30 transition-all duration-300"
                style={{ animationDelay: '300ms' }}
              >
                <div className="p-6">
                  <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-orange-600" />
                    Fixes Browser Automation's Brittleness
                  </h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>Traditional browser automation:</p>
                    <ul className="space-y-2 text-sm ml-4">
                      <li>• Relies on visual parsing & screenshots</li>
                      <li>• Breaks with UI changes</li>
                      <li>• Slow and error-prone</li>
                      <li>• Complex selector maintenance</li>
                    </ul>
                    <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20">
                      <p className="text-sm font-medium text-primary">
                        MCP-B provides direct API access — no screen scraping required.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Technical Architecture Visualization */}
          <div className="space-y-8">
            {/* High-Level Architecture Diagram */}
            <Card
              className="animate-fadeInUp overflow-hidden border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm"
              style={{ animationDelay: '400ms' }}
            >
              <div className="p-8">
                <h3 className="mb-6 text-xl font-semibold text-center">
                  How MCP-B Works: From Web Page to AI Assistant
                </h3>

                {/* Architecture Diagram */}
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                    {/* Web Pages with MCP Servers */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground text-center">
                        1. Tab MCP Servers
                      </h4>
                      <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-600/5">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-5 w-5 text-primary" />
                            <span className="font-medium">Your Web Apps</span>
                          </div>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="p-2 rounded bg-background/60 border border-primary/10">
                              <p className="font-medium text-primary mb-1">Tab MCP Server</p>
                              <p>• TypeScript, in-memory transport</p>
                              <p>• Wraps your authenticated APIs</p>
                              <p>• Uses existing cookies/JWT</p>
                            </div>
                            <div className="flex items-center gap-1 justify-center text-primary">
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-xs">fetch/XHR</span>
                              <ArrowRight className="h-3 w-3" />
                            </div>
                            <div className="p-2 rounded bg-background/60 border border-muted">
                              <p className="font-medium mb-1">Your Existing APIs</p>
                              <p>• No changes needed</p>
                              <p>• Same auth as UI</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* MCP-B Extension */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground text-center">
                        2. MCP-B Extension
                      </h4>
                      <Card className="p-4 border-primary bg-gradient-to-br from-primary/10 to-blue-600/10">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Chrome className="h-5 w-5 text-primary" />
                            <span className="font-medium">Chrome Extension</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2 rounded bg-background/80 border border-primary/20">
                              <p className="text-xs font-medium text-primary mb-1">
                                Content Scripts
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Connect to tab servers via postMessage
                              </p>
                            </div>
                            <div className="p-2 rounded bg-background/80 border border-primary/20">
                              <p className="text-xs font-medium text-primary mb-1">
                                MCP Hub (Service Worker)
                              </p>
                              <p className="text-xs text-muted-foreground">
                                • Aggregates all tab tools
                              </p>
                              <p className="text-xs text-muted-foreground">• Routes tool calls</p>
                              <p className="text-xs text-muted-foreground">• Manages connections</p>
                            </div>
                            <div className="p-2 rounded bg-background/80 border border-primary/20">
                              <p className="text-xs font-medium text-primary mb-1">
                                Built-in Chat UI
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Side panel AI assistant
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* MCP Clients */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground text-center">
                        3. MCP Clients
                      </h4>
                      <Card className="p-4 border-blue-600/20 bg-gradient-to-br from-blue-600/5 to-primary/5">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Network className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">AI Assistants</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2 rounded bg-background/60 border border-blue-600/10">
                              <p className="text-xs font-medium text-blue-600 mb-1">
                                Native Bridge
                              </p>
                              <p className="text-xs text-muted-foreground">
                                • Native messaging tunnel
                              </p>
                              <p className="text-xs text-muted-foreground">• Proxy server option</p>
                            </div>
                            <div className="text-center py-1">
                              <ArrowRight className="h-3 w-3 text-blue-600 mx-auto rotate-90" />
                            </div>
                            <div className="space-y-1">
                              <div className="p-1.5 rounded bg-background/60 border border-muted text-xs">
                                <span className="font-medium">Claude Desktop</span>
                              </div>
                              <div className="p-1.5 rounded bg-background/60 border border-muted text-xs">
                                <span className="font-medium">Cursor IDE</span>
                              </div>
                              <div className="p-1.5 rounded bg-background/60 border border-muted text-xs">
                                <span className="font-medium">Cline / Others</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Data Flow */}
                  <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-muted">
                    <p className="text-xs text-center text-muted-foreground">
                      <span className="font-medium">Complete flow:</span> AI requests tool →
                      Extension routes to tab → Tab MCP executes using your auth → Results flow back
                      to AI
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 backdrop-blur-sm border border-primary/20">
                  <p className="text-sm text-center font-medium bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    MCP servers run in web pages, extension bridges to AI clients, transport layers
                    handle the plumbing
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Simple for Everyone */}
      <section className="border-t bg-gradient-to-b from-muted/30 to-background px-4 py-20 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative">
          <div className="mb-12 text-center">
            <h2 className="animate-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Incredibly Simple Setup
            </h2>
            <p
              className="animate-fadeInUp text-lg text-muted-foreground max-w-2xl mx-auto"
              style={{ animationDelay: '100ms' }}
            >
              No OAuth flows, no API keys, no complex configuration. Just write a few lines of code
              and your website becomes AI-ready.
            </p>
          </div>

          {/* For Developers Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/20 backdrop-blur-sm">
                <Code2 className="mr-1 h-3 w-3 text-primary" />
                For Developers
              </Badge>
              <h3 className="text-2xl font-semibold">Add MCP to Your Website in Minutes</h3>
            </div>

            <div className="max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 text-sm font-medium text-primary">
                    1
                  </div>
                  <h4 className="text-lg font-medium">Install the package</h4>
                </div>
                <div className="ml-11">
                  <CodeBlock
                    language="bash"
                    code="npm install @webmcp/transports @modelcontextprotocol/sdk"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 text-sm font-medium text-primary">
                    2
                  </div>
                  <h4 className="text-lg font-medium">Create your MCP server</h4>
                </div>
                <div className="ml-11">
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

              {/* Step 3 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 text-sm font-medium text-primary">
                    3
                  </div>
                  <h4 className="text-lg font-medium">That's it! 🎉</h4>
                </div>
                <div className="ml-11">
                  <p className="text-muted-foreground">
                    Your MCP server automatically uses your existing authentication. When users with
                    the MCP-B extension visit your site, their AI assistants can now interact with
                    your APIs using their active session.
                  </p>
                </div>
              </div>

              {/* Key Points */}
              <div className="grid gap-4 sm:grid-cols-3 mt-8">
                <Card className="p-4 border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">No API Keys</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uses browser's existing authentication
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Type-Safe</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Full TypeScript support with Zod validation
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Secure by Default</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Respects your existing permissions
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* For Users Section */}
          <div className="border-t pt-12">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-gradient-to-r from-blue-600/10 to-primary/10 border-blue-600/20 backdrop-blur-sm">
                <Users className="mr-1 h-3 w-3 text-blue-600" />
                For Users
              </Badge>
              <h3 className="text-2xl font-semibold">Even Simpler for End Users</h3>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-6 border-blue-600/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-blue-600/30 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-primary/20 text-lg font-medium text-blue-600">
                      1
                    </div>
                    <h4 className="text-lg font-medium">Install Extension</h4>
                  </div>
                  <p className="text-muted-foreground">
                    <a
                      href="https://chromewebstore.google.com/detail/mcp-bextension/daohopfhkdelnpemnhlekblhnikhdhfa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      One-click install from Chrome Web Store
                    </a>
                    . No configuration needed.
                  </p>
                </Card>

                <Card className="p-6 border-blue-600/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-blue-600/30 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-primary/20 text-lg font-medium text-blue-600">
                      2
                    </div>
                    <h4 className="text-lg font-medium">Start Using AI</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Visit any MCP-enabled website. Your AI assistant automatically gains access.
                  </p>
                </Card>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-600/10 to-primary/10 backdrop-blur-sm border border-blue-600/20 text-center">
                <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-primary bg-clip-text text-transparent">
                  No API keys to manage. No OAuth to configure. It just works.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why MCP-B is Better */}
      <section className="px-4 py-20 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative">
          <div className="mb-12 text-center">
            <h2 className="animate-in-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground via-blue-600/80 to-foreground bg-clip-text text-transparent">
              Better for AI, Better for Users
            </h2>
            <p
              className="animate-in-fadeInUp text-lg text-muted-foreground"
              style={{ animationDelay: '100ms' }}
            >
              See how MCP-B compares to existing approaches
            </p>
          </div>

          {/* Comparison Diagram */}
          <div className="mb-12">
            <Card
              className="animate-in-fadeInUp overflow-hidden border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm"
              style={{ animationDelay: '200ms' }}
            >
              <div className="p-8">
                <h3 className="mb-6 text-xl font-semibold text-center">
                  How MCP-B Compares to Existing Approaches
                </h3>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Traditional Browser Automation */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <Badge
                        variant="outline"
                        className="mb-3 border-destructive/20 text-destructive bg-destructive/5"
                      >
                        Traditional Approach
                      </Badge>
                      <h4 className="font-semibold mb-2">Browser Automation</h4>
                    </div>

                    <div className="space-y-3">
                      <Card className="p-3 border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 text-destructive" />
                          <span className="text-sm font-medium">Screen Scraping</span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>• AI analyzes screenshots</p>
                          <p>• Clicks visual elements</p>
                          <p>• Breaks with UI changes</p>
                        </div>
                      </Card>

                      <div className="text-center py-2">
                        <ArrowRight className="h-5 w-5 text-muted-foreground mx-auto rotate-90" />
                      </div>

                      <Card className="p-3 border-destructive/20 bg-destructive/5">
                        <p className="text-xs text-center font-medium text-destructive">
                          Result: Brittle & Slow
                        </p>
                      </Card>
                    </div>
                  </div>

                  {/* Traditional MCP */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <Badge
                        variant="outline"
                        className="mb-3 border-orange-600/20 text-orange-600 bg-orange-600/5"
                      >
                        Current State
                      </Badge>
                      <h4 className="font-semibold mb-2">Traditional MCP</h4>
                    </div>

                    <div className="space-y-3">
                      <Card className="p-3 border-orange-600/20 bg-gradient-to-br from-orange-600/10 to-orange-600/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium">API Keys Required</span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>• Separate auth per service</p>
                          <p>• Complex credential mgmt</p>
                          <p>• Technical setup needed</p>
                        </div>
                      </Card>

                      <div className="text-center py-2">
                        <ArrowRight className="h-5 w-5 text-muted-foreground mx-auto rotate-90" />
                      </div>

                      <Card className="p-3 border-orange-600/20 bg-orange-600/5">
                        <p className="text-xs text-center font-medium text-orange-600">
                          Result: High Barrier
                        </p>
                      </Card>
                    </div>
                  </div>

                  {/* MCP-B Solution */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <Badge className="mb-3 bg-gradient-to-r from-primary to-blue-600 text-white border-0">
                        The Future
                      </Badge>
                      <h4 className="font-semibold mb-2">MCP-B Bridge</h4>
                    </div>

                    <div className="space-y-3">
                      <Card className="p-3 border-primary/20 bg-gradient-to-br from-primary/10 to-blue-600/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Direct API Access</span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>• Uses browser sessions</p>
                          <p>• Structured data access</p>
                          <p>• Zero configuration</p>
                        </div>
                      </Card>

                      <div className="text-center py-2">
                        <ArrowRight className="h-5 w-5 text-primary mx-auto rotate-90" />
                      </div>

                      <Card className="p-3 border-primary/20 bg-gradient-to-br from-primary/10 to-blue-600/10">
                        <p className="text-xs text-center font-medium bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                          Result: Works Instantly
                        </p>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Traditional Browser Automation */}
            <Card
              className="animate-in-fadeInUp relative overflow-hidden border-destructive/20 bg-gradient-to-b from-destructive/5 via-background/95 to-background/80 backdrop-blur-sm hover:border-destructive/30 transition-all duration-300 group"
              style={{ animationDelay: '200ms' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-destructive/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform" />
              <div className="p-6 relative">
                <Badge
                  variant="outline"
                  className="mb-4 border-destructive/20 text-destructive bg-destructive/5 backdrop-blur-sm"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Traditional Browser Automation
                </Badge>
                <h3 className="mb-4 text-xl font-semibold">Visual Parsing = Poor Performance</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2 group/item">
                    <span className="text-destructive mt-0.5 group-hover/item:scale-110 transition-transform">
                      ✗
                    </span>
                    <span>AI must parse screenshots and visual elements</span>
                  </li>
                  <li className="flex items-start gap-2 group/item">
                    <span className="text-destructive mt-0.5 group-hover/item:scale-110 transition-transform">
                      ✗
                    </span>
                    <span>Breaks when UI changes</span>
                  </li>
                  <li className="flex items-start gap-2 group/item">
                    <span className="text-destructive mt-0.5 group-hover/item:scale-110 transition-transform">
                      ✗
                    </span>
                    <span>Slow and error-prone</span>
                  </li>
                  <li className="flex items-start gap-2 group/item">
                    <span className="text-destructive mt-0.5 group-hover/item:scale-110 transition-transform">
                      ✗
                    </span>
                    <span>Requires complex selectors and wait logic</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* MCP-B Approach */}
            <Card
              className="animate-in-fadeInUp relative overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 via-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group"
              style={{ animationDelay: '300ms' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform" />
              <div className="p-6 relative">
                <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white border-0">
                  <FileCode className="mr-1 h-3 w-3" />
                  MCP-B Structured Access
                </Badge>
                <h3 className="mb-4 text-xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Direct API Access = Reliability
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2 group/item">
                    <span className="text-primary mt-0.5 group-hover/item:scale-110 transition-transform">
                      ✓
                    </span>
                    <span>Direct access to structured data and APIs</span>
                  </li>
                  <li className="flex items-start gap-2 group/item">
                    <span className="text-primary mt-0.5 group-hover/item:scale-110 transition-transform">
                      ✓
                    </span>
                    <span>UI changes don't affect functionality</span>
                  </li>
                  <li className="flex items-start gap-2 group/item">
                    <span className="text-primary mt-0.5 group-hover/item:scale-110 transition-transform">
                      ✓
                    </span>
                    <span>Fast and accurate execution</span>
                  </li>
                  <li className="flex items-start gap-2 group/item">
                    <span className="text-primary mt-0.5 group-hover/item:scale-110 transition-transform">
                      ✓
                    </span>
                    <span>Clean, semantic tool definitions</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t bg-gradient-to-b from-muted/30 to-background px-4 py-20 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative">
          <div className="mb-12 text-center">
            <h2 className="animate-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Built for Real-World Use
            </h2>
            <p
              className="animate-fadeInUp text-lg text-muted-foreground max-w-2xl mx-auto"
              style={{ animationDelay: '100ms' }}
            >
              MCP-B solves the fundamental problems that have prevented AI from working with web
              applications
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="animate-fadeInUp group relative overflow-hidden border-muted bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm p-6 transition-all hover:border-primary/30 hover:shadow-xl hover:scale-105"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-blue-600/10 blur-2xl transition-all group-hover:scale-150 group-hover:from-primary/20 group-hover:to-blue-600/20" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/20 text-primary transition-all group-hover:from-primary/30 group-hover:to-blue-600/30 group-hover:scale-110">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Extension Section */}
      <section
        id="extension"
        className="border-t bg-gradient-to-b from-muted/30 to-background px-4 py-20 relative overflow-hidden"
      >
        <div className="container mx-auto max-w-6xl relative">
          <div className="mb-12 text-center">
            <h2 className="animate-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">
              MCP-B Browser Extension
            </h2>
            <p
              className="animate-fadeInUp text-lg text-muted-foreground"
              style={{ animationDelay: '100ms' }}
            >
              AI-powered browser assistant with Model Context Protocol integration
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
              <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                <div className="p-8">
                  <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white border-0">
                    <Chrome className="mr-1 h-3 w-3" />
                    Now Available
                  </Badge>
                  <h3 className="mb-4 text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    One Extension, Unlimited Possibilities
                  </h3>
                  <p className="mb-6 text-muted-foreground">
                    Transform your browser into an AI-powered workspace. The MCP-B extension brings
                    the full power of Model Context Protocol directly to your browser.
                  </p>
                  <div className="space-y-4">
                    <Button size="lg" className="w-full group gap-2" asChild>
                      <a
                        href="https://chromewebstore.google.com/detail/mcp-bextension/daohopfhkdelnpemnhlekblhnikhdhfa"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Chrome className="h-5 w-5" />
                        Install from Chrome Web Store
                        <ExternalLink className="h-4 w-4 ml-1 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" className="w-full group gap-2" asChild>
                      <a
                        href="https://github.com/MiguelsPizza/WebMCP"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Source on GitHub
                        <ExternalLink className="h-4 w-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="animate-fadeInUp space-y-6" style={{ animationDelay: '300ms' }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-primary/20 p-6 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                  <CardHeader className="p-0 mb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Network className="w-5 h-5 text-primary" />
                      MCP Hub for Extensions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground">
                      Acts as an MCP of MCPs — other AI extensions can connect to MCP-B to access
                      all browser tabs' tools.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 p-6 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                  <CardHeader className="p-0 mb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="w-5 h-5 text-primary" />
                      Browser Automation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground">
                      Let AI manage tabs, bookmarks, and interact with web pages through MCP.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 p-6 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                  <CardHeader className="p-0 mb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-primary" />
                      Privacy First
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground">
                      All processing happens locally. Your data never leaves your device without
                      permission.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 p-6 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                  <CardHeader className="p-0 mb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="w-5 h-5 text-primary" />
                      Cross-Browser
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground">
                      Works with Chrome, Edge, and Firefox. One extension for all browsers.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 backdrop-blur-sm p-6 border border-primary/20">
                <h4 className="font-semibold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Getting Started
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-semibold text-primary">1.</span>
                    <span>Install from Chrome Web Store</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-primary">2.</span>
                    <span>Click extension icon to open side panel</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-primary">3.</span>
                    <span>Configure your AI provider</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-primary">4.</span>
                    <span>Start automating your workflows</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By using the MCP-B Browser Extension, you agree to our{' '}
              <Link to="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-10 left-20 h-64 w-64 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 right-20 h-80 w-80 bg-gradient-to-br from-blue-600/15 to-primary/15 rounded-full blur-3xl animate-float-delayed" />

        <div className="container mx-auto max-w-4xl relative">
          <Card className="animate-in-fadeInUp overflow-hidden border-primary/20 bg-gradient-to-br from-background/95 via-background/90 to-background/80 backdrop-blur-sm p-8 text-center sm:p-12 hover:border-primary/30 transition-all duration-300">
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent animate-gradient-x">
                Ready to Get Started?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                The future of AI assistance isn't in complex OAuth flows or managed infrastructure.
                It's in the browser you already have open.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <a
                    href="https://github.com/MiguelsPizza/WebMCP"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="relative z-10 flex items-center">
                      <GitBranch className="mr-2 h-4 w-4" />
                      View on GitHub
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary/40"
                  asChild
                >
                  <a href="mailto:alexmnahas@gmail.com?subject=MCP-B%20Integration">
                    <span className="relative z-10 flex items-center">
                      Get Integration Help
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </a>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 group">
                  <div className="p-1 rounded-full bg-gradient-to-br from-primary/10 to-blue-600/10 group-hover:from-primary/20 group-hover:to-blue-600/20 transition-all">
                    <Award className="h-4 w-4" />
                  </div>
                  <span>MIT Licensed</span>
                </div>
                <div className="flex items-center gap-2 group">
                  <div className="p-1 rounded-full bg-gradient-to-br from-primary/10 to-blue-600/10 group-hover:from-primary/20 group-hover:to-blue-600/20 transition-all">
                    <Users className="h-4 w-4" />
                  </div>
                  <span>Community Driven</span>
                </div>
                <div className="flex items-center gap-2 group">
                  <div className="p-1 rounded-full bg-gradient-to-br from-primary/10 to-blue-600/10 group-hover:from-primary/20 group-hover:to-blue-600/20 transition-all">
                    <Globe className="h-4 w-4" />
                  </div>
                  <span>Cross-Browser</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: Lock,
    title: 'Authentication Solved',
    description: 'Uses existing browser sessions. No OAuth 2.1 complexity, no API keys to manage.',
  },
  {
    icon: Workflow,
    title: 'Cross-Application Workflows',
    description:
      "AI seamlessly works across multiple sites using each site's existing permissions.",
  },
  {
    icon: Shield,
    title: 'Enterprise Control',
    description:
      'MCP server is part of your app, running your code, respecting your access controls.',
  },
  {
    icon: FileCode,
    title: 'API-First Design',
    description: 'Direct access to structured data. No screen scraping, no brittle selectors.',
  },
  {
    icon: Zap,
    title: 'Instant Deployment',
    description: 'Add to existing web apps with ~50 lines of code. No infrastructure changes.',
  },
  {
    icon: Network,
    title: 'Extensible Platform',
    description: 'Acts as an MCP hub that other AI extensions can connect to and extend.',
  },
];
