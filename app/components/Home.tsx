import { Heart, Clock, Users, Shield } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

interface HomeProps {
  onNavigate: (page: 'home' | 'inventory' | 'donate' | 'request') => void;
}

export function Home({ onNavigate }: HomeProps) {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-[500px] bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1697192156499-d85cfe1452c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9vZCUyMGRvbmF0aW9uJTIwbWVkaWNhbHxlbnwxfHx8fDE3Njk1NjA3MTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Blood Donation"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Give Blood, Save Lives</h1>
            <p className="text-xl mb-8">
              Your donation can make the difference between life and death. Join our community of heroes today.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => onNavigate('donate')}
                className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Donate Now
              </button>
              <button
                onClick={() => onNavigate('request')}
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
              >
                Request Blood
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Heart className="w-12 h-12 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">15,000+</div>
              <div className="text-gray-600">Lives Saved</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Users className="w-12 h-12 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">8,500+</div>
              <div className="text-gray-600">Active Donors</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Clock className="w-12 h-12 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
              <div className="text-gray-600">Available</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Shield className="w-12 h-12 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">100%</div>
              <div className="text-gray-600">Safe & Secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Donate Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Donate Blood?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Save Lives</h3>
              <p className="text-gray-600">
                One donation can save up to three lives. Your blood helps accident victims, cancer patients, and those undergoing surgery.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quick & Easy</h3>
              <p className="text-gray-600">
                The donation process takes only 10-15 minutes. Our trained staff ensures your safety and comfort throughout.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Health Benefits</h3>
              <p className="text-gray-600">
                Regular blood donation helps reduce iron stores, improves cardiovascular health, and includes a free mini health screening.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Eligibility Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Who Can Donate?</h2>
          
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-700">Age between 18-65 years</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-700">Weight at least 50 kg (110 lbs)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-700">In good general health</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-700">No recent tattoos or piercings (within 6 months)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-700">Not pregnant or breastfeeding</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
