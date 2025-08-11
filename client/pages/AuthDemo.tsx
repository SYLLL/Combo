import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginForm } from '@/components/LoginForm';
import { UserProfile } from '@/components/UserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Database, Key } from 'lucide-react';

export default function AuthDemo() {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Firebase Authentication Demo
          </h1>
          <p className="text-gray-600">
            A complete authentication system with user management
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Authenticated
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>User ID:</strong> {currentUser.uid}</p>
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>Email Verified:</strong> {currentUser.emailVerified ? 'Yes' : 'No'}</p>
                    <p><strong>Created:</strong> {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Not Authenticated</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sign in or create an account to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm">User Registration & Login</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Profile Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Protected Routes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Firestore Integration</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Forms */}
        <div className="mt-8">
          {currentUser ? (
            <div className="max-w-2xl mx-auto">
              <UserProfile />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <LoginForm />
            </div>
          )}
        </div>

        {/* Protected Content Demo */}
        <div className="mt-8">
          <ProtectedRoute
            fallback={
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Protected Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    This content is only visible to authenticated users. Please sign in to view it.
                  </p>
                </CardContent>
              </Card>
            }
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>🎉 Welcome to the Protected Area!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 mb-4">
                  Congratulations! You've successfully authenticated and can see this protected content.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What you can do now:</h4>
                  <ul className="text-sm space-y-1 text-blue-800">
                    <li>• View and edit your user profile</li>
                    <li>• Access protected routes and features</li>
                    <li>• Store and retrieve data from Firestore</li>
                    <li>• Manage your account settings</li>
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
