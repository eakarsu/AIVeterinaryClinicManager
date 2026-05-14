import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import AIResponse from '../components/AIResponse.jsx';

export default function AIWellnessReminder() {
  const [form, setForm] = useState({
    species: 'dog',
    breed: '',
    age: '',
    lifeStage: 'adult',
    petName: '',
    ownerName: '',
    lastVisitDate: '',
    vaccinations: '',
    chronicConditions: '',
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    try {
      const body = {
        species: form.species,
        breed: form.breed || undefined,
        age: form.age || undefined,
        lifeStage: form.lifeStage,
        petName: form.petName || undefined,
        ownerName: form.ownerName || undefined,
        lastVisitDate: form.lastVisitDate || undefined,
        vaccinations: form.vaccinations
          ? form.vaccinations.split(',').map((v) => v.trim()).filter(Boolean)
          : [],
        chronicConditions: form.chronicConditions
          ? form.chronicConditions.split(',').map((v) => v.trim()).filter(Boolean)
          : [],
      };
      const res = await api.aiWellnessReminder(body);
      setResult(
        res.parsed
          ? JSON.stringify(res.parsed, null, 2)
          : res.text || res.content || JSON.stringify(res, null, 2)
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
          <Sparkles size={20} /> AI Wellness Reminders
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          Generate preventive-care reminders, an annual checklist, and an owner message.
        </p>
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
            <div className="form-group">
              <label>Life Stage</label>
              <select value={form.lifeStage} onChange={set('lifeStage')}>
                <option value="puppy">Puppy / Kitten</option>
                <option value="young">Young Adult</option>
                <option value="adult">Adult</option>
                <option value="senior">Senior</option>
                <option value="geriatric">Geriatric</option>
              </select>
            </div>
            <div className="form-group">
              <label>Breed</label>
              <input value={form.breed} onChange={set('breed')} placeholder="e.g. Labrador" />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input value={form.age} onChange={set('age')} placeholder="e.g. 7 years" />
            </div>
            <div className="form-group">
              <label>Patient Name</label>
              <input value={form.petName} onChange={set('petName')} placeholder="e.g. Bella" />
            </div>
            <div className="form-group">
              <label>Owner Name</label>
              <input value={form.ownerName} onChange={set('ownerName')} />
            </div>
            <div className="form-group">
              <label>Last Visit Date</label>
              <input type="date" value={form.lastVisitDate} onChange={set('lastVisitDate')} />
            </div>
            <div className="form-group">
              <label>Vaccinations (comma-separated)</label>
              <input
                value={form.vaccinations}
                onChange={set('vaccinations')}
                placeholder="DA2PP, Rabies, Bordetella"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Chronic Conditions (comma-separated)</label>
              <input
                value={form.chronicConditions}
                onChange={set('chronicConditions')}
                placeholder="e.g. arthritis, hypothyroidism"
              />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating…' : 'Generate Wellness Reminders'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <AIResponse title="Wellness Plan & Reminders" content={result} loading={loading} />
    </div>
  );
}
