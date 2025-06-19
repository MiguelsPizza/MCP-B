import { createFileRoute, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CheckCircle,
  Code2,
  ExternalLink,
  Eye,
  FileCode,
  GitBranch,
  Globe,
  Layers,
  Lock,
  Monitor,
  Network,
  PlayCircle,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { indexSearchSchema } from '../paramSchemas';

export const Route = createFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  return (
    <div className="min-h-screen">
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
              className="mb-4 animate-in-fadeInUp bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/20 backdrop-blur-sm"
            >
              <Sparkles className="mr-1 h-3 w-3 animate-pulse" />
              Introducing MCP-B
            </Badge>

            <h1
              className="animate-in-fadeInUp mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ animationDelay: '100ms' }}
            >
              Model Context Protocol
              <span className="block bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent animate-gradient-x">
                for the Browser
              </span>
            </h1>

            <p
              className="animate-in-fadeInUp mb-12 max-w-3xl text-lg text-muted-foreground sm:text-xl"
              style={{ animationDelay: '200ms' }}
            >
              MCP-B solves authentication challenges and enables AI agents to work across multiple
              websites. No API keys, no complex setups — just install the extension and start
              automating workflows.
            </p>

            {/* Primary CTA buttons */}
            <div
              className="animate-in-fadeInUp mb-8 flex flex-col gap-4 sm:flex-row"
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
              className="animate-in-fadeInUp grid gap-4 sm:grid-cols-2 max-w-2xl"
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
                <Link to="/extension">
                  <span className="relative z-10 flex items-center">
                    <Users className="mr-2 h-4 w-4 text-blue-600" />
                    Transform Your AI Extension
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-600/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="border-t bg-gradient-to-b from-muted/30 to-background px-4 py-20 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="animate-in-fadeInUp">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                The Authentication Problem
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-lg">
                  Traditional MCP requires complex authentication setups, API key management, and
                  technical expertise that puts it out of reach for most users.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 group">
                    <div className="mt-1 p-1 rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                      <Lock className="h-5 w-5 text-destructive" />
                    </div>
                    <span>Managing API keys and credentials is complex and error-prone</span>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="mt-1 p-1 rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                      <Terminal className="h-5 w-5 text-destructive" />
                    </div>
                    <span>Command-line setups intimidate non-technical users</span>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="mt-1 p-1 rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                      <GitBranch className="h-5 w-5 text-destructive" />
                    </div>
                    <span>Each website requires separate integration work</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-in-fadeInUp" style={{ animationDelay: '200ms' }}>
              <div className="relative group">
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/30 to-blue-600/30 blur-2xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
                <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm p-8 hover:border-primary/40 transition-all duration-300">
                  <Badge className="mb-4 bg-gradient-to-r from-primary to-blue-600 text-white border-0">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    MCP-B Solution
                  </Badge>
                  <h3 className="mb-4 text-2xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Browser-Native Authentication
                  </h3>
                  <p className="mb-6 text-muted-foreground">
                    MCP-B leverages your browser's existing authentication to eliminate complexity.
                    If you're logged into a website, the AI assistant can work with it — it's that
                    simple.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 group/item">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 group-hover/item:from-primary/30 group-hover/item:to-blue-600/30 transition-all">
                        <Monitor className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">Works with your existing browser sessions</span>
                    </div>
                    <div className="flex items-center gap-3 group/item">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 group-hover/item:from-primary/30 group-hover/item:to-blue-600/30 transition-all">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">No API keys or credentials to manage</span>
                    </div>
                    <div className="flex items-center gap-3 group/item">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 group-hover/item:from-primary/30 group-hover/item:to-blue-600/30 transition-all">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">
                        Install extension and start using immediately
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Site Workflow Demo */}
      <section className="px-4 py-20 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative">
          <div className="mb-12 text-center">
            <h2 className="animate-in-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">
              Multi-Site AI Workflows in Action
            </h2>
            <p
              className="animate-in-fadeInUp text-lg text-muted-foreground"
              style={{ animationDelay: '100ms' }}
            >
              Watch how one AI assistant handles complex workflows across multiple websites
            </p>
          </div>

          <div className="animate-in-fadeInUp" style={{ animationDelay: '200ms' }}>
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
            <h2 className="animate-in-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Incredibly Simple Setup
            </h2>
            <p
              className="animate-in-fadeInUp text-lg text-muted-foreground"
              style={{ animationDelay: '100ms' }}
            >
              Discovery and session handling is automatic — no configuration needed
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* For Website Owners */}
            <div className="animate-in-fadeInUp" style={{ animationDelay: '100ms' }}>
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
            <div className="animate-in-fadeInUp" style={{ animationDelay: '200ms' }}>
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
              MCP-B provides structured data access, not screen scraping
            </p>
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
            <h2 className="animate-in-fadeInUp mb-4 text-3xl font-bold sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Enterprise-Ready Features
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="animate-in-fadeInUp group relative overflow-hidden border-muted bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm p-6 transition-all hover:border-primary/30 hover:shadow-xl hover:scale-105"
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
      'AI agents seamlessly work across multiple websites using existing browser sessions.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Leverages browser security model. No new attack vectors or API keys to manage.',
  },
  {
    icon: Zap,
    title: 'Zero Configuration',
    description: 'Automatic discovery and connection. Just add window.mcp to your site.',
  },
  {
    icon: FileCode,
    title: 'Dynamic Tools',
    description: 'Context-aware capabilities that adapt based on user state and permissions.',
  },
  {
    icon: Layers,
    title: 'MCP Compatible',
    description: 'Full Model Context Protocol support with browser-specific transport layer.',
  },
  {
    icon: Users,
    title: 'User Friendly',
    description: 'Works with any website users can log into. No technical knowledge required.',
  },
];
