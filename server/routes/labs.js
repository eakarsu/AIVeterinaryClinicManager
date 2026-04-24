import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { queryAI } from '../services/openrouter.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, p.name as patient_name, p.species as patient_species
      FROM lab_results l LEFT JOIN patients p ON l.patient_id = p.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, p.name as patient_name, p.species as patient_species, p.breed as patient_breed
      FROM lab_results l LEFT JOIN patients p ON l.patient_id = p.id
      WHERE l.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lab result not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, test_type, test_name, results, reference_range, status, lab_name, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO lab_results (patient_id, test_type, test_name, results, reference_range, status, lab_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [patient_id, test_type, test_name, results, reference_range, status || 'pending', lab_name, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, test_type, test_name, results, reference_range, status, lab_name, notes } = req.body;
    const result = await pool.query(
      `UPDATE lab_results SET patient_id=$1, test_type=$2, test_name=$3, results=$4, reference_range=$5, status=$6, lab_name=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [patient_id, test_type, test_name, results, reference_range, status, lab_name, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lab result not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM lab_results WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lab result not found' });
    res.json({ message: 'Lab result deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai-interpret', authenticateToken, async (req, res) => {
  try {
    const { test_name, results, reference_range, species, breed } = req.body;
    const systemPrompt = `You are an expert veterinary pathologist who interprets lab results.
    Structure your response with:
    - **Results Summary** (what the numbers mean)
    - **Abnormal Findings** (anything outside normal range)
    - **Clinical Significance** (what this means for the animal)
    - **Recommended Follow-up** (additional tests or actions)
    - **Differential Diagnoses** (possible conditions these results suggest)
    Be precise and clinically relevant.`;

    const userPrompt = `Species: ${species}\nBreed: ${breed || 'Unknown'}\nTest: ${test_name}\nResults: ${results}\nReference Range: ${reference_range || 'Standard'}\n\nPlease interpret these lab results.`;

    const aiResponse = await queryAI(systemPrompt, userPrompt);
    res.json({ interpretation: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
