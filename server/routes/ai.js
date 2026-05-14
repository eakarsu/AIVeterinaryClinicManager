import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { queryAI } from '../services/openrouter.js';
import pool from '../db.js';

const router = express.Router();

async function persist(userId, endpoint, inputData, result) {
  try {
    await pool.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)]
    );
  } catch (e) { console.error('persist ai_results failed:', e.message); }
}

// POST /api/ai/diagnostic-assistant — differential diagnoses from symptoms/labs
router.post('/diagnostic-assistant', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { species, breed, age, weightKg, symptoms, vitals, labResults } = req.body || {};
    const systemPrompt = 'You are an experienced veterinarian and clinical decision-support assistant. Provide differential diagnoses with reasoning. Always respond with valid JSON. NOTE: This is decision support only and does not replace a licensed veterinarian.';
    const prompt = `Patient: species=${species || 'unknown'}, breed=${breed || 'unknown'}, age=${age || 'unknown'}, weightKg=${weightKg || 'unknown'}\nSymptoms: ${JSON.stringify(symptoms || [])}\nVitals: ${JSON.stringify(vitals || {})}\nLab results: ${JSON.stringify(labResults || {})}\n\nReturn JSON: { "differentials": [{ "diagnosis": "", "likelihood": "low|medium|high", "supporting": ["..."], "against": ["..."], "nextSteps": ["..."] }], "redFlags": ["..."], "summary": "" }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'diagnostic-assistant', { species, age }, out.parsed || out.text);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/treatment-recommendation — evidence-based treatment options
router.post('/treatment-recommendation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { species, diagnosis, weightKg, allergies, comorbidities } = req.body || {};
    if (!diagnosis) return res.status(400).json({ error: 'diagnosis is required' });
    const systemPrompt = 'You are a board-certified veterinarian. Provide evidence-informed treatment options. Always respond with valid JSON. NOTE: Decision-support only; final dosing must be confirmed by a licensed vet.';
    const prompt = `Diagnosis: ${diagnosis}\nSpecies: ${species || 'unknown'}\nWeight kg: ${weightKg || 'unknown'}\nAllergies: ${JSON.stringify(allergies || [])}\nComorbidities: ${JSON.stringify(comorbidities || [])}\n\nReturn JSON: { "options": [{ "treatment": "", "rationale": "", "dosing": "", "duration": "", "monitoring": "", "contraindications": ["..."] }], "lifestyleAdvice": ["..."], "followUpDays": 0 }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'treatment-recommendation', { diagnosis, species }, out.parsed || out.text);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/aftercare — generate discharge / aftercare instructions
router.post('/aftercare', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { species, diagnosis, treatment, ownerName, petName } = req.body || {};
    const systemPrompt = 'You are a veterinary technician writing client-friendly discharge instructions. Always respond with valid JSON.';
    const prompt = `Generate discharge / aftercare instructions for ${petName || 'the patient'} (${species || 'unknown species'}). Diagnosis: ${diagnosis || 'unspecified'}. Treatment: ${JSON.stringify(treatment || {})}. Owner: ${ownerName || ''}.\n\nReturn JSON: { "instructions": ["..."], "medicationsExplained": ["..."], "warningSigns": ["..."], "followUpSchedule": "", "ownerLetter": "" }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'aftercare', { diagnosis, species }, out.parsed || out.text);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/wellness-reminder — generate wellness/preventive-care reminders
router.post('/wellness-reminder', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { species, breed, age, lifeStage, lastVisitDate, vaccinations, chronicConditions, ownerName, petName } = req.body || {};
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.' });
    }
    const systemPrompt = 'You are a veterinary client-services assistant. Generate friendly, age- and species-appropriate preventive-care reminders and wellness messaging. Always respond with valid JSON.';
    const prompt = `Generate wellness reminders for ${petName || 'the patient'} (${species || 'unknown species'}, breed=${breed || 'unknown'}, age=${age || 'unknown'}, life stage=${lifeStage || 'unknown'}).\nLast visit: ${lastVisitDate || 'unknown'}\nVaccinations on file: ${JSON.stringify(vaccinations || [])}\nChronic conditions: ${JSON.stringify(chronicConditions || [])}\nOwner: ${ownerName || ''}\n\nReturn JSON: { "reminders": [{ "topic": "", "due_in_days": 0, "priority": "low|medium|high", "channel": "email|sms|portal", "message": "" }], "annual_checklist": ["..."], "owner_message": "", "next_visit_window_days": 0 }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'wellness-reminder', { species, age, lifeStage }, out.parsed || out.text);
    res.json(out);
  } catch (err) {
    if (/api[_ ]?key/i.test(err.message || '') || /401/.test(err.message || '')) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// Apply pass 5 (backlog) — additive AI endpoints (ESM).
// Required env vars: OPENROUTER_API_KEY (returns 503 + missing if absent).
// All endpoints reuse queryAI + persist + ai_results table.
// ----------------------------------------------------------------------

function requireKey(res) {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
    return true;
  }
  return false;
}

function handleKeyErr(res, err) {
  if (/api[_ ]?key/i.test(err.message || '') || /401/.test(err.message || '')) {
    res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
    return true;
  }
  return false;
}

// POST /api/ai/outbreak-detection
// Backlog: outbreak detection. PRODUCT-DECISION: full longitudinal classifier
// is TOO-RISKY (needs labelled training data). This endpoint accepts a
// caller-supplied case summary (recent visits / symptoms / species) and
// produces an AI assessment of outbreak likelihood + recommended actions.
router.post('/outbreak-detection', authenticateToken, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { recent_cases, region, lookback_days } = req.body || {};
    if (!recent_cases) return res.status(400).json({ error: 'recent_cases is required' });
    const text = typeof recent_cases === 'string' ? recent_cases : JSON.stringify(recent_cases);
    const systemPrompt = 'You are a veterinary epidemiologist. Assess outbreak risk from recent case data. Always respond with valid JSON. NOTE: decision-support only.';
    const prompt = `Lookback: ${lookback_days || 30} days\nRegion: ${region || 'unspecified'}\nRecent cases: ${text.slice(0, 6000)}\n\nReturn JSON: { "risk_level": "low|medium|high|critical", "suspected_conditions": [{ "name": "", "evidence": "", "confidence": "low|medium|high" }], "affected_species": ["..."], "recommended_actions": ["..."], "monitoring_plan": ["..."], "report_to_authority": "yes|no", "summary": "" }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'outbreak-detection', { region, lookback_days }, out.parsed || out.text);
    res.json(out);
  } catch (err) {
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/lab-result-interpret
// Backlog: lab integration. PRODUCT-DECISION: real lab APIs are NEEDS-CREDS.
// This endpoint accepts text/JSON of lab results and returns an
// interpretation. Decision-support only.
router.post('/lab-result-interpret', authenticateToken, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { species, breed, age, weightKg, lab_results, clinical_question } = req.body || {};
    if (!lab_results) return res.status(400).json({ error: 'lab_results is required' });
    const labText = typeof lab_results === 'string' ? lab_results : JSON.stringify(lab_results);
    const systemPrompt = 'You are a veterinary clinical pathologist. Interpret lab results in context. Always respond with valid JSON. NOTE: decision-support only; final interpretation must be confirmed by a licensed vet.';
    const prompt = `Patient: species=${species || 'unknown'}, breed=${breed || 'unknown'}, age=${age || 'unknown'}, weightKg=${weightKg || 'unknown'}\nClinical question: ${clinical_question || 'general interpretation'}\nLab results: ${labText.slice(0, 4000)}\n\nReturn JSON: { "key_findings": [{ "analyte": "", "value": "", "flag": "low|normal|high|critical", "note": "" }], "differential_implications": ["..."], "follow_up_tests": ["..."], "urgency": "routine|soon|immediate", "summary": "" }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'lab-result-interpret', { species }, out.parsed || out.text);
    res.json(out);
  } catch (err) {
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/pharmacy-interaction-check
// Backlog: pharmacy integration. PRODUCT-DECISION: real pharmacy APIs are
// NEEDS-CREDS. This endpoint accepts a medication list and returns AI-flagged
// possible interactions / contraindications. Decision-support only.
router.post('/pharmacy-interaction-check', authenticateToken, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { species, weightKg, medications, allergies, comorbidities } = req.body || {};
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ error: 'medications array required' });
    }
    const systemPrompt = 'You are a veterinary pharmacology assistant. Identify drug-drug, drug-disease, and species-specific risks. Always respond with valid JSON. NOTE: decision-support only — final dosing/interaction confirmation must be done by a licensed vet.';
    const prompt = `Species: ${species || 'unknown'}, weight kg: ${weightKg || 'unknown'}\nAllergies: ${JSON.stringify(allergies || [])}\nComorbidities: ${JSON.stringify(comorbidities || [])}\nMedications: ${JSON.stringify(medications)}\n\nReturn JSON: { "interactions": [{ "drugs": ["a","b"], "severity": "minor|moderate|major", "mechanism": "", "management": "" }], "species_specific_warnings": [{ "drug": "", "warning": "" }], "allergy_flags": [{ "drug": "", "allergen": "" }], "monitoring": ["..."], "summary": "" }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'pharmacy-interaction-check', { species, count: medications.length }, out.parsed || out.text);
    res.json(out);
  } catch (err) {
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/owner-self-service-faq
// Backlog: owner self-service portal. PRODUCT-DECISION: substantive portal
// product work is too large for this pass; in-memory FAQ generation supports
// a future portal — clinic supplies a question and patient context, AI
// returns a vetted, escalation-aware reply.
router.post('/owner-self-service-faq', authenticateToken, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { question, patient_context, clinic_policies } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question is required' });
    const systemPrompt = 'You are a veterinary client-services assistant for a clinic owner-portal. Provide friendly, safe responses; ALWAYS escalate to a vet when symptoms could be serious. Always respond with valid JSON.';
    const prompt = `Owner question: ${question}\nPatient context: ${JSON.stringify(patient_context || {})}\nClinic policies (optional): ${clinic_policies || 'standard'}\n\nReturn JSON: { "answer": "", "escalate_to_vet": true|false, "escalation_reason": "", "suggested_actions": ["..."], "follow_up_question_for_owner": "", "disclaimer": "" }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'owner-self-service-faq', { has_context: !!patient_context }, out.parsed || out.text);
    res.json(out);
  } catch (err) {
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/multi-clinic-summary
// Backlog: multi-clinic support. PRODUCT-DECISION: true multi-tenant data
// isolation is too large for this pass. As an additive stub, accept a
// caller-supplied roll-up of per-clinic stats and return an AI executive
// summary across clinics. No schema changes.
router.post('/multi-clinic-summary', authenticateToken, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { clinic_stats, period } = req.body || {};
    if (!Array.isArray(clinic_stats) || clinic_stats.length === 0) {
      return res.status(400).json({ error: 'clinic_stats array required' });
    }
    const systemPrompt = 'You write executive summaries for multi-clinic veterinary practices. Always respond with valid JSON.';
    const prompt = `Period: ${period || 'last_quarter'}\nClinic stats: ${JSON.stringify(clinic_stats).slice(0, 6000)}\n\nReturn JSON: { "executive_summary": "", "best_performing_clinic": { "name": "", "why": "" }, "underperforming_clinics": [{ "name": "", "issues": ["..."], "actions": ["..."] }], "cross_clinic_trends": ["..."], "kpi_table": [{ "clinic": "", "key_kpi": "", "value": "" }] }`;
    const out = await queryAI(systemPrompt, prompt, true);
    await persist(req.user?.id, 'multi-clinic-summary', { count: clinic_stats.length }, out.parsed || out.text);
    res.json(out);
  } catch (err) {
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: err.message });
  }
});

export default router;
