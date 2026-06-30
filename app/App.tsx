import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { FindBlood } from './components/FindBlood';
import { Education } from './components/Education';
import { BecomeDonor } from './components/BecomeDonor';
import { DonorDashboard } from './components/DonorDashboard';
import { RequestorDashboard } from './components/RequestorDashboard';
import { HospitalPanel } from './components/HospitalPanel';
import { HospitalList } from './components/HospitalList';
import { Profile } from './components/Profile';
import { HospitalProfile } from './components/HospitalProfile';
import { Notifications } from './components/Notifications';
import { LoginModal } from './components/LoginModal';
import { SignupModal } from './components/SignupModal';
import { Footer } from './components/Footer';
import { Campaigns } from './components/Campaigns';
import { authAPI } from './services/authAPI';
import { apiUrl } from './services/api';
import { requestNotificationPermission, onForegroundMessage } from './services/firebase-config';
import { toast, Toaster } from 'sonner';

type Page = 'home' | 'find-blood' | 'become-donor' | 'hospitals' | 'hospitals-list' | 'education' | 'campaigns' | 'donor-dashboard' | 'requestor-dashboard' | 'hospital-panel' | 'hospital-profile' | 'profile' | 'notifications';

type UserRole = 'donor' | 'requestor' | 'hospital' | null;

interface User {
  id?: string;
  _id?: string;
  name: string;
  role: UserRole;
  verified: boolean;
  bloodType?: string;
  email?: string;
}

interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  pincode: string;
  phone: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [user, setUser] = useState<User | null>(() => authAPI.getCurrentUser());
  const [pendingHospitalRequest, setPendingHospitalRequest] = useState<Hospital | null>(null);
  const fcmTokenRef = useRef<string | null>(null);

  // ─── FCM Registration ──────────────────────────────────────
  // When a user logs in, request notification permission and register the FCM token.
  useEffect(() => {
    if (!user) return;

    const userId = user.id || user._id;
    if (!userId) return;

    let unsubscribeForeground: (() => void) | undefined;

    const registerFCM = async () => {
      try {
        const token = await requestNotificationPermission();
        if (!token) return;

        fcmTokenRef.current = token;

        // Register token with backend
        await fetch(apiUrl('/auth/fcm-token'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, token, deviceType: 'web' }),
        });

        console.log('FCM token registered with backend');

        // Listen for foreground messages → show toast
        unsubscribeForeground = onForegroundMessage((payload) => {
          const title = payload?.notification?.title || 'HemoConnect';
          const body = payload?.notification?.body || '';
          toast(title, { description: body, duration: 6000 });
        });
      } catch (err) {
        console.warn('FCM registration failed (non-blocking):', err);
      }
    };

    registerFCM();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowLoginModal(false);
    
    // If we're in Find Blood flow with a pending hospital, don't navigate away
    if (currentPage === 'find-blood' && pendingHospitalRequest) {
      // Signal to FindBlood that auth is complete and it should open request form
      // This is handled via the rerenderKey pattern in FindBlood
      return;
    }
    
    // Otherwise, navigate to appropriate dashboard based on role
    if (userData.role === 'donor') {
      setCurrentPage('donor-dashboard');
    } else if (userData.role === 'requestor') {
      setCurrentPage('requestor-dashboard');
    } else if (userData.role === 'hospital') {
      setCurrentPage('hospital-panel');
    }
  };

  const handleSignup = (userData: User) => {
    setUser(userData);
    setShowSignupModal(false);
    
    // If we're in Find Blood flow with a pending hospital, don't navigate away
    if (currentPage === 'find-blood' && pendingHospitalRequest) {
      // Signal to FindBlood that auth is complete and it should open request form
      return;
    }
    
    // Otherwise, navigate to appropriate dashboard based on role
    if (userData.role === 'donor') {
      setCurrentPage('donor-dashboard');
    } else if (userData.role === 'requestor') {
      setCurrentPage('requestor-dashboard');
    } else if (userData.role === 'hospital') {
      setCurrentPage('hospital-panel');
    }
  };

  const handleLogout = async () => {
    // Deregister FCM token before clearing session
    const userId = user?.id || user?._id;
    if (userId && fcmTokenRef.current) {
      try {
        await fetch(apiUrl('/auth/fcm-token'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, token: fcmTokenRef.current, action: 'remove' }),
        });
      } catch (err) {
        console.warn('FCM token deregistration failed:', err);
      }
      fcmTokenRef.current = null;
    }

    authAPI.logout();
    setUser(null);
    setPendingHospitalRequest(null);
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" richColors closeButton />
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={user}
        onLogin={() => setShowLoginModal(true)}
        onSignup={() => setShowSignupModal(true)}
        onLogout={handleLogout}
      />
      
      <main className="flex-1">
        {currentPage === 'home' && <LandingPage onNavigate={setCurrentPage} onLogin={() => setShowLoginModal(true)} onSignup={() => setShowSignupModal(true)} />}
        {currentPage === 'find-blood' && (
          <FindBlood 
            onNavigate={setCurrentPage} 
            user={user}
            onSetPendingHospital={setPendingHospitalRequest}
            pendingHospital={pendingHospitalRequest}
            onLoginRequired={() => setShowLoginModal(true)}
            onSignupRequired={() => setShowSignupModal(true)}
          />
        )}
        {currentPage === 'become-donor' && <BecomeDonor user={user} onLogin={() => setShowLoginModal(true)} />}
        {currentPage === 'hospitals' && <HospitalList />}
        {currentPage === 'hospitals-list' && <HospitalList />}
        {currentPage === 'education' && <Education />}
        {currentPage === 'campaigns' && <Campaigns user={user} onLogin={() => setShowLoginModal(true)} onSignup={() => setShowSignupModal(true)} />}
        {currentPage === 'donor-dashboard' && <DonorDashboard user={user} />}
        {currentPage === 'requestor-dashboard' && <RequestorDashboard user={user} onNavigate={setCurrentPage} />}
        {currentPage === 'hospital-panel' && <HospitalPanel user={user} />}
        {currentPage === 'hospital-profile' && <HospitalProfile onLogout={handleLogout} onNavigate={setCurrentPage} />}
        {currentPage === 'profile' && <Profile user={user} onUpdateUser={handleLoginSuccess} />}
        {currentPage === 'notifications' && <Notifications />}
      </main>
      
      <Footer />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          onSwitchToSignup={() => {
            setShowLoginModal(false);
            setShowSignupModal(true);
          }}
        />
      )}

      {showSignupModal && (
        <SignupModal
          onClose={() => setShowSignupModal(false)}
          onSignup={handleSignup}
          onSwitchToLogin={() => {
            setShowSignupModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
}