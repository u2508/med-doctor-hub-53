import { useState } from 'react';
import { Save, Plus, Activity, Heart, Thermometer, Scale, Ruler, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppointmentOption {
  id: string;
  appointment_date: string;
  doctor_name: string;
}

interface PatientVitalsFormProps {
  appointments: AppointmentOption[];
  onVitalAdded: () => void;
}

const PatientVitalsForm = ({ appointments, onVitalAdded }: PatientVitalsFormProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    appointment_id: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygen_saturation: '',
    respiratory_rate: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to add vitals',
          variant: 'destructive'
        });
        return;
      }

      const vitalsData = {
        patient_id: user.id,
        appointment_id: formData.appointment_id || null,
        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
        notes: formData.notes || null
      };

      const { error } = await supabase
        .from('vitals')
        .insert(vitalsData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vitals recorded successfully'
      });

      setFormData({
        appointment_id: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        temperature: '',
        weight: '',
        height: '',
        oxygen_saturation: '',
        respiratory_rate: '',
        notes: ''
      });

      onVitalAdded();
    } catch (error) {
      console.error('Error saving vitals:', error);
      toast({
        title: 'Error',
        description: 'Failed to save vitals',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Record New Vitals
        </CardTitle>
        <CardDescription>
          Enter your current vital signs. These will be visible to your doctor during active appointments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {appointments.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Appointment (Optional)</Label>
              <Select
                value={formData.appointment_id}
                onValueChange={(value) => setFormData({ ...formData, appointment_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an appointment" />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((apt) => (
                    <SelectItem key={apt.id} value={apt.id}>
                      {apt.doctor_name} - {formatAppointmentDate(apt.appointment_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-destructive" />
                Blood Pressure (mmHg)
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Systolic"
                  value={formData.blood_pressure_systolic}
                  onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: e.target.value })}
                  min="60"
                  max="250"
                />
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  placeholder="Diastolic"
                  value={formData.blood_pressure_diastolic}
                  onChange={(e) => setFormData({ ...formData, blood_pressure_diastolic: e.target.value })}
                  min="40"
                  max="150"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                Heart Rate (bpm)
              </Label>
              <Input
                type="number"
                placeholder="e.g., 72"
                value={formData.heart_rate}
                onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                min="30"
                max="220"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-warning" />
                Temperature (°F)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 98.6"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                min="90"
                max="110"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-success" />
                Weight (lbs)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 150"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                min="1"
                max="1000"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                Height (inches)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 68"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                min="20"
                max="120"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-primary" />
                Oxygen Saturation (%)
              </Label>
              <Input
                type="number"
                placeholder="e.g., 98"
                value={formData.oxygen_saturation}
                onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
                min="70"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-success" />
                Respiratory Rate (breaths/min)
              </Label>
              <Input
                type="number"
                placeholder="e.g., 16"
                value={formData.respiratory_rate}
                onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                min="5"
                max="60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional notes about your current condition..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Vitals
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PatientVitalsForm;
