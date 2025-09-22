import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signInUser, signUpUser, createUserProfile } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Shield, ArrowLeft, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const result = await signUpUser(email, password, displayName);
        if (result.success && result.user) {
          await createUserProfile(result.user.uid, {
            displayName,
            email,
            role: 'user'
          });
          onSuccess?.();
        } else {
          setError(result.error || 'Sign up failed');
        }
      } else {
        const result = await signInUser(email, password);
        if (result.success) {
          onSuccess?.();
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0f23' }}>
        <Card className="w-full max-w-md dark-feature-card">
          <CardContent className="pt-6">
            <p className="text-center text-gray-300">
              You are already signed in as {currentUser.email}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f0f23' }}>
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold text-white">PolicyPrism</span>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      {/* Auth Form */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Shield className="h-12 w-12 text-purple-500" />
              <h1 className="text-3xl font-bold text-white">PolicyPrism</h1>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-300 mt-2">
                {isSignUp 
                  ? 'Join the future of proactive compliance management' 
                  : 'Sign in to access your compliance dashboard'
                }
              </p>
            </div>
          </div>

          <div className="dark-feature-card p-8 rounded-2xl">
            {/* Toggle Buttons */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !isSignUp 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isSignUp 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <label htmlFor="displayName" className="text-sm font-medium text-white mb-3 block">
                    Full Name
                  </label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    required={isSignUp}
                    className="h-12 dark-input text-white placeholder:text-gray-400"
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="text-sm font-medium text-white mb-3 block">
                  Work Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  required
                  className="h-12 dark-input text-white placeholder:text-gray-400"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="text-sm font-medium text-white mb-3 block">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12 dark-input text-white placeholder:text-gray-400"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium text-base shadow-lg rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-300">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="ml-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    {isSignUp ? 'Sign in here' : 'Sign up here'}
                  </button>
                </p>
              </div>
            </form>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Enterprise Security
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              SOC 2 Compliant
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              GDPR Ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};