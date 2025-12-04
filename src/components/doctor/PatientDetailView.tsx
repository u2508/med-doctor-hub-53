import { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Heart, Calendar, AlertCircle, Pill, FileText, Activity, Plus, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VitalsTrendChart from '@/components/vitals/VitalsTrendChart';
import DoctorVitalsForm from '@/components/doctor/DoctorVitalsForm';

interface PatientProfile {
  full_name: string;
  email?: string;
  phone?: string;
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

interface PatientDetailViewProps {
  patientId: string;
  appointment: Appointment;
  onBack: () => void;
}

interface MedicalNote {
  id: string;
  date: string;
  content: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribed_date: string;
}

interface Vital {
  id: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  notes: string | null;
  recorded_at: string;
}

const PatientDetailView = ({ patientId, appointment, onBack }: PatientDetailViewProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '' });
  const [vitals, setVitals] = useState<Vital[]>([]);
  
  // Mock data for notes (would be stored in DB in production)
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    fetchPatientDetails();
    fetchVitals();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);

      // Fetch patient profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('user_id', patientId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      // Fetch patient medical data (only if appointment is confirmed)
      if (appointment.status === 'confirmed' || appointment.status === 'completed') {
        const { data: patientDataResult, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', patientId)
          .single();

        if (patientError && patientError.code !== 'PGRST116') {
          console.error('Patient data fetch error:', patientError);
        } else if (patientDataResult) {
          setPatientData(patientDataResult);
          
          // Initialize medications from patient data
          if (patientDataResult.current_medications) {
            const meds = patientDataResult.current_medications.map((med: string, index: number) => ({
              name: med,
              dosage: '',
              frequency: '',
              prescribed_date: new Date().toISOString().split('T')[0]
            }));
            setMedications(meds);
          }
        }
      }

      // Initialize notes from appointment history
      if (appointment.diagnosis || appointment.notes) {
        const initialNotes: MedicalNote[] = [];
        if (appointment.diagnosis) {
          initialNotes.push({
            id: '1',
            date: appointment.appointment_date,
            content: `Diagnosis: ${appointment.diagnosis}`
          });
        }
        if (appointment.notes) {
          initialNotes.push({
            id: '2',
            date: appointment.appointment_date,
            content: appointment.notes
          });
        }
        setNotes(initialNotes);
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

  const fetchVitals = async () => {
    try {
      const { data: vitalsData, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setVitals(vitalsData || []);
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'ongoing':
        return 'bg-warning text-warning-foreground';
      case 'completed':
      case 'recovered':
        return 'bg-success text-success-foreground';
      case 'cancelled':
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: MedicalNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: newNote
    };
    setNotes([note, ...notes]);
    setNewNote('');
    toast({ title: 'Note added successfully' });
  };

  const handleAddMedication = () => {
    if (!newMedication.name.trim()) return;
    const med: Medication = {
      ...newMedication,
      prescribed_date: new Date().toISOString().split('T')[0]
    };
    setMedications([...medications, med]);
    setNewMedication({ name: '', dosage: '', frequency: '' });
    toast({ title: 'Medication added successfully' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  };

  const age = calculateAge(patientData?.date_of_birth);
  const displayStatus = appointment.status === 'completed' ? 'recovered' : 
                        appointment.status === 'confirmed' ? 'ongoing' : appointment.status;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 text-primary hover:text-primary/80">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      {/* Patient Header Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {profile?.full_name || appointment.patient_profile?.full_name || 'Unknown Patient'}
                </h2>
                <p className="text-muted-foreground">
                  {age ? `${age} years` : ''} 
                  {age && patientData?.gender ? ' • ' : ''}
                  {patientData?.gender || ''}
                  {patientData?.blood_type ? ` • Blood Type: ${patientData.blood_type}` : ''}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(displayStatus)}>
              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="notes">Notes & History</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile?.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile?.email || appointment.patient_profile?.email || 'Not provided'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address:</p>
                    <span className="text-foreground">Not available</span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Contact:</p>
                    <span className="text-foreground">
                      {patientData?.emergency_contact_name 
                        ? `${patientData.emergency_contact_name} - ${patientData.emergency_contact_phone}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Summary */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  Medical Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Diagnosis:</p>
                  <span className="text-primary font-medium">{appointment.diagnosis || 'Not recorded'}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Date:</p>
                  <span className="text-foreground">{formatDate(appointment.appointment_date)}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Known Allergies:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patientData?.allergies && patientData.allergies.length > 0 ? (
                      patientData.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          {allergy}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None recorded</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="w-5 h-5 text-primary" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {medications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No medications recorded</p>
              ) : (
                medications.map((med, index) => (
                  <Card key={index} className="border-border/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{med.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {med.dosage && `Dosage: ${med.dosage}`} 
                          {med.dosage && med.prescribed_date && ' • '}
                          {med.prescribed_date && `Prescribed: ${med.prescribed_date}`}
                        </p>
                      </div>
                      {med.frequency && (
                        <Badge variant="outline">{med.frequency}</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}

              <Separator />

              {/* Add Medication Form */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">Add New Medication</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Medication Name"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  />
                  <Input
                    placeholder="e.g., 10mg"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  />
                  <Input
                    placeholder="e.g., Twice daily"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddMedication} className="mt-3 gap-2">
                  <Plus className="w-4 h-4" />
                  Add Medication
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes & History Tab */}
        <TabsContent value="notes" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" />
                Medical Notes & History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notes Timeline */}
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No notes recorded</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(note.date)}
                      </div>
                      <p className="text-foreground">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Add Note Form */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">Add New Note</h4>
                <Textarea
                  placeholder="Enter medical notes, observations, or treatment updates..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2 mt-3">
                  <Button onClick={handleAddNote} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Note
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vitals Tab */}
        <TabsContent value="vitals" className="mt-6 space-y-6">
          {/* Doctor Vitals Form */}
          {(appointment.status === 'confirmed' || appointment.status === 'completed') && (
            <DoctorVitalsForm 
              patientId={patientId} 
              appointmentId={appointment.id}
              onVitalAdded={fetchVitals}
            />
          )}

          {/* Vitals Trend Charts */}
          <VitalsTrendChart vitals={vitals} />

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-primary" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vitals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No vitals data recorded for this patient
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Latest Vitals Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Latest Reading</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Card className="bg-muted/30 border-border/30">
                        <CardContent className="p-4 text-center">
                          <Heart className="w-6 h-6 text-destructive mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Blood Pressure</p>
                          <p className="text-xl font-bold text-foreground">
                            {vitals[0].blood_pressure_systolic && vitals[0].blood_pressure_diastolic 
                              ? `${vitals[0].blood_pressure_systolic}/${vitals[0].blood_pressure_diastolic}` 
                              : '--/--'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/30 border-border/30">
                        <CardContent className="p-4 text-center">
                          <Activity className="w-6 h-6 text-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Heart Rate</p>
                          <p className="text-xl font-bold text-foreground">
                            {vitals[0].heart_rate ? `${vitals[0].heart_rate} bpm` : '-- bpm'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/30 border-border/30">
                        <CardContent className="p-4 text-center">
                          <div className="w-6 h-6 rounded-full bg-warning mx-auto mb-2 flex items-center justify-center text-warning-foreground text-xs font-bold">°</div>
                          <p className="text-sm text-muted-foreground">Temperature</p>
                          <p className="text-xl font-bold text-foreground">
                            {vitals[0].temperature ? `${vitals[0].temperature}°F` : '--°F'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/30 border-border/30">
                        <CardContent className="p-4 text-center">
                          <div className="w-6 h-6 rounded-full bg-success mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="text-xl font-bold text-foreground">
                            {vitals[0].weight ? `${vitals[0].weight} lbs` : '-- lbs'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/30 border-border/30">
                        <CardContent className="p-4 text-center">
                          <div className="w-6 h-6 rounded-full bg-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Height</p>
                          <p className="text-xl font-bold text-foreground">
                            {vitals[0].height ? `${vitals[0].height} in` : '-- in'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Vitals History */}
                  {vitals.length > 1 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">History</h4>
                      <div className="space-y-3">
                        {vitals.slice(1).map((vital) => (
                          <Card key={vital.id} className="border-border/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">
                                  {new Date(vital.recorded_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="grid grid-cols-5 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">BP:</span>{' '}
                                  <span className="font-medium">
                                    {vital.blood_pressure_systolic && vital.blood_pressure_diastolic 
                                      ? `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}` 
                                      : '--'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">HR:</span>{' '}
                                  <span className="font-medium">{vital.heart_rate || '--'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Temp:</span>{' '}
                                  <span className="font-medium">{vital.temperature ? `${vital.temperature}°F` : '--'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Weight:</span>{' '}
                                  <span className="font-medium">{vital.weight ? `${vital.weight} lbs` : '--'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Height:</span>{' '}
                                  <span className="font-medium">{vital.height ? `${vital.height} in` : '--'}</span>
                                </div>
                              </div>
                              {vital.notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">{vital.notes}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetailView;
