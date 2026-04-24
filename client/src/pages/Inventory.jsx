import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api.js';

const CATEGORIES = [
  'Medications',
  'Vaccines',
  'Supplies',
  'Surgical',
  'Anesthesia',
  'Lab Supplies',
  'Preventatives',
  'Therapeutic Diet',
];

const emptyForm = {
  name: '',
  category: '',
  quantity: '',
  unit: '',
  unit_price: '',
  supplier: '',
  reorder_level: '',
  expiry_date: '',
  notes: '',
};

export default function Inventory() {
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
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getInventory();
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load inventory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (item) => {
    try {
      const data = await api.getInventoryItem(item.id);
      setSelectedItem(data);
      setView('detail');
      setError('');
    } catch (err) {
      setError('Failed to load item details: ' + err.message);
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
      category: selectedItem.category || '',
      quantity: selectedItem.quantity != null ? selectedItem.quantity : '',
      unit: selectedItem.unit || '',
      unit_price: selectedItem.unit_price != null ? selectedItem.unit_price : '',
      supplier: selectedItem.supplier || '',
      reorder_level: selectedItem.reorder_level != null ? selectedItem.reorder_level : '',
      expiry_date: selectedItem.expiry_date ? selectedItem.expiry_date.slice(0, 10) : '',
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
      quantity: formData.quantity !== '' ? Number(formData.quantity) : null,
      unit_price: formData.unit_price !== '' ? Number(formData.unit_price) : null,
      reorder_level: formData.reorder_level !== '' ? Number(formData.reorder_level) : null,
      expiry_date: formData.expiry_date || null,
    };

    try {
      if (editingItem) {
        const updated = await api.updateInventory(editingItem.id, payload);
        setSelectedItem(updated);
        setSuccess('Inventory item updated successfully.');
      } else {
        await api.createInventory(payload);
        setSuccess('Inventory item created successfully.');
      }
      closeModal();
      await loadInventory();
    } catch (err) {
      setError('Failed to save inventory item: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedItem.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteInventory(selectedItem.id);
      setSuccess('Inventory item deleted successfully.');
      handleBackToList();
      await loadInventory();
    } catch (err) {
      setError('Failed to delete inventory item: ' + err.message);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(term) ||
      (item.category || '').toLowerCase().includes(term) ||
      (item.supplier || '').toLowerCase().includes(term)
    );
  });

  // Detail View
  if (view === 'detail' && selectedItem) {
    return (
      <div>
        <button className="back-link" onClick={handleBackToList}>
          <ArrowLeft size={18} /> Back to Inventory
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
              <label>Category</label>
              <span>{selectedItem.category || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Quantity</label>
              <span>
                {selectedItem.quantity != null ? (
                  selectedItem.quantity <= (selectedItem.reorder_level || 0) ? (
                    <span className="low-stock">
                      <AlertTriangle size={14} /> {selectedItem.quantity}
                    </span>
                  ) : (
                    selectedItem.quantity
                  )
                ) : '—'}
              </span>
            </div>
            <div className="detail-field">
              <label>Unit</label>
              <span>{selectedItem.unit || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Unit Price</label>
              <span>{selectedItem.unit_price != null ? `$${Number(selectedItem.unit_price).toFixed(2)}` : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Supplier</label>
              <span>{selectedItem.supplier || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Reorder Level</label>
              <span>{selectedItem.reorder_level != null ? selectedItem.reorder_level : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Expiry Date</label>
              <span>{selectedItem.expiry_date ? new Date(selectedItem.expiry_date).toLocaleDateString() : '—'}</span>
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
        <h1>Inventory</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={openCreateModal}>
            <Plus size={18} /> New Item
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search inventory by name, category, or supplier..."
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
              <th>Quantity</th>
              <th>Unit</th>
              <th>Unit Price</th>
              <th>Supplier</th>
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
                  {searchTerm ? 'No inventory items match your search.' : 'No inventory items found.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.name}</td>
                  <td>{item.category || '—'}</td>
                  <td>
                    {item.quantity != null && item.quantity <= (item.reorder_level || 0) ? (
                      <span className="low-stock">
                        <AlertTriangle size={14} /> {item.quantity}
                      </span>
                    ) : (
                      item.quantity != null ? item.quantity : '—'
                    )}
                  </td>
                  <td>{item.unit || '—'}</td>
                  <td>{item.unit_price != null ? `$${Number(item.unit_price).toFixed(2)}` : '—'}</td>
                  <td>{item.supplier || '—'}</td>
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
            <h2>{editingItem ? 'Edit Inventory Item' : 'New Inventory Item'}</h2>

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
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                    placeholder="e.g. tablets, vials, boxes"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Unit Price ($)</label>
                  <input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Reorder Level</label>
                  <input
                    type="number"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
