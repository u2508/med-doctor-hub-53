import { useState, useEffect } from 'react';
import { Plus, Pill, Calendar, AlertCircle, Trash2, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  start_date: string;
  end_date: string | null;
  refill_date: string | null;
  quantity: number | null;
  remaining_quantity: number | null;
  prescribing_doctor: string | null;
  pharmacy: string | null;
  is_active: boolean;
}

const MedicationTracker = () => {
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    instructions: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    refill_date: '',
    quantity: '',
    remaining_quantity: '',
    prescribing_doctor: '',
    pharmacy: ''
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', user.id)
        .order('is_active', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load medications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
        return;
      }

      const medicationData = {
        patient_id: user.id,
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        instructions: formData.instructions || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        refill_date: formData.refill_date || null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        remaining_quantity: formData.remaining_quantity ? parseInt(formData.remaining_quantity) : null,
        prescribing_doctor: formData.prescribing_doctor || null,
        pharmacy: formData.pharmacy || null,
        is_active: true,
        refill_reminder_sent: false
      };

      if (editingMed) {
        const { error } = await supabase
          .from('medications')
          .update(medicationData)
          .eq('id', editingMed.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Medication updated' });
      } else {
        const { error } = await supabase
          .from('medications')
          .insert(medicationData);
        if (error) throw error;
        toast({ title: 'Success', description: 'Medication added' });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
      toast({ title: 'Error', description: 'Failed to save medication', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: 'Once daily',
      instructions: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      refill_date: '',
      quantity: '',
      remaining_quantity: '',
      prescribing_doctor: '',
      pharmacy: ''
    });
    setEditingMed(null);
  };

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      instructions: med.instructions || '',
      start_date: med.start_date,
      end_date: med.end_date || '',
      refill_date: med.refill_date || '',
      quantity: med.quantity?.toString() || '',
      remaining_quantity: med.remaining_quantity?.toString() || '',
      prescribing_doctor: med.prescribing_doctor || '',
      pharmacy: med.pharmacy || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Medication removed' });
      fetchMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const toggleActive = async (med: Medication) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ is_active: !med.is_active })
        .eq('id', med.id);
      if (error) throw error;
      fetchMedications();
    } catch (error) {
      console.error('Error updating medication:', error);
    }
  };

  const getRefillStatus = (refillDate: string | null, remaining: number | null) => {
    if (!refillDate) return null;
    const today = new Date();
    const refill = new Date(refillDate);
    const daysUntil = Math.ceil((refill.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { label: 'Overdue', variant: 'destructive' as const };
    if (daysUntil <= 3) return { label: `${daysUntil}d left`, variant: 'destructive' as const };
    if (daysUntil <= 7) return { label: `${daysUntil}d left`, variant: 'secondary' as const };
    return { label: `${daysUntil}d`, variant: 'outline' as const };
  };

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'Once weekly',
    'Twice weekly',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeMeds = medications.filter(m => m.is_active);
  const inactiveMeds = medications.filter(m => !m.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Medication Tracker</h2>
          <p className="text-muted-foreground">Manage your medications and refill schedules</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMed ? 'Edit Medication' : 'Add New Medication'}</DialogTitle>
              <DialogDescription>Enter the medication details below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Medication Name *</Label>
                  <Input
                    required
                    placeholder="e.g., Lisinopril"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosage *</Label>
                  <Input
                    required
                    placeholder="e.g., 10mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency *</Label>
                  <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Quantity</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remaining</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 15"
                    value={formData.remaining_quantity}
                    onChange={(e) => setFormData({ ...formData, remaining_quantity: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-warning" />
                    Refill Date (for reminders)
                  </Label>
                  <Input
                    type="date"
                    value={formData.refill_date}
                    onChange={(e) => setFormData({ ...formData, refill_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prescribing Doctor</Label>
                  <Input
                    placeholder="Dr. Smith"
                    value={formData.prescribing_doctor}
                    onChange={(e) => setFormData({ ...formData, prescribing_doctor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pharmacy</Label>
                  <Input
                    placeholder="CVS Pharmacy"
                    value={formData.pharmacy}
                    onChange={(e) => setFormData({ ...formData, pharmacy: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    placeholder="Take with food, avoid grapefruit..."
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingMed ? 'Update' : 'Add'} Medication
                </Button>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {medications.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Pill className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground mb-2">No Medications Added</h3>
            <p className="text-muted-foreground mb-4">Start tracking your medications to receive refill reminders</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeMeds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                Active Medications ({activeMeds.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {activeMeds.map((med) => {
                  const refillStatus = getRefillStatus(med.refill_date, med.remaining_quantity);
                  return (
                    <Card key={med.id} className="border-border/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Pill className="w-5 h-5 text-primary" />
                              {med.name}
                            </CardTitle>
                            <CardDescription>{med.dosage} • {med.frequency}</CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            {refillStatus && (
                              <Badge variant={refillStatus.variant} className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {refillStatus.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {med.instructions && (
                          <p className="text-sm text-muted-foreground italic">{med.instructions}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {med.remaining_quantity !== null && (
                            <div>
                              <span className="text-muted-foreground">Remaining:</span>{' '}
                              <span className="font-medium">{med.remaining_quantity} pills</span>
                            </div>
                          )}
                          {med.refill_date && (
                            <div>
                              <span className="text-muted-foreground">Refill:</span>{' '}
                              <span className="font-medium">{new Date(med.refill_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {med.prescribing_doctor && (
                            <div>
                              <span className="text-muted-foreground">Doctor:</span>{' '}
                              <span className="font-medium">{med.prescribing_doctor}</span>
                            </div>
                          )}
                          {med.pharmacy && (
                            <div>
                              <span className="text-muted-foreground">Pharmacy:</span>{' '}
                              <span className="font-medium">{med.pharmacy}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(med)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toggleActive(med)}>
                            <X className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(med.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {inactiveMeds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                <X className="w-5 h-5" />
                Inactive Medications ({inactiveMeds.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {inactiveMeds.map((med) => (
                  <Card key={med.id} className="border-border/30 opacity-60">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-muted-foreground">
                        <Pill className="w-5 h-5" />
                        {med.name}
                      </CardTitle>
                      <CardDescription>{med.dosage} • {med.frequency}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleActive(med)}>
                          <Check className="w-4 h-4 mr-1" /> Reactivate
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(med.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MedicationTracker;
