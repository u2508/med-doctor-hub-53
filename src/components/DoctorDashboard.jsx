import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, UserCheck, MessageCircle, BarChart3, Shield } from 'lucide-react';

const DoctorDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patient: 'John Doe',
      date: '2023-06-15',
      time: '10:00 AM',
      type: 'Video Consult',
      status: 'Confirmed'
    },
    {
      id: 2,
      patient: 'Jane Smith',
      date: '2023-06-15',
      time: '2:00 PM',
      type: 'In Clinic',
      status: 'Pending'
    },
    {
      id: 3,
      patient: 'Robert Johnson',
      date: '2023-06-16',
      time: '11:00 AM',
      type: 'Video Consult',
      status: 'Confirmed'
    }
  ]);

  const [doctorInfo, setDoctorInfo] = useState({
    name: user?.name || 'Dr. Smith',
    specialty: user?.specialty || 'General Physician',
    experience: '10 years',
    consultationFee: '$100',
    consultationType: 'Video & In Clinic',
    bio: 'Experienced physician with a focus on patient-centered care. Specialized in preventive medicine and chronic disease management.'
  });

  const handleUpdateProfile = () => {
    // In a real app, this would send data to the backend
    // Profile update - avoid logging sensitive data
    alert('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Doctor Profile</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your professional information</p>
              </div>
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                      <span className="text-2xl">👨‍⚕️</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900">{doctorInfo.name}</h4>
                    <p className="text-gray-600">{doctorInfo.specialty}</p>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <input
                        type="text"
                        value={doctorInfo.experience}
                        onChange={(e) => setDoctorInfo({...doctorInfo, experience: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Consultation Fee</label>
                      <input
                        type="text"
                        value={doctorInfo.consultationFee}
                        onChange={(e) => setDoctorInfo({...doctorInfo, consultationFee: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Consultation Type</label>
                      <input
                        type="text"
                        value={doctorInfo.consultationType}
                        onChange={(e) => setDoctorInfo({...doctorInfo, consultationType: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <textarea
                        rows={3}
                        value={doctorInfo.bio}
                        onChange={(e) => setDoctorInfo({...doctorInfo, bio: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    <button
                      onClick={handleUpdateProfile}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Update Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments and Stats */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Appointments</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your patient appointments</p>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <li key={appointment.id}>
                      <div className="px-4 py-5 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{appointment.patient}</h4>
                            <p className="text-sm text-gray-500">
                              {appointment.date} at {appointment.time} • {appointment.type}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'Confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status}
                            </span>
                            <button className="text-indigo-600 hover:text-indigo-900">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">💰</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">$1,200</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⭐</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Patient Rating</p>
                    <p className="text-2xl font-bold text-gray-900">4.8/5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
