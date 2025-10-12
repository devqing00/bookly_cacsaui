// Example Admin Component for Manual Email Sending
// Place this in: src/components/ManualEmailSender.tsx

'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function ManualEmailSender() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    tableNumber: number;
    tent: number;
    tableName: string;
    seatNumber: number;
  } | null>(null);

  // Fetch user details (preview without sending)
  const handleFetchUser = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/send-email?email=${encodeURIComponent(email)}`);
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

  // Send email to the user
  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Confirmation email sent to ${data.attendee.name}!`);
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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Manual Email Sender
      </h2>

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            User Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleFetchUser}
            disabled={loading || !email}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Preview User Info'}
          </button>

          <button
            onClick={handleSendEmail}
            disabled={loading || !email}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Email'}
          </button>
        </div>

        {/* User Information Display */}
        {userInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">User Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{userInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{userInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Table:</span>
                <span className="font-medium text-gray-900">{userInfo.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tent:</span>
                <span className="font-medium text-gray-900">{userInfo.tent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seat Number:</span>
                <span className="font-medium text-gray-900">{userInfo.seatNumber}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="font-semibold text-sm text-blue-800 mb-2">Instructions:</h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Enter the email address of a registered user</li>
          <li>Click "Preview User Info" to verify the user exists</li>
          <li>Click "Send Email" to send the confirmation email with QR code</li>
          <li>The user will receive their table assignment and event details</li>
        </ul>
      </div>
    </div>
  );
}
