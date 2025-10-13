import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Brain, MessageCircle, UserCheck, Shield, BarChart3, Sparkles, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { 
      icon: Brain, 
      title: 'Mood Tracking', 
      description: 'Monitor your emotional well-being with intelligent tracking tools.'
    },
    { 
      icon: MessageCircle, 
      title: 'AI Chatbot Support', 
      description: '24/7 emotional guidance from our advanced AI assistant.'
    },
    { 
      icon: UserCheck, 
      title: 'Find Doctors', 
      description: 'Connect with qualified healthcare professionals instantly.'
    },
    { 
      icon: Activity, 
      title: 'Stress Management', 
      description: 'Access meditation and breathing exercises for wellness.'
    },
    { 
      icon: BarChart3, 
      title: 'Health Analytics', 
      description: 'Visualize your health patterns with detailed insights.'
    },
    { 
      icon: Shield, 
      title: 'Secure & Private', 
      description: 'Your data protected with enterprise-grade security.'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '500+', label: 'Verified Doctors' },
    { value: '50K+', label: 'Mood Entries' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MedDoctor Hub</h1>
              <p className="text-xs text-muted-foreground">Healthcare Reimagined</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3"
          >
            <Button 
              onClick={() => navigate('/user-signin')}
              variant="outline"
            >
              User Sign In
            </Button>
            <Button 
              onClick={() => navigate('/doctor-portal')}
              variant="default"
            >
              Doctor Portal
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl text-center"
        >
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your Complete{' '}
            <span className="text-primary">Healthcare</span>{' '}
            Companion
          </h1>
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
            Seamlessly integrate mental health support with medical care services. 
            Track your mood, connect with doctors, and manage your well-being all in one place.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/user-signin')}
              className="gap-2"
            >
              Get Started as User
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/doctor-portal')}
            >
              Join as Doctor
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mb-2 text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground">
            Comprehensive features for your mental and physical health journey
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Emergency Support Section */}
      <section className="container pb-24">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-8 md:p-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive">
                <span className="text-2xl">🚨</span>
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">Emergency Support</h2>
            </div>
            <p className="mb-8 text-lg text-muted-foreground">
              If you're experiencing a mental health emergency or having thoughts of self-harm, 
              please reach out for immediate help:
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mb-2 text-sm font-medium">Emergency Services</div>
                <div className="text-2xl font-bold text-destructive">102</div>
              </div>
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mb-2 text-sm font-medium">Crisis Helpline</div>
                <div className="text-2xl font-bold text-destructive">112</div>
              </div>
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mb-2 text-sm font-medium">Suicide Prevention</div>
                <div className="text-xl font-bold text-destructive">1-800-273-8255</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mt-32 border-t bg-gradient-to-br from-primary via-primary-dark to-primary text-primary-foreground">
        <div className="container py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Heart className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">MedDoctor Hub</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Comprehensive mental health support and medical care platform with mood tracking, 
                AI chatbot, doctor finder, and patient management tools.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Sign In', path: '/user-signin' },
                  { label: 'Mood Tracker', path: '/mood-tracker' },
                  { label: 'Chatbot', path: '/chatbot' },
                  { label: 'Stress Management', path: '/stress-management' }
                ].map((link, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => navigate(link.path)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-destructive">Emergency Contacts</h3>
              <div className="space-y-3">
                {[
                  { label: 'Emergency', number: '102' },
                  { label: 'Crisis Helpline', number: '112' },
                  { label: 'Suicide Prevention', number: '1-800-273-8255' }
                ].map((contact, index) => (
                  <div key={index} className="rounded-lg border bg-card p-3">
                    <div className="text-xs font-medium text-muted-foreground">{contact.label}</div>
                    <div className="text-lg font-bold text-destructive">{contact.number}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} MedDoctor Hub. All rights reserved. Built with ❤️ for better healthcare
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
