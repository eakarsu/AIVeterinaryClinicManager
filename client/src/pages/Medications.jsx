import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, Sparkles, Calculator, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api.js';
import AIResponse from '../components/AIResponse.jsx';

const emptyForm = {
  name: '',
  category: '',
  dosage_unit: '',
  species_specific: '',
  contraindications: '',
  side_effects: '',
  notes: '',
};

const emptyDoseForm = {
  species: '',
  breed: '',
  weight: '',
  condition: '',
};

export default function Medications({ onNavigate }) {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // AI Dose Calculator state
  const [doseForm, setDoseForm] = useState(emptyDoseForm);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Drug Interaction Checker state
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionMedIds, setInteractionMedIds] = useState([]);
  const [interactionSpecies, setInteractionSpecies] = useState('dog');
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionResult, setInteractionResult] = useState(null);

  useEffect(() => {
    loadMedications();
  }, [page]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const resp = await api.getMedications(page, 20);
      // Handles both paginated and array responses
      if (Array.isArray(resp)) {
        setItems(resp);
        setTotalPages(1);
        setTotalCount(resp.length);
      } else {
        setItems(resp.data || []);
        setTotalPages(resp.pagination?.totalPages || 1);
        setTotalCount(resp.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openInteractionModal = () => {
    setShowInteractionModal(true);
    setInteractionMedIds([]);
    setInteractionResult(null);
    setError('');
  };

  const toggleInteractionMed = (id) => {
    setInteractionMedIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleRunInteractionCheck = async () => {
    if (interactionMedIds.length < 2) {
      setError('Select at least 2 medications');
      return;
    }
    setInteractionLoading(true);
    setInteractionResult(null);
    try {
      const result = await api.drugInteractionCheck({
        medication_ids: interactionMedIds,
        species: interactionSpecies,
      });
      setInteractionResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleRowClick = async (item) => {
    try {
      const detail = await api.getMedication(item._id || item.id);
      setSelectedItem(detail);
      setView('detail');
      setAiResult(null);
      setDoseForm(emptyDoseForm);
      setError('');
      setSuccess('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedItem(null);
    setAiResult(null);
    setDoseForm(emptyDoseForm);
    setError('');
    setSuccess('');
  };

  const handleNewMedication = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setShowModal(true);
    setError('');
  };

  const handleEdit = () => {
    setEditingItem(selectedItem);
    setFormData({
      name: selectedItem.name || '',
      category: selectedItem.category || '',
      dosage_unit: selectedItem.dosage_unit || '',
      species_specific: selectedItem.species_specific || '',
      contraindications: selectedItem.contraindications || '',
      side_effects: selectedItem.side_effects || '',
      notes: selectedItem.notes || '',
    });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${selectedItem.name}"?`)) return;
    try {
      await api.deleteMedication(selectedItem._id || selectedItem.id);
      setSuccess('Medication deleted successfully.');
      setView('list');
      setSelectedItem(null);
      loadMedications();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingItem) {
        const updated = await api.updateMedication(editingItem._id || editingItem.id, formData);
        setSuccess('Medication updated successfully.');
        setSelectedItem(updated);
      } else {
        await api.createMedication(formData);
        setSuccess('Medication created successfully.');
      }
      setShowModal(false);
      loadMedications();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDoseFormChange = (field, value) => {
    setDoseForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculateDose = async () => {
    setAiLoading(true);
    setAiResult(null);
    setError('');
    try {
      const result = await api.calculateDose({
        medication_name: selectedItem.name,
        species: doseForm.species,
        breed: doseForm.breed,
        weight: parseFloat(doseForm.weight),
        condition: doseForm.condition,
      });
      setAiResult(result.result || result.response || result.data || JSON.stringify(result));
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(term) ||
      (item.category || '').toLowerCase().includes(term) ||
      (item.species_specific || '').toLowerCase().includes(term)
    );
  });

  // ---------- LIST VIEW ----------
  if (view === 'list') {
    return (
      <div>
        <div className="page-header">
          <h1>Medications</h1>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={openInteractionModal}>
              <AlertTriangle size={16} /> Drug Interaction Check
            </button>
            <button className="btn btn-primary" onClick={handleNewMedication}>
              <Plus size={16} /> New Medication
            </button>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Dosage Unit</th>
                <th>Species Specific</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id || item.id} onClick={() => handleRowClick(item)}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.dosage_unit}</td>
                  <td>{item.species_specific}</td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
                    {loading ? 'Loading...' : 'No medications found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Showing page {page} of {totalPages} ({totalCount} total)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={14} /> Previous
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {showModal && renderModal()}
        {showInteractionModal && renderInteractionModal()}
      </div>
    );
  }

  // ---------- DETAIL VIEW ----------
  if (view === 'detail' && selectedItem) {
    return (
      <div>
        <button className="back-link" onClick={handleBackToList}>
          <ArrowLeft size={16} /> Back to Medications
        </button>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="detail-panel">
          <div className="detail-header">
            <h2>{selectedItem.name}</h2>
            <div className="header-actions">
              <button className="btn btn-sm btn-primary" onClick={handleEdit}>
                <Edit size={14} /> Edit
              </button>
              <button className="btn btn-sm btn-danger" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-field">
              <label>Name</label>
              <span>{selectedItem.name}</span>
            </div>
            <div className="detail-field">
              <label>Category</label>
              <span>{selectedItem.category}</span>
            </div>
            <div className="detail-field">
              <label>Dosage Unit</label>
              <span>{selectedItem.dosage_unit}</span>
            </div>
            <div className="detail-field">
              <label>Species Specific</label>
              <span>{selectedItem.species_specific}</span>
            </div>
            <div className="detail-field">
              <label>Contraindications</label>
              <span>{selectedItem.contraindications || 'N/A'}</span>
            </div>
            <div className="detail-field">
              <label>Side Effects</label>
              <span>{selectedItem.side_effects || 'N/A'}</span>
            </div>
            <div className="detail-field">
              <label>Notes</label>
              <span>{selectedItem.notes || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* AI Dose Calculator */}
        <div className="detail-panel" style={{ marginTop: '1.5rem' }}>
          <div className="detail-header">
            <h2><Calculator size={20} /> AI Dose Calculator</h2>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Species</label>
              <input
                type="text"
                placeholder="e.g. Dog, Cat, Horse"
                value={doseForm.species}
                onChange={(e) => handleDoseFormChange('species', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Breed</label>
              <input
                type="text"
                placeholder="e.g. Labrador, Siamese"
                value={doseForm.breed}
                onChange={(e) => handleDoseFormChange('breed', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                placeholder="Weight in kg"
                value={doseForm.weight}
                onChange={(e) => handleDoseFormChange('weight', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Condition</label>
              <input
                type="text"
                placeholder="e.g. Infection, Pain, Inflammation"
                value={doseForm.condition}
                onChange={(e) => handleDoseFormChange('condition', e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn btn-ai"
            onClick={handleCalculateDose}
            disabled={aiLoading || !doseForm.species || !doseForm.weight || !doseForm.condition}
          >
            <Sparkles size={16} /> Calculate Dose
          </button>

          <AIResponse title="Dosage Calculation" content={aiResult} loading={aiLoading} />
        </div>

        {showModal && renderModal()}
        {showInteractionModal && renderInteractionModal()}
      </div>
    );
  }

  // ---------- DRUG INTERACTION MODAL ----------
  function renderInteractionModal() {
    return (
      <div className="modal-overlay" onClick={() => setShowInteractionModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
          <h2><AlertTriangle size={20} /> Drug Interaction Check</h2>
          {error && <div className="alert-error">{error}</div>}
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
            Select 2 or more medications to check for dangerous interactions for a given species.
          </p>
          <div className="form-group">
            <label>Species</label>
            <select value={interactionSpecies} onChange={(e) => setInteractionSpecies(e.target.value)}>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="horse">Horse</option>
              <option value="rabbit">Rabbit</option>
              <option value="bird">Bird</option>
              <option value="reptile">Reptile</option>
            </select>
          </div>
          <div className="form-group">
            <label>Medications ({interactionMedIds.length} selected)</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
              {items.map((m) => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={interactionMedIds.includes(m.id)}
                    onChange={() => toggleInteractionMed(m.id)}
                  />
                  <span><strong>{m.name}</strong> <span style={{ color: '#94a3b8', fontSize: 12 }}>({m.category || 'unknown'})</span></span>
                </label>
              ))}
            </div>
          </div>
          <button
            className="btn btn-ai"
            onClick={handleRunInteractionCheck}
            disabled={interactionLoading || interactionMedIds.length < 2}
          >
            <Sparkles size={16} /> {interactionLoading ? 'Checking...' : 'Run Interaction Check'}
          </button>

          {interactionResult && (
            <div style={{ marginTop: 16 }}>
              {interactionResult.structured ? (
                <div>
                  <div style={{
                    padding: 12,
                    borderRadius: 6,
                    background: interactionResult.structured.safe_to_prescribe ? '#dcfce7' : '#fee2e2',
                    color: interactionResult.structured.safe_to_prescribe ? '#166534' : '#991b1b',
                    marginBottom: 12,
                    fontWeight: 600,
                  }}>
                    {interactionResult.structured.safe_to_prescribe ? 'SAFE to prescribe together' : 'INTERACTIONS DETECTED — review carefully'}
                  </div>

                  {interactionResult.structured.interactions?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <h4>Interactions Found</h4>
                      {interactionResult.structured.interactions.map((i, idx) => (
                        <div key={idx} style={{ padding: 10, marginBottom: 8, border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2' }}>
                          <div style={{ fontWeight: 600 }}>{i.drug1} + {i.drug2}</div>
                          <div style={{ fontSize: 12, color: '#991b1b', textTransform: 'uppercase' }}>Severity: {i.severity}</div>
                          <div style={{ marginTop: 6, fontSize: 13 }}><strong>Mechanism:</strong> {i.mechanism}</div>
                          <div style={{ marginTop: 4, fontSize: 13 }}><strong>Management:</strong> {i.management}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {interactionResult.structured.warnings?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <h4>Warnings</h4>
                      <ul>{interactionResult.structured.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                    </div>
                  )}

                  {interactionResult.structured.monitoring_required?.length > 0 && (
                    <div>
                      <h4>Monitoring Required</h4>
                      <ul>{interactionResult.structured.monitoring_required.map((w, i) => <li key={i}>{w}</li>)}</ul>
                    </div>
                  )}
                </div>
              ) : (
                <AIResponse title="Interaction Analysis" content={interactionResult.result} />
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowInteractionModal(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MODAL ----------
  function renderModal() {
    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>{editingItem ? 'Edit Medication' : 'New Medication'}</h2>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  placeholder="e.g. Antibiotic, Analgesic"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dosage Unit</label>
                <input
                  type="text"
                  value={formData.dosage_unit}
                  onChange={(e) => handleFormChange('dosage_unit', e.target.value)}
                  placeholder="e.g. mg/kg, ml"
                />
              </div>
              <div className="form-group">
                <label>Species Specific</label>
                <input
                  type="text"
                  value={formData.species_specific}
                  onChange={(e) => handleFormChange('species_specific', e.target.value)}
                  placeholder="e.g. Dogs, Cats, All"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contraindications</label>
              <textarea
                value={formData.contraindications}
                onChange={(e) => handleFormChange('contraindications', e.target.value)}
                rows={3}
                placeholder="Known contraindications..."
              />
            </div>

            <div className="form-group">
              <label>Side Effects</label>
              <textarea
                value={formData.side_effects}
                onChange={(e) => handleFormChange('side_effects', e.target.value)}
                rows={3}
                placeholder="Possible side effects..."
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success">
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
