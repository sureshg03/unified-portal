import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  ArrowDownTrayIcon, 
  PrinterIcon, 
  UserCircleIcon,
  IdentificationIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const StudentIDCard = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const idCardRef = useRef(null);

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

  const handlePrint = () => {
    if (idCardRef.current) {
      const printContent = idCardRef.current;
      const windowPrint = window.open('', '', 'width=800,height=600');
      
      if (windowPrint) {
        windowPrint.document.write(`
          <html>
            <head>
              <title>Student ID Card - ${student?.name || ''}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #f5f5f5;
                }
                @media print {
                  body {
                    background: white;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              </style>
            </head>
            <body>
              ${printContent.outerHTML}
            </body>
          </html>
        `);
        windowPrint.document.close();
        windowPrint.focus();
        setTimeout(() => {
          windowPrint.print();
          windowPrint.close();
        }, 250);
      }
    }
  };

  const handleDownload = async () => {
    if (!idCardRef.current) return;

    try {
      toast.info('Generating ID card PDF...');
      
      const canvas = await html2canvas(idCardRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
      pdf.save(`ID_Card_${student?.enrollment_no || 'student'}.pdf`);
      
      toast.success('ID card downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <IdentificationIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-xl font-semibold">No student data available</p>
          <p className="text-gray-500 mt-2">Please complete your profile first</p>
        </div>
      </div>
    );
  }

  if (!student.enrollment_no || student.enrollment_no === 'Pending') {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-8 max-w-md">
          <AcademicCapIcon className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-800 mb-3">ID Card Not Available Yet</h2>
          <p className="text-yellow-700 mb-2">Your enrollment is being processed.</p>
          <p className="text-yellow-600 text-sm">Your ID card will be available once your admission is confirmed and enrollment number is assigned.</p>
        </div>
      </div>
    );
  }

  const getAcademicYear = () => {
    if (student.enrollment_no && student.enrollment_no.length > 3) {
      const year = '20' + student.enrollment_no.substring(1, 3);
      const nextYear = (parseInt(year) + 1).toString().substring(2);
      return `${year}-${nextYear}`;
    }
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${(currentYear + 1).toString().substring(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-4 sm:py-6 lg:py-8 px-2 sm:px-4">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .id-card-front, .id-card-back {
            page-break-after: always;
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Enhanced Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 lg:mb-8 border border-purple-100"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5 lg:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <IdentificationIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Student ID Card
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-0.5 sm:mt-1 font-medium">
                  Official Academic Credential - {getAcademicYear()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
              >
                <PrinterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Print ID Card</span>
                <span className="sm:hidden">Print</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
              >
                <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">Download</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ID Card Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-5 lg:p-8"
        >
          <div className="flex flex-col items-center gap-4 sm:gap-6 lg:gap-8">
            <div ref={idCardRef} className="id-card-container w-full max-w-full overflow-x-auto">
              {/* Front Side - Professional Formal Design */}
              <div className="id-card-front relative overflow-hidden mx-auto" style={{ 
                width: '100%',
                maxWidth: '856px',
                minWidth: '320px',
                aspectRatio: '856/540',
                background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #1e3a8a',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                {/* Decorative Corner Patterns */}
                <div className="absolute top-0 left-0 w-32 h-32 opacity-5" style={{
                  background: 'radial-gradient(circle at top left, #1e3a8a 0%, transparent 70%)'
                }}></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5" style={{
                  background: 'radial-gradient(circle at bottom right, #1e3a8a 0%, transparent 70%)'
                }}></div>

                {/* Professional Header */}
                <div className="relative border-b-2 sm:border-b-3 lg:border-b-4 border-blue-900" style={{ 
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                }}>
                  <div className="flex items-center px-3 sm:px-5 lg:px-8 py-3 sm:py-4 lg:py-5">
                    {/* University Logo */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 sm:border-3 lg:border-4 border-white/20">
                        <img
                          src="/Logo.png"
                          alt="Periyar University Logo"
                          className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 object-contain"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64?text=PU';
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* University Name */}
                    <div className="flex-1 ml-3 sm:ml-4 lg:ml-6 text-center">
                      <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white uppercase tracking-wider mb-0.5 sm:mb-1" style={{
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                        letterSpacing: '0.05em'
                      }}>
                        PERIYAR UNIVERSITY
                      </h2>
                      <div className="h-px bg-white/40 w-3/4 mx-auto mb-1 sm:mb-2"></div>
                      <p className="text-white text-xs sm:text-sm lg:text-base font-semibold tracking-wide" style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        Centre for Distance & Online Education
                      </p>
                    </div>
                  </div>
                  
                  {/* ID Card Title Bar */}
                  <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 py-1 sm:py-1.5 lg:py-2 px-2 sm:px-3 lg:px-4">
                    <div className="flex items-center justify-between">
                      <div className="h-px bg-gray-700/20 flex-1"></div>
                      <h3 className="text-[10px] sm:text-xs lg:text-sm font-black text-gray-900 uppercase tracking-widest px-2 sm:px-4 lg:px-6" style={{
                        letterSpacing: '0.1em'
                      }}>
                        Student Identity Card
                      </h3>
                      <div className="h-px bg-gray-700/20 flex-1"></div>
                    </div>
                  </div>
                </div>

                {/* Card Body - Professional Layout */}
                <div className="relative px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
                    {/* Photo Section */}
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      <div className="relative">
                        {/* Photo Frame */}
                        <div className="w-28 h-36 sm:w-32 sm:h-40 lg:w-36 lg:h-44 rounded-lg overflow-hidden bg-white shadow-xl" style={{
                          border: '2px solid #1e3a8a',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}>
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                    <svg class="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <UserCircleIcon className="w-20 h-20 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Academic Year Badge */}
                        <div className="mt-1.5 sm:mt-2 bg-gradient-to-r from-blue-900 to-blue-800 text-white text-center py-1 sm:py-1.5 rounded-md shadow-lg">
                          <p className="text-[10px] sm:text-xs font-bold tracking-wide">{getAcademicYear()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Student Details Section */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="space-y-2 sm:space-y-2.5 lg:space-y-3">
                     

                        {/* Details Grid */}
                        <div className="space-y-1.5 sm:space-y-2 lg:space-y-2.5">
                          {/* Student Name - Prominent */}
                            <div className="flex items-center rounded-md p-1.5 sm:p-2 lg:p-2.5 shadow-sm">
                            <div className="w-24 sm:w-28 lg:w-32 text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wide flex-shrink-0">Student Name</div>
                            <div className="flex-shrink-0 mx-1 sm:mx-1.5 lg:mx-2 text-gray-400">:</div>
                            <div className="flex-1 text-xs sm:text-sm lg:text-base font-semibold text-gray-800 uppercase truncate">{student.name || 'N/A'}</div>
                          </div>
                          {/* Enrollment Number */}
                          <div className="flex items-center rounded-md p-1.5 sm:p-2 lg:p-2.5 shadow-sm">
                            <div className="w-24 sm:w-28 lg:w-32 text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wide flex-shrink-0">Enrollment No</div>
                            <div className="flex-shrink-0 mx-1 sm:mx-1.5 lg:mx-2 text-gray-400">:</div>
                            <div className="flex-1 text-xs sm:text-sm lg:text-base font-semibold text-blue-900 truncate">{student.enrollment_no || 'N/A'}</div>
                          </div>

                          {/* DEB ID */}
                          <div className="flex items-center rounded-md p-1.5 sm:p-2 lg:p-2.5 shadow-sm">
                            <div className="w-24 sm:w-28 lg:w-32 text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wide flex-shrink-0">DEB ID</div>
                            <div className="flex-shrink-0 mx-1 sm:mx-1.5 lg:mx-2 text-gray-400">:</div>
                            <div className="flex-1 text-xs sm:text-sm lg:text-base font-semibold text-blue-900 truncate">{student.deb_id || 'N/A'}</div>
                          </div>

                          {/* Programme */}
                          <div className="flex items-start rounded-md p-1.5 sm:p-2 lg:p-2.5 shadow-sm">
                            <div className="w-24 sm:w-28 lg:w-32 text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wide pt-0.5 flex-shrink-0">Programme</div>
                            <div className="flex-shrink-0 mx-1 sm:mx-1.5 lg:mx-2 text-gray-400">:</div>
                            <div className="flex-1 text-[10px] sm:text-xs lg:text-sm font-medium text-gray-800 leading-tight uppercase line-clamp-1">{student.programme || student.course || 'N/A'}</div>
                          </div>
                          {/* Date of Birth */}
                          <div className="flex items-center rounded-md p-1.5 sm:p-2 lg:p-2.5 shadow-sm">
                            <div className="w-24 sm:w-28 lg:w-32 text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wide flex-shrink-0">Date of Birth</div>
                            <div className="flex-shrink-0 mx-1 sm:mx-1.5 lg:mx-2 text-gray-400">:</div>
                            <div className="flex-1 text-[10px] sm:text-xs lg:text-sm font-medium text-gray-800">{student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Footer */}
                <div className="absolute bottom-0 w-full">
                  <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 lg:px-6 border-t border-blue-700">
                    <p className="text-white text-center text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest" style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                      letterSpacing: '0.05em'
                    }}>
                    Periyar University - Centre for Distance & Online Education
                    </p>
                  </div>
                </div>

              </div>

              {/* Back Side - Professional Formal Design */}
              <div className="id-card-back relative overflow-hidden mt-4 sm:mt-6 lg:mt-8 mx-auto" style={{ 
                width: '100%',
                maxWidth: '856px',
                minWidth: '320px',
                aspectRatio: '856/540',
                background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #1e3a8a',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                {/* Decorative Patterns */}
                <div className="absolute top-0 right-0 w-40 h-40 opacity-5" style={{
                  background: 'radial-gradient(circle at top right, #1e3a8a 0%, transparent 70%)'
                }}></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 opacity-5" style={{
                  background: 'radial-gradient(circle at bottom left, #1e3a8a 0%, transparent 70%)'
                }}></div>

                {/* Professional Header */}
                <div className="relative border-b-2 sm:border-b-3 lg:border-b-4 border-blue-900" style={{ 
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                }}>
                  <div className="py-3 sm:py-4 lg:py-5 px-3 sm:px-5 lg:px-8">
                    <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white uppercase tracking-widest text-center" style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                      letterSpacing: '0.1em'
                    }}>
                      Contact Information
                    </h3>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 h-1 sm:h-1.5 lg:h-2"></div>
                </div>

                {/* Content Section */}
                <div className="relative px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {/* Residential Address */}
                    <div className="sm:rounded-xl p-2.5 sm:p-3 lg:p-4 shadow-lg ">
                      <div className="flex items-start gap-2 sm:gap-2.5 lg:gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center shadow-md">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1 sm:mb-1.5">
                            Residential Address
                          </h4>
                          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-800 leading-relaxed font-medium break-words">
                            {student.comm_town || student.comm_district || student.comm_state ? 
                              `${student.comm_town || ''}${student.comm_town && student.comm_district ? ', ' : ''}${student.comm_district || ''}${(student.comm_town || student.comm_district) && student.comm_state ? ', ' : ''}${student.comm_state || ''}${student.comm_pincode ? ' - ' + student.comm_pincode : ''}` 
                              : 'Address not available'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Details Grid */}
                    <div className="grid grid-cols-1 gap-2 sm:gap-2.5 lg:gap-3">
                      {/* Mobile Number */}
                      <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-3.5 shadow-lg">
                        <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center shadow-md">
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">
                              Mobile Number
                            </h4>
                            <p className="text-xs sm:text-sm lg:text-base font-bold text-blue-900 truncate">
                              {student.mobile || student.phone || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-3.5 shadow-lg ">
                        <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center shadow-md">
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">
                              Email Address
                            </h4>
                            <p className="text-[10px] sm:text-xs lg:text-xs font-semibold text-blue-900 truncate">
                              {student.email || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Learning Support Centre */}
                      <div className="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-3.5 shadow-lg border border-blue-100">
                        <div className="flex items-start gap-2 sm:gap-2.5 lg:gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center shadow-md">
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">
                              Learning Support Centre
                            </h4>
                            <p className="text-[10px] sm:text-xs lg:text-xs font-semibold text-blue-900 break-words leading-tight">
                              {student.lsc_code && student.lsc_name
                                ? `${student.lsc_code} - ${student.lsc_name}`
                                : 'CDOE - Centre for Distance and Online Education'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Notice Footer */}
                <div className="absolute bottom-0 w-full">
                  <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 py-1 sm:py-1.5 lg:py-2 px-3 sm:px-4 lg:px-6 border-t border-red-800">
                    <p className="text-white text-center text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-wider" style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}>
                      ⚠ This is a system generated ID card; no signature required.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 lg:px-6">
                    <p className="text-white text-center text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest" style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                      letterSpacing: '0.05em'
                    }}>
                     Contact: +91-9444708425
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentIDCard;
