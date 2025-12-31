import { useState } from 'react';
import { FileText, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompleteAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  doctorName: string;
  currentDiagnosis?: string;
  currentPrescription?: string;
  onComplete: () => void;
}

const CompleteAppointmentDialog = ({
  open,
  onOpenChange,
  appointmentId,
  patientEmail,
  patientName,
  doctorName,
  currentDiagnosis,
  currentPrescription,
  onComplete
}: CompleteAppointmentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(currentDiagnosis || '');
  const [prescription, setPrescription] = useState(currentPrescription || '');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF or image file (JPG, PNG)',
          variant: 'destructive'
        });
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive'
        });
        return;
      }
      setPrescriptionFile(file);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      let prescriptionFileUrl: string | null = null;

      // Upload prescription file if provided
      if (prescriptionFile) {
        const fileExt = prescriptionFile.name.split('.').pop();
        const fileName = `${appointmentId}/prescription-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('prescriptions')
          .upload(fileName, prescriptionFile);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw new Error('Failed to upload prescription file');
        }

        // Store the file path for signed URL generation later
        prescriptionFileUrl = fileName;
      }

      // Update appointment with diagnosis, prescription, and file URL
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          diagnosis,
          prescription,
          prescription_file_url: prescriptionFileUrl
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Send email notification
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.functions.invoke('send-prescription-email', {
            body: {
              type: 'prescription_complete',
              appointment_id: appointmentId,
              patient_email: patientEmail,
              patient_name: patientName,
              doctor_name: doctorName,
              diagnosis,
              prescription,
              prescription_file_url: prescriptionFileUrl
            }
          });
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: 'Appointment Completed',
        description: 'The appointment has been marked as completed and the patient has been notified.'
      });

      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete appointment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Complete Appointment
          </DialogTitle>
          <DialogDescription>
            Finalize the appointment with diagnosis, prescription, and optional prescription document.
            The patient will be notified via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              placeholder="Enter diagnosis details..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription">Prescription</Label>
            <Textarea
              id="prescription"
              placeholder="Enter prescription details..."
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescriptionFile">Prescription Document (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {prescriptionFile ? (
                <div className="flex items-center justify-center gap-2 text-success">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">{prescriptionFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrescriptionFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a prescription document (PDF, JPG, PNG)
                  </p>
                  <Input
                    id="prescriptionFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete & Notify Patient
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteAppointmentDialog;
