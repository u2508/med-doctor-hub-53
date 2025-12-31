import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Heart,
  User,
  ArrowLeft,
  Mail,
  Lock,
  Sparkles,
  Shield,
  CheckCircle,
  Wand2,
  KeyRound,
  Activity,
  Brain,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

type UserRole = "admin" | "doctor" | "patient";

interface UserPayload {
  name: string;
  email?: string | null;
}

interface UserSignInProps {
  setUser: (user: UserPayload) => void;
  setUserType: (type: UserRole | "user" | "unknown") => void;
}

const PASSWORD_MIN_LENGTH = 8;
const AUTH_REDIRECT = `${window.location.origin}`;

const UserSignIn: React.FC<UserSignInProps> = ({ setUser, setUserType }) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "magiclink">("signin");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const redirectLock = useRef(false);

  // Role-based redirect logic
  const performRoleBasedRedirect = useCallback(
    async (currentUser: SupabaseUser) => {
      if (redirectLock.current) return;
      redirectLock.current = true;

      try {
        const userId = currentUser.id;
        const userEmail = currentUser.email ?? null;
        const userMetadata = currentUser.user_metadata ?? {};

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("user_id", userId)
          .maybeSingle();

        setUser({
          name: profile?.full_name || userMetadata?.full_name || "User",
          email: userEmail,
        });

        // Fetch authoritative role from user_roles table
        const { data: userRoleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        const resolvedRole: UserRole = (userRoleData?.role as UserRole) || 
          (profile?.role as UserRole) || 
          (userMetadata?.role as UserRole) || 
          "patient";

        // Navigate based on role
        switch (resolvedRole) {
          case "admin":
            setUserType("admin");
            navigate("/admin-dashboard", { replace: true });
            break;
          case "doctor":
            setUserType("doctor");
            navigate("/doctor-dashboard", { replace: true });
            break;
          case "patient":
          default:
            setUserType("user");
            // Check if patient has completed onboarding
            const { data: patientData } = await supabase
              .from("patients")
              .select("id")
              .eq("user_id", userId)
              .maybeSingle();

            if (!patientData) {
              navigate("/patient-onboarding", { replace: true });
            } else {
              navigate("/user-dashboard", { replace: true });
            }
            break;
        }
      } catch (error) {
        console.error("Redirect error:", error);
        navigate("/", { replace: true });
      } finally {
        setTimeout(() => {
          redirectLock.current = false;
        }, 500);
      }
    },
    [navigate, setUser, setUserType]
  );

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        
        const currentSession = data.session;
        setSession(currentSession);

        if (currentSession?.user) {
          await performRoleBasedRedirect(currentSession.user);
        }
      } catch (error) {
        console.error("Session initialization error:", error);
      } finally {
        if (mounted) setInitializing(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (newSession?.user && event === "SIGNED_IN") {
        performRoleBasedRedirect(newSession.user);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [performRoleBasedRedirect]);

  // Auth handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({ title: "Welcome back!", description: "Signing you in..." });
      setSignInData({ email: "", password: "" });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error?.message || "Please check your credentials.",
        variant: "destructive",
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
        description: "Passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(signUpData.password)) {
      toast({
        title: "Weak Password",
        description: `Password must be at least ${PASSWORD_MIN_LENGTH} characters with uppercase, lowercase, number and special character.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: AUTH_REDIRECT,
          data: {
            full_name: signUpData.name,
            role: "patient",
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Check your email for verification.",
      });

      setSignInData((prev) => ({ ...prev, email: signUpData.email }));
      setActiveTab("signin");
      setSignUpData({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
        options: { emailRedirectTo: `${window.location.origin}/user-signin` },
      });

      if (error) throw error;

      toast({
        title: "Magic Link Sent!",
        description: "Check your email to sign in.",
      });
      setMagicLinkEmail("");
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: AUTH_REDIRECT },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Sign In Failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
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

      toast({ title: "Reset Email Sent", description: "Check your inbox." });
      setResetPasswordOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-muted-foreground">Checking session...</p>
        </motion.div>
      </div>
    );
  }

  const features = [
    { icon: Activity, text: "Track Vitals & Health", color: "text-success" },
    { icon: Brain, text: "AI-Powered Insights", color: "text-primary" },
    { icon: Shield, text: "Secure & HIPAA Ready", color: "text-warning" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Heart className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  MediCare
                </h1>
                <p className="text-xs text-muted-foreground">Health Companion</p>
              </div>
            </Link>

            <Button onClick={() => navigate("/")} variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 text-center lg:text-left"
          >
            <div className="space-y-4">
              <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-4 h-4" />
                Your Health Journey Starts Here
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-foreground via-primary to-primary-dark bg-clip-text text-transparent">
                  Welcome to
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-primary-dark to-success bg-clip-text text-transparent">
                  Modern Healthcare
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                Connect with doctors, track your vitals, and take control of your health with AI-powered insights.
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Auth Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="shadow-2xl border-border/50 bg-card/90 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              
              <CardHeader className="text-center space-y-4 pb-2 relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto shadow-lg"
                >
                  <Heart className="w-8 h-8 text-primary-foreground" />
                </motion.div>
              </CardHeader>

              <CardContent className="px-6 pb-6 relative">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Sign Up
                    </TabsTrigger>
                    <TabsTrigger value="magiclink" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Magic
                    </TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    {/* Sign In Tab */}
                    <TabsContent value="signin" className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="text-center mb-6">
                          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                          <CardDescription className="mt-1">Sign in to your account</CardDescription>
                        </div>

                        <form onSubmit={handleSignIn} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signin-email" className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              Email
                            </Label>
                            <Input
                              id="signin-email"
                              type="email"
                              placeholder="you@example.com"
                              value={signInData.email}
                              onChange={(e) => setSignInData((p) => ({ ...p, email: e.target.value }))}
                              required
                              className="h-11 bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signin-password" className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                              Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="signin-password"
                                type={showSignInPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={signInData.password}
                                onChange={(e) => setSignInData((p) => ({ ...p, password: e.target.value }))}
                                required
                                className="h-11 pr-10 bg-background/50"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowSignInPassword(!showSignInPassword)}
                              >
                                {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary-dark hover:opacity-90" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {loading ? "Signing in..." : "Sign In"}
                          </Button>

                          <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-card px-2 text-muted-foreground">or</span>
                            </div>
                          </div>

                          <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogleSignIn} disabled={loading}>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                          </Button>

                          <div className="text-center">
                            <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                              <DialogTrigger asChild>
                                <Button variant="link" className="text-sm text-primary p-0 h-auto">
                                  Forgot password?
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card">
                                <DialogHeader>
                                  <DialogTitle>Reset Password</DialogTitle>
                                  <DialogDescription>
                                    Enter your email and we'll send you a reset link.
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                  <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                  />
                                  <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Sending..." : "Send Reset Link"}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </form>
                      </motion.div>
                    </TabsContent>

                    {/* Sign Up Tab */}
                    <TabsContent value="signup" className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="text-center mb-6">
                          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                          <CardDescription className="mt-1">Join our healthcare community</CardDescription>
                        </div>

                        <form onSubmit={handleSignUp} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signup-name" className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              Full Name
                            </Label>
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="John Doe"
                              value={signUpData.name}
                              onChange={(e) => setSignUpData((p) => ({ ...p, name: e.target.value }))}
                              required
                              className="h-11 bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              Email
                            </Label>
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="you@example.com"
                              value={signUpData.email}
                              onChange={(e) => setSignUpData((p) => ({ ...p, email: e.target.value }))}
                              required
                              className="h-11 bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-password" className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                              Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="signup-password"
                                type={showSignUpPassword ? "text" : "password"}
                                placeholder="Min 8 chars, mixed case, number, symbol"
                                value={signUpData.password}
                                onChange={(e) => setSignUpData((p) => ({ ...p, password: e.target.value }))}
                                required
                                className="h-11 pr-10 bg-background/50"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                              >
                                {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-confirm" className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-muted-foreground" />
                              Confirm Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="signup-confirm"
                                type={showSignUpConfirm ? "text" : "password"}
                                placeholder="Confirm password"
                                value={signUpData.confirmPassword}
                                onChange={(e) => setSignUpData((p) => ({ ...p, confirmPassword: e.target.value }))}
                                required
                                className="h-11 pr-10 bg-background/50"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                              >
                                {showSignUpConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary-dark hover:opacity-90" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {loading ? "Creating..." : "Create Account"}
                          </Button>

                          <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-card px-2 text-muted-foreground">or</span>
                            </div>
                          </div>

                          <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogleSignIn} disabled={loading}>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                          </Button>
                        </form>
                      </motion.div>
                    </TabsContent>

                    {/* Magic Link Tab */}
                    <TabsContent value="magiclink" className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="text-center mb-6">
                          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                            <Wand2 className="w-6 h-6 text-primary" />
                            Passwordless
                          </CardTitle>
                          <CardDescription className="mt-1">Sign in with a magic link</CardDescription>
                        </div>

                        <form onSubmit={handleMagicLink} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="magic-email" className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              Email
                            </Label>
                            <Input
                              id="magic-email"
                              type="email"
                              placeholder="you@example.com"
                              value={magicLinkEmail}
                              onChange={(e) => setMagicLinkEmail(e.target.value)}
                              required
                              className="h-11 bg-background/50"
                            />
                          </div>

                          <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary-dark hover:opacity-90" disabled={loading}>
                            <Wand2 className="w-4 h-4 mr-2" />
                            {loading ? "Sending..." : "Send Magic Link"}
                          </Button>

                          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 mt-4">
                            <div className="flex gap-3">
                              <KeyRound className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">How it works</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  We'll email you a secure link. Click it to sign in instantly—no password needed!
                                </p>
                              </div>
                            </div>
                          </div>
                        </form>
                      </motion.div>
                    </TabsContent>
                  </AnimatePresence>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2024 MediCare. Your health, our priority.</p>
      </footer>
    </div>
  );
};

export default UserSignIn;
