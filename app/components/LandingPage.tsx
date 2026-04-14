import { AlertCircle, MapPin, Shield, Users, Clock, Heart, Droplets, Activity, CheckCircle2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type Page = 'home' | 'find-blood' | 'become-donor' | 'hospitals' | 'hospitals-list' | 'education' | 'donor-dashboard' | 'requestor-dashboard' | 'hospital-panel' | 'profile' | 'notifications';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  onLogin: () => void;
}

export function LandingPage({ onNavigate, onLogin }: LandingPageProps) {
  const handleRequestBloodNow = () => {
    onNavigate('find-blood');
  };

  return (
    <div className="bg-white">
      {/* Hero Section - Emergency Focused */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1763149191834-471c980404f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZW1lcmdlbmN5JTIwaG9zcGl0YWwlMjBtb2Rlcm58ZW58MXx8fHwxNzY5Njc5NzYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Medical Emergency"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            {/* Emergency Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Real-Time Blood Donor Network</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Every Second Counts.<br />
              <span className="text-red-200">Find Blood. Save Lives.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-red-100 mb-8 leading-relaxed">
              Connect with verified blood donors in real-time during emergencies. 
              GPS-powered matching. Hospital-verified. Trusted by thousands.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={handleRequestBloodNow}
                type="button"
                className="group relative z-20 w-full sm:w-auto min-h-[56px] flex items-center justify-center gap-2 bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <AlertCircle className="w-5 h-5 group-hover:animate-pulse" />
                Request Blood Now
              </button>

            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-red-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Hospital Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>GPS-Based Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      </section>

      {/* Live Stats Section */}
      <section className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">12,450+</div>
              <div className="text-sm text-gray-600">Active Donors</div>
              <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                Online Now
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">8,920</div>
              <div className="text-sm text-gray-600">Requests Fulfilled</div>
              <div className="text-xs text-gray-500 mt-1">This Month</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">340+</div>
              <div className="text-sm text-gray-600">Partner Hospitals</div>
              <div className="text-xs text-gray-500 mt-1">Verified Network</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">&lt; 15min</div>
              <div className="text-sm text-gray-600">Average Response</div>
              <div className="text-xs text-gray-500 mt-1">In Emergencies</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How HemoConnect Works</h2>
            <p className="text-xl text-gray-600">Fast, reliable, and verified blood donation in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Request Blood</h3>
              <p className="text-gray-600 mb-4">
                Submit your emergency request with blood type, location, and urgency level. Upload medical documents for verification.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Instant request submission
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Hospital verification
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">GPS Matching</h3>
              <p className="text-gray-600 mb-4">
                Our smart system finds compatible donors near you in real-time. Donors receive instant notifications.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Blood type compatibility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Distance-based priority
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Donate & Save</h3>
              <p className="text-gray-600 mb-4">
                Donors accept requests and visit authorized hospitals. Track donation status in real-time.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Authorized hospitals only
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Real-time tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose HemoConnect?</h2>
            <p className="text-xl text-gray-600">The most trusted blood donation platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Verified Users</h3>
                <p className="text-gray-600 text-sm">All donors and hospitals are verified with medical documents and official IDs.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">GPS-Based Matching</h3>
                <p className="text-gray-600 text-sm">Find the nearest compatible donors instantly using real-time location data.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
                <p className="text-gray-600 text-sm">Track your request status and receive instant notifications at every step.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Emergency Priority</h3>
                <p className="text-gray-600 text-sm">Critical requests get top priority with immediate notifications to nearby donors.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Large Network</h3>
                <p className="text-gray-600 text-sm">Access to thousands of verified donors and hundreds of partner hospitals.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Privacy</h3>
                <p className="text-gray-600 text-sm">Your medical information is encrypted and protected with industry standards.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of donors and help save lives in your community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
  
            <button
              onClick={onLogin}
              className="bg-red-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-800 transition-colors border-2 border-white"
            >
              Login to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
