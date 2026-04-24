import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

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

export default router;
