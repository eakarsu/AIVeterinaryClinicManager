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

export default router;
