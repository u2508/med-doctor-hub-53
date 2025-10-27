import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { PatientDetails } from "@/components/patient/PatientDetails";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowLeft, Stethoscope } from "lucide-react";

type AppState = "login" | "dashboard" | "patient-details";

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>("login");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = (email: string, password: string) => {
    // Mock authentication - in real app, validate with backend
    if (email && password) {
      setDoctorName("Dr. Sarah Wilson");
      setCurrentState("dashboard");
      toast({
        title: "Login Successful",
        description: "Welcome to MediCare Portal",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Please check your credentials",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setCurrentState("login");
    setDoctorName("");
    setSelectedPatientId("");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const handleViewPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentState("patient-details");
  };

  const handleBackToDashboard = () => {
    setCurrentState("dashboard");
    setSelectedPatientId("");
  };

  if (currentState === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-accent/30">
        {/* Enhanced Header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-card">
                  <Stethoscope className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Doctor Portal</h1>
                  <p className="text-sm text-muted-foreground">Professional Healthcare Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => navigate('/doctor-registration')}
                  variant="medical"
                  className="flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  Doctor Registration
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Login Section */}
        <main className="container mx-auto px-4 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto items-center">
            {/* Info Section - Hidden on mobile, visible on desktop */}
            <div className="hidden lg:block space-y-6">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-foreground">
                  Welcome to Your Professional Dashboard
                </h2>
                <p className="text-lg text-muted-foreground">
                  Access comprehensive patient records, manage appointments, and provide the best care possible.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Patient Management</h3>
                    <p className="text-sm text-muted-foreground">Track patient history and medical records in one place</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Secure & Compliant</h3>
                    <p className="text-sm text-muted-foreground">HIPAA-compliant platform for healthcare professionals</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="shadow-elegant border-primary/20 bg-gradient-to-br from-card to-primary-light/10">
                <CardHeader className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-dark rounded-3xl flex items-center justify-center mx-auto shadow-card">
                    <Heart className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Doctor Sign In
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Access your professional dashboard
                  </p>
                </CardHeader>
                <CardContent>
                  <LoginForm onLogin={handleLogin} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header doctorName={doctorName} onLogout={handleLogout} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        {currentState === "dashboard" && (
          <Dashboard onViewPatient={handleViewPatient} />
        )}
        
        {currentState === "patient-details" && (
          <PatientDetails 
            patientId={selectedPatientId} 
            onBack={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
