import React, { useEffect, useState } from "react";
import { FileText, Brain, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface ChatSummary {
  id: string;
  summary_date: string;
  summary_text: string;
  mood_indicators: string[] | null;
  key_concerns: string[] | null;
  created_at: string;
}

interface PatientNote {
  id: string;
  note_type: string;
  title: string;
  content: string;
  created_at: string;
  doctor_id: string | null;
  appointment_id: string | null;
  doctor_name?: string;
}

const PatientNotesTab: React.FC = () => {
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch chat summaries
      const { data: summariesData } = await supabase
        .from("chat_summaries")
        .select("*")
        .eq("patient_id", user.id)
        .order("summary_date", { ascending: false }) as { data: ChatSummary[] | null };

      // Fetch patient notes
      const { data: notesData } = await supabase
        .from("patient_notes")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false }) as { data: PatientNote[] | null };

      // Get doctor names for notes
      if (notesData) {
        const doctorIds = notesData
          .filter(n => n.doctor_id)
          .map(n => n.doctor_id) as string[];
        
        if (doctorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", doctorIds);

          const notesWithDoctors = notesData.map(note => ({
            ...note,
            doctor_name: profiles?.find(p => p.user_id === note.doctor_id)?.full_name
          }));
          setNotes(notesWithDoctors);
        } else {
          setNotes(notesData);
        }
      }

      setSummaries(summariesData || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Chat Summaries */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Chat Summaries</h2>
        </div>
        
        {summaries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No chat summaries yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Chat with MentiBot and generate daily summaries
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {summaries.map((summary) => (
              <Card key={summary.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-base">
                        {formatDate(summary.summary_date)}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {summary.summary_text}
                  </p>
                  
                  {summary.mood_indicators && summary.mood_indicators.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Mood Indicators
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {summary.mood_indicators.map((mood, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {mood}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {summary.key_concerns && summary.key_concerns.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Key Concerns
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {summary.key_concerns.map((concern, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {concern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Doctor Notes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Doctor Notes & Reports</h2>
        </div>
        
        {notes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No doctor notes yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Notes from your appointments will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{note.title}</CardTitle>
                      {note.doctor_name && (
                        <CardDescription>
                          Dr. {note.doctor_name} • {formatDate(note.created_at)}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={note.note_type === "doctor_note" ? "default" : "secondary"}
                    >
                      {note.note_type === "doctor_note" ? "Doctor Note" : note.note_type === "report" ? "Report" : "Summary"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientNotesTab;
