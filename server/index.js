import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(cors());
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
