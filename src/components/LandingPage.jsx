import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Brain, MessageCircle, UserCheck, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { 
    icon: <Brain className="w-8 h-8" />, 
    title: 'Mood Tracking', 
    desc: 'Track your emotional well-being over time with our intuitive mood tracker.',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    icon: <MessageCircle className="w-8 h-8" />, 
    title: 'AI Chatbot', 
    desc: 'Get 24/7 emotional support and guidance from our AI-powered chatbot.',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    icon: <UserCheck className="w-8 h-8" />, 
    title: 'Doctor Finder', 
    desc: 'Find and connect with qualified doctors for in-person or video consultations.',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    icon: <Heart className="w-8 h-8" />, 
    title: 'Stress Management', 
    desc: 'Access meditation audio and breathing exercises for stress relief.',
    color: 'from-red-500 to-pink-500'
  },
  { 
    icon: <BarChart3 className="w-8 h-8" />, 
    title: 'Data Visualization', 
    desc: 'Visualize your mental health patterns with our Chart.js integration.',
    color: 'from-indigo-500 to-purple-500'
  },
  { 
    icon: <Shield className="w-8 h-8" />, 
    title: 'Secure & Private', 
    desc: 'Your data is protected with enterprise-grade security measures.',
    color: 'from-gray-600 to-gray-800'
  }
];

const FeatureCard = ({ icon, title, desc, color }) => (
  <motion.div 
    whileHover={{ scale: 1.02, y: -2 }} 
    className="group"
  >
    <Card className="h-full bg-gradient-to-br from-card to-primary-light/20 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-elegant">
      <CardContent className="p-6">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/30 to-accent/50">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-card">
                <Heart className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                MedDoctor Hub
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex space-x-3"
            >
              <Button 
                onClick={() => navigate('/user-signin')}
                variant="medical"
                className="shadow-card hover:shadow-elegant"
              >
                User Sign In
              </Button>
              <Button 
                onClick={() => navigate('/doctor-portal')}
                variant="success"
                className="shadow-success hover:shadow-elegant"
              >
                Doctor Portal
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
                Your Complete
                <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  {" "}Healthcare
                </span>
                <br />
                Companion
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                Seamlessly integrate mental health support with medical care services. 
                Track your mood, connect with doctors, and manage your well-being all in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={() => navigate('/user-signin')}
                size="lg"
                variant="medical"
                className="text-lg px-8 py-6 shadow-elegant hover:shadow-glow"
              >
                Get Started as User
              </Button>
              <Button
                onClick={() => navigate('/doctor-portal')}
                size="lg"
                variant="success"
                className="text-lg px-8 py-6 shadow-success hover:shadow-elegant"
              >
                Join as Doctor
              </Button>
            </motion.div>
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <Card className="text-center bg-gradient-to-br from-card to-primary-light/20 border-primary/20">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                <p className="text-muted-foreground">Active Users</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-to-br from-card to-success-light/20 border-success/20">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-success mb-2">500+</div>
                <p className="text-muted-foreground">Verified Doctors</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-to-br from-card to-warning-light/20 border-warning/20">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-warning mb-2">50K+</div>
                <p className="text-muted-foreground">Mood Entries</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">Comprehensive features for your mental and physical health</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
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
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-20"
          >
            <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-elegant">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">📞</span>
                  </div>
                  <h2 className="text-2xl font-bold text-red-700">Emergency Support</h2>
                </div>
                <p className="text-red-600 mb-6">
                  If you're experiencing a mental health emergency or having thoughts of self-harm, please reach out for immediate help:
                </p>
                <div className="space-y-2 text-red-700 font-semibold">
                  <div><span className="font-bold">Emergency Services:</span> 102</div>
                  <div><span className="font-bold">Crisis Helpline:</span> 112</div>
                  <div><span className="font-bold">National Suicide Prevention Lifeline:</span> 1-800-273-8255</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About ThinkBot */}
            <div>
              <h3 className="text-xl font-semibold mb-4">About ThinkBot</h3>
              <p className="text-gray-300 leading-relaxed">
                A health support platform designed for early detection, personalized disease prediction, and mental well-being management by helping you track your mood, manage stress, and find emotional support.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => navigate('/')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/mood-tracker')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Mood Tracker
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/stress-management')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Stress Management
                  </button>
                </li>
                <li>
                  <span className="text-gray-300">Disease Prediction</span>
                </li>
              </ul>
            </div>

            {/* Emergency Contacts */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Emergency Contacts</h3>
              <div className="space-y-2 text-gray-300">
                <div>Emergency: 102</div>
                <div>Crisis Helpline: 112</div>
                <div>
                  <div>National Suicide Prevention Lifeline:</div>
                  <div className="text-blue-300">1-800-273-8255</div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">© {currentYear} ThinkBot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
