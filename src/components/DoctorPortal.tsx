import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, ArrowLeft, Heart, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoginForm } from '@/components/auth/LoginForm';

const DoctorPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if doctor and approved
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (userRole?.role === 'doctor') {
          const { data: doctorProfile } = await supabase
            .from('doctor_profiles')
            .select('is_approved')
            .eq('user_id', session.user.id)
            .single();

          if (doctorProfile?.is_approved) {
            navigate('/doctor-dashboard');
            return;
          } else {
            await supabase.auth.signOut();
            toast({
              title: "Pending Approval",
              description: "Your registration is under review. You'll receive an email once approved.",
              variant: "destructive",
            });
          }
        }
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (userRole?.role === 'doctor') {
          const { data: doctorProfile } = await supabase
            .from('doctor_profiles')
            .select('is_approved')
            .eq('user_id', session.user.id)
            .single();

          if (doctorProfile?.is_approved) {
            navigate('/doctor-dashboard');
          } else {
            await supabase.auth.signOut();
            toast({
              title: "Pending Approval",
              description: "Your registration is under review.",
              variant: "destructive",
            });
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 text-foreground overflow-hidden">
      {/* Top Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-card">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Doctor Portal</h1>
                <p className="text-sm text-muted-foreground">Professional Healthcare Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/doctor-registration")}
                variant="outline"
                className="flex items-center gap-2 text-blue-700 hover:bg-blue-50 border-blue-200"
              >
                <Stethoscope className="w-4 h-4" />
                Doctor Registration
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="flex items-center gap-2 text-blue-600 hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Welcome to MentiCare
                <span className="text-blue-600"> Doctor Portal</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Access your professional dashboard to manage appointments,
                view patient records, and provide quality healthcare services.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-sm border border-border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Secure Access</h3>
                  <p className="text-sm text-muted-foreground">
                    HIPAA compliant platform with encrypted data
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-sm border border-border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Patient Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive tools for patient care
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <LoginForm />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DoctorPortal;
