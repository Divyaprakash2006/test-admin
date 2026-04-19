import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  HiArrowPath, HiLockClosed, HiEnvelope, HiShieldCheck, HiUserPlus, HiArrowRightOnRectangle
} from 'react-icons/hi2';
import api from '../api';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const { theme }    = useTheme();
  const isDark       = theme === 'dark';

  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Theme tokens
  const pageBg    = isDark ? 'bg-gray-950' : 'bg-slate-100';
  const cardBg    = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const tabBar    = isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200';
  const inactiveTab = isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900';
  const iconColor = isDark ? 'text-gray-500' : 'text-gray-400';
  const textSub   = isDark ? 'text-gray-400' : 'text-gray-500';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.success) navigate('/');
    else setError(res.message);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, role: 'admin' });
      setSuccess('Admin account created! Please sign in.');
      setMode('login');
      setForm(p => ({ ...p, name: '', confirm: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4 relative overflow-hidden`}>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md flex flex-col gap-8 md:gap-0">
        
        {/* Branding - Responsive Position */}
        <div className="md:absolute md:-top-20 md:left-0 flex items-center gap-3 z-50 self-center md:self-start mb-4 md:mb-0">
          <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl overflow-hidden border border-gray-100 transition-all duration-500`}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Test</span>
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-emerald-400">Zen</span>
            </div>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none">Admin Portal</p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className={`flex ${tabBar} border rounded-xl p-1 mb-6`}>
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-primary-600 text-white shadow' : inactiveTab}`}>
            <HiArrowRightOnRectangle className="w-4 h-4" /> Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-primary-600 text-white shadow' : inactiveTab}`}>
            <HiUserPlus className="w-4 h-4" /> Register
          </button>
        </div>

        {/* Card */}
        <div className={`${cardBg} border rounded-2xl p-8 shadow-2xl`}>
          {error   && <div className="mb-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-3 text-sm">{error}</div>}
          {success && <div className="mb-4 bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-lg p-3 text-sm">✓ {success}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <h2 className="text-xl font-semibold mb-4">Welcome back</h2>
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <HiEnvelope className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                  <input type="email" className="input pl-10" placeholder="admin@example.com" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <HiLockClosed className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                  <input type="password" className="input pl-10" placeholder="••••••••" value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                {loading ? <HiArrowPath className="w-4 h-4 animate-spin" /> : <HiShieldCheck className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign In as Admin'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Create Admin Account</h2>
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="John Admin" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <HiEnvelope className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                  <input type="email" className="input pl-10" placeholder="admin@example.com" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <HiLockClosed className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                  <input type="password" className="input pl-10" placeholder="Min 6 characters" value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <HiLockClosed className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                  <input type="password" className="input pl-10" placeholder="Repeat password" value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                {loading ? <HiArrowPath className="w-4 h-4 animate-spin" /> : <HiUserPlus className="w-4 h-4" />}
                {loading ? 'Creating account...' : 'Create Admin Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
