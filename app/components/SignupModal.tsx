import { useState } from 'react';
import { X, Mail, Lock, User, Phone, Droplet, Building2, Eye, EyeOff } from 'lucide-react';
import { isValidIndianMobile, normalizeIndianMobile, getPhoneValidationErrorMessage } from '../utils/validation';
import { authAPI } from '../services/authAPI';

interface SignupModalProps {
  onClose: () => void;
  onSignup: (user: any) => void;
  onSwitchToLogin: () => void;
}

type UserRole = 'donor' | 'requestor' | 'hospital';

export function SignupModal({ onClose, onSignup, onSwitchToLogin }: SignupModalProps) {
  const [step, setStep] = useState<'role' | 'details' | 'verification'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    bloodType: '',
    organizationName: '',
    licenseNumber: '',
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const signupData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
      };

      if (!formData.phone) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }

      if (!isValidIndianMobile(formData.phone)) {
        setError(getPhoneValidationErrorMessage());
        setLoading(false);
        return;
      }

      const normalized = normalizeIndianMobile(formData.phone) || formData.phone;

      if (selectedRole === 'hospital') {
        if (!formData.name.trim()) {
          setError('Hospital name is required');
          setLoading(false);
          return;
        }

        if (!formData.location.trim()) {
          setError('Location is required');
          setLoading(false);
          return;
        }

        signupData.hospitalName = formData.name.trim();
        signupData.contactNumber = normalized;
        signupData.location = formData.location.trim();
      } else {
        signupData.phone = normalized;
      }

      if (formData.bloodType) signupData.bloodType = formData.bloodType;
      if (formData.organizationName) signupData.organizationName = formData.organizationName;

      const response = await authAPI.signup(signupData);
      onSignup(response.user);
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="sticky top-4 float-right mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Join HemoConnect</h2>
          <p className="text-gray-600">Create your account and start saving lives</p>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            <div className={`flex-1 h-1.5 rounded-full ${step === 'role' ? 'bg-red-600' : 'bg-red-200'}`}></div>
            <div className={`flex-1 h-1.5 rounded-full ${step === 'details' ? 'bg-red-600' : step === 'verification' ? 'bg-red-200' : 'bg-gray-200'}`}></div>
            <div className={`flex-1 h-1.5 rounded-full ${step === 'verification' ? 'bg-red-600' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <div className="px-8 pb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Select Your Role</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Donor */}
              <button
                onClick={() => handleRoleSelect('donor')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-red-600 hover:bg-red-50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                  <Droplet className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Blood Donor</h4>
                <p className="text-sm text-gray-600">
                  Donate blood and help save lives in your community
                </p>
              </button>

              {/* Requestor */}
              <button
                onClick={() => handleRoleSelect('requestor')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Blood Requestor</h4>
                <p className="text-sm text-gray-600">
                  Request blood for yourself or your loved ones
                </p>
              </button>

              {/* Hospital */}
              <button
                onClick={() => handleRoleSelect('hospital')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-600 hover:bg-purple-50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Hospital / Org</h4>
                <p className="text-sm text-gray-600">
                  Manage blood requests and verify donations
                </p>
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Login
              </button>
            </p>
          </div>
        )}

        {/* Step 2: Details Form */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep('role')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              ← Change Role
            </button>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                Registering as: <span className="font-semibold text-gray-900 capitalize">{selectedRole}</span>
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedRole === 'hospital' ? 'Organization Name' : 'Full Name'} *
              </label>
              <div className="relative">
                {selectedRole === 'hospital' ? (
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                ) : (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                )}
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder={selectedRole === 'hospital' ? 'City General Hospital' : 'John Doe'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedRole === 'hospital' ? 'Contact Number *' : 'Phone Number *'} <span className="text-xs text-gray-500">(Indian Mobile)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="+91XXXXXXXXXX"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Accepted: +91XXXXXXXX (10 digits starting with 6-9)</p>
              </div>
            </div>

            {selectedRole === 'hospital' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="City, Area"
                />
              </div>
            )}

            {/* Blood Type (Donor only) */}
            {selectedRole === 'donor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type *
                </label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
            )}

            {/* License Number (Hospital only) */}
            {selectedRole === 'hospital' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical License Number *
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="MED-12345678"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-1"
              />
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-red-600 hover:text-red-700 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-red-600 hover:text-red-700 font-medium">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-colors shadow-sm hover:shadow-md"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
