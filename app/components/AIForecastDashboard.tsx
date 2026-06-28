import { useState, useEffect, useCallback } from 'react';
import {
  Brain, AlertTriangle, TrendingUp, RefreshCw, Loader, X,
  AlertCircle, CheckCircle, Shield, Bell, Users, Droplet,
  BarChart3, Activity, ChevronDown, Clock, Zap, Heart, Send
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

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

interface ForecastData {
  predictions: Record<string, number>;
  predictions_list: { blood_group: string; predicted_demand: number }[];
  model_accuracy: number | null;
  model_mae: number | null;
  generated_at: string;
}

interface ShortageItem {
  blood_group: string;
  predicted_demand: number;
  available_units: number;
  deficit: number;
  risk_level: 'low' | 'medium' | 'high';
}

interface ShortageData {
  analysis: ShortageItem[];
  critical_count: number;
  generated_at: string;
}

interface AlertItem {
  _id: string;
  region: string;
  blood_group: string;
  predicted_demand: number;
  available_units: number;
  deficit: number;
  risk_level: string;
  message: string;
  created_at: string;
}

interface Recommendation {
  blood_group: string;
  deficit: number;
  risk_level: string;
  recommendations: string[];
  priority: string;
}

interface AIForecastDashboardProps {
  user: User | null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
const AI_ENGINE_URL = 'http://localhost:8001';
const REGIONS = ['Pune', 'Mumbai', 'Nagpur', 'Nashik'];

const RISK_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  high:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-600',     label: 'High Risk' },
  medium: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   label: 'Medium Risk' },
  low:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Low Risk' },
};

const BAR_COLORS: Record<string, string> = {
  'O+': '#ef4444', 'O-': '#dc2626', 'A+': '#3b82f6', 'A-': '#2563eb',
  'B+': '#10b981', 'B-': '#059669', 'AB+': '#8b5cf6', 'AB-': '#7c3aed',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export function AIForecastDashboard({ user }: AIForecastDashboardProps) {
  const [region, setRegion] = useState('Pune');
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [shortage, setShortage] = useState<ShortageData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'outreach'>('overview');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  /* ── Fetch all data ── */
  const fetchAll = useCallback(async (showLoad = false) => {
    if (showLoad) setLoading(true);
    setError(null);

    try {
      const [fcRes, shRes, alRes, rcRes] = await Promise.allSettled([
        fetch(`${AI_ENGINE_URL}/api/forecast?region=${region}`),
        fetch(`${AI_ENGINE_URL}/api/shortage/analysis?region=${region}`),
        fetch(`${AI_ENGINE_URL}/api/shortage/alerts?region=${region}`),
        fetch(`${AI_ENGINE_URL}/api/shortage/recommendations?region=${region}`),
      ]);

      if (fcRes.status === 'fulfilled' && fcRes.value.ok) {
        setForecast(await fcRes.value.json());
      }
      if (shRes.status === 'fulfilled' && shRes.value.ok) {
        setShortage(await shRes.value.json());
      }
      if (alRes.status === 'fulfilled' && alRes.value.ok) {
        const alData = await alRes.value.json();
        setAlerts(alData.alerts || []);
      }
      if (rcRes.status === 'fulfilled' && rcRes.value.ok) {
        const rcData = await rcRes.value.json();
        setRecommendations(rcData.recommendations || []);
      }

      setLastRefreshed(new Date());
    } catch {
      setError('Could not connect to AI Forecast Engine. Ensure it is running on port 8001.');
    } finally {
      if (showLoad) setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    fetchAll(true);
    const interval = setInterval(() => fetchAll(false), 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  /* ── Access guard ── */
  if (!user || user.role !== 'hospital') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This dashboard is only accessible to authorized hospital staff.</p>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="relative">
          <Brain className="w-10 h-10 text-red-500 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <span className="text-gray-500 font-medium">Loading AI Forecast…</span>
      </div>
    );
  }

  /* ── Derived data ── */
  const chartData = shortage?.analysis.map(item => ({
    name: item.blood_group,
    'Predicted Demand': item.predicted_demand,
    'Available Units': item.available_units,
    'Deficit': item.deficit,
  })) || [];

  const riskDistribution = [
    { name: 'High Risk', value: shortage?.analysis.filter(i => i.risk_level === 'high').length || 0, color: '#ef4444' },
    { name: 'Medium Risk', value: shortage?.analysis.filter(i => i.risk_level === 'medium').length || 0, color: '#f59e0b' },
    { name: 'Low Risk', value: shortage?.analysis.filter(i => i.risk_level === 'low').length || 0, color: '#10b981' },
  ].filter(i => i.value > 0);

  const highRiskCount = shortage?.analysis.filter(i => i.risk_level === 'high').length || 0;
  const medRiskCount = shortage?.analysis.filter(i => i.risk_level === 'medium').length || 0;
  const totalDeficit = shortage?.analysis.reduce((sum, i) => sum + i.deficit, 0) || 0;

  /* ── Sub-tabs ── */
  const TABS = [
    { id: 'overview' as const, label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'alerts' as const, label: 'Alerts', icon: <Bell className="w-4 h-4" />, badge: alerts.length || undefined },
    { id: 'outreach' as const, label: 'Donor Outreach', icon: <Users className="w-4 h-4" />, badge: recommendations.length || undefined },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-red-600" />
            AI Demand Forecast & Shortage Monitoring
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            7-day blood demand predictions powered by Random Forest ML
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Region selector */}
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {lastRefreshed && (
            <span className="text-xs text-gray-400 hidden sm:block">
              <Clock className="w-3 h-3 inline mr-1" />
              {lastRefreshed.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={() => fetchAll(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{highRiskCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">High Risk Groups</div>
          {highRiskCount > 0 && <div className="text-[10px] text-red-600 font-bold mt-1 animate-pulse">⚠ Action Required</div>}
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{medRiskCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Medium Risk Groups</div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <Droplet className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalDeficit}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Unit Deficit</div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {forecast?.model_accuracy ? `${(forecast.model_accuracy * 100).toFixed(0)}%` : 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Model Accuracy (R²)</div>
        </div>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ id, label, icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === id
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {icon}
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* ── Chart: Demand vs Availability ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              Predicted Demand vs Available Units
              <span className="text-xs text-gray-400 font-normal ml-2">Next 7 days — {region}</span>
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Predicted Demand" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Available Units" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Two-column: Table + Risk Pie ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Forecast Table */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-red-600" />
                  Forecast Details
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">Blood Group</th>
                      <th className="px-5 py-3 text-right font-semibold">Available</th>
                      <th className="px-5 py-3 text-right font-semibold">Predicted Demand</th>
                      <th className="px-5 py-3 text-right font-semibold">Deficit</th>
                      <th className="px-5 py-3 text-center font-semibold">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {shortage?.analysis.map(item => {
                      const style = RISK_STYLES[item.risk_level] || RISK_STYLES.low;
                      return (
                        <tr key={item.blood_group} className={`${item.risk_level === 'high' ? 'bg-red-50/40' : ''} hover:bg-gray-50/50 transition-colors`}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                style={{ backgroundColor: BAR_COLORS[item.blood_group] || '#6b7280' }}
                              >
                                {item.blood_group}
                              </div>
                              <span className="font-medium text-gray-900">{item.blood_group}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-emerald-700">
                            {item.available_units}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                            {item.predicted_demand}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {item.deficit > 0 ? (
                              <span className="font-bold text-red-600">-{item.deficit}</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">0</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text} border ${style.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${item.risk_level === 'high' ? 'animate-pulse' : ''}`} />
                              {style.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Distribution Pie */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Risk Distribution
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {riskDistribution.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          ALERTS TAB
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Alerts</h3>
              <p className="text-sm text-gray-500">All blood groups have adequate supply for the forecast period.</p>
            </div>
          ) : (
            alerts.map(alert => {
              const style = RISK_STYLES[alert.risk_level] || RISK_STYLES.medium;
              return (
                <div
                  key={alert._id}
                  className={`rounded-2xl border p-5 ${style.bg} ${style.border} shadow-sm`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      alert.risk_level === 'high' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.risk_level === 'high' ? 'text-red-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text} border ${style.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${alert.risk_level === 'high' ? 'animate-pulse' : ''}`} />
                          {style.label}
                        </span>
                        <span className="text-xs text-gray-400">{alert.region}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-line">{alert.message}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Droplet className="w-3 h-3" />
                          {alert.blood_group}
                        </span>
                        <span>Demand: {alert.predicted_demand}u</span>
                        <span>Available: {alert.available_units}u</span>
                        <span className="font-bold text-red-600">Deficit: {alert.deficit}u</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          DONOR OUTREACH TAB
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'outreach' && (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <Heart className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Outreach Needed</h3>
              <p className="text-sm text-gray-500">No critical shortages detected. No donor outreach required at this time.</p>
            </div>
          ) : (
            recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  rec.priority === 'urgent' ? 'border-red-200' : 'border-amber-200'
                }`}
              >
                <div className={`px-5 py-3 border-b ${
                  rec.priority === 'urgent' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                        rec.priority === 'urgent' ? 'bg-red-600' : 'bg-amber-500'
                      }`}>
                        {rec.blood_group}
                      </div>
                      <span className="font-bold text-gray-900">{rec.blood_group} Blood Group</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        rec.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {rec.priority === 'urgent' ? '🔴 URGENT' : '🟡 STANDARD'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-red-600">Deficit: {rec.deficit}u</span>
                  </div>
                </div>
                <div className="p-5 space-y-2.5">
                  {rec.recommendations.map((text, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <Send className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
