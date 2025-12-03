import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Clock, FileText, LogOut, User, Stethoscope, TrendingUp, Activity, CheckCircle2, XCircle, ClockIcon, Heart, Star, History, CalendarDays, ChevronDown, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PatientDetailsDialog } from '@/components/doctor/PatientDetailsDialog';
import AppointmentCalendar from '@/components/doctor/AppointmentCalendar';
import CompleteAppointmentDialog from '@/components/doctor/CompleteAppointmentDialog';
import { LoginForm } from '@/components/auth/LoginForm';

interface DoctorProfile {
  full_name: string;
  email: string;
  phone?: string;
}

interface DoctorDetails {
  license_number: string;
  specialty: string;
  years_experience?: number;
  hospital_affiliation?: string;
}

interface PatientProfile {
  full_name: string;
  email?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  notes?: string;
  patient_id: string;
  diagnosis?: string;
  prescription?: string;
  patient_profile?: PatientProfile;
}

const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0
  });
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState<string>('');
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [appointmentUpdates, setAppointmentUpdates] = useState<{[key: string]: {diagnosis: string, prescription: string}}>({});
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedAppointmentForComplete, setSelectedAppointmentForComplete] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const isApproved = await checkDoctorApproval(session.user.id);
        if (isApproved) {
          setIsAuthenticated(true);
          fetchDoctorData();
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const isApproved = await checkDoctorApproval(session.user.id);
        if (isApproved) {
          setIsAuthenticated(true);
          fetchDoctorData();
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setProfile(null);
        setDoctorDetails(null);
        setAppointments([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkDoctorApproval = async (userId: string): Promise<boolean> => {
    try {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (userRole?.role === 'doctor') {
        const { data: doctorProfile } = await supabase
          .from('doctor_profiles')
          .select('is_approved')
          .eq('user_id', userId)
          .single();

        if (doctorProfile && !doctorProfile.is_approved) {
          await supabase.auth.signOut();
          toast({
            title: "Pending Approval",
            description: "Your registration is under review. You'll receive an email once approved by our admin team.",
            variant: "destructive",
            duration: 8000,
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking doctor approval:', error);
      return true;
    }
  };

  const fetchDoctorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch doctor details
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (doctorError && doctorError.code !== 'PGRST116') {
        console.error('Error fetching doctor details:', doctorError);
      } else if (doctorData) {
        setDoctorDetails(doctorData);
      }

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user.id)
        .order('appointment_date', { ascending: true });

      if (appointmentsError && appointmentsError.code !== 'PGRST116') {
        console.error('Error fetching appointments:', appointmentsError);
      } else if (appointmentsData) {
        // Fetch patient profiles for appointments
        const patientIds = appointmentsData.map(apt => apt.patient_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', patientIds);

        // Map profiles to appointments
        const appointmentsWithProfiles = appointmentsData.map(apt => ({
          ...apt,
          patient_profile: profilesData?.find(p => p.user_id === apt.patient_id)
        }));

        setAppointments(appointmentsWithProfiles);
        
        // Calculate stats
        const now = new Date();
        const completed = appointmentsData.filter(apt => apt.status === 'completed').length;
        const upcoming = appointmentsData.filter(apt => 
          apt.status === 'scheduled' && new Date(apt.appointment_date) > now
        ).length;
        const cancelled = appointmentsData.filter(apt => apt.status === 'cancelled').length;
        
        setStats({
          total: appointmentsData.length,
          completed,
          upcoming,
          cancelled
        });
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      if (doctorDetails) {
        const { error: doctorError } = await supabase
          .from('doctor_profiles')
          .update({
            specialty: doctorDetails.specialty,
            years_experience: doctorDetails.years_experience,
            hospital_affiliation: doctorDetails.hospital_affiliation
          })
          .eq('user_id', user.id);

        if (doctorError) throw doctorError;
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20';
      case 'scheduled':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date).toDateString();
    const today = new Date().toDateString();
    return aptDate === today;
  }).length;

  const pendingAppointments = appointments.filter(apt => apt.status === 'scheduled');
  
  const upcomingAppointments = appointments.filter(apt => 
    (apt.status === 'confirmed' || apt.status === 'scheduled') && new Date(apt.appointment_date) > new Date()
  );

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      const statusMessages = {
        confirmed: 'Appointment Confirmed',
        completed: 'Appointment Completed',
        cancelled: 'Appointment Cancelled',
        scheduled: 'Appointment Scheduled'
      };

      toast({
        title: statusMessages[newStatus as keyof typeof statusMessages] || 'Status Updated',
        description: `Appointment status changed to ${newStatus}`
      });

      fetchDoctorData();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment status',
        variant: 'destructive'
      });
    }
  };

  const handleApproveAppointment = async (appointmentId: string) => {
    await handleUpdateAppointmentStatus(appointmentId, 'confirmed');
  };

  const handleDenyAppointment = async (appointmentId: string) => {
    await handleUpdateAppointmentStatus(appointmentId, 'cancelled');
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    await handleUpdateAppointmentStatus(appointmentId, 'cancelled');
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    await handleUpdateAppointmentStatus(appointmentId, 'completed');
  };

  const handleViewPatientDetails = (patientId: string, appointmentStatus: string) => {
    setSelectedPatientId(patientId);
    setSelectedAppointmentStatus(appointmentStatus);
  };

  const handleUpdateAppointmentDetails = async (appointmentId: string) => {
    const updates = appointmentUpdates[appointmentId];
    if (!updates) return;

    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      const { error } = await supabase
        .from('appointments')
        .update({
          diagnosis: updates.diagnosis,
          prescription: updates.prescription
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Send email notification for diagnosis/prescription update
      if (appointment?.patient_profile?.email) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const emailType = updates.diagnosis && updates.prescription 
              ? 'diagnosis_update' 
              : updates.prescription ? 'prescription_update' : 'diagnosis_update';
            
            await supabase.functions.invoke('send-prescription-email', {
              body: {
                type: emailType,
                appointment_id: appointmentId,
                patient_email: appointment.patient_profile.email,
                patient_name: appointment.patient_profile.full_name || 'Patient',
                doctor_name: profile?.full_name || 'Doctor',
                diagnosis: updates.diagnosis,
                prescription: updates.prescription
              }
            });
          }
        } catch (emailError) {
          console.error('Email notification error:', emailError);
        }
      }

      toast({
        title: 'Success',
        description: 'Appointment details updated and patient notified'
      });

      setEditingAppointmentId(null);
      fetchDoctorData();
    } catch (error) {
      console.error('Error updating appointment details:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment details',
        variant: 'destructive'
      });
    }
  };

  const handleOpenCompleteDialog = (appointment: Appointment) => {
    setSelectedAppointmentForComplete(appointment);
    setCompleteDialogOpen(true);
  };

  const initializeAppointmentEdit = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setAppointmentUpdates(prev => ({
      ...prev,
      [appointment.id]: {
        diagnosis: appointment.diagnosis || '',
        prescription: appointment.prescription || ''
      }
    }));
  };

  // Loading state
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

  // Login Page (not authenticated)
  if (!isAuthenticated) {
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
                  <p className="text-sm text-muted-foreground">
                    Professional Healthcare Dashboard
                  </p>
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

        <main className="container mx-auto px-4 py-10 sm:py-16 relative">
          <AnimatePresence mode="wait">
            <motion.section
              key="login"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="flex flex-col-reverse lg:flex-row items-center justify-between gap-10"
            >
              {/* Left Branding Panel */}
              <div className="space-x-0 lg:space-x-10 w-full lg:w-1/2 flex flex-col items-start">
                <h1 className="text-6xl font-extrabold leading-tight bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                  Welcome to Your<br />
                  <span className="text-blue-600">Professional Space</span>
                </h1>
                <p className="mt-6 text-base text-gray-600 max-w-md">
                  Join thousands of healthcare professionals using MediCare Portal to
                  manage patients, monitor real-time insights, and elevate care quality
                  with AI-powered precision.
                </p>

                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-md p-6 border border-blue-100 space-y-4 mt-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-100">
                      <Stethoscope className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">
                        Smart Patient Tracking
                      </h3>
                      <p className="text-sm text-gray-500">
                        Real-time updates and automated reports.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-100">
                      <ShieldCheck className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">
                        Secure & Compliant
                      </h3>
                      <p className="text-sm text-gray-500">
                        HIPAA-grade data encryption and privacy control.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-100">
                      <Activity className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">
                        AI-Assisted Analytics
                      </h3>
                      <p className="text-sm text-gray-500">
                        Data-driven insights for better clinical outcomes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Auth Panel */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 sm:px-10 lg:px-20"
              >
                <Card className="w-full max-w-md shadow-xl border border-blue-100/50 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="text-center space-y-3">
                    <div className="flex justify-center"></div>
                  </CardHeader>
                  <CardContent>
                    <LoginForm />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.section>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // Dashboard (authenticated)
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center shadow-card">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, Dr. {profile?.full_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate('/appointment-history')}
                variant="outline"
                className="gap-2"
              >
                <History className="w-4 h-4" />
                History
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {profile?.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{profile?.full_name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border z-50">
                  <DropdownMenuItem onClick={() => navigate('/doctor-profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{todayAppointments}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{appointments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Experience</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{doctorDetails?.years_experience || 0}y</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-dark/20 to-primary-dark/5 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-dark" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1 mt-2">
                    <p className="text-3xl font-bold text-foreground">4.9</p>
                    <Star className="w-5 h-5 text-warning fill-warning" />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
                  <Star className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Appointments Requiring Action */}
          <div className="lg:col-span-1 space-y-6">
            {/* Scheduled Appointments */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClockIcon className="w-5 h-5 text-warning" />
                  Requires Confirmation
                </CardTitle>
                <CardDescription>
                  {pendingAppointments.length} appointment(s) awaiting your response
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending appointments
                  </p>
                ) : (
                  pendingAppointments.slice(0, 5).map((apt) => (
                    <div key={apt.id} className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground">{apt.patient_profile?.full_name || 'Unknown Patient'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </div>
                      {apt.notes && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{apt.notes}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => handleApproveAppointment(apt.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 gap-1"
                          onClick={() => handleDenyAppointment(apt.id)}
                        >
                          <XCircle className="w-4 h-4" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Profile Card */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    Profile
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                  >
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {isEditing ? (
                      <Input 
                        value={profile?.full_name || ''} 
                        onChange={(e) => setProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                        className="font-medium"
                      />
                    ) : (
                      <p className="font-medium text-foreground">{profile?.full_name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{doctorDetails?.specialty}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{profile?.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">License</span>
                    <span className="text-foreground">{doctorDetails?.license_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hospital</span>
                    <span className="text-foreground">{doctorDetails?.hospital_affiliation || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Appointments View */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Appointments
                  </CardTitle>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="grid w-[200px] grid-cols-2">
                      <TabsTrigger value="list">List</TabsTrigger>
                      <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'list' ? (
                  <div className="space-y-4">
                    {upcomingAppointments.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No upcoming appointments</p>
                      </div>
                    ) : (
                      upcomingAppointments.map((apt) => (
                        <div key={apt.id} className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-accent text-accent-foreground">
                                  {apt.patient_profile?.full_name?.charAt(0).toUpperCase() || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{apt.patient_profile?.full_name || 'Unknown Patient'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(apt.status)}>
                                {apt.status}
                              </Badge>
                              <Select
                                value={apt.status}
                                onValueChange={(value) => handleUpdateAppointmentStatus(apt.id, value)}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border z-50">
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {apt.notes && (
                            <p className="text-sm text-muted-foreground mb-3 pl-13">{apt.notes}</p>
                          )}

                          {/* Diagnosis and Prescription Section */}
                          {apt.status === 'confirmed' && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              {editingAppointmentId === apt.id ? (
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-sm">Diagnosis</Label>
                                    <Textarea
                                      value={appointmentUpdates[apt.id]?.diagnosis || ''}
                                      onChange={(e) => setAppointmentUpdates(prev => ({
                                        ...prev,
                                        [apt.id]: { ...prev[apt.id], diagnosis: e.target.value }
                                      }))}
                                      placeholder="Enter diagnosis..."
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Prescription</Label>
                                    <Textarea
                                      value={appointmentUpdates[apt.id]?.prescription || ''}
                                      onChange={(e) => setAppointmentUpdates(prev => ({
                                        ...prev,
                                        [apt.id]: { ...prev[apt.id], prescription: e.target.value }
                                      }))}
                                      placeholder="Enter prescription..."
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleUpdateAppointmentDetails(apt.id)}>
                                      Save & Notify
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingAppointmentId(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {apt.diagnosis && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Diagnosis:</span>
                                      <p className="text-sm">{apt.diagnosis}</p>
                                    </div>
                                  )}
                                  {apt.prescription && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Prescription:</span>
                                      <p className="text-sm">{apt.prescription}</p>
                                    </div>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => initializeAppointmentEdit(apt)}
                                    className="mt-2"
                                  >
                                    <FileText className="w-4 h-4 mr-1" />
                                    {apt.diagnosis || apt.prescription ? 'Update Details' : 'Add Diagnosis/Prescription'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPatientDetails(apt.patient_id, apt.status)}
                            >
                              View Patient
                            </Button>
                            {apt.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenCompleteDialog(apt)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelAppointment(apt.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <AppointmentCalendar appointments={appointments} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Patient Details Dialog */}
      <PatientDetailsDialog
        patientId={selectedPatientId || ''}
        appointmentStatus={selectedAppointmentStatus}
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />

      {/* Complete Appointment Dialog */}
      <CompleteAppointmentDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        appointmentId={selectedAppointmentForComplete?.id || ''}
        patientEmail={selectedAppointmentForComplete?.patient_profile?.email || ''}
        patientName={selectedAppointmentForComplete?.patient_profile?.full_name || 'Patient'}
        doctorName={profile?.full_name || 'Doctor'}
        currentDiagnosis={selectedAppointmentForComplete?.diagnosis || ''}
        currentPrescription={selectedAppointmentForComplete?.prescription || ''}
        onComplete={() => {
          setCompleteDialogOpen(false);
          setSelectedAppointmentForComplete(null);
          fetchDoctorData();
        }}
      />
    </div>
  );
};

export default DoctorDashboard;