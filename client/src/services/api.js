const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: headers(),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 503) {
      throw new Error(data.error || 'AI service unavailable (503). Configure OPENROUTER_API_KEY on the server.');
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  // Patients
  getPatients: () => request('/patients'),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (body) => request('/patients', { method: 'POST', body: JSON.stringify(body) }),
  updatePatient: (id, body) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Diagnostics
  getDiagnostics: () => request('/diagnostics'),
  getDiagnostic: (id) => request(`/diagnostics/${id}`),
  createDiagnostic: (body) => request('/diagnostics', { method: 'POST', body: JSON.stringify(body) }),
  updateDiagnostic: (id, body) => request(`/diagnostics/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDiagnostic: (id) => request(`/diagnostics/${id}`, { method: 'DELETE' }),
  aiDiagnose: (body) => request('/diagnostics/ai-diagnose', { method: 'POST', body: JSON.stringify(body) }),

  // Medications
  getMedications: (page = 1, limit = 20) => request(`/medications?page=${page}&limit=${limit}`),
  getMedication: (id) => request(`/medications/${id}`),
  createMedication: (body) => request('/medications', { method: 'POST', body: JSON.stringify(body) }),
  updateMedication: (id, body) => request(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteMedication: (id) => request(`/medications/${id}`, { method: 'DELETE' }),
  calculateDose: (body) => request('/medications/calculate-dose', { method: 'POST', body: JSON.stringify(body) }),
  drugInteractionCheck: (body) => request('/medications/drug-interaction-check', { method: 'POST', body: JSON.stringify(body) }),

  // Appointments
  getAppointments: () => request('/appointments'),
  getAppointment: (id) => request(`/appointments/${id}`),
  createAppointment: (body) => request('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  updateAppointment: (id, body) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),

  // Billing
  getBillings: () => request('/billing'),
  getBilling: (id) => request(`/billing/${id}`),
  createBilling: (body) => request('/billing', { method: 'POST', body: JSON.stringify(body) }),
  updateBilling: (id, body) => request(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBilling: (id) => request(`/billing/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventory: () => request('/inventory'),
  getInventoryItem: (id) => request(`/inventory/${id}`),
  createInventory: (body) => request('/inventory', { method: 'POST', body: JSON.stringify(body) }),
  updateInventory: (id, body) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInventory: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),

  // Labs
  getLabs: () => request('/labs'),
  getLab: (id) => request(`/labs/${id}`),
  createLab: (body) => request('/labs', { method: 'POST', body: JSON.stringify(body) }),
  updateLab: (id, body) => request(`/labs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLab: (id) => request(`/labs/${id}`, { method: 'DELETE' }),
  aiInterpretLab: (body) => request('/labs/ai-interpret', { method: 'POST', body: JSON.stringify(body) }),

  // Communications
  getCommunications: () => request('/communications'),
  getCommunication: (id) => request(`/communications/${id}`),
  createCommunication: (body) => request('/communications', { method: 'POST', body: JSON.stringify(body) }),
  updateCommunication: (id, body) => request(`/communications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCommunication: (id) => request(`/communications/${id}`, { method: 'DELETE' }),
  aiCompose: (body) => request('/communications/ai-compose', { method: 'POST', body: JSON.stringify(body) }),

  // Vaccinations
  getVaccinations: () => request('/vaccinations'),
  getVaccination: (id) => request(`/vaccinations/${id}`),
  createVaccination: (body) => request('/vaccinations', { method: 'POST', body: JSON.stringify(body) }),
  updateVaccination: (id, body) => request(`/vaccinations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVaccination: (id) => request(`/vaccinations/${id}`, { method: 'DELETE' }),
  getOverdueVaccinationsApi: () => request('/vaccinations/overdue'),
  getUpcomingVaccinations: () => request('/vaccinations/upcoming'),

  // Visits (Medical Records)
  getVisits: () => request('/visits'),
  getVisit: (id) => request(`/visits/${id}`),
  getPatientVisits: (patientId) => request(`/visits/patient/${patientId}`),
  createVisit: (body) => request('/visits', { method: 'POST', body: JSON.stringify(body) }),
  updateVisit: (id, body) => request(`/visits/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVisit: (id) => request(`/visits/${id}`, { method: 'DELETE' }),
  generateSoapNote: (id, body) => request(`/visits/${id}/ai-soap-note`, { method: 'POST', body: JSON.stringify(body || {}) }),

  // Patients extras
  getPatientHealthTimeline: (id) => request(`/patients/${id}/health-timeline`),

  // Vaccination reminders
  getDueReminders: () => request('/vaccinations/due-reminders'),
  sendVaccinationReminders: () => request('/vaccinations/send-reminders', { method: 'POST' }),

  // Reports
  getReportOverview: () => request('/reports/overview'),
  getRevenueByMonth: () => request('/reports/revenue-by-month'),
  getAppointmentsByType: () => request('/reports/appointments-by-type'),
  getSpeciesDistribution: () => request('/reports/species-distribution'),
  getLowStock: () => request('/reports/low-stock'),
  getOverdueVaccinations: () => request('/reports/overdue-vaccinations'),
  getRecentActivity: () => request('/reports/recent-activity'),

  // New AI tools
  aiDiagnosticAssistant: (body) => request('/ai/diagnostic-assistant', { method: 'POST', body: JSON.stringify(body) }),
  aiTreatmentRecommendation: (body) => request('/ai/treatment-recommendation', { method: 'POST', body: JSON.stringify(body) }),
  aiAftercare: (body) => request('/ai/aftercare', { method: 'POST', body: JSON.stringify(body) }),
  aiWellnessReminder: (body) => request('/ai/wellness-reminder', { method: 'POST', body: JSON.stringify(body) }),
  // Apply pass 5 backlog
  aiOutbreakDetection: (body) => request('/ai/outbreak-detection', { method: 'POST', body: JSON.stringify(body) }),
  aiLabResultInterpret: (body) => request('/ai/lab-result-interpret', { method: 'POST', body: JSON.stringify(body) }),
  aiPharmacyInteractionCheck: (body) => request('/ai/pharmacy-interaction-check', { method: 'POST', body: JSON.stringify(body) }),
  aiOwnerSelfServiceFAQ: (body) => request('/ai/owner-self-service-faq', { method: 'POST', body: JSON.stringify(body) }),
  aiMultiClinicSummary: (body) => request('/ai/multi-clinic-summary', { method: 'POST', body: JSON.stringify(body) }),
};
