import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, DollarSign, MapPin, Video, Building2, Calendar, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DoctorFinder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    checkAuth();
  }, []);

  // Fetch doctors from Supabase
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        
        // Fetch approved doctors
        const { data: doctorProfiles, error } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('is_approved', true);

        if (error) throw error;

        if (!doctorProfiles || doctorProfiles.length === 0) {
          setDoctors([]);
          setFilteredDoctors([]);
          setLoading(false);
          return;
        }

        // Fetch corresponding profiles for doctor names and contact
        const userIds = doctorProfiles.map((doctor) => doctor.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map((profilesData || []).map((profile) => [profile.user_id, profile]));

        // Transform data to match component structure
        const transformedDoctors = doctorProfiles.map((doctor) => {
          const profile = profileMap.get(doctor.user_id);
          return {
            id: doctor.user_id,
            name: profile?.full_name || 'Doctor',
            specialty: doctor.specialty,
            experience: doctor.years_experience || 0,
            fee: doctor.consultation_fee || null,
            consultationType: doctor.consultation_type || 'video',
            image: '/placeholder.svg',
            location: doctor.hospital_affiliation || 'Not specified',
            availability: 'Available',
            licenseNumber: doctor.license_number,
          };
        });

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

  // Get unique specialties from doctors data
  const specialties = [...new Set(doctors.map(doctor => doctor.specialty))];

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
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    setBookingDate(today);
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate || !bookingTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select date and time',
        variant: 'destructive'
      });
      return;
    }

    try {
      const appointmentDateTime = new Date(`${bookingDate}T${bookingTime}`);
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: currentUser.id,
          doctor_id: selectedDoctor.id,
          appointment_date: appointmentDateTime.toISOString(),
          status: 'scheduled',
          notes: bookingNotes || null
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
    }
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
        <h3 className="text-2xl font-bold text-foreground mb-1">{doctor.name}</h3>
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
            ) : (
              <Building2 className="w-4 h-4 mr-2 text-primary/70" />
            )}
            <span>{doctor.consultationType === 'video' ? 'Video Consult' : 'In Clinic'}</span>
          </div>
          {doctor.fee && (
            <div className="flex items-center text-sm font-semibold text-success pt-2 border-t border-border">
              <DollarSign className="w-5 h-5 mr-1" />
              <span className="text-lg">{doctor.fee}</span>
              <span className="text-muted-foreground ml-1">/ session</span>
            </div>
          )}
        </div>

        <Button 
          onClick={() => handleBookAppointment(doctor)}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg transition-all duration-300"
          size="lg"
        >
          Book Appointment
        </Button>
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
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-[3] w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors by name, specialty, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="default"
              className="flex items-center space-x-2 shadow-sm lg:w-auto w-full"
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
        </div>

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
            <Button 
              onClick={handleConfirmBooking}
              className="flex-1"
            >
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorFinder;
