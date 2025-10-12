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
  <motion.div 
    whileHover={{ scale: 1.02, y: -8 }} 
    whileTap={{ scale: 0.98 }} 
    className="group h-full"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <div className="h-full rounded-3xl border border-border/50 bg-card/90 backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:border-primary/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardContent className="p-8 h-full flex flex-col relative z-10">
        <div className="relative mb-6">
          <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity`}></div>
          <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3 font-display group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground leading-relaxed flex-1 text-base">{desc}</p>
        <div className="mt-6 flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
          <span>Learn more</span>
          <Sparkles className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:ml-0 transition-all" />
        </div>
      </CardContent>
    </div>
  </motion.div>
);

// --- Stat Card ---
const StatCard = ({ number, label, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8 }}
  >
    <Card className="group text-center bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      <CardContent className="p-12 relative z-10">
        <motion.div
          className={`text-6xl font-bold bg-gradient-to-r from-${color} to-${color}-dark bg-clip-text text-transparent mb-4 font-display`}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
        >
          {number}
        </motion.div>
        <p className="text-muted-foreground font-semibold text-lg">{label}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// --- Main Landing Page ---
const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 dark:from-background dark:via-secondary/10 dark:to-accent/5 transition-colors duration-500">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-card/80 border-b border-border/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center py-5">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-lg opacity-50"></div>
                <div className="relative w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-xl">
                  <Heart className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent font-display">MedDoctor Hub</h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">Healthcare Reimagined</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex space-x-3"
            >
              <Button onClick={() => navigate('/user-signin')} variant="medical" size="lg" className="hover-glow font-semibold shadow-lg">
                <Zap className="w-4 h-4 mr-2" /> User Sign In
              </Button>
              <Button onClick={() => navigate('/doctor-portal')} variant="success" size="lg" className="hover-lift font-semibold shadow-lg">
                <Shield className="w-4 h-4 mr-2" /> Doctor Portal
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-40 pb-32">
        <section className="max-w-7xl mx-auto px-6 lg:px-10 text-center relative">
          {/* Decorative Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 font-display leading-tight">
                Your Complete{" "}
                <span className="relative inline-block">
                  <span className="absolute inset-0 bg-gradient-hero blur-2xl opacity-30"></span>
                  <span className="relative bg-gradient-hero bg-clip-text text-transparent">
                    Healthcare Companion
                  </span>
                </span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Track emotions, find trusted professionals, and manage your well-being—all through one intelligent platform.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-6 pt-4"
            >
              <Button 
                onClick={() => navigate('/user-signin')} 
                size="lg" 
                variant="medical" 
                className="px-12 py-7 text-lg hover-glow font-semibold shadow-2xl hover:shadow-primary/25 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5 mr-2" /> Get Started
              </Button>
              <Button 
                onClick={() => navigate('/doctor-portal')} 
                size="lg" 
                variant="success" 
                className="px-12 py-7 text-lg hover-lift font-semibold shadow-2xl hover:shadow-success/25 transition-all duration-300"
              >
                <Shield className="w-5 h-5 mr-2" /> Join as Doctor
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto mt-32 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard number="10K+" label="Active Users" color="primary" delay={0.3} />
            <StatCard number="500+" label="Verified Doctors" color="success" delay={0.5} />
            <StatCard number="50K+" label="Mood Entries" color="warning" delay={0.7} />
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto mt-44 px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
            <div className="text-center mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-display">
                  Everything You Need
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Holistic features bridging mind, body, and technology
                </p>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-52 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-success to-accent"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-success to-accent blur-md"></div>
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
