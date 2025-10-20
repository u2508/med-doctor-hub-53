import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Brain, MessageCircle, UserCheck, Shield, BarChart3, Activity, ArrowRight, Sparkles, CheckCircle2, Star, Users, Clock, Award, ChevronDown, Quote, Mail, Phone, MapPin, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const LandingPage = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const features = [
    { 
      icon: Brain, 
      title: 'Mood Tracking', 
      description: 'Monitor your emotional well-being with intelligent tracking tools and insights.',
      color: 'from-primary/20 to-primary/5'
    },
    { 
      icon: MessageCircle, 
      title: 'AI Chatbot Support', 
      description: '24/7 emotional guidance from our advanced AI assistant, always here for you.',
      color: 'from-accent/20 to-accent/5'
    },
    { 
      icon: UserCheck, 
      title: 'Find Doctors', 
      description: 'Connect with qualified healthcare professionals instantly, whenever you need.',
      color: 'from-primary-dark/20 to-primary-dark/5'
    },
    { 
      icon: Activity, 
      title: 'Stress Management', 
      description: 'Access meditation and breathing exercises designed for your wellness.',
      color: 'from-primary/20 to-primary/5'
    },
    { 
      icon: BarChart3, 
      title: 'Health Analytics', 
      description: 'Visualize your health patterns with detailed insights and trends.',
      color: 'from-accent/20 to-accent/5'
    },
    { 
      icon: Shield, 
      title: 'Secure & Private', 
      description: 'Your data protected with enterprise-grade security and encryption.',
      color: 'from-primary-dark/20 to-primary-dark/5'
    }
  ];

  const stats = [
    { icon: Users, value: '10K+', label: 'Active Users', color: 'text-primary' },
    { icon: Award, value: '500+', label: 'Verified Doctors', color: 'text-accent' },
    { icon: Star, value: '50K+', label: 'Mood Entries', color: 'text-primary-dark' },
    { icon: Clock, value: '24/7', label: 'Support Available', color: 'text-primary' }
  ];

  const benefits = [
    'Personalized health insights',
    'Secure data encryption',
    'Expert medical guidance',
    'Real-time mood tracking',
    'AI-powered recommendations',
    'Community support network'
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      content: 'MedDoctor Hub transformed how I manage my mental health. The mood tracking and AI chatbot have been invaluable.',
      rating: 5
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Psychiatrist',
      content: 'An excellent platform for connecting with patients and monitoring their progress. The analytics are incredibly detailed.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Patient',
      content: 'Finding qualified doctors was so easy, and the stress management tools have become part of my daily routine.',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'How does MedDoctor Hub protect my privacy?',
      answer: 'We use enterprise-grade encryption and comply with HIPAA regulations. Your data is stored securely and never shared without your explicit consent. All communications between you and healthcare providers are encrypted end-to-end.'
    },
    {
      question: 'Is the AI chatbot a replacement for professional therapy?',
      answer: 'No, the AI chatbot is designed to provide support and guidance between sessions with healthcare professionals. It\'s a complementary tool, not a replacement for professional medical advice or therapy.'
    },
    {
      question: 'How do I find and connect with doctors?',
      answer: 'Use our Doctor Finder feature to search for qualified healthcare professionals by specialty, location, and availability. You can view profiles, read reviews, and book appointments directly through the platform.'
    },
    {
      question: 'What features are included in the free plan?',
      answer: 'The free plan includes basic mood tracking, access to the AI chatbot, stress management exercises, and the ability to connect with doctors. Premium features include advanced analytics and priority support.'
    },
    {
      question: 'Can I use MedDoctor Hub on mobile devices?',
      answer: 'Yes! MedDoctor Hub is fully responsive and works seamlessly on all devices including smartphones, tablets, and desktop computers. We also offer dedicated mobile apps for iOS and Android.'
    },
    {
      question: 'What should I do in a mental health emergency?',
      answer: 'In case of emergency, immediately call 102 (Emergency Services), 112 (Crisis Helpline), or 1-800-273-8255 (Suicide Prevention). MedDoctor Hub is not designed for emergency situations.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center shadow-card">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">MedDoctor Hub</h1>
                <p className="text-xs text-muted-foreground">Healthcare Reimagined</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => navigate('/user-signin')}
                  variant="ghost"
                  className="hidden sm:flex"
                >
                  User Sign In
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => navigate('/doctor-portal')}
                  className="gap-2 shadow-card"
                >
                  Doctor Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => navigate('/support')}
                  variant="ghost"
                  className="gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Support
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--accent)/0.1),transparent_50%)]" />
        
        <motion.div
          style={{ opacity, scale }}
          className="container relative mx-auto px-6"
        >
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Healthcare Platform</span>
              </motion.div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
                Your Complete{' '}
                <span className="bg-gradient-to-r from-primary via-primary-dark to-accent bg-clip-text text-transparent">
                  Healthcare
                </span>
                {' '}Companion
              </h1>
              
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Seamlessly integrate mental health support with medical care services. 
                Track your mood, connect with doctors, and manage your well-being.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={() => navigate('/user-signin')}
                  className="gap-2 px-8 py-6 text-lg shadow-elegant"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/doctor-portal')}
                  className="px-8 py-6 text-lg"
                >
                  Join as Doctor
                </Button>
              </motion.div>
            </motion.div>

            {/* Benefits List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-8"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y bg-gradient-to-br from-card to-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                className="text-center space-y-3"
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${stat.color === 'text-primary' ? 'from-primary/20 to-primary/5' : stat.color === 'text-accent' ? 'from-accent/20 to-accent/5' : 'from-primary-dark/20 to-primary-dark/5'} flex items-center justify-center`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className={`text-4xl sm:text-5xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive features for your mental and physical health journey
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-elegant">
                  <CardContent className="p-8 space-y-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users and healthcare professionals have to say
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
              >
                <Card className="h-full hover:shadow-elegant transition-all duration-300">
                  <CardContent className="p-8 space-y-6">
                    <Quote className="w-10 h-10 text-primary/30" />
                    <p className="text-muted-foreground leading-relaxed italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <div className="pt-4 border-t">
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about MedDoctor Hub
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border rounded-xl px-6 bg-card hover:shadow-card transition-shadow"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <span className="text-lg font-semibold pr-4">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">Still have questions?</p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/support')}
                className="gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                Visit Support Center
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary-dark/5 to-accent/5 shadow-elegant">
              <CardContent className="p-12 md:p-16 text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                    Ready to Transform Your Healthcare?
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join thousands of users who trust MedDoctor Hub for their health and wellness journey
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      onClick={() => navigate('/user-signin')}
                      className="gap-2 px-8 py-6 text-lg shadow-card"
                    >
                      Start Your Journey
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <Card className="border-destructive/50 bg-gradient-to-br from-destructive/5 to-destructive/10">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-destructive flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🚨</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Emergency Support</h2>
                  <p className="text-lg text-muted-foreground">
                    If you're experiencing a mental health emergency, please reach out immediately:
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-xl border bg-card p-6 text-center space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Emergency Services</div>
                  <div className="text-3xl font-bold text-destructive">102</div>
                </div>
                <div className="rounded-xl border bg-card p-6 text-center space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Crisis Helpline</div>
                  <div className="text-3xl font-bold text-destructive">112</div>
                </div>
                <div className="rounded-xl border bg-card p-6 text-center space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Suicide Prevention</div>
                  <div className="text-2xl font-bold text-destructive">1-800-273-8255</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">MedDoctor Hub</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Comprehensive mental health support and medical care platform built with care.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Platform</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Sign In', path: '/user-signin' },
                  { label: 'Mood Tracker', path: '/mood-tracker' },
                  { label: 'Chatbot', path: '/chatbot' },
                  { label: 'Stress Management', path: '/stress-management' }
                ].map((item) => (
                  <li key={item.label}>
                    <button 
                      onClick={() => navigate(item.path)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resources</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Doctor Portal', path: '/doctor-portal' },
                  { label: 'Find Doctors', path: '/doctor-finder' },
                  { label: 'Health Analytics', path: '/health-analytics' },
                  { label: 'Support Center', path: '/support' },
                  { label: 'FAQs', path: '/#faqs' }
                ].map((item) => (
                  <li key={item.label}>
                    <button 
                      onClick={() => navigate(item.path)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-destructive">Emergency</h3>
              <div className="space-y-3">
                {[
                  { label: 'Emergency', number: '102' },
                  { label: 'Crisis', number: '112' },
                  { label: 'Prevention', number: '1-800-273-8255' }
                ].map((contact) => (
                  <div key={contact.label} className="rounded-lg border bg-background p-3">
                    <div className="text-xs font-medium text-muted-foreground">{contact.label}</div>
                    <div className="text-lg font-bold text-destructive">{contact.number}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} MedDoctor Hub. All rights reserved. Built with ❤️ for better healthcare
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
