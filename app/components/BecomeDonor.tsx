import { AlertCircle } from 'lucide-react';
import HealthScreeningForm from './HealthScreeningForm';

interface User {
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
}

interface BecomeDonorProps {
  user: User | null;
  onLogin: () => void;
}

export function BecomeDonor({ user, onLogin }: BecomeDonorProps) {
  // If user is not logged in, show login required card
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Please Login
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to become a donor.
            </p>
            <button
              onClick={onLogin}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
            >
              Login to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in, show health screening form
  return <HealthScreeningForm />;
}
