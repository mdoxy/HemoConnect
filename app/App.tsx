import { useState } from 'react';
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
import { authAPI } from './services/authAPI';

type Page = 'home' | 'find-blood' | 'become-donor' | 'hospitals' | 'hospitals-list' | 'education' | 'donor-dashboard' | 'requestor-dashboard' | 'hospital-panel' | 'hospital-profile' | 'profile' | 'notifications';

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

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setPendingHospitalRequest(null);
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={user}
        onLogin={() => setShowLoginModal(true)}
        onSignup={() => setShowSignupModal(true)}
        onLogout={handleLogout}
      />
      
      <main className="flex-1">
        {currentPage === 'home' && <LandingPage onNavigate={setCurrentPage} onLogin={() => setShowLoginModal(true)} />}
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
        {currentPage === 'donor-dashboard' && <DonorDashboard user={user} />}
        {currentPage === 'requestor-dashboard' && <RequestorDashboard user={user} />}
        {currentPage === 'hospital-panel' && <HospitalPanel user={user} />}
        {currentPage === 'hospital-profile' && <HospitalProfile onLogout={handleLogout} onNavigate={setCurrentPage} />}
        {currentPage === 'profile' && <Profile user={user} />}
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