import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { HiUsers, HiBookOpen, HiChartBar, HiAcademicCap, HiBolt, HiChartBarSquare } from 'react-icons/hi2';
import api from '../api';

// --- KPI Card ---
function KPICard({ label, value, icon: Icon, color, isDark }) {
  return (
    <div className={`card flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      </div>
    </div>
  );
}

// --- Custom Tooltip ---
function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  const bg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e2e8f0';
  const text = isDark ? '#f9fafb' : '#111827';
  const sub = isDark ? '#9ca3af' : '#6b7280';
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px', color: text }}>
      <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{label}</p>
      {payload.map((d, i) => (
        <p key={i} style={{ color: d.color, fontSize: 12 }}>{d.name}: <strong>{d.value}{d.name.includes('%') ? '' : ''}</strong></p>
      ))}
    </div>
  );
}

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({ totalStudents: 0, activeTests: 0, avgScore: 0, passRate: 0 });
  const [testPerf, setTestPerf] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/kpi').catch(() => ({ data: { data: {} } })),
      api.get('/analytics/all-results').catch(() => ({ data: { results: [] } })),
      api.get('/analytics/recent-activity').catch(() => ({ data: { data: [] } })),
    ]).then(([s, r, a]) => {
      // Backend returns: { success, data: { totalStudents, totalTests, avgScore, passRate } }
      const kpi = s.data.data || {};
      setStats({
        totalStudents: kpi.totalStudents ?? 0,
        activeTests:   kpi.totalTests   ?? 0,
        avgScore:      kpi.avgScore     ?? 0,
        passRate:      kpi.passRate     ?? 0,
      });
      // Backend returns: { success, data: [...sessions] }
      setActivity(a.data.data || []);

      // Group results by test to compute per-test avg score and submission count
      const byTest = {};
      (r.data.results || []).forEach(res => {
        if (!res.test?._id) return; // Skip orphaned results
        const title = res.test?.title || 'Unknown';
        if (!byTest[title]) byTest[title] = { total: 0, count: 0, passed: 0 };
        byTest[title].total += res.percentage || 0;
        byTest[title].count += 1;
        if (res.passed) byTest[title].passed += 1;
      });

      const perf = Object.entries(byTest).map(([title, d]) => ({
        name: title.length > 16 ? title.slice(0, 14) + '…' : title,
        fullName: title,
        avgScore: Math.round(d.total / d.count),
        submissions: d.count,
        passRate: Math.round((d.passed / d.count) * 100),
      }));

      // Only real data — no demo fallback
      setTestPerf(perf);
    }).finally(() => setLoading(false));
  }, []);
  
  const handleClearActivity = async () => {
    if (!window.confirm('Clear all recent activity?')) return;
    try {
      await api.delete('/analytics/recent-activity');
      setActivity([]);
    } catch (err) { console.error('Failed to clear activity', err); }
  };

  const textMain    = isDark ? 'text-white' : 'text-gray-900';
  const textSub     = isDark ? 'text-gray-400' : 'text-gray-500';
  const axis        = isDark ? '#9ca3af' : '#6b7280';
  const labelColor  = isDark ? '#f3f4f6' : '#111827';
  const gridLine    = isDark ? '#1f2937' : '#f1f5f9';

  const kpiCards = [
    { label: 'Total Students', value: loading ? '…' : (stats.totalStudents ?? 0), icon: HiUsers, color: 'bg-primary-600' },
    { label: 'Active Tests',   value: loading ? '…' : (stats.activeTests   ?? 0), icon: HiBookOpen, color: 'bg-violet-600' },
    { label: 'Avg Score',      value: loading ? '…' : `${stats.avgScore ?? 0}%`,  icon: HiChartBar, color: 'bg-emerald-600' },
    { label: 'Pass Rate',      value: loading ? '…' : `${stats.passRate ?? 0}%`,  icon: HiAcademicCap, color: 'bg-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${textMain}`}>Dashboard</h1>
        <p className={`text-sm ${textSub} mt-1`}>Overview of all tests and student activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map(k => <KPICard key={k.label} {...k} isDark={isDark} />)}
      </div>

      {/* Per-Test Performance Chart */}
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
          <div className="flex items-center gap-2">
            <HiChartBarSquare className="w-5 h-5 text-primary-500" />
            <h2 className={`text-base font-semibold ${textMain}`}>Performance Matrix</h2>
          </div>
          <span className={`sm:ml-auto text-[10px] md:text-xs ${textSub} uppercase tracking-widest font-bold opacity-60`}>Avg Score per test</span>
        </div>

        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-gray-800/40" />
        ) : testPerf.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <HiChartBarSquare className={`w-10 h-10 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-sm ${textSub}`}>No data available yet</p>
          </div>
        ) : (
          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={testPerf} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? '#ffffff08' : '#00000008' }} />
              <Bar dataKey="avgScore" name="Avg Score %" radius={[6, 6, 0, 0]} maxBarSize={52}>
                {testPerf.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
                <LabelList dataKey="avgScore" position="top" formatter={v => `${v}%`} style={{ fill: labelColor, fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

        {/* Legend chips */}
        {!loading && testPerf.length > 0 && (
          <div className={`flex flex-wrap gap-2 mt-3 pt-3 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
            {testPerf.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                <span className={`text-xs ${textSub}`}>{t.fullName} — <strong className={textMain}>{t.avgScore}%</strong> avg · {t.submissions} attempts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiBolt className="w-5 h-5 text-primary-500" />
            <h2 className={`text-base font-semibold ${textMain}`}>Recent Activity</h2>
          </div>
          {activity.length > 0 && (
            <button onClick={handleClearActivity} className={`text-xs ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'} transition-colors`}>
              Clear
            </button>
          )}
        </div>
        {activity.length === 0 ? (
          <p className={`text-sm ${textSub} text-center py-6`}>No recent activity to show</p>
        ) : (
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-indigo-500">{a.admin?.name?.[0]?.toUpperCase() || 'A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      <strong>{a.admin?.name || 'Admin'}</strong> {a.action} {a.targetType} <strong>{a.targetName}</strong>
                    </span>
                    {a.details && <span className={`text-[10px] ${textSub}`}>{a.details}</span>}
                  </div>
                </div>
                <span className={`text-xs ${textSub} shrink-0 ml-4`}>
                  {new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
