'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface UserInfo {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  tableNumber: number;
  tent: number;
  tableName: string;
  seatNumber: number;
  registeredAt?: Date;
}

export default function ManualSendPage() {
  const [identifier, setIdentifier] = useState(''); // Email or phone
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [searchType, setSearchType] = useState<'email' | 'phone'>('email');

  // Fetch user details
  const handleFetchUser = async () => {
    if (!identifier) {
      toast.error(`Please enter ${searchType === 'email' ? 'an email address' : 'a phone number'}`);
      return;
    }

    setLoading(true);
    setUserInfo(null);
    
    try {
      const response = await fetch(`/api/admin/send-email?${searchType}=${encodeURIComponent(identifier)}`);
      const data = await response.json();

      if (data.success) {
        setUserInfo(data.attendee);
        toast.success('User found!');
      } else {
        setUserInfo(null);
        toast.error(data.error || 'User not found');
      }
    } catch (error) {
      toast.error('Failed to fetch user details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Send email
  const handleSendEmail = async () => {
    if (!identifier) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Email sent to ${data.attendee.name}!`);
        setUserInfo(data.attendee);
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Failed to send email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Send WhatsApp
  const handleSendWhatsApp = async () => {
    if (!userInfo) {
      toast.error('Please fetch user details first');
      return;
    }

    if (!userInfo.phone) {
      toast.error('This user has no phone number registered');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: userInfo.phone,
          email: userInfo.email 
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ WhatsApp message sent to ${userInfo.name}!`);
      } else {
        toast.error(data.error || 'Failed to send WhatsApp message');
      }
    } catch (error) {
      toast.error('Failed to send WhatsApp message');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Manual Message Sender
          </h1>
          <p className="text-gray-400">
            Send confirmation emails or WhatsApp messages to registered users
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700"
        >
          {/* Search Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Search By
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSearchType('email');
                  setIdentifier('');
                  setUserInfo(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  searchType === 'email'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📧 Email
              </button>
              <button
                onClick={() => {
                  setSearchType('phone');
                  setIdentifier('');
                  setUserInfo(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  searchType === 'phone'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📱 Phone
              </button>
            </div>
          </div>

          {/* Input Field */}
          <div className="mb-6">
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-300 mb-2">
              {searchType === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <input
              id="identifier"
              type={searchType === 'email' ? 'email' : 'tel'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={searchType === 'email' ? 'user@example.com' : '+234 XXX XXX XXXX'}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFetchUser();
                }
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleFetchUser}
              disabled={loading || !identifier}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? '🔍 Searching...' : '🔍 Find User'}
            </button>
          </div>

          {/* User Information Display */}
          {userInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-6 bg-gray-700 rounded-lg border border-gray-600"
            >
              <h3 className="font-semibold text-xl mb-4 text-white flex items-center gap-2">
                👤 User Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-600">
                  <span className="text-gray-400">Name:</span>
                  <span className="font-medium text-white">{userInfo.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-600">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-medium text-white text-sm">{userInfo.email}</span>
                </div>
                {userInfo.phone && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-600">
                    <span className="text-gray-400">Phone:</span>
                    <span className="font-medium text-white">{userInfo.phone}</span>
                  </div>
                )}
                {userInfo.gender && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-600">
                    <span className="text-gray-400">Gender:</span>
                    <span className="font-medium text-white">{userInfo.gender}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-600">
                  <span className="text-gray-400">Table:</span>
                  <span className="font-medium text-white">{userInfo.tableName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-600">
                  <span className="text-gray-400">Tent:</span>
                  <span className="font-medium text-white">Tent {userInfo.tent}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Seat:</span>
                  <span className="font-medium text-white">Seat {userInfo.seatNumber}</span>
                </div>
              </div>

              {/* Send Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
                >
                  {loading ? '📧 Sending...' : '📧 Send Email'}
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={loading || !userInfo.phone}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
                  title={!userInfo.phone ? 'No phone number registered' : ''}
                >
                  {loading ? '📱 Sending...' : '📱 Send WhatsApp'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-800/50">
            <h4 className="font-semibold text-sm text-blue-300 mb-2">📋 Instructions:</h4>
            <ul className="text-xs text-blue-200 space-y-1.5 list-disc list-inside">
              <li>Choose search method: Email or Phone number</li>
              <li>Enter the user&apos;s contact information</li>
              <li>Click &quot;Find User&quot; to verify registration</li>
              <li>Click &quot;Send Email&quot; to resend confirmation email with QR code</li>
              <li>Click &quot;Send WhatsApp&quot; to send badge and details via WhatsApp</li>
              <li>WhatsApp sending requires a valid phone number on file</li>
            </ul>
          </div>

          {/* Notes */}
          <div className="mt-4 p-4 bg-yellow-900/30 rounded-lg border border-yellow-800/50">
            <h4 className="font-semibold text-sm text-yellow-300 mb-2">💡 Use Cases:</h4>
            <ul className="text-xs text-yellow-200 space-y-1.5 list-disc list-inside">
              <li><strong>Wrong Email:</strong> Use WhatsApp to send badge directly</li>
              <li><strong>Email Not Received:</strong> Resend via email or try WhatsApp</li>
              <li><strong>Lost Badge:</strong> Send replacement via either method</li>
              <li><strong>Phone-Only Users:</strong> Search by phone and send via WhatsApp</li>
            </ul>
          </div>
        </motion.div>

        {/* Back to Admin */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <a
            href="/admin"
            className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-2"
          >
            ← Back to Admin Dashboard
          </a>
        </motion.div>
      </div>
    </div>
  );
}
