import { createFileRoute, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle,
  Code2,
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
        <div className="container relative mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4 animate-in-fadeInUp">
              <Sparkles className="mr-1 h-3 w-3" />
              Introducing MCP-B
            </Badge>

            <h1
              className="animate-in-fadeInUp mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ animationDelay: '100ms' }}
            >
              Model Context Protocol
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                for the Browser
              </span>
            </h1>

            <p
              className="animate-in-fadeInUp mb-8 max-w-3xl text-lg text-muted-foreground sm:text-xl"
              style={{ animationDelay: '200ms' }}
            >
              MCP-B solves authentication challenges and enables AI agents to work across multiple
              websites. No API keys, no complex setups — just install the extension and start
              automating workflows.
            </p>

            <div
              className="animate-in-fadeInUp flex flex-col gap-4 sm:flex-row"
              style={{ animationDelay: '300ms' }}
            >
              <Button size="lg" className="group" asChild>
                <Link to="/assistant">
                  Try AI Assistant
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/docs">
                  <Code2 className="mr-2 h-4 w-4" />
                  Add to Your Website
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="animate-in-fadeInUp">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">The Authentication Problem</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-lg">
                  Traditional MCP requires complex authentication setups, API key management, and
                  technical expertise that puts it out of reach for most users.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-1 h-5 w-5 text-destructive" />
                    <span>Managing API keys and credentials is complex and error-prone</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Terminal className="mt-1 h-5 w-5 text-destructive" />
                    <span>Command-line setups intimidate non-technical users</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <GitBranch className="mt-1 h-5 w-5 text-destructive" />
                    <span>Each website requires separate integration work</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-in-fadeInUp" style={{ animationDelay: '200ms' }}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 blur-xl" />
                <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background to-background/80 p-8">
                  <Badge className="mb-4" variant="default">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    MCP-B Solution
                  </Badge>
                  <h3 className="mb-4 text-2xl font-semibold">Browser-Native Authentication</h3>
                  <p className="mb-6 text-muted-foreground">
                    MCP-B leverages your browser's existing authentication to eliminate complexity.
                    If you're logged into a website, the AI assistant can work with it — it's that
                    simple.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Monitor className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">Works with your existing browser sessions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">No API keys or credentials to manage</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
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
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="animate-in-fadeInUp mb-4 text-3xl font-bold sm:text-4xl">
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
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-background/80">
              <div className="aspect-video relative bg-muted/30 flex items-center justify-center">
                {/* Video Placeholder */}
                <div className="text-center">
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-primary/60" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Demo Video Coming Soon
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Machine Shop Workflow: 6 Sites, 1 Assistant
                  </p>
                </div>
              </div>

              <div className="p-8">
                <Badge className="mb-4" variant="default">
                  <Building2 className="mr-1 h-3 w-3" />
                  Real-World Example
                </Badge>
                <h3 className="mb-4 text-2xl font-semibold">Machine Shop Order Processing</h3>
                <p className="mb-6 text-muted-foreground">
                  Watch as an AI assistant handles a complete order workflow across multiple
                  systems:
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {workflowSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="mb-1 font-medium">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-primary/5 p-4">
                  <p className="text-sm font-medium">
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
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="animate-in-fadeInUp mb-4 text-3xl font-bold sm:text-4xl">
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
              <h3 className="mb-6 text-2xl font-semibold">For Website Owners</h3>
              <div className="space-y-4">
                <Card className="border-primary/20 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Code2 className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium">1. Write Your MCP Server</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Define tools and expose them via{' '}
                    <code className="rounded bg-muted px-1 py-0.5">window.mcp</code>
                  </p>
                  <div className="mt-4 rounded bg-muted/50 p-3">
                    <code className="text-sm">window.mcp = createServer(tools)</code>
                  </div>
                </Card>

                <Card className="border-primary/20 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
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
              <h3 className="mb-6 text-2xl font-semibold">For Users</h3>
              <div className="space-y-4">
                <Card className="border-primary/20 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Monitor className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium">1. Install Extension</h4>
                  </div>
                  <p className="text-muted-foreground">One-click install from Chrome Web Store</p>
                </Card>

                <Card className="border-primary/20 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Network className="h-5 w-5 text-primary" />
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
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="animate-in-fadeInUp mb-4 text-3xl font-bold sm:text-4xl">
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
              className="animate-in-fadeInUp relative overflow-hidden border-destructive/20 bg-gradient-to-b from-destructive/5 to-background"
              style={{ animationDelay: '200ms' }}
            >
              <div className="p-6">
                <Badge variant="outline" className="mb-4 border-destructive/20 text-destructive">
                  <Eye className="mr-1 h-3 w-3" />
                  Traditional Browser Automation
                </Badge>
                <h3 className="mb-4 text-xl font-semibold">Visual Parsing = Poor Performance</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    <span>AI must parse screenshots and visual elements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    <span>Breaks when UI changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    <span>Slow and error-prone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    <span>Requires complex selectors and wait logic</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* MCP-B Approach */}
            <Card
              className="animate-in-fadeInUp relative overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 to-background"
              style={{ animationDelay: '300ms' }}
            >
              <div className="p-6">
                <Badge className="mb-4" variant="default">
                  <FileCode className="mr-1 h-3 w-3" />
                  MCP-B Structured Access
                </Badge>
                <h3 className="mb-4 text-xl font-semibold">Direct API Access = Reliability</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Direct access to structured data and APIs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>UI changes don't affect functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Fast and accurate execution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Clean, semantic tool definitions</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="animate-in-fadeInUp mb-4 text-3xl font-bold sm:text-4xl">
              Enterprise-Ready Features
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="animate-in-fadeInUp group relative overflow-hidden border-muted bg-gradient-to-b from-background to-background/80 p-6 transition-all hover:border-primary/20 hover:shadow-lg"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          <Card className="animate-in-fadeInUp overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 text-center sm:p-12">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Ready to Get Started?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join developers building the next generation of AI-powered browser tools
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="group" asChild>
                <a
                  href="https://github.com/yourusername/mcp-b"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  View on GitHub
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:alexmnahas@gmail.com?subject=MCP-B%20Integration">
                  Get Integration Help
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>MIT Licensed</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Community Driven</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Cross-Browser</span>
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
