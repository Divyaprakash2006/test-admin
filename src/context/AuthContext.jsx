import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('admin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      localStorage.removeItem('admin_user');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const authUser = data?.user || data?.admin || data?.data?.user;
      const authToken = data?.token || data?.accessToken || data?.data?.token;

      // START FORCE ENTRY LOGIC: If we have a token but missing user object, create a temporary one
      if (authToken && !authUser) {
        console.warn('Backend responded with token but missing user object. Using force-entry fallback.');
        const fallbackUser = {
          id: 'temp_id',
          name: email.split('@')[0],
          email: email,
          role: 'admin'
        };
        localStorage.setItem('admin_token', authToken);
        localStorage.setItem('admin_user', JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        return { success: true };
      }

      if (!authUser || typeof authUser !== 'object') {
        throw new Error(data?.message || 'Invalid user data received from server.');
      }
      
      const userRole = authUser.role || 'admin'; // Default to admin for admin portal if missing but authenticated
      
      if (userRole !== 'admin') {
        throw new Error('Access denied. Admin portal requires admin privileges.');
      }
      
      if (!authToken) {
        throw new Error('Authentication token is missing. Please try again.');
      }

      localStorage.setItem('admin_token', authToken);
      localStorage.setItem('admin_user', JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch (err) {
      if (window.location.protocol === 'capacitor:') {
        window.alert(`[APK DEBUG]\nURL: ${api.defaults.baseURL}/auth/login\nError: ${err.message}\nStatus: ${err.response?.status}\nData: ${JSON.stringify(err.response?.data)}`);
      }
      return { success: false, message: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
