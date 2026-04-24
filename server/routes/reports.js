import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Overview stats
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const [patients, appointments, revenue, inventory] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM patients'),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'scheduled' AND appointment_date >= CURRENT_DATE) as upcoming,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE AND status = 'scheduled') as today
        FROM appointments
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END), 0) as outstanding,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as collected,
          COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_invoices
        FROM billing
      `),
      pool.query(`
        SELECT COUNT(*) as low_stock FROM inventory WHERE quantity <= reorder_level
      `),
    ]);

    res.json({
      patients: { total: parseInt(patients.rows[0].total) },
      appointments: appointments.rows[0],
      revenue: revenue.rows[0],
      inventory: { low_stock: parseInt(inventory.rows[0].low_stock) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revenue by month (last 12 months)
router.get('/revenue-by-month', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as invoice_count
      FROM billing
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Appointments by type
router.get('/appointments-by-type', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM appointments
      GROUP BY type
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Species distribution
router.get('/species-distribution', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT species, COUNT(*) as count
      FROM patients
      GROUP BY species
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Low stock items
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM inventory
      WHERE quantity <= reorder_level
      ORDER BY (quantity::float / NULLIF(reorder_level, 0)::float) ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Overdue vaccinations
router.get('/overdue-vaccinations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.name as patient_name, p.species as patient_species, p.owner_name, p.owner_phone
      FROM vaccinations v LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.next_due_date < CURRENT_DATE AND v.status != 'completed'
      ORDER BY v.next_due_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recent activity
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      (SELECT 'appointment' as type, a.id, p.name as patient_name, a.type as detail, a.created_at
       FROM appointments a LEFT JOIN patients p ON a.patient_id = p.id
       ORDER BY a.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'diagnostic' as type, d.id, p.name as patient_name, d.diagnosis as detail, d.created_at
       FROM diagnostics d LEFT JOIN patients p ON d.patient_id = p.id
       ORDER BY d.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'billing' as type, b.id, p.name as patient_name, b.payment_status as detail, b.created_at
       FROM billing b LEFT JOIN patients p ON b.patient_id = p.id
       ORDER BY b.created_at DESC LIMIT 5)
      ORDER BY created_at DESC
      LIMIT 15
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
