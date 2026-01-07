import { useState, useMemo } from 'react';
import { Search, Filter, User, Calendar, Clock, Info, CheckCircle, XCircle, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PatientProfile {
  full_name: string;
  email?: string;
}

interface PatientData {
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  allergies?: string[];
  current_medications?: string[];
  medical_history?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
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

interface PatientManagementProps {
  appointments: Appointment[];
  onViewPatient: (patientId: string, appointmentStatus: string, appointment: Appointment) => void;
  onRefresh?: () => void;
}

interface PatientSummary {
  patientId: string;
  name: string;
  gender?: string;
  age?: number;
  latestAppointment: Appointment;
  lastVisit?: string;
  status: string;
  diagnosis?: string;
}

const PatientManagement = ({ appointments, onViewPatient, onRefresh }: PatientManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [updatingAppointment, setUpdatingAppointment] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appointmentId: string;
    action: 'completed' | 'cancelled';
    patientName: string;
  } | null>(null);
  const { toast } = useToast();

  // Filter out cancelled and completed appointments, then aggregate patients
  const patients = useMemo(() => {
    const patientMap = new Map<string, PatientSummary>();

    // Only include active appointments (not cancelled or completed)
    const activeAppointments = appointments.filter(
      apt => apt.status !== 'cancelled' && apt.status !== 'completed'
    );

    activeAppointments.forEach((apt) => {
      const existing = patientMap.get(apt.patient_id);
      const aptDate = new Date(apt.appointment_date);
      
      // Calculate age from DOB if available (placeholder - would need patient data)
      const age = undefined; // Will be fetched in detail view

      if (!existing || new Date(existing.latestAppointment.appointment_date) < aptDate) {
        // Determine patient status based on latest appointment
        let status = 'scheduled';
        if (apt.status === 'confirmed') {
          status = 'ongoing';
        } else {
          status = 'scheduled';
        }

        // Check if critical based on diagnosis keywords
        if (apt.diagnosis?.toLowerCase().includes('critical') || 
            apt.diagnosis?.toLowerCase().includes('emergency') ||
            apt.diagnosis?.toLowerCase().includes('severe')) {
          status = 'critical';
        }

        patientMap.set(apt.patient_id, {
          patientId: apt.patient_id,
          name: apt.patient_profile?.full_name || 'Unknown Patient',
          gender: undefined,
          age: age,
          latestAppointment: apt,
          lastVisit: existing?.lastVisit,
          status: status,
          diagnosis: apt.diagnosis
        });
      }
    });

    return Array.from(patientMap.values());
  }, [appointments]);

  // Get completed and cancelled appointments for history
  const historyAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.status === 'completed' || apt.status === 'cancelled')
      .filter(apt => historyFilter === 'all' || apt.status === historyFilter)
      .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
  }, [appointments, historyFilter]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  const openConfirmDialog = (appointmentId: string, action: 'completed' | 'cancelled', patientName: string) => {
    setConfirmDialog({ open: true, appointmentId, action, patientName });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    
    setUpdatingAppointment(confirmDialog.appointmentId);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: confirmDialog.action })
        .eq('id', confirmDialog.appointmentId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Appointment marked as ${confirmDialog.action}`,
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingAppointment(null);
      setConfirmDialog(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ongoing':
        return 'bg-warning text-warning-foreground';
      case 'recovered':
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'scheduled':
        return 'bg-primary text-primary-foreground';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  };

  const renderPatientCard = (patient: PatientSummary, showActions: boolean = true) => (
    <Card 
      key={patient.patientId} 
      className="border-border/50 hover:shadow-elegant transition-all"
    >
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{patient.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {patient.age ? `${patient.age} years` : ''} 
                  {patient.age && patient.gender ? ' • ' : ''}
                  {patient.gender || ''}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(patient.status)}>
              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
            </Badge>
          </div>

          {/* Appointment Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Appointment:</span>
              <span className="font-medium text-foreground">
                {formatDate(patient.latestAppointment.appointment_date)}
              </span>
            </div>
            {patient.lastVisit && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Visit:</span>
                <span className="font-medium text-foreground">
                  {formatDate(patient.lastVisit)}
                </span>
              </div>
            )}
            {patient.diagnosis && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{patient.diagnosis}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onViewPatient(
                patient.patientId, 
                patient.latestAppointment.status,
                patient.latestAppointment
              )}
            >
              View Details
            </Button>
            {showActions && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  disabled={updatingAppointment === patient.latestAppointment.id}
                  onClick={() => openConfirmDialog(patient.latestAppointment.id, 'completed', patient.name)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={updatingAppointment === patient.latestAppointment.id}
                  onClick={() => openConfirmDialog(patient.latestAppointment.id, 'cancelled', patient.name)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderHistoryCard = (apt: Appointment) => (
    <Card 
      key={apt.id} 
      className="border-border/50 hover:shadow-elegant transition-all"
    >
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {apt.patient_profile?.full_name || 'Unknown Patient'}
                </h3>
              </div>
            </div>
            <Badge className={getStatusColor(apt.status)}>
              {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
            </Badge>
          </div>

          {/* Appointment Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-foreground">
                {formatDate(apt.appointment_date)}
              </span>
            </div>
            {apt.diagnosis && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{apt.diagnosis}</span>
              </div>
            )}
          </div>

          {/* View Details Button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onViewPatient(apt.patient_id, apt.status, apt)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Patients</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-card">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Patient Cards Grid */}
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No active patients found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPatients.map((patient) => renderPatientCard(patient))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* History Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={historyFilter} onValueChange={setHistoryFilter}>
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="All History" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">All History</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* History Cards Grid */}
          {historyAppointments.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No appointment history found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyAppointments.map((apt) => renderHistoryCard(apt))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'completed' ? 'Complete Appointment' : 'Cancel Appointment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'completed' 
                ? `Are you sure you want to mark the appointment with ${confirmDialog?.patientName} as completed?`
                : `Are you sure you want to cancel the appointment with ${confirmDialog?.patientName}? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmDialog?.action === 'cancelled' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog?.action === 'completed' ? 'Complete' : 'Cancel Appointment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatientManagement;