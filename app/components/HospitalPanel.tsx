import {
  CheckCircle, XCircle, Clock, Users, Droplet, AlertCircle, Eye,
  Bell, LayoutDashboard, ClipboardList, ListOrdered, Building2,
  Phone, Share2, Menu, X, AlertTriangle, Zap, Heart, ChevronDown,
  Navigation, MapPin, Loader, RefreshCw, TrendingUp
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HospitalApplicationManager } from './HospitalApplicationManager';
import { apiUrl } from '../services/api';
import { parseCSV, Hospital as BloodBank } from '../utils/csvParser';

/* ─────────────────────────────────────────────────────────────────────────────
   Leaflet marker icons (fix broken default icons in Vite builds)
───────────────────────────────────────────────────────────────────────────── */
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
interface User {
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
}

interface HospitalPanelProps {
  user: User | null;
}

type Tab = 'dashboard' | 'blood-requests' | 'priority-queue' | 'nearby-requests' | 'map' | 'donor-applications';

/* Priority engine response */
interface PriorityQueueItem {
  _id: string;
  patient_name: string;
  blood_group: string;
  units_required: number;
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
  hospital_id?: string;
  status: string;
  priority_score: number;
  escalation_count: number;
  created_at: string;
  location?: { type: string; coordinates: [number, number] };
}

interface PriorityQueueResponse {
  success: boolean;
  active_queue_size: number;
  pending_db_count: number;
  top_request: PriorityQueueItem | null;
  processing_order: PriorityQueueItem[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
const PRIORITY_ENGINE_URL = (import.meta.env.VITE_PRIORITY_ENGINE_URL as string | undefined)?.trim() || 'http://localhost:8000';
const NEARBY_MOCK = [
  { id: '1', hospital: 'Apollo Hospitals',       blood: 'O-',  units: 4, lat: 18.5600, lng: 73.9200, urgency: 'critical' as const },
  { id: '2', hospital: 'Care Hospitals',          blood: 'AB+', units: 2, lat: 18.5100, lng: 73.8300, urgency: 'high'     as const },
  { id: '3', hospital: 'Yashoda Super Specialty', blood: 'B-',  units: 6, lat: 18.5400, lng: 73.8900, urgency: 'high'     as const },
  { id: '4', hospital: 'NIMS Hospital',           blood: 'A+',  units: 3, lat: 18.4900, lng: 73.8700, urgency: 'normal'   as const },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
function statusBadgeClass(status: string) {
  switch (status) {
    case 'Approved': return 'bg-green-100 text-green-800 border-green-300';
    case 'Rejected': return 'bg-red-100   text-red-800   border-red-300';
    case 'Pending':  return 'bg-amber-100 text-amber-800 border-amber-300';
    default:         return 'bg-gray-100  text-gray-800  border-gray-300';
  }
}

function urgencyBadge(urgency: string) {
  switch (urgency) {
    case 'critical': return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
        <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />CRITICAL
      </span>
    );
    case 'high': return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300">
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />HIGH
      </span>
    );
    case 'medium': return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />MEDIUM
      </span>
    );
    default: return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />NORMAL
      </span>
    );
  }
}

function scoreBar(score: number) {
  const color = score >= 75 ? 'bg-red-500' : score >= 50 ? 'bg-orange-400' : score >= 25 ? 'bg-amber-400' : 'bg-blue-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${score >= 75 ? 'text-red-600' : score >= 50 ? 'text-orange-600' : 'text-gray-600'}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function timeSince(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Map: fly-to helper component
───────────────────────────────────────────────────────────────────────────── */
function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Live Map Component (Leaflet + blood bank CSV + priority queue markers)
───────────────────────────────────────────────────────────────────────────── */
interface LiveMapProps {
  priorityItems: PriorityQueueItem[];
  bloodRequests: any[];
}

function LiveMap({ priorityItems, bloodRequests }: LiveMapProps) {
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.5204, 73.8567]);
  const [mapZoom] = useState(12);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetch('/pune_blood_banks_10.csv')
      .then(r => r.text())
      .then(csv => { setBloodBanks(parseCSV(csv)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  /* Priority markers derived from emergency queue */
  const priorityMarkers = useMemo(() => {
    return priorityItems
      .filter(p => p.location?.coordinates)
      .map(p => ({
        id: p._id,
        lat: p.location!.coordinates[1],
        lng: p.location!.coordinates[0],
        urgency: p.urgency_level,
        label: `${p.blood_group} — ${p.patient_name || 'Patient'}`,
        score: p.priority_score,
      }));
  }, [priorityItems]);

  /* Blood request markers (from Node backend) that have lat/lng */
  const requestMarkers = useMemo(() => {
    return bloodRequests
      .filter(r => r.latitude && r.longitude)
      .map(r => ({
        id: r._id,
        lat: r.latitude,
        lng: r.longitude,
        urgency: r.urgency || r.urgencyLevel || 'normal',
        label: `${r.bloodGroup} — ${r.patientName || 'Patient'}`,
      }));
  }, [bloodRequests]);

  const getMarkerIcon = (urgency: string) => {
    if (urgency === 'critical') return redIcon;
    if (urgency === 'high') return orangeIcon;
    return blueIcon;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <Loader className="w-6 h-6 animate-spin mr-2" />Loading map…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Locate me button */}
      <button
        onClick={locateMe}
        disabled={locating}
        className="absolute top-3 right-3 z-[1000] bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold shadow hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
      >
        {locating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
        My Location
      </button>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        scrollWheelZoom
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {userLocation && <FlyTo center={userLocation} zoom={14} />}

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={blueIcon}>
            <Popup><div className="text-sm font-semibold text-blue-700">📍 Your Location</div></Popup>
          </Marker>
        )}

        {/* Blood banks from CSV — green */}
        {bloodBanks.map(bank => (
          <Marker key={`bank-${bank.id}`} position={[bank.latitude, bank.longitude]} icon={greenIcon}>
            <Popup>
              <div className="p-1 max-w-[180px]">
                <p className="text-sm font-bold text-green-700 mb-0.5">🏥 {bank.name}</p>
                <p className="text-xs text-gray-500">{bank.type}</p>
                {bank.phone && <p className="text-xs text-gray-600 mt-1">📞 {bank.phone}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Priority engine emergency requests */}
        {priorityMarkers.map(m => (
          <Marker key={`prio-${m.id}`} position={[m.lat, m.lng]} icon={getMarkerIcon(m.urgency)}>
            <Popup>
              <div className="p-1 max-w-[200px]">
                <div className="flex items-center gap-1 mb-1">{urgencyBadge(m.urgency)}</div>
                <p className="text-sm font-bold text-gray-900">{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">Priority score: {m.score.toFixed(1)}/100</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Node backend blood request markers */}
        {requestMarkers.map(m => (
          <Marker key={`req-${m.id}`} position={[m.lat, m.lng]} icon={getMarkerIcon(m.urgency)}>
            <Popup>
              <div className="p-1 max-w-[200px]">
                <div className="flex items-center gap-1 mb-1">{urgencyBadge(m.urgency)}</div>
                <p className="text-sm font-bold text-gray-900">{m.label}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl p-3 text-xs border border-gray-200 shadow space-y-1.5">
        {[
          { color: 'bg-green-500',  label: 'Blood Bank / Hospital' },
          { color: 'bg-red-500',    label: 'Critical Request' },
          { color: 'bg-orange-400', label: 'High Priority Request' },
          { color: 'bg-blue-500',   label: 'Normal / Your Location' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 ${color} rounded-full flex-shrink-0`} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export function HospitalPanel({ user }: HospitalPanelProps) {
  /* ── State ── */
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Backend data */
  const [donorRequests, setDonorRequests] = useState<any[]>([]);
  const [bloodRequests, setBloodRequests] = useState<any[]>([]);

  /* Priority engine data */
  const [priorityQueue, setPriorityQueue] = useState<PriorityQueueResponse | null>(null);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityError, setPriorityError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  /* UI state */
  const [bloodFilter, setBloodFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [bloodRejectingId, setBloodRejectingId] = useState<string | null>(null);
  const [bloodRejectionReason, setBloodRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewingFile, setPreviewingFile] = useState<string | null>(null);
  const [previewingFileName, setPreviewingFileName] = useState<string | null>(null);
  const [previewingIsImage, setPreviewingIsImage] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  /* ── Data fetching ── */
  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/donor/applications'), { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const result = await res.json();
          setDonorRequests(result.data.map((app: any) => ({
            _id: app._id, name: app.fullName, email: app.email, phone: app.phone,
            bloodGroup: app.bloodGroup || 'N/A', status: app.status || 'Pending',
            rejectionReason: app.rejectionReason, hospitalRemarks: app.hospitalRemarks,
            aadhaarFilePath: app.aadhaarFilePath, medicalFilePath: app.medicalReportFilePath,
            createdAt: app.submittedAt,
          })));
        }
      } catch { /* silent */ }
    };
    fetchDonors();
    const id = setInterval(fetchDonors, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchBlood = async () => {
      try {
        const res = await fetch(apiUrl('/requests'));
        if (res.ok) { const data = await res.json(); setBloodRequests(data.data || []); }
      } catch { /* silent */ }
    };
    fetchBlood();
    const id = setInterval(fetchBlood, 5000);
    return () => clearInterval(id);
  }, []);

  /* Priority engine fetch */
  const fetchPriorityQueue = async (showLoad = false) => {
    if (showLoad) setPriorityLoading(true);
    setPriorityError(null);
    try {
      const res = await fetch(`${PRIORITY_ENGINE_URL}/api/emergency/queue?limit=20`);
      if (!res.ok) throw new Error(`Priority engine returned ${res.status}`);
      const data: PriorityQueueResponse = await res.json();
      setPriorityQueue(data);
      setLastRefreshed(new Date());
    } catch (e: any) {
      setPriorityError('Priority engine offline — start python_priority_engine to see real scores');
    } finally {
      if (showLoad) setPriorityLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorityQueue(true);
    const id = setInterval(() => fetchPriorityQueue(false), 15000); // refresh every 15s
    return () => clearInterval(id);
  }, []);

  /* ── Access guard ── */
  if (!user || user.role !== 'hospital') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This area is only accessible to authorized hospital staff.</p>
        </div>
      </div>
    );
  }

  /* ── Derived counts ── */
  const pendingDonors  = donorRequests.filter(r => r.status === 'Pending').length;
  const approvedDonors = donorRequests.filter(r => r.status === 'Approved').length;
  const pendingBlood   = bloodRequests.filter(r => (r.status || 'Pending') === 'Pending').length;
  const criticalReqs   = priorityQueue?.processing_order.filter(r => r.urgency_level === 'critical').length ?? 0;
  const queueSize      = priorityQueue?.active_queue_size ?? 0;

  /* ── Actions ── */
  const toast = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const approveBloodRequest = async (id: string, name: string) => {
    try {
      const res = await fetch(apiUrl(`/request/${id}`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', hospitalRemarks: 'Approved by hospital' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBloodRequests(prev => prev.map(r => r._id === id ? data.request : r));
        toast(`✓ Request for ${name} approved`);
        
        // Remove from priority queue
        try {
          await fetch(`${PRIORITY_ENGINE_URL}/api/emergency/request/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'fulfilled' })
          });
          fetchPriorityQueue(true); // Refresh queue UI
        } catch (e) {
          console.error('Failed to update priority engine', e);
        }
      }
    } catch { setError('Failed to approve'); }
  };

  const rejectBloodRequest = async () => {
    if (!bloodRejectingId || !bloodRejectionReason.trim()) { setError('Please provide rejection reason'); return; }
    try {
      const res = await fetch(apiUrl(`/request/${bloodRejectingId}`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected', rejectionReason: bloodRejectionReason }),
      });
      if (res.ok) {
        const data = await res.json();
        setBloodRequests(prev => prev.map(r => r._id === bloodRejectingId ? data.request : r));
        setBloodRejectingId(null); setBloodRejectionReason('');
        toast('Request rejected');
      }
    } catch { setError('Failed to reject'); }
  };

  const approveDonor = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/donor/update-status/${id}`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Approved', hospitalRemarks: 'Approved by hospital staff' }),
      });
      if (res.ok) { setDonorRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'Approved' } : r)); toast('Donor approved'); }
    } catch { setError('Failed to approve donor'); }
  };

  const rejectDonor = async () => {
    if (!rejectingId || !rejectionReason.trim()) { setError('Please provide a reason'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/donor/update-status/${rejectingId}`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Rejected', hospitalRemarks: rejectionReason }),
      });
      if (res.ok) {
        setDonorRequests(prev => prev.map(r => r._id === rejectingId ? { ...r, status: 'Rejected' } : r));
        setRejectingId(null); setRejectionReason(''); toast('Donor rejected');
      }
    } catch { setError('Failed to reject donor'); }
  };

  /* ── Tabs ── */
  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard',          label: 'Overview',          icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'blood-requests',     label: 'Blood Requests',    icon: <ClipboardList   className="w-4 h-4" />, badge: pendingBlood },
    { id: 'priority-queue',     label: 'Priority Queue',    icon: <ListOrdered     className="w-4 h-4" />, badge: criticalReqs || undefined },
    { id: 'nearby-requests',    label: 'Nearby Hospitals',  icon: <Building2       className="w-4 h-4" /> },
    { id: 'map',                label: 'Live Map',          icon: <MapPin          className="w-4 h-4" /> },
    { id: 'donor-applications', label: 'Donor Applications',icon: <Users           className="w-4 h-4" />, badge: pendingDonors || undefined },
  ];

  const filteredBlood = bloodFilter === 'all'
    ? bloodRequests
    : bloodRequests.filter(r => (r.status || 'Pending').toLowerCase() === bloodFilter);

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow">
              <Droplet className="w-5 h-5 text-white" fill="white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-gray-900 text-sm leading-none">{user.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Hospital Dashboard
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {criticalReqs > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />{criticalReqs} Critical
              </div>
            )}
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
                {(pendingBlood + pendingDonors) > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {Math.min(pendingBlood + pendingDonors, 99)}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    <button onClick={() => setShowNotif(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {pendingBlood > 0 && (
                      <div className="px-4 py-3 flex gap-3 items-start hover:bg-gray-50">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Droplet className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pendingBlood} blood requests pending</p>
                          <p className="text-xs text-gray-500">Require your review</p>
                        </div>
                      </div>
                    )}
                    {pendingDonors > 0 && (
                      <div className="px-4 py-3 flex gap-3 items-start hover:bg-gray-50">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pendingDonors} donor applications</p>
                          <p className="text-xs text-gray-500">Awaiting verification</p>
                        </div>
                      </div>
                    )}
                    {(pendingBlood + pendingDonors) === 0 && (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">All clear — no pending items</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Avatar */}
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Tab Bar (desktop) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex gap-0.5 border-t border-gray-100">
            {TABS.map(({ id, label, icon, badge }) => (
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
                {badge !== undefined && badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full min-w-[1.2rem] text-center">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Toast/alert banner ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-2">
        {successMsg && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium animate-in fade-in">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />{successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />{error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* ── Page content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* ══════════════════════════════════════════════════════════
            OVERVIEW (DASHBOARD)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Pending Blood Requests', value: pendingBlood,   icon: Clock,         color: 'amber' },
                { label: 'Critical in Queue',       value: criticalReqs,  icon: AlertTriangle, color: 'red' },
                { label: 'Queue Size (Engine)',     value: queueSize,     icon: ListOrdered,   color: 'rose' },
                { label: 'Donor Applications',      value: pendingDonors, icon: Users,         color: 'blue' },
                { label: 'Approved Donors',         value: approvedDonors,icon: Heart,         color: 'emerald' },
              ].map(({ label, value, icon: Icon, color }) => {
                const s: Record<string, string> = {
                  amber:   'border-amber-200   bg-amber-50   text-amber-600',
                  red:     'border-red-200     bg-red-50     text-red-600',
                  rose:    'border-rose-200    bg-rose-50    text-rose-600',
                  blue:    'border-blue-200    bg-blue-50    text-blue-600',
                  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
                };
                return (
                  <div key={label} className={`bg-white rounded-2xl border p-4 shadow-sm ${s[color].split(' ')[0]}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s[color].split(' ').slice(1).join(' ')}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
                    {color === 'red' && value > 0 && (
                      <div className="text-[10px] text-red-600 font-bold mt-1 animate-pulse">Act Now</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Priority queue preview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-red-600" />
                  <h2 className="font-bold text-gray-900">Priority Queue <span className="text-xs text-gray-400 font-normal">(Live — Python Engine)</span></h2>
                  {criticalReqs > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full animate-pulse">{criticalReqs} CRITICAL</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {lastRefreshed && <span className="text-xs text-gray-400 hidden sm:block">Updated {timeSince(lastRefreshed.toISOString())}</span>}
                  <button onClick={() => fetchPriorityQueue(true)} disabled={priorityLoading} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                    <RefreshCw className={`w-4 h-4 ${priorityLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button onClick={() => setActiveTab('priority-queue')} className="text-sm text-red-600 font-medium hover:text-red-700">View All →</button>
                </div>
              </div>
              {priorityError ? (
                <div className="px-5 py-8 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{priorityError}</p>
                </div>
              ) : priorityQueue?.processing_order.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-400 text-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-200 mx-auto mb-2" />No pending requests in queue
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(priorityQueue?.processing_order || []).slice(0, 5).map(req => (
                    <div key={req._id} className={`px-5 py-3.5 flex items-center gap-4 ${req.urgency_level === 'critical' ? 'bg-red-50/40' : req.urgency_level === 'high' ? 'bg-orange-50/30' : ''}`}>
                      <div className={`w-12 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${req.urgency_level === 'critical' ? 'bg-red-600' : req.urgency_level === 'high' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                        {req.blood_group}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {urgencyBadge(req.urgency_level)}
                          <span className="text-sm font-semibold text-gray-900 truncate">{req.patient_name || 'Patient'}</span>
                        </div>
                        <div className="mt-1">{scoreBar(req.priority_score)}</div>
                      </div>
                      <div className="text-right text-xs text-gray-400 flex-shrink-0">
                        <div>{req.units_required}u</div>
                        <div>{timeSince(req.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2-col: Blood requests quick + Nearby */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                    <h2 className="font-bold text-gray-900">Pending Blood Requests</h2>
                  </div>
                  <button onClick={() => setActiveTab('blood-requests')} className="text-sm text-amber-600 font-medium hover:text-amber-700">View All →</button>
                </div>
                {bloodRequests.filter(r => (r.status || 'Pending') === 'Pending').length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">
                    <Droplet className="w-8 h-8 mx-auto mb-2 text-gray-200" />No pending requests
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {bloodRequests.filter(r => (r.status || 'Pending') === 'Pending').slice(0, 4).map(req => {
                      const urg = (req.urgency || req.urgencyLevel || 'normal') as string;
                      return (
                        <div key={req._id} className="px-5 py-3 flex items-center gap-3">
                          <div className={`w-10 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${urg === 'critical' ? 'bg-red-600' : urg === 'high' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                            {req.bloodGroup}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{req.patientName || 'Patient'}</div>
                            <div className="text-xs text-gray-500">{req.unitsRequired} units · {req.hospitalName || 'This hospital'}</div>
                          </div>
                          <button onClick={() => approveBloodRequest(req._id, req.patientName)} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold whitespace-nowrap">
                            Approve
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-bold text-gray-900">Nearby Hospital Requests</h2>
                  </div>
                  <button onClick={() => setActiveTab('nearby-requests')} className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View All →</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {NEARBY_MOCK.slice(0, 4).map(r => (
                    <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                      <div className={`w-10 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${r.urgency === 'critical' ? 'bg-red-600' : r.urgency === 'high' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                        {r.blood}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{r.hospital}</div>
                        <div className="text-xs text-gray-500">{r.units} units</div>
                      </div>
                      {urgencyBadge(r.urgency)}
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            BLOOD REQUESTS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'blood-requests' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Blood Requests</h2>
                <p className="text-sm text-gray-500">Review and manage incoming blood requests</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                  <button key={f} onClick={() => setBloodFilter(f)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${bloodFilter === f ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'}`}>
                    {f} ({f === 'all' ? bloodRequests.length : bloodRequests.filter(r => (r.status || 'Pending').toLowerCase() === f).length})
                  </button>
                ))}
              </div>
            </div>

            {filteredBlood.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Droplet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No {bloodFilter === 'all' ? '' : bloodFilter + ' '}blood requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBlood.map(req => {
                  const urg = (req.urgency || req.urgencyLevel || 'normal') as string;
                  const isPending = (req.status || 'Pending') === 'Pending';
                  return (
                    <div key={req._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${urg === 'critical' ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`}>
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {urgencyBadge(urg)}
                              <h3 className="font-bold text-gray-900">{req.patientName || 'Unnamed Patient'}</h3>
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className="font-semibold text-red-600">{req.bloodGroup}</span> · {req.unitsRequired} units · {req.hospitalName || 'Not specified'}
                              {req.requesterName && <span> · {req.requesterName}</span>}
                              {req.requesterPhone && <span> · {req.requesterPhone}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400 mb-1">{new Date(req.submittedAt || req.createdAt).toLocaleDateString()}</div>
                            <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${statusBadgeClass(req.status || 'Pending')}`}>
                              {req.status || 'Pending'}
                            </span>
                          </div>
                        </div>
                        {req.reason && <div className="mb-3 text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-2"><span className="font-medium">Reason:</span> {req.reason}</div>}
                        {req.rejectionReason && req.status === 'Rejected' && (
                          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2"><span className="font-medium">Rejected:</span> {req.rejectionReason}</div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {req.prescriptionFilePath && (
                            <button onClick={() => { setPreviewingFile(`http://localhost:5000/${req.prescriptionFilePath}`); setPreviewingFileName('Prescription'); setPreviewingIsImage(false); }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100">
                              <Eye className="w-3.5 h-3.5" />Prescription
                            </button>
                          )}
                          {req.idProofFilePath && (
                            <button onClick={() => { const isImg = /\.(jpg|jpeg|png|gif)$/i.test(req.idProofFilePath); setPreviewingFile(`http://localhost:5000/${req.idProofFilePath}`); setPreviewingFileName('ID Proof'); setPreviewingIsImage(isImg); }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100">
                              <Eye className="w-3.5 h-3.5" />ID Proof
                            </button>
                          )}
                          <button onClick={() => approveBloodRequest(req._id, req.patientName)} disabled={!isPending}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isPending ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            <CheckCircle className="w-3.5 h-3.5" />Approve
                          </button>
                          <button onClick={() => { setBloodRejectingId(req._id); setBloodRejectionReason(''); }} disabled={!isPending}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isPending ? 'border border-red-300 text-red-600 hover:bg-red-50' : 'border border-gray-200 text-gray-400 cursor-not-allowed'}`}>
                            <XCircle className="w-3.5 h-3.5" />Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            PRIORITY QUEUE (connected to Python engine)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'priority-queue' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Priority Queue</h2>
                <p className="text-sm text-gray-500">
                  Sorted by real-time priority score (urgency × wait time × blood rarity × proximity). Powered by the Python Priority Engine at port 8000.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {lastRefreshed && <span className="text-xs text-gray-400">Updated {timeSince(lastRefreshed.toISOString())}</span>}
                <button onClick={() => fetchPriorityQueue(true)} disabled={priorityLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${priorityLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Engine status card */}
            <div className={`rounded-2xl border px-5 py-3 flex items-center gap-3 text-sm ${priorityError ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              {priorityError
                ? <><AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" /><span className="text-amber-800">{priorityError}</span></>
                : <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" /><span className="text-emerald-800 font-medium">Priority Engine connected · {priorityQueue?.active_queue_size ?? 0} in-memory queue · {priorityQueue?.pending_db_count ?? 0} pending in DB</span></>
              }
            </div>

            {/* Score legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Urgency (40%)', desc: 'Critical=100, High=70, Medium=40' },
                { label: 'Wait Time (25%)', desc: 'Log-scale: longer wait = higher score' },
                { label: 'Blood Rarity (20%)', desc: 'AB-=100, O-=90, B-=80...' },
                { label: 'Proximity (15%)', desc: 'Closer request = higher score' },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="text-xs font-bold text-gray-900 mb-0.5">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              ))}
            </div>

            {priorityLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Loader className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Fetching priority queue…</p>
              </div>
            ) : priorityError ? (
              <div className="bg-white rounded-2xl border border-amber-200 p-12 text-center">
                <AlertCircle className="w-12 h-12 text-amber-300 mx-auto mb-3" />
                <p className="text-gray-700 font-semibold mb-1">Priority Engine Offline</p>
                <p className="text-gray-500 text-sm">Run: <code className="bg-gray-100 px-2 py-0.5 rounded">cd python_priority_engine && python main.py</code></p>
              </div>
            ) : (priorityQueue?.processing_order || []).length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Queue is clear — no pending emergency requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(priorityQueue?.processing_order || []).map((req, idx) => (
                  <div key={req._id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${req.urgency_level === 'critical' ? 'border-red-200 ring-1 ring-red-100' : req.urgency_level === 'high' ? 'border-orange-200' : 'border-gray-200'}`}>
                    <div className="p-4 flex flex-wrap items-center gap-4">
                      {/* Rank */}
                      <div className="text-2xl font-black text-gray-200 w-8 text-center flex-shrink-0">#{idx + 1}</div>
                      {/* Blood type */}
                      <div className={`w-14 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow ${req.urgency_level === 'critical' ? 'bg-red-600' : req.urgency_level === 'high' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                        {req.blood_group}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {urgencyBadge(req.urgency_level)}
                          <span className="font-bold text-gray-900">{req.patient_name || 'Emergency Patient'}</span>
                          {req.escalation_count > 0 && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                              ↑{req.escalation_count}× escalated
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {req.units_required} units · submitted {timeSince(req.created_at)} · status: {req.status}
                        </div>
                        <div className="max-w-[300px]">
                          <div className="text-xs text-gray-500 mb-0.5">Priority Score</div>
                          {scoreBar(req.priority_score)}
                        </div>
                      </div>
                      
                      {/* Accept/Reject Buttons directly in Priority Queue */}
                      <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                        {req.node_request_id && req.status === 'pending' && (
                          <>
                            <button onClick={() => approveBloodRequest(req.node_request_id, req.patient_name || 'Emergency Patient')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors w-full sm:w-auto justify-center">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => { setBloodRejectingId(req.node_request_id); setBloodRejectionReason(''); }}
                              className="flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors w-full sm:w-auto justify-center">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            NEARBY HOSPITALS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'nearby-requests' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nearby Hospital Requests</h2>
              <p className="text-sm text-gray-500">Requests from hospitals in your region — share inventory or contact them directly</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NEARBY_MOCK.map(r => (
                <div key={r.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${r.urgency === 'critical' ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`}>
                  <div className={`px-5 py-3 ${r.urgency === 'critical' ? 'bg-red-50' : r.urgency === 'high' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    <div className="flex items-center justify-between">
                      {urgencyBadge(r.urgency)}
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Navigation className="w-3 h-3" />~{(Math.random() * 8 + 1).toFixed(1)} km</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm ${r.urgency === 'critical' ? 'bg-red-600' : r.urgency === 'high' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                        {r.blood}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{r.hospital}</div>
                        <div className="text-sm text-gray-500">{r.units} units of {r.blood} needed</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
                        <Share2 className="w-3.5 h-3.5" />Share Inventory
                      </button>
                      <button className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50">
                        <Phone className="w-3.5 h-3.5" />Contact
                      </button>
                      <button className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50">
                        <Eye className="w-3.5 h-3.5" />Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            LIVE MAP
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Live Map</h2>
                <p className="text-sm text-gray-500">Blood banks, emergency requests, and donation camps in real time</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { color: 'bg-green-500',  label: 'Blood Bank' },
                  { color: 'bg-red-500',    label: 'Critical' },
                  { color: 'bg-orange-400', label: 'High Priority' },
                  { color: 'bg-blue-500',   label: 'Normal / You' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1.5 rounded-xl">
                    <div className={`w-2.5 h-2.5 ${color} rounded-full`} />
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: '560px' }}>
              <LiveMap
                priorityItems={priorityQueue?.processing_order || []}
                bloodRequests={bloodRequests}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            DONOR APPLICATIONS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'donor-applications' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Donor Applications</h2>
                <p className="text-sm text-gray-500">Review health screening forms and verify donors</p>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl font-semibold">{pendingDonors} Pending</span>
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl font-semibold">{approvedDonors} Approved</span>
              </div>
            </div>
            <HospitalApplicationManager />
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════ */}
      {/* File preview */}
      {previewingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">{previewingFileName}</h3>
              <button onClick={() => { setPreviewingFile(null); setPreviewingFileName(null); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
              {previewingIsImage
                ? <img src={previewingFile} alt={previewingFileName || ''} className="max-w-full max-h-[70vh] rounded-xl" />
                : <iframe src={previewingFile} title={previewingFileName || ''} className="w-full h-[65vh] border-0 rounded-xl" />
              }
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => { setPreviewingFile(null); setPreviewingFileName(null); }} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Close</button>
              <a href={previewingFile} download={previewingFileName} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-center hover:bg-blue-700">Download</a>
            </div>
          </div>
        </div>
      )}

      {/* Blood reject */}
      {bloodRejectingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
              <h3 className="font-bold text-gray-900">Reject Blood Request</h3>
            </div>
            <textarea value={bloodRejectionReason} onChange={e => setBloodRejectionReason(e.target.value)}
              placeholder="Reason for rejection…" rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 resize-none mb-4" />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setBloodRejectingId(null); setBloodRejectionReason(''); }} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={rejectBloodRequest} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Donor reject */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
              <h3 className="font-bold text-gray-900">Reject Donor Application</h3>
            </div>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection…" rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 resize-none mb-4" />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setRejectingId(null); setRejectionReason(''); setError(''); }} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={rejectDonor} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
