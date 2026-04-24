import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { queryAI } from '../services/openrouter.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name as patient_name, p.owner_name
      FROM communications c LEFT JOIN patients p ON c.patient_id = p.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name as patient_name, p.owner_name, p.owner_email, p.owner_phone
      FROM communications c LEFT JOIN patients p ON c.patient_id = p.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, type, subject, message, recipient_email, recipient_phone, status } = req.body;
    const result = await pool.query(
      `INSERT INTO communications (patient_id, type, subject, message, recipient_email, recipient_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [patient_id, type, subject, message, recipient_email, recipient_phone, status || 'sent']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, type, subject, message, recipient_email, recipient_phone, status } = req.body;
    const result = await pool.query(
      `UPDATE communications SET patient_id=$1, type=$2, subject=$3, message=$4, recipient_email=$5, recipient_phone=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [patient_id, type, subject, message, recipient_email, recipient_phone, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM communications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json({ message: 'Communication deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai-compose', authenticateToken, async (req, res) => {
  try {
    const { type, context, owner_name, patient_name, tone } = req.body;
    const systemPrompt = `You are a professional veterinary clinic communication specialist.
    Write clear, compassionate, and professional messages for pet owners.
    Adapt your tone based on the context (appointment reminder, follow-up, test results, etc.).
    Always be empathetic when discussing health concerns.
    Structure the message appropriately for the communication type (email, SMS, letter).`;

    const userPrompt = `Type: ${type}\nOwner: ${owner_name}\nPet: ${patient_name}\nTone: ${tone || 'Professional and warm'}\nContext: ${context}\n\nPlease compose an appropriate message.`;

    const aiResponse = await queryAI(systemPrompt, userPrompt);
    res.json({ message: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
