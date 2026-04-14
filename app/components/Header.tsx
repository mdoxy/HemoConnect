import { useState } from 'react';
import { Droplets, Bell, User, ChevronDown, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';

type Page = 'home' | 'find-blood' | 'become-donor' | 'hospitals' | 'hospitals-list' | 'education' | 'donor-dashboard' | 'requestor-dashboard' | 'hospital-panel' | 'hospital-profile' | 'profile' | 'notifications';

interface UserData {
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
}

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: UserData | null;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
}

export function Header({ currentPage, onNavigate, user, onLogin, onSignup, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getDashboardPage = (): Page => {
    if (user?.role === 'donor') return 'donor-dashboard';
    if (user?.role === 'requestor') return 'requestor-dashboard';
    if (user?.role === 'hospital') return 'hospital-panel';
    return 'home';
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="relative">
              <Droplets className="w-8 h-8 text-red-600 group-hover:text-red-700 transition-colors" fill="currentColor" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                HemoConnect
              </span>
              <div className="text-[10px] text-gray-500 -mt-1">Smart Blood Donation</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'home'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('find-blood')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'find-blood'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Find Blood
            </button>
            <button
              onClick={() => onNavigate('become-donor')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'become-donor'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Become Donor
            </button>
            <button
              onClick={() => onNavigate('hospitals-list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'hospitals-list'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Hospitals
            </button>
            <button
              onClick={() => onNavigate('education')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'education'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Awareness / Learn
            </button>
          </nav>

          {/* Right Side - Auth / User Menu */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <button
                  onClick={onLogin}
                  className="px-4 py-2 text-gray-700 font-medium hover:text-red-600 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={onSignup}
                  className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                {/* Notifications */}
                <button
                  onClick={() => onNavigate('notifications')}
                  className="relative p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        {user.name}
                        {user.verified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <button
                        onClick={() => {
                          onNavigate(getDashboardPage());
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          if (user.role === 'hospital') {
                            onNavigate('hospital-profile');
                          } else {
                            onNavigate('profile');
                          }
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <UserCircle className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('notifications');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        Notifications
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
