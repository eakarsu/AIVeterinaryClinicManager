import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name
      FROM vaccinations v LEFT JOIN patients p ON v.patient_id = p.id
      ORDER BY v.next_due_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/overdue', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name, p.owner_phone, p.owner_email
      FROM vaccinations v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.next_due_date < CURRENT_DATE AND v.status != 'completed'
      ORDER BY v.next_due_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name, p.owner_phone
      FROM vaccinations v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      AND v.status != 'completed'
      ORDER BY v.next_due_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name, p.owner_phone, p.owner_email
      FROM vaccinations v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vaccination not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, vaccine_name, vaccine_type, batch_number, administered_date, next_due_date, administered_by, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO vaccinations (patient_id, vaccine_name, vaccine_type, batch_number, administered_date, next_due_date, administered_by, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [patient_id, vaccine_name, vaccine_type, batch_number, administered_date, next_due_date, administered_by, status || 'scheduled', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, vaccine_name, vaccine_type, batch_number, administered_date, next_due_date, administered_by, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE vaccinations SET patient_id=$1, vaccine_name=$2, vaccine_type=$3, batch_number=$4, administered_date=$5, next_due_date=$6, administered_by=$7, status=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [patient_id, vaccine_name, vaccine_type, batch_number, administered_date, next_due_date, administered_by, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vaccination not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vaccinations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vaccination not found' });
    res.json({ message: 'Vaccination deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
