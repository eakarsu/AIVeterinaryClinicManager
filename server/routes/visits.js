import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { queryAI } from '../services/openrouter.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name
      FROM visits v LEFT JOIN patients p ON v.patient_id = p.id
      ORDER BY v.visit_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species
      FROM visits v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.patient_id = $1
      ORDER BY v.visit_date DESC
    `, [req.params.patientId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name, p.owner_phone
      FROM visits v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, visit_date, visit_type, reason, vet_name, weight_at_visit, temperature, heart_rate, respiratory_rate, examination_notes, treatment_provided, prescriptions, follow_up_date, follow_up_notes } = req.body;
    const result = await pool.query(
      `INSERT INTO visits (patient_id, visit_date, visit_type, reason, vet_name, weight_at_visit, temperature, heart_rate, respiratory_rate, examination_notes, treatment_provided, prescriptions, follow_up_date, follow_up_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [patient_id, visit_date, visit_type, reason, vet_name, weight_at_visit, temperature, heart_rate, respiratory_rate, examination_notes, treatment_provided, prescriptions, follow_up_date, follow_up_notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, visit_date, visit_type, reason, vet_name, weight_at_visit, temperature, heart_rate, respiratory_rate, examination_notes, treatment_provided, prescriptions, follow_up_date, follow_up_notes } = req.body;
    const result = await pool.query(
      `UPDATE visits SET patient_id=$1, visit_date=$2, visit_type=$3, reason=$4, vet_name=$5, weight_at_visit=$6, temperature=$7, heart_rate=$8, respiratory_rate=$9, examination_notes=$10, treatment_provided=$11, prescriptions=$12, follow_up_date=$13, follow_up_notes=$14, updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [patient_id, visit_date, visit_type, reason, vet_name, weight_at_visit, temperature, heart_rate, respiratory_rate, examination_notes, treatment_provided, prescriptions, follow_up_date, follow_up_notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM visits WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json({ message: 'Visit deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Generate SOAP note from visit (NEW)
router.post('/:id/ai-soap-note', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const visitResult = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species, p.breed, p.age, p.weight
      FROM visits v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = $1
    `, [req.params.id]);
    if (visitResult.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });

    const visit = visitResult.rows[0];
    const notes = [
      visit.examination_notes, visit.treatment_provided, visit.prescriptions, visit.follow_up_notes, req.body.additional_notes
    ].filter(Boolean).join('\n');

    const systemPrompt = `You are an expert veterinary SOAP note writer. Generate a structured SOAP note. Return valid JSON only:
{"subjective":{"chief_complaint":"string","history":"string","owner_observations":"string"},"objective":{"weight":number,"temperature":number,"heart_rate":number,"respiratory_rate":number,"physical_exam_findings":"string"},"assessment":{"primary_diagnosis":"string","differential_diagnoses":["string"],"severity":"mild|moderate|severe"},"plan":{"treatments":["string"],"medications":["string"],"diagnostics_ordered":["string"],"client_education":["string"],"follow_up":"string"},"billing_codes":["string"]}`;

    const userPrompt = `Patient: ${visit.patient_name} (${visit.species} ${visit.breed || ''}, ${visit.age || 'unknown'} yr, ${visit.weight_at_visit || visit.weight || 'unknown'} kg)
Vet: ${visit.vet_name}, Visit Type: ${visit.visit_type}, Date: ${visit.visit_date}
Vitals: Temp ${visit.temperature || 'N/A'}, HR ${visit.heart_rate || 'N/A'}, RR ${visit.respiratory_rate || 'N/A'}
Notes: ${notes || 'No notes provided'}`;

    const aiResult = await queryAI(systemPrompt, userPrompt, true);

    // Try to update visit with soap_note if column exists
    try {
      await pool.query('UPDATE visits SET soap_note=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(aiResult.parsed), req.params.id]);
    } catch (_) {}

    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      [req.user?.id || null, 'visits/ai-soap-note', JSON.stringify({ visit_id: req.params.id }), JSON.stringify(aiResult.parsed || {})]
    );

    res.json({ soap_note: aiResult.text, structured: aiResult.parsed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
