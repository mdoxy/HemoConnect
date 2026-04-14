import { useState } from 'react';
import { User, Phone, Mail, MapPin, Droplet, FileText, Building2, CheckCircle, X, Upload } from 'lucide-react';
import { isValidIndianMobile, normalizeIndianMobile, getPhoneValidationErrorMessage } from '../utils/validation';
import { Hospital } from '../utils/csvParser';
import { apiUrl } from '../services/api';

interface User {
  id?: string;
  _id?: string;
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
  email?: string;
}

interface RequestFormProps {
  selectedBank?: Hospital;
  onClose?: () => void;
  onNavigate?: (page: string) => void;
  user?: User | null;
}

export function RequestForm({ selectedBank, onClose, onNavigate, user }: RequestFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{ prescription?: string }>({});
  const [formData, setFormData] = useState({
    patientName: '',
    requesterName: '',
    relationship: '',
    email: '',
    phone: '',
    bloodType: '',
    unitsNeeded: '',
    urgency: '',
    hospital: selectedBank?.name || '',
    hospitalAddress: selectedBank?.address || '',
    city: '',
    zipCode: selectedBank?.pincode || '',
    requiredDate: '',
    doctorName: '',
    reason: '',
  });

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPrescriptionFile(file);
      setFormErrors({ ...formErrors, prescription: undefined });
    } else {
      setFormErrors({ ...formErrors, prescription: 'Please select a valid PDF file' });
      setPrescriptionFile(null);
    }
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setIdProofFile(file);
    } else {
      setIdProofFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for prescription file
    if (!prescriptionFile) {
      setFormErrors({ prescription: 'Prescription upload is required' });
      return;
    }

    const requestorUserId = user?.id || user?._id;
    if (!requestorUserId) {
      setFormErrors({ prescription: 'Please login to continue' });
      return;
    }

    // Validate other required fields
    if (!formData.patientName || !formData.bloodType || !formData.unitsNeeded || !formData.hospital) {
      setFormErrors({ prescription: 'Please fill in all required fields' });
      return;
    }

    // Validate phone number
    if (!isValidIndianMobile(formData.phone)) {
      setFormErrors({ prescription: getPhoneValidationErrorMessage() });
      return;
    }

    // Clear errors if validation passes
    setFormErrors({});
    setLoading(true);

    try {
      // Validate connection to backend first
      const healthCheckResponse = await fetch(apiUrl('/health'), {
        method: 'GET',
      }).catch(() => null);

      if (!healthCheckResponse) {
        throw new Error('Cannot connect to server. Make sure backend is running');
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add userId if user is logged in
      formDataToSend.append('userId', requestorUserId);
      
      // Add hospitalId from selectedBank
      if (selectedBank?.id) {
        formDataToSend.append('hospitalId', String(selectedBank.id));
      }
      
      formDataToSend.append('patientName', formData.patientName);
      formDataToSend.append('bloodGroup', formData.bloodType);
      formDataToSend.append('unitsRequired', formData.unitsNeeded);
      formDataToSend.append('hospitalName', formData.hospital);
      formDataToSend.append('requiredDate', formData.requiredDate);
      formDataToSend.append('reason', formData.reason);
      formDataToSend.append('requesterName', formData.requesterName);
      formDataToSend.append('requesterEmail', formData.email);
      // Normalize phone to +91XXXXXXXXXX for storage
      const normalizedPhone = normalizeIndianMobile(formData.phone) || formData.phone;
      formDataToSend.append('requesterPhone', normalizedPhone);
      formDataToSend.append('prescriptionFile', prescriptionFile);
      if (idProofFile) {
        formDataToSend.append('idProofFile', idProofFile);
      }

      console.log('Submitting blood request to API...');
      
      // Send to backend
      const response = await fetch(apiUrl('/requests'), {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        // Prefer backend message when available
        const serverMessage = responseData?.message || `Server error: ${response.status}`;
        throw new Error(serverMessage);
      }

      // Store requester email in localStorage for dashboard reference
      const previousEmails = JSON.parse(localStorage.getItem('requesterEmails') || '[]');
      if (!previousEmails.includes(formData.email)) {
        previousEmails.push(formData.email);
        localStorage.setItem('requesterEmails', JSON.stringify(previousEmails));
      }

      // Set submitted to show confirmation UI
      setSubmittedRequestId(responseData.requestId || '');
      setSubmitted(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('Form submission error:', err);
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('Cannot connect')) {
        setFormErrors({ prescription: 'Cannot connect to server. Make sure backend is running' });
      } else {
        setFormErrors({ prescription: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitted) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your blood request has been received. Our team will process your request and contact you within 2 hours.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Request ID:</strong> {submittedRequestId || 'Generated'}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Please keep this ID for reference
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-4">Choose your next step.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('requestor-dashboard');
                  } else {
                    setSubmitted(false);
                  }
                }}
                className="flex-1 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setSubmitted(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                New Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Request Blood</h1>
            <p className="text-xl text-gray-600">Fill out the form below to request blood for a patient</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          )}
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {formErrors.prescription && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{formErrors.prescription}</p>
              </div>
            )}
            
            {/* Patient Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-red-600" />
                Patient Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Mrunal Thakur"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Type Required *
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Requester Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-600" />
                Requester Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="requesterName"
                    value={formData.requesterName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship to Patient *
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Relationship</option>
                    <option value="self">Self</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="relative">Other Relative</option>
                    <option value="friend">Friend</option>
                    <option value="medical">Medical Staff</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number * <span className="text-xs text-gray-500">(Indian Mobile)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="+91 98765 43210 or 9876543210"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">Accepted: +91XXXXXXXXXX (10 digits starting with 6-9)</p>
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                Hospital Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="City General Hospital"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Address *
                  </label>
                  <input
                    type="text"
                    name="hospitalAddress"
                    value={formData.hospitalAddress}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="123 Hospital Ave"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="New York"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="10001"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attending Doctor Name *
                  </label>
                  <input
                    type="text"
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Dr. Sarah Johnson"
                  />
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-red-600" />
                Request Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Units Needed *
                  </label>
                  <input
                    type="number"
                    name="unitsNeeded"
                    value={formData.unitsNeeded}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urgency Level *
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Urgency</option>
                    <option value="emergency">Emergency (Within 24 hours)</option>
                    <option value="urgent">Urgent (1-3 days)</option>
                    <option value="scheduled">Scheduled (3+ days)</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required By Date *
                  </label>
                  <input
                    type="date"
                    name="requiredDate"
                    value={formData.requiredDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                Medical Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Blood Request *
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Reason</option>
                    <option value="surgery">Surgery</option>
                    <option value="accident">Accident/Trauma</option>
                    <option value="cancer">Cancer Treatment</option>
                    <option value="anemia">Anemia</option>
                    <option value="childbirth">Childbirth</option>
                    <option value="chronic">Chronic Illness</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Required Documents Section */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-red-600" />
                    Required Documents
                  </h4>
                  <div className="space-y-4">
                    {/* Prescription Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Prescription (PDF only) *
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handlePrescriptionChange}
                          className="hidden"
                          id="prescription-upload"
                        />
                        <label
                          htmlFor="prescription-upload"
                          className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
                        >
                          <div className="text-center">
                            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                            <span className="text-sm text-gray-600">
                              {prescriptionFile ? prescriptionFile.name : 'Click to upload PDF'}
                            </span>
                          </div>
                        </label>
                        {formErrors.prescription && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.prescription}</p>
                        )}
                      </div>
                    </div>

                    {/* ID Proof Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload ID Proof (PDF/Image) – Optional but Recommended
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleIdProofChange}
                          className="hidden"
                          id="idproof-upload"
                        />
                        <label
                          htmlFor="idproof-upload"
                          className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <div className="text-center">
                            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                            <span className="text-sm text-gray-600">
                              {idProofFile ? idProofFile.name : 'Click to upload PDF/Image'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                  loading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Blood Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
