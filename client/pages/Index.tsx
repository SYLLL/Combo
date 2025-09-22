import { useState, useCallback } from "react";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  Github,
  Scale,
  Figma,
  MessageCircle,
  Shield,
  Eye,
  Users,
  ArrowRight,
  Zap,
  Target,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleJoinWaitlist = () => {
    if (email.trim()) {
      alert(`Thanks! We'll notify you at ${email} when we launch.`);
      setEmail('');
    }
  };

  const handleBookDemo = () => {
    navigate('/auth-demo');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">PolicyPrism</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <Button 
                onClick={handleBookDemo}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Book Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Stop Policy Risks Before<br />
              They <span className="gradient-text">Stop Your Product</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              AI agent-enabled Product Council automation that proactively flags compliance risks in 
              PRDs, designs, and code. Get actionable recommendations before you build, not after 
              you launch.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
              <div className="relative flex-1 w-full">
                <Input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-input border-border text-foreground placeholder:text-muted-foreground pr-4"
                />
              </div>
              <Button 
                onClick={handleJoinWaitlist}
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Join Waitlist
              </Button>
              <Button 
                variant="outline"
                onClick={handleBookDemo}
                className="h-12 px-6 border-border hover:bg-accent"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Book 15min Demo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Setup in minutes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Product Teams Are Flying Blind on Compliance
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border">
                  <div className="feature-icon bg-yellow-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Reactive Risk Management
                    </h3>
                    <p className="text-muted-foreground">
                      Legal reviews happen too late in the process, causing costly rebuilds and launch delays.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border">
                  <div className="feature-icon bg-orange-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Bottlenecked Legal Teams
                    </h3>
                    <p className="text-muted-foreground">
                      Lawyers spend time on routine questions instead of high-impact strategic decisions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border">
                  <div className="feature-icon bg-red-600">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Knowledge Gaps
                    </h3>
                    <p className="text-muted-foreground">
                      PMs and engineers don't know what compliance questions to ask until it's too late.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30 p-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">Product Council Review</CardTitle>
                    <Badge className="bg-red-100 text-red-800">Delayed</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">New Social Feature Launch</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">GDPR compliance unclear</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Age verification needed</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Data retention policy missing</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-red-400">
                      <span className="text-sm">🚫 Launch delayed by 3 weeks</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-400">
                      <span className="text-sm">💰 $50k in development costs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Proactive Risk Detection, Built for Product Teams
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI analyzes your PRDs, designs, and code to automatically flag compliance risks 
              and provide actionable recommendations before you build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-hover bg-card border-border">
              <CardContent className="p-8">
                <div className="feature-icon bg-purple-600 mb-6">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Smart Document Analysis
                </h3>
                <p className="text-muted-foreground mb-6">
                  Upload PRDs, mockups, or code. Our AI reads through everything and understands 
                  your product context.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Technical Design Documents</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Visual UI Mockups</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">API Schemas & Code</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover bg-card border-border">
              <CardContent className="p-8">
                <div className="feature-icon bg-teal-600 mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Proactive Risk Flagging
                </h3>
                <p className="text-muted-foreground mb-6">
                  Automatically identifies compliance triggers and asks the right questions you might not 
                  know to ask.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">GDPR & Privacy Compliance</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Age Verification Requirements</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Data Sharing Risks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover bg-card border-border">
              <CardContent className="p-8">
                <div className="feature-icon bg-amber-600 mb-6">
                  <Scale className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Smart Legal Triage
                </h3>
                <p className="text-muted-foreground mb-6">
                  Get instant recommendations for known risks, or escalate novel cases with full 
                  product context.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Instant Risk Mitigation</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Legal Brief Generation</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Priority-based Escalation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              See PolicyPrism in Action
            </h2>
            <p className="text-xl text-muted-foreground">
              Upload your documents and get instant compliance insights
            </p>
          </div>

          <Card className="bg-card border-border max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="bg-background rounded-lg p-6 font-mono text-sm">
                <div className="space-y-2">
                  <div className="text-success">
                    → Analyzing Product Requirements Document...
                  </div>
                  <div className="text-warning flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    GDPR Risk Detected: User data collection without explicit consent mechanism
                  </div>
                  <div className="text-warning flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Age Verification: Social features require age gating for users under 13
                  </div>
                  <div className="text-success">
                    ✓ Generating compliance recommendations...
                  </div>
                  <div className="text-primary">
                    📋 Legal brief ready for review
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Ready to Stop Flying Blind?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join forward-thinking product teams who catch compliance issues before they become problems.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <div className="relative flex-1 w-full">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button 
              onClick={handleJoinWaitlist}
              className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Get Early Access
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Start preventing compliance issues today. No setup required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">PolicyPrism</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}