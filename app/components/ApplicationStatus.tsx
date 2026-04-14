import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, Loader, Calendar } from 'lucide-react';
import { ScheduleDonationModal } from './ScheduleDonationModal';
import { apiUrl } from '../services/api';

interface ApplicationData {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  hospitalRemarks?: string;
  submittedAt: string;
  updatedAt: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  scheduledAt?: string | null;
}

interface ApplicationStatusProps {
  userId: string;
  authToken?: string;
}

export function ApplicationStatus({ userId, authToken }: ApplicationStatusProps) {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchApplicationStatus();
  }, [userId]);

  const fetchApplicationStatus = async () => {
    try {
      setLoading(true);
      const token = authToken || localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl(`/donor/status/${userId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch application status');
      }

      setApplication(data.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleDonation = async (date: string, time: string) => {
    if (!application) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(apiUrl(`/donor/schedule-donation/${application._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduledDate: date,
          scheduledTime: time,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule donation');
      }

      setApplication(data.data);
      setShowScheduleModal(false);
    } catch (err) {
      throw err;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-8 h-8 text-red-600" />;
      case 'Pending':
        return <Clock className="w-8 h-8 text-orange-600" />;
      default:
        return <AlertCircle className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-50 border-green-200';
      case 'Rejected':
        return 'bg-red-50 border-red-200';
      case 'Pending':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'text-green-900';
      case 'Rejected':
        return 'text-red-900';
      case 'Pending':
        return 'text-orange-900';
      default:
        return 'text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
        <div className="flex items-center justify-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading application status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-md p-6 border-2 border-red-200">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Error</h3>
        </div>
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchApplicationStatus}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-blue-50 rounded-lg shadow-md p-6 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              No Application Submitted
            </h3>
            <p className="text-blue-800">
              You have not submitted a donor application yet. Please complete the health screening form to apply.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 ${getStatusColor(application.status)}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${getStatusTextColor(application.status)}`}>
              Application Status
            </h2>
            <p className="text-gray-600 text-sm mt-1">Donor Application Verification</p>
          </div>
          {getStatusIcon(application.status)}
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
            application.status === 'Approved'
              ? 'bg-green-100 text-green-800'
              : application.status === 'Rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-orange-100 text-orange-800'
          }`}>
            {application.status === 'Approved' && '✓'}
            {application.status === 'Rejected' && '✕'}
            {application.status === 'Pending' && '⏳'}
            {' '}{application.status}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Applicant Name</p>
            <p className="text-lg font-semibold text-gray-900">{application.fullName}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Email Address</p>
            <p className="text-lg font-semibold text-gray-900">{application.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Submitted Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(application.submittedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(application.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Remarks (if any) */}
        {application.hospitalRemarks && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Hospital Remarks</p>
            <p className="text-gray-900">{application.hospitalRemarks}</p>
          </div>
        )}

        {/* Status Messages */}
        {application.status === 'Pending' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800 text-sm">
              Your application is under review. The hospital panel will verify your documents within 24-48 hours. You'll receive an update via email.
            </p>
          </div>
        )}

        {application.status === 'Approved' && (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm font-semibold mb-2">
                ✓ Your application has been approved!
              </p>
              <p className="text-green-800 text-sm">
                Congratulations! You are now verified to donate blood. You can schedule your donation appointment at any authorized hospital.
              </p>
            </div>

            {/* Scheduled Donation Section */}
            {application.scheduledDate && application.scheduledTime ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-2">Donation Appointment Scheduled</p>
                    <div className="space-y-1 text-sm text-blue-800 mb-3">
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(application.scheduledDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p>
                        <span className="font-medium">Time:</span> {application.scheduledTime}
                      </p>
                      <p className="text-xs text-blue-700 mt-2">
                        ⏰ Scheduled on{' '}
                        {new Date(application.scheduledAt || '').toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                📅 Schedule Your Donation
              </button>
            )}
          </div>
        )}

        {application.status === 'Rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm font-semibold mb-2">
              ✕ Your application was not approved at this time.
            </p>
            {application.hospitalRemarks && (
              <p className="text-red-800 text-sm mb-2">
                Reason: {application.hospitalRemarks}
              </p>
            )}
            <p className="text-red-800 text-sm">
              Please contact the hospital panel for more information or to reapply.
            </p>
          </div>
        )}
      </div>

      {/* Schedule Donation Modal */}
      {showScheduleModal && application && (
        <ScheduleDonationModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleDonation}
          applicationId={application._id}
        />
      )}
    </div>
  );
}
