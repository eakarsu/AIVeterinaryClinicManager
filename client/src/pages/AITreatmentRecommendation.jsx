import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import AIResponse from '../components/AIResponse.jsx';

export default function AITreatmentRecommendation() {
  const [form, setForm] = useState({
    species: 'dog',
    age: '',
    weight: '',
    diagnosis: '',
    history: '',
    allergies: '',
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult('');
    try {
      const res = await api.aiTreatmentRecommendation(form);
      setResult(res.content || res.result || res.analysis || res.recommendation || JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><Sparkles size={20} /> AI Treatment Recommendation</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Evidence-informed treatment options. Decision-support only.</p>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            <div className="form-group">
              <label>Species</label>
              <select value={form.species} onChange={set('species')}>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="rabbit">Rabbit</option>
                <option value="bird">Bird</option>
                <option value="reptile">Reptile</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group"><label>Age</label><input value={form.age} onChange={set('age')} placeholder="e.g. 4y" /></div>
            <div className="form-group"><label>Weight (kg)</label><input value={form.weight} onChange={set('weight')} type="number" step="0.1" /></div>
            <div className="form-group"><label>Allergies</label><input value={form.allergies} onChange={set('allergies')} placeholder="e.g. penicillin" /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Diagnosis *</label>
              <textarea rows="3" value={form.diagnosis} onChange={set('diagnosis')} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Relevant History</label>
              <textarea rows="3" value={form.history} onChange={set('history')} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating…' : 'Generate Treatment Plan'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      <AIResponse title="Treatment Recommendation" content={result} loading={loading} />
    </div>
  );
}
