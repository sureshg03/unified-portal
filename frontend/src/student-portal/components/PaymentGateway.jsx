import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CreditCardIcon, LockClosedIcon, CheckCircleIcon, ShieldCheckIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const PaymentGateway = ({ isOpen, onClose, semester, amount, onPaymentSuccess }) => {
  const [step, setStep] = useState('form'); // 'form', 'processing', 'success'
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [errors, setErrors] = useState({});
  const [cardType, setCardType] = useState(''); // visa, mastercard, rupay, etc.

  const validateForm = () => {
    const newErrors = {};

    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
      newErrors.expiry = 'Please enter expiry date';
    }

    if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
      newErrors.cvv = 'Please enter a valid 3-digit CVV';
    }

    if (!cardDetails.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter cardholder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setStep('processing');

    // Simulate payment processing (UI delay only - actual processing done in backend)
    await new Promise(resolve => setTimeout(resolve, 2000));

    setStep('success');
    // Auto close after 2 seconds and call success callback with card details
    setTimeout(() => {
      onPaymentSuccess(cardDetails.cardNumber, cardDetails.cardholderName);
      onClose();
      setStep('form');
      setCardDetails({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: ''
      });
    }, 2000);
  };

  const detectCardType = (number) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^6/.test(cleaned)) return 'rupay';
    if (/^3[47]/.test(cleaned)) return 'amex';
    return '';
  };

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '');
    // Add space every 4 digits
    return digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleCardNumberChange = (e) => {
    const inputValue = e.target.value;
    // Allow typing and backspacing
    const digitsOnly = inputValue.replace(/\D/g, '');
    const formatted = formatCardNumber(digitsOnly);
    setCardDetails({ ...cardDetails, cardNumber: formatted });
    setCardType(detectCardType(digitsOnly));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Secure Payment</h2>
                  <p className="text-indigo-100 text-sm">Periyar University</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {step === 'form' && (
              <div>
                {/* Payment Details */}
                <div className="bg-gray-50 p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Semester</span>
                    <span className="font-semibold">{semester}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="text-2xl font-bold text-green-600">₹{amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Card Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={cardDetails.cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-lg font-mono tracking-wider bg-white"
                        maxLength="19"
                      />
                      {cardType && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 uppercase">
                          {cardType}
                        </div>
                      )}
                    </div>
                    {errors.cardNumber && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span className="font-medium">⚠</span> {errors.cardNumber}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={cardDetails.expiryMonth}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiryMonth: e.target.value })}
                          className="px-3 py-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium bg-white appearance-none cursor-pointer"
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                              {String(i + 1).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <select
                          value={cardDetails.expiryYear}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiryYear: e.target.value })}
                          className="px-3 py-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium bg-white appearance-none cursor-pointer"
                        >
                          <option value="">YY</option>
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i} value={String(25 + i)}>
                              {25 + i}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.expiry && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1 col-span-2">
                          <span className="font-medium">⚠</span> {errors.expiry}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-lg font-mono text-center bg-white"
                        maxLength="3"
                      />
                      {errors.cvv && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <span className="font-medium">⚠</span> {errors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value.toUpperCase() })}
                      placeholder="JOHN DOE"
                      className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium uppercase tracking-wide bg-white"
                    />
                    {errors.cardholderName && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span className="font-medium">⚠</span> {errors.cardholderName}
                      </p>
                    )}
                  </div>

                  {errors.general && (
                    <div className="bg-red-50 border-2 border-red-200 p-4">
                      <p className="text-red-600 text-sm font-medium">{errors.general}</p>
                    </div>
                  )}
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  className="w-full mt-6 bg-indigo-600 text-white py-4 font-semibold hover:bg-indigo-700 transition-all duration-200"
                >
                  Pay ₹{amount.toLocaleString()}
                </button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                  <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="relative w-20 h-20 mx-auto mb-6"
                >
                  <div className="absolute inset-0 border-4 border-indigo-200"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent"></div>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
                >
                  <ShieldCheckIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Processing Payment</h3>
                <p className="text-gray-600 mb-6">Securely processing your transaction...</p>
                <div className="max-w-xs mx-auto">
                  <div className="bg-gray-200 h-3 overflow-hidden">
                    <motion.div 
                      className="bg-indigo-600 h-3"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    ></motion.div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">Please do not close this window</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-green-500 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircleIcon className="h-14 w-14 text-white" />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gray-900 mb-3"
                >
                  Payment Successful!
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 text-lg mb-2"
                >
                  Your payment has been processed successfully
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium"
                >
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                  <span>Redirecting to student portal...</span>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentGateway;