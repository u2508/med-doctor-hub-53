import { Calendar, User, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  appointmentDate: string;
  status: "Ongoing" | "Recovered" | "Critical" | "Scheduled";
  lastVisit: string;
  diagnosis?: string;
}

interface PatientCardProps {
  patient: Patient;
  onViewDetails: (patientId: string) => void;
}

const statusColors = {
  Ongoing: "bg-warning text-warning-foreground",
  Recovered: "bg-success text-success-foreground", 
  Critical: "bg-destructive text-destructive-foreground",
  Scheduled: "bg-primary text-primary-foreground"
};

export function PatientCard({ patient, onViewDetails }: PatientCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-light p-2 rounded-full">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{patient.name}</h3>
              <p className="text-sm text-muted-foreground">
                {patient.age} years • {patient.gender}
              </p>
            </div>
          </div>
          <Badge className={statusColors[patient.status]}>
            {patient.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Appointment: {patient.appointmentDate}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last Visit: {patient.lastVisit}</span>
        </div>
        
        {patient.diagnosis && (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="text-foreground">{patient.diagnosis}</span>
          </div>
        )}
        
        <Button 
          onClick={() => onViewDetails(patient.id)}
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}