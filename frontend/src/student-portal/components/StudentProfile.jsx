import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  IdentificationIcon,
  CalendarIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [useEmailOTP, setUseEmailOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await axios.get(
        'http://localhost:8000/api/user-profile/',
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        
        // Format address
        let formattedAddress = data.address;
        if (!formattedAddress && (data.comm_town || data.comm_district || data.comm_state)) {
          const addressParts = [
            data.comm_town,
            data.comm_district,
            data.comm_state,
            data.comm_pincode
          ].filter(Boolean);
          formattedAddress = addressParts.join(', ');
        }
        
        // Construct proper photo URL
        let photoUrl = data.photo_url;
        if (photoUrl && !photoUrl.startsWith('http')) {
          photoUrl = photoUrl.startsWith('/') 
            ? `http://localhost:8000${photoUrl}` 
            : `http://localhost:8000/${photoUrl}`;
        }
        
        setStudent({
          ...data,
          address: formattedAddress || 'Address not available',
          photo_url: photoUrl
        });
      } else {
        toast.error('Failed to load student details');
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { text: 'At least 8 characters long', met: newPassword.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
    { text: 'Contains number', met: /\d/.test(newPassword) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) }
  ];

  const handleSendOTP = async () => {
    try {
      setSendingOTP(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:8000/api/send-password-reset-otp/',
        {},
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        setOtpSent(true);
        toast.success('OTP sent to your email successfully!');
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!useEmailOTP && !currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (useEmailOTP && !otp) {
      toast.error('Please enter the OTP sent to your email');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (!passwordRequirements.every(req => req.met)) {
      toast.error('Password does not meet security requirements');
      return;
    }

    try {
      setIsChangingPassword(true);
      const token = localStorage.getItem('token');
      
      const payload = useEmailOTP
        ? { new_password: newPassword, otp: otp }
        : { old_password: currentPassword, new_password: newPassword };

      const endpoint = useEmailOTP
        ? 'http://localhost:8000/api/reset-password-with-otp/'
        : 'http://localhost:8000/api/change-password/';

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.status === 'success') {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setOtpSent(false);
        setUseEmailOTP(false);
      } else {
        toast.error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <UserCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-xl font-semibold">No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6 mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-900 rounded-lg flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            Student Profile
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 ml-13 sm:ml-15">View and manage your account information</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-3 sm:gap-4 mb-6 border-b border-gray-200 bg-white rounded-t-lg p-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'profile'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'password'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Change Password
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Profile Photo Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                  <div className="flex-1 text-center md:text-left order-2 md:order-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{student.name || 'N/A'}</h2>
                    <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4">{student.email || 'N/A'}</p>
                    {student.enrollment_no && student.enrollment_no !== 'Pending' && (
                      <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
                        <IdentificationIcon className="w-5 h-5 text-blue-900" />
                        <span className="font-semibold text-blue-900 text-sm sm:text-base">
                          Enrollment No: {student.enrollment_no}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative flex-shrink-0 order-1 md:order-2">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                <svg class="w-16 h-16 sm:w-20 sm:h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <UserCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <IdentificationIcon className="w-6 h-6" />
                    Personal Information
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">Student's basic personal details</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                          {student.name || 'Not Provided'}
                        </div>
                        <UserCircleIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium break-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                          {student.email || 'Not Provided'}
                        </div>
                        <EnvelopeIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                          {student.mobile || student.phone || 'Not Provided'}
                        </div>
                        <PhoneIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                          {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'Not Provided'}
                        </div>
                        <CalendarIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Father's Name */}
                    {student.father_name && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Father's Name
                        </label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                            {student.father_name}
                          </div>
                          <UserCircleIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    )}

                    {/* Gender */}
                    {student.gender && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Gender
                        </label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                            {student.gender}
                          </div>
                          <IdentificationIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <AcademicCapIcon className="w-6 h-6" />
                    Academic Information
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">Course and enrollment details</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Programme */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Programme <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                          {student.programme || student.course || 'Not Provided'}
                        </div>
                        <AcademicCapIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Application Number */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Application Number
                      </label>
                      <div className="relative">
                        <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                          {student.application_no || 'Not Provided'}
                        </div>
                        <IdentificationIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Enrollment Number */}
                    {student.enrollment_no && student.enrollment_no !== 'Pending' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Enrollment Number
                        </label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                            {student.enrollment_no}
                          </div>
                          <IdentificationIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    )}

                    {/* DEB ID */}
                    {student.deb_id && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          DEB ID
                        </label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                            {student.deb_id}
                          </div>
                          <ShieldCheckIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    )}

                    {/* Learning Support Centre */}
                    {(student.lsc_code || student.lsc_name) && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Learning Support Centre
                        </label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                            {student.lsc_code && student.lsc_name
                              ? `${student.lsc_code} - ${student.lsc_name}`
                              : student.lsc_code || student.lsc_name || 'Not Provided'}
                          </div>
                          <MapPinIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <MapPinIcon className="w-6 h-6" />
                    Address Information
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">Residential address details</p>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Residential Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium leading-relaxed min-h-[60px] flex items-start focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                        {student.address}
                      </div>
                      <MapPinIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Security Guidelines */}
              <div className="bg-blue-50 rounded-lg p-6 sm:p-8 border border-blue-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-900" />
                  Security Guidelines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 text-xs sm:text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Strong Password Tips:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Use a mix of letters, numbers, and symbols</li>
                      <li>• Avoid common words or personal information</li>
                      <li>• Make it at least 8 characters long</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Best Practices:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Change passwords regularly</li>
                      <li>• Don't reuse old passwords</li>
                      <li>• Keep your password confidential</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                  <LockClosedIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-900" />
                  Update Password
                </h3>

                {/* Method Toggle */}
                <div className="mb-6 flex gap-3 sm:gap-4">
                  <button
                    onClick={() => {
                      setUseEmailOTP(false);
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                      !useEmailOTP
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    Use Current Password
                  </button>
                  <button
                    onClick={() => {
                      setUseEmailOTP(true);
                      setCurrentPassword('');
                    }}
                    className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                      useEmailOTP
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    Use Email OTP
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 sm:space-y-6">
                  {!useEmailOTP ? (
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <LockClosedIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all text-sm sm:text-base"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? (
                            <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Email OTP <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2 sm:gap-3">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all text-sm sm:text-base"
                          placeholder="Enter OTP"
                          disabled={!otpSent}
                          required
                        />
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={sendingOTP || otpSent}
                          className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base whitespace-nowrap ${
                            otpSent
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-900 text-white hover:bg-blue-800'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {sendingOTP ? 'Sending...' : otpSent ? 'OTP Sent' : 'Send OTP'}
                        </button>
                      </div>
                      {otpSent && (
                        <p className="text-xs sm:text-sm text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          OTP has been sent to your email
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all text-sm sm:text-base"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  {newPassword && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Password Requirements:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                            <CheckCircleIcon 
                              className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${req.met ? 'text-green-600' : 'text-gray-300'}`} 
                            />
                            <span className={`text-[10px] sm:text-xs ${req.met ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                              {req.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all text-sm sm:text-base"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[10px] sm:text-xs text-red-600 mt-2">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex justify-center pt-3 sm:pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isChangingPassword || !passwordRequirements.every(req => req.met)}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-900 text-white rounded-lg font-semibold shadow-md hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          Change Password
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentProfile;
