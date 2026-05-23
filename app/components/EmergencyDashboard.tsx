import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Droplet, Clock, AlertTriangle, Wifi, WifiOff,
  Filter, Navigation, RefreshCw, Activity, Bell, X
} from 'lucide-react';
import { io as socketIO } from 'socket.io-client';
import { apiUrl, BACKEND_BASE } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BloodRequest {
  _id: string;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  priorityScore: number;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  emergency: boolean;
  hoursLeft: number | null;
  distanceKm: number | null;
  submittedAt: string;
  reason?: string;
  status: string;
}

interface EmergencyDashboardProps {
  user?: { bloodType?: string; role?: string } | null;
  onLogin?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  critical: {
    label: '🚨 Critical',
    border: 'border-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-600 text-white',
    pulse: true,
    glow: '0 0 0 3px rgba(239,68,68,0.3)',
  },
  high: {
    label: '⚠️ High',
    border: 'border-orange-400',
    bg: 'bg-orange-50',
    badge: 'bg-orange-500 text-white',
    pulse: false,
    glow: '',
  },
  medium: {
    label: '🔶 Medium',
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-500 text-white',
    pulse: false,
    glow: '',
  },
  low: {
    label: '🩸 Low',
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    badge: 'bg-blue-500 text-white',
    pulse: false,
    glow: '',
  },
};

const RADIUS_OPTIONS = [10, 15, 25, 40, 50];
const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Helper ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EmergencyDashboard({ user, onLogin }: EmergencyDashboardProps) {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [radiusKm, setRadiusKm] = useState(25);
  const [bloodFilter, setBloodFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [toast, setToast] = useState<BloodRequest | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null);

  // ── Fetch nearby requests ─────────────────────────────────────────────────
  const fetchRequests = useCallback(async (loc?: { lat: number; lng: number } | null) => {
    const location = loc ?? userLocation;
    try {
      const params = new URLSearchParams();
      if (location) {
        params.set('lat', String(location.lat));
        params.set('lng', String(location.lng));
      }
      params.set('radius', String(radiusKm * 1000));
      if (bloodFilter !== 'All') params.set('bloodGroup', bloodFilter);
      if (levelFilter !== 'all') params.set('level', levelFilter);

      const res = await fetch(apiUrl(`/nearby/requests?${params.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setRequests(json.data || []);
    } catch (e) {
      console.error('[EmergencyDashboard] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [userLocation, radiusKm, bloodFilter, levelFilter]);

  // ── Geolocation ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported in this browser.');
      fetchRequests(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        fetchRequests(loc);
      },
      (err) => {
        setLocationError('Location access denied — showing all pending requests.');
        fetchRequests(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-fetch when filters change ──────────────────────────────────────────
  useEffect(() => {
    if (!loading) fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm, bloodFilter, levelFilter]);

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketIO(BACKEND_BASE, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('new-request', (incoming: BloodRequest) => {
      setRequests((prev) => {
        // Deduplicate
        if (prev.some((r) => r._id === String(incoming._id))) return prev;

        // Show toast notification for critical/high
        if (incoming.priorityLevel === 'critical' || incoming.priorityLevel === 'high') {
          setToast(incoming);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 6000);
        }

        // Insert & re-sort
        const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const updated = [incoming, ...prev];
        updated.sort((a, b) => {
          const la = levelOrder[a.priorityLevel] ?? 3;
          const lb = levelOrder[b.priorityLevel] ?? 3;
          if (la !== lb) return la - lb;
          if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        });
        return updated;
      });
    });

    socket.on('request-escalated', ({ requestId, newLevel }: { requestId: string; newLevel: string }) => {
      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, priorityLevel: newLevel as BloodRequest['priorityLevel'] } : r
        )
      );
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Grouped display ───────────────────────────────────────────────────────
  const grouped = {
    critical: requests.filter((r) => r.priorityLevel === 'critical'),
    high: requests.filter((r) => r.priorityLevel === 'high'),
    medium: requests.filter((r) => r.priorityLevel === 'medium'),
    low: requests.filter((r) => r.priorityLevel === 'low'),
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)' }}>

      {/* ── Toast notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-4 right-4 z-50 max-w-sm w-full"
          >
            <div className="bg-red-600 text-white rounded-xl p-4 shadow-2xl flex items-start gap-3">
              <Bell className="w-5 h-5 mt-0.5 flex-shrink-0 animate-bounce" />
              <div className="flex-1">
                <p className="font-bold text-sm">🚨 New Critical Request!</p>
                <p className="text-xs mt-0.5 opacity-90">
                  {toast.bloodGroup} • {toast.hospitalName} • {toast.unitsRequired} units
                </p>
              </div>
              <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h1 className="text-2xl font-bold text-white">Live Emergency Feed</h1>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {connected ? 'Live' : 'Offline'}
                </div>
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {userLocation
                  ? `📍 ${radiusKm} km radius • ${requests.length} request${requests.length !== 1 ? 's' : ''} nearby`
                  : locationError || 'Detecting location…'}
              </p>
            </div>
            <button
              onClick={() => fetchRequests()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* ── Filters ── */}
          <div className="mt-5 flex flex-wrap gap-3 items-center">
            {/* Radius slider */}
            <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <Navigation className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium">Radius:</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="text-xs rounded-md px-2 py-1 font-semibold"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r} style={{ background: '#1e1b4b' }}>{r} km</option>
                ))}
              </select>
            </div>

            {/* Blood group filter */}
            <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <Droplet className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium">Blood Group:</span>
              <select
                value={bloodFilter}
                onChange={(e) => setBloodFilter(e.target.value)}
                className="text-xs rounded-md px-2 py-1 font-semibold"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g} style={{ background: '#1e1b4b' }}>{g}</option>
                ))}
              </select>
            </div>

            {/* Priority level filter */}
            <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <Filter className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium">Priority:</span>
              {['all', 'critical', 'high', 'medium', 'low'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className="text-xs px-2.5 py-1 rounded-full font-semibold transition-all capitalize"
                  style={{
                    background: levelFilter === lvl ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)',
                    border: levelFilter === lvl ? '1px solid rgba(139,92,246,0.7)' : '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(grouped) as Array<keyof typeof grouped>).map((lvl) => {
            const cfg = LEVEL_CONFIG[lvl];
            const count = grouped[lvl].length;
            return (
              <div
                key={lvl}
                className="rounded-xl p-3 text-center cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setLevelFilter(lvl === levelFilter as any ? 'all' : lvl)}
              >
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Request Cards ── */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Activity className="w-8 h-8 text-red-400 animate-pulse" />
            <span className="ml-3 text-white font-medium">Scanning for nearby requests…</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Droplet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">No blood requests in your area</p>
            <p className="text-sm mt-1">Try increasing the search radius</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(Object.keys(grouped) as Array<keyof typeof grouped>)
              .filter((lvl) => levelFilter === 'all' || levelFilter === lvl)
              .map((lvl) => {
                const cfg = LEVEL_CONFIG[lvl];
                const list = grouped[lvl];
                if (list.length === 0) return null;
                return (
                  <div key={lvl}>
                    <div className="flex items-center gap-2 mb-2 mt-4">
                      <span className="text-sm font-bold text-white">{cfg.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                        {list.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {list.map((req) => (
                          <RequestCard key={req._id} req={req} cfg={cfg} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req, cfg }: { req: BloodRequest; cfg: typeof LEVEL_CONFIG['critical'] }) {
  const isCritical = req.priorityLevel === 'critical';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={isCritical ? {
        background: 'rgba(15,23,42,0.8)',
        border: '2px solid rgba(239,68,68,0.7)',
        borderRadius: '16px',
        boxShadow: '0 0 20px rgba(239,68,68,0.25)',
        backdropFilter: 'blur(12px)',
        animation: 'criticalPulse 2s ease-in-out infinite',
      } : {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
      }}
      className="p-5 flex flex-col gap-3"
    >
      {/* Priority badge + score */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
        <div className="flex items-center gap-2">
          {req.distanceKm != null && (
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <MapPin className="w-3 h-3" /> {req.distanceKm.toFixed(1)} km
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
            Score: {req.priorityScore}
          </span>
        </div>
      </div>

      {/* Blood group — big */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl"
          style={{ background: isCritical ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', color: isCritical ? '#f87171' : '#e2e8f0' }}>
          {req.bloodGroup}
        </div>
        <div>
          <p className="text-white font-bold text-sm">{req.patientName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {req.unitsRequired} unit{req.unitsRequired !== 1 ? 's' : ''} needed
          </p>
        </div>
      </div>

      {/* Hospital */}
      <div className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
        <span>{req.hospitalName}</span>
      </div>

      {/* Time info */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {timeAgo(req.submittedAt)}
        </span>
        {req.hoursLeft != null && req.hoursLeft < 24 && (
          <span className="flex items-center gap-1 text-orange-400 font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Needed in {req.hoursLeft.toFixed(0)}h
          </span>
        )}
      </div>

      {/* Reason */}
      {req.reason && (
        <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
          "{req.reason}"
        </p>
      )}

      {/* CTA */}
      {isCritical && (
        <button
          className="mt-1 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}
        >
          🩸 Donate Now
        </button>
      )}
    </motion.div>
  );
}
