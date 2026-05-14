import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import AIResponse from '../components/AIResponse.jsx';

export default function AIAftercare() {
  const [form, setForm] = useState({
    species: 'dog',
    patient_name: '',
    diagnosis: '',
    procedure: '',
    medications: '',
    follow_up: '',
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult('');
    try {
      const res = await api.aiAftercare(form);
      setResult(res.content || res.result || res.instructions || res.letter || JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><Sparkles size={20} /> AI Aftercare & Discharge</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Generate client-friendly discharge instructions and owner letter.</p>
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
            <div className="form-group"><label>Patient Name</label><input value={form.patient_name} onChange={set('patient_name')} placeholder="e.g. Bella" /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Diagnosis *</label>
              <textarea rows="2" value={form.diagnosis} onChange={set('diagnosis')} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Procedure / Treatment Performed</label>
              <textarea rows="2" value={form.procedure} onChange={set('procedure')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Medications Prescribed</label>
              <textarea rows="2" value={form.medications} onChange={set('medications')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Follow-up Schedule</label>
              <input value={form.follow_up} onChange={set('follow_up')} placeholder="e.g. recheck in 14 days" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating…' : 'Generate Aftercare Instructions'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      <AIResponse title="Discharge Instructions & Owner Letter" content={result} loading={loading} />
    </div>
  );
}
