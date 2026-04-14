import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, LogOut, Trash2, Edit2, Save, X } from 'lucide-react';
import { authAPI } from '../services/authAPI';

interface Hospital {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  location: string;
  role: string;
}

interface HospitalProfileProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export function HospitalProfile({ onLogout, onNavigate }: HospitalProfileProps) {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editData, setEditData] = useState({
    hospitalName: '',
    contactNumber: '',
    location: '',
  });

  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: true,
    showContactInfo: true,
    allowEmails: true,
    showInSearch: true,
  });

  useEffect(() => {
    fetchHospitalProfile();
  }, []);

  const fetchHospitalProfile = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      if (!user.id || !token) {
        setError('Please login first');
        return;
      }

      const response = await authAPI.getHospitalProfile(user.id);
      setHospital(response);
      setEditData({
         hospitalName: response.name,
        contactNumber: response.contactNumber,
        location: response.location,
      });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setError('');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!editData.hospitalName.trim()) {
        setError('Hospital name is required');
        return;
      }

      if (!editData.location.trim()) {
        setError('Location is required');
        return;
      }

      if (!editData.contactNumber.trim()) {
        setError('Contact number is required');
        return;
      }

      await authAPI.updateHospitalProfile(user.id, {
        hospitalName: editData.hospitalName.trim(),
        contactNumber: editData.contactNumber.trim(),
        location: editData.location.trim(),
      });

      const updatedHospital = {
        ...hospital!,
        hospitalName: editData.hospitalName,
        contactNumber: editData.contactNumber,
        location: editData.location,
      };

      setHospital(updatedHospital);
      localStorage.setItem('user', JSON.stringify(updatedHospital));

      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      setError('');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      await authAPI.deleteHospitalProfile(user.id);

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      onLogout();
      onNavigate('landing');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">{error || 'Hospital not found'}</p>
            <button
              onClick={() => onNavigate('landing')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Edit/Delete Buttons */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Hospital Profile</h1>
            <p className="text-gray-600">Manage your hospital information and settings</p>
          </div>
          <div className="flex gap-3">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveChanges}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {/* Hospital Information Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hospital Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hospital Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.hospitalName}
                  onChange={(e) => handleEditChange('hospitalName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Hospital Name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-700 min-h-11 flex items-center font-medium">
                  {hospital?.name || 'N/A'}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {hospital.email}
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.contactNumber}
                  onChange={(e) => handleEditChange('contactNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Contact Number"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {hospital.contactNumber}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => handleEditChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Location"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {hospital.location}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Settings</h2>

          <div className="space-y-4">
            {/* Public Profile Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-600">Make your profile visible to other users</p>
              </div>
              <label className="relative inline-block w-12 h-6 bg-gray-300 rounded-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.publicProfile}
                  onChange={(e) =>
                    setPrivacySettings({ ...privacySettings, publicProfile: e.target.checked })
                  }
                  className="sr-only"
                />
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    privacySettings.publicProfile ? 'translate-x-6 bg-purple-600' : ''
                  }`}
                />
              </label>
            </div>

            {/* Show Contact Info Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium text-gray-900">Show Contact Information</p>
                <p className="text-sm text-gray-600">Display your contact details publicly</p>
              </div>
              <label className="relative inline-block w-12 h-6 bg-gray-300 rounded-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showContactInfo}
                  onChange={(e) =>
                    setPrivacySettings({ ...privacySettings, showContactInfo: e.target.checked })
                  }
                  className="sr-only"
                />
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    privacySettings.showContactInfo ? 'translate-x-6 bg-purple-600' : ''
                  }`}
                />
              </label>
            </div>

            {/* Allow Emails Toggle
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium text-gray-900">Allow Emails</p>
                <p className="text-sm text-gray-600">Receive email notifications and updates</p>
              </div>
              <label className="relative inline-block w-12 h-6 bg-gray-300 rounded-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.allowEmails}
                  onChange={(e) =>
                    setPrivacySettings({ ...privacySettings, allowEmails: e.target.checked })
                  }
                  className="sr-only"
                />
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    privacySettings.allowEmails ? 'translate-x-6 bg-purple-600' : ''
                  }`}
                />
              </label>
            </div> */}

            {/* Show in Search Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium text-gray-900">Show in Search</p>
                <p className="text-sm text-gray-600">Appear in search results and listings</p>
              </div>
              <label className="relative inline-block w-12 h-6 bg-gray-300 rounded-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showInSearch}
                  onChange={(e) =>
                    setPrivacySettings({ ...privacySettings, showInSearch: e.target.checked })
                  }
                  className="sr-only"
                />
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    privacySettings.showInSearch ? 'translate-x-6 bg-purple-600' : ''
                  }`}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-red-900 mb-4">Delete Account</h2>
          <p className="text-red-700 mb-6">
            Deleting your account will permanently remove all your data from our system. This action cannot be undone.
          </p>

          {showDeleteConfirm ? (
            <div className="bg-white p-6 rounded-lg border border-red-300">
              <p className="text-gray-900 font-semibold mb-4">
                Are you sure you want to permanently delete your account? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  {deleting ? 'Deleting...' : 'Yes, Delete Account'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-900 px-6 py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Delete My Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
