import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, quantity, unit, unit_price, supplier, reorder_level, expiry_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory (name, category, quantity, unit, unit_price, supplier, reorder_level, expiry_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, category, quantity, unit, unit_price, supplier, reorder_level || 10, expiry_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, category, quantity, unit, unit_price, supplier, reorder_level, expiry_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE inventory SET name=$1, category=$2, quantity=$3, unit=$4, unit_price=$5, supplier=$6, reorder_level=$7, expiry_date=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name, category, quantity, unit, unit_price, supplier, reorder_level, expiry_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
