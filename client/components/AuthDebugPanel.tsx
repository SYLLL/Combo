import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AuthDebugPanel: React.FC = () => {
  const { currentUser, loading, error } = useAuth();

  const handleTestSignIn = async () => {
    try {
      const { signInUser } = await import('@/lib/firebase');
      const result = await signInUser('test@example.com', 'password123');
      console.log('Test sign in result:', result);
    } catch (error) {
      console.error('Test sign in error:', error);
    }
  };

  const handleClearAuth = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>🔧 Auth Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Current Auth State:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {currentUser ? currentUser.email : 'None'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Local Storage:</h3>
          <div className="text-sm space-y-1">
            {Object.keys(localStorage).length > 0 ? (
              Object.keys(localStorage).map(key => (
                <p key={key}><strong>{key}:</strong> {localStorage.getItem(key)?.substring(0, 50)}...</p>
              ))
            ) : (
              <p>No localStorage items</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleTestSignIn} variant="outline" size="sm">
            Test Sign In
          </Button>
          <Button onClick={handleClearAuth} variant="destructive" size="sm">
            Clear Auth
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugPanel;
