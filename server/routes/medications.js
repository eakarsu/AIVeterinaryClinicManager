import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { queryAI } from '../services/openrouter.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medications ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medication not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM medications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medication not found' });
    res.json({ message: 'Medication deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/calculate-dose', authenticateToken, async (req, res) => {
  try {
    const { medication_name, species, breed, weight, condition } = req.body;
    const systemPrompt = `You are a veterinary pharmacologist expert. Calculate precise medication dosages for animals.
    Always structure your response with:
    - **Recommended Dosage** (with exact mg/kg calculation)
    - **Administration Route** (oral, IV, IM, SC, topical)
    - **Frequency** (how often to administer)
    - **Duration** (recommended treatment duration)
    - **Warnings** (species-specific contraindications)
    - **Monitoring** (what to watch for)
    Be precise with calculations based on weight.`;

    const userPrompt = `Medication: ${medication_name}\nSpecies: ${species}\nBreed: ${breed || 'Unknown'}\nWeight: ${weight} kg\nCondition: ${condition}\n\nPlease calculate the appropriate dosage.`;

    const aiResponse = await queryAI(systemPrompt, userPrompt);
    res.json({ dosage: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
