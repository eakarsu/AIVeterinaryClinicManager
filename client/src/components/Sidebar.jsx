import React from 'react';
import { Stethoscope, Users, Activity, Pill, Calendar, DollarSign, Package, FlaskConical, MessageSquare, LayoutDashboard, LogOut, Syringe, ClipboardList, BarChart3 } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/visits', label: 'Medical Records', icon: ClipboardList },
  { path: '/vaccinations', label: 'Vaccinations', icon: Syringe },
  { path: '/diagnostics', label: 'AI Diagnostics', icon: Activity },
  { path: '/medications', label: 'Medications & Dosing', icon: Pill },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/billing', label: 'Billing & Invoices', icon: DollarSign },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/labs', label: 'Lab Results', icon: FlaskConical },
  { path: '/communications', label: 'Client Communication', icon: MessageSquare },
  { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
];

export default function Sidebar({ user, onLogout, currentPath, onNavigate }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>
          <Stethoscope size={24} />
          VetClinic AI
        </h2>
        {user && (
          <div className="user-info">
            {user.name} ({user.role})
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
            onClick={() => onNavigate(item.path)}
          >
            <item.icon size={20} />
            {item.label}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item" onClick={onLogout}>
          <LogOut size={20} />
          Sign Out
        </div>
      </div>
    </div>
  );
}
