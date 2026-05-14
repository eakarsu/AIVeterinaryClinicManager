import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, ClipboardList, Sparkles, FileText } from 'lucide-react';
import { api } from '../services/api.js';

const visitTypes = [
  'Wellness Exam', 'Sick Visit', 'Follow-up', 'Surgery', 'Vaccination',
  'Emergency', 'Dental', 'Dermatology', 'Cardiology', 'Orthopedic Consult',
  'Neurology', 'Ophthalmology', 'Behavioral', 'Lab Recheck', 'Avian Exam',
  'Reptile Exam', 'Internal Medicine', 'Other',
];

const emptyForm = {
  patient_id: '',
  visit_date: '',
  visit_type: 'Wellness Exam',
  reason: '',
  vet_name: '',
  weight_at_visit: '',
  temperature: '',
  heart_rate: '',
  respiratory_rate: '',
  examination_notes: '',
  treatment_provided: '',
  prescriptions: '',
  follow_up_date: '',
  follow_up_notes: '',
};

export default function Visits() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // SOAP Note AI state
  const [soapLoading, setSoapLoading] = useState(false);
  const [soapNote, setSoapNote] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    loadVisits();
    loadPatients();
  }, []);

  const handleGenerateSoap = async () => {
    setSoapLoading(true);
    setSoapNote(null);
    setError('');
    try {
      const result = await api.generateSoapNote(selectedItem.id, { additional_notes: additionalNotes });
      setSoapNote(result);
      setSuccess('SOAP note generated.');
    } catch (err) {
      setError('Failed to generate SOAP: ' + err.message);
    } finally {
      setSoapLoading(false);
    }
  };

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await api.getVisits();
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load visits: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  const handleRowClick = async (visit) => {
    try {
      const data = await api.getVisit(visit.id);
      setSelectedItem(data);
      setView('detail');
      setError('');
      setSoapNote(null);
      setAdditionalNotes('');
      // Auto-load existing soap_note if present
      if (data.soap_note) {
        try {
          const parsed = typeof data.soap_note === 'string' ? JSON.parse(data.soap_note) : data.soap_note;
          setSoapNote({ structured: parsed });
        } catch {}
      }
    } catch (err) {
      setError('Failed to load visit details: ' + err.message);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedItem(null);
    setSoapNote(null);
    setAdditionalNotes('');
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setShowModal(true);
    setError('');
  };

  const openEditModal = () => {
    setEditingItem(selectedItem);
    setFormData({
      patient_id: selectedItem.patient_id || '',
      visit_date: selectedItem.visit_date ? selectedItem.visit_date.split('T')[0] : '',
      visit_type: selectedItem.visit_type || 'Wellness Exam',
      reason: selectedItem.reason || '',
      vet_name: selectedItem.vet_name || '',
      weight_at_visit: selectedItem.weight_at_visit || '',
      temperature: selectedItem.temperature || '',
      heart_rate: selectedItem.heart_rate || '',
      respiratory_rate: selectedItem.respiratory_rate || '',
      examination_notes: selectedItem.examination_notes || '',
      treatment_provided: selectedItem.treatment_provided || '',
      prescriptions: selectedItem.prescriptions || '',
      follow_up_date: selectedItem.follow_up_date ? selectedItem.follow_up_date.split('T')[0] : '',
      follow_up_notes: selectedItem.follow_up_notes || '',
    });
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(emptyForm);
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...formData,
      patient_id: formData.patient_id ? Number(formData.patient_id) : null,
      weight_at_visit: formData.weight_at_visit ? Number(formData.weight_at_visit) : null,
      temperature: formData.temperature ? Number(formData.temperature) : null,
      heart_rate: formData.heart_rate ? Number(formData.heart_rate) : null,
      respiratory_rate: formData.respiratory_rate ? Number(formData.respiratory_rate) : null,
    };

    try {
      if (editingItem) {
        const updated = await api.updateVisit(editingItem.id, payload);
        setSelectedItem(updated);
        setSuccess('Visit record updated successfully.');
      } else {
        await api.createVisit(payload);
        setSuccess('Visit record created successfully.');
      }
      closeModal();
      await loadVisits();
    } catch (err) {
      setError('Failed to save visit: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this visit record?')) return;
    try {
      await api.deleteVisit(selectedItem.id);
      setSuccess('Visit deleted successfully.');
      handleBackToList();
      await loadVisits();
    } catch (err) {
      setError('Failed to delete visit: ' + err.message);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.patient_name || '').toLowerCase().includes(term) ||
      (item.vet_name || '').toLowerCase().includes(term) ||
      (item.visit_type || '').toLowerCase().includes(term) ||
      (item.reason || '').toLowerCase().includes(term)
    );
  });

  // Detail View
  if (view === 'detail' && selectedItem) {
    return (
      <div>
        <button className="back-link" onClick={handleBackToList}>
          <ArrowLeft size={18} /> Back to Visit History
        </button>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="detail-panel">
          <div className="detail-header">
            <h2>
              <ClipboardList size={22} /> Visit Record — {selectedItem.patient_name || 'Unknown Patient'}
            </h2>
            <div className="header-actions">
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
              <span className="value">{selectedItem.patient_name || '—'} ({selectedItem.patient_species || '—'})</span>
            </div>
            <div className="detail-field">
              <label>Visit Date</label>
              <span className="value">{selectedItem.visit_date ? new Date(selectedItem.visit_date).toLocaleDateString() : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Visit Type</label>
              <span className="value">{selectedItem.visit_type || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Veterinarian</label>
              <span className="value">{selectedItem.vet_name || '—'}</span>
            </div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <label>Reason for Visit</label>
              <span className="value">{selectedItem.reason || '—'}</span>
            </div>
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 16, color: '#475569' }}>Vitals</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <label>Weight</label>
              <span className="value">{selectedItem.weight_at_visit ? `${selectedItem.weight_at_visit} kg` : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Temperature</label>
              <span className="value">{selectedItem.temperature ? `${selectedItem.temperature} °F` : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Heart Rate</label>
              <span className="value">{selectedItem.heart_rate ? `${selectedItem.heart_rate} bpm` : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Respiratory Rate</label>
              <span className="value">{selectedItem.respiratory_rate ? `${selectedItem.respiratory_rate} breaths/min` : '—'}</span>
            </div>
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 16, color: '#475569' }}>Clinical Notes</h3>
          <div className="detail-grid">
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <label>Examination Notes</label>
              <span className="value" style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.examination_notes || '—'}</span>
            </div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <label>Treatment Provided</label>
              <span className="value" style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.treatment_provided || '—'}</span>
            </div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <label>Prescriptions</label>
              <span className="value" style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.prescriptions || '—'}</span>
            </div>
          </div>

          {(selectedItem.follow_up_date || selectedItem.follow_up_notes) && (
            <>
              <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 16, color: '#475569' }}>Follow-up</h3>
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Follow-up Date</label>
                  <span className="value">{selectedItem.follow_up_date ? new Date(selectedItem.follow_up_date).toLocaleDateString() : '—'}</span>
                </div>
                <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Follow-up Notes</label>
                  <span className="value">{selectedItem.follow_up_notes || '—'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* AI SOAP Note Generator */}
        <div className="detail-panel" style={{ marginTop: 16 }}>
          <div className="detail-header">
            <h2><FileText size={20} /> AI SOAP Note</h2>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
            Generate a structured SOAP note (Subjective, Objective, Assessment, Plan) with billing codes from this visit's data.
          </p>

          <div className="form-group">
            <label>Additional Notes (optional)</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              placeholder="Any extra observations to include in the SOAP analysis..."
            />
          </div>

          <button className="btn btn-ai" onClick={handleGenerateSoap} disabled={soapLoading}>
            <Sparkles size={16} /> {soapLoading ? 'Generating SOAP Note...' : 'Generate SOAP Note'}
          </button>

          {soapNote?.structured && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: '#475569' }}>S — Subjective</h3>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, marginBottom: 12 }}>
                <div><strong>Chief Complaint:</strong> {soapNote.structured.subjective?.chief_complaint || '—'}</div>
                <div><strong>History:</strong> {soapNote.structured.subjective?.history || '—'}</div>
                <div><strong>Owner Observations:</strong> {soapNote.structured.subjective?.owner_observations || '—'}</div>
              </div>

              <h3 style={{ color: '#475569' }}>O — Objective</h3>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, marginBottom: 12 }}>
                <div><strong>Weight:</strong> {soapNote.structured.objective?.weight || '—'} kg | <strong>Temp:</strong> {soapNote.structured.objective?.temperature || '—'}°F</div>
                <div><strong>HR:</strong> {soapNote.structured.objective?.heart_rate || '—'} | <strong>RR:</strong> {soapNote.structured.objective?.respiratory_rate || '—'}</div>
                <div style={{ marginTop: 8 }}><strong>Findings:</strong> {soapNote.structured.objective?.physical_exam_findings || '—'}</div>
              </div>

              <h3 style={{ color: '#475569' }}>A — Assessment</h3>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, marginBottom: 12 }}>
                <div><strong>Primary Diagnosis:</strong> {soapNote.structured.assessment?.primary_diagnosis || '—'}</div>
                <div><strong>Severity:</strong> {soapNote.structured.assessment?.severity || '—'}</div>
                {soapNote.structured.assessment?.differential_diagnoses?.length > 0 && (
                  <div><strong>Differentials:</strong>
                    <ul>{soapNote.structured.assessment.differential_diagnoses.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                )}
              </div>

              <h3 style={{ color: '#475569' }}>P — Plan</h3>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, marginBottom: 12 }}>
                {soapNote.structured.plan?.treatments?.length > 0 && (
                  <div><strong>Treatments:</strong> <ul>{soapNote.structured.plan.treatments.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                )}
                {soapNote.structured.plan?.medications?.length > 0 && (
                  <div><strong>Medications:</strong> <ul>{soapNote.structured.plan.medications.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                )}
                {soapNote.structured.plan?.diagnostics_ordered?.length > 0 && (
                  <div><strong>Diagnostics Ordered:</strong> <ul>{soapNote.structured.plan.diagnostics_ordered.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                )}
                {soapNote.structured.plan?.client_education?.length > 0 && (
                  <div><strong>Client Education:</strong> <ul>{soapNote.structured.plan.client_education.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                )}
                <div><strong>Follow-up:</strong> {soapNote.structured.plan?.follow_up || '—'}</div>
              </div>

              {soapNote.structured.billing_codes?.length > 0 && (
                <div>
                  <h3 style={{ color: '#475569' }}>Billing Codes</h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {soapNote.structured.billing_codes.map((c, i) => (
                      <span key={i} style={{ padding: '4px 10px', background: '#dbeafe', color: '#1e40af', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {soapNote?.soap_note && !soapNote?.structured && (
            <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
              {soapNote.soap_note}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div>
      <div className="page-header">
        <h1>Medical Records</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={openCreateModal}>
            <Plus size={18} /> New Visit Record
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <input
        className="search-bar"
        type="text"
        placeholder="Search by patient, vet, type, or reason..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Vet</th>
              <th>Weight</th>
              <th>Temp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>
                {searchTerm ? 'No visit records match your search.' : 'No visit records found.'}
              </td></tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.patient_name || '—'}</td>
                  <td>{item.visit_date ? new Date(item.visit_date).toLocaleDateString() : '—'}</td>
                  <td>{item.visit_type || '—'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.reason || '—'}</td>
                  <td>{item.vet_name || '—'}</td>
                  <td>{item.weight_at_visit ? `${item.weight_at_visit} kg` : '—'}</td>
                  <td>{item.temperature ? `${item.temperature}°F` : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h2>{editingItem ? 'Edit Visit Record' : 'New Visit Record'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Patient *</label>
                  <select name="patient_id" value={formData.patient_id} onChange={handleFormChange} required>
                    <option value="">Select a patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.species}{p.owner_name ? ` (${p.owner_name})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Visit Date *</label>
                  <input type="date" name="visit_date" value={formData.visit_date} onChange={handleFormChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Visit Type *</label>
                  <select name="visit_type" value={formData.visit_type} onChange={handleFormChange} required>
                    {visitTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Veterinarian *</label>
                  <input type="text" name="vet_name" value={formData.vet_name} onChange={handleFormChange} required placeholder="Dr. Smith" />
                </div>
              </div>
              <div className="form-group">
                <label>Reason for Visit *</label>
                <input type="text" name="reason" value={formData.reason} onChange={handleFormChange} required placeholder="Chief complaint or reason" />
              </div>

              <h3 style={{ margin: '16px 0 8px', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Vitals</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.01" name="weight_at_visit" value={formData.weight_at_visit} onChange={handleFormChange} placeholder="e.g. 12.5" />
                </div>
                <div className="form-group">
                  <label>Temperature (°F)</label>
                  <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleFormChange} placeholder="e.g. 101.5" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Heart Rate (bpm)</label>
                  <input type="number" name="heart_rate" value={formData.heart_rate} onChange={handleFormChange} placeholder="e.g. 80" />
                </div>
                <div className="form-group">
                  <label>Respiratory Rate</label>
                  <input type="number" name="respiratory_rate" value={formData.respiratory_rate} onChange={handleFormChange} placeholder="e.g. 20" />
                </div>
              </div>

              <h3 style={{ margin: '16px 0 8px', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Clinical Notes</h3>
              <div className="form-group">
                <label>Examination Notes</label>
                <textarea name="examination_notes" value={formData.examination_notes} onChange={handleFormChange} rows={3} placeholder="Physical exam findings..." />
              </div>
              <div className="form-group">
                <label>Treatment Provided</label>
                <textarea name="treatment_provided" value={formData.treatment_provided} onChange={handleFormChange} rows={3} placeholder="Procedures, treatments administered..." />
              </div>
              <div className="form-group">
                <label>Prescriptions</label>
                <textarea name="prescriptions" value={formData.prescriptions} onChange={handleFormChange} rows={2} placeholder="Medications prescribed..." />
              </div>

              <h3 style={{ margin: '16px 0 8px', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Follow-up</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Follow-up Date</label>
                  <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Follow-up Notes</label>
                  <input type="text" name="follow_up_notes" value={formData.follow_up_notes} onChange={handleFormChange} placeholder="What to check at follow-up" />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Record' : 'Create Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
