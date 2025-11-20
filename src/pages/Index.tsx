import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { PatientDetails } from "@/components/patient/PatientDetails";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowLeft, Stethoscope, ShieldCheck, Activity } from "lucide-react";

type AppState = "login" | "dashboard" | "patient-details";

const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>("login");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- Core functions remain unchanged ---
  const handleLogin = (email: string, password: string) => {
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
        variant: "destructive",
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

  // --- Redesigned UI begins ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 text-foreground overflow-hidden">
  {/* Top Header (visible only on login page) */}
  {currentState === "login" && (
    <header className="bg-card/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-card">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Doctor Portal</h1>
              <p className="text-sm text-muted-foreground">
                Professional Healthcare Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/doctor-registration")}
              variant="outline"
              className="flex items-center gap-2 text-blue-700 hover:bg-blue-50 border-blue-200"
            >
              <Stethoscope className="w-4 h-4" />
              Doctor Registration
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </header>
  )}

  {/* Keep your header component for logged-in states */}
  {currentState !== "login" && (
    <Header doctorName={doctorName} onLogout={handleLogout} />
  )}

  <main className="container mx-auto px-4 py-10 sm:py-16 relative">
    <AnimatePresence mode="wait">
      {currentState === "login" && (
        <motion.section
          key="login"
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.5 }}
          className="flex flex-col-reverse lg:flex-row items-center justify-between gap-10"
        >
          {/* Left Branding Panel */}
          
          <div className="space-x-0 lg:space-x-10 w-full lg:w-1/2 flex flex-col items-start">
              <h1 className="text-6xl font-extrabold leading-tight bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                Welcome to Your<br />
                <span className="text-blue-600">Professional Space</span>
              </h1>
              <p className="mt-6 text-base text-gray-600 max-w-md">
                Join thousands of healthcare professionals using MediCare Portal to
                manage patients, monitor real-time insights, and elevate care quality
                with AI-powered precision.
              </p>


              <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-md p-6 border border-blue-100 space-y-4 mt-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Stethoscope className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Smart Patient Tracking
                    </h3>
                    <p className="text-sm text-gray-500">
                      Real-time updates and automated reports.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Secure & Compliant
                    </h3>
                    <p className="text-sm text-gray-500">
                      HIPAA-grade data encryption and privacy control.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Activity className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      AI-Assisted Analytics
                    </h3>
                    <p className="text-sm text-gray-500">
                      Data-driven insights for better clinical outcomes.
                    </p>
                  </div>
                </div>
              </div>
          </div>
          {/* Right Auth Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 sm:px-10 lg:px-20"
          >
            <Card className="w-full max-w-md shadow-xl border border-blue-100/50 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center space-y-3">
                <div className="flex justify-center">
                  </div>
              </CardHeader>
              <CardContent>
                <LoginForm onLogin={handleLogin} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>
      )}
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

      {currentState === "dashboard" && (
        <motion.section
          key="dashboard"
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.4 }}
        >
          <Dashboard onViewPatient={handleViewPatient} />
        </motion.section>
      )}

      {currentState === "patient-details" && (
        <motion.section
          key="patient-details"
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.4 }}
        >
          <PatientDetails
            patientId={selectedPatientId}
            onBack={handleBackToDashboard}
          />
        </motion.section>
      )}
    </AnimatePresence>
  </main>
</div>
  );
};

export default Index;
