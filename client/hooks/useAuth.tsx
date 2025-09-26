import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChange, getUserProfile, signOutUser } from '@/lib/firebase';

interface UserProfile {
  displayName?: string;
  email: string;
  role?: string;
  company?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signOut = async () => {
    try {
      console.log("Starting sign out process...");
      
      // Clear local state immediately
      setCurrentUser(null);
      setUserProfile(null);
      setError(null);
      
      // Clear browser storage immediately
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear Firebase-specific storage
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
      
      // Call Firebase sign out
      await signOutUser();
      
      console.log("Sign out completed successfully");
    } catch (error) {
      console.error('Error signing out:', error);
      
      // Ensure state is cleared even on error
      setCurrentUser(null);
      setUserProfile(null);
      setError(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 second timeout
    
    // Check if Firebase auth is temporarily disabled
    const isDisabled = localStorage.getItem('FORCE_DISABLE_FIREBASE_AUTH') === 'true';
    const disableTimestamp = localStorage.getItem('FORCE_DISABLE_TIMESTAMP');
    const now = Date.now();
    
    if (isDisabled && disableTimestamp) {
      const timeDiff = now - parseInt(disableTimestamp);
      // Disable for 30 seconds
      if (timeDiff < 30000) {
        setCurrentUser(null);
        setUserProfile(null);
        setError(null);
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      } else {
        // Re-enable after 30 seconds
        localStorage.removeItem('FORCE_DISABLE_FIREBASE_AUTH');
        localStorage.removeItem('FORCE_DISABLE_TIMESTAMP');
      }
    }
    
    // Check current auth state immediately
    const currentUser = auth.currentUser;
    
    const unsubscribe = onAuthStateChange(async (user) => {
      clearTimeout(timeoutId); // Clear timeout since we got a response
      
      // Double-check disable flag
      const stillDisabled = localStorage.getItem('FORCE_DISABLE_FIREBASE_AUTH') === 'true';
      if (stillDisabled) {
        setCurrentUser(null);
        setUserProfile(null);
        setError(null);
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);
      
      if (user) {
        try {
          const result = await getUserProfile(user.uid);
          if (result.success) {
            setUserProfile(result.data as UserProfile);
          } else {
            setError(result.error);
          }
        } catch (err) {
          setError('Failed to fetch user profile');
        }
      } else {
        setUserProfile(null);
        setError(null);
      }
      
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    error,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
