import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, UserCheck, MessageCircle, BarChart3, Shield, Clock, Loader2 } from 'lucide-react';
import { useUserActivity } from '@/hooks/useUserActivity';

const UserDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { activities, loading } = useUserActivity();

  const features = [
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
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your mental health & medical care platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">Welcome, {user?.name}</span>
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="px-6 py-8 sm:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">Mental Health & Medical Care Platform</h2>
              <p className="text-muted-foreground">Access all features from this comprehensive dashboard</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="group bg-accent rounded-xl border border-border overflow-hidden hover:border-primary/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => navigate(feature.path)}
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4 group-hover:bg-primary/20 transition-colors">
                      <div className="text-primary">{React.cloneElement(feature.icon, { size: 24 })}</div>
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
                    <div className="flex items-center text-primary font-medium text-sm group-hover:text-primary-dark transition-colors">
                      Access Feature 
                      <span className="ml-1 transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="px-6 py-6 sm:px-8">
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Recent Activity</h3>
            <p className="text-muted-foreground mb-6">Your latest interactions with the platform</p>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading activities...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-medium text-card-foreground mb-2">No Recent Activity</h4>
                <p className="text-muted-foreground">Start using the platform features to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const getActivityIcon = (type) => {
                    switch (type) {
                      case 'mood': return '📊';
                      case 'appointment': return '👨‍⚕️';
                      case 'chat': return '🤖';
                      case 'meditation': return '🧘';
                      default: return '📋';
                    }
                  };

                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'completed': return 'bg-success';
                      case 'scheduled': return 'bg-warning';
                      case 'active': return 'bg-primary';
                      default: return 'bg-muted';
                    }
                  };

                  const getTimeAgo = (timestamp) => {
                    const now = new Date();
                    const diff = now.getTime() - timestamp.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    
                    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                    return 'Just now';
                  };

                  return (
                    <div key={activity.id} className="flex items-center p-4 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors">
                      <div className="flex-shrink-0">
                        <div className={`rounded-full p-3 ${
                          activity.type === 'mood' ? 'bg-success/10' :
                          activity.type === 'appointment' ? 'bg-primary/10' :
                          activity.type === 'chat' ? 'bg-secondary/10' :
                          'bg-accent-foreground/10'
                        }`}>
                          <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-card-foreground">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                      <div className="ml-auto flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
