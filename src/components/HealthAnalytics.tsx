import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Heart, Activity, Moon, AlertCircle, Calendar, TrendingUp, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface MoodEntry {
  mood_level: number;
  stress_level: number;
  sleep_hours: number;
  created_at: string;
  notes: string;
}

interface Appointment {
  appointment_date: string;
  status: string;
  diagnosis: string;
  notes: string;
}

interface PatientData {
  date_of_birth: string;
  gender: string;
  blood_type: string;
  allergies: string[];
  current_medications: string[];
  medical_history: string;
}

export default function HealthAnalytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        // Wait 5 seconds before redirecting
        setTimeout(() => {
          navigate("/user-signin");
        }, 5000);
        return;
      }

      setUser(user);
      await fetchHealthData(user.id);
    } catch (error) {
      console.error("Error checking auth:", error);
      setLoading(false);
      setTimeout(() => {
        navigate("/user-signin");
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthData = async (userId: string) => {
    try {
      // Fetch mood entries
      const { data: moods } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (moods) setMoodData(moods);

      // Fetch appointments
      const { data: appts } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", userId)
        .order("appointment_date", { ascending: false });

      if (appts) setAppointments(appts);

      // Fetch patient data
      const { data: patient } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (patient) setPatientData(patient);
    } catch (error) {
      console.error("Error fetching health data:", error);
      toast({
        title: "Error",
        description: "Failed to load health data",
        variant: "destructive",
      });
    }
  };

  const calculateAverages = () => {
    if (moodData.length === 0) return { mood: 0, stress: 0, sleep: 0 };
    
    const sum = moodData.reduce(
      (acc, entry) => ({
        mood: acc.mood + entry.mood_level,
        stress: acc.stress + (entry.stress_level || 0),
        sleep: acc.sleep + (entry.sleep_hours || 0),
      }),
      { mood: 0, stress: 0, sleep: 0 }
    );

    return {
      mood: Math.round(sum.mood / moodData.length),
      stress: Math.round(sum.stress / moodData.length),
      sleep: Math.round((sum.sleep / moodData.length) * 10) / 10,
    };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show sign in required message if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full shadow-elegant">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Sign In Required</CardTitle>
              <CardDescription className="text-base">
                You need to be signed in to view your health analytics.
                Redirecting you to sign in page in 5 seconds...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate("/user-signin")}>
                Sign In Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const averages = calculateAverages();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/user-dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-primary">Health Analytics</h1>
            </div>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
                <Brain className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.mood}/10</div>
                <Progress value={averages.mood * 10} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
                <Heart className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.stress}/10</div>
                <Progress value={averages.stress * 10} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Sleep</CardTitle>
                <Moon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.sleep}h</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {averages.sleep >= 7 ? "Good sleep!" : "Need more rest"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{moodData.length}</div>
                <p className="text-xs text-muted-foreground mt-2">Mood tracking records</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Patient Profile */}
        {patientData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Medical Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                  <p className="font-medium">{patientData.blood_type || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{patientData.gender || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {patientData.date_of_birth ? new Date(patientData.date_of_birth).toLocaleDateString() : "Not specified"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Allergies</p>
                  <p className="font-medium">
                    {patientData.allergies?.length ? patientData.allergies.join(", ") : "None reported"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Medications</p>
                  <p className="font-medium">
                    {patientData.current_medications?.length ? patientData.current_medications.join(", ") : "None"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Appointments
            </CardTitle>
            <CardDescription>Your medical appointment history</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((apt, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {new Date(apt.appointment_date).toLocaleDateString()}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        apt.status === 'completed' ? 'bg-green-500/20 text-green-700' : 
                        apt.status === 'scheduled' ? 'bg-blue-500/20 text-blue-700' : 
                        'bg-gray-500/20 text-gray-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    {apt.diagnosis && <p className="text-sm text-muted-foreground mt-1">Diagnosis: {apt.diagnosis}</p>}
                    {apt.notes && <p className="text-sm mt-1">{apt.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No appointments recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Mood History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Mood History
            </CardTitle>
            <CardDescription>Your recent mood tracking entries</CardDescription>
          </CardHeader>
          <CardContent>
            {moodData.length > 0 ? (
              <div className="space-y-4">
                {moodData.slice(0, 10).map((entry, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Mood</p>
                          <p className="font-medium">{entry.mood_level}/10</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stress</p>
                          <p className="font-medium">{entry.stress_level || "N/A"}/10</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sleep</p>
                          <p className="font-medium">{entry.sleep_hours || "N/A"}h</p>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No mood entries yet</p>
                <Button className="mt-4" onClick={() => navigate("/mood-tracker")}>
                  Start Tracking
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
