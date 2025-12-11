import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPage = lazy(() => import("@/components/LandingPage.tsx"));
const UserSignIn = lazy(() => import("@/components/UserSignIn"));
const DoctorRegistration = lazy(() => import("@/components/DoctorRegistration"));
const DoctorDashboard = lazy(() => import("@/components/DoctorDashboard"));
const AppointmentHistory = lazy(() => import("@/components/doctor/AppointmentHistory"));
const AdminDashboard = lazy(() => import("@/components/AdminDashboard"));
const DoctorProfile = lazy(() => import("@/pages/DoctorProfile"));
const UserDashboard = lazy(() => import("@/components/UserDashboard"));
const PatientAppointments = lazy(() => import("@/components/PatientAppointments"));
const DoctorFinder = lazy(() => import("@/components/DoctorFinder"));
const MoodTracker = lazy(() => import("@/components/MoodTracker"));
const Chatbot = lazy(() => import("@/components/Chatbot"));
const StressManagement = lazy(() => import("@/components/StressManagement"));
const Support = lazy(() => import("@/components/Support"));
const HealthAnalytics = lazy(() => import("@/components/HealthAnalytics"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const PatientOnboarding = lazy(() => import("./pages/PatientOnboarding"));
const TestWorkflow = lazy(() => import("./pages/TestWorkflow"));

// Optimized query client with better caching and background updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Route configuration by role
const DOCTOR_ROUTES = ['/doctor-dashboard', '/doctor-profile', '/appointment-history'];
const PATIENT_ROUTES = ['/user-dashboard', '/user-profile', '/doctor-finder', '/my-appointments', '/mood-tracker', '/chatbot', '/stress-management', '/health-analytics', '/patient-onboarding'];
const ADMIN_ROUTES = ['/admin-dashboard'];
const ALL_PROTECTED_ROUTES = [...DOCTOR_ROUTES, ...PATIENT_ROUTES, ...ADMIN_ROUTES];

// Auth wrapper component to handle redirects and role-based access
const AuthWrapper = ({ children, user, userRole, loading }: { children: React.ReactNode; user: SupabaseUser | null; userRole: string | null; loading: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = ALL_PROTECTED_ROUTES.some(route => location.pathname.startsWith(route));
    
    if (!user && isProtectedRoute) {
      navigate('/', { replace: true });
      return;
    }

    // Role-based route protection - Admin can access all routes
    if (user && userRole) {
      // Admin can access everything, no restrictions
      if (userRole === 'admin') {
        return;
      }
      
      const isDoctorRoute = DOCTOR_ROUTES.some(route => location.pathname.startsWith(route));
      const isPatientRoute = PATIENT_ROUTES.some(route => location.pathname.startsWith(route));
      const isAdminRoute = ADMIN_ROUTES.some(route => location.pathname.startsWith(route));

      if (userRole === 'patient') {
        if (isDoctorRoute || isAdminRoute) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive'
          });
          navigate('/user-dashboard', { replace: true });
        }
      } else if (userRole === 'doctor') {
        if (isPatientRoute || isAdminRoute) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive'
          });
          navigate('/doctor-dashboard', { replace: true });
        }
      }
    }
  }, [user, userRole, loading, location.pathname, navigate]);

  return <>{children}</>;
};

const AppContent = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<"doctor" | "user" | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const handleSetUserType = (type: string) => {
    setUserType(type as "doctor" | "user");
  };

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setUserType(null);
          setUserRole(null);
          navigate('/', { replace: true });
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // Session was refreshed successfully
        }
        
        if (event === 'USER_UPDATED') {
          // User data was updated
        }
        
        if (session?.user) {
          // Defer role fetch to avoid deadlock - use user_roles table as authoritative source
          setTimeout(async () => {
            const { data: userRoleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            const role = userRoleData?.role || 'patient';
            setUserRole(role);
            
            if (role === 'doctor') {
              setUserType('doctor');
            } else {
              setUserType('user');
            }
          }, 0);
        } else {
          setUserType(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data: userRoleData }) => {
            const role = userRoleData?.role || 'patient';
            setUserRole(role);
            
            if (role === 'doctor') {
              setUserType('doctor');
            } else {
              setUserType('user');
            }
          });
      }
      setLoading(false);
    });

    // Set up session expiry listener
    const checkSessionExpiry = setInterval(async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error || (!currentSession && user)) {
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please sign in again.',
          variant: 'destructive'
        });
        setUser(null);
        setSession(null);
        setUserType(null);
        setUserRole(null);
        navigate('/', { replace: true });
      }
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(checkSessionExpiry);
    };
  }, [navigate, user]);

  return (
    <AuthWrapper user={user} userRole={userRole} loading={loading}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            {/* Medical Dashboard Routes */}
            <Route path="/doctor-portal" element={<Index />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Authentication Routes */}
            <Route path="/user-signin" element={<UserSignIn setUser={setUser} setUserType={handleSetUserType} />} />
            <Route path="/doctor-registration" element={<DoctorRegistration setUser={setUser} setUserType={handleSetUserType} />} />
            
            {/* Dashboard Routes */}
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/appointment-history" element={<AppointmentHistory />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/user-dashboard" element={<UserDashboard user={user} />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/patient-onboarding" element={<PatientOnboarding />} />
            
            {/* Mental Health Features */}
            <Route path="/doctor-finder" element={<DoctorFinder />} />
            <Route path="/my-appointments" element={<PatientAppointments />} />
            <Route path="/mood-tracker" element={<MoodTracker />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/stress-management" element={<StressManagement />} />
            <Route path="/health-analytics" element={<HealthAnalytics />} />
            
            {/* Support */}
            <Route path="/support" element={<Support />} />
            
            {/* Test Workflow */}
            <Route path="/test-workflow" element={<TestWorkflow />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthWrapper>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;