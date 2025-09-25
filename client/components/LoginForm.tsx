import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signInUser, signUpUser, createUserProfile } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Emergency keyboard shortcut for force sign out
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        console.log("🚨 EMERGENCY FORCE SIGN OUT KEYBOARD SHORTCUT 🚨");
        
        // Set disable flag
        localStorage.setItem('FORCE_DISABLE_FIREBASE_AUTH', 'true');
        localStorage.setItem('FORCE_DISABLE_TIMESTAMP', Date.now().toString());
        
        localStorage.clear();
        sessionStorage.clear();
        
        // Re-set disable flag
        localStorage.setItem('FORCE_DISABLE_FIREBASE_AUTH', 'true');
        localStorage.setItem('FORCE_DISABLE_TIMESTAMP', Date.now().toString());
        
        window.location.replace(window.location.origin + '/?forceSignOut=' + Date.now() + '&clearCache=true');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const result = await signUpUser(email, password, displayName);
        if (result.success && result.user) {
          // Create user profile
          await createUserProfile(result.user.uid, {
            displayName,
            email,
            role: 'user'
          });
          onSuccess?.();
          // Redirect to compliance council after successful signup
          navigate('/compliance-council');
        } else {
          setError(result.error || 'Sign up failed');
        }
      } else {
        const result = await signInUser(email, password);
        if (result.success) {
          onSuccess?.();
          // Redirect to compliance council after successful signin
          navigate('/compliance-council');
        } else {
          setError(result.error || 'Sign in failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    const handleForceSignOut = () => {
      console.log("🚨 FORCE SIGN OUT INITIATED 🚨");
      
      // Nuclear option - clear EVERYTHING and disable Firebase temporarily
      try {
        // Set a flag to disable Firebase auth temporarily
        localStorage.setItem('FORCE_DISABLE_FIREBASE_AUTH', 'true');
        localStorage.setItem('FORCE_DISABLE_TIMESTAMP', Date.now().toString());
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Re-set the disable flag after clearing
        localStorage.setItem('FORCE_DISABLE_FIREBASE_AUTH', 'true');
        localStorage.setItem('FORCE_DISABLE_TIMESTAMP', Date.now().toString());
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear Firebase-specific storage with more patterns
        const allKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
        allKeys.forEach(key => {
          if (key.includes('firebase') || key.includes('auth') || key.includes('user') || key.includes('token')) {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          }
        });
        
        // Clear any remaining Firebase data
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('firebase') || key.includes('auth'))) {
            localStorage.removeItem(key);
          }
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('firebase') || key.includes('auth'))) {
            sessionStorage.removeItem(key);
          }
        }
        
        // Re-set the disable flag one more time
        localStorage.setItem('FORCE_DISABLE_FIREBASE_AUTH', 'true');
        localStorage.setItem('FORCE_DISABLE_TIMESTAMP', Date.now().toString());
        
        console.log("All storage cleared, forcing page reload...");
        
        // Force complete page reload with cache busting
        window.location.replace(window.location.origin + '/?forceSignOut=' + Date.now() + '&clearCache=true');
        
      } catch (error) {
        console.error("Error in force sign out:", error);
        // Last resort - hard reload
        window.location.reload(true);
      }
    };

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground mb-4">
            You are already signed in as {currentUser.email}
          </p>
          <Button 
            onClick={handleForceSignOut}
            variant="destructive"
            className="w-full"
          >
            🚨 Force Sign Out 🚨
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-6">
        <div className="flex bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isSignUp 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isSignUp 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="displayName" className="text-sm font-medium text-foreground mb-2 block">
              Display Name
            </label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
              required={isSignUp}
              className="h-11"
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="h-11"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="h-11"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </Button>

        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-1 text-primary hover:underline font-medium"
            >
              {isSignUp ? 'Sign in here' : 'Sign up here'}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
