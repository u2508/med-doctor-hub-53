# MedDoctor Hub - Comprehensive Healthcare Platform

A modern, full-stack healthcare platform that seamlessly integrates mental health support with medical care services. Built with React, TypeScript, and modern web technologies.

## 🏥 Overview

MedDoctor Hub is a unified healthcare platform that combines:
- **Mental Health Support**: AI-powered chatbot, mood tracking, stress management
- **Medical Services**: Doctor discovery, appointment booking, patient management
- **Telemedicine**: Virtual consultations and remote healthcare access
- **Data Analytics**: Health insights and progress tracking

## ✨ Key Features

### For Patients
- **🧠 Mental Health Support**
  - AI Chatbot for 24/7 emotional support
  - Mood tracking with visual analytics
  - Guided meditation and breathing exercises
  - Stress management tools and resources

- **🏥 Medical Services**
  - Advanced doctor search and filtering
  - Real-time appointment booking
  - Virtual consultation scheduling
  - Personal health dashboard
  - Medical history tracking

### For Healthcare Providers
- **👨‍⚕️ Doctor Dashboard**
  - Comprehensive patient management
  - Appointment scheduling system
  - Earnings and analytics tracking
  - Patient feedback and ratings
  - Profile management and visibility

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Tailwind CSS** for responsive styling
- **Shadcn/ui** for consistent UI components

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database
- **Real-time subscriptions** for live updates
- **Authentication & Authorization**

### State Management
- **React Query** for server state management
- **React Hook Form** for form handling
- **Zod** for schema validation

### UI/UX
- **Radix UI** for accessible components
- **Lucide React** for icons
- **Framer Motion** for animations
- **Responsive design** for all devices

## 📁 Project Structure

```
med-doctor-hub/
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Layout components (Header, Sidebar)
│   │   ├── patient/           # Patient-specific components
│   │   ├── ui/                # Reusable UI components
│   │   ├── Chatbot.jsx        # AI mental health chatbot
│   │   ├── DoctorFinder.jsx   # Doctor discovery interface
│   │   ├── MoodTracker.jsx    # Mood tracking component
│   │   ├── StressManagement.jsx # Stress relief tools
│   │   └── ...
│   ├── pages/
│   │   ├── Index.tsx          # Main landing page
│   │   └── NotFound.tsx       # 404 page
│   ├── hooks/                 # Custom React hooks
│   ├── integrations/          # Third-party integrations
│   │   └── supabase/          # Supabase client and types
│   ├── lib/                   # Utility functions
│   └── styles/                # Global styles
├── public/                    # Static assets
├── media/                     # Audio files and media
├── supabase/                  # Supabase configuration
└── ...
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/med-doctor-hub.git
cd med-doctor-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🔐 Authentication

The platform supports multiple user types:

### Patient Authentication
- Email/password registration
- Social login (Google, Apple)
- Two-factor authentication
- Password recovery

### Doctor Authentication
- Professional verification
- Medical license validation
- Secure credential management
- Multi-factor authentication

## 📊 Features in Detail

### Mental Health Suite
1. **AI Chatbot**
   - Natural language processing
   - Emotion detection
   - Crisis intervention protocols
   - Personalized recommendations

2. **Mood Tracker**
   - Daily mood logging
   - Energy level tracking
   - Activity correlation
   - Progress visualization
   - Export functionality

3. **Stress Management**
   - Guided breathing exercises
   - Meditation timer
   - Relaxation techniques
   - Progress tracking

### Medical Services
1. **Doctor Discovery**
   - Advanced search filters
   - Specialty-based browsing
   - Location-based search
   - Rating and review system
   - Availability calendar

2. **Appointment System**
   - Real-time booking
   - Calendar integration
   - Automated reminders
   - Cancellation management
   - Waitlist functionality

3. **Telemedicine**
   - Video consultation
   - Secure messaging
   - File sharing
   - Prescription management

## 🎯 Responsive Design

The application is fully responsive and optimized for:
- **Mobile devices** (iOS/Android)
- **Tablets** (iPad, Android tablets)
- **Desktop** (Windows, macOS, Linux)
- **Progressive Web App** (PWA) support

## 🔒 Security & Privacy

- **HIPAA compliant** data handling
- **End-to-end encryption** for communications
- **Secure authentication** protocols
- **Data anonymization** for analytics
- **GDPR compliance** for EU users

## 🏥 Medical Compliance

- **HIPAA** (Health Insurance Portability and Accountability Act)
- **HITECH** (Health Information Technology for Economic and Clinical Health Act)
- **FDA** guidelines for medical software
- **Telemedicine regulations** by jurisdiction

## 📱 Progressive Web App

The application can be installed as a PWA:
- **Offline functionality** for core features
- **Push notifications** for appointments
- **Home screen installation** on mobile devices
- **Background sync** for data updates

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚨 Important Notice

**Medical Disclaimer**: This platform provides support and guidance but is not a substitute for professional medical care. Always consult with qualified healthcare providers for medical concerns.

### Emergency Resources
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911
- **Find a Therapist**: [Psychology Today](https://www.psychologytoday.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** for the excellent component library
- **Supabase** for the backend infrastructure
- **React community** for the amazing ecosystem