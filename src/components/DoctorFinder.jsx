import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  MapPin, 
  Video, 
  Building2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Small debounce helper to avoid excessive filtering
const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

const DEFAULT_FILTERS = {
  consultationType: '',
  specialties: [],
  sortBy: '',
  priceRange: [0, 1000],
};

const DoctorFinder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [filters, setFilters] = useState(() => {
    // Hydrate filters from URL on initial load
    const urlFilters = {
      consultationType: searchParams.get('consultationType') || '',
      specialties: searchParams.get('specialties') 
        ? searchParams.get('specialties').split(',') 
        : [],
      sortBy: searchParams.get('sortBy') || '',
      priceRange: [
        Number(searchParams.get('minFee') || 0),
        Number(searchParams.get('maxFee') || 1000),
      ],
    };
    return { ...DEFAULT_FILTERS, ...urlFilters };
  });

  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // === Auth bootstrap ===
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user ?? null);
    };
    checkAuth();
  }, []);

  // === Fetch doctors ===
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);

        const { data: doctorProfiles, error } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('is_approved', true);

        if (error) throw error;

        if (!doctorProfiles || doctorProfiles.length === 0) {
          setDoctors([]);
          setLoading(false);
          return;
        }

        const userIds = doctorProfiles.map((doctor) => doctor.user_id);

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map(
          (profilesData || []).map((profile) => [profile.user_id, profile])
        );

        const transformedDoctors = doctorProfiles.map((doctor) => {
          const profile = profileMap.get(doctor.user_id);
          return {
            id: doctor.user_id,
            name: profile?.full_name || 'Doctor',
            specialty: doctor.specialty,
            experience: doctor.years_experience || 0,
            fee: doctor.consultation_fee || 150, // fallback fee
            consultationType: doctor.consultation_type || 'video',
            rating: doctor.rating || 4.8,
            reviews: doctor.review_count || Math.floor(Math.random() * 500) + 50,
            image: doctor.profile_image_url || '/placeholder.svg',
            location: doctor.hospital_affiliation || 'Not specified',
            availability: doctor.availability_status || 'Available Today',
            licenseNumber: doctor.license_number,
          };
        });

        setDoctors(transformedDoctors);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        toast({
          title: 'Error',
          description: 'Failed to load doctors. Please refresh or try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [toast]);

  // === Derived data: specialties & filtered list ===
  const specialties = useMemo(
    () => [...new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean))],
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    let result = [...doctors];

    // Search
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(term) ||
          doctor.specialty.toLowerCase().includes(term) ||
          doctor.location.toLowerCase().includes(term)
      );
    }

    // Consultation type
    if (filters.consultationType) {
      result = result.filter(
        (doctor) => doctor.consultationType === filters.consultationType
      );
    }

    // Specialties
    if (filters.specialties.length > 0) {
      result = result.filter((doctor) =>
        filters.specialties.includes(doctor.specialty)
      );
    }

    // Price range
    result = result.filter(
      (doctor) =>
        doctor.fee >= filters.priceRange[0] && doctor.fee <= filters.priceRange[1]
    );

    // Sorting
    if (filters.sortBy === 'fees') {
      result.sort((a, b) => a.fee - b.fee);
    } else if (filters.sortBy === 'experience') {
      result.sort((a, b) => b.experience - a.experience);
    } else if (filters.sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [doctors, debouncedSearch, filters]);

  // === Sync filters + search into URL ===
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm) params.set('q', searchTerm);
    if (filters.consultationType) params.set('consultationType', filters.consultationType);
    if (filters.specialties.length > 0)
      params.set('specialties', filters.specialties.join(','));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);

    params.set('minFee', String(filters.priceRange[0]));
    params.set('maxFee', String(filters.priceRange[1]));

    setSearchParams(params, { replace: true });
  }, [filters, searchTerm, setSearchParams]);

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm('');
  };

  const handleBookAppointment = (doctor) => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to book an appointment.',
        variant: 'destructive',
      });
      navigate('/user-signin');
      return;
    }
    setSelectedDoctor(doctor);
    setShowBookingDialog(true);

    const today = new Date().toISOString().split('T')[0];
    setBookingDate(today);
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate || !bookingTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select a valid date and time.',
        variant: 'destructive',
      });
      return;
    }

    const appointmentDateTime = new Date(`${bookingDate}T${bookingTime}`);
    const now = new Date();

    if (appointmentDateTime <= now) {
      toast({
        title: 'Invalid Slot',
        description: 'Appointment time must be in the future.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('appointments').insert({
        patient_id: currentUser.id,
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDateTime.toISOString(),
        status: 'scheduled',
        notes: bookingNotes || null,
      });

      if (error) throw error;

      toast({
        title: 'Appointment Requested',
        description:
          'Your appointment request has been sent to the doctor for approval.',
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
        variant: 'destructive',
      });
    }
  };

  const DoctorCard = ({ doctor }) => (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100"
    >
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center">
          <div className="w-24 h-24 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
        </div>
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              doctor.availability === 'Available Today'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {doctor.availability}
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/80 text-slate-700 border border-slate-200">
            Lic: {doctor.licenseNumber || 'N/A'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{doctor.name}</h3>
            <p className="text-indigo-600 font-medium mt-1">
              {doctor.specialty || 'General Practitioner'}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm font-semibold text-slate-800">
                {doctor.rating?.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-1">
              {doctor.reviews} reviews
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm text-slate-600">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="truncate">{doctor.location}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>{doctor.experience} years experience</span>
          </div>
          <div className="flex items-center">
            {doctor.consultationType === 'video' ? (
              <Video className="w-4 h-4 mr-2" />
            ) : (
              <Building2 className="w-4 h-4 mr-2" />
            )}
            <span>
              {doctor.consultationType === 'video' ? 'Video Consult' : 'In Clinic'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-lg font-bold text-slate-900">
              ₹{doctor.fee}
            </span>
            <span className="ml-1 text-xs text-slate-500">per session</span>
          </div>
        </div>

        <Button
          onClick={() => handleBookAppointment(doctor)}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
        >
          Book Appointment
        </Button>
      </div>
    </motion.div>
  );

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-10 bg-slate-200 rounded-xl w-full mt-4" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Find Your Doctor
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                Discover trusted, verified healthcare professionals in seconds.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/user-dashboard')}
              className="rounded-xl border-slate-200"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search + Filter */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors by name, specialty, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
            <Button
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              variant="default"
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
            className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Consultation Type */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">
                  Consultation Type
                </h4>
                <div className="space-y-2 text-sm">
                  {['video', 'clinic'].map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="consultationType"
                        checked={filters.consultationType === type}
                        onChange={() =>
                          setFilters((prev) => ({
                            ...prev,
                            consultationType:
                              prev.consultationType === type ? '' : type,
                          }))
                        }
                        className="rounded border-slate-300"
                      />
                      <span className="capitalize">
                        {type === 'video' ? 'Video Consult' : 'In Clinic'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Specialties</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-sm">
                  {specialties.length === 0 && (
                    <p className="text-xs text-slate-500">
                      Specialties will appear once doctors are loaded.
                    </p>
                  )}
                  {specialties.map((specialty) => (
                    <label key={specialty} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.specialties.includes(specialty)}
                        onChange={(e) => {
                          setFilters((prev) => {
                            const exists = prev.specialties.includes(specialty);
                            return {
                              ...prev,
                              specialties: e.target.checked
                                ? [...prev.specialties, specialty]
                                : prev.specialties.filter((s) => s !== specialty),
                            };
                          });
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Sort By</h4>
                <div className="space-y-2 text-sm">
                  {['fees', 'experience', 'rating'].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={filters.sortBy === option}
                        onChange={() =>
                          setFilters((prev) => ({
                            ...prev,
                            sortBy: prev.sortBy === option ? '' : option,
                          }))
                        }
                        className="rounded border-slate-300"
                      />
                      <span className="capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between text-sm sm:text-base">
          <p className="text-slate-600">
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {loading ? '—' : filteredDoctors.length}
            </span>{' '}
            doctors
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No doctors found
            </h3>
            <p className="text-slate-600 mb-4 text-sm sm:text-base">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              onClick={clearFilters}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
            >
              Reset filters
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
                transition={{ delay: index * 0.05 }}
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
            <DialogTitle>
              Book Appointment {selectedDoctor && `with ${selectedDoctor.name}`}
            </DialogTitle>
            <DialogDescription>
              Select your preferred date and time for the appointment.
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
              <Input
                id="notes"
                placeholder="Any specific concerns or symptoms..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBookingDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} className="flex-1">
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorFinder;
