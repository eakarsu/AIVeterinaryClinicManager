import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './db.js';
import { authenticateToken } from './middleware/auth.js';

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
import careWorkflowRoutes from './routes/careWorkflow.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api', authenticateToken);
app.use('/api/care-workflow', careWorkflowRoutes);
app.use(/^\/api\/(?:gap-|integrations?(?:\/|$)|webhooks?(?:\/|$)|diagnostic-assistant|treatment-recommendation|aftercare-generator|outbreak-detection|wellness-reminders|boarding-grooming)/, (_req,res)=>res.status(503).json({error:'generated/direct-provider clinical endpoints are quarantined; use the non-diagnostic care workflow'}));
// Routes
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

async function verifySchema(){const ready=await pool.query("SELECT to_regclass('public.care_workflows') AS workflow, to_regclass('public.care_workflow_audit') AS audit");if(!ready.rows[0].workflow||!ready.rows[0].audit)throw new Error('database migrations are pending; run npm run migrate');}
verifySchema().then(() => {
// === Batch 08 Gaps disabled: CommonJS modules incompatible with ESM project ===
// app.use('/api/gap-no-diagnostic-assistance-ai', require('./routes/gapNoDiagnosticAssistanceAi'));
// app.use('/api/gap-no-treatment-recommendation-ai', require('./routes/gapNoTreatmentRecommendationAi'));
// app.use('/api/gap-no-discharge-aftercare-instruction-generator', require('./routes/gapNoDischargeAftercareInstructionGenerator'));
// app.use('/api/gap-no-imaging-analysis-x-ray-ultrasound', require('./routes/gapNoImagingAnalysisXRayUltrasound'));
// app.use('/api/gap-limited-pharmacy-system-integration-only-stub-modules', require('./routes/gapLimitedPharmacySystemIntegrationOnlyStubModules'));
// app.use('/api/gap-no-lab-result-direct-integration-idexx-antech', require('./routes/gapNoLabResultDirectIntegrationIdexxAntech'));
// app.use('/api/gap-no-pet-owner-self-service-portal', require('./routes/gapNoPetOwnerSelfServicePortal'));
// app.use('/api/gap-no-multi-clinic-hospital-group-support', require('./routes/gapNoMultiClinicHospitalGroupSupport'));
// app.use('/api/gap-no-webhooks-for-appointment-events', require('./routes/gapNoWebhooksForAppointmentEvents'));
// app.use('/api/gap-no-notifications-subsystem-despite-sms-email-being-mentioned', require('./routes/gapNoNotificationsSubsystemDespiteSmsEmailBeingMentioned'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error)=>{console.error('[startup] schema readiness failed:',error.message);process.exit(1);});
