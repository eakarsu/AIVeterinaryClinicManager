import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import Diagnostics from './pages/Diagnostics.jsx';
import Medications from './pages/Medications.jsx';
import Appointments from './pages/Appointments.jsx';
import Billing from './pages/Billing.jsx';
import Inventory from './pages/Inventory.jsx';
import Labs from './pages/Labs.jsx';
import Communications from './pages/Communications.jsx';
import Vaccinations from './pages/Vaccinations.jsx';
import Visits from './pages/Visits.jsx';
import Reports from './pages/Reports.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={handleLogout} currentPath={location.pathname} onNavigate={(path) => navigate(path)} />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard onNavigate={(path) => navigate(path)} />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/vaccinations" element={<Vaccinations />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}
