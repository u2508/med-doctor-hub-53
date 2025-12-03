import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowRight, Loader2, User, Calendar, Droplet, AlertTriangle, Pill, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PatientOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
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
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }
      
      setUserId(user.id);
      
      // Check if patient profile already exists
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (patient) {
        // Patient profile already exists, redirect to dashboard
        navigate('/user-dashboard');
        return;
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!userId) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('patients')
        .insert({
          user_id: userId,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          blood_type: formData.blood_type || null,
          allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : null,
          current_medications: formData.current_medications ? formData.current_medications.split(',').map(m => m.trim()).filter(Boolean) : null,
          medical_history: formData.medical_history || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null
        });
      
      if (error) throw error;
      
      toast({
        title: 'Profile Created',
        description: 'Your patient profile has been set up successfully!'
      });
      
      navigate('/user-dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create profile.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/user-dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">Complete Your Profile</CardTitle>
            <CardDescription>
              Help us personalize your healthcare experience
            </CardDescription>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s}
                  className={`w-20 h-2 rounded-full transition-colors ${
                    s <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
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
                      value={formData.blood_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, blood_type: value }))}
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
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Medical Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="allergies" className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Allergies (comma-separated)
                    </Label>
                    <Input
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
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
                      value={formData.current_medications}
                      onChange={(e) => setFormData(prev => ({ ...prev, current_medications: e.target.value }))}
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
                      value={formData.medical_history}
                      onChange={(e) => setFormData(prev => ({ ...prev, medical_history: e.target.value }))}
                      placeholder="Any relevant medical history..."
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Emergency Contact
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_name">Contact Name</Label>
                    <Input
                      id="emergency_name"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Contact Phone</Label>
                    <Input
                      id="emergency_phone"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                      placeholder="Emergency contact phone"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
              
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} className="gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PatientOnboarding;
