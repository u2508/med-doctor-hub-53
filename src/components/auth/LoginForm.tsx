import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart, Stethoscope, UserPlus, ArrowRight, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onLogin?: (email: string, password: string) => void;
  loading?: boolean;
}

export function LoginForm({ onLogin, loading = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Check if user is a doctor
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.role === 'doctor') {
          toast({
            title: "Login Successful",
            description: "Welcome to the Doctor Portal",
          });
          navigate('/doctor-dashboard');
        } else {
          toast({
            title: "Access Denied",
            description: "This portal is for doctors only",
            variant: "destructive"
          });
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
    
    // Fallback to old login method if provided
    if (onLogin) {
      onLogin(email, password);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-light via-background to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto bg-gradient-to-r from-primary to-primary-dark p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">MediCare Portal</h1>
          <p className="text-muted-foreground mt-2">Doctor Access</p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Doctor Login
            </CardTitle>
            <CardDescription>
              Access your patient dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-4"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-4 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="medical" 
                className="w-full" 
                disabled={isLoading || loading}
              >
                {(isLoading || loading) ? "Signing In..." : "Sign In"}
              </Button>
              
              <div className="flex items-center justify-between text-sm">
                <Button variant="link" className="text-sm p-0 h-auto">
                  Forgot Password?
                </Button>
                <span className="text-muted-foreground">•</span>
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto text-primary"
                  onClick={() => navigate('/doctor-registration')}
                >
                  Need an account?
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">New Doctor?</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-primary/30 hover:bg-primary/5"
                  onClick={() => navigate('/doctor-registration')}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Doctor Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}