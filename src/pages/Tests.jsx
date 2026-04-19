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
                </div>
                <button onClick={() => togglePublish(t)} className={`p-1 ml-2 shrink-0 ${metaText} hover:text-primary-400 transition-colors`}>
                  {t.isPublished ? <HiOutlineEye className="w-5 h-5 text-emerald-400" /> : <HiOutlineEyeSlash className="w-5 h-5" />}
                </button>
              </div>
              <div className={`flex items-center gap-4 text-sm ${metaText} mb-4`}>
                <span className="flex items-center gap-1"><HiClock className="w-3.5 h-3.5" />{t.duration}m</span>
                <span className="flex items-center gap-1"><HiBookOpen className="w-3.5 h-3.5" />{t.questions?.length || 0} Qs</span>
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
