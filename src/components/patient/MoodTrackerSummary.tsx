import React, { useEffect, useState } from "react";
import { Brain, TrendingUp, Activity, Calendar, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    fetchMoodData();
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

  const calculateStats = (data: MoodEntry[]) => {
    const totalEntries = data.length;
    
    const avgMood = data.reduce((sum, e) => sum + e.mood_level, 0) / totalEntries;
    const avgStress = data.reduce((sum, e) => sum + (e.stress_level || 5), 0) / totalEntries;
    const avgSleep = data.reduce((sum, e) => sum + (e.sleep_hours || 7), 0) / totalEntries;

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

  const getMoodEmoji = (level: number) => {
    if (level >= 8) return "😄";
    if (level >= 6) return "🙂";
    if (level >= 4) return "😐";
    if (level >= 2) return "😔";
    return "😢";
  };

  const getTrendColor = (trend: string) => {
    if (trend === "improving") return "text-primary";
    if (trend === "declining") return "text-destructive";
    return "text-muted-foreground";
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
        <Badge variant="secondary" className="gap-1">
          <Info className="w-3 h-3" />
          Shared with your doctor
        </Badge>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Avg Stress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgStress}/10</div>
              <Progress value={stats.avgStress * 10} className="mt-2 h-2" />
            </CardContent>
          </Card>

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
