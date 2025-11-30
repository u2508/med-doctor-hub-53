import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Heart, User, ArrowLeft, Mail, Lock, Sparkles, Shield, CheckCircle, Wand2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface UserSignInProps {
  setUser: (user: any) => void;
  setUserType: (type: string) => void;
}

const UserSignIn: React.FC<UserSignInProps> = ({ setUser, setUserType }) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUserState] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUserState(session?.user ?? null);
        
        if (session?.user) {
          // Get user profile to determine role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('user_id', session.user.id)
            .single();
          
          setTimeout(() => {
            setUser({ 
              name: profile?.full_name || session.user.user_metadata?.full_name || 'User', 
              email: session.user.email 
            });
            
            // Redirect based on user role
            if (profile?.role === 'admin') {
              setUserType('user');
              navigate('/admin-dashboard');
            } else if (profile?.role === 'doctor') {
              setUserType('doctor');
              navigate('/doctor-dashboard');
            } else {
              setUserType('user');
              navigate('/user-dashboard');
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUserState(session?.user ?? null);
      
      if (session?.user) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('user_id', session.user.id)
          .single();
          
        setUser({ 
          name: profile?.full_name || session.user.user_metadata?.full_name || 'User', 
          email: session.user.email 
        });
        
        // Redirect based on user role
        if (profile?.role === 'admin') {
          setUserType('user');
          navigate('/admin-dashboard');
        } else if (profile?.role === 'doctor') {
          setUserType('doctor');
          navigate('/doctor-dashboard');
        } else {
          setUserType('user');
          navigate('/user-dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setUserType, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match!",
        variant: "destructive"
      });
      return;
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(signUpData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signUpData.name,
            role: 'patient'
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account Created Successfully!",
        description: "Please check your email to verify your account.",
      });
      
      setActiveTab('signin');
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    setUser({ name: 'Demo User', email: 'demo@example.com' });
    setUserType('user');
    toast({
      title: "Demo Access Granted",
      description: "Welcome to MentiBot Demo!",
    });
    navigate('/user-dashboard');
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/user-signin`,
        }
      });

      if (error) throw error;

      toast({
        title: "Magic Link Sent!",
        description: "Check your email for the sign-in link.",
      });
      
      setMagicLinkEmail('');
    } catch (error: any) {
      toast({
        title: "Failed to Send Magic Link",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/user-signin`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Sign In Failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent!",
        description: "Check your email for the password reset link.",
      });
      
      setResetPasswordOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Failed to Send Reset Email",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Heart, text: "Mental Health Tracking" },
    { icon: Shield, text: "Secure & Private" },
    { icon: Sparkles, text: "AI-Powered Insights" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex flex-col">
      {/* Modern Header */}
      <header className="bg-card/90 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  MentiBot
                </h1>
                <p className="text-xs text-muted-foreground">Mental Health Companion</p>
              </div>
            </Link>
            
            <Button 
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features & Welcome */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2">
                <Sparkles className="w-4 h-4" />
                Your Mental Health Journey Starts Here
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                Welcome to Your Safe Space
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                Join thousands of users who trust MentiBot for their mental wellness journey. 
                Track, understand, and improve your mental health with AI-powered insights.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/80 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="hidden lg:block">
              <Button
                onClick={handleDemoAccess}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <User className="w-4 h-4 mr-2" />
                Try Demo Access
              </Button>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="signin" className="text-xs sm:text-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="text-xs sm:text-sm">Sign Up</TabsTrigger>
                    <TabsTrigger value="magiclink" className="text-xs sm:text-sm">Magic Link</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="space-y-4">
                    <div className="text-center mb-6">
                      <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                      <CardDescription className="mt-2">
                        Sign in to continue your mental health journey
                      </CardDescription>
                    </div>
                    
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signInData.email}
                          onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="flex items-center gap-2 text-sm font-medium">
                          <Lock className="w-4 h-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={signInData.password}
                            onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11"
                        onClick={handleGoogleSignIn}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </Button>

                      <div className="text-center mt-4">
                        <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                          <DialogTrigger asChild>
                            <Button variant="link" className="text-sm text-primary">
                              Forgot password?
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                              <DialogDescription>
                                Enter your email address and we'll send you a link to reset your password.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="reset-email">Email Address</Label>
                                <Input
                                  id="reset-email"
                                  type="email"
                                  placeholder="Enter your email"
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  required
                                />
                              </div>
                              <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Sending..." : "Send Reset Link"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-4">
                    <div className="text-center mb-6">
                      <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                      <CardDescription className="mt-2">
                        Join MentiBot and start your wellness journey
                      </CardDescription>
                    </div>
                    
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="flex items-center gap-2 text-sm font-medium">
                          <User className="w-4 h-4" />
                          Full Name
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={signUpData.name}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="flex items-center gap-2 text-sm font-medium">
                          <Lock className="w-4 h-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password (min. 8 chars, mixed case, number, symbol)"
                            value={signUpData.password}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            minLength={6}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm" className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={signUpData.confirmPassword}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11"
                        disabled={loading}
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </Button>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11"
                        onClick={handleGoogleSignIn}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign up with Google
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="magiclink" className="space-y-4">
                    <div className="text-center mb-6">
                      <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Wand2 className="w-6 h-6 text-primary" />
                        Passwordless Sign In
                      </CardTitle>
                      <CardDescription className="mt-2">
                        We'll send you a magic link to sign in without a password
                      </CardDescription>
                    </div>
                    
                    <form onSubmit={handleMagicLink} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="magic-email" className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </Label>
                        <Input
                          id="magic-email"
                          type="email"
                          placeholder="Enter your email"
                          value={magicLinkEmail}
                          onChange={(e) => setMagicLinkEmail(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11"
                        disabled={loading}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        {loading ? "Sending magic link..." : "Send Magic Link"}
                      </Button>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11"
                        onClick={handleGoogleSignIn}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </Button>

                      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex gap-3">
                          <KeyRound className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">How Magic Links Work</p>
                            <p className="text-xs text-muted-foreground">
                              Enter your email and we'll send you a secure link. Click it to instantly sign in—no password needed!
                            </p>
                          </div>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6 lg:hidden">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-card text-muted-foreground">
                        Or try demo
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleDemoAccess}
                    variant="outline"
                    className="w-full"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Demo Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserSignIn;