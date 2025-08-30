import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, UserCheck, MessageCircle, BarChart3, Shield, Clock, Loader2, Sparkles } from 'lucide-react';
import { useUserActivity } from '@/hooks/useUserActivity';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
}

interface UserDashboardProps {
  user: any;
}

// Memoized feature card component for better performance
const FeatureCard = memo(({ feature, onClick }: { feature: Feature; onClick: () => void }) => (
  <motion.div 
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    className="group cursor-pointer h-full"
    onClick={onClick}
  >
    <div className="card-elevated rounded-2xl overflow-hidden group-hover:border-primary/30 h-full">
      <div className="p-8 h-full flex flex-col">
        <div className="flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl mb-6 group-hover:scale-110 group-hover:shadow-glow transition-all duration-300">
          <div className="text-primary-foreground">{React.cloneElement(feature.icon, { size: 28 })}</div>
        </div>
        <h3 className="text-xl font-semibold text-card-foreground mb-3 font-display">{feature.title}</h3>
        <p className="text-muted-foreground mb-6 flex-1 leading-relaxed">{feature.description}</p>
        <div className="flex items-center text-primary font-medium group-hover:text-primary-dark transition-colors">
          <span>Access Feature</span>
          <Sparkles className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  </motion.div>
));

FeatureCard.displayName = 'FeatureCard';

// Memoized activity item component
const ActivityItem = memo(({ activity }: { activity: any }) => {
  const getActivityIcon = useMemo(() => {
    switch (activity.type) {
      case 'mood': return '📊';
      case 'appointment': return '👨‍⚕️';
      case 'chat': return '🤖';
      case 'meditation': return '🧘';
      default: return '📋';
    }
  }, [activity.type]);

  const getStatusColor = useMemo(() => {
    switch (activity.status) {
      case 'completed': return 'bg-success';
      case 'scheduled': return 'bg-warning';
      case 'active': return 'bg-primary';
      default: return 'bg-muted';
    }
  }, [activity.status]);

  const getTimeAgo = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - activity.timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  }, [activity.timestamp]);

  return (
    <motion.div 
      whileHover={{ scale: 1.01, x: 4 }}
      className="flex items-center p-6 card-elevated rounded-xl hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex-shrink-0">
        <motion.div 
          whileHover={{ rotate: 5 }}
          className={`rounded-full p-4 ${
            activity.type === 'mood' ? 'bg-success/10 border border-success/20' :
            activity.type === 'appointment' ? 'bg-primary/10 border border-primary/20' :
            activity.type === 'chat' ? 'bg-secondary/10 border border-secondary/20' :
            'bg-accent-foreground/10 border border-accent/20'
          }`}
        >
          <span className="text-xl">{getActivityIcon}</span>
        </motion.div>
      </div>
      <div className="ml-6 flex-1 min-w-0">
        <h4 className="text-base font-semibold text-card-foreground mb-1">{activity.title}</h4>
        <p className="text-muted-foreground truncate mb-2">{activity.description}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          {getTimeAgo}
        </div>
      </div>
      <div className="ml-auto flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${getStatusColor} shadow-sm`}></div>
      </div>
    </motion.div>
  );
});

ActivityItem.displayName = 'ActivityItem';

const UserDashboard = memo(({ user }: UserDashboardProps) => {
  const navigate = useNavigate();
  const { activities, loading } = useUserActivity();

  // Memoized features array to prevent re-creation on every render
  const features = useMemo<Feature[]>(() => [
    {
      title: 'Doctor Finder',
      description: 'Find and connect with qualified doctors for in-person or video consultations.',
      icon: <UserCheck className="w-8 h-8" />,
      path: '/doctor-finder'
    },
    {
      title: 'Mood Tracker',
      description: 'Track your emotional well-being over time with our intuitive mood tracker.',
      icon: <BarChart3 className="w-8 h-8" />,
      path: '/mood-tracker'
    },
    {
      title: 'AI Chatbot',
      description: 'Get 24/7 emotional support and guidance from our AI-powered chatbot.',
      icon: <MessageCircle className="w-8 h-8" />,
      path: '/chatbot'
    },
    {
      title: 'Stress Management',
      description: 'Access meditation audio and breathing exercises for stress relief.',
      icon: <Heart className="w-8 h-8" />,
      path: '/stress-management'
    },
    {
      title: 'Doctor Portal',
      description: 'Access medical dashboard and patient management tools (for healthcare professionals).',
      icon: <Shield className="w-8 h-8" />,
      path: '/doctor-portal'
    }
  ], []);

  // Memoized handlers to prevent re-creation
  const handleSignOut = useMemo(() => () => navigate('/'), [navigate]);
  const handleFeatureClick = useMemo(() => (path: string) => () => navigate(path), [navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold text-gradient font-display">User Dashboard</h1>
            <p className="text-muted-foreground mt-2 font-medium">Your mental health & medical care platform</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-6"
          >
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <p className="font-semibold text-foreground">{user?.name || 'User'}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-medium"
            >
              Sign Out
            </button>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated rounded-2xl overflow-hidden"
        >
          <div className="px-8 py-12 sm:px-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-card-foreground mb-4 font-display">Mental Health & Medical Care Platform</h2>
              <p className="text-muted-foreground text-lg">Access all features from this comprehensive dashboard</p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <FeatureCard 
                    feature={feature} 
                    onClick={handleFeatureClick(feature.path)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 card-elevated rounded-2xl overflow-hidden"
        >
          <div className="px-8 py-8 sm:px-12">
            <h3 className="text-2xl font-semibold text-card-foreground mb-3 font-display">Recent Activity</h3>
            <p className="text-muted-foreground mb-8 text-lg">Your latest interactions with the platform</p>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-8 h-8 text-primary" />
                </motion.div>
                <span className="ml-3 text-muted-foreground font-medium">Loading activities...</span>
              </div>
            ) : activities.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-muted-foreground" />
                </div>
                <h4 className="text-xl font-medium text-card-foreground mb-3 font-display">No Recent Activity</h4>
                <p className="text-muted-foreground text-lg">Start using the platform features to see your activity here</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ActivityItem activity={activity} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
});

UserDashboard.displayName = 'UserDashboard';

export default UserDashboard;