import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "@/components/LandingPage";
import UserSignIn from "@/components/UserSignIn";

import DoctorRegistration from "@/components/DoctorRegistration";
import DoctorDashboard from "@/components/DoctorDashboard";
import UserDashboard from "@/components/UserDashboard";
import DoctorFinder from "@/components/DoctorFinder";
import MoodTracker from "@/components/MoodTracker";
import Chatbot from "@/components/Chatbot";
import StressManagement from "@/components/StressManagement";
const queryClient = new QueryClient();

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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
