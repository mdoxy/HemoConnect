import { useState } from 'react';
import { AlertCircle, FileText, Home } from 'lucide-react';
import HealthScreeningForm from './HealthScreeningForm';
import { ApplicationStatus } from './ApplicationStatus';

interface User {
  id?: string;
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
}

interface DonorDashboardProps {
  user: User | null;
}

type DashboardTab = 'overview' | 'apply' | 'health-screening';

export function DonorDashboard({ user }: DonorDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to access the donor dashboard.</p>
        </div>
      </div>
    );
  }

  const userId = user.id || '';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Donor Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name}!</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-lg shadow-md border-b border-gray-200">
          <div className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-700 border-transparent hover:text-red-600'
              }`}
            >
              <Home className="w-5 h-5" />
              Application Status
            </button>
            <button
              onClick={() => setActiveTab('health-screening')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'health-screening'
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-700 border-transparent hover:text-red-600'
              }`}
            >
              <FileText className="w-5 h-5" />
              Health Screening Form
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-md p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <ApplicationStatus userId={userId} />
            </div>
          )}

          {/* Health Screening Tab */}
          {activeTab === 'health-screening' && (
            <HealthScreeningForm userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}
