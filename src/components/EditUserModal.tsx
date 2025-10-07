'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import type { Table } from '@/types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: Table | null;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (user) {
      const tableWithId = user as Table & { id: string; seatIndex: number };
      const attendee = user.attendees[tableWithId.seatIndex];
      setName(attendee.name);
      setEmail(attendee.email);
      setPhone(attendee.phone || '');
      setGender(attendee.gender);
      setErrors({});
    }
  }, [user]);

  const validate = () => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      // Accept Nigerian format (starts with 0, 11 digits) or international format
      const nigerianFormat = /^0\d{10}$/; // 0XXXXXXXXXX (11 digits)
      const internationalFormat = /^\+?\d{10,15}$/; // International with optional +
      
      if (!nigerianFormat.test(cleanPhone) && !internationalFormat.test(cleanPhone.replace(/[\s()-]/g, ''))) {
        newErrors.phone = 'Please enter a valid Nigerian phone number';
      }
    }

    if (!gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !user) return;

    setLoading(true);

    try {
      // Cast user to include extended properties
      const tableWithId = user as Table & { id: string; seatIndex: number };
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableWithId.id,
          seatIndex: tableWithId.seatIndex,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          gender,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User updated successfully!');
        
        // Log the edit activity
        try {
          const tableWithId = user as Table & { id: string; seatIndex: number };
          
          await fetch('/api/activity-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'edit',
              attendeeName: name.trim(),
              attendeeEmail: email.trim().toLowerCase(),
              tableNumber: user.tableNumber,
              seatNumber: tableWithId.seatIndex + 1,
              details: `Updated user details`,
            }),
          });
        } catch (logError) {
          console.error('Failed to log activity:', logError);
        }
        
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('An error occurred while updating user');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneDisplay = (value: string) => {
    try {
      if (value && value.length > 3) {
        const phoneNumber = parsePhoneNumber(value, 'US');
        if (phoneNumber) {
          return phoneNumber.formatNational();
        }
      }
    } catch {}
    return value;
  };

  if (!isOpen || !user) return null;

  const tableWithId = user as Table & { id: string; seatIndex: number };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Edit User</h2>
                <p className="text-indigo-100 mt-1 text-sm">
                  Table {user.tableNumber}, Seat {tableWithId.seatIndex + 1}
                </p>
              </div>
              <button
                onClick={onClose}
                type="button"
                aria-label="Close modal"
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="edit-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                className={`w-full px-4 py-3 border ${
                  errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="edit-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`w-full px-4 py-3 border ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="edit-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                className={`w-full px-4 py-3 border ${
                  errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                disabled={loading}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
              {phone && !errors.phone && (
                <p className="mt-1 text-sm text-gray-500">
                  Formatted: {formatPhoneDisplay(phone)}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="edit-gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                id="edit-gender"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  if (errors.gender) setErrors({ ...errors, gender: undefined });
                }}
                className={`w-full px-4 py-3 border ${
                  errors.gender ? 'border-red-400 bg-red-50' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none`}
                disabled={loading}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
