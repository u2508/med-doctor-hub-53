import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, FileText, LogOut, User, Stethoscope, TrendingUp, Activity, CheckCircle2, XCircle, ClockIcon, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  notes?: string;
  patient_id: string;
  diagnosis?: string;
  prescription?: string;
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
        setAppointments(appointmentsData);
        
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

  const handleCompleteAppointment = async (appointmentId: string) => {
    await handleUpdateAppointmentStatus(appointmentId, 'completed');
  };

  const handleViewPatientDetails = async (patientId: string) => {
    try {
      const { data: patientData, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', patientId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'No Patient Data',
            description: 'Patient profile not found',
            variant: 'destructive'
          });
        } else {
          throw error;
        }
        return;
      }

      // Show patient details in a dialog or navigate to details page
      toast({
        title: 'Patient Details',
        description: `Viewing details for patient ${patientId}`
      });
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast({
        title: 'Access Denied',
        description: 'You can only view patient details for confirmed appointments within 7 days',
        variant: 'destructive'
      });
    }
  };

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
                <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}</p>
              </div>
            </div>
            
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Scheduled Appointments */}
            {pendingAppointments.length > 0 && (
              <Card className="border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-warning" />
                    Scheduled Appointments
                  </CardTitle>
                  <CardDescription>
                    Review and confirm appointment requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingAppointments.map((appointment) => (
                      <Card key={appointment.id} className="border-warning/30 bg-warning/5">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {new Date(appointment.appointment_date).toLocaleDateString()}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground">
                                {appointment.notes}
                              </p>
                            )}
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

            {/* Doctor Profile Card */}
            <Card className="border-border/50 shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Doctor Profile
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                <CardDescription>Manage your professional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center text-center pb-4">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground text-2xl">
                      {profile?.full_name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold mt-4">{profile?.full_name}</h3>
                  <p className="text-muted-foreground">{doctorDetails?.specialty || 'Specialist'}</p>
                  {doctorDetails?.hospital_affiliation && (
                    <Badge variant="outline" className="mt-2">
                      {doctorDetails.hospital_affiliation}
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile?.full_name || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile?.phone || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      value={doctorDetails?.specialty || ''}
                      onChange={(e) => setDoctorDetails(prev => prev ? {...prev, specialty: e.target.value} : null)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={doctorDetails?.years_experience || ''}
                      onChange={(e) => setDoctorDetails(prev => prev ? {...prev, years_experience: parseInt(e.target.value)} : null)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital Affiliation</Label>
                    <Input
                      id="hospital"
                      value={doctorDetails?.hospital_affiliation || ''}
                      onChange={(e) => setDoctorDetails(prev => prev ? {...prev, hospital_affiliation: e.target.value} : null)}
                      disabled={!isEditing}
                      placeholder="Enter hospital name"
                    />
                  </div>

                  {isEditing && (
                    <Button 
                      onClick={handleUpdateProfile}
                      className="w-full"
                    >
                      Save Changes
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments List */}
          <div className="lg:col-span-2">
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
                             
                             <div className="flex flex-wrap items-center gap-2">
                               <Select
                                 value={appointment.status}
                                 onValueChange={(value) => handleUpdateAppointmentStatus(appointment.id, value)}
                               >
                                 <SelectTrigger className="w-[160px]">
                                   <SelectValue placeholder="Update Status" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="scheduled">Scheduled</SelectItem>
                                   <SelectItem value="confirmed">Confirmed</SelectItem>
                                   <SelectItem value="completed">Completed</SelectItem>
                                   <SelectItem value="cancelled">Cancelled</SelectItem>
                                 </SelectContent>
                               </Select>
                               
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleViewPatientDetails(appointment.patient_id)}
                               >
                                 View Patient
                               </Button>
                               
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
           </div>
         </div>
       </main>
     </div>
   );
 };
 
 export default DoctorDashboard;
