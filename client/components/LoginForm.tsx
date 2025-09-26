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
  const [signUpSuccess, setSignUpSuccess] = useState(false);
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

  const handleModeSwitch = (newIsSignUp: boolean) => {
    setIsSignUp(newIsSignUp);
    setError('');
    setSignUpSuccess(false);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSignUpSuccess(false);

    try {
      if (isSignUp) {
        // Use Firebase directly for immediate feedback
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        
        console.log("Creating Firebase user...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Firebase user created successfully!");
        
        // Show success state IMMEDIATELY after user creation
        setSignUpSuccess(true);
        setLoading(false);
        
        // All other operations happen in background (non-blocking)
        Promise.all([
          // Update display name in Firestore
          displayName ? import('firebase/firestore').then(({ doc, updateDoc, getFirestore }) => 
            updateDoc(doc(getFirestore(), 'users', userCredential.user.uid), {
              displayName: displayName,
              email: email,
              createdAt: new Date().toISOString()
            })
          ) : Promise.resolve(),
          
          // Create user profile
          createUserProfile(userCredential.user.uid, {
            displayName,
            email,
            role: 'user'
          })
        ]).then(() => {
          console.log("All background operations completed successfully");
        }).catch((error) => {
          console.warn("Some background operations failed, but user is created:", error);
        });
        
        // Clear form and switch to sign in mode after 2 seconds
        setTimeout(() => {
          setIsSignUp(false);
          setSignUpSuccess(false);
          setError('');
        }, 2000);
             } else {
               const result = await signInUser(email, password);
               
               if (result.success) {
                 // Clear any stuck authentication flags to ensure proper state sync
                 localStorage.removeItem('FORCE_DISABLE_FIREBASE_AUTH');
                 localStorage.removeItem('FORCE_DISABLE_TIMESTAMP');
                 
                 // Call success callback
                 onSuccess?.();
                 
                 // Force a page reload to ensure authentication state is properly synced
                 // This prevents the "Authentication Required" issue
                 window.location.href = '/compliance-council';
               } else {
                 setError(result.error || 'Sign in failed');
               }
             }
    } catch (err: any) {
      console.error("Sign up error:", err);
      if (err.message === 'Sign up process timeout') {
        setError('Sign up is taking too long. The account might have been created. Please try signing in.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if Firebase auth is temporarily disabled (from sign out)
  const isDisabled = localStorage.getItem('FORCE_DISABLE_FIREBASE_AUTH') === 'true';
  const disableTimestamp = localStorage.getItem('FORCE_DISABLE_TIMESTAMP');
  const now = Date.now();
  
  // If disabled and within 30 seconds, don't show "already signed in" message
  const shouldShowSignedInMessage = currentUser && !(isDisabled && disableTimestamp && (now - parseInt(disableTimestamp) < 30000));

  if (shouldShowSignedInMessage) {
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
        window.location.reload();
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
            onClick={() => handleModeSwitch(false)}
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
            onClick={() => handleModeSwitch(true)}
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

        {signUpSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Account created successfully! You can now sign in.
            </div>
          </div>
        )}

        <Button
          type="submit"
          className={`w-full h-11 font-medium ${
            signUpSuccess 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
          }`}
          disabled={loading || signUpSuccess}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : signUpSuccess ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Account Created Successfully!
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
              onClick={() => handleModeSwitch(!isSignUp)}
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
