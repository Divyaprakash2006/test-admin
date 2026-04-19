import { useEffect, useState } from 'react';
import { HiPlusSmall, HiPencil, HiTrash, HiBookOpen, HiClock, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

export default function Tests() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tests, setTests]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const textSub      = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBorder   = isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300';
  const metaText     = isDark ? 'text-gray-400' : 'text-gray-500';
  const divider      = isDark ? 'border-gray-800' : 'border-gray-200';
  const skeletonBg   = isDark ? 'bg-gray-900' : 'bg-gray-200';
  const iconMuted    = isDark ? 'text-gray-700' : 'text-gray-300';
  const badgeStart   = isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100';

  const formatDateTime = (iso) => {
    if (!iso) return 'Flexible';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (iso) => {
    if (!iso) return null;
    const diff = new Date(iso) - new Date();
    const mins = Math.round(diff / 60000);
    if (Math.abs(mins) < 1) return 'Just now';
    if (mins > 0) {
      if (mins < 60) return `Starts in ${mins}m`;
      const hours = Math.round(mins / 60);
      if (hours < 24) return `Starts in ${hours}h`;
      return `Starts in ${Math.round(hours / 24)}d`;
    } else {
      const pastIdx = Math.abs(mins);
      if (pastIdx < 60) return `${pastIdx}m ago`;
      const hours = Math.round(pastIdx / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.round(hours / 24)}d ago`;
    }
  };

  useEffect(() => {
    api.get('/tests').then(({ data }) => setTests(data.tests)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const deleteTest = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    setDeleting(id);
    await api.delete(`/tests/${id}`);
    setTests(p => p.filter(t => t._id !== id));
    setDeleting(null);
  };

  const togglePublish = async (test) => {
    const { data } = await api.put(`/tests/${test._id}`, { isPublished: !test.isPublished });
    setTests(p => p.map(t => t._id === data.test._id ? data.test : t));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tests</h1>
          <p className={`${textSub} text-sm mt-1`}>Manage all your tests and questions</p>
        </div>
        <button onClick={() => navigate('/tests/new')} className="btn-primary flex items-center gap-2">
          <HiPlusSmall className="w-5 h-5" /> Create Test
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className={`card animate-pulse h-40 ${skeletonBg}`} />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="card text-center py-16">
          <HiBookOpen className={`w-12 h-12 mx-auto mb-3 ${iconMuted}`} />
          <p className={`font-medium`}>No tests yet</p>
          <p className={`${textSub} text-sm mt-1`}>Create your first test to get started</p>
          <button onClick={() => navigate('/tests/new')} className="btn-primary mt-4 inline-flex items-center gap-2">
            <HiPlusSmall className="w-5 h-5" /> Create Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map(t => (
            <div key={t._id} className={`card hover:shadow-md transition-all group`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{t.title}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>{t.subject || 'General'}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-4">
                  <button onClick={() => togglePublish(t)} className={`p-1 ${metaText} hover:text-primary-400 transition-colors`}>
                    {t.isPublished ? <HiOutlineEye className="w-5 h-5 text-emerald-400" /> : <HiOutlineEyeSlash className="w-5 h-5" />}
                  </button>
                  {t.scheduledDate && (
                    <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {getRelativeTime(t.scheduledDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] ${metaText} mb-4`}>
                <span className="flex items-center gap-1.5"><HiClock className="w-4 h-4 text-primary-500" />{t.duration}m</span>
                <span className="flex items-center gap-1.5"><HiBookOpen className="w-4 h-4 text-primary-500" />{t.questions?.length || 0} Qs</span>
                {t.scheduledDate && (
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${badgeStart}`}>
                    {formatDateTime(t.scheduledDate)}
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-2 pt-3 border-t ${divider}`}>
                <button onClick={() => navigate(`/tests/${t._id}/edit`)}
                  className="flex-1 btn-secondary py-1.5 text-sm flex items-center justify-center gap-1.5">
                  <HiPencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => deleteTest(t._id)} disabled={deleting === t._id}
                  className="btn-danger py-1.5 px-3 text-sm flex items-center gap-1.5">
                  <HiTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
