import { useState, type ReactNode } from 'react';
import { Droplets, Bell, ChevronDown, LogOut, LayoutDashboard, UserCircle, Menu, X, Megaphone } from 'lucide-react';

type Page = 'home' | 'find-blood' | 'become-donor' | 'hospitals' | 'hospitals-list' | 'education' | 'campaigns' | 'donor-dashboard' | 'requestor-dashboard' | 'hospital-panel' | 'hospital-profile' | 'profile' | 'notifications';

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  let navLinks: { label: string; page: Page; icon?: ReactNode }[] = [
    { label: 'Home', page: 'home' },
    { label: 'Find Blood', page: 'find-blood' },
    { label: 'Become Donor', page: 'become-donor' },
    { label: 'Hospitals', page: 'hospitals-list' },
    { label: 'Awareness', page: 'education' },
    { label: 'Campaigns', page: 'campaigns', icon: <Megaphone className="w-3.5 h-3.5" /> },
  ];

  if (user?.role === 'requestor') {
    navLinks = [
      { label: 'Dashboard', page: 'requestor-dashboard' },
      { label: 'Find Blood', page: 'find-blood' },
      { label: 'Hospitals', page: 'hospitals-list' },
      { label: 'Awareness', page: 'education' },
      { label: 'Campaigns', page: 'campaigns', icon: <Megaphone className="w-3.5 h-3.5" /> },
    ];
  } else if (user?.role === 'donor') {
    navLinks = [
      { label: 'Dashboard', page: 'donor-dashboard' },
      { label: 'Hospitals', page: 'hospitals-list' },
      { label: 'Awareness', page: 'education' },
      { label: 'Campaigns', page: 'campaigns', icon: <Megaphone className="w-3.5 h-3.5" /> },
    ];
  } else if (user?.role === 'hospital') {
    navLinks = [
      { label: 'Dashboard', page: 'hospital-panel' },
      { label: 'Awareness', page: 'education' },
      { label: 'Campaigns', page: 'campaigns', icon: <Megaphone className="w-3.5 h-3.5" /> },
    ];
  }

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
            onClick={() => onNavigate(getDashboardPage())}
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

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, page, icon }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentPage === page
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>

          {/* Right Side - Auth / User Menu */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
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

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ label, page, icon }) => (
              <button
                key={page}
                onClick={() => { onNavigate(page); setShowMobileMenu(false); }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
                  currentPage === page
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
            {!user && (
              <div className="flex gap-3 pt-3 border-t border-gray-100 mt-1">
                <button
                  onClick={() => { onLogin(); setShowMobileMenu(false); }}
                  className="flex-1 py-2.5 text-center text-gray-700 font-medium border border-gray-300 rounded-lg hover:text-red-600 hover:border-red-300 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => { onSignup(); setShowMobileMenu(false); }}
                  className="flex-1 py-2.5 text-center bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
