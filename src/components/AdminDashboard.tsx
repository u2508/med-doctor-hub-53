import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Award,
  FileText,
  Building,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string;
  license_number: string;
  years_experience: number | null;
  hospital_affiliation: string | null;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface AuditLog {
  id: string;
  action: 'approved' | 'rejected';
  admin_full_name: string;
  admin_email: string;
  doctor_full_name: string;
  doctor_email: string;
  specialty: string;
  license_number: string;
  reason: string | null;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [pendingDoctors, setPendingDoctors] = useState<DoctorProfile[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<DoctorProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch pending doctor registrations with profiles
      const { data: pendingData, error: pendingError } = await supabase
        .from('doctor_profiles')
        .select('*, profiles!inner(*)')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Fetch approved doctors with profiles
      const { data: approvedData, error: approvedError } = await supabase
        .from('doctor_profiles')
        .select('*, profiles!inner(*)')
        .eq('is_approved', true)
        .order('approved_at', { ascending: false })
        .limit(50);

      if (approvedError) throw approvedError;

      setPendingDoctors(pendingData || []);
      setApprovedDoctors(approvedData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (doctor: DoctorProfile, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(doctor.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (action === 'approve') {
        // Update doctor profile
        const { error: updateError } = await supabase
          .from('doctor_profiles')
          .update({
            is_approved: true,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', doctor.id);

        if (updateError) throw updateError;

        // Log the action
        await supabase.rpc('log_doctor_approval_action', {
          p_doctor_profile_id: doctor.id,
          p_action: 'approved',
          p_admin_user_id: user.id
        });

        // Notify the doctor
        await supabase.functions.invoke('notify-doctor-approval', {
          body: {
            doctorEmail: doctor.profiles.email,
            doctorName: doctor.profiles.full_name,
            action: 'approved'
          }
        });

        toast({
          title: "Doctor Approved",
          description: `${doctor.profiles.full_name} has been approved and notified`,
        });
      } else {
        // Delete the doctor profile for rejected applications
        const { error: deleteError } = await supabase
          .from('doctor_profiles')
          .delete()
          .eq('id', doctor.id);

        if (deleteError) throw deleteError;

        // Notify the doctor
        await supabase.functions.invoke('notify-doctor-approval', {
          body: {
            doctorEmail: doctor.profiles.email,
            doctorName: doctor.profiles.full_name,
            action: 'rejected',
            reason: rejectionReason
          }
        });

        toast({
          title: "Doctor Rejected",
          description: `${doctor.profiles.full_name}'s application has been rejected`,
        });

        setShowRejectDialog(false);
        setRejectionReason('');
      }

      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} doctor: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPendingDoctors = pendingDoctors.filter(doctor =>
    doctor.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApprovedDoctors = approvedDoctors.filter(doctor =>
    doctor.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-accent/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-accent/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-card">
                <User className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage Doctor Registrations</p>
              </div>
            </div>

            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Pending Approvals</p>
                    <p className="text-3xl font-bold text-yellow-900">{pendingDoctors.length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Approved Doctors</p>
                    <p className="text-3xl font-bold text-green-900">{approvedDoctors.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Actions</p>
                    <p className="text-3xl font-bold text-blue-900">{auditLogs.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search doctors by name, email, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingDoctors.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approved ({approvedDoctors.length})
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Audit Log ({auditLogs.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Doctors Tab */}
            <TabsContent value="pending" className="space-y-4">
              {filteredPendingDoctors.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">No pending doctor registrations to review.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredPendingDoctors.map((doctor) => (
                    <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src="" />
                              <AvatarFallback>
                                {doctor.profiles.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{doctor.profiles.full_name}</h3>
                                <Badge variant="secondary">Pending</Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {doctor.profiles.email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4" />
                                  {doctor.specialty}
                                </div>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  License: {doctor.license_number}
                                </div>
                                {doctor.hospital_affiliation && (
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    {doctor.hospital_affiliation}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Applied: {format(new Date(doctor.created_at), 'MMM dd, yyyy')}
                                </div>
                                {doctor.years_experience && (
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {doctor.years_experience} years experience
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedDoctor(doctor)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Doctor Profile Details</DialogTitle>
                                  <DialogDescription>
                                    Review complete application details before making a decision.
                                  </DialogDescription>
                                </DialogHeader>

                                {selectedDoctor && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Full Name</Label>
                                        <p className="text-sm">{selectedDoctor.profiles.full_name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Email</Label>
                                        <p className="text-sm">{selectedDoctor.profiles.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Specialty</Label>
                                        <p className="text-sm">{selectedDoctor.specialty}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">License Number</Label>
                                        <p className="text-sm">{selectedDoctor.license_number}</p>
                                      </div>
                                      {selectedDoctor.years_experience && (
                                        <div>
                                          <Label className="text-sm font-medium">Years Experience</Label>
                                          <p className="text-sm">{selectedDoctor.years_experience}</p>
                                        </div>
                                      )}
                                      {selectedDoctor.hospital_affiliation && (
                                        <div>
                                          <Label className="text-sm font-medium">Hospital Affiliation</Label>
                                          <p className="text-sm">{selectedDoctor.hospital_affiliation}</p>
                                        </div>
                                      )}
                                      {selectedDoctor.profiles.phone && (
                                        <div>
                                          <Label className="text-sm font-medium">Phone</Label>
                                          <p className="text-sm">{selectedDoctor.profiles.phone}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              onClick={() => handleApproval(doctor, 'approve')}
                              disabled={actionLoading === doctor.id}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              {actionLoading === doctor.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </Button>

                            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Doctor Application</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting this application. This will be communicated to the doctor.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                                    <Textarea
                                      id="rejection-reason"
                                      placeholder="Please explain why this application is being rejected..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      rows={4}
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowRejectDialog(false);
                                        setRejectionReason('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleApproval(doctor, 'reject')}
                                      disabled={actionLoading === doctor.id || !rejectionReason.trim()}
                                    >
                                      {actionLoading === doctor.id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        'Reject Application'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Approved Doctors Tab */}
            <TabsContent value="approved" className="space-y-4">
              {filteredApprovedDoctors.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Approved Doctors</h3>
                    <p className="text-muted-foreground">Approved doctors will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredApprovedDoctors.map((doctor) => (
                    <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src="" />
                              <AvatarFallback>
                                {doctor.profiles.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <h3 className="font-semibold">{doctor.profiles.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{doctor.profiles.email}</p>
                              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(doctor.approved_at!), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit" className="space-y-4">
              {auditLogs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Audit Records</h3>
                    <p className="text-muted-foreground">Audit logs will appear here as actions are taken.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {log.action === 'approved' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className="font-medium capitalize">{log.action}</span>
                              <Badge variant={log.action === 'approved' ? 'default' : 'destructive'}>
                                {log.action}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Doctor:</span> {log.doctor_full_name} ({log.doctor_email})
                              </div>
                              <div>
                                <span className="font-medium">Admin:</span> {log.admin_full_name} ({log.admin_email})
                              </div>
                              <div>
                                <span className="font-medium">Specialty:</span> {log.specialty}
                              </div>
                              <div>
                                <span className="font-medium">License:</span> {log.license_number}
                              </div>
                              {log.reason && (
                                <div className="md:col-span-2">
                                  <span className="font-medium">Reason:</span> {log.reason}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
