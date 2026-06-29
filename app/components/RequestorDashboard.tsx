import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, XCircle, Clock, Droplet, AlertCircle, Loader,
  LayoutDashboard, ClipboardList, MapPin, TrendingUp,
  Bell, RefreshCw, Plus, Search, Building2, Phone, Filter,
  ChevronDown, ChevronUp, Eye, X, Zap
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiUrl } from '../services/api';
import { parseCSV, Hospital } from '../utils/csvParser';
import { RequestForm } from './RequestForm';

/* ─── Leaflet Icons ─────────────────────────────────────────────────────────── */
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

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface User {
  id?: string; _id?: string; name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean; bloodType?: string; email?: string;
}

interface BloodRequest {
  _id: string; patientName: string; bloodGroup: string;
  unitsRequired: number; hospitalName: string; hospitalId?: string;
  requiredDate: string; reason: string; requesterName: string;
  requesterEmail: string; requesterPhone: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string; hospitalRemarks?: string;
  prescriptionFilePath?: string; idProofFilePath?: string;
  submittedAt: string; updatedAt?: string;
  urgency?: string;
}

interface PriorityItem {
  _id: string; patient_name: string; blood_group: string;
  units_required: number; urgency_level: string;
  priority_score: number; status: string; created_at: string;
  escalation_count: number;
}

type Tab = 'overview' | 'my-requests' | 'find-request' | 'track-status';

const PRIORITY_ENGINE = (import.meta.env.VITE_PRIORITY_ENGINE_URL as string | undefined)?.trim() || 'http://localhost:8000';

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function urgencyBadge(urgency: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high:     'bg-orange-100 text-orange-700 border-orange-300',
    medium:   'bg-amber-100 text-amber-700 border-amber-300',
    low:      'bg-blue-100 text-blue-700 border-blue-300',
  };
  const labels: Record<string, string> = {
    critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW',
  };
  const cls = map[urgency] || map.medium;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {urgency === 'critical' && <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />}
      {labels[urgency] || urgency.toUpperCase()}
    </span>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case 'Approved': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">✓ Approved</span>;
    case 'Rejected': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-300">✕ Rejected</span>;
    default:         return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-300">⏳ Pending</span>;
  }
}

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(s?: string) {
  if (!s) return 'N/A';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function scoreBar(score: number) {
  const col = score >= 75 ? 'bg-red-500' : score >= 50 ? 'bg-orange-400' : score >= 25 ? 'bg-amber-400' : 'bg-blue-400';
  const textCol = score >= 75 ? 'text-red-600' : score >= 50 ? 'text-orange-600' : 'text-gray-600';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${col} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${textCol}`}>{score.toFixed(1)}</span>
    </div>
  );
}

/* ─── Find & Request Map ─────────────────────────────────────────────────────── */
function FindRequestMap({ user, onNavigate }: { user: User | null; onNavigate?: (p: string) => void }) {
  const [bloodBanks, setBloodBanks] = useState<Hospital[]>([]);
  const [nearbyEmergency, setNearbyEmergency] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<Hospital | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/pune_blood_banks_10.csv').then(r => r.text()).then(csv => {
      setBloodBanks(parseCSV(csv));
      setLoading(false);
    }).catch(() => setLoading(false));

    // Load nearby emergency requests from Python engine
    fetch(`${PRIORITY_ENGINE}/api/emergency/nearby?longitude=73.8567&latitude=18.5204&radius_km=50&limit=20`)
      .then(r => r.json())
      .then(d => setNearbyEmergency(d.requests || []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() =>
    bloodBanks.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [bloodBanks, search]
  );

  if (showForm && selectedBank) {
    return (
      <div className="relative">
        <button
          onClick={() => { setShowForm(false); setSelectedBank(null); }}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 font-medium"
        >
          ← Back to Map
        </button>
        <RequestForm selectedBank={selectedBank} user={user} onNavigate={onNavigate} onClose={() => { setShowForm(false); setSelectedBank(null); }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Find & Request Blood</h2>
          <p className="text-sm text-gray-500">Select a hospital or blood bank to send a blood request</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search blood banks..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Map */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: '480px' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <Loader className="w-5 h-5 animate-spin mr-2" />Loading map…
            </div>
          ) : (
            <MapContainer center={[18.5204, 73.8567]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filtered.map(bank => (
                <Marker key={bank.id} position={[bank.latitude, bank.longitude]} icon={greenIcon}>
                  <Popup>
                    <div className="p-1 max-w-[200px]">
                      <p className="font-bold text-green-700 text-sm mb-1">🏥 {bank.name}</p>
                      <p className="text-xs text-gray-500 mb-0.5">{bank.address}</p>
                      <p className="text-xs text-gray-500 mb-2">{bank.type}</p>
                      {bank.phone && <p className="text-xs text-gray-600 mb-2">📞 {bank.phone}</p>}
                      <button
                        onClick={() => { setSelectedBank(bank); setShowForm(true); }}
                        className="w-full py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
                      >
                        Request Blood Here
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {nearbyEmergency.map((req: any, i: number) => (
                <Marker key={i} position={[req.location?.coordinates[1], req.location?.coordinates[0]]}
                  icon={req.urgency_level === 'critical' ? redIcon : orangeIcon}>
                  <Popup>
                    <div className="p-1">
                      <p className="text-xs font-bold text-red-700">{req.urgency_level?.toUpperCase()} Request</p>
                      <p className="text-xs text-gray-700">{req.blood_group} · {req.units_required} units</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Hospital list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Blood Banks ({filtered.length})</p>
            <p className="text-xs text-gray-500">Click to select</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.map(bank => (
              <div
                key={bank.id}
                onClick={() => { setSelectedBank(bank); setShowForm(true); }}
                className="px-4 py-3 hover:bg-red-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-red-700">{bank.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{bank.address}</p>
                    <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bank.type}</span>
                  </div>
                  <button className="flex-shrink-0 px-2.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {[
          { col: 'bg-green-500', label: 'Blood Bank / Hospital' },
          { col: 'bg-red-500', label: 'Critical Emergency' },
          { col: 'bg-orange-400', label: 'High Priority Request' },
        ].map(({ col, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 ${col} rounded-full`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Track Status Timeline ──────────────────────────────────────────────────── */
function TrackStatus({ requests, priorityItems }: { requests: BloodRequest[]; priorityItems: PriorityItem[] }) {
  const [selectedId, setSelectedId] = useState<string>(requests[0]?._id || '');
  const req = requests.find(r => r._id === selectedId);

  const getQueueItem = (req: BloodRequest | undefined) => {
    if (!req) return null;
    return priorityItems.find(p =>
      p.blood_group === req.bloodGroup && p.patient_name === req.patientName
    ) || null;
  };

  const queueItem = getQueueItem(req);
  const queuePos = queueItem
    ? priorityItems.findIndex(p => p._id === queueItem._id) + 1
    : null;

  type StepStatus = 'done' | 'active' | 'pending';
  const steps: { label: string; desc: string; status: StepStatus; detail?: string }[] = req ? [
    {
      label: 'Submitted',
      desc: `${formatDate(req.submittedAt)} · ${req.bloodGroup} · ${req.unitsRequired} units`,
      status: 'done' as StepStatus,
      detail: `Patient: ${req.patientName} · Hospital: ${req.hospitalName}`,
    },
    {
      label: 'Priority Queue',
      desc: queueItem
        ? `Score: ${queueItem.priority_score.toFixed(1)}/100 · Queue #${queuePos}`
        : 'Added to priority engine on submission',
      status: (queueItem ? 'done' : 'active') as StepStatus,
      detail: queueItem ? `Urgency: ${queueItem.urgency_level} · Escalations: ${queueItem.escalation_count}` : 'Python engine computing live score…',
    },
    {
      label: 'Hospital Review',
      desc: req.status === 'Pending' ? 'Under review by the hospital panel' : `Decision made · ${formatDate(req.updatedAt)}`,
      status: (req.status === 'Pending' ? 'active' : 'done') as StepStatus,
    },
    {
      label: req.status === 'Rejected' ? 'Rejected' : 'Approved',
      desc: req.status === 'Pending'
        ? 'Awaiting hospital decision'
        : req.status === 'Approved'
          ? req.hospitalRemarks || 'Request approved — contact the hospital for next steps'
          : req.rejectionReason || 'Request was not approved at this time',
      status: (req.status === 'Pending' ? 'pending' : 'done') as StepStatus,
    },
  ] : [];

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No requests to track yet</p>
        <p className="text-sm text-gray-400 mt-1">Submit a blood request to see tracking here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Request selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Select Request</p>
        </div>
        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
          {requests.map(r => (
            <div
              key={r._id}
              onClick={() => setSelectedId(r._id)}
              className={`px-4 py-3 cursor-pointer transition-colors ${selectedId === r._id ? 'bg-red-50 border-l-2 border-red-600' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${r.bloodGroup?.includes('-') ? 'bg-red-700' : 'bg-red-500'}`}>
                  {r.bloodGroup}
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">{r.patientName}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                {statusBadge(r.status)}
                <span className="text-[10px] text-gray-400">{timeSince(r.submittedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {req ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${req.bloodGroup?.includes('-') ? 'bg-red-700' : 'bg-red-500'}`}>
                {req.bloodGroup}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{req.patientName}</h3>
                <p className="text-xs text-gray-500">{req.unitsRequired} units · {req.hospitalName}</p>
              </div>
              <div className="ml-auto">{statusBadge(req.status)}</div>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {steps.map((step, i) => {
                  const isLast = i === steps.length - 1;
                  const iconBg =
                    step.status === 'done'
                      ? (isLast && req.status === 'Rejected' ? 'bg-red-500' : 'bg-emerald-500')
                      : step.status === 'active'
                        ? 'bg-amber-400'
                        : 'bg-gray-200';
                  const Icon =
                    step.status === 'done'
                      ? (isLast && req.status === 'Rejected' ? XCircle : CheckCircle)
                      : step.status === 'active'
                        ? Clock
                        : Clock;

                  return (
                    <div key={i} className="relative flex gap-4 pl-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${iconBg}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm font-bold ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{step.label}</p>
                          {step.status === 'active' && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">In Progress</span>
                          )}
                        </div>
                        <p className={`text-xs ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-600'}`}>{step.desc}</p>
                        {step.detail && step.status !== 'pending' && (
                          <p className="text-xs text-gray-400 mt-0.5">{step.detail}</p>
                        )}
                        {/* Queue score bar */}
                        {i === 1 && queueItem && (
                          <div className="mt-2 max-w-[240px]">
                            {scoreBar(queueItem.priority_score)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-400">Select a request to see its timeline</div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────────── */
export function RequestorDashboard({ user, onNavigate }: { user: User | null; onNavigate?: (p: string) => void }) {
  const [activeTab, setActiveTab]     = useState<Tab>('overview');
  const [requests, setRequests]       = useState<BloodRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [showNotif, setShowNotif]     = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);
  const [priorityOnline, setPriorityOnline] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const userId = user?.id || user?._id;

  /* ── Fetch user's requests ── */
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch_ = async () => {
      try {
        const res = await fetch(apiUrl(`/requests/user/${userId}`));
        if (res.ok) {
          const d = await res.json();
          setRequests(d.data || []);
        }
      } catch { setError('Failed to load requests'); }
      finally { setLoading(false); }
    };
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => clearInterval(id);
  }, [userId]);

  /* ── Fetch priority queue (Python engine) ── */
  const fetchPriority = async () => {
    try {
      const res = await fetch(`${PRIORITY_ENGINE}/api/emergency/queue?limit=50`);
      if (res.ok) {
        const d = await res.json();
        setPriorityItems(d.processing_order || []);
        setPriorityOnline(true);
        setLastRefreshed(new Date());
      }
    } catch { setPriorityOnline(false); }
  };

  useEffect(() => {
    fetchPriority();
    const id = setInterval(fetchPriority, 15000);
    return () => clearInterval(id);
  }, []);

  /* ── Guards ── */
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  /* ── Derived counts ── */
  const total    = requests.length;
  const pending  = requests.filter(r => r.status === 'Pending').length;
  const approved = requests.filter(r => r.status === 'Approved').length;
  const rejected = requests.filter(r => r.status === 'Rejected').length;

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview',      label: 'Overview',        icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'my-requests',   label: 'My Requests',     icon: <ClipboardList   className="w-4 h-4" />, badge: pending },
    { id: 'find-request',  label: 'Find & Request',  icon: <MapPin          className="w-4 h-4" /> },
    { id: 'track-status',  label: 'Track Status',    icon: <TrendingUp      className="w-4 h-4" /> },
  ];

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow">
              <Droplet className="w-5 h-5 text-white" fill="white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-gray-900 text-sm leading-none">{user.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Requestor Dashboard
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Priority engine status */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${priorityOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {priorityOnline ? 'Engine Live' : 'Engine Offline'}
            </div>

            {/* New request button */}
            <button
              onClick={() => setShowNewRequest(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />New Request
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
                {pending > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {Math.min(pending, 9)}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    <button onClick={() => setShowNotif(false)}><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {pending > 0 && (
                      <div className="px-4 py-3 flex gap-3 items-start hover:bg-gray-50">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pending} request{pending > 1 ? 's' : ''} pending review</p>
                          <p className="text-xs text-gray-500">Awaiting hospital decision</p>
                        </div>
                      </div>
                    )}
                    {approved > 0 && (
                      <div className="px-4 py-3 flex gap-3 items-start hover:bg-gray-50">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{approved} request{approved > 1 ? 's' : ''} approved!</p>
                          <p className="text-xs text-gray-500">Contact the hospital for next steps</p>
                        </div>
                      </div>
                    )}
                    {pending === 0 && approved === 0 && (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
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
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full min-w-[1.2rem] text-center">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Requests',  value: total,    icon: ClipboardList, color: 'blue'    },
                { label: 'Pending Review',  value: pending,  icon: Clock,         color: 'amber'   },
                { label: 'Approved',        value: approved, icon: CheckCircle,   color: 'emerald' },
                { label: 'Rejected',        value: rejected, icon: XCircle,       color: 'red'     },
              ].map(({ label, value, icon: Icon, color }) => {
                const s: Record<string, string> = {
                  blue:    'border-blue-200   bg-blue-50   text-blue-600',
                  amber:   'border-amber-200  bg-amber-50  text-amber-600',
                  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
                  red:     'border-red-200    bg-red-50    text-red-600',
                };
                return (
                  <div key={label} className={`bg-white rounded-2xl border p-4 shadow-sm ${s[color].split(' ')[0]}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s[color].split(' ').slice(1).join(' ')}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                );
              })}
            </div>

            {/* Priority engine status bar */}
            <div className={`rounded-2xl border px-5 py-3 flex items-center gap-3 text-sm ${priorityOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
              {priorityOnline
                ? <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" /><span className="text-emerald-800 font-medium">Priority Engine connected · {priorityItems.length} active in queue · Your requests are auto-scored</span></>
                : <><AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-600">Priority Engine offline — requests saved. Start <code className="bg-gray-100 px-1 rounded">python_priority_engine</code> for live scoring.</span></>
              }
              <button onClick={fetchPriority} className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Recent requests */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-red-600" />
                    <h2 className="font-bold text-gray-900">Recent Requests</h2>
                  </div>
                  <button onClick={() => setActiveTab('my-requests')} className="text-sm text-red-600 font-medium hover:text-red-700">View All →</button>
                </div>
                {loading ? (
                  <div className="px-5 py-8 flex items-center justify-center text-gray-400">
                    <Loader className="w-5 h-5 animate-spin mr-2" />Loading…
                  </div>
                ) : requests.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Droplet className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No requests yet</p>
                    <button
                      onClick={() => setActiveTab('find-request')}
                      className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700"
                    >Find a Blood Bank</button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {requests.slice(0, 4).map(req => (
                      <div key={req._id} className="px-5 py-3.5 flex items-center gap-3">
                        <div className={`w-10 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${req.bloodGroup?.includes('-') ? 'bg-red-700' : 'bg-red-500'}`}>
                          {req.bloodGroup}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{req.patientName}</div>
                          <div className="text-xs text-gray-500 truncate">{req.hospitalName} · {req.unitsRequired} units</div>
                        </div>
                        {statusBadge(req.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold">Need Blood Urgently?</p>
                      <p className="text-red-100 text-xs">All requests are priority-scored in real time</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('find-request')}
                    className="w-full py-2.5 bg-white text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors"
                  >
                    Find a Hospital & Request Blood
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <p className="font-bold text-gray-900">Priority Queue Status</p>
                  </div>
                  {priorityOnline ? (
                    <>
                      <p className="text-3xl font-black text-gray-900">{priorityItems.length}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Active requests in queue · Auto-refreshes every 15s</p>
                      {lastRefreshed && <p className="text-xs text-gray-400 mt-1">Last updated {timeSince(lastRefreshed.toISOString())}</p>}
                      <button onClick={() => setActiveTab('track-status')} className="mt-3 text-xs text-indigo-600 font-semibold hover:text-indigo-700">Track your requests →</button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Priority engine offline</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MY REQUESTS ── */}
        {activeTab === 'my-requests' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Blood Requests</h2>
                <p className="text-sm text-gray-500">All requests you have submitted — live priority scores</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {(['all', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${filterStatus === f ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'}`}
                  >
                    {f} ({f === 'all' ? total : requests.filter(r => r.status === f).length})
                  </button>
                ))}
                <button
                  onClick={() => setActiveTab('find-request')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700"
                >
                  <Plus className="w-3.5 h-3.5" />New
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 flex items-center justify-center text-gray-400">
                <Loader className="w-6 h-6 animate-spin mr-2" />Loading your requests…
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No {filterStatus === 'all' ? '' : filterStatus.toLowerCase() + ' '}requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(req => {
                  const isExpanded = expandedId === req._id;
                  const urg = req.urgency || 'medium';
                  const queueMatch = priorityItems.find(p => p.blood_group === req.bloodGroup && p.patient_name === req.patientName);
                  return (
                    <div key={req._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${req.status === 'Approved' ? 'border-emerald-200' : req.status === 'Rejected' ? 'border-red-200' : 'border-gray-200'}`}>
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${req.bloodGroup?.includes('-') ? 'bg-red-700' : 'bg-red-500'}`}>
                              {req.bloodGroup}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {urgencyBadge(urg)}
                                <span className="font-bold text-gray-900">{req.patientName}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{req.unitsRequired} units · {req.hospitalName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge(req.status)}
                            <span className="text-xs text-gray-400">{timeSince(req.submittedAt)}</span>
                            <button onClick={() => setExpandedId(isExpanded ? null : req._id)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Priority score row */}
                        {queueMatch && (
                          <div className="mb-3">
                            <p className="text-[10px] text-gray-500 mb-1 font-medium">PRIORITY SCORE (Live)</p>
                            {scoreBar(queueMatch.priority_score)}
                          </div>
                        )}

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              <div><p className="text-gray-500">Requester</p><p className="font-medium text-gray-900">{req.requesterName}</p></div>
                              <div><p className="text-gray-500">Email</p><p className="font-medium text-gray-900">{req.requesterEmail}</p></div>
                              <div><p className="text-gray-500">Phone</p><p className="font-medium text-gray-900">{req.requesterPhone}</p></div>
                              <div><p className="text-gray-500">Required By</p><p className="font-medium text-gray-900">{formatDate(req.requiredDate)}</p></div>
                              <div><p className="text-gray-500">Reason</p><p className="font-medium text-gray-900 capitalize">{req.reason}</p></div>
                              <div><p className="text-gray-500">Submitted</p><p className="font-medium text-gray-900">{formatDate(req.submittedAt)}</p></div>
                            </div>
                            {req.hospitalRemarks && (
                              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-800">
                                <span className="font-bold">Hospital Remarks: </span>{req.hospitalRemarks}
                              </div>
                            )}
                            {req.rejectionReason && (
                              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-800">
                                <span className="font-bold">Rejection Reason: </span>{req.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FIND & REQUEST ── */}
        {activeTab === 'find-request' && (
          <FindRequestMap user={user} onNavigate={onNavigate} />
        )}

        {/* ── TRACK STATUS ── */}
        {activeTab === 'track-status' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Track Request Status</h2>
              <p className="text-sm text-gray-500">Real-time timeline for each of your blood requests</p>
            </div>
            <TrackStatus requests={requests} priorityItems={priorityItems} />
          </div>
        )}
      </main>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">New Blood Request</h3>
              <button onClick={() => setShowNewRequest(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh]">
              <RequestForm user={user} onNavigate={(p) => { setShowNewRequest(false); onNavigate?.(p); }} onClose={() => setShowNewRequest(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
