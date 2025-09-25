import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FigmaIntegration from '@/components/FigmaIntegration';
import { FigmaComplianceReport } from '@/lib/figma';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Settings,
  LogOut,
  Figma,
  Github,
  FileCheck
} from 'lucide-react';

export default function ProductComplianceCouncil() {
  const { currentUser, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [figmaReports, setFigmaReports] = useState<FigmaComplianceReport[]>([]);

  const handleFigmaComplianceReport = (report: FigmaComplianceReport) => {
    setFigmaReports(prev => [report, ...prev]);
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      console.log("Signing out user...");
      
      // Clear all browser storage first
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all Firebase-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('firebase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('firebase') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Call the sign out function
      await signOut();
      
      // Force a complete page reload to homepage
      console.log("Redirecting to homepage...");
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if sign out fails, force redirect
      localStorage.clear();
      sessionStorage.clear();
      console.log("Redirecting to homepage after error...");
      window.location.href = '/';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to access the Product Compliance Council.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Product Compliance Council
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {currentUser.displayName?.[0] || currentUser.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700">
                  {currentUser.displayName || currentUser.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center space-x-2"
              >
                {isSigningOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to the Compliance Council, {currentUser.displayName || 'User'}! 🎉
          </h2>
          <p className="text-lg text-gray-600">
            Analyze design compliance across GitHub repositories and Figma designs.
          </p>
        </div>

        {/* Tabs for different compliance tools */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="figma" className="flex items-center gap-2">
              <Figma className="h-4 w-4" />
              Figma Analysis
            </TabsTrigger>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub Integration
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Compliance Overview */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Compliance Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Score</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        85%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Requirements Met</span>
                      <span className="text-sm font-medium">17/20</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm text-gray-500">Today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Reviews */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Active Reviews</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending Review</span>
                      <Badge variant="secondary">3</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">In Progress</span>
                      <Badge variant="outline">2</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="text-sm font-medium text-green-600">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Council Members</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Members</span>
                      <span className="text-sm font-medium">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Online Now</span>
                      <span className="text-sm text-green-600">5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Your Role</span>
                      <Badge variant="outline">Member</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Start New Review
                  </Button>
                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Compliance Report
                  </Button>
                  <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700">
                    <Users className="h-4 w-4 mr-2" />
                    Invite Team Member
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Compliance review completed</p>
                      <p className="text-xs text-gray-500">Product X requirements validated</p>
                    </div>
                    <span className="text-xs text-gray-400">2 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New requirement added</p>
                      <p className="text-xs text-gray-500">Security protocol update needed</p>
                    </div>
                    <span className="text-xs text-gray-400">1 day ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Team member joined</p>
                      <p className="text-xs text-gray-500">Sarah Johnson added to council</p>
                    </div>
                    <span className="text-xs text-gray-400">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Figma Analysis Tab */}
          <TabsContent value="figma">
            <FigmaIntegration onComplianceReport={handleFigmaComplianceReport} />
          </TabsContent>

          {/* GitHub Integration Tab */}
          <TabsContent value="github">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Repository Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Analyze GitHub repositories for compliance violations and generate comprehensive reports.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Coming Soon</h3>
                    <p className="text-sm text-blue-700">
                      GitHub integration will allow you to analyze code repositories for compliance violations,
                      security issues, and generate automated reports.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Compliance Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {figmaReports.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium">Figma Analysis Reports</h3>
                      {figmaReports.map((report, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{report.fileName}</h4>
                            <Badge variant={report.summary.totalViolations === 0 ? "default" : "destructive"}>
                              {report.summary.totalViolations} violations
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Analyzed on {new Date(report.analyzedAt).toLocaleDateString()}
                          </p>
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            <div className="text-center p-2 bg-red-50 rounded">
                              <div className="font-semibold text-red-600">{report.summary.criticalCount}</div>
                              <div className="text-red-600">Critical</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded">
                              <div className="font-semibold text-orange-600">{report.summary.highCount}</div>
                              <div className="text-orange-600">High</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 rounded">
                              <div className="font-semibold text-yellow-600">{report.summary.mediumCount}</div>
                              <div className="text-yellow-600">Medium</div>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="font-semibold text-blue-600">{report.summary.lowCount}</div>
                              <div className="text-blue-600">Low</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-semibold text-green-600">{report.summary.totalViolations}</div>
                              <div className="text-green-600">Total</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Reports Yet</h3>
                      <p className="text-gray-500">
                        Run Figma analysis to generate your first compliance report.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
