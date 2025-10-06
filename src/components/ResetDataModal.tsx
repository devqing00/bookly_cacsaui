'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetDataModal({ isOpen, onClose, onSuccess }: ResetDataModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const handleReset = async () => {
    if (confirmText !== 'DELETE ALL DATA') {
      toast.error('Please type the confirmation text correctly');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/reset-data', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('All data has been reset successfully!', {
          description: `Deleted ${data.deleted.tables} tables and ${data.deleted.activityLogs} activity logs`,
          duration: 5000,
        });
        onSuccess();
        onClose();
        setStep(1);
        setConfirmText('');
      } else {
        toast.error(data.error || 'Failed to reset data');
      }
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('An error occurred while resetting data');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setStep(1);
      setConfirmText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h2 className="text-xl font-bold">⚠️ Danger Zone - Reset All Data</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 ? (
              <>
                <div className="mb-6 space-y-4">
                  <p className="text-neutral-700">
                    You are about to <span className="font-bold text-red-600">permanently delete ALL data</span> in the system:
                  </p>
                  
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-sm text-red-800">
                        <span className="font-semibold">All tables</span> and attendee registrations
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-sm text-red-800">
                        <span className="font-semibold">All activity logs</span> and audit trails
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                    <div className="flex gap-2">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">Warning:</span> This action cannot be undone. All data will be permanently lost.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                  >
                    I Understand, Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 space-y-4">
                  <p className="text-neutral-700 font-medium">
                    To confirm, please type the following text exactly:
                  </p>
                  
                  <div className="bg-neutral-100 border border-neutral-300 rounded-lg p-3 font-mono text-sm text-center">
                    DELETE ALL DATA
                  </div>

                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type here..."
                    className="w-full px-4 py-2.5 border-2 border-neutral-300 focus:border-red-500 focus:ring-0 focus:outline-none rounded-lg"
                    disabled={loading}
                    autoFocus
                  />

                  {confirmText && confirmText !== 'DELETE ALL DATA' && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Text doesn't match. Please type exactly as shown above.
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={loading || confirmText !== 'DELETE ALL DATA'}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete All Data'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
