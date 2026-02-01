import React, { useEffect, useState } from "react";
import { MessageSquare, User, Stethoscope, Calendar, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  doctor_id: string;
  patient_id: string;
  doctor_name?: string;
  patient_name?: string;
}

interface AppointmentNotesListProps {
  userId: string;
  userRole: "patient" | "doctor";
  appointments?: Appointment[];
}

interface NotesGroup {
  appointment: Appointment;
  notes: PatientNote[];
}

const AppointmentNotesList: React.FC<AppointmentNotesListProps> = ({
  userId,
  userRole,
  appointments: propAppointments,
}) => {
  const [notesGroups, setNotesGroups] = useState<NotesGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [userId, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments (exclude cancelled)
      let appointmentsQuery = supabase
        .from("appointments")
        .select("*")
        .neq("status", "cancelled")
        .order("appointment_date", { ascending: false });

      if (userRole === "patient") {
        appointmentsQuery = appointmentsQuery.eq("patient_id", userId);
      } else {
        appointmentsQuery = appointmentsQuery.eq("doctor_id", userId);
      }

      const { data: appointmentsData, error: aptError } = await appointmentsQuery;
      if (aptError) throw aptError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setNotesGroups([]);
        setLoading(false);
        return;
      }

      // Fetch profile names
      const otherUserIds = userRole === "patient" 
        ? appointmentsData.map(a => a.doctor_id)
        : appointmentsData.map(a => a.patient_id);

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", otherUserIds);

      const appointmentsWithNames = appointmentsData.map(apt => ({
        ...apt,
        doctor_name: userRole === "patient" 
          ? profilesData?.find(p => p.user_id === apt.doctor_id)?.full_name
          : undefined,
        patient_name: userRole === "doctor"
          ? profilesData?.find(p => p.user_id === apt.patient_id)?.full_name
          : undefined,
      }));

      // Fetch notes for all appointments
      const appointmentIds = appointmentsData.map(a => a.id);
      const patientIds = userRole === "patient" ? [userId] : appointmentsData.map(a => a.patient_id);

      const { data: notesData, error: notesError } = await supabase
        .from("patient_notes")
        .select("*")
        .in("patient_id", patientIds)
        .order("created_at", { ascending: true }) as { data: PatientNote[] | null; error: any };

      if (notesError) throw notesError;

      // Group notes by appointment
      const groups: NotesGroup[] = appointmentsWithNames.map(apt => ({
        appointment: apt as Appointment,
        notes: (notesData || []).filter(n => n.appointment_id === apt.id),
      })).filter(g => g.notes.length > 0 || g.appointment.status === "confirmed" || g.appointment.status === "completed");

      setNotesGroups(groups);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (appointmentId: string, patientId: string) => {
    const message = newMessage[appointmentId]?.trim();
    if (!message) return;

    setSending(prev => ({ ...prev, [appointmentId]: true }));
    
    try {
      const noteType = userRole === "doctor" ? "doctor_note" : "patient_summary";
      
      const insertData: any = {
        patient_id: patientId,
        appointment_id: appointmentId,
        note_type: noteType,
        title: userRole === "doctor" ? "Doctor Note" : "Patient Note",
        content: message,
      };

      if (userRole === "doctor") {
        insertData.doctor_id = userId;
      }

      const { error } = await supabase.from("patient_notes").insert(insertData);

      if (error) throw error;

      toast.success("Message sent");
      setNewMessage(prev => ({ ...prev, [appointmentId]: "" }));
      fetchData();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(prev => ({ ...prev, [appointmentId]: false }));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notesGroups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No appointment notes yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Notes will appear here after your appointments
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {notesGroups.map(({ appointment, notes }) => {
        const otherPartyName = userRole === "patient" 
          ? appointment.doctor_name 
          : appointment.patient_name;
        const canSendMessage = appointment.status === "confirmed" || appointment.status === "completed";

        return (
          <Card key={appointment.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {userRole === "patient" ? (
                      <Stethoscope className="w-5 h-5 text-primary" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {userRole === "patient" ? `Dr. ${otherPartyName}` : otherPartyName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(appointment.appointment_date)}
                    </div>
                  </div>
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
              {/* Messages area */}
              <ScrollArea className="h-auto max-h-80">
                <div className="p-4 space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No messages yet. Start a conversation.
                    </p>
                  ) : (
                    notes.map((note) => {
                      const isFromDoctor = note.doctor_id !== null;
                      const isOwnMessage = userRole === "doctor" ? isFromDoctor : !isFromDoctor;

                      return (
                        <div
                          key={note.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                              isOwnMessage
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
                                {isFromDoctor ? "Doctor" : "Patient"}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <p className={`text-[10px] mt-1 ${
                              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
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

              {/* Message input */}
              {canSendMessage && (
                <div className="border-t p-3 bg-muted/30">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
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
                          handleSendMessage(appointment.id, appointment.patient_id);
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={() => handleSendMessage(appointment.id, appointment.patient_id)}
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
  );
};

export default AppointmentNotesList;
