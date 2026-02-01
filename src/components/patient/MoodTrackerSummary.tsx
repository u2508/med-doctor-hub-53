import React, { useEffect, useState } from "react";
import { Brain, TrendingUp, Activity, Calendar, Share2, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MoodEntry {
  id: string;
  mood_level: number;
  stress_level: number | null;
  sleep_hours: number | null;
  activities: string[] | null;
  notes: string | null;
  created_at: string;
}

interface MoodSummaryStats {
  avgMood: number;
  avgStress: number;
  avgSleep: number;
  totalEntries: number;
  moodTrend: "improving" | "stable" | "declining";
  mostCommonActivities: string[];
  recentMoods: { date: string; level: number }[];
}

const MoodTrackerSummary: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    fetchMoodData();
    checkIfShared();
  }, []);

  const fetchMoodData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEntries(data || []);
      if (data && data.length > 0) {
        calculateStats(data);
      }
    } catch (error) {
      console.error("Error fetching mood data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfShared = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("patient_notes")
        .select("id")
        .eq("patient_id", user.id)
        .eq("note_type", "mood_summary")
        .gte("created_at", today)
        .limit(1);

      setHasShared(data && data.length > 0);
    } catch (error) {
      console.error("Error checking shared status:", error);
    }
  };

  const calculateStats = (data: MoodEntry[]) => {
    const totalEntries = data.length;
    
    const avgMood = data.reduce((sum, e) => sum + e.mood_level, 0) / totalEntries;
    const avgStress = data.reduce((sum, e) => sum + (e.stress_level || 5), 0) / totalEntries;
    const avgSleep = data.reduce((sum, e) => sum + (e.sleep_hours || 7), 0) / totalEntries;

    // Calculate mood trend (compare first half vs second half)
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

    // Get most common activities
    const activityCounts: Record<string, number> = {};
    data.forEach(entry => {
      entry.activities?.forEach(activity => {
        activityCounts[activity] = (activityCounts[activity] || 0) + 1;
      });
    });
    const mostCommonActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([activity]) => activity);

    // Recent moods for mini chart
    const recentMoods = data.slice(0, 7).map(e => ({
      date: new Date(e.created_at).toLocaleDateString("en-US", { weekday: "short" }),
      level: e.mood_level
    })).reverse();

    setStats({
      avgMood: Math.round(avgMood * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
      totalEntries,
      moodTrend,
      mostCommonActivities,
      recentMoods
    });
  };

  const generateSummaryText = () => {
    if (!stats) return "";

    const moodDescription = stats.avgMood >= 7 ? "positive" : stats.avgMood >= 5 ? "moderate" : "low";
    const stressDescription = stats.avgStress >= 7 ? "high" : stats.avgStress >= 4 ? "moderate" : "low";
    const sleepDescription = stats.avgSleep >= 7 ? "adequate" : stats.avgSleep >= 5 ? "insufficient" : "poor";

    return `**30-Day Mood Summary**

📊 **Overview:**
- Average Mood: ${stats.avgMood}/10 (${moodDescription})
- Average Stress: ${stats.avgStress}/10 (${stressDescription})
- Average Sleep: ${stats.avgSleep} hours (${sleepDescription})
- Total Entries: ${stats.totalEntries}

📈 **Trend:** Mood is ${stats.moodTrend} over the past 30 days.

🎯 **Common Activities:** ${stats.mostCommonActivities.length > 0 ? stats.mostCommonActivities.join(", ") : "None recorded"}

📅 **Recent 7-Day Moods:** ${stats.recentMoods.map(m => `${m.date}: ${m.level}/10`).join(" | ")}`;
  };

  const shareWithDoctor = async () => {
    if (!stats) return;

    setSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const summaryText = generateSummaryText();

      const { error } = await supabase.from("patient_notes").insert({
        patient_id: user.id,
        note_type: "mood_summary",
        title: `Mood Tracker Summary - ${new Date().toLocaleDateString()}`,
        content: summaryText,
      });

      if (error) throw error;

      setHasShared(true);
      toast.success("Mood summary shared with your doctor!");
    } catch (error) {
      console.error("Error sharing summary:", error);
      toast.error("Failed to share mood summary");
    } finally {
      setSharing(false);
    }
  };

  const getMoodEmoji = (level: number) => {
    if (level >= 8) return "😄";
    if (level >= 6) return "🙂";
    if (level >= 4) return "😐";
    if (level >= 2) return "😔";
    return "😢";
  };

  const getTrendColor = (trend: string) => {
    if (trend === "improving") return "text-green-600";
    if (trend === "declining") return "text-red-600";
    return "text-yellow-600";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return "↑";
    if (trend === "declining") return "↓";
    return "→";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No mood data available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start tracking your mood to see summaries here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Mood Tracker Summary</h2>
        </div>
        <Button
          onClick={shareWithDoctor}
          disabled={sharing || hasShared}
          size="sm"
          variant={hasShared ? "secondary" : "default"}
          className="gap-2"
        >
          {hasShared ? (
            <>
              <Check className="w-4 h-4" />
              Shared Today
            </>
          ) : sharing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sharing...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share with Doctor
            </>
          )}
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Average Mood */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Avg Mood (30 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMoodEmoji(stats.avgMood)}</span>
                <span className="text-2xl font-bold">{stats.avgMood}/10</span>
              </div>
              <Progress value={stats.avgMood * 10} className="mt-2 h-2" />
            </CardContent>
          </Card>

          {/* Stress Level */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Avg Stress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgStress}/10</div>
              <Progress 
                value={stats.avgStress * 10} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          {/* Sleep */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Avg Sleep
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSleep}h</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.avgSleep >= 7 ? "Healthy range" : "Below recommended"}
              </p>
            </CardContent>
          </Card>

          {/* Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Mood Trend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold capitalize ${getTrendColor(stats.moodTrend)}`}>
                {getTrendIcon(stats.moodTrend)} {stats.moodTrend}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on {stats.totalEntries} entries
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Moods Mini Chart */}
      {stats && stats.recentMoods.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end h-20 gap-1">
              {stats.recentMoods.map((mood, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-primary/20 rounded-t"
                    style={{ height: `${mood.level * 10}%` }}
                  >
                    <div 
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: "100%" }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{mood.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Activities */}
      {stats && stats.mostCommonActivities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Most Common Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.mostCommonActivities.map((activity, i) => (
                <Badge key={i} variant="secondary">
                  {activity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default MoodTrackerSummary;
