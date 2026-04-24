import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.name as patient_name, p.species as patient_species, p.owner_name
      FROM appointments a LEFT JOIN patients p ON a.patient_id = p.id
      ORDER BY a.appointment_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.name as patient_name, p.species as patient_species, p.owner_name, p.owner_phone
      FROM appointments a LEFT JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, vet_name, appointment_date, appointment_time, type, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, vet_name, appointment_date, appointment_time, type, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [patient_id, vet_name, appointment_date, appointment_time, type, status || 'scheduled', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, vet_name, appointment_date, appointment_time, type, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE appointments SET patient_id=$1, vet_name=$2, appointment_date=$3, appointment_time=$4, type=$5, status=$6, notes=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [patient_id, vet_name, appointment_date, appointment_time, type, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
