import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'mood' | 'appointment' | 'chat' | 'meditation';
  status?: 'completed' | 'scheduled' | 'active';
}

export const useUserActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity();
    
    // Set up real-time subscriptions for activity updates
    const moodChannel = supabase
      .channel('mood_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'mood_entries' },
        () => fetchUserActivity()
      )
      .subscribe();

    const appointmentChannel = supabase
      .channel('appointment_changes') 
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => fetchUserActivity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(moodChannel);
      supabase.removeChannel(appointmentChannel);
    };
  }, []);

  const fetchUserActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const activities: ActivityItem[] = [];

      // Fetch recent mood entries
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (moodEntries) {
        moodEntries.forEach(entry => {
          activities.push({
            id: `mood-${entry.id}`,
            title: 'Mood Entry Recorded',
            description: `You recorded your mood with level ${entry.mood_level}/10`,
            timestamp: new Date(entry.created_at),
            type: 'mood',
            status: 'completed'
          });
        });
      }

      // Fetch recent appointments 
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false })
        .limit(3);

      if (appointments) {
        appointments.forEach(appointment => {
          activities.push({
            id: `appointment-${appointment.id}`,
            title: 'Doctor Appointment',
            description: `Appointment scheduled - ${appointment.status}`,
            timestamp: new Date(appointment.appointment_date),
            type: 'appointment',
            status: appointment.status === 'completed' ? 'completed' : 
                   appointment.status === 'scheduled' ? 'scheduled' : 'active'
          });
        });
      }

      // Add some mock activities for demonstration
      activities.push({
        id: 'meditation-session',
        title: 'Meditation Session',
        description: 'Completed 10-minute breathing exercise',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        type: 'meditation',
        status: 'completed'
      });

      activities.push({
        id: 'chat-session',
        title: 'AI Chat Session',
        description: 'Had a conversation with MentiBot about stress management',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        type: 'chat',
        status: 'completed'
      });

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setActivities(activities.slice(0, 6)); // Show last 6 activities
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setLoading(false);
    }
  };

  return { activities, loading, refetch: fetchUserActivity };
};