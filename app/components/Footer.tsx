import { Heart, Phone, Mail, MapPin, Clock, Droplets } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="w-6 h-6" fill="white" />
              <span className="text-xl font-bold">HemoConnect</span>
            </div>
            <p className="text-gray-400 text-sm">
              Smart blood donation platform connecting donors, patients, and hospitals in real-time. Saving lives through verified, GPS-powered matching.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How to Donate</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Eligibility</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Emergency: (555) 911-BLOOD<br />General: (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>info@lifebloodbank.org</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>123 Healthcare Blvd<br />New York, NY 10001</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold mb-4">Operating Hours</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Mon - Fri: 7:00 AM - 7:00 PM</span>
              </li>
              <li className="ml-6">Saturday: 8:00 AM - 5:00 PM</li>
              <li className="ml-6">Sunday: 9:00 AM - 3:00 PM</li>
              <li className="mt-4 text-red-400 font-semibold">
                24/7 Emergency Service Available
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 HemoConnect. All rights reserved. Saving lives, one donation at a time.</p>
        </div>
      </div>
    </footer>
  );
}