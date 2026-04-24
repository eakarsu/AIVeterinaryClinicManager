import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { queryAI } from '../services/openrouter.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, p.name as patient_name, p.species as patient_species
      FROM diagnostics d LEFT JOIN patients p ON d.patient_id = p.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, p.name as patient_name, p.species as patient_species
      FROM diagnostics d LEFT JOIN patients p ON d.patient_id = p.id
      WHERE d.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Diagnostic not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, symptoms, species, diagnosis, treatment_plan, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO diagnostics (patient_id, symptoms, species, diagnosis, treatment_plan, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patient_id, symptoms, species, diagnosis, treatment_plan, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, symptoms, species, diagnosis, treatment_plan, notes } = req.body;
    const result = await pool.query(
      `UPDATE diagnostics SET patient_id=$1, symptoms=$2, species=$3, diagnosis=$4, treatment_plan=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [patient_id, symptoms, species, diagnosis, treatment_plan, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Diagnostic not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM diagnostics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Diagnostic not found' });
    res.json({ message: 'Diagnostic deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai-diagnose', authenticateToken, async (req, res) => {
  try {
    const { symptoms, species, breed, age } = req.body;
    const systemPrompt = `You are an expert veterinary diagnostician. Provide detailed diagnostic assessments for animals.
    Always structure your response with these sections:
    - **Likely Diagnoses** (ranked by probability)
    - **Recommended Tests**
    - **Immediate Actions**
    - **Prognosis**
    Be thorough but concise. Use medical terminology with lay explanations.`;

    const userPrompt = `Species: ${species}\nBreed: ${breed || 'Unknown'}\nAge: ${age || 'Unknown'}\nSymptoms: ${symptoms}\n\nPlease provide a detailed diagnostic assessment.`;

    const aiResponse = await queryAI(systemPrompt, userPrompt);
    res.json({ diagnosis: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
