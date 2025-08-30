import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, UserCheck, MessageCircle, BarChart3, Shield } from 'lucide-react';

const UserDashboard = ({ user }) => {
  const navigate = useNavigate();

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
            
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-accent rounded-lg border border-border">
                <div className="flex-shrink-0">
                  <div className="bg-success/10 rounded-full p-3">
                    <span className="text-success text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-card-foreground">Mood Entry Recorded</h4>
                  <p className="text-sm text-muted-foreground">You recorded your mood today at 9:30 AM</p>
                </div>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-accent rounded-lg border border-border">
                <div className="flex-shrink-0">
                  <div className="bg-primary/10 rounded-full p-3">
                    <span className="text-primary text-lg">👨‍⚕️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-card-foreground">Doctor Appointment</h4>
                  <p className="text-sm text-muted-foreground">Appointment with Dr. Johnson scheduled for tomorrow</p>
                </div>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-accent rounded-lg border border-border">
                <div className="flex-shrink-0">
                  <div className="bg-accent-foreground/10 rounded-full p-3">
                    <span className="text-accent-foreground text-lg">🧘</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-card-foreground">Meditation Session</h4>
                  <p className="text-sm text-muted-foreground">Completed 10-minute breathing exercise</p>
                </div>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
