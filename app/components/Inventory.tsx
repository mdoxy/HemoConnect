import { Droplet, AlertTriangle, CheckCircle } from 'lucide-react';

interface BloodType {
  type: string;
  units: number;
  status: 'critical' | 'low' | 'adequate' | 'good';
}

const bloodInventory: BloodType[] = [
  { type: 'A+', units: 45, status: 'good' },
  { type: 'A-', units: 12, status: 'low' },
  { type: 'B+', units: 38, status: 'adequate' },
  { type: 'B-', units: 8, status: 'critical' },
  { type: 'AB+', units: 15, status: 'low' },
  { type: 'AB-', units: 5, status: 'critical' },
  { type: 'O+', units: 52, status: 'good' },
  { type: 'O-', units: 18, status: 'adequate' },
];

export function Inventory() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'low':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'adequate':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'good':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'critical' || status === 'low') {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blood Inventory</h1>
          <p className="text-xl text-gray-600">Current availability of blood types</p>
        </div>

        {/* Status Legend */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Status Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">Critical (&lt;10 units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-700">Low (10-20 units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">Adequate (21-40 units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">Good (&gt;40 units)</span>
            </div>
          </div>
        </div>

        {/* Blood Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bloodInventory.map((blood) => (
            <div
              key={blood.type}
              className={`border-2 rounded-lg p-6 transition-transform hover:scale-105 ${getStatusColor(blood.status)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Droplet className="w-8 h-8" fill="currentColor" />
                  <span className="text-3xl font-bold">{blood.type}</span>
                </div>
                {getStatusIcon(blood.status)}
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-semibold">{blood.units} units</div>
                <div className="text-sm font-medium uppercase">{blood.status}</div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-current transition-all"
                  style={{ width: `${Math.min((blood.units / 60) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Urgent Need Banner */}
        <div className="mt-12 bg-red-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Urgent Need for Blood!</h3>
              <p className="mb-4">
                We are currently experiencing critical shortages in B-, AB-, and other blood types. 
                Your donation is needed now more than ever.
              </p>
              <div className="flex gap-4">
                <span className="font-semibold">Most Needed:</span>
                <div className="flex gap-3">
                  {bloodInventory
                    .filter((b) => b.status === 'critical')
                    .map((b) => (
                      <span key={b.type} className="bg-white text-red-600 px-3 py-1 rounded-full font-semibold">
                        {b.type}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blood Type Compatibility */}
        <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Blood Type Compatibility</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Universal Donor & Recipient</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                  <span className="text-gray-700"><strong>O-</strong> - Universal Donor (can donate to all)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                  <span className="text-gray-700"><strong>AB+</strong> - Universal Recipient (can receive from all)</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Important Facts</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Blood type O+ is the most common (37% of population)</li>
                <li>• Blood type AB- is the rarest (0.6% of population)</li>
                <li>• One donation can save up to 3 lives</li>
                <li>• Blood can be stored for up to 42 days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
