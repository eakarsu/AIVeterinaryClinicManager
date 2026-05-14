import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AIResponse from '../components/AIResponse.jsx';

/**
 * Reusable AI page used by Apply pass 5 backlog endpoints.
 * Posts JSON to a configurable api method and renders the structured response.
 */
export default function SimpleAIPage({ title, description, apiMethod, fields }) {
  const initial = Object.fromEntries(fields.map((f) => [f.name, '']));
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const required = fields.filter((f) => f.required).find((f) => !String(form[f.name] || '').trim());
    if (required) {
      setError(`${required.label} is required`);
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    try {
      const body = {};
      for (const f of fields) {
        const v = form[f.name];
        if (v == null || v === '') continue;
        if (f.type === 'json') {
          try { body[f.name] = JSON.parse(v); } catch { body[f.name] = v; }
        } else if (f.type === 'csv') {
          body[f.name] = v.split(',').map((x) => x.trim()).filter(Boolean);
        } else if (f.type === 'number') {
          body[f.name] = Number(v);
        } else {
          body[f.name] = v;
        }
      }
      const res = await apiMethod(body);
      setResult(
        res.parsed ? JSON.stringify(res.parsed, null, 2) : res.text || res.content || JSON.stringify(res, null, 2)
      );
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <Sparkles size={20} /> {title}
        </h1>
        {description && <p style={{ color: '#94a3b8', fontSize: 14 }}>{description}</p>}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gap: 12 }}>
            {fields.map((f) => (
              <div className="form-group" key={f.name}>
                <label>
                  {f.label}
                  {f.required ? ' *' : ''}
                </label>
                {f.type === 'textarea' || f.type === 'json' ? (
                  <textarea
                    rows={f.rows || 6}
                    value={form[f.name]}
                    onChange={set(f.name)}
                    placeholder={f.placeholder || ''}
                    style={{ width: '100%', fontFamily: 'monospace' }}
                  />
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={form[f.name]}
                    onChange={set(f.name)}
                    placeholder={f.placeholder || ''}
                  />
                )}
              </div>
            ))}
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 12 }}>
            {loading ? 'Working...' : 'Run AI'}
          </button>
        </form>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}
      {result && <AIResponse content={result} />}
    </div>
  );
}
