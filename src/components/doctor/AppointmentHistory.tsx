import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Clock, FileText, Search, Filter, ArrowLeft, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const AppointmentHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchAppointmentHistory();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  const fetchAppointmentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/doctor-portal');
        return;
      }

      // Fetch all past appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user.id)
        .lte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      if (appointmentsData) {
        // Fetch patient profiles
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
      }
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointment history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patient_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(apt => new Date(apt.appointment_date) >= filterDate);
    }

    setFilteredAppointments(filtered);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading appointment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/doctor-dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Appointment History</h1>
              <p className="text-sm text-muted-foreground">View all past appointments</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filters
            </CardTitle>
            <CardDescription>Search and filter appointment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Patient name, diagnosis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </p>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {appointments.length === 0 
                  ? 'No appointment history found'
                  : 'No appointments match your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-border/50 hover:shadow-card transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              {appointment.patient_profile?.full_name || 'Unknown Patient'}
                            </span>
                          </div>
                          {appointment.patient_profile?.email && (
                            <p className="text-sm text-muted-foreground">
                              {appointment.patient_profile.email}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </span>
                        <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                        <span>
                          {new Date(appointment.appointment_date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>

                      {appointment.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-muted-foreground">{appointment.notes}</p>
                        </div>
                      )}

                      {appointment.diagnosis && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-1">Diagnosis:</p>
                          <p className="text-sm text-muted-foreground">{appointment.diagnosis}</p>
                        </div>
                      )}

                      {appointment.prescription && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-1">Prescription:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {appointment.prescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AppointmentHistory;
