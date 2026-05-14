import { Router } from 'express';
import { authenticateToken as auth } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

// Aftercare generator producing discharge instructions and follow-up plans
// Feature: aftercare-generator

async function callOpenRouter(systemPrompt, userPrompt, opts = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing. TODO: configure credentials');
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const base = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const httpResp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: opts.maxTokens || 2048,
      temperature: opts.temperature ?? 0.5,
    }),
  });
  if (!httpResp.ok) throw new Error(`OpenRouter HTTP ${httpResp.status}`);
  const data = await httpResp.json();
  let txt = data.choices[0].message.content.trim();
  txt = txt.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

async function persist(userId, feature, input, output) {
  try {
    if (pool && pool.query) {
      await pool.query(
        `INSERT INTO ai_results (user_id, feature, input, output) VALUES ($1,$2,$3,$4)`,
        [userId, feature, JSON.stringify(input).slice(0, 4000), JSON.stringify(output)]
      ).catch(() => {});
    }
  } catch (_) {}
}

router.post('/analyze', auth, async (req, res) => {
  const payload = req.body || {};
  try {
    const result = await callOpenRouter(
      'You are an expert assistant for the "AIVeterinaryClinicManager" platform. Always return strict JSON only.',
      `Feature: Aftercare generator producing discharge instructions and follow-up plans.\nUser input: ${JSON.stringify(payload).slice(0, 3500)}\nReturn JSON: { summary, findings:[], recommendations:[], score:0.0, details:{} }`
    );
    const uid = req.user && (req.user.id || req.user.userId);
    await persist(uid, 'aftercare-generator', payload, result);
    res.json({ success: true, feature: 'aftercare-generator', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batch', auth, async (req, res) => {
  const { items = [] } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'items array required' });
  try {
    const result = await callOpenRouter(
      'You analyze batches for "AIVeterinaryClinicManager". JSON only.',
      `Feature: Aftercare generator producing discharge instructions and follow-up plans. Batch of ${items.length} items: ${JSON.stringify(items).slice(0, 3500)}.\nReturn JSON: { results:[], aggregate:{} }`,
      { maxTokens: 3072 }
    );
    res.json({ success: true, count: items.length, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/info', auth, (req, res) => {
  res.json({ feature: 'aftercare-generator', title: 'Aftercare generator producing discharge instructions and follow-up plans', project: 'AIVeterinaryClinicManager' });
});

export default router;
