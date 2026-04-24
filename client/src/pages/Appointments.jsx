import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, Clock } from 'lucide-react';
import { api } from '../services/api.js';

const appointmentTypes = [
  'Wellness Exam',
  'Sick Visit',
  'Follow-up',
  'Surgery',
  'Vaccination',
  'Dental',
  'Dermatology',
  'Cardiology',
  'Orthopedic Consult',
  'Behavioral',
  'Lab Recheck',
  'Other',
];

const statusOptions = ['scheduled', 'completed', 'cancelled', 'no-show'];

const emptyForm = {
  patient_id: '',
  vet_name: '',
  appointment_date: '',
  appointment_time: '',
  type: 'Wellness Exam',
  status: 'scheduled',
  notes: '',
};

export default function Appointments() {
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

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments();
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load appointments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients for dropdown:', err);
    }
  };

  const handleRowClick = async (appointment) => {
    try {
      const data = await api.getAppointment(appointment.id);
      setSelectedItem(data);
      setView('detail');
      setError('');
    } catch (err) {
      setError('Failed to load appointment details: ' + err.message);
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
      vet_name: selectedItem.vet_name || '',
      appointment_date: selectedItem.appointment_date || '',
      appointment_time: selectedItem.appointment_time || '',
      type: selectedItem.type || 'Wellness Exam',
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
        const updated = await api.updateAppointment(editingItem.id, payload);
        setSelectedItem(updated);
        setSuccess('Appointment updated successfully.');
      } else {
        await api.createAppointment(payload);
        setSuccess('Appointment created successfully.');
      }
      closeModal();
      await loadAppointments();
    } catch (err) {
      setError('Failed to save appointment: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return;
    }
    try {
      await api.deleteAppointment(selectedItem.id);
      setSuccess('Appointment deleted successfully.');
      handleBackToList();
      await loadAppointments();
    } catch (err) {
      setError('Failed to delete appointment: ' + err.message);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'no-show': return 'status-pending';
      default: return '';
    }
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.patient_name || '').toLowerCase().includes(term) ||
      (item.vet_name || '').toLowerCase().includes(term) ||
      (item.type || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
  });

  // Detail View
  if (view === 'detail' && selectedItem) {
    return (
      <div>
        <button className="back-link" onClick={handleBackToList}>
          <ArrowLeft size={18} /> Back to Appointments
        </button>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="detail-panel">
          <div className="detail-header">
            <h2>
              <Clock size={22} /> Appointment — {selectedItem.patient_name || 'Unknown Patient'}
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
              <span>{selectedItem.patient_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Veterinarian</label>
              <span>{selectedItem.vet_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Date</label>
              <span>{selectedItem.appointment_date || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Time</label>
              <span>{selectedItem.appointment_time || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Type</label>
              <span>{selectedItem.type || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Status</label>
              <span className={`status-badge ${getStatusClass(selectedItem.status)}`}>
                {selectedItem.status || '—'}
              </span>
            </div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <span>{selectedItem.notes || '—'}</span>
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
        <h1>Appointments</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={openCreateModal}>
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search appointments by patient, vet, type, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Veterinarian</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  {searchTerm ? 'No appointments match your search.' : 'No appointments found.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.patient_name || '—'}</td>
                  <td>{item.vet_name || '—'}</td>
                  <td>{item.appointment_date || '—'}</td>
                  <td>{item.appointment_time || '—'}</td>
                  <td>{item.type || '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status)}`}>
                      {item.status || '—'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit Appointment' : 'New Appointment'}</h2>

            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Patient *</label>
                  <select
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.species}{p.owner_name ? ` (${p.owner_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Veterinarian *</label>
                  <input
                    type="text"
                    name="vet_name"
                    value={formData.vet_name}
                    onChange={handleFormChange}
                    required
                    placeholder="Dr. Smith"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    name="appointment_time"
                    value={formData.appointment_time}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                  >
                    {appointmentTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    required
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Additional notes about this appointment..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update Appointment' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
