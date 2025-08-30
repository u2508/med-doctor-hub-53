import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingPage = lazy(() => import("@/components/LandingPage"));
const UserSignIn = lazy(() => import("@/components/UserSignIn"));
const DoctorRegistration = lazy(() => import("@/components/DoctorRegistration"));
const DoctorDashboard = lazy(() => import("@/components/DoctorDashboard"));
const UserDashboard = lazy(() => import("@/components/UserDashboard"));
const DoctorFinder = lazy(() => import("@/components/DoctorFinder"));
const MoodTracker = lazy(() => import("@/components/MoodTracker"));
const Chatbot = lazy(() => import("@/components/Chatbot"));
const StressManagement = lazy(() => import("@/components/StressManagement"));

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

const App = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<"doctor" | "user" | null>(null);
  const [loading, setLoading] = useState(true);
  
  const handleSetUserType = (type: string) => {
    setUserType(type as "doctor" | "user");
  };

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Get user profile to determine role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile?.role === 'doctor') {
            setUserType('doctor');
          } else {
            setUserType('user');
          }
        } else {
          setUserType(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              {/* Medical Dashboard Routes */}
              <Route path="/doctor-portal" element={<Index />} />
              
              {/* Authentication Routes */}
              <Route path="/user-signin" element={<UserSignIn setUser={setUser} setUserType={handleSetUserType} />} />
              
              <Route path="/doctor-registration" element={<DoctorRegistration setUser={setUser} setUserType={handleSetUserType} />} />
              
              {/* Dashboard Routes */}
              <Route path="/doctor-dashboard" element={<DoctorDashboard user={user} />} />
              <Route path="/user-dashboard" element={<UserDashboard user={user} />} />
              
              {/* Mental Health Features */}
              <Route path="/doctor-finder" element={<DoctorFinder />} />
              <Route path="/mood-tracker" element={<MoodTracker />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/stress-management" element={<StressManagement />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
