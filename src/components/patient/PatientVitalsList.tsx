import { Activity, Heart, Thermometer, Scale, Ruler, Clock, Trash2, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VitalsTrendChart from '@/components/vitals/VitalsTrendChart';

interface Vital {
  id: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  oxygen_saturation?: number | null;
  respiratory_rate?: number | null;
  notes: string | null;
  recorded_at: string;
  appointment_id: string | null;
  doctor_name?: string;
}

interface PatientVitalsListProps {
  vitals: Vital[];
  onVitalDeleted: () => void;
}

const PatientVitalsList = ({ vitals, onVitalDeleted }: PatientVitalsListProps) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vitals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Vital record deleted successfully'
      });

      onVitalDeleted();
    } catch (error) {
      console.error('Error deleting vital:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vital record',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBPStatus = (systolic: number | null, diastolic: number | null) => {
    if (!systolic || !diastolic) return null;
    if (systolic < 120 && diastolic < 80) return { label: 'Normal', variant: 'default' as const };
    if (systolic < 130 && diastolic < 80) return { label: 'Elevated', variant: 'secondary' as const };
    if (systolic < 140 || diastolic < 90) return { label: 'High Stage 1', variant: 'outline' as const };
    return { label: 'High Stage 2', variant: 'destructive' as const };
  };

  if (vitals.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Activity className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-card-foreground mb-2">No Vitals Recorded</h3>
          <p className="text-muted-foreground">Start tracking your health by recording your vitals above</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trend Charts */}
      <VitalsTrendChart vitals={vitals} />

      <h3 className="text-lg font-semibold">Your Vital History</h3>
      {vitals.map((vital) => {
        const bpStatus = getBPStatus(vital.blood_pressure_systolic, vital.blood_pressure_diastolic);
        
        return (
          <Card key={vital.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {formatDate(vital.recorded_at)}
                  </CardTitle>
                  {vital.doctor_name && (
                    <CardDescription>
                      Linked to appointment with {vital.doctor_name}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(vital.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {(vital.blood_pressure_systolic || vital.blood_pressure_diastolic) && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Activity className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Pressure</p>
                      <p className="font-medium">
                        {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                      </p>
                      {bpStatus && (
                        <Badge variant={bpStatus.variant} className="text-xs mt-1">
                          {bpStatus.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {vital.heart_rate && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Heart className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Heart Rate</p>
                      <p className="font-medium">{vital.heart_rate} bpm</p>
                    </div>
                  </div>
                )}

                {vital.temperature && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Thermometer className="w-5 h-5 text-warning" />
                    <div>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="font-medium">{vital.temperature}°F</p>
                    </div>
                  </div>
                )}

                {vital.weight && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Scale className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-medium">{vital.weight} lbs</p>
                    </div>
                  </div>
                )}

                {vital.height && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Ruler className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Height</p>
                      <p className="font-medium">{vital.height} in</p>
                    </div>
                  </div>
                )}

                {vital.oxygen_saturation && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Wind className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">SpO2</p>
                      <p className="font-medium">{vital.oxygen_saturation}%</p>
                      {vital.oxygen_saturation < 95 && (
                        <Badge variant={vital.oxygen_saturation < 90 ? "destructive" : "secondary"} className="text-xs mt-1">
                          {vital.oxygen_saturation < 90 ? 'Critical' : 'Low'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {vital.respiratory_rate && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Wind className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-xs text-muted-foreground">Resp Rate</p>
                      <p className="font-medium">{vital.respiratory_rate}/min</p>
                    </div>
                  </div>
                )}
              </div>

              {vital.notes && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">{vital.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PatientVitalsList;
