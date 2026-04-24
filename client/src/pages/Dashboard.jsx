import React, { useState, useEffect } from 'react';
import { Users, Activity, Pill, Calendar, DollarSign, Package, FlaskConical, MessageSquare, ClipboardList, Syringe, BarChart3 } from 'lucide-react';
import { api } from '../services/api.js';

const cards = [
  { key: 'patients', label: 'Patients', desc: 'Manage patient records, species, owners', icon: Users, color: '#3b82f6', bg: '#dbeafe', path: '/patients' },
  { key: 'visits', label: 'Medical Records', desc: 'Visit history with vitals and clinical notes', icon: ClipboardList, color: '#0d9488', bg: '#ccfbf1', path: '/visits' },
  { key: 'vaccinations', label: 'Vaccinations', desc: 'Track vaccines, due dates, and overdue alerts', icon: Syringe, color: '#e11d48', bg: '#ffe4e6', path: '/vaccinations' },
  { key: 'diagnostics', label: 'AI Diagnostics', desc: 'AI-powered diagnostic support by species', icon: Activity, color: '#7c3aed', bg: '#ede9fe', path: '/diagnostics' },
  { key: 'medications', label: 'Medications & Dosing', desc: 'AI dosing calculator, medication database', icon: Pill, color: '#059669', bg: '#d1fae5', path: '/medications' },
  { key: 'appointments', label: 'Appointments', desc: 'Schedule and manage clinic appointments', icon: Calendar, color: '#d97706', bg: '#fef3c7', path: '/appointments' },
  { key: 'billing', label: 'Billing & Invoices', desc: 'Invoice management and payment tracking', icon: DollarSign, color: '#dc2626', bg: '#fee2e2', path: '/billing' },
  { key: 'inventory', label: 'Inventory', desc: 'Track supplies, medications, reorder levels', icon: Package, color: '#0891b2', bg: '#cffafe', path: '/inventory' },
  { key: 'labs', label: 'Lab Results', desc: 'Lab integration with AI interpretation', icon: FlaskConical, color: '#be185d', bg: '#fce7f3', path: '/labs' },
  { key: 'communications', label: 'Client Communication', desc: 'AI-composed messages for pet owners', icon: MessageSquare, color: '#4f46e5', bg: '#e0e7ff', path: '/communications' },
  { key: 'reports', label: 'Reports & Analytics', desc: 'Revenue, stats, alerts, and insights', icon: BarChart3, color: '#6366f1', bg: '#e0e7ff', path: '/reports' },
];

export default function Dashboard({ onNavigate }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [patients, diagnostics, medications, appointments, billing, inventory, labs, communications, vaccinations, visits] = await Promise.all([
          api.getPatients(), api.getDiagnostics(), api.getMedications(), api.getAppointments(),
          api.getBillings(), api.getInventory(), api.getLabs(), api.getCommunications(),
          api.getVaccinations(), api.getVisits(),
        ]);
        setCounts({
          patients: patients.length, diagnostics: diagnostics.length, medications: medications.length,
          appointments: appointments.length, billing: billing.length, inventory: inventory.length,
          labs: labs.length, communications: communications.length,
          vaccinations: vaccinations.length, visits: visits.length, reports: '—',
        });
      } catch (err) {
        console.error('Failed to load counts', err);
      }
    };
    loadCounts();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="dashboard-cards">
        {cards.map((card) => (
          <div key={card.key} className="dashboard-card" onClick={() => onNavigate(card.path)}>
            <div className="card-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={28} />
            </div>
            <span className="card-count">{counts[card.key] ?? '...'}</span>
            <h3>{card.label}</h3>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
