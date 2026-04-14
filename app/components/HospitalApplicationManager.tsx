import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { apiUrl } from '../services/api';

interface DonorApplicationData {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  hospitalRemarks?: string;
  submittedAt: string;
  updatedAt: string;
}

interface HospitalApplicationManagerProps {
  authToken?: string;
}

export function HospitalApplicationManager({ authToken }: HospitalApplicationManagerProps) {
  const [applications, setApplications] = useState<DonorApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedApp, setSelectedApp] = useState<DonorApplicationData | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchApplications();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchApplications, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchApplications = async () => {
    try {
      const token = authToken || localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(apiUrl('/donor/applications'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
      }

      setApplications(data.data || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: 'Approved' | 'Rejected') => {
    if (newStatus === 'Rejected' && !remarks.trim()) {
      alert('Please provide remarks for rejection');
      return;
    }

    try {
      setUpdatingId(applicationId);
      const token = authToken || localStorage.getItem('token');

      const response = await fetch(apiUrl(`/donor/update-status/${applicationId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          hospitalRemarks: remarks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app._id === applicationId
            ? { ...app, status: newStatus, hospitalRemarks: remarks }
            : app
        )
      );

      setSelectedApp(null);
      setRemarks('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return null;
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

  const filteredApplications = filterStatus === 'All'
    ? applications
    : applications.filter(app => app.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span>Loading donor applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Donor Applications</h2>
        <p className="text-gray-600">Manage and verify donor registration applications</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-900 font-semibold">Error</p>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'All' ? 'All Applications' : status}
            {' '}({applications.filter(a => status === 'All' || a.status === status).length})
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-lg">No applications found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map(app => (
            <div
              key={app._id}
              className={`rounded-lg border-2 p-6 ${getStatusColor(app.status)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(app.status)}
                    <h3 className="text-lg font-bold text-gray-900">{app.fullName}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{app.email}</p>
                </div>
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm ${
                  app.status === 'Approved'
                    ? 'bg-green-100 text-green-800'
                    : app.status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {app.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Submitted</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Updated</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(app.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {app.hospitalRemarks && (
                <div className="bg-white rounded p-3 mb-4 border border-gray-300">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Remarks</p>
                  <p className="text-sm text-gray-900">{app.hospitalRemarks}</p>
                </div>
              )}

              {app.status === 'Pending' && (
                <button
                  onClick={() => setSelectedApp(app)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Review Application
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Review Application - {selectedApp.fullName}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{selectedApp.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedApp.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hospital Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks about this application..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setRemarks('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedApp._id, 'Rejected')}
                disabled={updatingId === selectedApp._id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors font-semibold"
              >
                {updatingId === selectedApp._id ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedApp._id, 'Approved')}
                disabled={updatingId === selectedApp._id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors font-semibold"
              >
                {updatingId === selectedApp._id ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
