import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff, User, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import logo from "../../public/logo2.jpeg";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, loading: authLoading } = useApp();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setShowForgotPassword(false);
        toast.success('Please set your new password below');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully!');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail && !email) {
      toast.error('Please enter your email');
      return;
    }

    const emailToUse = resetEmail || email;
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
      redirectTo: `${window.location.origin}/auth`,
    });
    
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setResetEmail('');
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      setIsRecovery(false);
      setNewPassword('');
      navigate('/dashboard');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-[#5B6B8A]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0B1F8A] via-[#1246C9] to-[#1B64F2] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#3EF0C1] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#FFD84D] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFD84D] shadow-lg">
              <img src={logo} alt="Outrank Logo" className="h-9 w-9 rounded-full" />
            </div>
            <span className="text-3xl font-bold text-white">Outrank</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            AI-Powered SEO
            <span className="block mt-2">Content Briefs</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-10 leading-relaxed">
            Generate comprehensive content briefs that rank. Analyze SERPs, 
            optimize keywords, and publish directly to WordPress.
          </p>

          <div className="space-y-4">
            {[
              'SERP analysis & competitor insights',
              '3,500+ word comprehensive briefs',
              'One-click WordPress publishing',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-[#3EF0C1] flex-shrink-0" />
                <span className="text-white text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-[#F6F8FC]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFD84D]">
              <Sparkles className="h-6 w-6 text-[#0B1F3B]" />
            </div>
            <span className="text-2xl font-bold text-[#0B1F3B]">Outrank</span>
          </div>

          <h2 className="text-3xl font-bold text-[#0B1F3B] mb-3">
            {isRecovery ? 'Reset Password' : isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-[#5B6B8A] mb-8 leading-relaxed">
            {isRecovery 
              ? 'Enter your new password to complete the reset process' 
              : isLogin 
              ? 'Enter your credentials to access your dashboard' 
              : 'Start creating SEO-optimized content briefs'
            }
          </p>

          {/* Password Recovery Form */}
          {isRecovery && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0B1F3B]">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A94B3]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 rounded-xl border-[#8A94B3]/30 bg-white focus:ring-2 focus:ring-[#1B64F2] focus:border-[#1B64F2]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A94B3] hover:text-[#0B1F3B]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-[#8A94B3]">Must be at least 6 characters</p>
              </div>

              <button 
                type="button"
                className="w-full h-12 rounded-xl bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold transition-colors flex items-center justify-center gap-2"
                onClick={handleUpdatePassword}
                disabled={loading || newPassword.length < 6}
              >
                {loading ? 'Updating...' : 'Update Password'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Regular Auth Form */}
          {!isRecovery && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0B1F3B]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A94B3]" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-12 h-12 rounded-xl border-[#8A94B3]/30 bg-white focus:ring-2 focus:ring-[#1B64F2] focus:border-[#1B64F2]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0B1F3B]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A94B3]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-[#8A94B3]/30 bg-white focus:ring-2 focus:ring-[#1B64F2] focus:border-[#1B64F2] "
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0B1F3B]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A94B3]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 rounded-xl border-[#8A94B3]/30 bg-white focus:ring-2 focus:ring-[#1B64F2] focus:border-[#1B64F2] "
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A94B3] hover:text-[#0B1F3B]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-[#8A94B3]">Must be at least 6 characters</p>
                )}
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-[#1B64F2] hover:text-[#1246C9] hover:underline disabled:opacity-50 font-medium"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-[#5B6B8A]">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setFullName('');
                setIsRecovery(false);
                setNewPassword('');
              }}
              className="text-[#1B64F2] hover:text-[#1246C9] hover:underline font-semibold"
              disabled={loading}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-[#0B1F3B]/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-[#8A94B3]/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0B1F3B]">Reset Password</h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-[#5B6B8A] hover:text-[#0B1F3B] transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-[#5B6B8A] mb-6 leading-relaxed">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <div className="space-y-4 mb-6">
              <Input
                type="email"
                placeholder="your@email.com"
                value={resetEmail || email}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={loading}
                className="h-12 rounded-xl border-[#8A94B3]/30 bg-white focus:ring-2 focus:ring-[#1B64F2] "
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                }}
                className="flex-1 px-6 py-3 border-2 border-[#8A94B3]/30 rounded-full font-semibold text-[#0B1F3B] hover:bg-[#F6F8FC] transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-6 py-3 rounded-full bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold transition-colors"
                onClick={handleForgotPassword}
                disabled={loading || (!resetEmail && !email)}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}