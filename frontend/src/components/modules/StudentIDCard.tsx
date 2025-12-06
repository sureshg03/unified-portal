import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft, Download, Printer, Shield, Award, BookOpen, GraduationCap, MapPin, Phone, Mail, Calendar, User, IdCard } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface StudentData {
  application_no: string;
  name: string;
  student_name?: string;
  name_initial?: string;
  enrollment_no: string;
  deb_id: string;
  programme: string;
  programme_applied?: string;
  dob: string;
  photo_url?: string;
  mobile?: string;
  phone?: string;
  contact_no?: string;
  contact_number?: string;
  telephone?: string;
  contact?: string;
  phone_number?: string;
  mobile_number?: string;
  email?: string;
  lsc_code?: string;
  lsc_name?: string;
  address?: string;
  comm_town?: string;
  comm_district?: string;
  comm_state?: string;
  comm_pincode?: string;
  gender?: string;
  blood_group?: string;
  community?: string;
  eligibility_status?: string;
  eligibility_verified?: boolean;
  academic_year?: string;
  father_name?: string;
}

const StudentIDCard: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const idCardRef = useRef<HTMLDivElement>(null);
  
  // Extract application ID from URL - handle paths like /lsc/dashboard/admin/id-card/PU/ODL/LC2101/A25/0001
  const getApplicationId = () => {
    const path = window.location.pathname;
    const parts = path.split('/id-card/');
    if (parts.length > 1) {
      return parts[1]; // Returns everything after /id-card/
    }
    return params['*'] || params.applicationId || '';
  };
  
  const applicationId = getApplicationId();

  useEffect(() => {
    if (applicationId) {
      fetchStudentData();
    }
  }, [applicationId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/lsc-admin/student-details/${applicationId}/`
      );

      if (response.data?.status === 'success' && response.data?.data) {
        const data = response.data.data;
        
        // Format address if not already formatted
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
          // If photo_url doesn't start with http, prepend base URL
          photoUrl = photoUrl.startsWith('/') 
            ? `http://localhost:8000${photoUrl}` 
            : `http://localhost:8000/${photoUrl}`;
        }
        
        console.log('=== STUDENT DATA DEBUG ===');
        console.log('Raw API Response:', data);
        console.log('Photo URL:', photoUrl);
        console.log('Enrollment No (raw):', data.enrollment_no);
        console.log('Enrollment No (type):', typeof data.enrollment_no);
        console.log('Application No:', data.application_no);
        console.log('DEB ID:', data.deb_id);
        console.log('Phone/Mobile fields:', {
          mobile: data.mobile,
          phone: data.phone,
          contact_no: data.contact_no,
          contact_number: data.contact_number,
          telephone: data.telephone,
          contact: data.contact,
          phone_number: data.phone_number,
          mobile_number: data.mobile_number
        });
        console.log('Selected phone value:', data.mobile || data.phone || 'N/A');
        console.log('All available keys:', Object.keys(data));
        console.log('All fields with phone-like names:', Object.keys(data).filter(key => 
          key.toLowerCase().includes('phone') || 
          key.toLowerCase().includes('mobile') || 
          key.toLowerCase().includes('contact') ||
          key.toLowerCase().includes('tel')
        ));
        console.log('Values of phone-like fields:', Object.keys(data)
          .filter(key => 
            key.toLowerCase().includes('phone') || 
            key.toLowerCase().includes('mobile') || 
            key.toLowerCase().includes('contact') ||
            key.toLowerCase().includes('tel')
          )
          .reduce((obj, key) => ({ ...obj, [key]: data[key] }), {}));
        console.log('All fields:', {
          enrollment_no: data.enrollment_no,
          application_no: data.application_no,
          deb_id: data.deb_id,
          name: data.name,
          programme: data.programme
        });
        console.log('========================');
        
        setStudent({
          ...data,
          address: formattedAddress || 'Address not available',
          name: data.name || data.name_initial || data.student_name || 'N/A',
          programme: data.programme || data.programme_applied || 'N/A',
          mobile: data.mobile || data.phone || data.contact_no || data.contact_number || data.telephone || data.contact || data.phone_number || data.mobile_number || 'N/A',
          enrollment_no: data.enrollment_no || 'Pending',
          deb_id: data.deb_id || 'N/A',
          photo_url: photoUrl
        });
        
        console.log('Final mobile value set:', data.mobile || data.phone || data.contact_no || data.contact_number || data.telephone || data.contact || data.phone_number || data.mobile_number || 'N/A');
        
        toast.success('Student details loaded successfully');
      } else {
        toast.error('Failed to load student details');
      }
    } catch (error: any) {
      console.error('Error fetching student details:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load student details';
      toast.error(errorMsg);
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
        format: [85.6, 54] // ID card size (credit card size)
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
      pdf.save(`ID_Card_${student?.enrollment_no || student?.application_no}.pdf`);
      
      toast.success('ID card downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-xl">Student not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
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
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-5xl mx-auto">
        {/* Enhanced Professional Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                <IdCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Student ID Card
                </h1>
                <p className="text-gray-600 mt-1 font-medium">
                  Official Academic Credential - {student?.academic_year || 'Academic Year'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 border border-blue-400"
              >
                <Printer className="w-5 h-5" />
                <span className="font-medium">Print ID Card</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 border border-emerald-400"
              >
                <Download className="w-5 h-5" />
                <span className="font-medium">Download PDF</span>
              </button>
            </div>
          </div>
        </div>



        {/* ID Card Preview */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center gap-8">
            <div ref={idCardRef} className="id-card-container" style={{ width: '856px' }}>
              {/* Front Side - Clean Design */}
              <div className="id-card-front relative rounded-lg overflow-hidden border border-gray-300" style={{ width: '856px', height: '540px', background: '#ffffff' }}>

                {/* Green Header Section */}
                <div className="relative" style={{ background: 'linear-gradient(135deg, #0d7a5f 0%, #0a5f49 100%)' }}>
                  <div className="flex items-center justify-between px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <img
                          src="/Logo.png"
                          alt="Periyar University Logo"
                          className="h-16 w-16 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=PU';
                          }}
                        />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white uppercase">
                          PERIYAR UNIVERSITY
                        </h2>
                        <p className="text-white text-sm font-medium opacity-90">
                          Centre for Distance & Online Education
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Yellow accent bar */}
                  <div className="h-2" style={{ background: 'linear-gradient(90deg, #f59e0b 0%, #eab308 50%, #f59e0b 100%)' }}></div>
                  {/* ID Card label with year */}
                  <div className="bg-amber-400 text-center py-1">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Identity Card {student.enrollment_no && student.enrollment_no.length > 3 ? '20' + student.enrollment_no.substring(1, 3) + '-' + (parseInt('20' + student.enrollment_no.substring(1, 3)) + 1).toString().substring(2) : new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().substring(2)}
                    </span>
                  </div>
                </div>

                {/* Card Body - Clean Layout */}
                <div className="relative p-8 flex gap-8">
                  {/* Photo Section */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-40 h-48 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt={student.name}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                  <User class="w-16 h-16 text-gray-500" />
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <User className="w-16 h-16 text-gray-500" />
                          </div>
                        )}
                      </div>
                     
                    </div>
                  </div>

                  {/* Details Section - Clean List */}
                  <div className="flex-1">
                    <div className="space-y-5 text-gray-800">
                      <div className="flex items-start">
                        <div className="w-32 font-semibold">Name</div>
                        <div className="flex-shrink-0 mr-3">:</div>
                        <div className="flex-1 font-semibold text-gray-900">{student.name}</div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-32 font-semibold">Enroll. No</div>
                        <div className="flex-shrink-0 mr-3">:</div>
                        <div className="flex-1 font-semibold">{student.enrollment_no || 'N/A'}</div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-32 font-semibold">DEB ID</div>
                        <div className="flex-shrink-0 mr-3">:</div>
                        <div className="flex-1 font-semibold">{student.deb_id || 'N/A'}</div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-32 font-semibold">Programme</div>
                        <div className="flex-shrink-0 mr-3">:</div>
                        <div className="flex-1">{student.programme || 'N/A'}</div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-32 font-semibold">DOB</div>
                        <div className="flex-shrink-0 mr-3">:</div>
                        <div className="flex-1">{student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer - Green Bar */}
                <div className="absolute bottom-0 w-full bg-gradient-to-r from-teal-700 to-emerald-700 px-8 py-3">
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold uppercase tracking-wider">
                      Periyar University - Centre for Distance & Online Education
                    </p>
                  </div>
                </div>
              </div>

              {/* Back Side - Professional Design */}
              <div className="id-card-back relative rounded-lg overflow-hidden border border-gray-300 mt-8" style={{ width: '856px', height: '540px', background: '#ffffff' }}>

                {/* Professional Header */}
                <div className="bg-gradient-to-r from-slate-100 to-gray-200 border-b-2 border-gray-300 px-8 py-6">
                  <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                    Student Address Details
                  </h3>
                </div>

                {/* Content Section - Clean Professional Layout */}
                <div className="relative px-10 py-8">
                  <div className="space-y-8">

                    {/* Address Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h4 className="text-lg font-bold text-gray-800 uppercase mb-4 tracking-wide">
                        Residential Address
                      </h4>
                      <div className="text-gray-700 leading-relaxed text-base font-medium pl-4 border-l-2 border-gray-300">
                        {student.address || 'Address not available'}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h4 className="text-lg font-bold text-gray-800 uppercase mb-3 tracking-wide">
                          Mobile Number
                        </h4>
                        <p className="text-gray-700 text-base font-medium pl-4 border-l-2 border-gray-300">
                          {student.mobile || 'N/A'}
                        </p>
                      </div>

                      <div className="border-b border-gray-200 pb-4">
                        <h4 className="text-lg font-bold text-gray-800 uppercase mb-3 tracking-wide">
                          Learning Support Centre
                        </h4>
                        <p className="text-gray-700 text-base font-medium pl-4 border-l-2 border-gray-300">
                          {student.lsc_code && student.lsc_name
                            ? `${student.lsc_code} - ${student.lsc_name}`
                            : 'CDOE - Centre for Distance and Online Education'}
                        </p>
                      </div>
                    </div>

                    {/* Official Notice Section */}
                    <div className="mt-10 pt-6 border-t-2 border-gray-300">
                      <div className="text-center space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-gray-600 text-sm font-medium leading-relaxed">
                            This is a system generated identity card and does not require any signature.
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-700 text-sm font-semibold">
                            Official Document - Periyar University
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="text-center pt-4">
                      <div className="inline-block bg-white px-6 py-2 rounded border border-gray-300">
                        <span className="text-gray-700 font-medium text-sm">
                          Contact: +91-9444708425
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Footer */}
                <div className="absolute bottom-0 w-full bg-gradient-to-r from-teal-700 to-emerald-700 px-8 py-4">
                  <div className="text-center">
                    <p className="text-white text-sm font-bold uppercase tracking-widest">
                      Identity Card {student.enrollment_no && student.enrollment_no.length > 3 ? '20' + student.enrollment_no.substring(1, 3) + '-' + (parseInt('20' + student.enrollment_no.substring(1, 3)) + 1).toString().substring(2) : new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().substring(2)}
                    </p>
                    <div className="mt-1">
                      <span className="text-white text-xs font-medium">
                        Centre for Distance & Online Education
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentIDCard;
