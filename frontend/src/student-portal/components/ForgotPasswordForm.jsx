import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/forgot-password/`, { email });
      if (res.data.status === 'success') {
        toast.success('OTP sent');
        navigate('/student/otp-verification', { state: { email } });
      }
    } catch (err) {
      toast.error('Failed to send OTP');
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <button onClick={handleRequestOtp}>Send OTP</button>
      <ToastContainer />
    </div>
  );
};
export default ForgotPasswordForm;


