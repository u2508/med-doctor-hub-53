import { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

/* =========================
   Lazy Imports (NO .tsx)
========================= */
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPage = lazy(() => import("@/components/LandingPage"));
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
const HealthAnalytics = lazy(() => import("@/components/HealthAnalytics"));
const Support = lazy(() => import("@/components/Support"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const PatientOnboarding = lazy(() => import("./pages/PatientOnboarding"));
const TestWorkflow = lazy(() => import("./pages/TestWorkflow"));

/* =========================
   Types
========================= */
type Role = "admin" | "doctor" | "patient";

/* =========================
   Query Client
========================= */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

/* =========================
   Loading Fallback
========================= */
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
  </div>
);

/* =========================
   Route Guards
========================= */
const DOCTOR_ROUTES = ["/doctor-dashboard", "/doctor-profile", "/appointment-history"];
const PATIENT_ROUTES = [
  "/user-dashboard",
  "/user-profile",
  "/doctor-finder",
  "/my-appointments",
  "/mood-tracker",
  "/chatbot",
  "/stress-management",
  "/health-analytics",
  "/patient-onboarding",
];
const ADMIN_ROUTES = ["/admin-dashboard"];
const ALL_PROTECTED_ROUTES = [...DOCTOR_ROUTES, ...PATIENT_ROUTES, ...ADMIN_ROUTES];

const AuthWrapper = ({
  children,
  user,
  role,
  loading,
}: {
  children: React.ReactNode;
  user: SupabaseUser | null;
  role: Role | null;
  loading: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || (user && !role)) return;

    const isProtected = ALL_PROTECTED_ROUTES.some(r =>
      location.pathname.startsWith(r)
    );

    if (!user && isProtected) {
      navigate("/", { replace: true });
      return;
    }

    if (role === "admin") return;

    const isDoctorRoute = DOCTOR_ROUTES.some(r => location.pathname.startsWith(r));
    const isPatientRoute = PATIENT_ROUTES.some(r => location.pathname.startsWith(r));
    const isAdminRoute = ADMIN_ROUTES.some(r => location.pathname.startsWith(r));

    if (role === "patient" && (isDoctorRoute || isAdminRoute)) {
      navigate("/user-dashboard", { replace: true });
    }

    if (role === "doctor" && (isPatientRoute || isAdminRoute)) {
      navigate("/doctor-dashboard", { replace: true });
    }
  }, [user, role, loading, location.pathname, navigate]);

  return <>{children}</>;
};

/* =========================
   App Content
========================= */
const AppContent = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const resolvedRole = (data?.role as Role) || "patient";
    setRole(resolvedRole);
  };

  // Wrapper to accept UserPayload from signin components
  const handleSetUser = (userPayload: { name: string; email?: string | null }) => {
    // The actual user will be set by onAuthStateChange, this is just for UI updates
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === "SIGNED_OUT") {
          setRole(null);
          setLoading(false);
          navigate("/", { replace: true });
          return;
        }

        if (session?.user) {
          await fetchUserRole(session.user.id);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <AuthWrapper user={user} role={role} loading={loading}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/doctor-portal" element={<Index />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Authentication Routes */}
            <Route path="/user-signin" element={<UserSignIn setUser={handleSetUser} setUserType={handleSetUserType} />} />
            <Route path="/doctor-registration" element={<DoctorRegistration setUser={handleSetUser} setUserType={handleSetUserType} />} />
            
            {/* Dashboard Routes */}
            <Route path="/user-signin" element={<UserSignIn />} />
            <Route path="/doctor-registration" element={<DoctorRegistration />} />

            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/appointment-history" element={<AppointmentHistory />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/user-dashboard" element={<UserDashboard user={user} />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/patient-onboarding" element={<PatientOnboarding />} />

            <Route path="/doctor-finder" element={<DoctorFinder />} />
            <Route path="/my-appointments" element={<PatientAppointments />} />
            <Route path="/mood-tracker" element={<MoodTracker />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/stress-management" element={<StressManagement />} />
            <Route path="/health-analytics" element={<HealthAnalytics />} />

            <Route path="/support" element={<Support />} />
            <Route path="/test-workflow" element={<TestWorkflow />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthWrapper>
  );
};

/* =========================
   App Root
========================= */
const App = () => (
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

export default App;
