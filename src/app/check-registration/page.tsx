'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import QRCodeSVG from 'react-qr-code';
import Link from 'next/link';

export default function CheckRegistrationPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<{
    name: string;
    email: string;
    phone?: string;
    gender?: string;
    tableNumber: number;
    seatNumber: number;
    checkedIn?: boolean;
    checkedInAt?: string;
    registeredAt?: Date | string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setNotFound(false);
    setRegistration(null);

    try {
      const response = await fetch(`/api/register?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.exists && data.registration) {
        setRegistration(data.registration);
        toast.success('Registration found!');
      } else {
        setNotFound(true);
        toast.error('No registration found for this email', {
          description: 'Please check your email or register first.',
        });
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      toast.error('Failed to check registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setRegistration(null);
    setNotFound(false);
    setShowQR(false);
  };

  const registrationData = registration ? JSON.stringify({
    name: registration.name,
    email: registration.email,
    table: registration.tableNumber,
    seat: registration.seatNumber,
    phone: registration.phone,
    gender: registration.gender,
    event: 'CACSAUI Love Feast',
  }) : '';

  return (
    <main className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-50 rounded-full opacity-30 blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            Check Registration
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto">
            Enter your email to view your registration details and QR code
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!registration ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-10 shadow-lg"
            >
              <form onSubmit={handleCheck} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-blue-500 focus:ring-0 transition-all"
                      placeholder="your@email.com"
                      disabled={loading}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Not Found Message */}
                {notFound && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 mb-1">
                          Registration Not Found
                        </p>
                        <p className="text-xs text-red-700">
                          No registration found for <strong>{email}</strong>. Please check your email or{' '}
                          <Link href="/" className="underline hover:text-red-900">register here</Link>.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking...
                    </span>
                  ) : (
                    'Check Registration'
                  )}
                </button>
              </form>

              {/* Back Link */}
              <div className="mt-6 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Back to Registration
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-10 shadow-lg"
            >
              {/* Success Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Registration Details */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                  Registration Found!
                </h2>
                <p className="text-neutral-600">Here are your Love Feast details</p>
              </div>

              {/* Details Grid */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center p-4 bg-neutral-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Name</p>
                    <p className="text-lg font-semibold text-neutral-900">{registration.name}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-neutral-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Email</p>
                    <p className="text-lg font-semibold text-neutral-900 break-all">{registration.email}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-neutral-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Phone</p>
                    <p className="text-lg font-semibold text-neutral-900">{registration.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-neutral-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Gender</p>
                    <p className="text-lg font-semibold text-neutral-900">{registration.gender || 'N/A'}</p>
                  </div>
                </div>

                {/* Table Assignment - Highlighted */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                  <p className="text-xs text-blue-700 uppercase tracking-wide mb-2 font-semibold">
                    Your Assignment
                  </p>
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-600">
                        {registration.tableNumber}
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">Table</p>
                    </div>
                    <div className="w-px h-12 bg-blue-200"></div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-purple-600">
                        {registration.seatNumber}
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">Seat</p>
                    </div>
                  </div>
                </div>

                {/* Registration Time */}
                {registration.registeredAt && (
                  <div className="flex items-center p-4 bg-neutral-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">Registered</p>
                      <p className="text-lg font-semibold text-neutral-900">
                        {new Date(registration.registeredAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code Section */}
              <div className="mb-8">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-colors"
                >
                  {showQR ? 'Hide QR Code' : 'Show QR Code for Check-in'}
                </button>

                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-6 bg-white border-2 border-neutral-200 rounded-lg flex flex-col items-center"
                    >
                      <div className="bg-white p-4 rounded-lg shadow-inner">
                        <QRCodeSVG value={registrationData} size={200} level="H" />
                      </div>
                      <p className="mt-4 text-sm text-neutral-600 text-center">
                        Show this QR code at check-in
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-colors"
                >
                  Check Another Email
                </button>
                <Link
                  href="/"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all text-center"
                >
                  Back to Home
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
