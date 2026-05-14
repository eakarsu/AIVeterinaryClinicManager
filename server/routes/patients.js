import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, species, breed, age, weight, owner_name, owner_phone, owner_email, medical_history } = req.body;
    const result = await pool.query(
      `INSERT INTO patients (name, species, breed, age, weight, owner_name, owner_phone, owner_email, medical_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, species, breed, age, weight, owner_name, owner_phone, owner_email, medical_history]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, species, breed, age, weight, owner_name, owner_phone, owner_email, medical_history } = req.body;
    const result = await pool.query(
      `UPDATE patients SET name=$1, species=$2, breed=$3, age=$4, weight=$5, owner_name=$6, owner_phone=$7, owner_email=$8, medical_history=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name, species, breed, age, weight, owner_name, owner_phone, owner_email, medical_history, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patient health timeline
router.get('/:id/health-timeline', authenticateToken, async (req, res) => {
  try {
    const pid = req.params.id;
    const [appointments, vaccinations, visits] = await Promise.all([
      pool.query(`SELECT 'appointment' as type, appointment_date as date, type as subtype, notes as details, status FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC`, [pid]),
      pool.query(`SELECT 'vaccination' as type, administered_date as date, vaccine_name as subtype, vaccine_type as details, status FROM vaccinations WHERE patient_id = $1 ORDER BY administered_date DESC`, [pid]),
      pool.query(`SELECT 'visit' as type, visit_date as date, visit_type as subtype, examination_notes as details, NULL as status FROM visits WHERE patient_id = $1 ORDER BY visit_date DESC`, [pid]),
    ]);

    const timeline = [
      ...appointments.rows,
      ...vaccinations.rows,
      ...visits.rows,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const patient = await pool.query('SELECT * FROM patients WHERE id = $1', [pid]);
    res.json({ patient: patient.rows[0], timeline, total_events: timeline.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
