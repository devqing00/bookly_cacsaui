'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import RegistrationForm from '@/components/RegistrationForm';
import ConfirmationDisplay from '@/components/ConfirmationDisplay';
import type { RegistrationResponse } from '@/types';

export default function Home() {
  const [registrationResult, setRegistrationResult] = useState<RegistrationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegistration = async (name: string, email: string, phone: string, gender: string) => {
    setIsLoading(true);
    
    const loadingToast = toast.loading('Processing your registration...');
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, gender }),
      });

      const data: RegistrationResponse = await response.json();
      
      toast.dismiss(loadingToast);
      
      if (data.success) {
        if (data.isExisting) {
          toast.info('Welcome back! Here are your registration details.', {
            duration: 3000,
          });
        } else {
          toast.success(`Welcome ${name}! You've been assigned to Table ${data.tableNumber}`, {
            duration: 4000,
          });
          
          // Show capacity warnings if present
          if ('capacityWarning' in data && data.capacityWarning) {
            const warning = data.capacityWarning as { level: string; message: string; percent: number };
            if (warning.level === 'full') {
              toast.error(warning.message, {
                duration: 6000,
                icon: '🔴',
              });
            } else if (warning.level === 'warning') {
              toast.warning(warning.message, {
                duration: 5000,
                icon: '⚠️',
              });
            }
          }
        }
        setRegistrationResult(data);
      } else {
        toast.error(data.error || 'Registration failed. Please try again.', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.dismiss(loadingToast);
      toast.error('An unexpected error occurred. Please try again.', {
        duration: 5000,
        description: 'If the problem persists, please contact support.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRegistrationResult(null);
  };

  return (
    <main className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-green-50 rounded-full opacity-30 blur-3xl"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 mb-6 shadow-green">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 mb-4">
            CACSAUI Love Feast
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            Join us for an evening of fellowship and celebration at the University of Ibadan
          </p>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {!registrationResult ? (
            <RegistrationForm
              key="form"
              onSubmit={handleRegistration}
              isLoading={isLoading}
            />
          ) : (
            <ConfirmationDisplay
              key="confirmation"
              name={registrationResult.name!}
              email={registrationResult.email}
              tableNumber={registrationResult.tableNumber!}
              seatNumber={registrationResult.seatNumber}
              isExisting={registrationResult.isExisting}
              phone={registrationResult.phone}
              gender={registrationResult.gender}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-16 text-xs text-neutral-500"
        >
          <p>© 2025 CACSAUI - University of Ibadan</p>
        </motion.div>
      </div>
    </main>
  );
}
