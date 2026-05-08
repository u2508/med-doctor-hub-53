import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Clock, DollarSign, MapPin, Video, Building2, Award, BadgeCheck, Sparkles, FileText, Users, Globe2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { findBestSpecialtyMatch, getSpecialtySearchTerms, normalizeSpecialty } from '@/lib/specialtyMapping';
import { demoDoctors } from '@/lib/demoDoctors';
import { getTriageAssessment } from '@/lib/triage';

const DoctorFinder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const specialtyParam = searchParams.get('specialty') || '';
  const triageId = searchParams.get('triageId') || '';
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    consultationType: '',
    specialties: [],
    sortBy: '',
    priceRange: [0, 1000]
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedProfileDoctor, setSelectedProfileDoctor] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [triageAssessment, setTriageAssessment] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [resolvedTriageSpecialty, setResolvedTriageSpecialty] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showTriageSummary, setShowTriageSummary] = useState(false);
  const specialtyAppliedRef = useRef('');
  const triageNotesPrefilledRef = useRef(false);

  const specialties = useMemo(() => [...new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean))], [doctors]);
  const specialtySearchTerms = useMemo(
    () => (specialtyParam ? getSpecialtySearchTerms(specialtyParam) : []),
    [specialtyParam],
  );
  const relatedSpecialties = useMemo(() => {
    if (!specialtyParam) return [];

    const suggestions = specialties.filter((specialty) => {
      const normalized = normalizeSpecialty(specialty);
      return normalized && normalized !== normalizeSpecialty(resolvedTriageSpecialty);
    });

    const generalFallback = specialties.find(
      (specialty) => normalizeSpecialty(specialty) === 'general physician',
    );

    const merged = [...suggestions.slice(0, 3)];
    if (generalFallback && !merged.includes(generalFallback)) {
      merged.push(generalFallback);
    }

    return merged;
  }, [specialties, specialtyParam, resolvedTriageSpecialty]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchTriageAssessment = async () => {
      if (!triageId || !currentUser) {
        setTriageAssessment(null);
        return;
      }

      try {
        setTriageLoading(true);
        const assessment = await getTriageAssessment(triageId);
        if (assessment && assessment.userId === currentUser.id) {
          setTriageAssessment(assessment);
        } else {
          setTriageAssessment(null);
        }
      } catch (err) {
        console.error('Failed to load triage assessment:', err);
        setTriageAssessment(null);
      } finally {
        setTriageLoading(false);
      }
    };

    fetchTriageAssessment();
  }, [currentUser, triageId]);

  // Fetch doctors from Supabase using secure public view
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        
        // Use the public_doctor_profiles view which only exposes safe fields
        // (excludes license_number and sensitive contact info)
        const { data: doctorProfiles, error } = await supabase
          .from('public_doctor_profiles')
          .select('*');

        if (error) throw error;

        if (!doctorProfiles || doctorProfiles.length === 0) {
          setIsDemoMode(true);
          setDoctors(demoDoctors);
          setFilteredDoctors(demoDoctors);
          setLoading(false);
          return;
        }

        setIsDemoMode(false);

        // Transform data to match component structure
        // Note: license_number is no longer exposed for security
        const transformedDoctors = doctorProfiles.map((doctor) => ({
          id: doctor.user_id,
          name: doctor.full_name || 'Doctor',
          specialty: doctor.specialty,
          experience: doctor.years_experience || 0,
          fee: null, // consultation_fee not in public view
          consultationType: 'video',
          image: '/placeholder.svg',
          location: doctor.hospital_affiliation || 'Not specified',
          availability: 'Available',
          rating: doctor.rating || 4.8,
          languages: Array.isArray(doctor.languages)
            ? doctor.languages
            : typeof doctor.languages === 'string'
              ? doctor.languages.split(',').map((language) => language.trim()).filter(Boolean)
              : [],
          consultations: doctor.consultations || doctor.total_consultations || null,
          verified: doctor.is_approved !== false,
          clinicName: doctor.hospital_affiliation || 'Not specified',
          demoLabel: null,
          isDemoDoctor: false,
        }));

        setDoctors(transformedDoctors);
        setFilteredDoctors(transformedDoctors);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        toast({
          title: 'Error',
          description: 'Failed to load doctors',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!specialtyParam) {
      specialtyAppliedRef.current = '';
      setResolvedTriageSpecialty('');
      return;
    }

    if (!doctors.length) return;
    if (specialtyAppliedRef.current === specialtyParam) return;

    const normalizedParam = normalizeSpecialty(specialtyParam);
    const exactMatch = specialties.find(
      (specialty) => normalizeSpecialty(specialty) === normalizedParam,
    );
    const matchedSpecialty = exactMatch || findBestSpecialtyMatch(specialtyParam, specialties);

    if (matchedSpecialty) {
      setFilters((current) => ({
        ...current,
        specialties: [matchedSpecialty],
      }));
      setResolvedTriageSpecialty(matchedSpecialty);
    } else {
      setResolvedTriageSpecialty(normalizedParam || specialtyParam);
      if (specialtySearchTerms.length > 0) {
        const fallbackSpecialties = specialties.filter((specialty) => {
          const normalized = normalizeSpecialty(specialty);
          return specialtySearchTerms.some((term) => normalized.includes(term) || term.includes(normalized));
        });

        if (fallbackSpecialties.length > 0) {
          setFilters((current) => ({
            ...current,
            specialties: fallbackSpecialties.slice(0, 3),
          }));
        }
      }
    }

    specialtyAppliedRef.current = specialtyParam;
  }, [doctors, specialtyParam, specialties, specialtySearchTerms]);

  useEffect(() => {
    if (!showBookingDialog) {
      triageNotesPrefilledRef.current = false;
      return;
    }

    if (!triageId || triageNotesPrefilledRef.current) return;

    const summary = triageAssessment?.appointmentSummary?.trim();
    if (summary) {
      setBookingNotes((current) => current.trim() ? current : summary);
      triageNotesPrefilledRef.current = true;
    }
  }, [showBookingDialog, triageAssessment, triageId]);

  // Filter doctors based on search and filters
  useEffect(() => {
    let result = doctors;

    // Search filter
    if (searchTerm) {
      result = result.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Consultation type filter
    if (filters.consultationType) {
      result = result.filter(doctor => doctor.consultationType === filters.consultationType);
    }

    // Specialty filter
    if (filters.specialties.length > 0) {
      result = result.filter(doctor => filters.specialties.includes(doctor.specialty));
    }

    // Price range filter (only apply if doctor has a fee)
    if (filters.priceRange[1] < 1000) {
      result = result.filter(doctor => 
        doctor.fee && doctor.fee >= filters.priceRange[0] && doctor.fee <= filters.priceRange[1]
      );
    }

    // Sorting
    if (filters.sortBy === 'fees') {
      result = [...result].sort((a, b) => (a.fee || 999999) - (b.fee || 999999));
    } else if (filters.sortBy === 'experience') {
      result = [...result].sort((a, b) => b.experience - a.experience);
    }

    setFilteredDoctors(result);
  }, [searchTerm, filters, doctors]);

  const clearFilters = () => {
    setFilters({
      consultationType: '',
      specialties: [],
      sortBy: '',
      priceRange: [0, 1000]
    });
    setSearchTerm('');
  };

  const handleBookAppointment = (doctor) => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to book an appointment',
        variant: 'destructive'
      });
      navigate('/user-signin');
      return;
    }
    setSelectedDoctor(doctor);
    setShowBookingDialog(true);
    setShowProfileDialog(false);
    triageNotesPrefilledRef.current = false;
    const summary = triageAssessment?.appointmentSummary?.trim();
    setBookingNotes(summary || '');
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    setBookingDate(today);
  };

  const handleConfirmBooking = async () => {
    if (selectedDoctor?.isDemoDoctor) {
      toast({
        title: 'Demo doctor profile',
        description: 'This is a demo doctor profile. Add real doctors in Supabase to enable booking.',
        variant: 'destructive'
      });
      setShowBookingDialog(false);
      setSelectedDoctor(null);
      return;
    }

    if (!bookingDate || !bookingTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select date and time',
        variant: 'destructive'
      });
      return;
    }

    setIsBooking(true);
    try {
      const appointmentDateTime = new Date(`${bookingDate}T${bookingTime}`);
      const triageSummary = triageAssessment?.appointmentSummary?.trim();
      const trimmedNotes = bookingNotes.trim();
      let notesToSave = trimmedNotes || null;

      if (triageId && triageSummary) {
        if (!trimmedNotes) {
          notesToSave = triageSummary;
        } else if (trimmedNotes === triageSummary) {
          notesToSave = trimmedNotes;
        } else {
          notesToSave = `${trimmedNotes}\n\nAI triage summary: ${triageSummary}`;
        }
      }
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: currentUser.id,
          doctor_id: selectedDoctor.id,
          appointment_date: appointmentDateTime.toISOString(),
          status: 'scheduled',
          notes: notesToSave,
          triage_assessment_id: triageAssessment?.id || null
        });

      if (error) throw error;

      toast({
        title: 'Appointment Requested',
        description: 'Your appointment request has been sent to the doctor for approval'
      });

        setShowBookingDialog(false);
        setBookingDate('');
        setBookingTime('');
        setBookingNotes('');
        setSelectedDoctor(null);
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to book appointment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsBooking(false);
    }
  };

  const openProfileDialog = (doctor) => {
    setSelectedProfileDoctor(doctor);
    setShowProfileDialog(true);
  };

  const getVisitSummary = () => {
    if (!triageAssessment) return '';

    const symptoms = triageAssessment.selectedSymptoms.length > 0
      ? triageAssessment.selectedSymptoms.join(', ')
      : 'None selected';

    return [
      `Chief complaint: ${triageAssessment.chiefComplaint}`,
      `Selected symptoms: ${symptoms}`,
      `Urgency: ${triageAssessment.urgency}`,
      `Recommended specialist: ${triageAssessment.recommendedSpecialty}`,
      triageAssessment.redFlags.length > 0
        ? `Red flags: ${triageAssessment.redFlags.join(', ')}`
        : 'Red flags: None noted in triage',
      `Doctor-ready summary: ${triageAssessment.appointmentSummary}`,
    ].join('\n');
  };

  const DoctorCard = ({ doctor }) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-card rounded-2xl shadow-elegant hover:shadow-glow transition-all duration-300 overflow-hidden border border-border/50"
    >
      <div className="relative">
        <div className="h-40 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 flex items-center justify-center">
          <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center shadow-lg ring-4 ring-background">
            <Award className="w-12 h-12 text-primary" />
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-success/10 text-success backdrop-blur-sm">
            {doctor.availability}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-2xl font-bold text-foreground mr-2">{doctor.name}</h3>
          {doctor.demoLabel && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {doctor.demoLabel}
            </span>
          )}
          {doctor.verified && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified profile
            </span>
          )}
        </div>
        <p className="text-primary font-semibold mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" />
          {doctor.specialty}
        </p>

        <div className="space-y-3 mb-5">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 text-primary/70" />
            <span>{doctor.location}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2 text-primary/70" />
            <span>{doctor.experience} years experience</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            {doctor.consultationType === 'video' ? (
              <Video className="w-4 h-4 mr-2 text-primary/70" />
            ) : doctor.consultationType === 'clinic' ? (
              <Building2 className="w-4 h-4 mr-2 text-primary/70" />
            ) : (
              <FileText className="w-4 h-4 mr-2 text-primary/70" />
            )}
            <span>
              {doctor.consultationType === 'video'
                ? 'Video Consult'
                : doctor.consultationType === 'clinic'
                  ? 'In Clinic'
                  : 'Video + Clinic'}
            </span>
          </div>
          {typeof doctor.rating === 'number' && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 mr-2 text-primary/70" />
              <span>{doctor.rating.toFixed(1)} rating</span>
            </div>
          )}
          {typeof doctor.consultations === 'number' && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2 text-primary/70" />
              <span>{doctor.consultations.toLocaleString()} consultations</span>
            </div>
          )}
          {Array.isArray(doctor.languages) && doctor.languages.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe2 className="w-4 h-4 mr-2 text-primary/70" />
              <span>{doctor.languages.join(', ')}</span>
            </div>
          )}
          {doctor.fee && (
            <div className="flex items-center text-sm font-semibold text-success pt-2 border-t border-border">
              <DollarSign className="w-5 h-5 mr-1" />
              <span className="text-lg">{doctor.fee}</span>
              <span className="text-muted-foreground ml-1">/ session</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => handleBookAppointment(doctor)}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg transition-all duration-300"
            size="lg"
          >
            Book Appointment
          </Button>
          <Button
            onClick={() => openProfileDialog(doctor)}
            variant="outline"
            size="lg"
            className="w-full"
          >
            View Profile
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-elegant border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-4xl font-bold text-gradient">
                Find Your Doctor
              </h1>
              <p className="text-muted-foreground mt-1.5">Connect with experienced healthcare professionals</p>
            </div>
            <Button
              onClick={() => navigate('/user-dashboard')}
              variant="outline"
              className="shadow-sm"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Search and Filter Bar */}
        <div className="mb-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative w-full flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search doctors by name, specialty, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 w-full rounded-2xl border-border bg-card pl-14 pr-4 text-base shadow-sm transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="default"
              className="h-14 shrink-0 gap-2 px-6 shadow-sm"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-10 bg-card rounded-2xl shadow-elegant border border-border p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">Filters</h3>
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-primary"
              >
                Clear all
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Consultation Type */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Consultation Type</h4>
                <div className="space-y-2">
                  {['video', 'clinic'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="consultationType"
                        checked={filters.consultationType === type}
                        onChange={() => setFilters({...filters, consultationType: type})}
                        className="mr-2"
                      />
                      <span className="capitalize text-muted-foreground">{type === 'video' ? 'Video Consult' : 'In Clinic'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Specialties</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {specialties.map(specialty => (
                    <label key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.specialties.includes(specialty)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, specialties: [...filters.specialties, specialty]});
                          } else {
                            setFilters({...filters, specialties: filters.specialties.filter(s => s !== specialty)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-muted-foreground">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Sort By</h4>
                <div className="space-y-2">
                  {['fees', 'experience'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={filters.sortBy === option}
                        onChange={() => setFilters({...filters, sortBy: option})}
                        className="mr-2"
                      />
                      <span className="capitalize text-muted-foreground">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Summary */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredDoctors.length}</span> doctors
          </p>
          <div className="hidden gap-2 lg:flex">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified profile
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Patient-ready booking
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              Secure consultation notes
            </span>
          </div>
        </div>

        {specialtyParam && (
          <div className="mb-8 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Recommended based on your triage report
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Showing doctors recommended from your AI triage: {resolvedTriageSpecialty || normalizeSpecialty(specialtyParam)}
                </p>
                {relatedSpecialties.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Related specialists: {relatedSpecialties.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {triageLoading && (
                  <p className="text-sm text-muted-foreground">
                    Loading saved triage summary...
                  </p>
                )}
                {triageAssessment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTriageSummary((current) => !current)}
                  >
                    {showTriageSummary ? 'Hide triage summary' : 'View triage summary'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {showTriageSummary && triageAssessment && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  View triage summary
                </p>
                <p className="text-lg font-semibold text-slate-950">
                  {triageAssessment.chiefComplaint}
                </p>
                <p className="text-sm text-muted-foreground">
                  Urgency: {triageAssessment.urgency.replace('_', ' ')} · Recommended specialist: {triageAssessment.recommendedSpecialty}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(getVisitSummary());
                      toast({
                        title: 'Copied',
                        description: 'Triage summary copied to clipboard'
                      });
                    } catch (error) {
                      console.error('Copy summary failed:', error);
                    }
                  }}
                >
                  <Copy className="mr-2 w-4 h-4" />
                  Copy summary
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/ai-triage`)}
                >
                  Start new triage
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Red flags</p>
                <p className="mt-2 text-sm text-slate-700">
                  {triageAssessment.redFlags.length > 0 ? triageAssessment.redFlags.join(', ') : 'None noted'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Questions patient wants to ask</p>
                <p className="mt-2 text-sm text-slate-700">
                  {triageAssessment.doctorQuestions.slice(0, 2).join(' · ') || 'None recorded'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Doctor-ready summary</p>
                <p className="mt-2 max-h-20 overflow-hidden text-sm text-slate-700">
                  {triageAssessment.appointmentSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {isDemoMode && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm">
            <p className="font-semibold">Demo doctor profiles are active.</p>
            <p className="mt-1 text-sm">
              These doctors are frontend-only placeholders for product demonstration. Add real doctors in Supabase to enable booking.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredDoctors.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No doctors found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
            <Button
              onClick={clearFilters}
              variant="default"
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Doctor Grid */}
        {!loading && filteredDoctors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <DoctorCard doctor={doctor} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment with {selectedDoctor?.name}</DialogTitle>
            <DialogDescription>
              Select your preferred date and time for the appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              {triageAssessment && (
                <p className="text-xs font-medium text-sky-700">
                  Attached triage summary from your AI health triage report.
                </p>
              )}
              <Textarea
                id="notes"
                placeholder="Any specific concerns or symptoms..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowBookingDialog(false)}
              className="flex-1"
              disabled={isBooking}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking}
              className="flex-1"
              disabled={isBooking}
            >
              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showProfileDialog}
        onOpenChange={(open) => {
          setShowProfileDialog(open);
          if (!open) {
            setSelectedProfileDoctor(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Doctor profile</span>
              {selectedProfileDoctor?.demoLabel && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {selectedProfileDoctor.demoLabel}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Review the doctor profile before you book a consultation.
            </DialogDescription>
          </DialogHeader>

          {selectedProfileDoctor && (
            <div className="space-y-4 py-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Specialty</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{selectedProfileDoctor.specialty}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedProfileDoctor.clinicName}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Experience</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">{selectedProfileDoctor.experience} years</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rating</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {typeof selectedProfileDoctor.rating === 'number'
                      ? `${selectedProfileDoctor.rating.toFixed(1)} / 5`
                      : '4.8 / 5'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Consultation type</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {selectedProfileDoctor.consultationType === 'video'
                      ? 'Video consult'
                      : selectedProfileDoctor.consultationType === 'clinic'
                        ? 'In clinic'
                        : 'Video + clinic'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Availability</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">{selectedProfileDoctor.availability}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Languages</p>
                <p className="mt-2 text-sm text-slate-700">
                  {Array.isArray(selectedProfileDoctor.languages) && selectedProfileDoctor.languages.length > 0
                    ? selectedProfileDoctor.languages.join(', ')
                    : 'Not specified'}
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => handleBookAppointment(selectedProfileDoctor)}>
                  Book Appointment
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowProfileDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorFinder;
