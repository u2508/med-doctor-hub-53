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
  { icon: <Brain className="w-8 h-8" />, title: 'Mood Tracking', desc: 'Track your emotional well-being over time with intuitive visual insights.', gradient: 'from-purple-600 via-purple-700 to-pink-600' },
  { icon: <MessageCircle className="w-8 h-8" />, title: 'AI Chatbot', desc: '24/7 AI emotional support powered by compassionate response models.', gradient: 'from-blue-600 via-blue-700 to-cyan-600' },
  { icon: <UserCheck className="w-8 h-8" />, title: 'Doctor Finder', desc: 'Find and connect with certified doctors for instant consultations.', gradient: 'from-green-600 via-green-700 to-emerald-600' },
  { icon: <Heart className="w-8 h-8" />, title: 'Stress Management', desc: 'Access mindfulness exercises and guided meditations for daily calm.', gradient: 'from-red-600 via-pink-600 to-rose-600' },
  { icon: <BarChart3 className="w-8 h-8" />, title: 'Data Visualization', desc: 'Spot health trends easily with interactive data analytics.', gradient: 'from-indigo-600 via-purple-600 to-violet-600' },
  { icon: <Shield className="w-8 h-8" />, title: 'Secure & Private', desc: 'Your data is encrypted with enterprise-grade protocols.', gradient: 'from-gray-700 via-slate-700 to-gray-900' },
];

// --- Feature Card ---
const FeatureCard = ({ icon, title, desc, gradient }) => (
  <motion.div 
    whileHover={{ scale: 1.03, y: -10 }} 
    whileTap={{ scale: 0.98 }} 
    className="group h-full"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <div className="h-full rounded-3xl border border-border/40 bg-card/95 backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:border-primary/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardContent className="p-10 flex flex-col relative z-10 h-full">
        <div className="relative mb-6">
          <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity`}></div>
          <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-2xl`}>
            {icon}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-4 font-display group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-gray-300 leading-relaxed flex-1 text-base">{desc}</p>
        <div className="mt-8 flex items-center text-primary font-semibold group-hover:gap-3 transition-all text-lg">
          <span>Learn more</span>
          <Sparkles className="w-5 h-5 ml-1 opacity-0 group-hover:opacity-100 group-hover:ml-0 transition-all" />
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
    <Card className="group text-center bg-gradient-to-br from-card to-card/60 border-border/50 hover:shadow-2xl hover:border-primary/40 transition-all duration-300 overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}/10 to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300`}></div>
      <CardContent className="p-16 relative z-10">
        <motion.div
          className={`text-6xl sm:text-7xl font-bold bg-gradient-to-r from-${color} to-${color}-dark bg-clip-text text-transparent mb-4 font-display`}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
        >
          {number}
        </motion.div>
        <p className="text-gray-400 font-semibold text-lg">{label}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// --- Main Landing Page ---
const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-accent/25 dark:from-background dark:via-secondary/15 dark:to-accent/10 transition-colors duration-500">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-3xl bg-card/90 border-b border-border/40 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center py-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-60"></div>
                <div className="relative w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-2xl">
                  <Heart className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent font-display">MedDoctor Hub</h1>
                <p className="text-sm sm:text-xs text-gray-400 font-medium tracking-wide">Healthcare Reimagined</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex space-x-3"
            >
              <Button onClick={() => navigate('/user-signin')} variant="medical" size="lg" className="hover-glow font-semibold shadow-lg px-6 py-3">
                <Zap className="w-4 h-4 mr-2" /> User Sign In
              </Button>
              <Button onClick={() => navigate('/doctor-portal')} variant="success" size="lg" className="hover-lift font-semibold shadow-lg px-6 py-3">
                <Shield className="w-4 h-4 mr-2" /> Doctor Portal
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-44 pb-36">
        <section className="max-w-7xl mx-auto px-6 lg:px-10 text-center relative">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-24 left-10 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute top-44 right-12 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
          </div>
          
          <motion.div className="space-y-10">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 font-display leading-tight">
              Your Complete{" "}
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-hero blur-3xl opacity-40"></span>
                <span className="relative bg-gradient-hero bg-clip-text text-transparent">
                  Healthcare Companion
                </span>
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Track emotions, find trusted professionals, and manage your well-being—all through one intelligent platform.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
              <Button 
                onClick={() => navigate('/user-signin')} 
                size="lg" 
                variant="medical" 
                className="px-14 py-6 text-lg hover-glow font-semibold shadow-2xl hover:shadow-primary/30 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5 mr-2" /> Get Started
              </Button>
              <Button 
                onClick={() => navigate('/doctor-portal')} 
                size="lg" 
                variant="success" 
                className="px-14 py-6 text-lg hover-lift font-semibold shadow-2xl hover:shadow-success/30 transition-all duration-300"
              >
                <Shield className="w-5 h-5 mr-2" /> Join as Doctor
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto mt-36 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <StatCard number="10K+" label="Active Users" color="primary" delay={0.3} />
            <StatCard number="500+" label="Verified Doctors" color="success" delay={0.5} />
            <StatCard number="50K+" label="Mood Entries" color="warning" delay={0.7} />
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto mt-40 px-6 lg:px-10">
          <div className="text-center mb-28">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-display">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Holistic features bridging mind, body, and technology
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-52 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-success to-accent"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-success to-accent blur-md"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* About */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold ml-3 font-display">About MedDoctorHub</h3> 
              </div>
              <p className="text-gray-400 leading-relaxed max-w-sm">
                A holistic digital health ecosystem merging emotion analytics, AI guidance, and secure doctor access.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 font-display">Quick Links</h3>
              <ul className="space-y-3 text-gray-400">
                {[{ label: 'Home', path: '/' }, { label: 'Mood Tracker', path: '/mood-tracker' }, { label: 'Chatbot', path: '/chatbot' }, { label: 'Stress Management', path: '/stress-management' }].map((link, i) => (
                  <li key={i}>
                    <button onClick={() => link.path && navigate(link.path)} className="hover:text-white transition-colors">{link.label}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency Contacts */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 font-display text-destructive">Emergency Contacts</h3>
              <div className="space-y-4">
                {[{ label: 'Emergency', number: '102' }, { label: 'Crisis Helpline', number: '112' }, { label: 'Suicide Prevention', number: '1-800-273-8255' }].map((c, i) => (
                  <div key={i} className="bg-white/5 p-5 rounded-lg border border-white/10">
                    <div className="text-white font-semibold">{c.label}</div>
                    <div className="text-primary text-lg font-bold">{c.number}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-700 mt-16 pt-8 text-center text-gray-500">
            © {currentYear} MedDoctorHub. Built with ❤️ to empower better healthcare journeys.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
