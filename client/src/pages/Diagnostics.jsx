import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import AIResponse from '../components/AIResponse.jsx';

const emptyForm = {
  patient_id: '',
  symptoms: '',
  species: '',
  diagnosis: '',
  treatment_plan: '',
  notes: '',
};

export default function Diagnostics({ onNavigate }) {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadItems();
    loadPatients();
  }, []);

  const loadItems = async () => {
    try {
      const data = await api.getDiagnostics();
      setItems(data);
    } catch (err) {
      setError('Failed to load diagnostics');
    }
  };

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  };

  const handleRowClick = async (item) => {
    try {
      const full = await api.getDiagnostic(item.id);
      setSelectedItem(full);
      setAiResult('');
      setView('detail');
    } catch (err) {
      setError('Failed to load diagnostic details');
    }
  };

  const openNewModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setAiResult('');
    setShowModal(true);
    setError('');
  };

  const openEditModal = () => {
    setEditingItem(selectedItem);
    setForm({
      patient_id: selectedItem.patient_id || '',
      symptoms: selectedItem.symptoms || '',
      species: selectedItem.species || '',
      diagnosis: selectedItem.diagnosis || '',
      treatment_plan: selectedItem.treatment_plan || '',
      notes: selectedItem.notes || '',
    });
    setAiResult('');
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm(emptyForm);
    setAiResult('');
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'patient_id' && value) {
      const patient = patients.find((p) => String(p.id) === String(value));
      if (patient) {
        setForm((prev) => ({ ...prev, species: patient.species || prev.species }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingItem) {
        await api.updateDiagnostic(editingItem.id, form);
        setSuccess('Diagnostic updated successfully');
      } else {
        await api.createDiagnostic(form);
        setSuccess('Diagnostic created successfully');
      }
      closeModal();
      await loadItems();
      if (editingItem && selectedItem) {
        const updated = await api.getDiagnostic(editingItem.id);
        setSelectedItem(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to save diagnostic');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm('Are you sure you want to delete this diagnostic record?')) return;
    try {
      await api.deleteDiagnostic(selectedItem.id);
      setSuccess('Diagnostic deleted successfully');
      setSelectedItem(null);
      setView('list');
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to delete diagnostic');
    }
  };

  const handleAiDiagnose = async (source) => {
    setAiLoading(true);
    setAiResult('');
    setError('');
    try {
      let payload;
      if (source === 'modal') {
        const patient = patients.find((p) => String(p.id) === String(form.patient_id));
        payload = {
          symptoms: form.symptoms,
          species: form.species,
          breed: patient?.breed || '',
          age: patient?.age || '',
        };
      } else {
        payload = {
          symptoms: selectedItem.symptoms,
          species: selectedItem.species || selectedItem.patient_species,
          breed: selectedItem.breed || selectedItem.patient_breed || '',
          age: selectedItem.age || selectedItem.patient_age || '',
        };
      }
      const result = await api.aiDiagnose(payload);
      setAiResult(result.result || result.diagnosis || result.content || JSON.stringify(result));
    } catch (err) {
      setError(err.message || 'AI diagnosis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedItem(null);
    setAiResult('');
    setError('');
    setSuccess('');
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.patient_name || '').toLowerCase().includes(term) ||
      (item.patient_species || '').toLowerCase().includes(term) ||
      (item.symptoms || '').toLowerCase().includes(term) ||
      (item.diagnosis || '').toLowerCase().includes(term)
    );
  });

  const truncate = (str, len = 60) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  // Clear alerts after 3 seconds
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  if (view === 'detail' && selectedItem) {
    return (
      <div>
        <a className="back-link" onClick={backToList} href="#!">
          <ArrowLeft size={16} /> Back to Diagnostics
        </a>
        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}
        <div className="detail-panel">
          <div className="detail-header">
            <h2>Diagnostic Record</h2>
            <div className="header-actions">
              <button className="btn btn-ai" onClick={() => handleAiDiagnose('detail')}>
                <Sparkles size={16} /> AI Diagnose
              </button>
              <button className="btn btn-primary btn-sm" onClick={openEditModal}>
                <Edit size={16} /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Patient</label>
              <span>{selectedItem.patient_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Species</label>
              <span>{selectedItem.patient_species || selectedItem.species || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Symptoms</label>
              <span>{selectedItem.symptoms || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Diagnosis</label>
              <span>{selectedItem.diagnosis || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Treatment Plan</label>
              <span>{selectedItem.treatment_plan || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Notes</label>
              <span>{selectedItem.notes || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Created</label>
              <span>{formatDate(selectedItem.created_at)}</span>
            </div>
          </div>
          <AIResponse title="Diagnostic Assessment" content={aiResult} loading={aiLoading} />
        </div>
        {showModal && renderModal()}
      </div>
    );
  }

  function renderModal() {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>{editingItem ? 'Edit Diagnostic' : 'New Diagnostic'}</h2>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Patient</label>
              <select name="patient_id" value={form.patient_id} onChange={handleChange} required>
                <option value="">Select a patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Species</label>
                <input
                  type="text"
                  name="species"
                  value={form.species}
                  onChange={handleChange}
                  placeholder="e.g. Dog, Cat, Horse"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Symptoms</label>
              <textarea
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the symptoms..."
                required
              />
            </div>
            <div className="form-group">
              <label>Diagnosis</label>
              <textarea
                name="diagnosis"
                value={form.diagnosis}
                onChange={handleChange}
                rows={2}
                placeholder="Diagnosis..."
              />
            </div>
            <div className="form-group">
              <label>Treatment Plan</label>
              <textarea
                name="treatment_plan"
                value={form.treatment_plan}
                onChange={handleChange}
                rows={2}
                placeholder="Treatment plan..."
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
            <button
              type="button"
              className="btn btn-ai"
              onClick={() => handleAiDiagnose('modal')}
              disabled={aiLoading || !form.symptoms}
              style={{ marginBottom: '1rem', width: '100%' }}
            >
              <Sparkles size={16} /> {aiLoading ? 'Analyzing...' : 'AI Diagnose'}
            </button>
            <AIResponse title="Diagnostic Assessment" content={aiResult} loading={aiLoading} />
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>AI Diagnostics</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={16} /> New Diagnostic
          </button>
        </div>
      </div>
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}
      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search diagnostics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Species</th>
              <th>Symptoms</th>
              <th>Diagnosis</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  No diagnostics found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.patient_name || '—'}</td>
                  <td>{item.patient_species || item.species || '—'}</td>
                  <td>{truncate(item.symptoms)}</td>
                  <td>{truncate(item.diagnosis, 40)}</td>
                  <td>{formatDate(item.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && renderModal()}
    </div>
  );
}
