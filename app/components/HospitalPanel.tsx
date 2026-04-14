import { CheckCircle, XCircle, Clock, Users, Droplet, Activity, Search, Filter, AlertCircle, Eye, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { HospitalApplicationManager } from './HospitalApplicationManager';
import { apiUrl } from '../services/api';

interface User {
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
}

interface HospitalPanelProps {
  user: User | null;
}

interface PendingRequest {
  id: string;
  patientName: string;
  bloodType: string;
  unitsNeeded: number;
  urgency: 'critical' | 'high' | 'normal';
  requestor: string;
  submittedAt: string;
  documentsUploaded: boolean;
}

export function HospitalPanel({ user }: HospitalPanelProps) {
  const [activeTab, setActiveTab] = useState<'blood' | 'donors'>('blood');
  const [bloodRequestFilter, setBloodRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [donorRequests, setDonorRequests] = useState<any[]>([]);
  const [bloodRequests, setBloodRequests] = useState<any[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bloodRejectingId, setBloodRejectingId] = useState<string | null>(null);
  const [bloodRejectionReason, setBloodRejectionReason] = useState("");
  const [error, setError] = useState<string>("");
  const [newRequestNotification, setNewRequestNotification] = useState<string | null>(null);
  const [previewingPdfFile, setPreviewingPdfFile] = useState<string | null>(null);
  const [previewingFileName, setPreviewingFileName] = useState<string | null>(null);
  const [previewingIsImage, setPreviewingIsImage] = useState<boolean>(false);

  // Load donor requests on component mount and listen for real-time updates
  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(apiUrl('/donor/applications'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const result = await response.json();
          // Map backend data to component state
          const mappedData = result.data.map((app: any) => ({
            _id: app._id,
            name: app.fullName,
            email: app.email,
            phone: app.phone,
            bloodGroup: app.bloodGroup || 'Not specified',
            eligibilityAnswers: app.eligibilityAnswers || {},
            aadhaarFilePath: app.aadhaarFilePath,
            medicalFilePath: app.medicalReportFilePath,
            status: app.status || 'Pending',
            rejectionReason: app.rejectionReason,
            hospitalRemarks: app.hospitalRemarks,
            scheduledDate: app.scheduledDate || null,
            scheduledTime: app.scheduledTime || null,
            scheduledAt: app.scheduledAt || null,
            createdAt: app.submittedAt,
            updatedAt: app.updatedAt,
          }));
          setDonorRequests(mappedData);
        }
      } catch (error) {
        console.error('Failed to fetch donor requests:', error);
      }
    };

    // Fetch on mount
    fetchDonors();

    // Set up interval to fetch every 2 seconds
    const intervalId = setInterval(fetchDonors, 2000);

    // Cleanup function
    return () => clearInterval(intervalId);

  }, []);

  // Fetch blood requests from backend API
  useEffect(() => {
    const fetchBloodRequests = async () => {
      try {
        const response = await fetch(apiUrl('/requests'));
        if (response.ok) {
          const data = await response.json();
          setBloodRequests(data.data || []);
        }
      } catch (e) {
        console.error('Failed to fetch blood requests:', e);
      }
    };

    // Fetch on mount
    fetchBloodRequests();

    // Poll every 2 seconds for updates
    const intervalId = setInterval(fetchBloodRequests, 2000);

    return () => clearInterval(intervalId);
  }, []);

  if (!user || user.role !== 'hospital') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This area is only accessible to authorized hospital staff.</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/donor/update-status/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Approved',
          hospitalRemarks: 'Approved by hospital staff',
        }),
      });
      if (response.ok) {
        // Refresh donors list
        const donorsRes = await fetch(apiUrl('/donor/applications'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (donorsRes.ok) {
          const result = await donorsRes.json();
          const mappedData = result.data.map((app: any) => ({
            _id: app._id,
            name: app.fullName,
            email: app.email,
            phone: app.phone,
            bloodGroup: app.bloodGroup || 'Not specified',
            eligibilityAnswers: app.eligibilityAnswers || {},
            aadhaarFilePath: app.aadhaarFilePath,
            medicalFilePath: app.medicalReportFilePath,
            status: app.status || 'Pending',
            hospitalRemarks: app.hospitalRemarks,
            scheduledDate: app.scheduledDate || null,
            scheduledTime: app.scheduledTime || null,
            scheduledAt: app.scheduledAt || null,
            createdAt: app.submittedAt,
            updatedAt: app.updatedAt,
          }));
          setDonorRequests(mappedData);
        }
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to approve donor');
      }
    } catch (e) {
      setError('Error approving donor');
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingId(id);
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;

    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/donor/update-status/${rejectingId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Rejected',
          hospitalRemarks: rejectionReason,
        }),
      });
      if (response.ok) {
        // Refresh donors list
        const donorsRes = await fetch(apiUrl('/donor/applications'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (donorsRes.ok) {
          const result = await donorsRes.json();
          const mappedData = result.data.map((app: any) => ({
            _id: app._id,
            name: app.fullName,
            email: app.email,
            phone: app.phone,
            bloodGroup: app.bloodGroup || 'Not specified',
            eligibilityAnswers: app.eligibilityAnswers || {},
            aadhaarFilePath: app.aadhaarFilePath,
            medicalFilePath: app.medicalReportFilePath,
            status: app.status || 'Pending',
            hospitalRemarks: app.hospitalRemarks,
            scheduledDate: app.scheduledDate || null,
            scheduledTime: app.scheduledTime || null,
            scheduledAt: app.scheduledAt || null,
            createdAt: app.submittedAt,
            updatedAt: app.updatedAt,
          }));
          setDonorRequests(mappedData);
        }
        setRejectingId(null);
        setRejectionReason("");
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reject donor');
      }
    } catch (e) {
      setError('Error rejecting donor');
    }
  };

  const handleViewPdf = (requestId: string, fileType: 'prescription' | 'idProof', meta: any) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const blobUrl = window.__hemoBlobs?.[requestId]?.[fileType];
    
    if (!blobUrl) {
      setError('File not available in session. Please refresh or resubmit the request.');
      return;
    }

    // detect type from stored metadata
    const isPdf = meta?.type === 'application/pdf';
    setPreviewingPdfFile(blobUrl);
    setPreviewingFileName(meta?.name || `${fileType}.pdf`);
    setPreviewingIsImage(!isPdf);
  };

  const handleViewDonorFile = (base64Content: string, fileName: string) => {
    if (!base64Content) {
      setError('File not available');
      return;
    }
    try {
      // Determine if it's a PDF or image based on file type
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const dataUri = isPdf ? `data:application/pdf;base64,${base64Content}` : `data:image/*;base64,${base64Content}`;
      setPreviewingPdfFile(dataUri);
      setPreviewingFileName(fileName);
      setPreviewingIsImage(!isPdf);
    } catch (error) {
      console.error('Failed to view donor file:', error);
      setError('Failed to load file');
    }
  };

  const openImageInNewTab = (base64Content: string, fileName: string) => {
    try {
      const dataUri = `data:image/*;base64,${base64Content}`;
      const link = document.createElement('a');
      link.href = dataUri;
      link.target = '_blank';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to open image:', error);
    }
  };

  const approveBloodRequest = async (id: string) => {
    try {
      const response = await fetch(apiUrl(`/request/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Approved',
          hospitalRemarks: 'Request approved by hospital'
        }),
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        // Update local state
        setBloodRequests((prev) =>
          prev.map((r) => (r._id === id ? updatedRequest.request : r))
        );
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to approve blood request', e);
      return false;
    }
  };

  const rejectBloodRequest = async (id: string, reason: string) => {
    try {
      const response = await fetch(apiUrl(`/request/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected', rejectionReason: reason }),
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        // Update local state
        setBloodRequests((prev) =>
          prev.map((r) => (r._id === id ? updatedRequest.request : r))
        );
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to reject blood request', e);
      return false;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hospital Panel</h1>
              <p className="text-gray-600 mt-1">{user.name}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                Real-time monitoring active
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user.verified && (
                <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Verified Organization</span>
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-red-700 font-medium">Pending Verifications</div>
                  <div className="text-2xl font-bold text-red-900">
                    {donorRequests.filter((r) => r.status === "Pending").length}
                  </div>
                </div>
                <Clock className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-700 font-medium">Approved Donors</div>
                  <div className="text-2xl font-bold text-green-900">
                    {donorRequests.filter((r) => r.status === "Approved").length}
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 font-medium">Rejected Donors</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {donorRequests.filter((r) => r.status === "Rejected").length}
                  </div>
                </div>
                <XCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-700 font-medium">Total Applications</div>
                  <div className="text-2xl font-bold text-purple-900">{donorRequests.length}</div>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* New Request Notification */}
        {newRequestNotification && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 animate-pulse">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-semibold">{newRequestNotification}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('blood')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'blood'
                ? 'text-red-600 border-b-2 border-red-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Droplet className="w-5 h-5" />
            Blood Requests
          </button>
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'donors'
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            Donor Applications
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ display: activeTab === 'blood' ? 'block' : 'none' }}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Blood Requests</h2>
                <p className="text-gray-600 mt-1">Manage and verify blood request applications</p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="mb-6 flex gap-3 flex-wrap">
              <button
                onClick={() => setBloodRequestFilter('all')}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                  bloodRequestFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Requests ({bloodRequests.length})
              </button>
              <button
                onClick={() => setBloodRequestFilter('pending')}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                  bloodRequestFilter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pending ({bloodRequests.filter((r) => r.status === 'Pending').length})
              </button>
              <button
                onClick={() => setBloodRequestFilter('approved')}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                  bloodRequestFilter === 'approved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Approved ({bloodRequests.filter((r) => r.status === 'Approved').length})
              </button>
              <button
                onClick={() => setBloodRequestFilter('rejected')}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                  bloodRequestFilter === 'rejected'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rejected ({bloodRequests.filter((r) => r.status === 'Rejected').length})
              </button>
            </div>

            {/* Blood requests - Filtered */}
            {(() => {
              const filteredRequests = 
                bloodRequestFilter === 'all'
                  ? bloodRequests
                  : bloodRequests.filter((r) => {
                      if (bloodRequestFilter === 'pending') return r.status === 'Pending';
                      if (bloodRequestFilter === 'approved') return r.status === 'Approved';
                      if (bloodRequestFilter === 'rejected') return r.status === 'Rejected';
                      return true;
                    });

              if (filteredRequests.length === 0) {
                return (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="text-center py-12">
                        <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No {bloodRequestFilter === 'all' ? 'blood requests' : bloodRequestFilter + ' blood requests'} available.</p>
                        <p className="text-sm text-gray-400 mt-2">When blood requests are submitted they will appear here for review.</p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredRequests.map((req) => (
                    <div key={req._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{req.patientName || 'Unnamed Patient'}</h3>
                        <div className="text-sm text-gray-600">
                          <p>Blood Type: {req.bloodGroup}</p>
                          <p>Units: {req.unitsRequired}</p>
                          <p>Hospital: {req.hospitalName || '-'}</p>
                          <p>Requester: {req.requesterName || 'N/A'}</p>
                          <p>Contact: {req.requesterPhone || req.requesterEmail || '-'}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{new Date(req.submittedAt || req.createdAt).toLocaleDateString()}</p>
                        <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(req.status || 'Pending')}`}>
                          {getStatusIcon(req.status || 'Pending')}
                          {req.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {req.reason && (
                      <div className="mb-3 text-sm text-gray-700 p-2 bg-gray-50 rounded">
                        <strong>Reason:</strong> {req.reason}
                      </div>
                    )}

                    {req.rejectionReason && req.status === 'Rejected' && (
                      <div className="mb-3 text-sm text-red-700 p-2 bg-red-50 rounded border border-red-200">
                        <strong>Rejection Reason:</strong> {req.rejectionReason}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {req.prescriptionFilePath && (
                        <button
                          onClick={() => {
                            const fileUrl = `http://localhost:5000/${req.prescriptionFilePath}`;
                            setPreviewingPdfFile(fileUrl);
                            setPreviewingFileName('Prescription');
                            setPreviewingIsImage(false);
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Prescription
                        </button>
                      )}

                      {req.idProofFilePath ? (
                        <button
                          onClick={() => {
                            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(req.idProofFilePath);
                            const fileUrl = `http://localhost:5000/${req.idProofFilePath}`;
                            setPreviewingPdfFile(fileUrl);
                            setPreviewingFileName('ID Proof');
                            setPreviewingIsImage(isImage);
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View ID Proof
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed"
                        >
                          No ID Proof
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          const ok = await approveBloodRequest(req._id || req.id);
                          if (ok) {
                            setNewRequestNotification(`Blood request for ${req.patientName} approved!`);
                            setTimeout(() => setNewRequestNotification(null), 3000);
                          } else {
                            setError('Failed to approve blood request');
                          }
                        }}
                        disabled={req.status && req.status !== 'Pending'}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${req.status === 'Pending' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>

                      <button
                        onClick={() => {
                          setBloodRejectingId(req._id || req.id);
                          setBloodRejectionReason('');
                        }}
                        disabled={req.status && req.status !== 'Pending'}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${req.status === 'Pending' ? 'border border-red-300 text-red-600 hover:bg-red-50' : 'border border-gray-300 text-gray-500 cursor-not-allowed'}`}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                    </div>
                    ))}
                  </div>
                );
            })()}
          </div>
        </div>

        {/* Donor Applications Tab */}
        <div style={{ display: activeTab === 'donors' ? 'block' : 'none' }}>
          <HospitalApplicationManager />
        </div>
      </div>

      {/* Preview Modal (PDF or Image) */}
      {previewingPdfFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">{previewingFileName}</h3>
              <button
                onClick={() => {
                  setPreviewingPdfFile(null);
                  setPreviewingFileName(null);
                  setPreviewingIsImage(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
              {previewingIsImage ? (
                <img
                  src={previewingPdfFile || ''}
                  alt={previewingFileName || 'Preview'}
                  className="max-w-full max-h-[80vh] rounded"
                />
              ) : (
                <iframe
                  src={previewingPdfFile || ''}
                  title={previewingFileName || 'Document Preview'}
                  className="w-full h-[70vh] border-0 rounded"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 flex gap-2">
              <button
                onClick={() => {
                  setPreviewingPdfFile(null);
                  setPreviewingFileName(null);
                  setPreviewingIsImage(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  try {
                    const link = document.createElement('a');
                    link.href = previewingPdfFile!;
                    link.target = '_blank';
                    link.download = previewingFileName || 'document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (e) {
                    console.error('Failed to download file', e);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Donor Application
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this application:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Medical records incomplete, insufficient documents, etc."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason("");
                  setError("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blood Request Rejection Modal */}
      {bloodRejectingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Blood Request
            </h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this blood request:</p>
            <textarea
              value={bloodRejectionReason}
              onChange={(e) => setBloodRejectionReason(e.target.value)}
              placeholder="e.g., Incorrect prescription, incomplete details, etc."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBloodRejectingId(null);
                  setBloodRejectionReason('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!bloodRejectingId) return;
                  if (!bloodRejectionReason.trim()) {
                    setError('Please provide a reason for rejection.');
                    return;
                  }
                  const ok = await rejectBloodRequest(bloodRejectingId, bloodRejectionReason);
                  if (ok) {
                    setNewRequestNotification('Blood request rejected successfully!');
                    setTimeout(() => setNewRequestNotification(null), 3000);
                  } else {
                    setError('Failed to reject blood request. Please try again.');
                  }
                  setBloodRejectingId(null);
                  setBloodRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
