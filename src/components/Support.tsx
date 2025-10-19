import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, HelpCircle, Book, Video, FileText, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent Successfully",
      description: "Our support team will get back to you within 24 hours.",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@meddoctorhub.com',
      detail: 'Response within 24 hours',
      color: 'from-primary/20 to-primary/5'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+1 (555) 123-4567',
      detail: 'Mon-Fri, 9 AM - 6 PM EST',
      color: 'from-accent/20 to-accent/5'
    },
    {
      icon: MapPin,
      title: 'Office Location',
      description: '123 Healthcare Ave, Medical District',
      detail: 'San Francisco, CA 94102',
      color: 'from-primary-dark/20 to-primary-dark/5'
    }
  ];

  const resources = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Comprehensive guides and tutorials',
      link: '#'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      link: '#'
    },
    {
      icon: FileText,
      title: 'Knowledge Base',
      description: 'Articles and best practices',
      link: '#'
    },
    {
      icon: MessageCircle,
      title: 'Community Forum',
      description: 'Connect with other users',
      link: '#'
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Click on the "Forgot Password" link on the sign-in page. Enter your email address, and we\'ll send you instructions to reset your password. If you don\'t receive the email within 10 minutes, check your spam folder.'
    },
    {
      question: 'How do I update my profile information?',
      answer: 'Navigate to your dashboard and click on your profile icon in the top right corner. Select "Settings" from the dropdown menu, where you can update your personal information, contact details, and preferences.'
    },
    {
      question: 'Can I export my mood tracking data?',
      answer: 'Yes! Go to your Mood Tracker dashboard and click the "Export Data" button. You can download your mood history in CSV or PDF format for your records or to share with your healthcare provider.'
    },
    {
      question: 'How do I schedule an appointment with a doctor?',
      answer: 'Use the Doctor Finder feature to search for healthcare professionals. Once you find a doctor, click on their profile and select "Book Appointment." Choose your preferred date and time from their available slots.'
    },
    {
      question: 'Is my health data secure?',
      answer: 'Absolutely. We use bank-level encryption (256-bit SSL) to protect your data. All information is encrypted both in transit and at rest. We comply with HIPAA regulations and never share your data without your explicit consent.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and PayPal. For doctor consultations, payment methods may vary depending on the healthcare provider.'
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from your account settings. Go to Dashboard > Settings > Subscription > Cancel Plan. You\'ll have access to premium features until the end of your billing period.'
    },
    {
      question: 'Can I use MedDoctor Hub offline?',
      answer: 'Some features like viewing your mood history and accessing downloaded resources are available offline. However, real-time features like the AI chatbot and doctor consultations require an internet connection.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </motion.button>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/user-signin')}
              variant="ghost"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/doctor-portal')}
            >
              Doctor Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center">
              <HelpCircle className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold">
              Support Center
            </h1>
            <p className="text-xl text-muted-foreground">
              We're here to help you get the most out of MedDoctor Hub
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-elegant transition-all">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                      <method.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{method.title}</h3>
                    <p className="text-foreground font-medium">{method.description}</p>
                    <p className="text-sm text-muted-foreground">{method.detail}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-3xl">Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and our team will get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        placeholder="Tell us more about your question or issue..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2">
                      <Send className="w-5 h-5" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Help Resources</h2>
            <p className="text-xl text-muted-foreground">
              Explore our resources to find answers quickly
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className="h-full hover:shadow-card transition-all cursor-pointer">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                      <resource.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-16 bg-gradient-to-br from-destructive/5 to-destructive/10">
        <div className="container mx-auto px-6">
          <Card className="border-destructive/50">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-destructive flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🚨</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Emergency Support</h2>
                  <p className="text-lg text-muted-foreground">
                    If you're experiencing a mental health emergency, please reach out immediately
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
    </div>
  );
};

export default Support;
