'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Link from 'next/link';

interface CheckInResult {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  tableNumber: number;
  tableName?: string;
  seatNumber: number;
  checkedInAt: string;
}

export default function CheckInPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResult | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [mode, setMode] = useState<'scanner' | 'manual'>('scanner');

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        const data = await response.json();

        if (!data.authenticated) {
          // Redirect to admin login with return URL
          toast.error('Please login to access check-in');
          router.push('/admin?redirect=/check-in');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        toast.error('Authentication failed. Please login.');
        router.push('/admin?redirect=/check-in');
      }
    };
    
    checkAuthentication();
  }, [router]);

  const performCheckIn = useCallback(async (email: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ ${data.name} checked in successfully!`, {
          description: `${data.tableName || `Table ${data.tableNumber}`}, Seat ${data.seatNumber}`,
          duration: 5000,
        });
        
        setLastCheckIn(data);
        setManualEmail('');
      } else if (data.alreadyCheckedIn) {
        toast.error('Already checked in', {
          description: `Checked in at ${new Date(data.checkedInAt).toLocaleString()}`,
          duration: 4000,
        });
      } else {
        toast.error(data.error || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('An error occurred during check-in');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQRScan = useCallback(async (qrData: string) => {
    try {
      // Extract email from QR data
      // Format: "Name: John Doe\nEmail: john@example.com\n..."
      const emailMatch = qrData.match(/Email:\s*(.+?)(?:\n|$)/i);
      
      if (!emailMatch) {
        toast.error('Invalid QR code format');
        return;
      }

      const email = emailMatch[1].trim();
      await performCheckIn(email);
      
      // Pause scanner briefly after successful scan
      setScannerActive(false);
      setTimeout(() => {
        if (mode === 'scanner') {
          setScannerActive(true);
        }
      }, 3000);
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('Failed to process QR code');
    }
  }, [performCheckIn, mode]);

  // Initialize QR scanner (only if authenticated)
  useEffect(() => {
    const startScanner = async () => {
      try {
        setCameraError('');
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setCameraError('No camera found. Please use manual check-in.');
          setScannerActive(false);
          return;
        }

        // Prefer rear-facing camera (environment)
        // Look for cameras with 'back', 'rear', or 'environment' in the label
        let selectedDeviceId = videoInputDevices[0].deviceId;
        
        const rearCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (rearCamera) {
          selectedDeviceId = rearCamera.deviceId;
        } else if (videoInputDevices.length > 1) {
          // If we can't find by label, assume the last camera is the rear one (common pattern)
          selectedDeviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;
        }

        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result, error) => {
            if (result) {
              handleQRScan(result.getText());
            }
            if (error && !(error instanceof NotFoundException)) {
              console.error('Scanner error:', error);
            }
          }
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to access camera. Please use manual check-in.';
        console.error('Camera error:', error);
        setCameraError(errorMessage);
        setScannerActive(false);
      }
    };

    if (!isAuthenticated) return;

    if (mode === 'scanner' && scannerActive) {
      startScanner();
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
  }, [mode, scannerActive, isAuthenticated, handleQRScan]);

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScannerActive(false);
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    await performCheckIn(manualEmail.trim());
  };

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-golden-50 to-burgundy-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-burgundy-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">Verifying authentication...</p>
          <p className="text-neutral-500 text-sm mt-2">Redirecting to login if needed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-golden-50 to-burgundy-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Love Feast Check-In
          </h1>
          <p className="text-gray-600">
            Scan QR code or enter email to check in attendees
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-6 bg-white rounded-xl p-2 shadow-lg max-w-md mx-auto"
        >
          <button
            onClick={() => {
              setMode('scanner');
              setScannerActive(true);
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'scanner'
                ? 'bg-gradient-to-r from-burgundy-700 to-burgundy-800 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📷 QR Scanner
          </button>
          <button
            onClick={() => {
              setMode('manual');
              setScannerActive(false);
              stopScanner();
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'manual'
                ? 'bg-gradient-to-r from-burgundy-700 to-burgundy-800 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ✍️ Manual Entry
          </button>
        </motion.div>

        {/* Scanner Mode */}
        <AnimatePresence mode="wait">
          {mode === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  QR Code Scanner
                </h2>
                <p className="text-gray-600">
                  Position the QR code within the camera frame
                </p>
              </div>

              {/* Camera Error */}
              {cameraError && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-sm">{cameraError}</p>
                </div>
              )}

              {/* Video Feed */}
              <div className="relative bg-black rounded-xl overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-[400px]"
                  autoPlay
                  playsInline
                />
                {!scannerActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <button
                      onClick={() => setScannerActive(true)}
                      className="bg-burgundy-700 hover:bg-burgundy-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Start Scanner
                    </button>
                  </div>
                )}
                {scannerActive && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-4 border-golden-500 opacity-50 animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-golden-400"></div>
                  </div>
                )}
              </div>

              {/* Scanner Controls */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setScannerActive(false);
                    stopScanner();
                  }}
                  disabled={!scannerActive}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Stop Scanner
                </button>
                <button
                  onClick={() => {
                    stopScanner();
                    setScannerActive(true);
                  }}
                  disabled={!scannerActive}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  🔄 Restart
                </button>
              </div>
            </motion.div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Manual Check-In
                </h2>
                <p className="text-gray-600">
                  Enter attendee email address
                </p>
              </div>

              <form onSubmit={handleManualCheckIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="attendee@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500 focus:border-golden-500 transition-all"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !manualEmail.trim()}
                  className="w-full bg-gradient-to-r from-burgundy-700 to-burgundy-800 hover:from-burgundy-800 hover:to-burgundy-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Checking In...
                    </>
                  ) : (
                    <>
                      ✓ Check In
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last Check-In Display */}
        <AnimatePresence>
          {lastCheckIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl p-6 border-2 border-golden-500"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-golden-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-burgundy-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Successfully Checked In!
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(lastCheckIn.checkedInAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{lastCheckIn.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-semibold text-gray-900 text-sm break-all">{lastCheckIn.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Assigned Table</p>
                  <p className="font-semibold text-burgundy-700 text-lg">
                    {lastCheckIn.tableName || `Table ${lastCheckIn.tableNumber}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Table {lastCheckIn.tableNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Seat</p>
                  <p className="font-semibold text-gray-900">Seat {lastCheckIn.seatNumber}</p>
                </div>
                {lastCheckIn.phone && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="font-semibold text-gray-900">{lastCheckIn.phone}</p>
                  </div>
                )}
                {lastCheckIn.gender && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Gender</p>
                    <p className="font-semibold text-gray-900">{lastCheckIn.gender}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/admin"
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium shadow-md transition-all inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Admin Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium shadow-md transition-all inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
