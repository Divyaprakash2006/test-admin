import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestBuilder from './pages/TestBuilder';
import Students from './pages/Students';
import Results from './pages/Results';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Toaster position="bottom-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tests" element={<Tests />} />
                <Route path="/tests/new" element={<TestBuilder />} />
                <Route path="/tests/:id/edit" element={<TestBuilder />} />
                <Route path="/students" element={<Students />} />
                <Route path="/results" element={<Results />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
