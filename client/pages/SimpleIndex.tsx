import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { Card, CardContent } from '@/components/ui/card';

export default function SimpleIndex() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  console.log('SimpleIndex rendered - currentUser:', currentUser, 'loading:', loading);

  useEffect(() => {
    console.log('SimpleIndex useEffect - currentUser:', currentUser, 'loading:', loading);
    
    // TEMPORARILY DISABLE AUTO-REDIRECT TO DEBUG THE ISSUE
    // Comment out the redirect to see the login page
    /*
    if (!loading && currentUser) {
      console.log('Redirecting to compliance-council');
      // Redirect authenticated users to compliance council
      navigate('/compliance-council');
    }
    */
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // TEMPORARILY COMMENT OUT TO SHOW LOGIN PAGE EVEN WHEN SIGNED IN
  /*
  if (currentUser) {
    // This should not render due to the useEffect redirect, but just in case
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }
  */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Compliance Review
          </h1>
          <p className="text-gray-600">
            Sign in to access the compliance analysis tools
          </p>
        </div>
        
        {/* Debug info */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Current User: {currentUser ? currentUser.email : 'None'}</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Auth Disabled: {localStorage.getItem('FORCE_DISABLE_FIREBASE_AUTH') || 'No'}</p>
          <p>URL: {window.location.href}</p>
          <p>Debug Mode: {new URLSearchParams(window.location.search).get('debug') === 'true' ? 'Yes' : 'No'}</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <LoginForm onSuccess={() => navigate('/compliance-council')} />
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need access? Contact your administrator
          </p>
          
          {currentUser && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                You are currently signed in as: <strong>{currentUser.email}</strong>
              </p>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Sign Out & Clear All Data
              </button>
            </div>
          )}
          
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Clear All Data & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
