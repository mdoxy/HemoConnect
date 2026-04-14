import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, Loader, AlertCircle, Download } from 'lucide-react';
import { apiUrl, backendUrl } from '../services/api';

interface User {
  id?: string;
  _id?: string;
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
  email?: string;
}

interface RequestorDashboardProps {
  user: User | null;
}

interface BloodRequest {
  _id: string;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  requiredDate: string;
  reason: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  hospitalRemarks?: string;
  prescriptionFilePath?: string;
  idProofFilePath?: string;
  submittedAt: string;
  updatedAt?: string;
}

export function RequestorDashboard({ user }: RequestorDashboardProps) {
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | null>(null);

  // Fetch blood request from MongoDB
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        setError('');

        // Check if user is logged in
        if (!user?.id && !user?._id) {
          setRequest(null);
          setLoading(false);
          return;
        }

        // User is logged in - fetch using userId
        const userId = user.id || user._id;
        const response = await fetch(apiUrl(`/requests/user/${userId}`));
        
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }

        const data = await response.json();
        // Get the most recent request
        setRequest(data.data && data.data.length > 0 ? data.data[0] : null);
      } catch (err) {
        console.error('Error fetching blood requests:', err);
        setError(err instanceof Error ? err.message : 'Failed to load blood request');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately only if user is logged in
    if (user?.id || user?._id) {
      fetchRequest();

      // Poll for updates every 3 seconds
      const interval = setInterval(fetchRequest, 3000);
      return () => clearInterval(interval);
    }
  }, [user?.id, user?._id]);

  const downloadFile = (filePath?: string, fileName?: string) => {
    if (!filePath) return;
    
    const fileUrl = backendUrl(`/${filePath}`);
    
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'document';
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      window.open(fileUrl, '_blank');
    }
  };

  const previewDocument = (filePath?: string, type?: string) => {
    if (!filePath) return;
    const fileUrl = backendUrl(`/${filePath}`);
    setPreviewFile(fileUrl);
    setPreviewType((type?.includes('pdf') ? 'pdf' : 'image') as 'pdf' | 'image');
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Approved':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-900',
          badgeColor: 'bg-green-100 text-green-800',
          emoji: '✓',
        };
      case 'Rejected':
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-900',
          badgeColor: 'bg-red-100 text-red-800',
          emoji: '✕',
        };
      case 'Pending':
        return {
          icon: <Clock className="w-8 h-8 text-orange-600" />,
          bgColor: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-900',
          badgeColor: 'bg-orange-100 text-orange-800',
          emoji: '⏳',
        };
      default:
        return {
          icon: <Clock className="w-8 h-8 text-gray-600" />,
          bgColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-900',
          badgeColor: 'bg-gray-100 text-gray-800',
          emoji: '◯',
        };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to view your blood requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Requestor Dashboard</h1>
          <p className="text-gray-600">Welcome, {user?.name}!</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-12">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading your blood request status...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Error</h3>
              </div>
              <p className="text-red-800">{error}</p>
            </div>
          ) : !request ? (
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    No Blood Request Submitted
                  </h3>
                  <p className="text-blue-800">
                    You have not submitted a blood request yet. Please go to "Find Blood" to submit a request.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Application Status Card
            <div className={`bg-white rounded-lg shadow-md border-2 ${getStatusConfig(request.status).bgColor}`}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold ${getStatusConfig(request.status).textColor}`}>
                      Application Status
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">Blood Request Verification</p>
                  </div>
                  {getStatusConfig(request.status).icon}
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getStatusConfig(request.status).badgeColor}`}>
                    {getStatusConfig(request.status).emoji} {request.status}
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-4 mb-6">
                  {/* Patient & Hospital Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Patient Name</p>
                      <p className="text-lg font-semibold text-gray-900">{request.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hospital Name</p>
                      <p className="text-lg font-semibold text-gray-900">{request.hospitalName}</p>
                    </div>
                  </div>

                  {/* Blood & Units Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Blood Group</p>
                      <p className="text-2xl font-bold text-red-600">{request.bloodGroup}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Units Required</p>
                      <p className="text-2xl font-bold text-blue-600">{request.unitsRequired}</p>
                    </div>
                  </div>

                  {/* Requester Info */}
                  <div>
                    <p className="text-sm text-gray-600">Requestor Name</p>
                    <p className="text-lg font-semibold text-gray-900">{request.requesterName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="text-lg font-semibold text-gray-900">{request.requesterEmail}</p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Submitted Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(request.submittedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(request.updatedAt || request.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hospital Remarks (if any) */}
                {request.hospitalRemarks && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Hospital Remarks</p>
                    <p className="text-gray-900">{request.hospitalRemarks}</p>
                  </div>
                )}

                {/* Status Messages */}
                {request.status === 'Pending' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800 text-sm">
                      Your blood request is under review. The hospital panel will verify your documents within 24-48 hours. You'll receive an update via email.
                    </p>
                  </div>
                )}

                {request.status === 'Approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm font-semibold mb-2">
                      ✓ Your request has been approved!
                    </p>
                    <p className="text-green-800 text-sm">
                      The requested blood will be prepared for the patient. Please contact the hospital for further details and next steps.
                    </p>
                  </div>
                )}

                {request.status === 'Rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm font-semibold mb-2">
                      ✕ Your request was not approved at this time.
                    </p>
                    {request.rejectionReason && (
                      <p className="text-red-800 text-sm mb-2">
                        Reason: {request.rejectionReason}
                      </p>
                    )}
                    <p className="text-red-800 text-sm">
                      Please contact the hospital panel for more information or to resubmit.
                    </p>
                  </div>
                )}

                {/* Documents Section */}
                {(request.prescriptionFilePath || request.idProofFilePath) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-4 font-semibold">Documents</p>
                    <div className="space-y-2">
                      {request.prescriptionFilePath && (
                        <button
                          onClick={() => previewDocument(request.prescriptionFilePath, 'pdf')}
                          className="w-full flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preview Prescription
                        </button>
                      )}
                      {request.idProofFilePath && (
                        <button
                          onClick={() => previewDocument(request.idProofFilePath)}
                          className="w-full flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preview ID Proof
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between rounded-t-lg">
              <h2 className="text-2xl font-bold">Document Preview</h2>
              <button
                onClick={() => {
                  setPreviewFile(null);
                  setPreviewType(null);
                }}
                className="hover:bg-blue-700 p-2 rounded transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center">
              {previewType === 'pdf' ? (
                <iframe
                  src={previewFile}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewFile}
                  alt="Document Preview"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-100 p-4 rounded-b-lg flex gap-3 justify-end">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewFile;
                  link.download = 'document';
                  link.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Download
              </button>
              <button
                onClick={() => {
                  setPreviewFile(null);
                  setPreviewType(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

