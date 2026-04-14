import { useState } from 'react';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';

interface ScheduleDonationModalProps {
  onClose: () => void;
  onSchedule: (date: string, time: string) => Promise<void>;
  applicationId: string;
}

export function ScheduleDonationModal({
  onClose,
  onSchedule,
  applicationId,
}: ScheduleDonationModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get maximum date (90 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    setLoading(true);

    try {
      await onSchedule(selectedDate, selectedTime);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule donation');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse"></div>
                <CheckCircle className="w-16 h-16 text-green-600 relative" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Donation Scheduled Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Your donation appointment has been confirmed. Please arrive 10 minutes early.
            </p>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600">Scheduled Date</p>
              <p className="text-lg font-semibold text-green-700 mb-3">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-600">Scheduled Time</p>
              <p className="text-lg font-semibold text-green-700">
                {selectedTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="sticky top-0 self-end m-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pb-8 -mt-2">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📅 Schedule Your Donation
            </h2>
            <p className="text-gray-600 text-sm">
              Choose your preferred date and time to donate blood
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  Preferred Date *
                </div>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                max={maxDateStr}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available from today up to 90 days in advance
              </p>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  Preferred Time *
                </div>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-1 text-sm font-medium rounded-lg transition-all ${
                      selectedTime === time
                        ? 'bg-red-600 text-white ring-2 ring-red-400'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Donation center hours: 8:00 AM - 6:00 PM (Mon-Sat)
              </p>
            </div>

            {/* Details Summary */}
            {selectedDate && selectedTime && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-gray-600 mb-2">Your appointment:</p>
                <p className="text-sm font-semibold text-blue-900">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at {selectedTime}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-xs text-yellow-800">
                ⚠️ Please ensure you:
              </p>
              <ul className="text-xs text-yellow-800 ml-4 mt-2 space-y-1">
                <li>• Have not donated in the last 3 months</li>
                <li>• Are in good health on the scheduled date</li>
                <li>• Arrive 10 minutes early</li>
                <li>• Bring a valid ID proof</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedDate || !selectedTime}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scheduling...
                  </span>
                ) : (
                  'Confirm Schedule'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
