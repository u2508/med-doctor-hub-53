import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Save, Loader2, Heart, Phone, Calendar, Droplet, AlertTriangle, Pill, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UserProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  
  const [patientData, setPatientData] = useState({
    date_of_birth: '',
    gender: '',
    blood_type: '',
    allergies: '',
    current_medications: '',
    medical_history: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }
      
      setUserId(user.id);
      
      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || ''
        });
      }
      
      // Fetch patient data
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (patient) {
        setPatientData({
          date_of_birth: patient.date_of_birth || '',
          gender: patient.gender || '',
          blood_type: patient.blood_type || '',
          allergies: patient.allergies?.join(', ') || '',
          current_medications: patient.current_medications?.join(', ') || '',
          medical_history: patient.medical_history || '',
          emergency_contact_name: patient.emergency_contact_name || '',
          emergency_contact_phone: patient.emergency_contact_phone || ''
        });
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [navigate]);

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (profileError) throw profileError;
      
      // Check if patient record exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      const patientPayload = {
        user_id: userId,
        date_of_birth: patientData.date_of_birth || null,
        gender: patientData.gender || null,
        blood_type: patientData.blood_type || null,
        allergies: patientData.allergies ? patientData.allergies.split(',').map(a => a.trim()).filter(Boolean) : null,
        current_medications: patientData.current_medications ? patientData.current_medications.split(',').map(m => m.trim()).filter(Boolean) : null,
        medical_history: patientData.medical_history || null,
        emergency_contact_name: patientData.emergency_contact_name || null,
        emergency_contact_phone: patientData.emergency_contact_phone || null,
        updated_at: new Date().toISOString()
      };
      
      if (existingPatient) {
        const { error: patientError } = await supabase
          .from('patients')
          .update(patientPayload)
          .eq('user_id', userId);
        
        if (patientError) throw patientError;
      } else {
        const { error: patientError } = await supabase
          .from('patients')
          .insert(patientPayload);
        
        if (patientError) throw patientError;
      }
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user-dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">My Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your personal and medical information</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={patientData.date_of_birth}
                    onChange={(e) => setPatientData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={patientData.gender}
                    onValueChange={(value) => setPatientData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_type" className="flex items-center gap-2">
                    <Droplet className="w-4 h-4" />
                    Blood Type
                  </Label>
                  <Select
                    value={patientData.blood_type}
                    onValueChange={(value) => setPatientData(prev => ({ ...prev, blood_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Medical Information
              </CardTitle>
              <CardDescription>Your health and medical details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergies" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Allergies (comma-separated)
                </Label>
                <Input
                  id="allergies"
                  value={patientData.allergies}
                  onChange={(e) => setPatientData(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="e.g., Penicillin, Peanuts, Latex"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medications" className="flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Current Medications (comma-separated)
                </Label>
                <Input
                  id="medications"
                  value={patientData.current_medications}
                  onChange={(e) => setPatientData(prev => ({ ...prev, current_medications: e.target.value }))}
                  placeholder="e.g., Aspirin, Metformin"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medical_history" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Medical History
                </Label>
                <Textarea
                  id="medical_history"
                  value={patientData.medical_history}
                  onChange={(e) => setPatientData(prev => ({ ...prev, medical_history: e.target.value }))}
                  placeholder="Any relevant medical history, past surgeries, conditions..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Emergency Contact
              </CardTitle>
              <CardDescription>Person to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_name">Contact Name</Label>
                  <Input
                    id="emergency_name"
                    value={patientData.emergency_contact_name}
                    onChange={(e) => setPatientData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    value={patientData.emergency_contact_phone}
                    onChange={(e) => setPatientData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default UserProfile;
