import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { queryAI, parseAIJson } from '../services/openrouter.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const total = await pool.query('SELECT COUNT(*) FROM diagnostics');
    const result = await pool.query(`
      SELECT d.*, p.name as patient_name, p.species as patient_species
      FROM diagnostics d LEFT JOIN patients p ON d.patient_id = p.id
      ORDER BY d.created_at DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    res.json({ data: result.rows, pagination: { total: parseInt(total.rows[0].count), page, limit, totalPages: Math.ceil(parseInt(total.rows[0].count) / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, p.name as patient_name, p.species as patient_species
      FROM diagnostics d LEFT JOIN patients p ON d.patient_id = p.id
      WHERE d.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Diagnostic not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, symptoms, species, diagnosis, treatment_plan, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO diagnostics (patient_id, symptoms, species, diagnosis, treatment_plan, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patient_id, symptoms, species, diagnosis, treatment_plan, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, symptoms, species, diagnosis, treatment_plan, notes } = req.body;
    const result = await pool.query(
      `UPDATE diagnostics SET patient_id=$1, symptoms=$2, species=$3, diagnosis=$4, treatment_plan=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [patient_id, symptoms, species, diagnosis, treatment_plan, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Diagnostic not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM diagnostics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Diagnostic not found' });
    res.json({ message: 'Diagnostic deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: DB-grounded diagnose (structured JSON)
router.post('/ai-diagnose', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { symptoms, species, breed, age, patient_id } = req.body;

    // Fetch patient history from DB
    let patientContext = '';
    if (patient_id) {
      const [patientRes, appointmentsRes, medicationsRes] = await Promise.all([
        pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]),
        pool.query('SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC LIMIT 5', [patient_id]),
        pool.query(`
          SELECT m.name, m.category, m.contraindications FROM medications m
          JOIN diagnostics d ON d.patient_id = $1
          LIMIT 10
        `, [patient_id]).catch(() => ({ rows: [] }))
      ]);

      if (patientRes.rows[0]) {
        const p = patientRes.rows[0];
        patientContext = `
Patient History:
- Name: ${p.name}, Species: ${p.species}, Breed: ${p.breed || 'Unknown'}, Age: ${p.age || 'Unknown'}, Weight: ${p.weight || 'Unknown'}kg
- Medical History: ${p.medical_history || 'None recorded'}
- Allergies: ${p.allergies || 'None known'}
- Recent Appointments: ${appointmentsRes.rows.map(a => `${a.appointment_date}: ${a.type} - ${a.notes || 'No notes'}`).join('; ') || 'None'}`;
      }
    }

    const systemPrompt = `You are an expert veterinary diagnostician. Return valid JSON only with this structure:
{"likely_diagnoses":[{"condition":"string","probability":number,"reasoning":"string"}],"recommended_tests":["string"],"immediate_actions":["string"],"prognosis":"string","urgency":"routine|urgent|emergency","differential_diagnoses":["string"],"owner_instructions":["string"]}`;

    const userPrompt = `Species: ${species}\nBreed: ${breed || 'Unknown'}\nAge: ${age || 'Unknown'}\nPresenting Symptoms: ${symptoms}\n${patientContext}`;

    const aiResult = await queryAI(systemPrompt, userPrompt, true);

    // Persist
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      [req.user?.id || null, 'diagnostics/ai-diagnose', JSON.stringify({ patient_id, symptoms, species }), JSON.stringify(aiResult.parsed || aiResult.text)]
    );

    res.json({ diagnosis: aiResult.text, structured: aiResult.parsed, model: aiResult.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
