import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Phone, Mail, Heart, AlertCircle, Pill, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PatientProfile {
  full_name: string;
  email?: string;
  phone?: string;
}

interface PatientMedicalData {
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  allergies?: string[];
  current_medications?: string[];
  medical_history?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface PatientDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  appointmentStatus: string;
}

export const PatientDetailsDialog = ({ isOpen, onClose, patientId, appointmentStatus }: PatientDetailsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [medicalData, setMedicalData] = useState<PatientMedicalData | null>(null);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientDetails();
    }
  }, [isOpen, patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);

      // Fetch basic profile (available for scheduled and confirmed)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('user_id', patientId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch detailed medical data (only for confirmed appointments)
      if (appointmentStatus === 'confirmed') {
        const { data: medicalDataResult, error: medicalError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', patientId)
          .maybeSingle();

        if (medicalError && medicalError.code !== 'PGRST116') {
          throw medicalError;
        }
        setMedicalData(medicalDataResult);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patient details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Patient Details
          </DialogTitle>
          <DialogDescription>
            {appointmentStatus === 'confirmed' 
              ? 'Comprehensive patient medical information'
              : 'Basic patient information (confirm appointment to view medical details)'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Heart className="w-8 h-8 text-primary animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Profile Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profile?.full_name || 'N/A'}</p>
                </div>
                {profile?.email && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                )}
                {profile?.phone && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Phone
                    </p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {appointmentStatus !== 'confirmed' && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Confirm the appointment to access detailed medical information
                </p>
              </div>
            )}

            {/* Medical Information - Only for confirmed appointments */}
            {appointmentStatus === 'confirmed' && medicalData && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {medicalData.date_of_birth && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Date of Birth
                        </p>
                        <p className="font-medium">
                          {new Date(medicalData.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {medicalData.gender && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium">{medicalData.gender}</p>
                      </div>
                    )}
                    {medicalData.blood_type && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Blood Type
                        </p>
                        <Badge variant="outline" className="font-medium">
                          {medicalData.blood_type}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {medicalData.allergies && medicalData.allergies.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        Allergies
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {medicalData.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {medicalData.current_medications && medicalData.current_medications.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Pill className="w-5 h-5 text-primary" />
                        Current Medications
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {medicalData.current_medications.map((medication, index) => (
                          <Badge key={index} variant="secondary">
                            {medication}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {medicalData.medical_history && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">Medical History</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {medicalData.medical_history}
                      </p>
                    </div>
                  </>
                )}

                {(medicalData.emergency_contact_name || medicalData.emergency_contact_phone) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {medicalData.emergency_contact_name && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{medicalData.emergency_contact_name}</p>
                          </div>
                        )}
                        {medicalData.emergency_contact_phone && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Phone
                            </p>
                            <p className="font-medium">{medicalData.emergency_contact_phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {appointmentStatus === 'confirmed' && !medicalData && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  Patient has not completed their medical profile yet.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
