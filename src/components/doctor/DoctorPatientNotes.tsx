import React, { useEffect, useState } from "react";
import { Brain, MessageSquare, Calendar, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatSummary {
  id: string;
  summary_date: string;
  summary_text: string;
  mood_indicators: string[] | null;
  key_concerns: string[] | null;
  created_at: string;
}

interface DoctorPatientNotesProps {
  patientId: string;
  appointmentId?: string;
}

const DoctorPatientNotes: React.FC<DoctorPatientNotesProps> = ({
  patientId,
  appointmentId,
}) => {
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSummaries();
  }, [patientId]);

  const fetchSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_summaries")
        .select("*")
        .eq("patient_id", patientId)
        .order("summary_date", { ascending: false }) as { data: ChatSummary[] | null; error: any };

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("patient_notes").insert({
        patient_id: patientId,
        doctor_id: user.id,
        appointment_id: appointmentId,
        note_type: "doctor_note",
        title: newNoteTitle,
        content: newNoteContent,
      });

      if (error) throw error;

      toast.success("Note added successfully");
      setNewNoteTitle("");
      setNewNoteContent("");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsSaving(false);
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Doctor Note */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Clinical Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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

      {/* AI Chat Summaries */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Patient's MentiBot Chat Summaries</h3>
        </div>

        {summaries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                No chat summaries available for this patient
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Summaries are generated from the patient's MentiBot conversations
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <Card key={summary.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      {formatDate(summary.summary_date)}
                    </CardTitle>
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
      </div>
    </div>
  );
};

export default DoctorPatientNotes;
