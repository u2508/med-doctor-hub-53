import React, { useEffect, useState } from "react";
import { Plus, Loader2, MessageSquare, Send, User, Stethoscope, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PatientNote {
  id: string;
  note_type: string;
  title: string;
  content: string;
  created_at: string;
  doctor_id: string | null;
  appointment_id: string | null;
  patient_id: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  patient_id: string;
  patient_name?: string;
}

interface NotesGroup {
  appointment: Appointment;
  notes: PatientNote[];
}

interface DoctorNotesTabProps {
  patientId: string;
  appointmentId?: string;
  patientName?: string;
}

const DoctorNotesTab: React.FC<DoctorNotesTabProps> = ({
  patientId,
  appointmentId,
  patientName,
}) => {
  const [notesGroups, setNotesGroups] = useState<NotesGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(appointmentId || "");
  const [isSaving, setIsSaving] = useState(false);
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch appointments for this patient with this doctor (exclude cancelled)
      const { data: appointmentsData, error: aptError } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .eq("doctor_id", user.id)
        .neq("status", "cancelled")
        .order("appointment_date", { ascending: false });

      if (aptError) throw aptError;

      // Fetch all notes for this patient
      const { data: notesData, error: notesError } = await supabase
        .from("patient_notes")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: true }) as { data: PatientNote[] | null; error: any };

      if (notesError) throw notesError;

      // Group notes by appointment
      const groups: NotesGroup[] = (appointmentsData || []).map(apt => ({
        appointment: {
          ...apt,
          patient_name: patientName,
        } as Appointment,
        notes: (notesData || []).filter(n => n.appointment_id === apt.id),
      }));

      setNotesGroups(groups);

      // Set default selected appointment
      if (!selectedAppointmentId && appointmentsData && appointmentsData.length > 0) {
        const confirmedApt = appointmentsData.find(a => a.status === "confirmed" || a.status === "completed");
        setSelectedAppointmentId(confirmedApt?.id || appointmentsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    if (!selectedAppointmentId) {
      toast.error("Please select an appointment");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("patient_notes").insert({
        patient_id: patientId,
        doctor_id: user.id,
        appointment_id: selectedAppointmentId,
        note_type: "doctor_note",
        title: newNoteTitle,
        content: newNoteContent,
      });

      if (error) throw error;

      toast.success("Note added successfully");
      setNewNoteTitle("");
      setNewNoteContent("");
      fetchData();
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async (aptId: string) => {
    const message = newMessage[aptId]?.trim();
    if (!message) return;

    setSending(prev => ({ ...prev, [aptId]: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("patient_notes").insert({
        patient_id: patientId,
        doctor_id: user.id,
        appointment_id: aptId,
        note_type: "doctor_note",
        title: "Doctor Note",
        content: message,
      });

      if (error) throw error;

      toast.success("Message sent");
      setNewMessage(prev => ({ ...prev, [aptId]: "" }));
      fetchData();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(prev => ({ ...prev, [aptId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeAppointments = notesGroups
    .filter(g => g.appointment.status === "confirmed" || g.appointment.status === "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Clinical Note Form */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Clinical Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeAppointments.length > 1 && (
            <Select value={selectedAppointmentId} onValueChange={setSelectedAppointmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select appointment" />
              </SelectTrigger>
              <SelectContent>
                {activeAppointments.map(({ appointment }) => (
                  <SelectItem key={appointment.id} value={appointment.id}>
                    {formatDate(appointment.appointment_date)} - {appointment.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            placeholder="Note title (e.g., Session Summary, Treatment Plan)"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
          />
          <Textarea
            placeholder="Enter your clinical observations, treatment notes, or recommendations..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={4}
          />
          <Button onClick={handleAddNote} disabled={isSaving} className="gap-2">
            <Plus className="w-4 h-4" />
            {isSaving ? "Saving..." : "Add Note"}
          </Button>
        </CardContent>
      </Card>

      {/* Notes Conversation View */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Conversation History</h3>
        </div>

        {notesGroups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                No notes available for this patient
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notesGroups.map(({ appointment, notes }) => {
              const canMessage = appointment.status === "confirmed" || appointment.status === "completed";
              
              return (
                <Card key={appointment.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatDate(appointment.appointment_date)}
                        </span>
                      </div>
                      <Badge 
                        variant={appointment.status === "completed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <ScrollArea className="h-auto max-h-64">
                      <div className="p-4 space-y-3">
                        {notes.length === 0 ? (
                          <p className="text-center text-muted-foreground text-sm py-4">
                            No messages yet
                          </p>
                        ) : (
                          notes.map((note) => {
                            const isFromDoctor = note.doctor_id !== null;

                            return (
                              <div
                                key={note.id}
                                className={`flex ${isFromDoctor ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                    isFromDoctor
                                      ? "bg-primary text-primary-foreground rounded-br-md"
                                      : "bg-muted rounded-bl-md"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {isFromDoctor ? (
                                      <Stethoscope className="w-3 h-3" />
                                    ) : (
                                      <User className="w-3 h-3" />
                                    )}
                                    <span className="text-xs font-medium">
                                      {isFromDoctor ? "You" : "Patient"}
                                    </span>
                                  </div>
                                  {note.title && note.title !== "Doctor Note" && note.title !== "Patient Note" && (
                                    <p className="text-xs font-semibold mb-1">{note.title}</p>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                  <p className={`text-[10px] mt-1 ${
                                    isFromDoctor ? "text-primary-foreground/70" : "text-muted-foreground"
                                  }`}>
                                    {formatTime(note.created_at)}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>

                    {/* Quick message input */}
                    {canMessage && (
                      <div className="border-t p-3 bg-muted/30">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Quick message..."
                            value={newMessage[appointment.id] || ""}
                            onChange={(e) => setNewMessage(prev => ({ 
                              ...prev, 
                              [appointment.id]: e.target.value 
                            }))}
                            rows={1}
                            className="min-h-[40px] resize-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(appointment.id);
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            onClick={() => handleSendMessage(appointment.id)}
                            disabled={sending[appointment.id] || !newMessage[appointment.id]?.trim()}
                          >
                            {sending[appointment.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorNotesTab;
