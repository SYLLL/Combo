import { useState } from "react";
import {
  Shield,
  CheckCircle,
  Eye,
  Zap,
  Scale,
  ArrowRight,
  BookOpen,
  MessageCircle,
  AlertTriangle,
  Users,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen" style={{ background: '#0f0f23' }}>
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold text-white">PolicyPrism</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </a>
              <Button 
                onClick={handleBookDemo}
                className="purple-cta px-6 py-2 rounded-lg"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Book Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="hero-gradient absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8">
            Stop Policy Risks Before<br />
            They <span className="gradient-text">Stop Your Product</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
            AI agent-enabled Product Council automation that proactively flags compliance risks in 
            PRDs, designs, and code. Get actionable recommendations before you build, not after 
            you launch.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto mb-12">
            <div className="relative flex-1 w-full">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 dark-input text-white placeholder:text-gray-400 text-lg px-6"
                style={{ 
                  background: 'rgba(30, 35, 70, 0.8)',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              />
            </div>
            <Button 
              onClick={handleJoinWaitlist}
              className="h-14 px-8 purple-cta text-lg font-semibold"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Join Waitlist
            </Button>
            <Button 
              variant="outline"
              onClick={handleBookDemo}
              className="h-14 px-8 text-lg font-semibold border-white/20 text-white hover:bg-white/10"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Book 15min Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Setup in minutes
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24" style={{ background: '#0f0f23' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Product Teams Are Flying Blind on Compliance
              </h2>
              
              <div className="space-y-6">
                <div className="dark-feature-card p-6 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-600 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        Reactive Risk Management
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        Legal reviews happen too late in the process, causing costly rebuilds and launch delays.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="dark-feature-card p-6 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        Bottlenecked Legal Teams
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        Lawyers spend time on routine questions instead of high-impact strategic decisions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="dark-feature-card p-6 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        Knowledge Gaps
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        PMs and engineers don't know what compliance questions to ask until it's too late.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div 
                className="p-8 rounded-2xl border"
                style={{ 
                  background: 'rgba(60, 30, 30, 0.6)',
                  borderColor: 'rgba(239, 68, 68, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Product Council Review</h3>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                    Delayed
                  </span>
                </div>
                
                <h4 className="text-lg font-semibold text-white mb-6">New Social Feature Launch</h4>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>GDPR compliance unclear</span>
                  </div>
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Age verification needed</span>
                  </div>
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Data retention policy missing</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-red-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <span>🚫 Launch delayed by 3 weeks</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <span>💰 $50k in development costs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24" style={{ background: '#0f0f23' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Proactive Risk Detection, Built for Product Teams
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Our AI analyzes your PRDs, designs, and code to automatically flag compliance risks 
              and provide actionable recommendations before you build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="dark-feature-card p-8 rounded-2xl card-hover">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mb-6">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Smart Document Analysis
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Upload PRDs, mockups, or code. Our AI reads through everything and understands 
                your product context.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Technical Design Documents</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Visual UI Mockups</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>API Schemas & Code</span>
                </div>
              </div>
            </div>

            <div className="dark-feature-card p-8 rounded-2xl card-hover">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Proactive Risk Flagging
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Automatically identifies compliance triggers and asks the right questions you might not 
                know to ask.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>GDPR & Privacy Compliance</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Age Verification Requirements</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Data Sharing Risks</span>
                </div>
              </div>
            </div>

            <div className="dark-feature-card p-8 rounded-2xl card-hover">
              <div className="w-16 h-16 rounded-2xl bg-amber-600 flex items-center justify-center mb-6">
                <Scale className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Smart Legal Triage
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Get instant recommendations for known risks, or escalate novel cases with full 
                product context.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Instant Risk Mitigation</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Legal Brief Generation</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Priority-based Escalation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24" style={{ background: '#0f0f23' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              See PolicyPrism in Action
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Upload your documents and get instant compliance insights
            </p>
          </div>

          <div 
            className="max-w-4xl mx-auto p-8 rounded-2xl border"
            style={{ 
              background: 'rgba(30, 35, 70, 0.6)',
              borderColor: 'rgba(168, 85, 247, 0.2)'
            }}
          >
            <div className="bg-black/40 rounded-xl p-6 font-mono text-sm border border-white/10">
              <div className="space-y-3">
                <div className="text-green-400 flex items-center gap-2">
                  <span className="text-green-400">→</span>
                  <span>Analyzing Product Requirements Document...</span>
                </div>
                <div className="text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>GDPR Risk Detected: User data collection without explicit consent mechanism</span>
                </div>
                <div className="text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Age Verification: Social features require age gating for users under 13</span>
                </div>
                <div className="text-green-400">
                  <span>✓ Generating compliance recommendations...</span>
                </div>
                <div className="text-purple-400">
                  <span>📋 Legal brief ready for review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" style={{ background: '#0f0f23' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Stop Flying Blind?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join forward-thinking product teams who catch compliance issues before they become problems.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto mb-8">
            <div className="relative flex-1 w-full">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 dark-input text-white placeholder:text-gray-400 text-lg px-6"
                style={{ 
                  background: 'rgba(30, 35, 70, 0.8)',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              />
            </div>
            <Button 
              onClick={handleJoinWaitlist}
              className="h-14 px-8 purple-cta text-lg font-semibold"
            >
              Get Early Access
            </Button>
          </div>

          <p className="text-gray-400">
            Start preventing compliance issues today. No setup required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12" style={{ background: '#0a0a1f' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-purple-500" />
              <span className="text-lg font-bold text-white">PolicyPrism</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}