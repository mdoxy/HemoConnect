import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Heart, ArrowRight, Filter, Search, ChevronRight, Phone, Star, Plus, X } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  organizer: string;
  organizerType: 'hospital' | 'blood-bank' | 'ngo' | 'institution';
  date: string;
  time: string;
  endTime: string;
  location: string;
  distance: string;
  bloodTypesNeeded: string[];
  spotsAvailable: number;
  totalSpots: number;
  description: string;
  contact: string;
  urgent: boolean;
  reward?: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    title: 'World Blood Donor Day Mega Drive',
    organizer: 'Apollo Hospitals',
    organizerType: 'hospital',
    date: '2026-06-14',
    time: '08:00 AM',
    endTime: '06:00 PM',
    location: 'Apollo Hospital Campus, Jubilee Hills',
    distance: '2.3 km',
    bloodTypesNeeded: ['O-', 'O+', 'AB-'],
    spotsAvailable: 45,
    totalSpots: 100,
    description: 'Join us for our annual World Blood Donor Day mega event. Free health checkup, refreshments, and certificates for all donors.',
    contact: '+91 98765 43210',
    urgent: true,
    reward: 'Free health screening + certificate',
  },
  {
    id: '2',
    title: 'Monthly Community Blood Drive',
    organizer: 'Red Cross Blood Bank',
    organizerType: 'blood-bank',
    date: '2026-06-20',
    time: '09:00 AM',
    endTime: '04:00 PM',
    location: 'Red Cross Society, Banjara Hills',
    distance: '4.1 km',
    bloodTypesNeeded: ['A+', 'B+', 'A-', 'B-'],
    spotsAvailable: 28,
    totalSpots: 60,
    description: 'Our monthly community blood donation drive. Every drop counts. Come be a hero today!',
    contact: '+91 98765 11111',
    urgent: false,
    reward: 'Refreshments provided',
  },
  {
    id: '3',
    title: 'University Campus Donation Camp',
    organizer: 'JNTU Hyderabad',
    organizerType: 'institution',
    date: '2026-06-22',
    time: '10:00 AM',
    endTime: '03:00 PM',
    location: 'JNTU Campus, Kukatpally',
    distance: '6.8 km',
    bloodTypesNeeded: ['All Types'],
    spotsAvailable: 80,
    totalSpots: 150,
    description: 'Annual blood donation camp organized by the NSS unit of JNTU. Open to all — students, staff, and public.',
    contact: '+91 87654 32100',
    urgent: false,
  },
  {
    id: '4',
    title: 'Emergency O- Blood Collection Drive',
    organizer: 'Yashoda Hospitals',
    organizerType: 'hospital',
    date: '2026-06-19',
    time: '07:00 AM',
    endTime: '08:00 PM',
    location: 'Yashoda Hospital, Secunderabad',
    distance: '5.5 km',
    bloodTypesNeeded: ['O-'],
    spotsAvailable: 15,
    totalSpots: 30,
    description: 'URGENT: Critical shortage of O- blood. Hospital is requesting emergency donors. All donors receive priority health checkup.',
    contact: '+91 90000 12345',
    urgent: true,
    reward: 'Priority health checkup + meal',
  },
  {
    id: '5',
    title: 'Rotary Club Quarterly Blood Drive',
    organizer: 'Rotary Club Hyderabad',
    organizerType: 'ngo',
    date: '2026-06-28',
    time: '09:30 AM',
    endTime: '05:00 PM',
    location: 'Rotary Bhavan, Secunderabad',
    distance: '7.2 km',
    bloodTypesNeeded: ['A+', 'B+', 'AB+', 'O+'],
    spotsAvailable: 55,
    totalSpots: 80,
    description: 'Quarterly blood donation drive by Rotary Club. Come donate blood and win exciting prizes. Lunch provided to all donors.',
    contact: '+91 91234 56789',
    urgent: false,
    reward: 'Lunch + prize draw entry',
  },
];

const organizerColors: Record<Campaign['organizerType'], string> = {
  hospital: 'bg-blue-100 text-blue-700',
  'blood-bank': 'bg-red-100 text-red-700',
  ngo: 'bg-green-100 text-green-700',
  institution: 'bg-purple-100 text-purple-700',
};

const organizerLabels: Record<Campaign['organizerType'], string> = {
  hospital: 'Hospital',
  'blood-bank': 'Blood Bank',
  ngo: 'NGO / Club',
  institution: 'Institution',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getSpotsPercent(available: number, total: number): number {
  return Math.round(((total - available) / total) * 100);
}

interface CampaignsProps {
  onSignup?: () => void;
  onLogin?: () => void;
  user?: { name: string; role: string | null } | null;
}

export function Campaigns({ onSignup, onLogin, user }: CampaignsProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<Campaign['organizerType'] | 'all'>('all');
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [campaignsList, setCampaignsList] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = campaignsList.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.organizer.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || c.organizerType === filterType;
    const matchUrgent = !filterUrgent || c.urgent;
    return matchSearch && matchType && matchUrgent;
  });

  const handleRegister = (campaign: Campaign) => {
    if (!user) {
      onSignup?.();
      return;
    }
    setRegisteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(campaign.id)) {
        next.delete(campaign.id);
      } else {
        next.add(campaign.id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-rose-600 via-red-600 to-red-700 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Calendar className="w-4 h-4 text-rose-200" />
            <span className="text-sm font-medium text-rose-100">Nearby Events & Drives</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blood Donation Campaigns</h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto">
            Discover upcoming blood donation drives, camps, and events organized by hospitals, blood banks,
            institutions, and NGOs near you.
          </p>
          <div className="mt-8 flex justify-center gap-8 text-sm text-red-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>{campaignsList.length} Active Campaigns</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{campaignsList.reduce((s, c) => s + c.spotsAvailable, 0)} Spots Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns, organizers, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Organizer Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as Campaign['organizerType'] | 'all')}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="all">All Organizers</option>
                <option value="hospital">Hospitals</option>
                <option value="blood-bank">Blood Banks</option>
                <option value="ngo">NGOs / Clubs</option>
                <option value="institution">Institutions</option>
              </select>
            </div>

            {/* Urgent Toggle */}
            <button
              onClick={() => setFilterUrgent(!filterUrgent)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                filterUrgent
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filterUrgent ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
              Urgent Only
            </button>

            {(user?.role === 'hospital' || user?.role === 'blood-bank') && (
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm ml-auto sm:ml-0"
              >
                <Plus className="w-4 h-4" /> Arrange Campaign
              </button>
            )}

            <span className={`text-sm text-gray-500 ${user?.role === 'hospital' || user?.role === 'blood-bank' ? 'ml-0' : 'ml-auto'}`}>
              {filtered.length} campaigns found
            </span>
          </div>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No campaigns found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((campaign) => {
              const isRegistered = registeredIds.has(campaign.id);
              const spotsPercent = getSpotsPercent(campaign.spotsAvailable, campaign.totalSpots);
              const isFull = campaign.spotsAvailable === 0;

              return (
                <div
                  key={campaign.id}
                  className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md ${
                    campaign.urgent ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${organizerColors[campaign.organizerType]}`}>
                          {organizerLabels[campaign.organizerType]}
                        </span>
                        {campaign.urgent && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-600 text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            URGENT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                        <MapPin className="w-3 h-3" />
                        {campaign.distance}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">{campaign.title}</h3>
                    <p className="text-sm text-red-600 font-medium mb-3">{campaign.organizer}</p>

                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{campaign.description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm font-medium text-gray-800">{formatDate(campaign.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="text-sm font-medium text-gray-800">{campaign.time} – {campaign.endTime}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Venue</p>
                          <p className="text-sm font-medium text-gray-800">{campaign.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Blood Types Needed */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Blood types needed:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {campaign.bloodTypesNeeded.map((bt) => (
                          <span
                            key={bt}
                            className="text-xs font-bold px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full"
                          >
                            {bt}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Reward */}
                    {campaign.reward && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                        <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>{campaign.reward}</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {campaign.totalSpots - campaign.spotsAvailable} registered
                        </span>
                        <span className={isFull ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {isFull ? 'Fully booked' : `${campaign.spotsAvailable} spots left`}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            spotsPercent >= 90 ? 'bg-red-500' : spotsPercent >= 60 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${spotsPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6 flex items-center gap-3">
                    <button
                      onClick={() => handleRegister(campaign)}
                      disabled={isFull && !isRegistered}
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        isRegistered
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : isFull
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {isRegistered ? (
                        <>✓ Registered</>
                      ) : isFull ? (
                        'Fully Booked'
                      ) : (
                        <>
                          {user ? 'Register to Donate' : 'Sign Up to Register'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <a
                      href={`tel:${campaign.contact}`}
                      className="flex items-center justify-center gap-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:border-red-300 hover:text-red-600 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA for non-users */}
        {!user && (
          <div className="mt-12 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-8 text-center text-white">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-bold mb-2">Want to stay notified?</h3>
            <p className="text-red-100 mb-6 max-w-xl mx-auto">
              Sign up to register for campaigns, get notified about urgent drives near you, and track your donation history.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onSignup}
                className="px-8 py-3 bg-white text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors shadow-md"
              >
                Create Free Account
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                Already have an account? Log in
              </button>
            </div>
          </div>
        )}
      </div>
      {/* New Campaign Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Arrange a Campaign</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const newCamp: Campaign = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: fd.get('title') as string,
                    organizer: user?.name || 'Your Hospital',
                    organizerType: user?.role === 'hospital' ? 'hospital' : 'blood-bank',
                    date: fd.get('date') as string,
                    time: fd.get('time') as string,
                    endTime: fd.get('endTime') as string,
                    location: fd.get('location') as string,
                    distance: '0 km', // Demo default
                    bloodTypesNeeded: (fd.get('bloodTypes') as string).split(',').map(s => s.trim()),
                    spotsAvailable: parseInt(fd.get('totalSpots') as string) || 50,
                    totalSpots: parseInt(fd.get('totalSpots') as string) || 50,
                    description: fd.get('description') as string,
                    contact: fd.get('contact') as string,
                    urgent: fd.get('urgent') === 'on',
                    reward: fd.get('reward') as string,
                  };
                  setCampaignsList([newCamp, ...campaignsList]);
                  setShowNewModal(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title *</label>
                  <input required name="title" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="e.g. Summer Blood Drive" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input required type="date" name="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input required name="location" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Venue details" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input required type="time" name="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input required type="time" name="endTime" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Types Needed (comma separated) *</label>
                  <input required name="bloodTypes" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" defaultValue="All Types" placeholder="A+, B+, O-" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Spots *</label>
                    <input required type="number" name="totalSpots" defaultValue="50" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                    <input required name="contact" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="+91 XXXXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea required name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Provide details about the campaign..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="urgent" name="urgent" className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                  <label htmlFor="urgent" className="text-sm font-medium text-gray-700">Mark as Urgent Requirement</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward (Optional)</label>
                  <input name="reward" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="e.g. Certificate, Refreshments" />
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">Create Campaign</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
