import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import AIResponse from '../components/AIResponse.jsx';

const testTypes = [
  'Hematology',
  'Biochemistry',
  'Urinalysis',
  'Serology',
  'Parasitology',
  'Allergy',
  'Endocrinology',
  'Cardiology',
  'Ophthalmology',
  'Microbiology',
  'Imaging',
  'Dermatology',
];

const emptyForm = {
  patient_id: '',
  test_type: '',
  test_name: '',
  results: '',
  reference_range: '',
  status: 'pending',
  lab_name: '',
  notes: '',
};

export default function Labs({ onNavigate }) {
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
      const data = await api.getLabs();
      setItems(data);
    } catch (err) {
      setError('Failed to load lab results');
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
      const full = await api.getLab(item.id);
      setSelectedItem(full);
      setAiResult('');
      setView('detail');
    } catch (err) {
      setError('Failed to load lab result details');
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
      test_type: selectedItem.test_type || '',
      test_name: selectedItem.test_name || '',
      results: selectedItem.results || '',
      reference_range: selectedItem.reference_range || '',
      status: selectedItem.status || 'pending',
      lab_name: selectedItem.lab_name || '',
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingItem) {
        await api.updateLab(editingItem.id, form);
        setSuccess('Lab result updated successfully');
      } else {
        await api.createLab(form);
        setSuccess('Lab result created successfully');
      }
      closeModal();
      await loadItems();
      if (editingItem && selectedItem) {
        const updated = await api.getLab(editingItem.id);
        setSelectedItem(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to save lab result');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm('Are you sure you want to delete this lab result?')) return;
    try {
      await api.deleteLab(selectedItem.id);
      setSuccess('Lab result deleted successfully');
      setSelectedItem(null);
      setView('list');
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to delete lab result');
    }
  };

  const handleAiInterpret = async () => {
    setAiLoading(true);
    setAiResult('');
    setError('');
    try {
      const payload = {
        test_name: selectedItem.test_name,
        results: selectedItem.results,
        reference_range: selectedItem.reference_range,
        species: selectedItem.patient_species,
        breed: selectedItem.patient_breed,
      };
      const result = await api.aiInterpretLab(payload);
      setAiResult(result.result || result.interpretation || result.content || JSON.stringify(result));
    } catch (err) {
      setError(err.message || 'AI interpretation failed');
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
      (item.test_name || '').toLowerCase().includes(term) ||
      (item.test_type || '').toLowerCase().includes(term) ||
      (item.lab_name || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  const statusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-badge status-completed';
      case 'pending':
        return 'status-badge status-pending';
      case 'cancelled':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
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
          <ArrowLeft size={16} /> Back to Lab Results
        </a>
        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}
        <div className="detail-panel">
          <div className="detail-header">
            <h2>Lab Result Details</h2>
            <div className="header-actions">
              <button className="btn btn-ai" onClick={handleAiInterpret} disabled={aiLoading}>
                <Sparkles size={16} /> {aiLoading ? 'Interpreting...' : 'AI Interpret'}
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
              <label>Test Name</label>
              <span>{selectedItem.test_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Test Type</label>
              <span>{selectedItem.test_type || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Status</label>
              <span className={statusClass(selectedItem.status)}>
                {selectedItem.status || '—'}
              </span>
            </div>
            <div className="detail-field">
              <label>Lab Name</label>
              <span>{selectedItem.lab_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Results</label>
              <span>{selectedItem.results || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Reference Range</label>
              <span>{selectedItem.reference_range || '—'}</span>
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
          <AIResponse title="Lab Results Interpretation" content={aiResult} loading={aiLoading} />
        </div>
        {showModal && renderModal()}
      </div>
    );
  }

  function renderModal() {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>{editingItem ? 'Edit Lab Result' : 'New Lab Result'}</h2>
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
                <label>Test Type</label>
                <select name="test_type" value={form.test_type} onChange={handleChange} required>
                  <option value="">Select test type...</option>
                  {testTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Test Name</label>
                <input
                  type="text"
                  name="test_name"
                  value={form.test_name}
                  onChange={handleChange}
                  placeholder="e.g. Complete Blood Count"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Results</label>
              <textarea
                name="results"
                value={form.results}
                onChange={handleChange}
                rows={4}
                placeholder="Enter lab results..."
                required
              />
            </div>
            <div className="form-group">
              <label>Reference Range</label>
              <input
                type="text"
                name="reference_range"
                value={form.reference_range}
                onChange={handleChange}
                placeholder="e.g. 5.5-8.5 g/dL"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange} required>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lab Name</label>
                <input
                  type="text"
                  name="lab_name"
                  value={form.lab_name}
                  onChange={handleChange}
                  placeholder="e.g. VetLab Central"
                />
              </div>
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
        <h1>Lab Results</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={16} /> New Lab Result
          </button>
        </div>
      </div>
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}
      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search lab results..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Test Name</th>
              <th>Test Type</th>
              <th>Status</th>
              <th>Lab Name</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>
                  No lab results found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.patient_name || '—'}</td>
                  <td>{item.test_name || '—'}</td>
                  <td>{item.test_type || '—'}</td>
                  <td>
                    <span className={statusClass(item.status)}>
                      {item.status || '—'}
                    </span>
                  </td>
                  <td>{item.lab_name || '—'}</td>
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
