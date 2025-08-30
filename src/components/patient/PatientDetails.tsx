import { useState } from "react";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Heart, 
  Plus, 
  FileText, 
  Pill,
  Activity,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PatientDetailsProps {
  patientId: string;
  onBack: () => void;
}

// Mock patient data
const mockPatientData = {
  id: "1",
  name: "John Doe",
  age: 45,
  gender: "Male",
  phone: "+1 (555) 123-4567",
  email: "john.doe@email.com",
  address: "123 Main St, City, State 12345",
  emergencyContact: "Jane Doe - +1 (555) 987-6543",
  bloodType: "O+",
  allergies: ["Penicillin", "Shellfish"],
  status: "Ongoing",
  admissionDate: "2024-01-10",
  diagnosis: "Hypertension",
  vitals: {
    bloodPressure: "140/90",
    heartRate: "78 bpm",
    temperature: "98.6°F",
    weight: "180 lbs",
    height: "5'10\"",
    lastUpdated: "2024-01-15 10:30 AM"
  },
  medications: [
    { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", prescribed: "2024-01-10" },
    { name: "Metformin", dosage: "500mg", frequency: "Twice daily", prescribed: "2024-01-08" }
  ],
  notes: [
    { date: "2024-01-15", note: "Patient reports feeling better. Blood pressure improving." },
    { date: "2024-01-12", note: "Started new medication regime. Monitor for side effects." },
    { date: "2024-01-10", note: "Initial consultation. Diagnosed with stage 1 hypertension." }
  ]
};

export function PatientDetails({ patientId, onBack }: PatientDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [newMedication, setNewMedication] = useState({ name: "", dosage: "", frequency: "" });

  const patient = mockPatientData; // In real app, fetch by patientId

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In real app, save to backend
      // Note added - avoid logging sensitive patient data
      setNewNote("");
    }
  };

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      // In real app, save to backend
      // Medication added - avoid logging sensitive patient data
      setNewMedication({ name: "", dosage: "", frequency: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Patient Header Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary-light p-3 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
                <p className="text-muted-foreground">
                  {patient.age} years • {patient.gender} • Blood Type: {patient.bloodType}
                </p>
              </div>
            </div>
            <Badge className="bg-warning text-warning-foreground w-fit">
              {patient.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="notes">Notes & History</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm">Address:</p>
                    <p className="text-sm text-muted-foreground">{patient.address}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm">Emergency Contact:</p>
                    <p className="text-sm text-muted-foreground">{patient.emergencyContact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medical Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Primary Diagnosis:</p>
                  <p className="text-primary font-semibold">{patient.diagnosis}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Admission Date:</p>
                  <p className="text-sm text-muted-foreground">{patient.admissionDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Known Allergies:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.medications.map((med, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{med.name}</h4>
                    <Badge variant="outline">{med.frequency}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dosage: {med.dosage} • Prescribed: {med.prescribed}
                  </p>
                </div>
              ))}
              
              <Separator />
              
              {/* Add New Medication */}
              <div className="space-y-4 pt-4">
                <h4 className="font-semibold">Add New Medication</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Medication Name</Label>
                    <Input
                      value={newMedication.name}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter medication name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 10mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                </div>
                <Button onClick={handleAddMedication} variant="medical">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Notes & History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.notes.map((note, index) => (
                <div key={index} className="border-l-4 border-l-primary pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{note.date}</span>
                  </div>
                  <p className="text-sm">{note.note}</p>
                </div>
              ))}
              
              <Separator />
              
              {/* Add New Note */}
              <div className="space-y-4 pt-4">
                <h4 className="font-semibold">Add New Note</h4>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter medical notes, observations, or treatment updates..."
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddNote} variant="medical">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-accent rounded-lg">
                  <Heart className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="text-lg font-semibold">{patient.vitals.bloodPressure}</p>
                </div>
                <div className="text-center p-4 bg-accent rounded-lg">
                  <Activity className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="text-lg font-semibold">{patient.vitals.heartRate}</p>
                </div>
                <div className="text-center p-4 bg-accent rounded-lg">
                  <div className="h-6 w-6 bg-primary rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="text-lg font-semibold">{patient.vitals.temperature}</p>
                </div>
                <div className="text-center p-4 bg-accent rounded-lg">
                  <div className="h-6 w-6 bg-primary rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-lg font-semibold">{patient.vitals.weight}</p>
                </div>
                <div className="text-center p-4 bg-accent rounded-lg">
                  <div className="h-6 w-6 bg-primary rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="text-lg font-semibold">{patient.vitals.height}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Last updated: {patient.vitals.lastUpdated}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}