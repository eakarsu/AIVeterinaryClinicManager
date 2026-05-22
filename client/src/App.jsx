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
import AIDiagnosticAssistant from './pages/AIDiagnosticAssistant.jsx';
import AITreatmentRecommendation from './pages/AITreatmentRecommendation.jsx';
import AIAftercare from './pages/AIAftercare.jsx';
import AIWellnessReminder from './pages/AIWellnessReminder.jsx';
import AIOutbreakDetection from './pages/AIOutbreakDetection.jsx';
import AILabResultInterpret from './pages/AILabResultInterpret.jsx';
import AIPharmacyInteractionCheck from './pages/AIPharmacyInteractionCheck.jsx';
import AIOwnerSelfServiceFAQ from './pages/AIOwnerSelfServiceFAQ.jsx';
import AIMultiClinicSummary from './pages/AIMultiClinicSummary.jsx';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// === Batch 08 Gaps & Frontend Mounts ===
import CfDiagnosticAssistantProvidingDifferentialDiagnosesFromSymptoms from './pages/CfDiagnosticAssistantProvidingDifferentialDiagnosesFromSymptoms'
import CfTreatmentRecommendationSuggestingEvidenceBasedProtocols from './pages/CfTreatmentRecommendationSuggestingEvidenceBasedProtocols'
import CfAftercareGeneratorProducingDischargeInstructionsAndFollow from './pages/CfAftercareGeneratorProducingDischargeInstructionsAndFollow'
import CfOutbreakDetectionFlaggingPotentialDiseaseOutbreaksAcross from './pages/CfOutbreakDetectionFlaggingPotentialDiseaseOutbreaksAcross'
import CfWellnessReminderAutomationBySpeciesAge from './pages/CfWellnessReminderAutomationBySpeciesAge'
import CfBoardingGroomingModuleAddOnForMulti from './pages/CfBoardingGroomingModuleAddOnForMulti'
import GapNoDiagnosticAssistanceAi from './pages/GapNoDiagnosticAssistanceAi'
import GapNoTreatmentRecommendationAi from './pages/GapNoTreatmentRecommendationAi'
import GapNoDischargeAftercareInstructionGenerator from './pages/GapNoDischargeAftercareInstructionGenerator'
import GapNoImagingAnalysisXRayUltrasound from './pages/GapNoImagingAnalysisXRayUltrasound'
import GapLimitedPharmacySystemIntegrationOnlyStubModules from './pages/GapLimitedPharmacySystemIntegrationOnlyStubModules'
import GapNoLabResultDirectIntegrationIdexxAntech from './pages/GapNoLabResultDirectIntegrationIdexxAntech'
import GapNoPetOwnerSelfServicePortal from './pages/GapNoPetOwnerSelfServicePortal'
import GapNoMultiClinicHospitalGroupSupport from './pages/GapNoMultiClinicHospitalGroupSupport'
import GapNoWebhooksForAppointmentEvents from './pages/GapNoWebhooksForAppointmentEvents'
import GapNoNotificationsSubsystemDespiteSmsEmailBeing from './pages/GapNoNotificationsSubsystemDespiteSmsEmailBeing'

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
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
          <Route path="/ai/diagnostic-assistant" element={<AIDiagnosticAssistant />} />
          <Route path="/ai/treatment-recommendation" element={<AITreatmentRecommendation />} />
          <Route path="/ai/aftercare" element={<AIAftercare />} />
          <Route path="/ai/wellness-reminder" element={<AIWellnessReminder />} />
          <Route path="/ai/outbreak-detection" element={<AIOutbreakDetection />} />
          <Route path="/ai/lab-result-interpret" element={<AILabResultInterpret />} />
          <Route path="/ai/pharmacy-interaction-check" element={<AIPharmacyInteractionCheck />} />
          <Route path="/ai/owner-self-service-faq" element={<AIOwnerSelfServiceFAQ />} />
          <Route path="/ai/multi-clinic-summary" element={<AIMultiClinicSummary />} />
          {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-diagnostic-assistant-providing-differential-diagnoses-from-symptoms-labs" element={<ProtectedRoute><CfDiagnosticAssistantProvidingDifferentialDiagnosesFromSymptoms /></ProtectedRoute>} />
      <Route path="/cf-treatment-recommendation-suggesting-evidence-based-protocols" element={<ProtectedRoute><CfTreatmentRecommendationSuggestingEvidenceBasedProtocols /></ProtectedRoute>} />
      <Route path="/cf-aftercare-generator-producing-discharge-instructions-and-follow-up-plans" element={<ProtectedRoute><CfAftercareGeneratorProducingDischargeInstructionsAndFollow /></ProtectedRoute>} />
      <Route path="/cf-outbreak-detection-flagging-potential-disease-outbreaks-across-patient" element={<ProtectedRoute><CfOutbreakDetectionFlaggingPotentialDiseaseOutbreaksAcross /></ProtectedRoute>} />
      <Route path="/cf-wellness-reminder-automation-by-species-age" element={<ProtectedRoute><CfWellnessReminderAutomationBySpeciesAge /></ProtectedRoute>} />
      <Route path="/cf-boarding-grooming-module-add-on-for-multi-service-clinics" element={<ProtectedRoute><CfBoardingGroomingModuleAddOnForMulti /></ProtectedRoute>} />
      <Route path="/gap-no-diagnostic-assistance-ai" element={<ProtectedRoute><GapNoDiagnosticAssistanceAi /></ProtectedRoute>} />
      <Route path="/gap-no-treatment-recommendation-ai" element={<ProtectedRoute><GapNoTreatmentRecommendationAi /></ProtectedRoute>} />
      <Route path="/gap-no-discharge-aftercare-instruction-generator" element={<ProtectedRoute><GapNoDischargeAftercareInstructionGenerator /></ProtectedRoute>} />
      <Route path="/gap-no-imaging-analysis-x-ray-ultrasound" element={<ProtectedRoute><GapNoImagingAnalysisXRayUltrasound /></ProtectedRoute>} />
      <Route path="/gap-limited-pharmacy-system-integration-only-stub-modules" element={<ProtectedRoute><GapLimitedPharmacySystemIntegrationOnlyStubModules /></ProtectedRoute>} />
      <Route path="/gap-no-lab-result-direct-integration-idexx-antech" element={<ProtectedRoute><GapNoLabResultDirectIntegrationIdexxAntech /></ProtectedRoute>} />
      <Route path="/gap-no-pet-owner-self-service-portal" element={<ProtectedRoute><GapNoPetOwnerSelfServicePortal /></ProtectedRoute>} />
      <Route path="/gap-no-multi-clinic-hospital-group-support" element={<ProtectedRoute><GapNoMultiClinicHospitalGroupSupport /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-for-appointment-events" element={<ProtectedRoute><GapNoWebhooksForAppointmentEvents /></ProtectedRoute>} />
      <Route path="/gap-no-notifications-subsystem-despite-sms-email-being-mentioned" element={<ProtectedRoute><GapNoNotificationsSubsystemDespiteSmsEmailBeing /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}
