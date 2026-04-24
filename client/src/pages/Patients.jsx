import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';

const emptyForm = {
  name: '',
  species: '',
  breed: '',
  age: '',
  weight: '',
  owner_name: '',
  owner_phone: '',
  owner_email: '',
  medical_history: '',
};

export default function Patients() {
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

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients();
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load patients: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (patient) => {
    try {
      const data = await api.getPatient(patient.id);
      setSelectedItem(data);
      setView('detail');
      setError('');
    } catch (err) {
      setError('Failed to load patient details: ' + err.message);
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
      name: selectedItem.name || '',
      species: selectedItem.species || '',
      breed: selectedItem.breed || '',
      age: selectedItem.age || '',
      weight: selectedItem.weight || '',
      owner_name: selectedItem.owner_name || '',
      owner_phone: selectedItem.owner_phone || '',
      owner_email: selectedItem.owner_email || '',
      medical_history: selectedItem.medical_history || '',
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
      age: formData.age ? Number(formData.age) : null,
      weight: formData.weight ? Number(formData.weight) : null,
    };

    try {
      if (editingItem) {
        const updated = await api.updatePatient(editingItem.id, payload);
        setSelectedItem(updated);
        setSuccess('Patient updated successfully.');
      } else {
        await api.createPatient(payload);
        setSuccess('Patient created successfully.');
      }
      closeModal();
      await loadPatients();
    } catch (err) {
      setError('Failed to save patient: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedItem.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deletePatient(selectedItem.id);
      setSuccess('Patient deleted successfully.');
      handleBackToList();
      await loadPatients();
    } catch (err) {
      setError('Failed to delete patient: ' + err.message);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(term) ||
      (item.species || '').toLowerCase().includes(term) ||
      (item.breed || '').toLowerCase().includes(term) ||
      (item.owner_name || '').toLowerCase().includes(term)
    );
  });

  // Detail View
  if (view === 'detail' && selectedItem) {
    return (
      <div>
        <button className="back-link" onClick={handleBackToList}>
          <ArrowLeft size={18} /> Back to Patients
        </button>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="detail-panel">
          <div className="detail-header">
            <h2>{selectedItem.name}</h2>
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
              <label>Name</label>
              <span>{selectedItem.name}</span>
            </div>
            <div className="detail-field">
              <label>Species</label>
              <span>{selectedItem.species}</span>
            </div>
            <div className="detail-field">
              <label>Breed</label>
              <span>{selectedItem.breed}</span>
            </div>
            <div className="detail-field">
              <label>Age</label>
              <span>{selectedItem.age != null ? `${selectedItem.age} years` : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Weight</label>
              <span>{selectedItem.weight != null ? `${selectedItem.weight} kg` : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Owner Name</label>
              <span>{selectedItem.owner_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Owner Phone</label>
              <span>{selectedItem.owner_phone || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Owner Email</label>
              <span>{selectedItem.owner_email || '—'}</span>
            </div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <label>Medical History</label>
              <span>{selectedItem.medical_history || '—'}</span>
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
        <h1>Patients</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={openCreateModal}>
            <Plus size={18} /> New Patient
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search patients by name, species, breed, or owner..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Species</th>
              <th>Breed</th>
              <th>Age</th>
              <th>Weight</th>
              <th>Owner</th>
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
                  {searchTerm ? 'No patients match your search.' : 'No patients found.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.name}</td>
                  <td>{item.species}</td>
                  <td>{item.breed}</td>
                  <td>{item.age != null ? item.age : '—'}</td>
                  <td>{item.weight != null ? `${item.weight} kg` : '—'}</td>
                  <td>{item.owner_name}</td>
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
            <h2>{editingItem ? 'Edit Patient' : 'New Patient'}</h2>

            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Species *</label>
                  <input
                    type="text"
                    name="species"
                    value={formData.species}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Breed</label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Age (years)</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleFormChange}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Owner Name *</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Owner Phone</label>
                  <input
                    type="tel"
                    name="owner_phone"
                    value={formData.owner_phone}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Owner Email</label>
                  <input
                    type="email"
                    name="owner_email"
                    value={formData.owner_email}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Medical History</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleFormChange}
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update Patient' : 'Create Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
