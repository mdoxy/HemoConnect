import { useState, useEffect, useCallback } from 'react';
import {
  Droplet, Save, RefreshCw, CheckCircle, AlertCircle, Clock,
  Package, Plus, Loader, X, TrendingUp
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
interface User {
  id?: string;
  _id?: string;
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
}

interface InventoryItem {
  blood_group: string;
  available_units: number;
  updated_at?: string;
}

interface BloodInventoryUpdateProps {
  user: User | null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
const AI_ENGINE_URL = 'http://localhost:8001';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const BLOOD_GROUP_COLORS: Record<string, string> = {
  'O+':  'from-red-500 to-rose-600',
  'O-':  'from-red-600 to-red-800',
  'A+':  'from-blue-500 to-indigo-600',
  'A-':  'from-blue-600 to-blue-800',
  'B+':  'from-emerald-500 to-teal-600',
  'B-':  'from-emerald-600 to-emerald-800',
  'AB+': 'from-purple-500 to-violet-600',
  'AB-': 'from-purple-600 to-purple-800',
};

const BLOOD_GROUP_BG: Record<string, string> = {
  'O+':  'bg-red-50 border-red-200',
  'O-':  'bg-red-50 border-red-300',
  'A+':  'bg-blue-50 border-blue-200',
  'A-':  'bg-blue-50 border-blue-300',
  'B+':  'bg-emerald-50 border-emerald-200',
  'B-':  'bg-emerald-50 border-emerald-300',
  'AB+': 'bg-purple-50 border-purple-200',
  'AB-': 'bg-purple-50 border-purple-300',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export function BloodInventoryUpdate({ user }: BloodInventoryUpdateProps) {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const orgId = user?.id || user?._id || 'default_hospital';

  /* ── Fetch current inventory ── */
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${AI_ENGINE_URL}/api/inventory/${orgId}`);
      if (res.ok) {
        const data = await res.json();
        const inv: Record<string, number> = {};
        const edits: Record<string, string> = {};
        let latest: string | null = null;

        if (data.inventory && data.inventory.length > 0) {
          for (const item of data.inventory) {
            inv[item.blood_group] = item.available_units;
            edits[item.blood_group] = String(item.available_units);
            if (item.updated_at && (!latest || item.updated_at > latest)) {
              latest = item.updated_at;
            }
          }
        }

        // Fill missing blood groups with 0
        for (const bg of BLOOD_GROUPS) {
          if (!(bg in inv)) {
            inv[bg] = 0;
            edits[bg] = '0';
          }
        }

        setInventory(inv);
        setEditValues(edits);
        if (latest) setLastUpdated(latest);
      }
    } catch (err) {
      console.warn('Failed to fetch inventory (AI engine may be offline):', err);
      // Initialize with zeros
      const inv: Record<string, number> = {};
      const edits: Record<string, string> = {};
      for (const bg of BLOOD_GROUPS) {
        inv[bg] = 0;
        edits[bg] = '0';
      }
      setInventory(inv);
      setEditValues(edits);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchInventory();
    const interval = setInterval(fetchInventory, 30000);
    return () => clearInterval(interval);
  }, [fetchInventory]);

  /* ── Save inventory ── */
  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const items = BLOOD_GROUPS.map(bg => ({
        blood_group: bg,
        available_units: parseInt(editValues[bg] || '0', 10) || 0,
      }));

      const res = await fetch(`${AI_ENGINE_URL}/api/inventory/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          organization_type: 'hospital',
          items,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(`✓ Updated ${data.results?.length || 8} blood group entries`);
        setLastUpdated(new Date().toISOString());
        await fetchInventory();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || 'Failed to update inventory');
      }
    } catch (err) {
      setError('Could not connect to AI Forecast Engine. Make sure it is running on port 8001.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Calculate total units ── */
  const totalUnits = BLOOD_GROUPS.reduce(
    (sum, bg) => sum + (parseInt(editValues[bg] || '0', 10) || 0),
    0
  );

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 animate-spin text-red-500 mr-3" />
        <span className="text-gray-500">Loading inventory…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" />
            Blood Availability Update
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Update your hospital's current blood stock levels
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          )}
          <button
            onClick={fetchInventory}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          {success}
        </div>
      )}

      {/* ── Summary bar ── */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm opacity-80">Total Available Units</div>
            <div className="text-3xl font-bold mt-1">{totalUnits}</div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <TrendingUp className="w-4 h-4" />
            {BLOOD_GROUPS.filter(bg => (parseInt(editValues[bg] || '0', 10) || 0) > 0).length} of {BLOOD_GROUPS.length} blood groups in stock
          </div>
        </div>
      </div>

      {/* ── Blood Group Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {BLOOD_GROUPS.map(bg => {
          const units = parseInt(editValues[bg] || '0', 10) || 0;
          const isLow = units < 10;
          const isCritical = units < 5;

          return (
            <div
              key={bg}
              className={`relative rounded-2xl border p-4 transition-all hover:shadow-md ${BLOOD_GROUP_BG[bg]}`}
            >
              {/* Blood group badge */}
              <div className={`w-12 h-10 rounded-xl bg-gradient-to-br ${BLOOD_GROUP_COLORS[bg]} flex items-center justify-center mb-3`}>
                <span className="text-white font-bold text-sm">{bg}</span>
              </div>

              {/* Units input */}
              <label className="block text-xs text-gray-500 mb-1 font-medium">Available Units</label>
              <input
                type="number"
                min={0}
                max={10000}
                value={editValues[bg] || '0'}
                onChange={(e) => setEditValues(prev => ({ ...prev, [bg]: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
              />

              {/* Status indicator */}
              {isCritical && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-xs font-bold">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                  Critical Low
                </div>
              )}
              {isLow && !isCritical && (
                <div className="mt-2 flex items-center gap-1 text-amber-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Low Stock
                </div>
              )}
              {!isLow && (
                <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Adequate
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
