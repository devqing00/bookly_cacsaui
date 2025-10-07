'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import ConfirmationModal from './ConfirmationModal';

interface RegistrationFormProps {
  onSubmit: (name: string, email: string, phone: string, gender: string) => Promise<void>;
  isLoading: boolean;
}

export default function RegistrationForm({ onSubmit, isLoading }: RegistrationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; gender?: string }>({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<{
    name: string;
    email: string;
    phone?: string;
    gender?: string;
    tableNumber: number;
    seatNumber: number;
  } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Debounced email check
  useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailExists(false);
      setExistingRegistration(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const response = await fetch(`/api/register?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.exists) {
          setEmailExists(true);
          setExistingRegistration(data.registration);
        } else {
          setEmailExists(false);
          setExistingRegistration(null);
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setCheckingEmail(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [email]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string; phone?: string; gender?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      try {
        if (!isValidPhoneNumber(phone, 'US')) {
          newErrors.phone = 'Please enter a valid phone number';
        }
      } catch {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (!gender) {
      newErrors.gender = 'Please select your gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (emailExists) {
      toast.info('This email is already registered. Retrieving your details...');
      await onSubmit(name.trim(), email.trim().toLowerCase(), phone.trim(), gender);
    } else {
      // Show confirmation modal for new registrations
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSubmit = async () => {
    await onSubmit(name.trim(), email.trim().toLowerCase(), phone.trim(), gender);
    setShowConfirmModal(false);
  };

  const formatPhoneDisplay = (value: string) => {
    try {
      if (value && value.length > 3) {
        const phoneNumber = parsePhoneNumber(value, 'US');
        if (phoneNumber) {
          return phoneNumber.formatNational();
        }
      }
    } catch {
      // Return original if parsing fails
    }
    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-md mx-auto"
    >
      {/* Decorative element */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
      
      <div className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-10 shadow-soft relative overflow-hidden">
        {/* Subtle corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
        
        {/* Header */}
        <div className="mb-8 relative">
          <div className="inline-block p-2 bg-green-50 rounded-lg mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mb-2">
            Love Feast Registration
          </h1>
          <p className="text-sm text-neutral-600">
            Please provide your details to register for CACSAUI&apos;s Love Feast at University of Ibadan
          </p>
        </div>

        {/* Existing Registration Alert */}
        {emailExists && existingRegistration && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Already Registered
                </p>
                <p className="text-xs text-amber-700">
                  This email is registered at <strong>Table {existingRegistration.tableNumber}, Seat {existingRegistration.seatNumber}</strong>. 
                  Submit to view your details.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label 
              htmlFor="name" 
              className="block text-xs font-medium text-neutral-700 mb-2 tracking-wide uppercase"
            >
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                className={`block w-full px-4 py-3 border ${
                  errors.name 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-neutral-300 focus:border-green-500 bg-white'
                } rounded-lg text-neutral-900 placeholder-neutral-400 transition-all duration-150 focus:outline-none focus:ring-0 focus:shadow-soft`}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
              {!errors.name && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
            </div>
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-xs text-red-600"
              >
                {errors.name}
              </motion.p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-xs font-medium text-neutral-700 mb-2 tracking-wide uppercase"
            >
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`block w-full px-4 py-3 border ${
                  errors.email 
                    ? 'border-red-400 bg-red-50'
                    : emailExists
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-neutral-300 focus:border-green-500 bg-white'
                } rounded-lg text-neutral-900 placeholder-neutral-400 transition-all duration-150 focus:outline-none focus:ring-0 focus:shadow-soft`}
                placeholder="your@email.com"
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingEmail ? (
                  <svg className="w-5 h-5 text-neutral-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : emailExists ? (
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                ) : !errors.email && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                )}
              </div>
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-xs text-red-600"
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label 
              htmlFor="phone" 
              className="block text-xs font-medium text-neutral-700 mb-2 tracking-wide uppercase"
            >
              Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                className={`block w-full px-4 py-3 border ${
                  errors.phone 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-neutral-300 focus:border-green-500 bg-white'
                } rounded-lg text-neutral-900 placeholder-neutral-400 transition-all duration-150 focus:outline-none focus:ring-0 focus:shadow-soft`}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
              {!errors.phone && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
              )}
            </div>
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-xs text-red-600"
              >
                {errors.phone}
              </motion.p>
            )}
            {phone && !errors.phone && (
              <p className="mt-2 text-xs text-neutral-500">
                Formatted: {formatPhoneDisplay(phone)}
              </p>
            )}
          </div>

          {/* Gender Field */}
          <div>
            <label 
              htmlFor="gender" 
              className="block text-xs font-medium text-neutral-700 mb-2 tracking-wide uppercase"
            >
              Gender *
            </label>
            <div className="relative">
              <select
                id="gender"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  if (errors.gender) setErrors({ ...errors, gender: undefined });
                }}
                className={`block w-full px-4 py-3 border ${
                  errors.gender 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-neutral-300 focus:border-green-500 bg-white'
                } rounded-lg text-neutral-900 transition-all duration-150 focus:outline-none focus:ring-0 focus:shadow-soft appearance-none cursor-pointer`}
                disabled={isLoading}
              >
                <option value="">Select your gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
            {errors.gender && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-xs text-red-600"
              >
                {errors.gender}
              </motion.p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-8 shadow-green relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {emailExists ? 'Retrieving...' : 'Submitting...'}
                </>
              ) : (
                <>
                  {emailExists ? 'View My Registration' : 'Continue'}
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-6 border-t border-neutral-200 relative">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-xs text-neutral-500">
              Your information will be used solely for managing the Love Feast
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        formData={{ name, email, phone: formatPhoneDisplay(phone), gender }}
        isLoading={isLoading}
      />
    </motion.div>
  );
}
