import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { queryAI } from '../services/openrouter.js';
import nodemailer from 'nodemailer';

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

// Due reminders engine
router.get('/due-reminders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name, p.owner_email, p.owner_phone
      FROM vaccinations v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      AND v.status != 'completed'
      ORDER BY v.next_due_date ASC
    `);

    const grouped = {};
    for (const row of result.rows) {
      const key = row.patient_id;
      if (!grouped[key]) grouped[key] = { patient_name: row.patient_name, species: row.patient_species, owner_name: row.owner_name, owner_email: row.owner_email, owner_phone: row.owner_phone, vaccinations: [] };
      const daysUntil = Math.ceil((new Date(row.next_due_date) - new Date()) / (1000 * 60 * 60 * 24));
      grouped[key].vaccinations.push({ id: row.id, vaccine_name: row.vaccine_name, vaccine_type: row.vaccine_type, next_due_date: row.next_due_date, days_until_due: daysUntil });
    }

    res.json({ reminders: Object.values(grouped), total_due: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Send reminders via email
router.post('/send-reminders', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name, p.owner_email
      FROM vaccinations v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      AND v.status != 'completed' AND p.owner_email IS NOT NULL
      ORDER BY v.next_due_date ASC
    `);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sent = 0;
    const errors = [];
    for (const row of result.rows) {
      try {
        const daysUntil = Math.ceil((new Date(row.next_due_date) - new Date()) / (1000 * 60 * 60 * 24));
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: row.owner_email,
          subject: `Vaccination Reminder: ${row.patient_name}'s ${row.vaccine_name} is due in ${daysUntil} days`,
          html: `
            <h2>Vaccination Reminder</h2>
            <p>Dear ${row.owner_name},</p>
            <p>This is a friendly reminder that <strong>${row.patient_name}</strong> (${row.patient_species}) is due for their <strong>${row.vaccine_name}</strong> vaccination on <strong>${new Date(row.next_due_date).toLocaleDateString()}</strong> (in ${daysUntil} days).</p>
            <p>Please contact us to schedule an appointment.</p>
            <p>Thank you for keeping your pet healthy!</p>
          `
        };
        await transporter.sendMail(mailOptions);
        await pool.query('UPDATE vaccinations SET status=$1 WHERE id=$2', ['reminder_sent', row.id]);
        sent++;
      } catch (emailErr) {
        errors.push({ vaccination_id: row.id, error: emailErr.message });
      }
    }

    res.json({ sent, errors, total_due: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
