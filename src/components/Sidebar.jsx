import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  HiSquares2X2,
  HiBookOpen,
  HiUserGroup,
  HiPresentationChartLine,
  HiArrowLeftOnRectangle,
  HiBars3,
  HiXMark,
  HiSun,
  HiMoon,
  HiCog6Tooth,
} from 'react-icons/hi2';
import NotificationBell from './NotificationBell';


const navItems = [
  { to: '/', icon: HiSquares2X2, label: 'Dashboard' },
  { to: '/tests', icon: HiBookOpen, label: 'Tests' },
  { to: '/students', icon: HiUserGroup, label: 'Students' },
  { to: '/results', icon: HiPresentationChartLine, label: 'Results' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const isDark = theme === 'dark';
  const textMuted = isDark ? 'text-gray-300' : 'text-gray-700';
  const hoverBg = isDark ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-gray-100 hover:text-gray-900';
  const logoutClasses = isDark ? 'text-red-300 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50';

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
      isActive
        ? 'bg-primary-600/15 text-primary-500 border-primary-600/30'
        : `${hoverBg} ${textMuted} border-transparent`
    }`;

  return (
    <header className={`top-nav border-b sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md ${isDark ? 'text-gray-100' : 'text-gray-900'} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-[var(--header-height)]">
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-500 overflow-hidden ${isDark ? 'bg-white/90 shadow-indigo-500/20 shadow-lg' : 'bg-white shadow-sm border border-gray-100'}`}>
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <div className="flex flex-col leading-tight justify-center">
              <div className="flex items-baseline gap-0.5">
                <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Test</span>
                <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">Zen</span>
              </div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em]">Admin</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 ml-auto">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>

          <div className="hidden md:flex items-center gap-3" ref={settingsRef}>
            <button
              onClick={toggle}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-colors ${
                isDark ? 'border-gray-800 hover:bg-gray-800 text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setSettingsOpen(p => !p)}
              className={`h-10 inline-flex items-center gap-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                isDark ? 'border-gray-800 hover:bg-gray-800 text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              aria-haspopup="menu"
              aria-expanded={settingsOpen}
            >
              <HiCog6Tooth className="w-5 h-5" />
              <span className="hidden lg:inline">Settings</span>
            </button>

            {settingsOpen && (
              <div
                className={`absolute right-4 top-16 w-64 rounded-xl shadow-lg border ${
                  isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                }`}
                role="menu"
              >
                <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
                  <p className="text-xs text-muted mb-1">Signed in</p>
                  <p className="text-sm font-semibold truncate">{user?.name || 'Admin'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-left rounded-b-xl transition-colors ${logoutClasses}`}
                  role="menuitem"
                >
                  <HiArrowLeftOnRectangle className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(prev => !prev)}
            className={`md:hidden ml-auto h-10 w-10 flex items-center justify-center rounded-lg border ${
              isDark ? 'border-gray-800 hover:bg-gray-800 text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
            }`}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <HiXMark className="w-5 h-5" /> : <HiBars3 className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className={`md:hidden border rounded-xl mb-4 shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col gap-1 p-2">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={linkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </NavLink>
              ))}

              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-sm font-medium">Theme</span>
                <button
                  onClick={() => { toggle(); setMobileOpen(false); }}
                  className="p-2 rounded-lg"
                  aria-label="Toggle theme"
                >
                  {isDark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${logoutClasses}`}
              >
                <HiArrowLeftOnRectangle className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
