import { createFileRoute, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import {
  ArrowRight,
  Award,
  BookOpen,
  Boxes,
  Building2,
  CheckCircle,
  ChevronRight,
  Chrome,
  Code2,
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
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { indexSearchSchema } from '../paramSchemas';

export const Route = createFileRoute('/')({
  component: IndexRoute,
});

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
              The first-of-its-kind architecture that bridges browser extensions with MCP clients,
              solving fundamental limitations in both browser automation and AI tool integration.
            </p>

            <p
              className="animate-fadeInUp mb-12 max-w-2xl text-base text-muted-foreground"
              style={{ animationDelay: '250ms' }}
            >
              No API keys, no screen scraping, no complex setups — just install the extension and
              your AI can work with any website you're logged into.
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
                <a href="#extension">
                  <span className="relative z-10 flex items-center">
                    <Chrome className="mr-2 h-4 w-4 text-blue-600" />
                    Get Browser Extension
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-600/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </a>
              </Button>
            </div>
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
              Browser extensions can't host servers. MCP requires servers. We solved this impossible
              equation.
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
                  WebSocket Bridge Architecture
                </h3>
                <p className="mb-6 text-muted-foreground">
                  We created the first architecture that enables browser extensions to act as MCP
                  servers, opening up an entirely new class of AI capabilities.
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-primary">The Challenge</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        Extensions can't host servers
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        MCP requires server architecture
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        No standard solution existed
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-primary">Our Solution</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        WebSocket bridge pattern
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        Extension appears as MCP server
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        Works with all MCP clients
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-primary">The Result</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">→</span>
                        Claude Desktop connects directly
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">→</span>
                        Multiple clients supported
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">→</span>
                        Full MCP protocol compliance
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
                    <p>Traditional MCP requires:</p>
                    <ul className="space-y-2 text-sm ml-4">
                      <li>• API keys for every service</li>
                      <li>• Complex credential management</li>
                      <li>• Technical setup for each site</li>
                      <li>• Separate authentication flows</li>
                    </ul>
                    <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20">
                      <p className="text-sm font-medium text-primary">
                        MCP-B uses your existing browser sessions — zero additional auth needed.
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
                  Revolutionary Bridge Architecture
                </h3>

                {/* Architecture Diagram */}
                <div className="space-y-8">
                  {/* MCP Clients Section */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground text-center">
                        Development Tools
                      </h4>
                      <div className="space-y-2">
                        <Card className="p-3 border-muted bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">MCP Inspector</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">STDIO only</p>
                        </Card>
                        <Card className="p-3 border-blue-600/20 bg-blue-600/5">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Claude Desktop</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">WebSocket native</p>
                        </Card>
                        <Card className="p-3 border-blue-600/20 bg-blue-600/5">
                          <div className="flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Cursor IDE</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">WebSocket native</p>
                        </Card>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground text-center">
                        Bridge Layer
                      </h4>
                      <Card className="p-6 border-primary bg-gradient-to-br from-primary/10 to-blue-600/10 h-full flex flex-col justify-center">
                        <div className="text-center space-y-4">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/20">
                            <Network className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-primary">WebSocket Bridge</h5>
                            <p className="text-xs text-muted-foreground mt-1">localhost:8021</p>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>• Multiple clients</p>
                            <p>• Connection IDs</p>
                            <p>• Message routing</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground text-center">
                        Browser Layer
                      </h4>
                      <Card className="p-4 border-primary/20 bg-gradient-to-br from-background/95 to-background/80">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Chrome className="h-5 w-5 text-primary" />
                            <span className="font-medium">Extension Hub</span>
                          </div>
                          <div className="pl-7 space-y-1 text-xs text-muted-foreground">
                            <p>• Acts as MCP Server</p>
                            <p>• Manages tab tools</p>
                            <p>• Tool namespacing</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4 border-blue-600/20 bg-blue-600/5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Browser Tabs</span>
                          </div>
                          <div className="pl-7 space-y-1 text-xs text-muted-foreground">
                            <p>• Register tools</p>
                            <p>• Execute calls</p>
                            <p>• Return results</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Connection Flow Arrows */}
                  <div className="relative h-16 hidden md:block">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full max-w-2xl flex items-center justify-between">
                        <div className="flex-1 border-t-2 border-dashed border-primary/30 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </div>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                            STDIO / WebSocket
                          </span>
                        </div>
                        <div className="flex-1 border-t-2 border-dashed border-primary/30 relative ml-8">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </div>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                            WebSocket + ID
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 backdrop-blur-sm border border-primary/20">
                  <p className="text-sm text-center font-medium bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    First architecture to enable browser extensions as full MCP servers
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Multi-Site Workflow Demo */}
      <section className="px-4 py-20 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative">
          <div className="mb-12 text-center">
            <h2 className="animate-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">
              Multi-Site AI Workflows in Action
            </h2>
            <p
              className="animate-fadeInUp text-lg text-muted-foreground"
              style={{ animationDelay: '100ms' }}
            >
              Watch how one AI assistant handles complex workflows across multiple websites
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
                    Machine Shop Workflow: 6 Sites, 1 Assistant
                  </p>
                </div>
              </div>

              <div className="p-8">
                <Badge className="mb-4 bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/20 backdrop-blur-sm">
                  <Building2 className="mr-1 h-3 w-3 text-primary" />
                  Real-World Example
                </Badge>
                <h3 className="mb-4 text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Machine Shop Order Processing
                </h3>
                <p className="mb-6 text-muted-foreground">
                  Watch as an AI assistant handles a complete order workflow across multiple
                  systems:
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {workflowSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-3 group/step">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 text-sm font-medium text-primary group-hover/step:from-primary/30 group-hover/step:to-blue-600/30 transition-all">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="mb-1 font-medium group-hover/step:text-primary transition-colors">
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 backdrop-blur-sm p-4 border border-primary/20">
                  <p className="text-sm font-medium bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    One AI assistant. Six different websites. Zero API keys.
                    <span className="block mt-1 text-muted-foreground">
                      All using existing browser authentication.
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Simple for Everyone */}
      <section className="border-t bg-gradient-to-b from-muted/30 to-background px-4 py-20 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative">
          <div className="mb-12 text-center">
            <h2 className="animate-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Incredibly Simple Setup
            </h2>
            <p
              className="animate-fadeInUp text-lg text-muted-foreground"
              style={{ animationDelay: '100ms' }}
            >
              Discovery and session handling is automatic — no configuration needed
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* For Website Owners */}
            <div className="animate-fadeInUp" style={{ animationDelay: '100ms' }}>
              <h3 className="mb-6 text-2xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                For Website Owners
              </h3>
              <div className="space-y-4">
                <Card className="border-primary/20 p-6 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/20 group-hover:from-primary/30 group-hover:to-blue-600/30 transition-all">
                      <Code2 className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium">1. Write Your MCP Server</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Define tools and expose them via{' '}
                    <code className="rounded bg-gradient-to-r from-primary/10 to-blue-600/10 px-1.5 py-0.5 font-mono text-sm">
                      window.mcp
                    </code>
                  </p>
                  <div className="mt-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm p-3 border border-primary/10">
                    <code className="text-sm font-mono text-primary">
                      window.mcp = createServer(tools)
                    </code>
                  </div>
                </Card>

                <Card className="border-primary/20 p-6 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/20 group-hover:from-primary/30 group-hover:to-blue-600/30 transition-all animate-pulse">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium">2. That's It!</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Discovery, authentication, and session handling are automatic. Your existing
                    auth works out of the box.
                  </p>
                </Card>
              </div>
            </div>

            {/* For Users */}
            <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
              <h3 className="mb-6 text-2xl font-semibold bg-gradient-to-r from-blue-600 to-primary bg-clip-text text-transparent">
                For Users
              </h3>
              <div className="space-y-4">
                <Card className="border-blue-600/20 p-6 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-blue-600/30 transition-all duration-300 group">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-primary/20 group-hover:from-blue-600/30 group-hover:to-primary/30 transition-all">
                      <Monitor className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-medium">1. Install Extension</h4>
                  </div>
                  <p className="text-muted-foreground">One-click install from Chrome Web Store</p>
                </Card>

                <Card className="border-blue-600/20 p-6 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm hover:border-blue-600/30 transition-all duration-300 group">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-primary/20 group-hover:from-blue-600/30 group-hover:to-primary/30 transition-all animate-pulse">
                      <Network className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-medium">2. Browse & Automate</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Extension automatically connects to MCP-enabled sites. Your AI assistant can now
                    work across all of them.
                  </p>
                </Card>
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
                  The Evolution of Browser AI Integration
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
              Enterprise-Ready Features
            </h2>
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
                    Available Soon
                  </Badge>
                  <h3 className="mb-4 text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    One Extension, Unlimited Possibilities
                  </h3>
                  <p className="mb-6 text-muted-foreground">
                    Transform your browser into an AI-powered workspace. The MCP-B extension brings
                    the full power of Model Context Protocol directly to your browser.
                  </p>
                  <div className="space-y-4">
                    <Button size="lg" className="w-full group gap-2" disabled>
                      <Chrome className="h-5 w-5" />
                      Coming to Chrome Web Store
                      <Badge variant="secondary" className="ml-2">
                        Soon
                      </Badge>
                    </Button>
                    <Button size="lg" variant="outline" className="w-full group gap-2" asChild>
                      <a
                        href="https://github.com/yourusername/mcp-b"
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
                      <MessageSquare className="w-5 h-5 text-primary" />
                      AI Chat Interface
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground">
                      Interact with AI assistants directly in your browser's side panel. Support for
                      multiple AI providers.
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
                Join developers building the next generation of AI-powered browser tools
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <a
                    href="https://github.com/yourusername/mcp-b"
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

const workflowSteps = [
  {
    title: 'Send PO to Accounting',
    description: 'Forward purchase order via accounting portal',
  },
  {
    title: 'Check Inventory',
    description: 'Verify parts availability in internal IMS',
  },
  {
    title: 'Order Missing Parts',
    description: 'Purchase from McMasterCarr.com',
  },
  {
    title: 'Register Request',
    description: 'Log order in machine shop system',
  },
  {
    title: 'Calculate Timeline',
    description: 'Estimate delivery based on all factors',
  },
  {
    title: 'Update Customer',
    description: 'Send timeline via email',
  },
];

const features = [
  {
    icon: Workflow,
    title: 'Multi-Site Workflows',
    description:
      'One AI assistant can work across Gmail, Slack, GitHub, and any other site you use.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Leverages browser security model. No API keys floating around, no new attack vectors.',
  },
  {
    icon: Network,
    title: 'Bridge Architecture',
    description: 'Revolutionary WebSocket bridge enables extensions to act as MCP servers.',
  },
  {
    icon: FileCode,
    title: 'Structured Access',
    description: 'Direct API access instead of screen scraping. Reliable, fast, and maintainable.',
  },
  {
    icon: Layers,
    title: 'Full MCP Protocol',
    description: 'Complete Model Context Protocol implementation with all standard features.',
  },
  {
    icon: Users,
    title: 'Zero Setup',
    description: 'Works instantly with any website you can log into. No configuration needed.',
  },
];
