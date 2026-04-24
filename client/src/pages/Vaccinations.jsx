import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, Syringe, AlertTriangle } from 'lucide-react';
import { api } from '../services/api.js';

const vaccineTypes = ['Core', 'Non-core', 'Required by law'];
const statusOptions = ['scheduled', 'administered', 'overdue', 'cancelled'];

const emptyForm = {
  patient_id: '',
  vaccine_name: '',
  vaccine_type: 'Core',
  batch_number: '',
  administered_date: '',
  next_due_date: '',
  administered_by: '',
  status: 'scheduled',
  notes: '',
};

export default function Vaccinations() {
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
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadVaccinations();
    loadPatients();
  }, []);

  const loadVaccinations = async () => {
    setLoading(true);
    try {
      const data = await api.getVaccinations();
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load vaccinations: ' + err.message);
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

  const handleRowClick = async (vaccination) => {
    try {
      const data = await api.getVaccination(vaccination.id);
      setSelectedItem(data);
      setView('detail');
      setError('');
    } catch (err) {
      setError('Failed to load vaccination details: ' + err.message);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedItem(null);
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
      vaccine_name: selectedItem.vaccine_name || '',
      vaccine_type: selectedItem.vaccine_type || 'Core',
      batch_number: selectedItem.batch_number || '',
      administered_date: selectedItem.administered_date ? selectedItem.administered_date.split('T')[0] : '',
      next_due_date: selectedItem.next_due_date ? selectedItem.next_due_date.split('T')[0] : '',
      administered_by: selectedItem.administered_by || '',
      status: selectedItem.status || 'scheduled',
      notes: selectedItem.notes || '',
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
    };

    try {
      if (editingItem) {
        const updated = await api.updateVaccination(editingItem.id, payload);
        setSelectedItem(updated);
        setSuccess('Vaccination updated successfully.');
      } else {
        await api.createVaccination(payload);
        setSuccess('Vaccination created successfully.');
      }
      closeModal();
      await loadVaccinations();
    } catch (err) {
      setError('Failed to save vaccination: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vaccination record?')) return;
    try {
      await api.deleteVaccination(selectedItem.id);
      setSuccess('Vaccination deleted successfully.');
      handleBackToList();
      await loadVaccinations();
    } catch (err) {
      setError('Failed to delete vaccination: ' + err.message);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'administered': return 'status-completed';
      case 'scheduled': return 'status-scheduled';
      case 'overdue': return 'status-cancelled';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const isOverdue = (item) => {
    if (item.status === 'administered' || item.status === 'cancelled') return false;
    return item.next_due_date && new Date(item.next_due_date) < new Date();
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.patient_name || '').toLowerCase().includes(term) ||
      (item.vaccine_name || '').toLowerCase().includes(term) ||
      (item.administered_by || '').toLowerCase().includes(term);
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus ||
      (filterStatus === 'overdue' && isOverdue(item));
    return matchesSearch && matchesFilter;
  });

  const overdueCount = items.filter(isOverdue).length;

  // Detail View
  if (view === 'detail' && selectedItem) {
    return (
      <div>
        <button className="back-link" onClick={handleBackToList}>
          <ArrowLeft size={18} /> Back to Vaccinations
        </button>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="detail-panel">
          <div className="detail-header">
            <h2>
              <Syringe size={22} /> {selectedItem.vaccine_name} — {selectedItem.patient_name || 'Unknown Patient'}
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
              <label>Owner</label>
              <span className="value">{selectedItem.owner_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Vaccine Name</label>
              <span className="value">{selectedItem.vaccine_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Vaccine Type</label>
              <span className="value">{selectedItem.vaccine_type || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Batch Number</label>
              <span className="value">{selectedItem.batch_number || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Administered Date</label>
              <span className="value">{selectedItem.administered_date ? new Date(selectedItem.administered_date).toLocaleDateString() : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Next Due Date</label>
              <span className="value" style={isOverdue(selectedItem) ? { color: '#dc2626', fontWeight: 700 } : {}}>
                {selectedItem.next_due_date ? new Date(selectedItem.next_due_date).toLocaleDateString() : '—'}
                {isOverdue(selectedItem) && ' (OVERDUE)'}
              </span>
            </div>
            <div className="detail-field">
              <label>Administered By</label>
              <span className="value">{selectedItem.administered_by || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Status</label>
              <span className={`status-badge ${getStatusClass(selectedItem.status)}`}>
                {selectedItem.status || '—'}
              </span>
            </div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <span className="value">{selectedItem.notes || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div>
      <div className="page-header">
        <h1>Vaccination Tracker</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={openCreateModal}>
            <Plus size={18} /> New Vaccination
          </button>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} />
          {overdueCount} vaccination{overdueCount > 1 ? 's' : ''} overdue! Click "Overdue" filter to view.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="search-bar"
          type="text"
          placeholder="Search by patient, vaccine, or vet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'scheduled', 'administered', 'overdue', 'cancelled'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(s)}
              style={{ textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Vaccine</th>
              <th>Type</th>
              <th>Administered</th>
              <th>Next Due</th>
              <th>Vet</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>
                {searchTerm || filterStatus !== 'all' ? 'No vaccinations match your filters.' : 'No vaccinations found.'}
              </td></tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.patient_name || '—'}</td>
                  <td>{item.vaccine_name || '—'}</td>
                  <td>{item.vaccine_type || '—'}</td>
                  <td>{item.administered_date ? new Date(item.administered_date).toLocaleDateString() : '—'}</td>
                  <td style={isOverdue(item) ? { color: '#dc2626', fontWeight: 700 } : {}}>
                    {item.next_due_date ? new Date(item.next_due_date).toLocaleDateString() : '—'}
                    {isOverdue(item) && ' !'}
                  </td>
                  <td>{item.administered_by || '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(isOverdue(item) ? 'overdue' : item.status)}`}>
                      {isOverdue(item) ? 'overdue' : item.status || '—'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit Vaccination' : 'New Vaccination'}</h2>
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
                  <label>Vaccine Name *</label>
                  <input type="text" name="vaccine_name" value={formData.vaccine_name} onChange={handleFormChange} required placeholder="e.g. DHPP, FVRCP, Rabies" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Vaccine Type *</label>
                  <select name="vaccine_type" value={formData.vaccine_type} onChange={handleFormChange} required>
                    {vaccineTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input type="text" name="batch_number" value={formData.batch_number} onChange={handleFormChange} placeholder="Lot/batch number" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Administered Date</label>
                  <input type="date" name="administered_date" value={formData.administered_date} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Next Due Date *</label>
                  <input type="date" name="next_due_date" value={formData.next_due_date} onChange={handleFormChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Administered By</label>
                  <input type="text" name="administered_by" value={formData.administered_by} onChange={handleFormChange} placeholder="Dr. Smith" />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select name="status" value={formData.status} onChange={handleFormChange} required>
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={3} placeholder="Any notes about this vaccination..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Vaccination' : 'Create Vaccination'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
