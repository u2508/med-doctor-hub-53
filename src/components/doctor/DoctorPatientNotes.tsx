import React, { useEffect, useState } from "react";
import { Brain, MessageSquare, Calendar, Loader2, Activity, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface ChatSummary {
  id: string;
  summary_date: string;
  summary_text: string;
  mood_indicators: string[] | null;
  key_concerns: string[] | null;
  created_at: string;
}

interface MoodEntry {
  id: string;
  mood_level: number;
  stress_level: number | null;
  sleep_hours: number | null;
  activities: string[] | null;
  notes: string | null;
  created_at: string;
}

interface MoodStats {
  avgMood: number;
  avgStress: number;
  avgSleep: number;
  totalEntries: number;
  moodTrend: "improving" | "stable" | "declining";
  recentMoods: { date: string; level: number }[];
}

interface DoctorPatientNotesProps {
  patientId: string;
  appointmentId?: string;
}

const DoctorPatientNotes: React.FC<DoctorPatientNotesProps> = ({
  patientId,
}) => {
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [moodStats, setMoodStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      // Fetch chat summaries
      const { data: chatData, error: chatError } = await supabase
        .from("chat_summaries")
        .select("*")
        .eq("patient_id", patientId)
        .order("summary_date", { ascending: false }) as { data: ChatSummary[] | null; error: any };

      if (chatError) throw chatError;
      setSummaries(chatData || []);

      // Fetch mood entries directly
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: moodData, error: moodError } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", patientId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false }) as { data: MoodEntry[] | null; error: any };

      if (moodError) {
        console.error("Error fetching mood entries:", moodError);
      } else if (moodData && moodData.length > 0) {
        setMoodEntries(moodData);
        calculateMoodStats(moodData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMoodStats = (data: MoodEntry[]) => {
    const totalEntries = data.length;
    const avgMood = data.reduce((sum, e) => sum + e.mood_level, 0) / totalEntries;
    const avgStress = data.reduce((sum, e) => sum + (e.stress_level || 5), 0) / totalEntries;
    const avgSleep = data.reduce((sum, e) => sum + (e.sleep_hours || 7), 0) / totalEntries;

    // Calculate trend
    const halfIndex = Math.floor(totalEntries / 2);
    const recentHalf = data.slice(0, halfIndex);
    const olderHalf = data.slice(halfIndex);
    
    const recentAvg = recentHalf.length > 0 
      ? recentHalf.reduce((sum, e) => sum + e.mood_level, 0) / recentHalf.length 
      : avgMood;
    const olderAvg = olderHalf.length > 0 
      ? olderHalf.reduce((sum, e) => sum + e.mood_level, 0) / olderHalf.length 
      : avgMood;

    let moodTrend: "improving" | "stable" | "declining" = "stable";
    if (recentAvg - olderAvg > 0.5) moodTrend = "improving";
    else if (olderAvg - recentAvg > 0.5) moodTrend = "declining";

    const recentMoods = data.slice(0, 7).map(e => ({
      date: new Date(e.created_at).toLocaleDateString("en-US", { weekday: "short" }),
      level: e.mood_level
    })).reverse();

    setMoodStats({
      avgMood: Math.round(avgMood * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
      totalEntries,
      moodTrend,
      recentMoods
    });
  };

  const getMoodEmoji = (level: number) => {
    if (level >= 8) return "😄";
    if (level >= 6) return "🙂";
    if (level >= 4) return "😐";
    if (level >= 2) return "😔";
    return "😢";
  };

  const getTrendInfo = (trend: string) => {
    if (trend === "improving") return { icon: "↑", color: "text-primary" };
    if (trend === "declining") return { icon: "↓", color: "text-destructive" };
    return { icon: "→", color: "text-muted-foreground" };
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
      {/* Patient Mood Tracker Data */}
      {moodStats && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Patient's Mood Tracker Data</h3>
            <Badge variant="secondary" className="text-xs">Last 30 days</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-4 mb-4">
            <Card className="border-primary/20">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getMoodEmoji(moodStats.avgMood)}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Mood</p>
                    <p className="text-lg font-bold">{moodStats.avgMood}/10</p>
                  </div>
                </div>
                <Progress value={moodStats.avgMood * 10} className="mt-2 h-1.5" />
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Avg Stress</p>
                <p className="text-lg font-bold">{moodStats.avgStress}/10</p>
                <Progress value={moodStats.avgStress * 10} className="mt-2 h-1.5" />
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Avg Sleep</p>
                <p className="text-lg font-bold">{moodStats.avgSleep}h</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {moodStats.avgSleep >= 7 ? "Healthy" : "Below recommended"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Trend</p>
                <p className={`text-lg font-bold capitalize ${getTrendInfo(moodStats.moodTrend).color}`}>
                  {getTrendInfo(moodStats.moodTrend).icon} {moodStats.moodTrend}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {moodStats.totalEntries} entries
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Mini mood chart */}
          {moodStats.recentMoods.length > 0 && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-xs text-muted-foreground">Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex justify-between items-end h-16 gap-1">
                  {moodStats.recentMoods.map((mood, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary rounded-t transition-all"
                        style={{ height: `${mood.level * 10}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground">{mood.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {moodEntries.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No mood data available</p>
          </CardContent>
        </Card>
      )}

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
