import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Brain, MessageCircle, UserCheck, Shield, BarChart3, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { 
    icon: <Brain className="w-8 h-8" />, 
    title: 'Mood Tracking', 
    desc: 'Track your emotional well-being over time with our intuitive mood tracker.',
    gradient: 'from-purple-500 via-purple-600 to-pink-500'
  },
  { 
    icon: <MessageCircle className="w-8 h-8" />, 
    title: 'AI Chatbot', 
    desc: 'Get 24/7 emotional support and guidance from our AI-powered chatbot.',
    gradient: 'from-blue-500 via-blue-600 to-cyan-500'
  },
  { 
    icon: <UserCheck className="w-8 h-8" />, 
    title: 'Doctor Finder', 
    desc: 'Find and connect with qualified doctors for in-person or video consultations.',
    gradient: 'from-green-500 via-green-600 to-emerald-500'
  },
  { 
    icon: <Heart className="w-8 h-8" />, 
    title: 'Stress Management', 
    desc: 'Access meditation audio and breathing exercises for stress relief.',
    gradient: 'from-red-500 via-pink-500 to-rose-500'
  },
  { 
    icon: <BarChart3 className="w-8 h-8" />, 
    title: 'Data Visualization', 
    desc: 'Visualize your mental health patterns with our Chart.js integration.',
    gradient: 'from-indigo-500 via-purple-500 to-violet-500'
  },
  { 
    icon: <Shield className="w-8 h-8" />, 
    title: 'Secure & Private', 
    desc: 'Your data is protected with enterprise-grade security measures.',
    gradient: 'from-gray-600 via-slate-600 to-gray-800'
  }
];

const FeatureCard = ({ icon, title, desc, gradient }) => (
  <motion.div 
    whileHover={{ scale: 1.03, y: -8 }} 
    whileTap={{ scale: 0.98 }}
    className="group h-full"
  >
    <div className="card-elevated h-full rounded-2xl overflow-hidden group-hover:border-primary/40 group-hover:shadow-elegant">
      <CardContent className="p-10 h-full flex flex-col">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-all duration-300 shadow-lg animate-float`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-4 font-display">{title}</h3>
        <p className="text-muted-foreground/80 leading-relaxed flex-1 text-base">{desc}</p>
        <div className="mt-8 flex items-center text-primary font-semibold group-hover:text-primary-dark transition-colors">
          <span>Learn more</span>
          <Sparkles className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </div>
  </motion.div>
);

const StatCard = ({ number, label, color, delay }) => {
  const colorConfig = {
    primary: {
      gradient: 'from-primary/5 to-primary/10',
      border: 'border-primary/20',
      text: 'text-primary'
    },
    success: {
      gradient: 'from-success/5 to-success/10',
      border: 'border-success/20',
      text: 'text-success'
    },
    warning: {
      gradient: 'from-warning/5 to-warning/10',
      border: 'border-warning/20',
      text: 'text-warning'
    }
  };
  
  const config = colorConfig[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
    >
      <Card className={`text-center card-elevated bg-gradient-to-br ${config.gradient} ${config.border} hover-lift`}>
        <CardContent className="p-10">
          <motion.div 
            className={`text-6xl font-bold ${config.text} mb-4 font-display`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: "spring", stiffness: 200 }}
          >
            {number}
          </motion.div>
          <p className="text-muted-foreground font-semibold text-lg">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-background">
      {/* Header */}
      <header className="glass-card border-b border-border/30 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-glow animate-glow">
                <Heart className="w-7 h-7 text-primary-foreground drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient font-display">
                  MedDoctor Hub
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Healthcare Reimagined</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex space-x-3"
            >
              <Button 
                onClick={() => navigate('/user-signin')}
                variant="medical"
                className="hover-glow shadow-card"
                size="default"
              >
                <Zap className="w-4 h-4 mr-2" />
                User Sign In
              </Button>
              <Button 
                onClick={() => navigate('/doctor-portal')}
                variant="success"
                className="hover-lift shadow-success"
                size="default"
              >
                <Shield className="w-4 h-4 mr-2" />
                Doctor Portal
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center relative">
            {/* Floating Elements - Enhanced */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float"></div>
              <div className="absolute top-40 right-16 w-24 h-24 bg-success/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
              <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-warning/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
              <div className="absolute top-1/2 right-1/4 w-28 h-28 bg-primary-glow/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-8 font-display leading-tight tracking-tighter">
                Your Complete
                <span className="text-gradient block mt-2">
                  Healthcare
                </span>
                Companion
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground/90 mb-16 max-w-4xl mx-auto leading-relaxed font-medium">
                Seamlessly integrate mental health support with medical care services. 
                Track your mood, connect with doctors, and manage your well-being all in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center relative z-10"
            >
              <Button
                onClick={() => navigate('/user-signin')}
                size="lg"
                variant="medical"
                className="text-lg px-12 py-7 hover-glow animate-glow shadow-elegant font-semibold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started as User
              </Button>
              <Button
                onClick={() => navigate('/doctor-portal')}
                size="lg"
                variant="success"
                className="text-lg px-12 py-7 hover-lift shadow-success font-semibold"
              >
                <Shield className="w-5 h-5 mr-2" />
                Join as Doctor
              </Button>
            </motion.div>
          </div>

          {/* Stats Section */}
          <div className="mt-32 lg:mt-40 grid grid-cols-1 md:grid-cols-3 gap-8 mb-40">
            <StatCard number="10K+" label="Active Users" color="primary" delay={0.5} />
            <StatCard number="500+" label="Verified Doctors" color="success" delay={0.7} />
            <StatCard number="50K+" label="Mood Entries" color="warning" delay={0.9} />
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-display tracking-tight">Everything You Need</h2>
              <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-medium">Comprehensive features for your mental and physical health journey</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-40">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + index * 0.1, duration: 0.6 }}
                >
                  <FeatureCard {...feature} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Emergency Support Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <Card className="bg-gradient-to-br from-destructive-light/60 to-destructive-light/40 border-destructive/40 shadow-elegant overflow-hidden relative backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent"></div>
              <CardContent className="p-12 lg:p-16 relative">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-destructive rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                    <span className="text-destructive-foreground text-2xl">🚨</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-destructive font-display">Emergency Support</h2>
                </div>
                <p className="text-destructive/90 mb-10 text-lg md:text-xl leading-relaxed font-medium">
                  If you're experiencing a mental health emergency or having thoughts of self-harm, please reach out for immediate help:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-destructive">
                  <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-destructive/20 hover:border-destructive/40 transition-all hover-lift">
                    <div className="font-bold text-lg mb-2">Emergency Services</div>
                    <div className="text-3xl font-bold">102</div>
                  </div>
                  <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-destructive/20 hover:border-destructive/40 transition-all hover-lift">
                    <div className="font-bold text-lg mb-2">Crisis Helpline</div>
                    <div className="text-3xl font-bold">112</div>
                  </div>
                  <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-destructive/20 hover:border-destructive/40 transition-all hover-lift">
                    <div className="font-bold text-lg mb-2">Suicide Prevention</div>
                    <div className="text-2xl font-bold">1-800-273-8255</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary via-primary-dark to-primary text-primary-foreground relative overflow-hidden mt-32">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-success/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* About ThinkBot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.6 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-background/20 to-background/10 rounded-xl flex items-center justify-center shadow-lg border border-primary-foreground/20">
                  <Heart className="w-6 h-6 text-primary-foreground drop-shadow-lg" />
                </div>
                <h3 className="text-2xl font-bold font-display">About MedDoctorHub</h3>
              </div>
              <p className="text-primary-foreground/90 leading-relaxed text-base">
                Comprehensive mental health support and medical care platform with mood tracking, AI chatbot, doctor finder, and patient management tools.
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-6 font-display">Quick Links</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Sign In', path: '/user-signin' },
                  { label: 'Mood Tracker', path: '/mood-tracker' },
                  { label: 'Chatbot', path: '/chatbot' },
                  { label: 'Stress Management', path: '/stress-management' },
                  
                ].map((link, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => link.path !== '#' && navigate(link.path)}
                      className="text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center group"
                    >
                      <span className="w-2 h-2 bg-primary-foreground/60 rounded-full mr-3 group-hover:bg-primary-foreground group-hover:shadow-glow transition-all"></span>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Emergency Contacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-6 font-display text-warning">Emergency Contacts</h3>
              <div className="space-y-4">
                {[
                  { label: 'Emergency', number: '102' },
                  { label: 'Crisis Helpline', number: '112' },
                  { label: 'Suicide Prevention', number: '1-800-273-8255' }
                ].map((contact, index) => (
                  <div key={index} className="bg-background/10 backdrop-blur-sm p-5 rounded-xl border border-primary-foreground/20 hover:border-primary-foreground/40 transition-all hover-lift">
                    <div className="text-primary-foreground font-bold text-base mb-1">{contact.label}</div>
                    <div className="text-warning text-xl font-bold">{contact.number}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6, duration: 0.6 }}
            className="border-t border-primary-foreground/20 mt-16 pt-10 text-center"
          >
            <p className="text-primary-foreground/70 text-base">
              © {currentYear} MedDoctorHub. All rights reserved. | Built with ❤️ for better healthcare
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;