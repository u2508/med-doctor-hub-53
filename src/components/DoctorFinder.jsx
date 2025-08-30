import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Clock, DollarSign, MapPin, Video, Building2, X, Heart, Calendar, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const DoctorFinder = () => {
  const navigate = useNavigate();
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

  // Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json');
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const data = await response.json();
        
        // Transform data to match our component structure
        const transformedDoctors = data.map((doctor, index) => ({
          id: index + 1,
          name: doctor.name,
          specialty: doctor.specialization,
          experience: doctor.experience,
          fee: doctor.consultation_fee,
          consultationType: doctor.consultation_type.toLowerCase(),
          rating: doctor.rating,
          image: doctor.image || "/placeholder.svg",
          reviews: Math.floor(Math.random() * 500) + 50,
          location: doctor.location || "New York, NY",
          availability: doctor.availability || "Available Today"
        }));
        
        setDoctors(transformedDoctors);
        setFilteredDoctors(transformedDoctors);
        setLoading(false);
      } catch (err) {
        console.warn('Failed to fetch doctors');
        setLoading(false);
        
        // Fallback to mock data if API fails
        const mockDoctors = [
          {
            id: 1,
            name: "Dr. Sarah Johnson",
            specialty: "General Physician",
            experience: 12,
            fee: 150,
            consultationType: "video",
            rating: 4.8,
            reviews: 234,
            image: "/placeholder.svg",
            location: "New York, NY",
            availability: "Available Today"
          },
          {
            id: 2,
            name: "Dr. Michael Chen",
            specialty: "Dermatologist",
            experience: 8,
            fee: 200,
            consultationType: "clinic",
            rating: 4.6,
            reviews: 189,
            image: "/placeholder.svg",
            location: "San Francisco, CA",
            availability: "Next Available: Tomorrow"
          },
          {
            id: 3,
            name: "Dr. Emily Rodriguez",
            specialty: "Psychiatrist",
            experience: 15,
            fee: 250,
            consultationType: "video",
            rating: 4.9,
            reviews: 312,
            image: "/placeholder.svg",
            location: "Los Angeles, CA",
            availability: "Available Today"
          }
        ];
        
        setDoctors(mockDoctors);
        setFilteredDoctors(mockDoctors);
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

    // Price range filter
    result = result.filter(doctor => 
      doctor.fee >= filters.priceRange[0] && doctor.fee <= filters.priceRange[1]
    );

    // Sorting
    if (filters.sortBy === 'fees') {
      result = [...result].sort((a, b) => a.fee - b.fee);
    } else if (filters.sortBy === 'experience') {
      result = [...result].sort((a, b) => b.experience - a.experience);
    } else if (filters.sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
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

  const DoctorCard = ({ doctor }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4">
            <img src={doctor.image} alt={doctor.name} className="w-20 h-20 rounded-full" />
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            doctor.availability === 'Available Today' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {doctor.availability}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{doctor.name}</h3>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium text-gray-700">{doctor.rating}</span>
            <span className="ml-1 text-sm text-gray-500">({doctor.reviews})</span>
          </div>
        </div>

        <p className="text-indigo-600 font-medium mb-3">{doctor.specialty}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {doctor.location}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            {doctor.experience} years experience
          </div>
          <div className="flex items-center text-sm text-gray-600">
            {doctor.consultationType === 'video' ? (
              <Video className="w-4 h-4 mr-2" />
            ) : (
              <Building2 className="w-4 h-4 mr-2" />
            )}
            {doctor.consultationType === 'video' ? 'Video Consult' : 'In Clinic'}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-gray-900">${doctor.fee}</span>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300">
          Book Appointment
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Find Your Doctor
              </h1>
              <p className="text-gray-600 mt-1">Connect with top-rated healthcare professionals</p>
            </div>
            <button
              onClick={() => navigate('/user-dashboard')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors by name, specialty, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
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
                <h4 className="font-medium text-gray-900 mb-3">Consultation Type</h4>
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
                      <span className="capitalize">{type === 'video' ? 'Video Consult' : 'In Clinic'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Specialties</h4>
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
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Sort By</h4>
                <div className="space-y-2">
                  {['fees', 'experience', 'rating'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={filters.sortBy === option}
                        onChange={() => setFilters({...filters, sortBy: option})}
                        className="mr-2"
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
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredDoctors.length}</span> doctors
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={clearFilters}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
            >
              Clear all filters
            </button>
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
    </div>
  );
};

export default DoctorFinder;
