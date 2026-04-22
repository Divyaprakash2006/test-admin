import { useEffect, useState } from 'react';
import {
  HiPlusSmall, HiMagnifyingGlass, HiTrash, HiUserPlus, HiArrowUpTray, HiXMark, HiCheck, HiUsers, HiEnvelope, HiBookOpen, HiEye, HiPencilSquare, HiArrowPath,
  HiArrowDownTray, HiNoSymbol, HiExclamationTriangle
} from 'react-icons/hi2';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const markFmt = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(1) : '0.0';
};

function AddStudentModal({ onClose, onAdded, isDark }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', batch: '', rollNo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const panelBg     = isDark ? 'bg-gray-900 border-gray-800'  : 'bg-white border-gray-200';
  const headerBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const closeBtn    = isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500';

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/students', form);
      onAdded(data.student); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to add student'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${panelBg} border rounded-2xl w-full max-w-md shadow-2xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${headerBorder}`}>
          <h2 className="text-lg font-semibold">Add New Student</h2>
          <button onClick={onClose} className={`p-1 rounded-lg ${closeBtn}`}><HiXMark className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-2 text-sm">{error}</div>}
          <div><label className="label">Full Name *</label><input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="label">Roll Number *</label><input className="input" placeholder="e.g. STU-2024-001" required value={form.rollNo} onChange={e => setForm(p => ({ ...p, rollNo: e.target.value }))} /></div>
          <div><label className="label">Email *</label><input type="email" className="input" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div><label className="label">Password</label><input type="password" className="input" placeholder="Default: Student@123" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
          <div><label className="label">Batch / Group</label><input className="input" placeholder="e.g. Batch A" value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Adding...' : 'Add Student'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EnrollModal({ student, tests, onClose, onEnrolled, isDark }) {
  const [selectedTests, setSelectedTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const panelBg     = isDark ? 'bg-gray-900 border-gray-800'  : 'bg-white border-gray-200';
  const headerBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const textSub      = isDark ? 'text-gray-400' : 'text-gray-500';

  const enrolledIds = new Set(student.enrolledTests || []);
  const availableTests = tests.filter(t => !enrolledIds.has(t._id));

  const toggleTest = (id) => {
    setSelectedTests(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const submit = async () => {
    if (selectedTests.length === 0) return;
    setLoading(true); setError('');
    try {
      await api.post(`/students/${student._id}/enroll`, { testIds: selectedTests });
      onEnrolled(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Enrollment failed'); }
    setLoading(false);
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear ALL test enrollments for this student? This will remove them from all scheduled tests.')) return;
    setClearing(true); setError('');
    try {
      await api.delete(`/students/${student._id}/enroll`);
      onEnrolled(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Clear failed'); }
    setClearing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`${panelBg} border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className={`p-6 border-b ${headerBorder} flex items-center justify-between`}>
          <div>
            <h2 className="text-lg font-semibold">Enroll in Tests</h2>
            <p className={`text-xs ${textSub} mt-1`}>Student: <span className="font-bold text-primary-400">{student.name}</span></p>
          </div>
          <button 
            onClick={handleClear} 
            title="Clear all enrollments"
            disabled={clearing || !student.enrolledTests?.length}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-30"
          >
            <HiNoSymbol className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
          {error && <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-2 text-sm mb-4">{error}</div>}
          {availableTests.length === 0 ? (
            <div className="text-center py-8">
              <HiCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-50" />
              <p className={`${textSub} text-sm`}>This student is already enrolled in all available tests.</p>
            </div>
          ) : (
            availableTests.map(t => (
              <label key={t._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedTests.includes(t._id) ? 'bg-primary-600/10 border-primary-600/50 shadow-lg shadow-primary-600/5' : isDark ? 'border-gray-800 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                <input type="checkbox" className="hidden" checked={selectedTests.includes(t._id)} onChange={() => toggleTest(t._id)} />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedTests.includes(t._id) ? 'bg-primary-600 border-primary-600' : isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  {selectedTests.includes(t._id) && <HiCheck className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold leading-tight">{t.title}</p>
                  <p className={`text-[10px] uppercase font-black tracking-widest ${textSub} mt-1`}>{t.subject || 'General'}</p>
                </div>
              </label>
            ))
          )}
        </div>
        <div className="p-6 flex gap-3 border-t border-white/5 bg-black/5">
          <button onClick={onClose} className="btn-secondary flex-1 font-bold">Cancel</button>
          <button onClick={submit} disabled={loading || selectedTests.length === 0} className="btn-primary flex-1 font-bold shadow-xl shadow-primary-600/20">
            {loading ? 'Enrolling...' : clearing ? 'Clearing...' : `Enroll (${selectedTests.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose, onImported, isDark }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const panelBg     = isDark ? 'bg-gray-900 border-gray-800'  : 'bg-white border-gray-200';
  const headerBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const textSub      = isDark ? 'text-gray-400' : 'text-gray-500';

  const downloadTemplate = () => {
    const csvContent = "name,email,password,batch,rollNo\nJohn Doe,john@example.com,pass123,Batch A,STU-001\nJane Smith,jane@example.com,pass456,Batch B,STU-002";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/students/bulk-import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
      if (onImported) onImported();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`${panelBg} border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className={`p-6 border-b ${headerBorder} flex items-center justify-between`}>
          <div>
            <h2 className="text-lg font-semibold"> All Student Import</h2>
            <p className={`text-xs ${textSub} mt-1`}>Upload Excel (.xlsx) or CSV files</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><HiXMark className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {!result ? (
            <>
              {/* Format Guide */}
              <div className="bg-primary-600/5 border border-primary-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <HiBookOpen className="w-4 h-4 text-primary-400" />
                  <h3 className="text-sm font-bold">Required Sheet Format</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-left">
                    <thead>
                      <tr className="text-gray-500 uppercase font-black">
                        <th className="pb-2">name</th>
                        <th className="pb-2">email</th>
                        <th className="pb-2">rollNo</th>
                        <th className="pb-2">batch</th>
                        <th className="pb-2">password</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono opacity-80">
                      <tr>
                        <td>Student Name</td>
                        <td>email@example.com</td>
                        <td>STU-01</td>
                        <td>A1</td>
                        <td>(Optional)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button onClick={downloadTemplate} className="mt-4 text-[10px] font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  <HiArrowDownTray className="w-3 h-3" /> DOWNLOAD CSV TEMPLATE
                </button>
              </div>

              {/* Upload UI */}
              <div className={`border-2 border-dashed ${file ? 'border-primary-500 bg-primary-500/5' : 'border-gray-800'} rounded-2xl p-8 text-center transition-colors relative`}>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={e => setFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {!file ? (
                  <div className="space-y-2 pointer-events-none">
                    <HiArrowUpTray className="w-8 h-8 mx-auto text-gray-500" />
                    <p className="font-medium">Drop file here or click to browse</p>
                    <p className={`text-xs ${textSub}`}>Supports .xlsx, .xls, .csv</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <HiCheck className="w-8 h-8 mx-auto text-emerald-500" />
                    <p className="font-bold text-emerald-500">{file.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-400 hover:underline">Change File</button>
                  </div>
                )}
              </div>

              {error && <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-2 text-sm">{error}</div>}
            </>
          ) : (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Import Completed</h3>
              
              <div className="flex justify-center gap-8 py-2">
                <div>
                  <p className="text-2xl font-bold text-primary-400">{result.created?.length || 0}</p>
                  <p className={`text-[10px] uppercase font-black tracking-widest ${textSub}`}>New</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{result.updated?.length || 0}</p>
                  <p className={`text-[10px] uppercase font-black tracking-widest ${textSub}`}>Updated</p>
                </div>
              </div>
              
              {result.skipped?.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-4 text-left">
                  <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5 mb-2">
                    <HiExclamationTriangle className="w-4 h-4" /> 
                    {result.skipped.length} Skipped (Issues)
                  </p>
                  <div className="max-h-24 overflow-y-auto text-[10px] mono opacity-80 break-all space-y-1">
                    {result.skipped.map((item, i) => (
                      <div key={i} className="flex justify-between gap-4">
                        <span className="font-bold">{typeof item === 'string' ? item : item.email}</span>
                        <span className="opacity-50">{typeof item === 'string' ? 'Duplicate' : item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={onClose} className="btn-primary w-full mt-4">Done</button>
            </div>
          )}
        </div>

        {!result && (
          <div className="p-6 border-t border-white/5 bg-black/5 flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={loading || !file} className="btn-primary flex-1">
              {loading ? 'Processing...' : 'Start Import'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StudentDetailsModal({ studentId, editInitially = false, onClose, onUpdated, isDark }) {
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(editInitially);
  const [form, setForm] = useState({ name: '', email: '', password: '', batch: '', rollNo: '' });
  const [updating, setUpdating] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  const [error, setError] = useState('');

  const panelBg      = isDark ? 'bg-gray-900 border-gray-800'  : 'bg-white border-gray-200';
  const headerBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const textSub      = isDark ? 'text-gray-400' : 'text-gray-500';

  const fetchDetails = async () => {
    try {
      const { data } = await api.get(`/students/${studentId}`);
      setStudent(data.student);
      setResults(data.results);
      setForm({
        name: data.student.name || '',
        email: data.student.email || '',
        password: '',
        batch: data.student.batch || '',
        rollNo: data.student.rollNo || ''
      });
    } catch (err) { setError('Failed to load student details'); }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetails();
  }, [studentId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const { data } = await api.put(`/students/${studentId}`, payload);
      setStudent(data.student);
      setEditMode(false);
      onUpdated();
    } catch (err) { setError(err.response?.data?.message || 'Update failed'); }
    setUpdating(false);
  };

  const handleResetAttempt = async (testId) => {
    if (!window.confirm('Reset this test attempt? This will delete the student\'s progress and score.')) return;
    setResettingId(testId);
    try {
      await api.delete(`/students/${studentId}/tests/${testId}/reset`);
      await fetchDetails();
    } catch (err) { setError('Failed to reset attempt'); }
    setResettingId(null);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${panelBg} border rounded-2xl w-full max-w-lg p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-200`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className={`mt-4 ${textSub}`}>Loading student details...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`${panelBg} border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className={`flex items-center justify-between p-6 border-b ${headerBorder}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-400">{student.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{student.name}</h2>
              <p className={`text-xs ${textSub}`}>{editMode ? 'Edit Profile' : 'Student Profile'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editMode && (
              <button onClick={() => setEditMode(true)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2">
                <HiPencilSquare className="w-4 h-4" /> Edit
              </button>
            )}
            <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors`}><HiXMark className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {error && <div className="mb-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-3 text-sm">{error}</div>}

          {editMode ? (
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><label className="label">Email Address</label><input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
              <div><label className="label">Roll Number</label><input className="input" value={form.rollNo} onChange={e => setForm(p => ({ ...p, rollNo: e.target.value }))} /></div>
              <div><label className="label">Batch / Group</label><input className="input" value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))} /></div>
              <div><label className="label text-primary-400 font-bold">Update Password</label><input type="password" className="input border-primary-900/50" placeholder="New password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
              <div className="md:col-span-2 flex gap-3 pt-6 border-t border-white/5 mt-2">
                <button type="button" onClick={() => setEditMode(false)} className="btn-secondary flex-1">Back</button>
                <button type="submit" disabled={updating} className="btn-primary flex-1">{updating ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                  <p className={`text-[10px] uppercase font-black tracking-wider ${textSub} mb-1 opacity-50`}>Roll No</p>
                  <p className="font-mono text-sm font-bold">{student.rollNo || '—'}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className={`text-[10px] uppercase font-black tracking-wider ${textSub} mb-1 opacity-50`}>Batch</p>
                  <p className="text-sm font-bold">{student.batch || '—'}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className={`text-[10px] uppercase font-black tracking-wider ${textSub} mb-1 opacity-50`}>Completed</p>
                  <p className="text-sm font-bold text-primary-400">{results.length} Tests</p>
                </div>
              </div>

              {/* Test Results Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 opacity-70">
                    <HiBookOpen className="w-4 h-4 text-primary-400" /> Recent Performance
                  </h3>
                </div>
                
                {results.length === 0 ? (
                  <div className="card p-12 text-center border-dashed border-gray-800">
                    <HiArrowPath className={`w-8 h-8 mx-auto mb-3 opacity-20`} />
                    <p className={`${textSub} text-sm`}>No participation records found for this student.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-white/5 rounded-2xl bg-black/20">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-5 py-3 font-semibold text-xs text-gray-400">TEST TITLE</th>
                          <th className="px-5 py-3 font-semibold text-xs text-gray-400">SCORE</th>
                          <th className="px-5 py-3 font-semibold text-xs text-gray-400">STATUS</th>
                          <th className="px-5 py-3 font-semibold text-xs text-gray-400">DATE</th>
                          <th className="px-5 py-3 font-semibold text-xs text-gray-400 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {results.map(r => (
                          <tr key={r._id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-5 py-4">
                              <p className="font-medium">{r.test?.title}</p>
                              <p className={`text-[10px] font-bold ${textSub} uppercase tracking-tighter`}>{r.test?.subject}</p>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 w-16 bg-gray-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${r.percentage >= 40 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${r.percentage}%` }} />
                                </div>
                                <span className="font-bold text-xs">{markFmt(r.score)}/{markFmt(r.totalMarks)}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${r.percentage >= 40 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {r.percentage >= 40 ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                            <td className={`px-5 py-4 text-xs font-mono opacity-50`}>
                              {new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleResetAttempt(r.test?._id)}
                                disabled={resettingId === r.test?._id}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                title="Reset Attempt"
                              >
                                <HiArrowPath className={`w-4 h-4 ${resettingId === r.test?._id ? 'animate-spin' : ''}`} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Students() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [students, setStudents] = useState([]);
  const [tests, setTests]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [editRequest, setEditRequest] = useState(false);

  const textSub      = isDark ? 'text-gray-400' : 'text-gray-500';
  const theadBorder  = isDark ? 'border-gray-800' : 'border-gray-200';
  const theadBg      = isDark ? 'bg-gray-900/50' : 'bg-gray-50';
  const divideColor  = isDark ? 'divide-gray-800/50' : 'divide-gray-200';
  const iconColor    = isDark ? 'text-gray-500' : 'text-gray-400';
  const batchColor   = isDark ? 'text-gray-300' : 'text-gray-600';

  const load = async () => {
    const [s, t] = await Promise.all([api.get('/students'), api.get('/tests')]);
    setStudents(s.data.students); setTests(t.data.tests); setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const deleteStudent = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    await api.delete(`/students/${id}`);
    setStudents(p => p.filter(s => s._id !== id));
  };

  const filtered = students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className={`${textSub} text-sm mt-1`}>{students.length} registered students</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
            <HiArrowUpTray className="w-4 h-4" /> All Student Import
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <HiPlusSmall className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <HiMagnifyingGlass className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
        <input className="input pl-10" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Content Container */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden md:block card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${theadBorder} ${theadBg}`}>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Roll No</th>
                  <th className="text-left px-4 py-3 font-medium">Batch</th>
                  <th className="text-left px-4 py-3 font-medium text-center">Enrolled</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${divideColor}`}>
                {loading ? (
                  <tr><td colSpan={6} className={`text-center py-12 ${textSub}`}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <HiUsers className={`w-10 h-10 mx-auto mb-2 ${iconColor}`} />
                    <p className={textSub}>No students found</p>
                  </td></tr>
                ) : (
                  filtered.map(s => (
                    <tr key={s._id} className="hover:bg-primary-500/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-600/15 flex items-center justify-center border border-primary-500/20">
                            <span className="text-xs font-bold text-primary-500">{s.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className={`${textSub} text-[10px] flex items-center gap-1 opacity-70`}><HiEnvelope className="w-3 h-3" />{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="mono-chip font-mono text-[10px] px-2 py-0.5 rounded uppercase">{s.rollNo || '—'}</span>
                      </td>
                      <td className={`px-4 py-3 text-xs font-medium ${batchColor}`}>{s.batch || 'General'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-primary-400">{s.enrolledTests?.length || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded ${s.isActive !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {s.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setDetailsTarget(s._id)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all" title="View"><HiEye className="w-4 h-4" /></button>
                          <button onClick={() => { setDetailsTarget(s._id); setEditRequest(true); }} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" title="Edit"><HiPencilSquare className="w-4 h-4" /></button>
                          <button onClick={() => setEnrollTarget(s)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all" title="Enroll"><HiUserPlus className="w-4 h-4" /></button>
                          <button onClick={() => deleteStudent(s._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Delete"><HiTrash className="w-4 h-4" /></button>
                        </div>
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
            [1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-800/20" />)
          ) : filtered.length === 0 ? (
            <div className="card text-center py-12">
              <HiUsers className={`w-10 h-10 mx-auto mb-2 ${iconColor}`} />
              <p className={textSub}>No students found</p>
            </div>
          ) : (
            filtered.map(s => (
              <div key={s._id} className="card p-4 space-y-4 shadow-xl active:scale-[0.98] transition-transform" onClick={() => setDetailsTarget(s._id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600/10 flex items-center justify-center border border-primary-500/20">
                      <span className="text-sm font-bold text-primary-500">{s.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-base leading-tight">{s.name}</p>
                      <p className={`text-xs ${textSub} font-medium opacity-70`}>{s.rollNo || 'No Roll No'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 font-black uppercase rounded-md tracking-wider ${s.isActive !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {s.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                   <div className="flex flex-col">
                      <span className={`text-[9px] uppercase font-black tracking-widest ${textSub} opacity-50`}>Batch</span>
                      <span className="text-xs font-bold">{s.batch || 'General'}</span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className={`text-[9px] uppercase font-black tracking-widest ${textSub} opacity-50`}>Tests</span>
                      <span className="text-xs font-bold text-primary-400">{s.enrolledTests?.length || 0} Enrollments</span>
                   </div>
                </div>

                <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setDetailsTarget(s._id); setEditRequest(true); }} className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 rounded-xl">
                    <HiPencilSquare className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => setEnrollTarget(s)} className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-lg shadow-primary-600/20">
                    <HiUserPlus className="w-4 h-4" /> Enroll
                  </button>
                  <button onClick={() => deleteStudent(s._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAdd && <AddStudentModal isDark={isDark} onClose={() => setShowAdd(false)} onAdded={s => setStudents(p => [s, ...p])} />}
      {showImport && <BulkImportModal isDark={isDark} onClose={() => setShowImport(false)} onImported={load} />}
      {enrollTarget && <EnrollModal isDark={isDark} student={enrollTarget} tests={tests} onClose={() => setEnrollTarget(null)} onEnrolled={load} />}
      {detailsTarget && (
        <StudentDetailsModal
          isDark={isDark}
          studentId={detailsTarget}
          editInitially={editRequest}
          onClose={() => { setDetailsTarget(null); setEditRequest(false); }}
          onUpdated={load}
        />
      )}
    </div>
  );
}
