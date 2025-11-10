import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, CreditCardIcon, DevicePhoneMobileIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const PaytmPaymentGateway = ({ isOpen, onClose, amount, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // select, processing, success
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (processing && paymentStep === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setPaymentStep('success');
              setTimeout(() => {
                onPaymentSuccess();
              }, 2000);
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [processing, paymentStep, onPaymentSuccess]);

  const handlePayment = () => {
    if (paymentMethod === 'upi' && !upiId) {
      toast.error('Please enter UPI ID');
      return;
    }
    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv)) {
      toast.error('Please fill all card details');
      return;
    }

    setProcessing(true);
    setPaymentStep('processing');
    setProgress(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Payment Step: Select Method */}
          {paymentStep === 'select' && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <CreditCardIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Paytm Payment</h2>
                    <p className="text-blue-100 text-sm">Secure & Fast Payment</p>
                  </div>
                </div>
              </div>

              {/* Amount Display */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Amount to Pay</span>
                  <span className="text-3xl font-bold text-blue-600">₹{amount}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose Payment Method</h3>
                
                <div className="space-y-3 mb-6">
                  {/* UPI Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${paymentMethod === 'upi' ? 'bg-blue-500' : 'bg-gray-200'}`}>
                          <DevicePhoneMobileIcon className={`h-6 w-6 ${paymentMethod === 'upi' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">UPI Payment</p>
                          <p className="text-sm text-gray-500">PhonePe, Google Pay, Paytm</p>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 ${
                        paymentMethod === 'upi' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'upi' && <CheckCircleIcon className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </motion.div>

                  {/* Card Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${paymentMethod === 'card' ? 'bg-blue-500' : 'bg-gray-200'}`}>
                          <CreditCardIcon className={`h-6 w-6 ${paymentMethod === 'card' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Credit/Debit Card</p>
                          <p className="text-sm text-gray-500">Visa, Mastercard, Rupay</p>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 ${
                        paymentMethod === 'card' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'card' && <CheckCircleIcon className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </motion.div>

                  {/* QR Code Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('qr')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'qr'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${paymentMethod === 'qr' ? 'bg-blue-500' : 'bg-gray-200'}`}>
                          <QrCodeIcon className={`h-6 w-6 ${paymentMethod === 'qr' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Scan QR Code</p>
                          <p className="text-sm text-gray-500">Scan & Pay instantly</p>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 ${
                        paymentMethod === 'qr' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'qr' && <CheckCircleIcon className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Payment Details Form */}
                <AnimatePresence mode="wait">
                  {paymentMethod === 'upi' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter UPI ID
                      </label>
                      <input
                        type="text"
                        placeholder="yourname@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Enter your UPI ID (e.g., 9876543210@paytm)
                      </p>
                    </motion.div>
                  )}

                  {paymentMethod === 'card' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 mb-6"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          maxLength="19"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            placeholder="12/25"
                            value={cardExpiry}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              setCardExpiry(value);
                            }}
                            maxLength="5"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <input
                            type="password"
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            maxLength="3"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'qr' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl text-center">
                        <div className="bg-white p-4 rounded-xl inline-block mb-4">
                          <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                            <QrCodeIcon className="h-32 w-32 text-gray-400" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Scan this QR code with any UPI app to make payment
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pay Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {processing ? 'Processing...' : `Pay ₹${amount}`}
                </motion.button>

                {/* Security Badge */}
                <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                  100% Safe & Secure Payment
                </div>
              </div>
            </>
          )}

          {/* Payment Step: Processing */}
          {paymentStep === 'processing' && (
            <div className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mx-auto w-20 h-20 mb-6"
              >
                <div className="w-full h-full border-4 border-blue-200 border-t-blue-600 rounded-full" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Payment...</h3>
              <p className="text-gray-600 mb-6">Please wait while we verify your payment</p>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-500">{progress}% Complete</p>
            </div>
          )}

          {/* Payment Step: Success */}
          {paymentStep === 'success' && (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircleIcon className="h-16 w-16 text-green-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-2">Your transaction has been completed</p>
              <p className="text-3xl font-bold text-green-600 mb-6">₹{amount}</p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-green-800">
                  ✅ Your application ID is being generated...
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaytmPaymentGateway;
