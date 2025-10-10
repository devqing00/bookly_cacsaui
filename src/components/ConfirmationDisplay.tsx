'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import confetti from 'canvas-confetti';
import QRCodeSVG from 'react-qr-code';
import { generateBadgePDF, downloadBadge } from '@/lib/badgeGenerator';
import { toast } from 'sonner';

interface ConfirmationDisplayProps {
  name: string;
  email?: string;
  tableNumber: number;
  tableName?: string;
  tent?: number;
  seatNumber?: number;
  isExisting?: boolean;
  phone?: string;
  gender?: string;
  onReset: () => void;
}

export default function ConfirmationDisplay({
  name,
  email = '',
  tableNumber,
  tableName = '',
  tent = 1,
  seatNumber = 1,
  isExisting = false,
  phone = '',
  gender = '',
  onReset,
}: ConfirmationDisplayProps) {
  const [scope, animate] = useAnimate();
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!isExisting) {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#d4a244', '#b8862f', '#5c2a2a', '#dc2626'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#d4a244', '#b8862f', '#5c2a2a', '#dc2626'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isExisting]);

  // Animate the table card flip
  useEffect(() => {
    const animateCard = async () => {
      await animate(
        '.table-card',
        { rotateY: [0, 180, 360], scale: [1, 1.05, 1] },
        { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      );
    };
    
    if (!isExisting) {
      animateCard();
    }
  }, [animate, isExisting]);

  const registrationData = JSON.stringify({
    name,
    email,
    tent: tent,
    table: tableNumber,
    tableName,
    seat: seatNumber,
    phone,
    gender,
    event: 'CACSAUI Love Feast',
  });

  // Handle badge download
  const handleDownloadBadge = async () => {
    try {
      const badge = await generateBadgePDF({
        name,
        email: email || '',
        phone,
        gender,
        tableNumber: tableNumber,
        tableName: tableName,
        tent: tent,
        seatNumber: seatNumber,
      });
      downloadBadge(badge, `${name.replace(/\s+/g, '_')}_Badge.pdf`);
      toast.success('Badge downloaded successfully!');
    } catch (error) {
      console.error('Error generating badge:', error);
      toast.error('Failed to generate badge. Please try again.');
    }
  };

  return (
    <motion.div
      ref={scope}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-md mx-auto"
    >
      {/* Decorative element */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-golden-500 to-transparent opacity-50"></div>
      
      <div className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-10 shadow-soft relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-golden-50 rounded-full -translate-y-20 translate-x-20 opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-burgundy-50 rounded-full translate-y-16 -translate-x-16 opacity-30"></div>
        
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center relative"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-burgundy-700 to-burgundy-800 flex items-center justify-center shadow-burgundy">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            {/* Animated ring */}
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-golden-500"
            ></motion.div>
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-center mb-8 relative"
        >
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mb-3">
            {isExisting ? 'Already Registered' : 'Registration Complete'}
          </h1>
          <p className="text-sm text-neutral-600">
            {isExisting ? 'Welcome back, ' : 'Welcome, '}
            <span className="font-medium text-burgundy-700">{name}</span>
          </p>
          {isExisting && (
            <p className="text-xs text-golden-600 mt-2">
              You were already registered for the Love Feast
            </p>
          )}
        </motion.div>

        {/* Table Assignment Card with 3D Flip Animation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="table-card border-2 border-golden-500 rounded-xl p-8 mb-6 text-center bg-gradient-to-br from-golden-50 to-white relative overflow-hidden shadow-soft"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,rgb(212,162,68)_1px,transparent_1px)] bg-[length:16px_16px]"></div>
          </div>
          
          {/* Tent Badge */}
          <div className="relative z-10 mb-4">
            <span className="inline-block text-xs font-bold text-burgundy-700 bg-burgundy-100 px-4 py-1.5 rounded-full uppercase tracking-widest">
              Tent {tent}
            </span>
          </div>
          
          {/* Table Name Header */}
          <div className="relative z-10 mb-6">
            <p className="text-xs font-medium text-burgundy-700 mb-2 uppercase tracking-widest">
              Your Assigned Table
            </p>
            <h2 className="text-2xl font-bold bg-gradient-to-br from-burgundy-700 to-burgundy-900 bg-clip-text text-transparent leading-relaxed">
              {tableName || `Table ${tableNumber}`}
            </h2>
          </div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="text-left flex-1">
              <p className="text-xs font-medium text-burgundy-700 mb-1 uppercase tracking-widest">
                Table Number
              </p>
              <div className="text-5xl font-bold bg-gradient-to-br from-burgundy-700 to-burgundy-800 bg-clip-text text-transparent tracking-tight">
                {tableNumber}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-burgundy-700 mb-1 uppercase tracking-widest">
                Seat
              </p>
              <div className="text-4xl font-bold bg-gradient-to-br from-burgundy-700 to-burgundy-800 bg-clip-text text-transparent">
                {seatNumber}
              </div>
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: i < seatNumber ? 1 : 0.3 }}
                  transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 200 }}
                  className={`w-6 h-6 rounded-full ${
                    i < seatNumber 
                      ? 'bg-gradient-to-br from-golden-500 to-golden-600' 
                      : 'bg-neutral-200'
                  } flex items-center justify-center`}
                >
                  {i < seatNumber && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  )}
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-neutral-600">
              {seatNumber} of 8 seats at your table
            </p>
          </div>
        </motion.div>

        {/* QR Code Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full py-3 px-4 border-2 border-neutral-200 hover:border-golden-500 rounded-lg text-sm font-medium text-neutral-700 hover:text-burgundy-700 hover:bg-golden-50 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
            {showQR ? 'Hide QR Code' : 'Show QR Code for Check-in'}
          </button>
          
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-6 bg-white border border-neutral-200 rounded-lg flex flex-col items-center"
            >
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={registrationData} size={180} level="H" />
              </div>
              <p className="text-xs text-neutral-500 mt-3 text-center">
                Show this QR code at check-in
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="border border-neutral-200 rounded-xl p-6 mb-8 bg-neutral-50 relative"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-golden-100 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-burgundy-700"></div>
              </div>
              <p className="text-sm text-neutral-600">
                Check your email for Love Feast details
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-golden-100 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-burgundy-700"></div>
              </div>
              <p className="text-sm text-neutral-600">
                Arrive 10 minutes before the Love Feast starts
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-golden-100 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-burgundy-700"></div>
              </div>
              <p className="text-sm text-neutral-600">
                Each table accommodates up to 8 guests
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Download Badge Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            onClick={handleDownloadBadge}
            className="w-full py-3 px-4 bg-gradient-to-r from-burgundy-700 to-burgundy-800 hover:from-burgundy-800 hover:to-burgundy-900 rounded-lg text-sm font-medium text-white shadow-soft hover:shadow-md transition-all duration-150 group"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Badge as PDF
            </span>
          </motion.button>

          {/* Register Another Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            onClick={onReset}
            className="w-full py-3 px-4 border-2 border-neutral-300 hover:border-golden-500 rounded-lg text-sm font-medium text-neutral-700 hover:text-burgundy-700 hover:bg-golden-50 transition-all duration-150 group"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {isExisting ? 'Back to Home' : 'Register Another Person'}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
