import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  DocumentTextIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ClockIcon, 
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const Guidelines = () => {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(true);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      } 
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1]
      } 
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto', 
      transition: { 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1]
      } 
    },
  };

  const instructions = [
    'Applications must be completed in all aspects. Incomplete applications are liable to be rejected without any intimation.',
    'Separate application should be submitted for each programme.',
    'Medium of instruction is only in English.',
    'Foreign nationals including NRIs with valid passports and visas issued by the Government of India and refugees will be considered for admission subject to their eligibility in terms of schooling and qualifying examinations passed.',
    'Candidate can select one elective out of 4 options in the application as Specialization in MBA programme.',
    'Self-attested copies of mark statements should be sent along with the filled-in application form (printed after online submission).',
    'Upload your photograph in jpg/png format.',
    'Fee paid will not be refunded if a student leaves the programme after admission.',
    'Fee prescribed is subject to revision by the University. The difference between existing fee and revised fee, if any, should be paid by the candidate at a later date as per the directions of the University.',
    'At the time of admission, the candidate has to pay Institution fee and Tuition fees.',
    'Candidate needs to pay the examination fee separately at the time of examination.',
    'The University is not responsible for any postal delay or loss in transit.',
    'The decision of the University is final on all matters related to admission.',
    'University has all rights to reject or cancel your admission at any point of time if we find any fault/discrepancy in your submitted application.',
  ];

  const certificates = [
    'Community certificate',
    'Transfer certificate',
    'Aadhar card',
    'Mark statements (10th, Higher Secondary, UG)',
    'UG-Degree/Provisional Certificate',
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* Header Section */}
      <motion.div 
        variants={cardVariants}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4"
        >
          <BuildingLibraryIcon className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Application Guidelines
        </h1>
        <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Please read the following guidelines carefully before submitting your application for the 2025-2026 academic year.
        </p>
      </motion.div>

      {/* Important Notice Banner */}
      <motion.div
        variants={cardVariants}
        className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Important Notice</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Ensure all information is accurate and complete. Incomplete or incorrect applications may be rejected without notice.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Instructions Section */}
      <motion.div
        variants={cardVariants}
        className="mb-6 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
      >
        <div
          className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 to-purple-50 cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition-colors duration-200"
          onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Instructions to Candidates
            </h2>
          </div>
          <motion.div
            animate={{ rotate: isInstructionsOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDownIcon className="w-6 h-6 text-gray-500" />
          </motion.div>
        </div>
        
        <AnimatePresence>
          {isInstructionsOpen && (
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="p-6 bg-white"
            >
              <div className="space-y-4">
                {instructions.map((instruction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-indigo-600">{index + 1}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">
                      {instruction}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Certificates Section */}
      <motion.div
        variants={cardVariants}
        className="mb-6 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
      >
        <div
          className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-pink-50 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-colors duration-200"
          onClick={() => setIsCertificatesOpen(!isCertificatesOpen)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PaperClipIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Required Certificates
            </h2>
          </div>
          <motion.div
            animate={{ rotate: isCertificatesOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDownIcon className="w-6 h-6 text-gray-500" />
          </motion.div>
        </div>
        
        <AnimatePresence>
          {isCertificatesOpen && (
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="p-6 bg-white"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certificates.map((certificate, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <CheckCircleIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-800">
                      {certificate}
                    </p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">Note:</span> All certificates must be self-attested and submitted along with the printed application form.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Submission Details */}
      <motion.div
        variants={cardVariants}
        className="mb-6 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
      >
        <div
          className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 cursor-pointer hover:from-blue-100 hover:to-cyan-100 transition-colors duration-200"
          onClick={() => setIsSubmissionOpen(!isSubmissionOpen)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Submission Details & Important Dates
            </h2>
          </div>
          <motion.div
            animate={{ rotate: isSubmissionOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDownIcon className="w-6 h-6 text-gray-500" />
          </motion.div>
        </div>
        
        <AnimatePresence>
          {isSubmissionOpen && (
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="p-6 bg-white"
            >
              {/* Submission Instructions */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  After completing the online application, print a hard copy and send it along with all required documents to:
                </p>
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <div className="flex items-start gap-3">
                    <BuildingLibraryIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">Address:</p>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        <strong>The Director</strong><br />
                        Centre for Distance and Online Education (CDOE)<br />
                        Periyar University<br />
                        Salem - 636011, Tamil Nadu
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarDaysIcon className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Last Date to Apply</h3>
                  </div>
                  <p className="text-lg font-bold text-green-700">March 31, 2026</p>
                  <p className="text-xs text-gray-600 mt-1">Online Application Deadline</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3 mb-2">
                    <ClockIcon className="w-5 h-5 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Hard Copy Submission</h3>
                  </div>
                  <p className="text-lg font-bold text-orange-700">April 5, 2026</p>
                  <p className="text-xs text-gray-600 mt-1">Document Submission Deadline</p>
                </div>
              </div>

              {/* Fee Information */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <BanknotesIcon className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Fee Information</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-700">Institution Fee:</span>
                      <span className="text-xl font-bold text-purple-700">₹1,000/-</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      To be paid during the application process. Examination fees to be paid separately.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        variants={cardVariants}
        className="mb-6 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
      >
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Contact Information
            </h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            For any queries or clarifications regarding the application process, please reach out to us:
          </p>
        </div>

        <div className="p-6 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Phone Contact 1 */}
            <motion.a
              href="tel:+914272345918"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <PhoneIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Phone</p>
                <p className="text-sm font-semibold text-gray-900">0427-2345918</p>
              </div>
            </motion.a>

            {/* Phone Contact 2 */}
            <motion.a
              href="tel:+914272345258"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <PhoneIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Phone</p>
                <p className="text-sm font-semibold text-gray-900">0427-2345258</p>
              </div>
            </motion.a>

            {/* Email Contact */}
            <motion.a
              href="mailto:pridedirector@periyaruniversity.ac.in"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:shadow-lg transition-all duration-200 group sm:col-span-2 lg:col-span-1"
            >
              <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                <EnvelopeIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 mb-0.5">Email</p>
                <p className="text-xs font-semibold text-gray-900 truncate">pridedirector@periyaruniversity.ac.in</p>
              </div>
            </motion.a>
          </div>

          {/* Office Hours */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Office Hours</h3>
            </div>
            <p className="text-xs text-gray-700">
              Monday to Friday: 9:30 AM - 5:30 PM<br />
              Saturday: 9:30 AM - 1:00 PM<br />
              <span className="text-red-600 font-medium">Sunday & Public Holidays: Closed</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer Note */}
      <motion.div
        variants={cardVariants}
        className="text-center p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200"
      >
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-800">Periyar University</span> reserves the right to make changes to these guidelines at any time. 
          Please check the official website regularly for updates.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Guidelines;