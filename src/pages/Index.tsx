import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Target, 
  FileText, 
  Globe,
  Zap,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

const features = [
  {
    icon: Target,
    title: 'Keyword Research',
    description: 'Discover high-value keywords with search volume and difficulty analysis.',
  },
  {
    icon: BarChart3,
    title: 'SERP Analysis',
    description: 'Analyze top-ranking pages to understand what makes content rank.',
  },
  {
    icon: FileText,
    title: 'AI Content Briefs',
    description: 'Generate comprehensive 3,500+ word briefs optimized for SEO.',
  },
  {
    icon: Globe,
    title: 'WordPress Publishing',
    description: 'One-click publishing directly to your WordPress site.',
  },
];

const steps = [
  { step: '01', title: 'Add Your Domain', description: 'Connect your WordPress site in seconds' },
  { step: '02', title: 'Research Keywords', description: 'Find keywords with ranking potential' },
  { step: '03', title: 'Generate Brief', description: 'AI creates comprehensive content outlines' },
  { step: '04', title: 'Publish Content', description: 'One-click publishing to WordPress' },
];

export default function Index() {
  const { isAuthenticated } = useApp();

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Outrank</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="gradient">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="gradient">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(160_84%_45%/0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(200_80%_50%/0.08),transparent_50%)]" />
        
        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm backdrop-blur-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">AI-Powered SEO Content Generation</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Create Content That
              <span className="text-gradient block">Actually Ranks</span>
            </h1>
            
            <p className="mb-10 text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate comprehensive SEO content briefs powered by AI. 
              Analyze SERPs, optimize for keywords, and publish directly to WordPress.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button variant="gradient" size="xl">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="xl">
                Watch Demo
              </Button>
            </div>

            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              {['No credit card required', '14-day free trial', 'Cancel anytime'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Rank
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From keyword research to publishing, Outrank streamlines your entire content workflow.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:border-primary/20"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From zero to published content in four simple steps.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="mb-4 text-5xl font-bold text-primary/20">{step.step}</div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="rounded-2xl bg-gradient-hero border border-primary/20 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(160_84%_45%/0.15),transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to Outrank Your Competition?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of content creators using AI to create SEO-optimized content that ranks.
              </p>
              <Link to="/auth">
                <Button variant="gradient" size="xl">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Outrank</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Outrank. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
