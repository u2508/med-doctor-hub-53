import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, Brain, MessageCircle, UserCheck, Shield, 
  BarChart3, Sparkles, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// --- Feature Data ---
const features = [
  { icon: <Brain className="w-8 h-8" />, title: 'Mood Tracking', desc: 'Track your emotional well-being over time with intuitive visual insights.', gradient: 'from-purple-500 via-purple-600 to-pink-500' },
  { icon: <MessageCircle className="w-8 h-8" />, title: 'AI Chatbot', desc: '24/7 AI emotional support powered by compassionate response models.', gradient: 'from-blue-500 via-blue-600 to-cyan-500' },
  { icon: <UserCheck className="w-8 h-8" />, title: 'Doctor Finder', desc: 'Find and connect with certified doctors for instant consultations.', gradient: 'from-green-500 via-green-600 to-emerald-500' },
  { icon: <Heart className="w-8 h-8" />, title: 'Stress Management', desc: 'Access mindfulness exercises and guided meditations for daily calm.', gradient: 'from-red-500 via-pink-500 to-rose-500' },
  { icon: <BarChart3 className="w-8 h-8" />, title: 'Data Visualization', desc: 'Spot health trends easily with interactive data analytics.', gradient: 'from-indigo-500 via-purple-500 to-violet-500' },
  { icon: <Shield className="w-8 h-8" />, title: 'Secure & Private', desc: 'Your data is encrypted with enterprise-grade protocols.', gradient: 'from-gray-600 via-slate-600 to-gray-800' },
];

// --- Feature Card ---
const FeatureCard = ({ icon, title, desc, gradient }) => (
  <motion.div whileHover={{ scale: 1.03, y: -6 }} whileTap={{ scale: 0.98 }} className="group h-full">
    <div className="h-full rounded-2xl border border-transparent bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl transition-all shadow-md hover:shadow-xl hover:border-primary/30">
      <CardContent className="p-10 h-full flex flex-col">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3 font-display">{title}</h3>
        <p className="text-muted-foreground leading-relaxed flex-1">{desc}</p>
        <div className="mt-6 flex items-center text-primary font-medium group-hover:text-primary-dark transition-colors">
          <span>Learn more</span>
          <Sparkles className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </div>
  </motion.div>
);

// --- Stat Card ---
const StatCard = ({ number, label, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8 }}
  >
    <Card className={`text-center bg-gradient-to-br from-card to-${color}-light/20 border-${color}/20 hover:shadow-lg hover-lift transition-transform`}>
      <CardContent className="p-10">
        <motion.div
          className={`text-5xl font-bold text-${color} mb-3 font-display`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
        >
          {number}
        </motion.div>
        <p className="text-muted-foreground font-medium">{label}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// --- Main Landing Page ---
const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-500">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center py-4 sm:py-5">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-md">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gradient font-display">MedDoctor Hub</h1>
                <p className="text-xs text-muted-foreground font-medium">Healthcare Reimagined</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex space-x-3 sm:space-x-4">
              <Button onClick={() => navigate('/user-signin')} variant="medical" className="hover-glow px-4 sm:px-6 py-2.5 text-sm font-semibold">
                <Zap className="w-4 h-4 mr-2" /> User Sign In
              </Button>
              <Button onClick={() => navigate('/doctor-portal')} variant="success" className="hover-lift px-4 sm:px-6 py-2.5 text-sm font-semibold">
                <Shield className="w-4 h-4 mr-2" /> Doctor Portal
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-24 sm:pt-40 sm:pb-28">
        <section className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-foreground mb-8 font-display leading-tight">
              Your Complete <span className="text-gradient block">Healthcare Companion</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
              Track emotions, find trusted professionals, and manage your well-being—all through one intelligent platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button onClick={() => navigate('/user-signin')} size="lg" variant="medical" className="px-10 py-6 text-lg hover-glow">
                <Sparkles className="w-5 h-5 mr-2" /> Get Started
              </Button>
              <Button onClick={() => navigate('/doctor-portal')} size="lg" variant="success" className="px-10 py-6 text-lg hover-lift">
                <Shield className="w-5 h-5 mr-2" /> Join as Doctor
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-10">
          <StatCard number="10K+" label="Active Users" color="primary" delay={0.3} />
          <StatCard number="500+" label="Verified Doctors" color="success" delay={0.5} />
          <StatCard number="50K+" label="Mood Entries" color="warning" delay={0.7} />
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto mt-36 px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 font-display">Everything You Need</h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">Holistic features bridging mind, body, and technology</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-44 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-success to-cyan-400 blur-sm"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* About */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold ml-3 font-display">About ThinkBot</h3>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-sm">
                A holistic digital health ecosystem merging emotion analytics, AI guidance, and secure doctor access.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 font-display">Quick Links</h3>
              <ul className="space-y-3 text-gray-400">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Mood Tracker', path: '/mood-tracker' },
                  { label: 'Stress Management', path: '/stress-management' },
                  { label: 'Disease Prediction', path: '#' },
                ].map((link, i) => (
                  <li key={i}>
                    <button onClick={() => link.path !== '#' && navigate(link.path)} className="hover:text-white transition-colors">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency Contacts */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 font-display text-destructive">Emergency Contacts</h3>
              <div className="space-y-4">
                {[
                  { label: 'Emergency', number: '102' },
                  { label: 'Crisis Helpline', number: '112' },
                  { label: 'Suicide Prevention', number: '1-800-273-8255' },
                ].map((c, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-white font-semibold">{c.label}</div>
                    <div className="text-primary text-lg font-bold">{c.number}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-700 mt-16 pt-8 text-center text-gray-500">
            © {currentYear} ThinkBot. Built with ❤️ to empower better healthcare journeys.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
