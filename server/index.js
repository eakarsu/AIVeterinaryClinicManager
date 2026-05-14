import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import diagnosticRoutes from './routes/diagnostics.js';
import medicationRoutes from './routes/medications.js';
import appointmentRoutes from './routes/appointments.js';
import billingRoutes from './routes/billing.js';
import inventoryRoutes from './routes/inventory.js';
import labRoutes from './routes/labs.js';
import communicationRoutes from './routes/communications.js';
import vaccinationRoutes from './routes/vaccinations.js';
import visitRoutes from './routes/visits.js';
import reportRoutes from './routes/reports.js';
import aiRoutes from './routes/ai.js';
import _b8___routes_diagnosticAssistant_js from './routes/diagnosticAssistant.js';
import _b8___routes_treatmentRecommendation_js from './routes/treatmentRecommendation.js';
import _b8___routes_aftercareGenerator_js from './routes/aftercareGenerator.js';
import _b8___routes_outbreakDetection_js from './routes/outbreakDetection.js';
import _b8___routes_wellnessReminders_js from './routes/wellnessReminders.js';
import _b8___routes_boardingGrooming_js from './routes/boardingGrooming.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize ai_results table
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        input_data JSONB,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('ai_results table ready');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

initDb().then(() => {
  app.use('/api/diagnostic-assistant', _b8___routes_diagnosticAssistant_js); app.use('/api/treatment-recommendation', _b8___routes_treatmentRecommendation_js); app.use('/api/aftercare-generator', _b8___routes_aftercareGenerator_js); app.use('/api/outbreak-detection', _b8___routes_outbreakDetection_js); app.use('/api/wellness-reminders', _b8___routes_wellnessReminders_js); app.use('/api/boarding-grooming', _b8___routes_boardingGrooming_js);

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-diagnostic-assistance-ai', require('./routes/gapNoDiagnosticAssistanceAi'));
app.use('/api/gap-no-treatment-recommendation-ai', require('./routes/gapNoTreatmentRecommendationAi'));
app.use('/api/gap-no-discharge-aftercare-instruction-generator', require('./routes/gapNoDischargeAftercareInstructionGenerator'));
app.use('/api/gap-no-imaging-analysis-x-ray-ultrasound', require('./routes/gapNoImagingAnalysisXRayUltrasound'));
app.use('/api/gap-limited-pharmacy-system-integration-only-stub-modules', require('./routes/gapLimitedPharmacySystemIntegrationOnlyStubModules'));
app.use('/api/gap-no-lab-result-direct-integration-idexx-antech', require('./routes/gapNoLabResultDirectIntegrationIdexxAntech'));
app.use('/api/gap-no-pet-owner-self-service-portal', require('./routes/gapNoPetOwnerSelfServicePortal'));
app.use('/api/gap-no-multi-clinic-hospital-group-support', require('./routes/gapNoMultiClinicHospitalGroupSupport'));
app.use('/api/gap-no-webhooks-for-appointment-events', require('./routes/gapNoWebhooksForAppointmentEvents'));
app.use('/api/gap-no-notifications-subsystem-despite-sms-email-being-mentioned', require('./routes/gapNoNotificationsSubsystemDespiteSmsEmailBeingMentioned'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
