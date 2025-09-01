import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Brain, Calendar, TrendingUp, Download, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MoodTracker = () => {
  const navigate = useNavigate();
  const [moodEntries, setMoodEntries] = useState([]);
  const [currentMood, setCurrentMood] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: '',
    energyLevel: 5,
    activities: [],
    notes: '',
    location: '',
    weather: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'chart'

  const { toast } = useToast();

  // Load mood entries from Supabase on component mount
  useEffect(() => {
    loadMoodEntries();
  }, []);

  const loadMoodEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to view your mood entries.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match component structure
      const transformedEntries = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.created_at).toISOString().split('T')[0],
        mood: getMoodValueFromLevel(entry.mood_level),
        energyLevel: entry.sleep_hours ? Math.round(entry.sleep_hours * 10 / 12) : 5,
        activities: entry.activities || [],
        notes: entry.notes || '',
        location: '',
        weather: ''
      }));

      setMoodEntries(transformedEntries);
    } catch (error) {
      console.error('Error loading mood entries:', error);
      toast({
        title: "Load Error", 
        description: "Failed to load mood entries. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMoodValueFromLevel = (level) => {
    const moodMap = {
      1: 'sad', 2: 'sad', 3: 'anxious', 4: 'tired', 
      5: 'neutral', 6: 'calm', 7: 'happy', 8: 'happy', 
      9: 'excited', 10: 'excited'
    };
    return moodMap[level] || 'neutral';
  };

  const getMoodLevelFromValue = (mood) => {
    const levelMap = {
      'sad': 2, 'angry': 3, 'anxious': 4, 'tired': 4,
      'neutral': 5, 'calm': 6, 'happy': 7, 'excited': 9
    };
    return levelMap[mood] || 5;
  };

  const handleMoodChange = (mood) => {
    setCurrentMood({ ...currentMood, mood });
  };

  const handleEnergyChange = (level) => {
    setCurrentMood({ ...currentMood, energyLevel: level });
  };

  const handleActivityChange = (activity) => {
    if (currentMood.activities.includes(activity)) {
      setCurrentMood({
        ...currentMood,
        activities: currentMood.activities.filter(a => a !== activity)
      });
    } else {
      setCurrentMood({
        ...currentMood,
        activities: [...currentMood.activities, activity]
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMood({ ...currentMood, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMood.mood) {
      toast({
        title: "Validation Error",
        description: "Please select a mood before saving.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error", 
          description: "Please sign in to save mood entries.",
          variant: "destructive",
        });
        return;
      }

      const moodEntry = {
        user_id: user.id,
        mood_level: getMoodLevelFromValue(currentMood.mood),
        sleep_hours: (currentMood.energyLevel * 12) / 10, // Convert energy level to sleep hours approximation
        stress_level: 10 - currentMood.energyLevel, // Inverse of energy level
        activities: currentMood.activities,
        notes: currentMood.notes
      };

      const { data, error } = await supabase
        .from('mood_entries')
        .insert([moodEntry])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newEntry = {
        id: data.id,
        date: new Date().toISOString().split('T')[0],
        ...currentMood
      };
      
      setMoodEntries([newEntry, ...moodEntries]);
      setCurrentMood({
        date: new Date().toISOString().split('T')[0],
        mood: '',
        energyLevel: 5,
        activities: [],
        notes: '',
        location: '',
        weather: ''
      });
      setShowForm(false);

      toast({
        title: "Mood Saved",
        description: "Your mood entry has been saved successfully!",
      });
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast({
        title: "Save Error",
        description: "Failed to save mood entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteEntry = async (id) => {
    try {
      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMoodEntries(moodEntries.filter(entry => entry.id !== id));
      
      toast({
        title: "Entry Deleted",
        description: "Mood entry has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete mood entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(moodEntries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'mood_data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const moodOptions = [
    { emoji: '😄', label: 'Happy', value: 'happy', color: 'bg-yellow-100 text-yellow-800' },
    { emoji: '😐', label: 'Neutral', value: 'neutral', color: 'bg-gray-100 text-gray-800' },
    { emoji: '😔', label: 'Sad', value: 'sad', color: 'bg-blue-100 text-blue-800' },
    { emoji: '😠', label: 'Angry', value: 'angry', color: 'bg-red-100 text-red-800' },
    { emoji: '😰', label: 'Anxious', value: 'anxious', color: 'bg-purple-100 text-purple-800' },
    { emoji: '😴', label: 'Tired', value: 'tired', color: 'bg-indigo-100 text-indigo-800' },
    { emoji: '😌', label: 'Calm', value: 'calm', color: 'bg-green-100 text-green-800' },
    { emoji: '🤩', label: 'Excited', value: 'excited', color: 'bg-pink-100 text-pink-800' }
  ];

  const activities = [
    'Work', 'Exercise', 'Reading', 'Socializing', 
    'Meditation', 'Hobby', 'Sleep', 'Nature Walk',
    'Music', 'Cooking', 'Shopping', 'Travel'
  ];

  // Calculate statistics
  const totalEntries = moodEntries.length;
  const averageEnergy = moodEntries.length > 0 
    ? (moodEntries.reduce((sum, entry) => sum + entry.energyLevel, 0) / totalEntries).toFixed(1)
    : 0;
  
  const mostCommonMood = moodEntries.length > 0 
    ? Object.entries(
        moodEntries.reduce((acc, entry) => {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    : 'N/A';

  const currentStreak = moodEntries.length > 0 ? 5 : 0;

  const StatsCard = ({ icon, title, value, color }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-card rounded-xl border border-border p-6"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-primary/10">
          <div className="text-primary">{icon}</div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  const MoodEntryCard = ({ entry }) => {
    const moodOption = moodOptions.find(m => m.value === entry.mood);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{moodOption?.emoji}</span>
              <span className="font-semibold text-card-foreground capitalize">{entry.mood}</span>
            </div>
            <p className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => deleteEntry(entry.id)}
            className="text-destructive hover:text-destructive/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-3">
          <div className="flex items-center mb-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${entry.energyLevel * 10}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-muted-foreground">{entry.energyLevel}/10</span>
          </div>
        </div>

        {entry.activities.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {entry.activities.map((activity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs border border-border"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        )}

        {entry.notes && (
          <p className="text-sm text-muted-foreground italic">{entry.notes}</p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background" style={{ background: 'var(--gradient-subtle)' }}>
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between py-8">
            <div>
              <h1 className="text-4xl font-bold text-gradient font-display">
                Mood Tracker
              </h1>
              <p className="text-muted-foreground mt-3 text-lg font-medium">Track your emotional well-being journey</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setView(view === 'list' ? 'chart' : 'list')}
                className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-medium"
              >
                {view === 'list' ? 'View Chart' : 'View List'}
              </button>
              <button
                onClick={() => navigate('/user-dashboard')}
                className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl hover:bg-secondary/80 transition-all duration-300 font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 sm:px-8 lg:px-10">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatsCard 
            icon={<Calendar className="w-6 h-6" />}
            title="Total Entries" 
            value={totalEntries}
          />
          <StatsCard 
            icon={<Brain className="w-6 h-6" />}
            title="Most Common Mood" 
            value={mostCommonMood}
          />
          <StatsCard 
            icon={<TrendingUp className="w-6 h-6" />}
            title="Current Streak" 
            value={`${currentStreak} days`}
          />
          <StatsCard 
            icon={<Heart className="w-6 h-6" />}
            title="Avg Energy Level" 
            value={averageEnergy}
          />
        </div>

        {/* Mood Entry Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated rounded-2xl p-8 mb-12"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-card-foreground font-display">Record Your Mood</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-medium"
            >
              {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Mood Selection */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-3">How are you feeling today?</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {moodOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleMoodChange(option.value)}
                      className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all duration-200 border ${
                        currentMood.mood === option.value
                          ? 'border-primary bg-accent ring-2 ring-primary ring-offset-2'
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <span className="text-2xl mb-1">{option.emoji}</span>
                      <span className="text-xs font-medium text-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-3">
                  Energy Level: {currentMood.energyLevel}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentMood.energyLevel}
                  onChange={(e) => handleEnergyChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Activities */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-3">Activities</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {activities.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => handleActivityChange(activity)}
                      className={`py-2 px-3 rounded-lg text-sm transition-all duration-200 border ${
                        currentMood.activities.includes(activity)
                          ? 'bg-accent text-accent-foreground border-primary ring-2 ring-primary'
                          : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-3">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={currentMood.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  placeholder="What's on your mind today?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-primary text-primary-foreground py-4 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 text-lg"
              >
                Save Mood Entry
              </button>
            </form>
          )}
        </motion.div>

        {/* Mood Entries or Chart */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-card-foreground">Mood History</h2>
            <button
              onClick={exportData}
              className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition border border-border"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>

          {view === 'list' ? (
            <div className="space-y-4">
              {moodEntries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-card-foreground mb-2">No mood entries yet</h3>
                  <p className="text-muted-foreground mb-4">Get started by recording your first mood entry</p>
                </div>
              ) : (
                moodEntries.map((entry) => (
                  <MoodEntryCard key={entry.id} entry={entry} />
                ))
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Mood Trends</h3>
              {moodEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No data to display. Record some mood entries to see your trends.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Simple chart visualization */}
                  <div className="h-64 bg-accent rounded-lg flex items-end justify-center p-4">
                    <div className="flex space-x-2">
                      {moodEntries.slice(0, 7).reverse().map((entry, index) => {
                        const moodOption = moodOptions.find(m => m.value === entry.mood);
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div 
                              className="w-8 rounded-t bg-primary/80 flex items-center justify-center"
                              style={{ height: `${entry.energyLevel * 10}px` }}
                            >
                              <span className="text-sm">{moodOption?.emoji}</span>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                              {new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MoodTracker;
