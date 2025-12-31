import { useState } from 'react';
import { Activity, Heart, Thermometer, Scale, Ruler, Plus, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DoctorVitalsFormProps {
  patientId: string;
  appointmentId?: string;
  onVitalAdded: () => void;
}

const DoctorVitalsForm = ({ patientId, appointmentId, onVitalAdded }: DoctorVitalsFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
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
    
    if (!formData.blood_pressure_systolic && !formData.heart_rate && !formData.temperature && !formData.weight && !formData.height && !formData.oxygen_saturation && !formData.respiratory_rate) {
      toast({
        title: 'Error',
        description: 'Please enter at least one vital measurement',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('vitals')
        .insert({
          patient_id: patientId,
          appointment_id: appointmentId || null,
          blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
          blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
          heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
          respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vitals recorded successfully'
      });

      setFormData({
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
      setIsExpanded(false);
      onVitalAdded();
    } catch (error) {
      console.error('Error recording vitals:', error);
      toast({
        title: 'Error',
        description: 'Failed to record vitals',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <Button 
        variant="outline" 
        className="gap-2 w-full" 
        onClick={() => setIsExpanded(true)}
      >
        <Plus className="w-4 h-4" />
        Record Patient Vitals
      </Button>
    );
  }

  return (
    <Card className="border-border/50 bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Record Patient Vitals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Blood Pressure */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-destructive" />
                Blood Pressure
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Sys"
                  value={formData.blood_pressure_systolic}
                  onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: e.target.value })}
                  className="w-20"
                />
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  placeholder="Dia"
                  value={formData.blood_pressure_diastolic}
                  onChange={(e) => setFormData({ ...formData, blood_pressure_diastolic: e.target.value })}
                  className="w-20"
                />
              </div>
            </div>

            {/* Heart Rate */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-primary" />
                Heart Rate (bpm)
              </Label>
              <Input
                type="number"
                placeholder="72"
                value={formData.heart_rate}
                onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
              />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Thermometer className="w-4 h-4 text-warning" />
                Temperature (°F)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="98.6"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Scale className="w-4 h-4 text-success" />
                Weight (lbs)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="150"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                Height (in)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="68"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>

            {/* Oxygen Saturation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Wind className="w-4 h-4 text-primary" />
                SpO2 (%)
              </Label>
              <Input
                type="number"
                placeholder="98"
                value={formData.oxygen_saturation}
                onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
                min="70"
                max="100"
              />
            </div>

            {/* Respiratory Rate */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Wind className="w-4 h-4 text-success" />
                Resp Rate (/min)
              </Label>
              <Input
                type="number"
                placeholder="16"
                value={formData.respiratory_rate}
                onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                min="5"
                max="60"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm">Notes (optional)</Label>
            <Textarea
              placeholder="Add any observations..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Record Vitals'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsExpanded(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DoctorVitalsForm;
