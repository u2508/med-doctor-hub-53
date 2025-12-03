import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, FileText, LogOut, Stethoscope, TrendingUp, CheckCircle2, XCircle, ClockIcon, Heart, Star, History, CalendarDays, UserRound, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PatientDetailsDialog } from '@/components/doctor/PatientDetailsDialog';
import AppointmentCalendar from '@/components/doctor/AppointmentCalendar';
import CompleteAppointmentDialog from '@/components/doctor/CompleteAppointmentDialog';
import PatientManagement from '@/components/doctor/PatientManagement';
import PatientDetailView from '@/components/doctor/PatientDetailView';

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

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
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
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointmentView, setAppointmentView] = useState('list');
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<{patientId: string, appointment: Appointment} | null>(null);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/doctor-portal');
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/doctor-portal');
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

  const handleViewPatientDetail = (patientId: string, status: string, appointment: Appointment) => {
    setSelectedPatientForDetail({ patientId, appointment });
  };

  // If viewing patient detail, show that view
  if (selectedPatientForDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <main className="container mx-auto px-6 py-8">
          <PatientDetailView
            patientId={selectedPatientForDetail.patientId}
            appointment={selectedPatientForDetail.appointment}
            onBack={() => setSelectedPatientForDetail(null)}
          />
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
              
              <Button 
                variant="destructive"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
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
                  <p className="text-3xl font-bold text-foreground mt-2">4.8</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary fill-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Appointments Alert */}
        {pendingAppointments.length > 0 && (
          <Card className="border-warning/30 bg-warning/5 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-warning" />
                Pending Appointment Requests ({pendingAppointments.length})
              </CardTitle>
              <CardDescription>
                Review and confirm these appointment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pendingAppointments.slice(0, 3).map((appointment) => (
                  <Card key={appointment.id} className="border-warning/30">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-foreground">
                            {appointment.patient_profile?.full_name || 'Unknown Patient'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveAppointment(appointment.id)}
                            className="flex-1 gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirm
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDenyAppointment(appointment.id)}
                            className="flex-1 gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="w-4 h-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2">
              <UserRound className="w-4 h-4" />
              Patient Management
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Tabs value={appointmentView} onValueChange={setAppointmentView}>
              <TabsList className="mb-4">
                <TabsTrigger value="list" className="gap-2">
                  <Clock className="w-4 h-4" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar">
                <AppointmentCalendar 
                  appointments={appointments}
                  onSelectAppointment={(apt) => handleViewPatientDetails(apt.patient_id, apt.status)}
                />
              </TabsContent>

              <TabsContent value="list">
                <Card className="border-border/50 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Upcoming Appointments
                    </CardTitle>
                    <CardDescription>
                      Manage your scheduled patient appointments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingAppointments.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">No upcoming appointments</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                          <Card key={appointment.id} className="border-border/50 hover:shadow-card transition-all">
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <User className="w-4 h-4 text-primary" />
                                      <span className="font-semibold text-foreground">
                                        {appointment.patient_profile?.full_name || 'Unknown Patient'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                                        {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    {appointment.notes && (
                                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                                        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        {appointment.notes}
                                      </p>
                                    )}
                                  </div>
                                  <Badge className={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                  </Badge>
                                </div>

                                {/* Diagnosis and Prescription Section */}
                                {editingAppointmentId === appointment.id ? (
                                  <div className="space-y-3 pt-3 border-t border-border">
                                    <div className="space-y-2">
                                      <Label htmlFor={`diagnosis-${appointment.id}`}>Diagnosis</Label>
                                      <Textarea
                                        id={`diagnosis-${appointment.id}`}
                                        placeholder="Enter diagnosis..."
                                        value={appointmentUpdates[appointment.id]?.diagnosis || ''}
                                        onChange={(e) => setAppointmentUpdates(prev => ({
                                          ...prev,
                                          [appointment.id]: {
                                            ...prev[appointment.id],
                                            diagnosis: e.target.value
                                          }
                                        }))}
                                        rows={2}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`prescription-${appointment.id}`}>Prescription</Label>
                                      <Textarea
                                        id={`prescription-${appointment.id}`}
                                        placeholder="Enter prescription details..."
                                        value={appointmentUpdates[appointment.id]?.prescription || ''}
                                        onChange={(e) => setAppointmentUpdates(prev => ({
                                          ...prev,
                                          [appointment.id]: {
                                            ...prev[appointment.id],
                                            prescription: e.target.value
                                          }
                                        }))}
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateAppointmentDetails(appointment.id)}
                                      >
                                        Save & Notify
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingAppointmentId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {(appointment.diagnosis || appointment.prescription) && (
                                      <div className="space-y-2 pt-3 border-t border-border text-sm">
                                        {appointment.diagnosis && (
                                          <div>
                                            <span className="font-medium text-foreground">Diagnosis: </span>
                                            <span className="text-muted-foreground">{appointment.diagnosis}</span>
                                          </div>
                                        )}
                                        {appointment.prescription && (
                                          <div>
                                            <span className="font-medium text-foreground">Prescription: </span>
                                            <span className="text-muted-foreground">{appointment.prescription}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                <div className="flex flex-wrap items-center gap-2">
                                  {editingAppointmentId !== appointment.id && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => initializeAppointmentEdit(appointment)}
                                    >
                                      <FileText className="w-4 h-4 mr-1" />
                                      Add Details
                                    </Button>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant={appointment.status === 'confirmed' ? 'default' : 'outline'}
                                    onClick={() => handleViewPatientDetails(appointment.patient_id, appointment.status)}
                                  >
                                    View Patient
                                  </Button>
                                  
                                  {appointment.status === 'confirmed' && (
                                    <Button
                                      size="sm"
                                      className="bg-success hover:bg-success/90 text-success-foreground"
                                      onClick={() => handleOpenCompleteDialog(appointment)}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Complete
                                    </Button>
                                  )}
                                  
                                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleCancelAppointment(appointment.id)}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Patient Management Tab */}
          <TabsContent value="patients">
            <Card className="border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-primary" />
                  Patient Management
                </CardTitle>
                <CardDescription>
                  View and manage your patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientManagement 
                  appointments={appointments}
                  onViewPatient={handleViewPatientDetail}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Patient Details Dialog */}
      <PatientDetailsDialog
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        patientId={selectedPatientId || ''}
        appointmentStatus={selectedAppointmentStatus}
      />

      {/* Complete Appointment Dialog */}
      {selectedAppointmentForComplete && (
        <CompleteAppointmentDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          appointmentId={selectedAppointmentForComplete.id}
          patientEmail={selectedAppointmentForComplete.patient_profile?.email || ''}
          patientName={selectedAppointmentForComplete.patient_profile?.full_name || 'Patient'}
          doctorName={profile?.full_name || 'Doctor'}
          currentDiagnosis={selectedAppointmentForComplete.diagnosis}
          currentPrescription={selectedAppointmentForComplete.prescription}
          onComplete={fetchDoctorData}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
