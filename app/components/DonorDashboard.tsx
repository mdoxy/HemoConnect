import { useState, useEffect } from 'react';
import {
  AlertCircle, FileText, LayoutDashboard, Calendar, Heart,
  CheckCircle, Clock, XCircle, Droplet, Award, Star,
  TrendingUp, Bell, RefreshCw, ChevronRight, Shield,
  Activity, Gift, Users, Zap, X, Loader
} from 'lucide-react';
import HealthScreeningForm from './HealthScreeningForm';
import { ApplicationStatus } from './ApplicationStatus';
import { ScheduleDonationModal } from './ScheduleDonationModal';
import { apiUrl } from '../services/api';

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface User {
  id?: string;
  _id?: string;
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
  email?: string;
}

interface ApplicationData {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  bloodGroup?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  hospitalRemarks?: string;
  submittedAt: string;
  updatedAt: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  scheduledAt?: string | null;
}

type Tab = 'overview' | 'application' | 'schedule' | 'impact';

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */
function formatDate(iso?: string | null) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr?: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function daysAgo(dateStr?: string | null) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/* ─── Impact badges ──────────────────────────────────────────────────────────── */
const BADGES = [
  { id: 'first', icon: '🩸', label: 'First Drop', desc: 'Made your first donation', unlocked: true },
  { id: 'hero', icon: '🦸', label: 'Life Hero', desc: 'Donated 3+ times', unlocked: false },
  { id: 'champion', icon: '🏆', label: 'Blood Champion', desc: 'Donated 10+ times', unlocked: false },
  { id: 'rare', icon: '💎', label: 'Rare Type', desc: 'Rare blood group donor', unlocked: false },
  { id: 'streak', icon: '🔥', label: 'Streak Donor', desc: 'Donated 3 months in a row', unlocked: false },
  { id: 'community', icon: '🌍', label: 'Community Pillar', desc: 'Referred 5+ donors', unlocked: false },
];

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────────────── */
export function DonorDashboard({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [donationCount] = useState(1); // Would come from API in production

  const userId = user?.id || user?._id || '';

  /* ── Fetch donor application ── */
  useEffect(() => {
    if (!userId) { setAppLoading(false); return; }
    const fetchApp = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/donor/status/${userId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setApplication(data.data);
        }
      } catch { /* silent */ }
      finally { setAppLoading(false); }
    };
    fetchApp();
    const id = setInterval(fetchApp, 15000);
    return () => clearInterval(id);
  }, [userId]);

  const handleSchedule = async (date: string, time: string) => {
    if (!application) return;
    const token = localStorage.getItem('token');
    const res = await fetch(apiUrl(`/donor/schedule-donation/${application._id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ scheduledDate: date, scheduledTime: time }),
    });
    if (res.ok) {
      const data = await res.json();
      setApplication(data.data);
      setShowScheduleModal(false);
    }
  };

  /* ── Guards ── */
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to access your donor dashboard.</p>
        </div>
      </div>
    );
  }

  /* ── Derived ── */
  const appStatus = application?.status;
  const isApproved = appStatus === 'Approved';
  const isPending  = appStatus === 'Pending';
  const hasScheduled = isApproved && application?.scheduledDate;
  const scheduledDays = hasScheduled ? daysUntil(application?.scheduledDate) : null;
  const lastDonationDays = hasScheduled ? daysAgo(application?.scheduledDate) : null;

  /* ── Next eligible donation: 56 days after last ── */
  const nextEligibleDays = lastDonationDays !== null ? Math.max(0, 56 - lastDonationDays) : null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',     label: 'Overview',       icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'application',  label: 'My Application', icon: <FileText        className="w-4 h-4" /> },
    { id: 'schedule',     label: 'Donation Schedule', icon: <Calendar     className="w-4 h-4" /> },
    { id: 'impact',       label: 'My Impact',      icon: <Heart           className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow">
              <Droplet className="w-5 h-5 text-white" fill="white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-gray-900 text-sm leading-none">{user.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Donor Dashboard
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Status chip */}
            {appLoading ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-500">
                <Loader className="w-3 h-3 animate-spin" /> Loading…
              </div>
            ) : appStatus ? (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                isApproved  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isPending  ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500 animate-pulse' : isPending ? 'bg-amber-500' : 'bg-red-500'}`} />
                {appStatus} Donor
              </div>
            ) : null}

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
                {isPending && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    <button onClick={() => setShowNotif(false)}><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {isPending && (
                      <div className="px-4 py-3 flex gap-3 items-start hover:bg-gray-50">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Application under review</p>
                          <p className="text-xs text-gray-500">Expected within 24–48 hours</p>
                        </div>
                      </div>
                    )}
                    {isApproved && !hasScheduled && (
                      <div className="px-4 py-3 flex gap-3 items-start hover:bg-gray-50">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Application approved! 🎉</p>
                          <p className="text-xs text-gray-500">Schedule your first donation now</p>
                        </div>
                      </div>
                    )}
                    {!isPending && !isApproved && (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex gap-0.5 border-t border-gray-100">
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ══════════════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Welcome hero */}
            <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-400/10 rounded-full translate-y-10 -translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Droplet className="w-6 h-6" fill="white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-snug">Welcome back, {user.name.split(' ')[0]}! 👋</p>
                    <p className="text-red-100 text-sm">
                      {user.bloodType ? `Blood Type: ${user.bloodType}` : 'Donor since joining HemoConnect'}
                    </p>
                  </div>
                </div>
                <p className="text-red-100 text-sm mb-4">
                  {isApproved
                    ? 'You are a verified donor. Every donation can save up to 3 lives! 🩸'
                    : isPending
                    ? 'Your application is under review. We\'ll notify you once verified.'
                    : 'Complete your health screening to become a verified donor.'}
                </p>
                {isApproved && !hasScheduled && (
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <Calendar className="w-4 h-4" /> Schedule Donation
                  </button>
                )}
                {!appStatus && (
                  <button
                    onClick={() => setActiveTab('application')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4" /> Start Application
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Application Status',
                  value: appStatus || 'Not Applied',
                  icon: Shield,
                  color: isApproved ? 'emerald' : isPending ? 'amber' : 'gray',
                  sub: isApproved ? 'Verified Donor' : isPending ? 'Under Review' : 'Apply now',
                },
                {
                  label: 'Total Donations',
                  value: donationCount,
                  icon: Droplet,
                  color: 'red',
                  sub: `${donationCount * 3} lives impacted`,
                },
                {
                  label: 'Next Donation',
                  value: nextEligibleDays !== null ? (nextEligibleDays === 0 ? 'Eligible!' : `${nextEligibleDays}d`) : '—',
                  icon: Calendar,
                  color: nextEligibleDays === 0 ? 'emerald' : 'blue',
                  sub: nextEligibleDays === 0 ? 'You can donate today' : nextEligibleDays !== null ? 'Days remaining' : 'No donations yet',
                },
                {
                  label: 'Impact Score',
                  value: isApproved ? `${donationCount * 10 + 5}` : '0',
                  icon: Star,
                  color: 'purple',
                  sub: 'Donor reputation',
                },
              ].map(({ label, value, icon: Icon, color, sub }) => {
                const colors: Record<string, string> = {
                  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
                  amber:   'border-amber-200   bg-amber-50   text-amber-600',
                  gray:    'border-gray-200    bg-gray-50    text-gray-500',
                  red:     'border-red-200     bg-red-50     text-red-600',
                  blue:    'border-blue-200    bg-blue-50    text-blue-600',
                  purple:  'border-purple-200  bg-purple-50  text-purple-600',
                };
                const [border, bg, text] = colors[color].split(' ');
                return (
                  <div key={label} className={`bg-white rounded-2xl border ${border} p-4 shadow-sm`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg} ${text}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-xl font-bold text-gray-900 truncate">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                    <div className={`text-[11px] font-semibold mt-1 ${text}`}>{sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Donation Journey Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-5 h-5 text-red-600" />
                <h2 className="font-bold text-gray-900">Your Donor Journey</h2>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-5">
                  {[
                    {
                      label: 'Signed Up',
                      desc: 'Joined HemoConnect as a donor',
                      done: true,
                      active: false,
                    },
                    {
                      label: 'Health Screening',
                      desc: application ? `Submitted on ${formatDate(application.submittedAt)}` : 'Complete the health form to begin',
                      done: !!application,
                      active: !application,
                    },
                    {
                      label: 'Verification',
                      desc: isApproved ? 'Verified by hospital panel ✓' : isPending ? 'Review in progress (24–48h)' : application?.status === 'Rejected' ? 'Not approved — contact hospital' : 'Pending submission',
                      done: isApproved,
                      active: isPending,
                      rejected: appStatus === 'Rejected',
                    },
                    {
                      label: 'First Donation',
                      desc: hasScheduled ? `Scheduled for ${formatDate(application?.scheduledDate)}` : isApproved ? 'Schedule your donation appointment' : 'Requires verification first',
                      done: false,
                      active: isApproved && !hasScheduled,
                    },
                    {
                      label: 'Lifetime Donor',
                      desc: 'Donate regularly to earn this badge',
                      done: false,
                      active: false,
                    },
                  ].map((step, i) => {
                    const iconBg = step.rejected
                      ? 'bg-red-500'
                      : step.done
                      ? 'bg-emerald-500'
                      : step.active
                      ? 'bg-amber-400'
                      : 'bg-gray-200';
                    const StepIcon = step.rejected ? XCircle : step.done ? CheckCircle : Clock;
                    return (
                      <div key={i} className="relative flex gap-4 pl-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${iconBg}`}>
                          <StepIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-bold ${step.done || step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                            {step.active && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">In Progress</span>
                            )}
                          </div>
                          <p className={`text-xs ${step.done || step.active ? 'text-gray-600' : 'text-gray-400'}`}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: FileText,
                  label: 'Health Screening',
                  desc: 'View or update your form',
                  tab: 'application' as Tab,
                  color: 'blue',
                },
                {
                  icon: Calendar,
                  label: 'Donation Schedule',
                  desc: isApproved ? (hasScheduled ? 'View appointment' : 'Book your slot') : 'Requires approval first',
                  tab: 'schedule' as Tab,
                  color: 'emerald',
                },
                {
                  icon: Heart,
                  label: 'My Impact',
                  desc: 'Badges & donation stats',
                  tab: 'impact' as Tab,
                  color: 'rose',
                },
              ].map(({ icon: Icon, label, desc, tab, color }) => {
                const colors: Record<string, string> = {
                  blue:   'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                  rose:   'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
                };
                return (
                  <button
                    key={label}
                    onClick={() => setActiveTab(tab)}
                    className={`text-left flex items-center gap-4 p-4 rounded-2xl border transition-colors ${colors[color]}`}
                  >
                    <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-xs opacity-70 truncate">{desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            APPLICATION TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === 'application' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Application</h2>
              <p className="text-sm text-gray-500 mt-0.5">Your donor application status and health screening form</p>
            </div>

            {/* Application status card */}
            {appLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 flex items-center justify-center text-gray-400">
                <Loader className="w-5 h-5 animate-spin mr-2" />Loading application…
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status summary pill */}
                <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-medium ${
                  isApproved  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isPending  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : appStatus === 'Rejected' ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  {isApproved  ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  : isPending   ? <Clock      className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  : appStatus === 'Rejected' ? <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  : <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  <span>
                    {isApproved  ? 'Your donor application is approved — you are a verified donor!'
                    : isPending   ? `Application submitted on ${formatDate(application?.submittedAt)} — under review`
                    : appStatus === 'Rejected' ? 'Application was not approved — see remarks below'
                    : 'No application submitted yet. Complete the health form below.'}
                  </span>
                </div>

                {/* Existing ApplicationStatus component */}
                <ApplicationStatus userId={userId} />

                {/* Health screening form section */}
                {(!application || appStatus === 'Rejected') && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-gray-900">Health Screening Form</h3>
                      {!application && (
                        <span className="ml-auto text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          Required to apply
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <HealthScreeningForm userId={userId} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            SCHEDULE TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === 'schedule' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Donation Schedule</h2>
              <p className="text-sm text-gray-500">Manage your upcoming blood donation appointment</p>
            </div>

            {!isApproved ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Verification Required</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mb-4">
                  You need to be a verified donor to schedule a donation. Complete the health screening form first.
                </p>
                <button
                  onClick={() => setActiveTab('application')}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                >
                  Go to Application
                </button>
              </div>
            ) : hasScheduled ? (
              <div className="space-y-4">
                {/* Next appointment card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">Next Donation Appointment</p>
                        <p className="text-emerald-100 text-xs">All set — see you there!</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-emerald-200 text-xs mb-0.5">Date</p>
                        <p className="font-bold">{formatDate(application?.scheduledDate)}</p>
                      </div>
                      <div>
                        <p className="text-emerald-200 text-xs mb-0.5">Time</p>
                        <p className="font-bold">{application?.scheduledTime || 'N/A'}</p>
                      </div>
                    </div>
                    {scheduledDays !== null && (
                      <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-semibold">
                        {scheduledDays > 0 ? `⏳ ${scheduledDays} day${scheduledDays !== 1 ? 's' : ''} from today`
                          : scheduledDays === 0 ? '🎉 Today is your donation day!'
                          : `⚠️ Appointment was ${Math.abs(scheduledDays)} days ago`}
                      </div>
                    )}
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                    </button>
                  </div>
                </div>

                {/* Pre-donation checklist */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-gray-900">Pre-Donation Checklist</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { text: 'Stay well hydrated — drink 2–3 glasses of water', done: true },
                      { text: 'Eat a healthy meal 2–3 hours before donating', done: true },
                      { text: 'Avoid alcohol for 24 hours before donation', done: false },
                      { text: 'Bring valid photo ID to the donation center', done: false },
                      { text: 'Wear loose, comfortable clothing with sleeves that roll up', done: false },
                      { text: 'Get a good night\'s sleep the night before', done: false },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${item.done ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                          {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm ${item.done ? 'text-emerald-800 font-medium' : 'text-gray-600'}`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">No Appointment Yet</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mb-5">
                  You're verified and ready! Book your donation slot at any authorized hospital.
                </p>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
                >
                  <Calendar className="w-4 h-4" /> Schedule My Donation
                </button>
              </div>
            )}

            {/* Eligibility info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Donation Eligibility Rules</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Minimum age', value: '18 years' },
                  { label: 'Minimum weight', value: '50 kg' },
                  { label: 'Interval between whole blood donations', value: '56 days (8 weeks)' },
                  { label: 'Interval between platelet donations', value: '7 days' },
                  { label: 'Haemoglobin level', value: '>12.5 g/dL (women) / >13.0 (men)' },
                  { label: 'Blood pressure', value: '100–180 / 60–100 mmHg' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">{label}</p>
                      <p className="text-sm font-bold text-blue-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            IMPACT TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === 'impact' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Impact</h2>
              <p className="text-sm text-gray-500">Your donation history, achievements, and the lives you've touched</p>
            </div>

            {/* Impact stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Droplet, value: donationCount, label: 'Units Donated', sub: `${donationCount * 450}ml total`, color: 'red' },
                { icon: Users,   value: donationCount * 3, label: 'Lives Impacted', sub: 'Each unit can save 3 lives', color: 'emerald' },
                { icon: TrendingUp, value: `${donationCount * 10 + 5} pts`, label: 'Impact Score', sub: 'Keep donating to earn more', color: 'purple' },
              ].map(({ icon: Icon, value, label, sub, color }) => {
                const colors: Record<string, string> = {
                  red:    'from-red-500 to-rose-600',
                  emerald:'from-emerald-500 to-teal-600',
                  purple: 'from-purple-500 to-indigo-600',
                };
                return (
                  <div key={label} className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white`}>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-black">{value}</div>
                    <div className="font-semibold mt-0.5">{label}</div>
                    <div className="text-xs text-white/70 mt-0.5">{sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Donation history */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-gray-900">Donation History</h3>
              </div>
              {isApproved && hasScheduled ? (
                <div className="divide-y divide-gray-50">
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Droplet className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Scheduled Donation</p>
                      <p className="text-xs text-gray-500">{formatDate(application?.scheduledDate)} · {application?.scheduledTime}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full">
                      Scheduled
                    </span>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <Droplet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No donations recorded yet</p>
                  <p className="text-gray-400 text-sm mt-1">Your completed donations will appear here</p>
                </div>
              )}
            </div>

            {/* Achievements / Badges */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900">Achievements</h3>
                <span className="ml-auto text-xs text-gray-400">
                  {BADGES.filter(b => b.unlocked).length}/{BADGES.length} unlocked
                </span>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BADGES.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                      badge.unlocked
                        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-50 grayscale'
                    }`}
                  >
                    <div className={`text-3xl mb-2 ${badge.unlocked ? '' : 'filter grayscale'}`}>{badge.icon}</div>
                    <p className={`text-xs font-bold ${badge.unlocked ? 'text-amber-800' : 'text-gray-500'}`}>{badge.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{badge.desc}</p>
                    {badge.unlocked && (
                      <span className="mt-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Earned! ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA — referral */}
            <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Refer a Friend to Donate</p>
                  <p className="text-red-100 text-xs">Earn badges and help save more lives together</p>
                </div>
              </div>
              <p className="text-red-100 text-sm mb-4">
                Each referral unlocks the Community Pillar badge. Share your HemoConnect link and encourage others to join the movement.
              </p>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-rose-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
              >
                Copy Link 🔗
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Schedule Donation Modal */}
      {showScheduleModal && (
        <ScheduleDonationModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleSchedule}
          applicationId={application?._id || ''}
        />
      )}
    </div>
  );
}
