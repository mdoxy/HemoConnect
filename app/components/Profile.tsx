import { useState } from 'react';
import { User, Mail, Phone, MapPin, Droplet, Calendar, Shield, Upload, CheckCircle2, Clock, Award } from 'lucide-react';

interface UserData {
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
}

interface ProfileProps {
  user: UserData | null;
}

export function Profile({ user }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'verification' | 'history' | 'privacy'>('details');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                {user.verified && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="capitalize font-medium">{user.role}</span>
                {user.bloodType && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Droplet className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-red-600">{user.bloodType}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <button className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Personal Details
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'verification'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Verification
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'privacy'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Privacy & Security
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Personal Details */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">john.doe@example.com</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">+1 (555) 123-4567</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <Droplet className="w-5 h-5 text-red-600" />
                    <span className="text-red-900 font-semibold">{user.bloodType || 'Not Set'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Address</h2>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-gray-900">
                  <div>123 Main Street, Apt 4B</div>
                  <div>New York, NY 10001</div>
                  <div>United States</div>
                </div>
              </div>
            </div>

            {user.role === 'donor' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Donation Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                    <div className="text-3xl font-bold text-red-900 mb-1">15</div>
                    <div className="text-sm text-red-700">Total Donations</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-3xl font-bold text-green-900 mb-1">45</div>
                    <div className="text-sm text-green-700">Lives Saved</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900 mb-1">Dec 15, 2025</div>
                    <div className="text-sm text-blue-700">Last Donation</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verification */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            {/* Verification Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Verification Status</h2>
                {user.verified ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg border border-orange-300">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Pending</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Email Verified</div>
                    <div className="text-sm text-gray-600">Verified on Jan 15, 2026</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Phone Verified</div>
                    <div className="text-sm text-gray-600">Verified on Jan 15, 2026</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Identity Verified</div>
                    <div className="text-sm text-gray-600">Government ID verified by hospital</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Documents */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Uploaded Documents</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Government ID</div>
                      <div className="text-sm text-gray-600">Uploaded Jan 15, 2026</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>

                {user.role === 'donor' && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Droplet className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-900">Blood Type Certificate</div>
                        <div className="text-sm text-gray-600">Uploaded Jan 15, 2026</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>

              <button className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-400 hover:text-red-600 transition-colors">
                <Upload className="w-5 h-5" />
                Upload Additional Documents
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Activity History</h2>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Droplet className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-gray-900">Blood Donation Completed</div>
                      <div className="text-sm text-gray-500">Dec 15, 2025</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Donated 2 units of {user.bloodType} at City General Hospital
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700 font-medium">+10 points earned</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-gray-900">Request Accepted</div>
                      <div className="text-sm text-gray-500">Nov 20, 2025</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Accepted emergency blood request for patient Sarah Johnson
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-gray-900">Account Created</div>
                      <div className="text-sm text-gray-500">Jan 15, 2026</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Joined HemoConnect as a verified blood donor
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy & Security */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Show my profile to donors</div>
                    <div className="text-sm text-gray-600">Allow other users to view your profile</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-red-600 rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Share location with nearby requests</div>
                    <div className="text-sm text-gray-600">Help match emergency requests in your area</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-red-600 rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Receive emergency notifications</div>
                    <div className="text-sm text-gray-600">Get alerts for critical blood requests</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-red-600 rounded" defaultChecked />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Security</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-semibold text-gray-900">Change Password</div>
                  <div className="text-sm text-gray-600">Update your account password</div>
                </button>

                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-semibold text-gray-900">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-600">Add an extra layer of security</div>
                </button>

                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-semibold text-gray-900">Active Sessions</div>
                  <div className="text-sm text-gray-600">Manage devices logged into your account</div>
                </button>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
              <p className="text-sm text-red-700 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
