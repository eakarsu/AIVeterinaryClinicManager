import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { queryAI } from '../services/openrouter.js';
import nodemailer from 'nodemailer';

const router = Router();

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

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
    let actualStatus = status || 'pending';
    let sendError = null;

    // Actually send email if recipient_email provided and type is email
    if (recipient_email && (type === 'email' || type === 'Email') && process.env.SMTP_USER) {
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipient_email,
          subject: subject || 'Veterinary Clinic Communication',
          text: message,
          html: `<div style="font-family: Arial, sans-serif;">${message.replace(/\n/g, '<br>')}</div>`
        });
        actualStatus = 'sent';
      } catch (emailErr) {
        sendError = emailErr.message;
        actualStatus = 'failed';
      }
    }

    const result = await pool.query(
      `INSERT INTO communications (patient_id, type, subject, message, recipient_email, recipient_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [patient_id, type, subject, message, recipient_email, recipient_phone, actualStatus]
    );
    res.status(201).json({ ...result.rows[0], send_error: sendError });
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

router.post('/ai-compose', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { type, context, owner_name, patient_name, tone } = req.body;
    const systemPrompt = `You are a professional veterinary clinic communication specialist. Write clear, compassionate, and professional messages for pet owners.`;
    const userPrompt = `Type: ${type}\nOwner: ${owner_name}\nPet: ${patient_name}\nTone: ${tone || 'Professional and warm'}\nContext: ${context}\n\nCompose an appropriate message.`;
    const aiResult = await queryAI(systemPrompt, userPrompt);
    res.json({ message: aiResult.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
