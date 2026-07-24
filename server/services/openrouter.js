import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

function getModel() {
  const model = process.env.OPENROUTER_MODEL?.trim();
  if (!model) throw new Error('OPENROUTER_MODEL is required');
  return model;
}

function getConfiguration() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const baseUrl = process.env.OPENROUTER_BASE_URL?.trim().replace(/\/$/, '');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is required');
  if (!baseUrl) throw new Error('OPENROUTER_BASE_URL is required');
  if (baseUrl !== 'https://openrouter.ai/api/v1') {
    throw new Error('OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1');
  }
  return { apiKey, baseUrl, model: getModel() };
}

export function parseAIJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) {}
  try {
    const stripped = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(stripped);
  } catch (_) {}
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}
  return null;
}

export async function queryAI(systemPrompt, userPrompt, returnJson = false) {
  const { apiKey, baseUrl, model } = getConfiguration();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
      'X-Title': 'AI Veterinary Clinic Manager',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      ...(returnJson ? { response_format: { type: 'json_object' } } : {})
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.error.message || 'OpenRouter API error');
  }
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenRouter returned an empty response');
  }
  return { text: content, parsed: parseAIJson(content), model: data.model || model, usage: data.usage };
}
