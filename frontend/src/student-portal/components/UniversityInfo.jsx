import React from 'react';
import { motion } from 'framer-motion';

const UniversityInfo = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, type: 'spring', stiffness: 120 }}
    className="mb-8 w-full max-w-6xl mx-auto relative px-4"
    whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
  >
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap');
        
        .tamil-text {
          font-family: 'Noto Sans Tamil', sans-serif;
        }
        
        .university-header {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
          border: 2px solid #e0e7ff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 30px;
          gap: 20px;
        }
        
        .logo-section {
          flex: 0 0 170px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .logo-img {
          width: 160px;
          height: 160px;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
        }
        
        .text-section {
          flex: 1;
          text-align: center;
          padding: 0 20px;
        }
        
        .periyar-section {
          flex: 0 0 180px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .periyar-img {
          width: 160px;
          height: 130px;
          object-fit: contain;
          filter: grayscale(100%) contrast(1.2);
        }
        
        .tamil-title {
          font-size: 26px;
          font-weight: 700;
          color: #7c3aed;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }
        
        .tamil-subtitle {
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          margin: 2px 0;
          line-height: 1.4;
        }
        
        .english-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e40af;
          margin: 8px 0 4px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .university-info {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin: 3px 0;
          line-height: 1.5;
        }
        
        .location-info {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          margin: 3px 0;
        }
        
        /* Tablet Responsive (768px - 1023px) */
        @media (max-width: 1023px) and (min-width: 768px) {
          .header-content {
            padding: 16px 20px;
            gap: 15px;
          }
          
          .logo-section {
            flex: 0 0 120px;
          }
          
          .logo-img {
            width: 110px;
            height: 110px;
          }
          
          .periyar-section {
            flex: 0 0 130px;
          }
          
          .periyar-img {
            width: 120px;
            height: 100px;
          }
          
          .tamil-title {
            font-size: 20px;
          }
          
          .tamil-subtitle {
            font-size: 12px;
          }
          
          .english-title {
            font-size: 24px;
          }
          
          .university-info {
            font-size: 11px;
          }
          
          .location-info {
            font-size: 11px;
          }
        }
        
        /* Mobile Responsive (below 768px) */
        @media (max-width: 767px) {
          .header-content {
            flex-direction: column;
            padding: 20px 15px;
            gap: 15px;
          }
          
          .logo-section {
            flex: 0 0 auto;
            order: 1;
          }
          
          .logo-img {
            width: 100px;
            height: 100px;
          }
          
          .text-section {
            flex: 0 0 auto;
            order: 2;
            padding: 0;
          }
          
          .periyar-section {
            flex: 0 0 auto;
            order: 3;
          }
          
          .periyar-img {
            width: 120px;
            height: 100px;
          }
          
          .tamil-title {
            font-size: 18px;
          }
          
          .tamil-subtitle {
            font-size: 11px;
          }
          
          .english-title {
            font-size: 20px;
            margin: 6px 0 3px 0;
          }
          
          .university-info {
            font-size: 10px;
            margin: 2px 0;
          }
          
          .location-info {
            font-size: 10px;
          }
        }
        
        /* Extra Small Mobile (below 480px) */
        @media (max-width: 479px) {
          .header-content {
            padding: 15px 10px;
            gap: 12px;
          }
          
          .logo-img {
            width: 80px;
            height: 80px;
          }
          
          .periyar-img {
            width: 100px;
            height: 85px;
          }
          
          .tamil-title {
            font-size: 16px;
          }
          
          .tamil-subtitle {
            font-size: 10px;
          }
          
          .english-title {
            font-size: 18px;
          }
          
          .university-info {
            font-size: 9px;
          }
          
          .location-info {
            font-size: 9px;
          }
        }
        
        @media print {
          .university-header {
            border: 2px solid #000;
            box-shadow: none;
          }
        }
      `}
    </style>

    <div className="university-header">
      <div className="header-content">
        {/* Logo Section */}
        <div className="logo-section">
          <motion.img
            src="/Logo.png"
            alt="Periyar University Logo"
            className="logo-img"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/160?text=Logo')}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
        </div>

        {/* Text Section */}
        <div className="text-section">
          <h1 className="tamil-title tamil-text">
            பெரியார் பல்கலைக்கழகம்
          </h1>
          <p className="tamil-subtitle tamil-text">
            அரசு பல்கலைக்கழகம், சேலம்.
          </p>
          <h2 className="english-title">
            PERIYAR UNIVERSITY
          </h2>
          <p className="university-info">
            State University - NAAC 'A++' Grade - NIRF Rank 94
          </p>
          <p className="university-info">
            State Public University Rank 40 - SDG Institutions Rank Band: 11-50
          </p>
          <p className="location-info">
            Salem - 636 011, Tamil Nadu, India.
          </p>
        </div>

        {/* Periyar Image Section */}
        <div className="periyar-section">
          <motion.img
            src="/periyar.jpg"
            alt="Periyar E.V. Ramasamy"
            className="periyar-img"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/160x130?text=Periyar')}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
        </div>
      </div>
    </div>
  </motion.div>
);

export default UniversityInfo;