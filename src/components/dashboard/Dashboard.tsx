import { useState } from "react";
import { Search, Filter, Users, Calendar, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientCard, type Patient } from "./PatientCard";

interface DashboardProps {
  onViewPatient: (patientId: string) => void;
}

// Mock data for demonstration
const mockPatients: Patient[] = [
  {
    id: "1",
    name: "John Doe",
    age: 45,
    gender: "Male",
    appointmentDate: "2024-01-15",
    status: "Ongoing",
    lastVisit: "2024-01-10",
    diagnosis: "Hypertension"
  },
  {
    id: "2", 
    name: "Sarah Wilson",
    age: 32,
    gender: "Female",
    appointmentDate: "2024-01-16",
    status: "Recovered",
    lastVisit: "2024-01-12",
    diagnosis: "Common Cold"
  },
  {
    id: "3",
    name: "Michael Brown",
    age: 58,
    gender: "Male", 
    appointmentDate: "2024-01-17",
    status: "Critical",
    lastVisit: "2024-01-14",
    diagnosis: "Chest Pain"
  },
  {
    id: "4",
    name: "Emma Davis",
    age: 28,
    gender: "Female",
    appointmentDate: "2024-01-18", 
    status: "Scheduled",
    lastVisit: "2024-01-08",
    diagnosis: "Routine Checkup"
  }
];

export function Dashboard({ onViewPatient }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockPatients.length,
    ongoing: mockPatients.filter(p => p.status === "Ongoing").length,
    critical: mockPatients.filter(p => p.status === "Critical").length,
    recovered: mockPatients.filter(p => p.status === "Recovered").length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Cases</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.ongoing}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovered</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.recovered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Recovered">Recovered</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Patient Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredPatients.map((patient) => (
              <PatientCard 
                key={patient.id} 
                patient={patient} 
                onViewDetails={onViewPatient}
              />
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No patients found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}