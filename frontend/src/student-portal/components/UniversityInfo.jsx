import React from 'react';
import { motion } from 'framer-motion';


// Note: Styles (e.g., .font-poppins, .font-lato) are defined in Dashboard.jsx
const UniversityInfo = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, type: 'spring', stiffness: 120 }}
    className="mb-8 w-full max-w-6xl mx-auto relative"
    whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
  >
    <div className="flex flex-col items-center text-center">
      <motion.img
        src="/Logo.png"
        alt="Periyar University Logo"
        className="w-24 h-24 md:w-28 md:h-28 mb-4 rounded-full shadow-xl ring-4 ring-purple-500"
        onError={(e) => (e.target.src = 'https://via.placeholder.com/144?text=Logo')}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400 }}
      />
      <h2 className="text-2xl md:text-3xl font-semibold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-600 mb-3 tracking-tight">
        Periyar University
      </h2>
      
      <p className="text-xs md:text-sm font-lato font-medium text-gray-600 mb-2 max-w-2xl leading-relaxed">
        State University - NAAC 'A+' Grade - NIRF Rank 94<br />
        State Public University Rank 40 - SDG Institutions Rank Band: 11-50<br />
        Salem-636011, Tamilnadu, India.
      </p>
      
      <div className="max-w-3xl">
        <h3 className="text-lg md:text-xl font-semibold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-yellow-500 tracking-tight">
          Centre for Distance and Online Education - CDOE
        </h3>
         <h3 className="text-lg md:text-xl font-semibold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-500 mb-3 tracking-tight">
         Open and Distance Learning
        </h3>
      </div>
    </div>
  </motion.div>
);

export default UniversityInfo;
