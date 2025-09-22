import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginForm } from '@/components/LoginForm';
import { UserProfile } from '@/components/UserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Database, Key, ArrowLeft, FileText, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthDemo() {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">PolicyPrism</span>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Compliance Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Proactive compliance management for product teams
          </p>
        </div>

        {currentUser ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Welcome back, {userProfile?.displayName || currentUser.email}! 🎉
                    </h2>
                    <p className="text-muted-foreground">
                      You're now connected to PolicyPrism's compliance automation platform.
                    </p>
                  </div>
                  <Shield className="h-16 w-16 text-primary" />
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Compliance Status */}
              <Card className="bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="feature-icon bg-green-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <span>Compliance Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Score</span>
                    <Badge className="bg-green-100 text-green-800">
                      92%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Risks</span>
                    <span className="text-sm font-medium text-foreground">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Resolved</span>
                    <span className="text-sm font-medium text-success">15</span>
                  </div>
                </CardContent>
              </Card>

              {/* Document Analysis */}
              <Card className="bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="feature-icon bg-purple-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span>Document Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">PRDs Analyzed</span>
                    <span className="text-sm font-medium text-foreground">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Risks Flagged</span>
                    <span className="text-sm font-medium text-warning">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Auto-Resolved</span>
                    <span className="text-sm font-medium text-success">6</span>
                  </div>
                </CardContent>
              </Card>

              {/* Team Activity */}
              <Card className="bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="feature-icon bg-teal-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <span>Team Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Members</span>
                    <span className="text-sm font-medium text-foreground">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reviews Today</span>
                    <span className="text-sm font-medium text-primary">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Response</span>
                    <span className="text-sm font-medium text-success">2.3h</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features Overview */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Platform Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Smart Document Analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Proactive Risk Detection</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Automated Compliance Checks</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Team Collaboration</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Database className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Secure Data Storage</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Key className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Enterprise Security</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Profile Section */}
            <div className="max-w-2xl mx-auto">
              <UserProfile />
            </div>
          </div>
        ) : (
          <LoginForm />
        )}

        {/* Protected Content Demo */}
        <div className="mt-12">
          <ProtectedRoute
            fallback={
              <Card className="max-w-2xl mx-auto bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Protected Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    This compliance dashboard is only visible to authenticated users. 
                    Please sign in to access your personalized compliance insights.
                  </p>
                </CardContent>
              </Card>
            }
          >
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  🎉 Welcome to PolicyPrism!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-6">
                  You've successfully authenticated and can now access the full PolicyPrism platform.
                </p>
                <div className="bg-card/50 p-6 rounded-xl border border-border">
                  <h4 className="font-semibold mb-4 text-foreground">What you can do now:</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Upload PRDs and get instant compliance analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Access proactive risk detection for GDPR, COPPA, HIPAA
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Collaborate with your legal and compliance teams
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Generate automated legal briefs and recommendations
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </ProtectedRoute>
        </div>
      </div>
    </div>
  );
}