import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { queryAI } from '../services/openrouter.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const total = await pool.query('SELECT COUNT(*) FROM medications');
    const result = await pool.query('SELECT * FROM medications ORDER BY name ASC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { total: parseInt(total.rows[0].count), page, limit, totalPages: Math.ceil(parseInt(total.rows[0].count) / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medication not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, dosage_unit, species_specific, contraindications, side_effects, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO medications (name, category, dosage_unit, species_specific, contraindications, side_effects, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, category, dosage_unit, species_specific, contraindications, side_effects, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, category, dosage_unit, species_specific, contraindications, side_effects, notes } = req.body;
    const result = await pool.query(
      `UPDATE medications SET name=$1, category=$2, dosage_unit=$3, species_specific=$4, contraindications=$5, side_effects=$6, notes=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, category, dosage_unit, species_specific, contraindications, side_effects, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medication not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM medications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medication not found' });
    res.json({ message: 'Medication deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Calculate dose
router.post('/calculate-dose', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { medication_name, species, breed, weight, condition } = req.body;
    const systemPrompt = `You are a veterinary pharmacologist expert. Calculate precise medication dosages for animals.
Always structure your response with:
- **Recommended Dosage** (with exact mg/kg calculation)
- **Administration Route**
- **Frequency**
- **Duration**
- **Warnings**
- **Monitoring**`;

    const userPrompt = `Medication: ${medication_name}\nSpecies: ${species}\nBreed: ${breed || 'Unknown'}\nWeight: ${weight} kg\nCondition: ${condition}`;
    const aiResult = await queryAI(systemPrompt, userPrompt);
    res.json({ dosage: aiResult.text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Drug interaction checker (NEW - structured JSON)
router.post('/drug-interaction-check', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { medication_ids, species } = req.body;
    if (!medication_ids || !Array.isArray(medication_ids) || medication_ids.length < 2) {
      return res.status(400).json({ error: 'Provide at least 2 medication_ids' });
    }

    const placeholders = medication_ids.map((_, i) => `$${i + 1}`).join(',');
    const medsResult = await pool.query(
      `SELECT id, name, category, species_specific, contraindications, side_effects FROM medications WHERE id IN (${placeholders})`,
      medication_ids
    );

    const meds = medsResult.rows;
    if (meds.length < 2) return res.status(400).json({ error: 'Some medications not found' });

    const medList = meds.map(m => `${m.name} (${m.category}): contraindications: ${m.contraindications || 'none'}, side effects: ${m.side_effects || 'none'}`).join('\n');

    const systemPrompt = `You are an expert veterinary pharmacologist. Check drug interactions. Return valid JSON only:
{"interactions":[{"drug1":"string","drug2":"string","severity":"mild|moderate|severe","mechanism":"string","management":"string"}],"safe_to_prescribe":boolean,"warnings":["string"],"monitoring_required":["string"]}`;

    const userPrompt = `Species: ${species || 'dog'}\nMedications:\n${medList}\n\nCheck for dangerous combinations and interactions.`;

    const aiResult = await queryAI(systemPrompt, userPrompt, true);

    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      [req.user?.id || null, 'medications/drug-interaction-check', JSON.stringify({ medication_ids, species }), JSON.stringify(aiResult.parsed || {})]
    );

    res.json({ result: aiResult.text, structured: aiResult.parsed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
