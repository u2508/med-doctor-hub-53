import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, Stethoscope, ArrowLeft, User, Mail, Lock, Award, FileText, Upload, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";

// Validation schemas
const step1Schema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  specialty: z.string().trim().min(2, "Specialty is required").max(100, "Specialty is too long"),
  licenseNumber: z.string().trim().min(3, "License number is required").max(50, "License number is too long"),
  yearsExperience: z.string().regex(/^\d+$/, "Must be a valid number").optional().or(z.literal("")),
  hospitalAffiliation: z.string().trim().max(200, "Hospital affiliation is too long").optional().or(z.literal("")),
  phoneNumber: z.string().trim().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Please enter a valid phone number").optional().or(z.literal("")),
});

interface DoctorRegistrationProps {
  setUser?: (user: any) => void;
  setUserType?: (type: string) => void;
}

const DoctorRegistration: React.FC<DoctorRegistrationProps> = ({ setUser, setUserType }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialty: '',
    licenseNumber: '',
    yearsExperience: '',
    hospitalAffiliation: '',
    phoneNumber: '',
    bio: ''
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: "File Selected",
      description: `${file.name} is ready for upload`,
    });
  };

  const uploadIdDocument = async (userId: string) => {
    if (!uploadedFile) return null;

    try {
      setUploadProgress(20);
      
      const fileExt = uploadedFile.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `registrations/${userId}/license-${timestamp}.${fileExt}`;
      
      setUploadProgress(50);
      
      const { error: uploadError } = await supabase.storage
        .from('doctor-ids')
        .upload(fileName, uploadedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;
      
      setUploadProgress(100);
      return fileName;
    } catch (error) {
      console.warn('Upload failed');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps
    try {
      step1Schema.parse({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      step2Schema.parse({
        specialty: formData.specialty,
        licenseNumber: formData.licenseNumber,
        yearsExperience: formData.yearsExperience,
        hospitalAffiliation: formData.hospitalAffiliation,
        phoneNumber: formData.phoneNumber,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (!uploadedFile) {
      toast({
        title: "ID Document Required",
        description: "Please upload your medical license or ID document",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            role: 'doctor'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Upload ID document
      let idDocumentPath = null;
      try {
        idDocumentPath = await uploadIdDocument(authData.user.id);
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        toast({
          title: "Upload Warning",
          description: "Document upload will be completed after email verification.",
        });
      }

      // Step 3: Create doctor profile (only if user is confirmed or we can bypass RLS)
      try {
        const { error: profileError } = await supabase
          .from('doctor_profiles')
          .insert({
            user_id: authData.user.id,
            specialty: formData.specialty,
            license_number: formData.licenseNumber,
            years_experience: parseInt(formData.yearsExperience) || null,
            hospital_affiliation: formData.hospitalAffiliation || null,
          });

        if (profileError) {
          console.error('Doctor profile creation failed:', profileError);
          // Store in localStorage to retry after email confirmation
          localStorage.setItem('pendingDoctorProfile', JSON.stringify({
            user_id: authData.user.id,
            specialty: formData.specialty,
            license_number: formData.licenseNumber,
            years_experience: parseInt(formData.yearsExperience) || null,
            hospital_affiliation: formData.hospitalAffiliation || null,
          }));
        } else {
          // Step 3.5: Notify admins about new doctor registration
          try {
            await supabase.functions.invoke('notify-admins-doctor-registration', {
              body: {
                doctorName: formData.fullName,
                doctorEmail: formData.email,
                specialty: formData.specialty,
                licenseNumber: formData.licenseNumber,
              }
            });
          } catch (notifyError) {
            console.error('Failed to notify admins:', notifyError);
            // Don't fail registration if notification fails
          }
        }

        // Step 4: Update user profile with phone
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phoneNumber || null,
          })
          .eq('user_id', authData.user.id);

        if (updateError) {
          console.error('Profile update failed:', updateError);
        }
      } catch (error) {
        console.error('Profile creation error:', error);
      }

      toast({
        title: "Registration Submitted!",
        description: "Please check your email to verify your account. Your registration will be reviewed by our admin team for approval before you can access the portal.",
        duration: 10000,
      });

      // Redirect to sign in page
      navigate('/user-signin');
      
    } catch (error: any) {
      console.warn('Registration failed');
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      try {
        step1Schema.parse({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: "Validation Error",
            description: error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      }
    }

    if (step === 2) {
      try {
        step2Schema.parse({
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          yearsExperience: formData.yearsExperience,
          hospitalAffiliation: formData.hospitalAffiliation,
          phoneNumber: formData.phoneNumber,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: "Validation Error",
            description: error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-accent/30">
      {/* Enhanced Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-card">
                <Stethoscope className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Doctor Registration</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Join Our Medical Network</p>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Registration Form */}
      <main className="container mx-auto px-4 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Step {step} of 3
              </span>
              <span className="text-sm text-muted-foreground">
                {step === 1 && "Basic Information"}
                {step === 2 && "Professional Details"}
                {step === 3 && "Document Verification"}
              </span>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>

          <Card className="shadow-elegant border-primary/20 bg-gradient-to-br from-card to-primary-light/10">
            <CardHeader className="text-center space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary to-primary-dark rounded-3xl flex items-center justify-center mx-auto shadow-card">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                Doctor Registration
              </CardTitle>
              <CardDescription>
                {step === 1 && "Create your professional account"}
                {step === 2 && "Tell us about your medical expertise"}
                {step === 3 && "Verify your medical license"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Basic Information */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Dr. John Smith"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Professional Details */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="specialty" className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Medical Specialty *
                      </Label>
                      <Input
                        id="specialty"
                        name="specialty"
                        type="text"
                        placeholder="e.g., Cardiology, Neurology, Psychiatry"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Medical License Number *
                      </Label>
                      <Input
                        id="licenseNumber"
                        name="licenseNumber"
                        type="text"
                        placeholder="MD123456789"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience" className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Years of Experience
                      </Label>
                      <Input
                        id="yearsExperience"
                        name="yearsExperience"
                        type="number"
                        placeholder="5"
                        min="0"
                        max="50"
                        value={formData.yearsExperience}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hospitalAffiliation" className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Hospital/Clinic Affiliation
                      </Label>
                      <Input
                        id="hospitalAffiliation"
                        name="hospitalAffiliation"
                        type="text"
                        placeholder="General Hospital, Private Practice, etc."
                        value={formData.hospitalAffiliation}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Professional Bio
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        placeholder="Brief description of your medical background and expertise..."
                        rows={4}
                        value={formData.bio}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Document Upload */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-dark rounded-3xl flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">Upload Medical License</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Please upload a clear image or PDF of your medical license for verification. 
                        This helps us maintain the integrity of our medical network.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/60 transition-colors">
                        <input
                          type="file"
                          id="idUpload"
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Label htmlFor="idUpload" className="cursor-pointer">
                          <div className="space-y-3">
                            {uploadedFile ? (
                              <div className="flex items-center justify-center gap-2 text-primary">
                                <Check className="w-5 h-5" />
                                <span className="font-medium">{uploadedFile.name}</span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                <div>
                                  <span className="text-primary font-medium">Click to upload</span>
                                  <span className="text-muted-foreground"> or drag and drop</span>
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG, or PDF (max 5MB)
                            </p>
                          </div>
                        </Label>
                      </div>
                      
                      {uploadProgress > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} />
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Document Verification</p>
                          <p className="text-muted-foreground">
                            Your uploaded documents will be reviewed by our verification team. 
                            You'll receive a confirmation email once your account is approved.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={loading}
                    >
                      Previous
                    </Button>
                  )}
                  
                  <div className="ml-auto">
                    {step < 3 ? (
                      <Button
                        type="button"
                        variant="medical"
                        onClick={nextStep}
                        disabled={loading}
                      >
                        Next Step
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        variant="medical" 
                        disabled={loading || !uploadedFile}
                      >
                        {loading ? "Creating Account..." : "Complete Registration"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
              
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    onClick={() => navigate('/doctor-portal')}
                    className="p-0 h-auto font-medium text-primary"
                  >
                    Sign in here
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DoctorRegistration;