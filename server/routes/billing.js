import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, p.name as patient_name, p.owner_name
      FROM billing b LEFT JOIN patients p ON b.patient_id = p.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, p.name as patient_name, p.owner_name, p.owner_email, p.owner_phone
      FROM billing b LEFT JOIN patients p ON b.patient_id = p.id
      WHERE b.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, services, total_amount, tax, discount, payment_status, payment_method, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO billing (patient_id, services, total_amount, tax, discount, payment_status, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [patient_id, JSON.stringify(services), total_amount, tax || 0, discount || 0, payment_status || 'pending', payment_method, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, services, total_amount, tax, discount, payment_status, payment_method, notes } = req.body;
    const result = await pool.query(
      `UPDATE billing SET patient_id=$1, services=$2, total_amount=$3, tax=$4, discount=$5, payment_status=$6, payment_method=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [patient_id, JSON.stringify(services), total_amount, tax, discount, payment_status, payment_method, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM billing WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
