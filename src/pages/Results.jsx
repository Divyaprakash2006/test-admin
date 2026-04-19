import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HiArrowDownTray, HiFunnel, HiTrophy, HiArrowTrendingUp, HiChartBar } from 'react-icons/hi2';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const RANGE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#6366f1', '#10b981'];
const RANGES = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];

function exportCSV(results) {
  const rows = [
    ['Student', 'Email', 'Test', 'Subject', 'Score', 'Total', 'Percentage', 'Pass/Fail', 'Time Taken (s)'],
    ...results.map(r => [
      r.student?.name, r.student?.email, r.test?.title, r.test?.subject,
      r.score, r.totalMarks, `${r.percentage}%`,
      r.passed ? 'Pass' : 'Fail', r.timeTaken
    ])
  ];
  const csv = rows.map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'results.csv'; a.click();
}

export default function Results() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [results, setResults]       = useState([]);
  const [tests, setTests]           = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);

  // Theme tokens
  const textSub      = isDark ? 'text-gray-400' : 'text-gray-500';
  const axis         = isDark ? '#9ca3af' : '#6b7280';
  const gridStroke   = isDark ? '#1f2937' : '#e2e8f0';
  const tooltipBg    = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e2e8f0';
  const theadBorder  = isDark ? 'border-gray-800' : 'border-gray-200';
  const theadBg      = isDark ? 'bg-gray-900/50' : 'bg-gray-50';
  const divideColor  = isDark ? 'divide-gray-800/50' : 'divide-gray-200';
  const filterIcon   = isDark ? 'text-gray-500' : 'text-gray-400';
  const leaderRow    = isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100';
  const rankChip     = (i) => i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500';

  useEffect(() => {
    Promise.all([api.get('/analytics/all-results'), api.get('/tests')])
      .then(([r, t]) => { setResults(r.data.results); setTests(t.data.tests); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL test results and sessions? This cannot be undone.')) return;
    setLoading(true);
    try {
      await api.delete('/analytics/all-results');
      setResults([]);
    } catch (err) { console.error('Failed to clear results', err); }
    setLoading(false);
  };

  const filtered = results.filter(r => {
    const matchTest   = !selectedTest || r.test?._id === selectedTest;
    const matchSearch = !search || r.student?.name?.toLowerCase().includes(search.toLowerCase());
    return matchTest && matchSearch;
  });

  // Score distribution by ranges
  const dist = { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 };
  filtered.forEach(r => {
    if (r.percentage <= 20) dist['0-20%']++;
    else if (r.percentage <= 40) dist['21-40%']++;
    else if (r.percentage <= 60) dist['41-60%']++;
    else if (r.percentage <= 80) dist['61-80%']++;
    else dist['81-100%']++;
  });
  const distData = Object.entries(dist).map(([range, count]) => ({ range, count }));

  // Leaderboard
  const top = [...filtered].sort((a, b) => b.percentage - a.percentage).slice(0, 10);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ color: isDark ? '#d1d5db' : '#374151', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.fill, fontSize: 12, fontWeight: 700 }}>{p.value} students</p>)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Results &amp; Reports</h1>
          <p className={`${textSub} text-sm mt-1`}>{filtered.length} results found</p>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <button onClick={handleClearAll} className="btn-danger flex items-center gap-2">
              Clear All
            </button>
          )}
          <button onClick={() => exportCSV(filtered)} className="btn-primary flex items-center gap-2">
            <HiArrowDownTray className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <HiFunnel className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${filterIcon}`} />
          <input className="input pl-10" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-xs" value={selectedTest} onChange={e => setSelectedTest(e.target.value)}>
          <option value="">All Tests</option>
          {tests.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
        </select>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <HiChartBar className="w-5 h-5 text-primary-400" /> Score Distribution (Percentage)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="range" tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#ffffff08' : '#00000008' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distData.map((d, i) => <Cell key={i} fill={RANGE_COLORS[i % RANGE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <HiTrophy className="w-5 h-5 text-amber-400" /> Top Performers
          </h2>
          <div className="space-y-2">
            {top.length === 0 ? (
              <p className={`${textSub} text-sm text-center py-6`}>No results yet</p>
            ) : (
              top.map((r, i) => (
                <div key={r._id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${leaderRow}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankChip(i)}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.student?.name}</p>
                    <p className={`text-xs ${textSub} truncate`}>{r.test?.title}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-400">{r.percentage}%</span>
                  <span className={r.passed ? 'badge-pass' : 'badge-fail'}>{r.passed ? 'Pass' : 'Fail'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {/* Desktop Table */}
        <div className="hidden md:block card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${theadBorder} ${theadBg}`}>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Test</th>
                  <th className="text-center px-4 py-3 font-medium">Score</th>
                  <th className="text-center px-4 py-3 font-medium">Pass/Fail</th>
                  <th className="text-center px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${divideColor}`}>
                {loading ? (
                  <tr><td colSpan={5} className={`text-center py-12 ${textSub}`}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className={`text-center py-12 ${textSub}`}>No results found</td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r._id} className="hover:bg-primary-500/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-600/15 flex items-center justify-center border border-primary-500/20">
                            <span className="text-xs font-bold text-primary-500">{r.student?.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{r.student?.name}</p>
                            <p className={`text-[10px] ${textSub} opacity-70`}>{r.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-xs">{r.test?.title}</p>
                        <p className={`text-[10px] ${textSub} opacity-60 uppercase tracking-tighter`}>{r.test?.subject}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold">{r.score}/{r.totalMarks}</span>
                        <p className={`text-[10px] ${textSub}`}>{r.percentage}%</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 font-black uppercase rounded ${r.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                           {r.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center text-xs ${textSub}`}>
                        {r.timeTaken ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="card h-28 animate-pulse bg-gray-800/20" />)
          ) : filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className={textSub}>No results found</p>
            </div>
          ) : (
            filtered.map(r => (
              <div key={r._id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600/10 flex items-center justify-center border border-primary-500/20">
                      <span className="text-sm font-bold text-primary-500">{r.student?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-base leading-tight">{r.student?.name}</p>
                      <p className={`text-xs ${textSub} font-medium`}>{r.test?.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-primary-500">{r.percentage}%</p>
                    <span className={`text-[9px] px-1.5 py-0.5 font-black uppercase rounded ${r.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                       {r.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                   <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-500/5">
                      <div className="flex flex-col">
                        <span className={`text-[8px] uppercase font-black tracking-widest ${textSub} opacity-50`}>Score</span>
                        <span className="text-xs font-bold">{r.score}/{r.totalMarks}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-500/5">
                      <div className="flex flex-col">
                        <span className={`text-[8px] uppercase font-black tracking-widest ${textSub} opacity-50`}>Duration</span>
                        <span className="text-xs font-bold">{r.timeTaken ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : '—'}</span>
                      </div>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
