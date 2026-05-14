import React from 'react';
import { Stethoscope, Users, Activity, Pill, Calendar, DollarSign, Package, FlaskConical, MessageSquare, LayoutDashboard, LogOut, Syringe, ClipboardList, BarChart3, Sparkles, HeartPulse, FileText, Bell } from 'lucide-react';

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
  { path: '/ai/diagnostic-assistant', label: 'AI Diagnostic Assistant', icon: Sparkles },
  { path: '/ai/treatment-recommendation', label: 'AI Treatment Recs', icon: HeartPulse },
  { path: '/ai/aftercare', label: 'AI Aftercare', icon: FileText },
  { path: '/ai/wellness-reminder', label: 'AI Wellness Reminders', icon: Bell },

    // // === Batch 08 Gaps & Frontend Mounts ===
    { path: '/cf-diagnostic-assistant-providing-differential-diagnoses-from-symptoms-labs', label: 'Diagnostic assistant providing differential diagno...' },
    { path: '/cf-treatment-recommendation-suggesting-evidence-based-protocols', label: 'Treatment recommendation suggesting evidence-based...' },
    { path: '/cf-aftercare-generator-producing-discharge-instructions-and-follow-up-plans', label: 'Aftercare generator producing discharge instructio...' },
    { path: '/cf-outbreak-detection-flagging-potential-disease-outbreaks-across-patient', label: 'Outbreak detection flagging potential disease outb...' },
    { path: '/cf-wellness-reminder-automation-by-species-age', label: 'Wellness reminder automation by species/age' },
    { path: '/cf-boarding-grooming-module-add-on-for-multi-service-clinics', label: 'Boarding/grooming module add-on for multi-service...' },
    { path: '/gap-no-diagnostic-assistance-ai', label: 'No diagnostic assistance AI' },
    { path: '/gap-no-treatment-recommendation-ai', label: 'No treatment recommendation AI' },
    { path: '/gap-no-discharge-aftercare-instruction-generator', label: 'No discharge/aftercare-instruction generator' },
    { path: '/gap-no-imaging-analysis-x-ray-ultrasound', label: 'No imaging analysis (x-ray, ultrasound)' },
    { path: '/gap-limited-pharmacy-system-integration-only-stub-modules', label: 'Limited pharmacy system integration (only stub mod...' },
    { path: '/gap-no-lab-result-direct-integration-idexx-antech', label: 'No lab result direct integration (IDEXX, Antech)' },
    { path: '/gap-no-pet-owner-self-service-portal', label: 'No pet-owner self-service portal' },
    { path: '/gap-no-multi-clinic-hospital-group-support', label: 'No multi-clinic / hospital group support' },
    { path: '/gap-no-webhooks-for-appointment-events', label: 'No webhooks for appointment events' },
    { path: '/gap-no-notifications-subsystem-despite-sms-email-being-mentioned', label: 'No notifications subsystem (despite SMS/email bein...' },
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
