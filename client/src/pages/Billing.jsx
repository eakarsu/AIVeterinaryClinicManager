import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, DollarSign, PlusCircle, MinusCircle } from 'lucide-react';
import { api } from '../services/api.js';

const emptyFormServices = [{ service: '', amount: '' }];

export default function Billing() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [patients, setPatients] = useState([]);
  const [formServices, setFormServices] = useState(emptyFormServices);
  const [formData, setFormData] = useState({
    patient_id: '',
    tax: '',
    discount: '',
    payment_status: 'pending',
    payment_method: 'cash',
    notes: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBillings();
  }, []);

  const loadBillings = async () => {
    setLoading(true);
    try {
      const data = await api.getBillings();
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load billings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      setError('Failed to load patients: ' + err.message);
    }
  };

  const handleRowClick = async (billing) => {
    try {
      const data = await api.getBilling(billing.id);
      setSelectedItem(data);
      setView('detail');
      setError('');
    } catch (err) {
      setError('Failed to load billing details: ' + err.message);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedItem(null);
  };

  const calcTotal = (services) => {
    return services.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  };

  const openCreateModal = async () => {
    setEditingItem(null);
    setFormData({
      patient_id: '',
      tax: '',
      discount: '',
      payment_status: 'pending',
      payment_method: 'cash',
      notes: '',
    });
    setFormServices([{ service: '', amount: '' }]);
    setShowModal(true);
    setError('');
    await loadPatients();
  };

  const openEditModal = async () => {
    setEditingItem(selectedItem);

    let services = [{ service: '', amount: '' }];
    if (selectedItem.services) {
      try {
        const parsed = typeof selectedItem.services === 'string'
          ? JSON.parse(selectedItem.services)
          : selectedItem.services;
        if (Array.isArray(parsed) && parsed.length > 0) {
          services = parsed.map((s) => ({
            service: s.service || s.name || '',
            amount: s.amount != null ? String(s.amount) : '',
          }));
        }
      } catch {
        // keep default
      }
    }

    setFormServices(services);
    setFormData({
      patient_id: selectedItem.patient_id || '',
      tax: selectedItem.tax != null ? String(selectedItem.tax) : '',
      discount: selectedItem.discount != null ? String(selectedItem.discount) : '',
      payment_status: selectedItem.payment_status || 'pending',
      payment_method: selectedItem.payment_method || 'cash',
      notes: selectedItem.notes || '',
    });
    setShowModal(true);
    setError('');
    await loadPatients();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormServices([{ service: '', amount: '' }]);
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (index, field, value) => {
    setFormServices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addServiceRow = () => {
    setFormServices((prev) => [...prev, { service: '', amount: '' }]);
  };

  const removeServiceRow = (index) => {
    setFormServices((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const totalAmount = calcTotal(formServices);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const services = formServices
      .filter((s) => s.service.trim() !== '')
      .map((s) => ({ service: s.service, amount: parseFloat(s.amount) || 0 }));

    const payload = {
      patient_id: Number(formData.patient_id),
      services: JSON.stringify(services),
      total_amount: calcTotal(formServices),
      tax: formData.tax ? Number(formData.tax) : 0,
      discount: formData.discount ? Number(formData.discount) : 0,
      payment_status: formData.payment_status,
      payment_method: formData.payment_method,
      notes: formData.notes,
    };

    try {
      if (editingItem) {
        const updated = await api.updateBilling(editingItem.id, payload);
        setSelectedItem(updated);
        setSuccess('Invoice updated successfully.');
      } else {
        await api.createBilling(payload);
        setSuccess('Invoice created successfully.');
      }
      closeModal();
      await loadBillings();
    } catch (err) {
      setError('Failed to save invoice: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }
    try {
      await api.deleteBilling(selectedItem.id);
      setSuccess('Invoice deleted successfully.');
      handleBackToList();
      await loadBillings();
    } catch (err) {
      setError('Failed to delete invoice: ' + err.message);
    }
  };

  const parseServices = (services) => {
    if (!services) return [];
    try {
      const parsed = typeof services === 'string' ? JSON.parse(services) : services;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusClass = (status) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'pending': return 'status-pending';
      case 'partial': return 'status-partial';
      case 'overdue': return 'status-overdue';
      default: return '';
    }
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.patient_name || '').toLowerCase().includes(term) ||
      (item.owner_name || '').toLowerCase().includes(term) ||
      (item.payment_status || '').toLowerCase().includes(term) ||
      (item.payment_method || '').toLowerCase().includes(term)
    );
  });

  // Detail View
  if (view === 'detail' && selectedItem) {
    const services = parseServices(selectedItem.services);
    const subtotal = services.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const tax = parseFloat(selectedItem.tax) || 0;
    const discount = parseFloat(selectedItem.discount) || 0;
    const grandTotal = subtotal + tax - discount;

    return (
      <div>
        <button className="back-link" onClick={handleBackToList}>
          <ArrowLeft size={18} /> Back to Billing
        </button>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="detail-panel">
          <div className="detail-header">
            <h2><DollarSign size={22} /> Invoice #{selectedItem.id}</h2>
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
              <label>Owner</label>
              <span>{selectedItem.owner_name || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Payment Status</label>
              <span className={`status-badge ${statusClass(selectedItem.payment_status)}`}>
                {selectedItem.payment_status || '—'}
              </span>
            </div>
            <div className="detail-field">
              <label>Payment Method</label>
              <span>{selectedItem.payment_method ? selectedItem.payment_method.replace(/_/g, ' ') : '—'}</span>
            </div>
            <div className="detail-field">
              <label>Created</label>
              <span>{formatDate(selectedItem.created_at)}</span>
            </div>
            <div className="detail-field">
              <label>Total Amount</label>
              <span>{formatCurrency(selectedItem.total_amount)}</span>
            </div>
          </div>

          {services.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3>Services</h3>
              <table className="data-table" style={{ marginTop: '0.5rem' }}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s, i) => (
                    <tr key={i}>
                      <td>{s.service || s.name || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(s.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Subtotal</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(subtotal)}</td>
                  </tr>
                  {tax > 0 && (
                    <tr>
                      <td>Tax</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(tax)}</td>
                    </tr>
                  )}
                  {discount > 0 && (
                    <tr>
                      <td>Discount</td>
                      <td style={{ textAlign: 'right' }}>-{formatCurrency(discount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Grand Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1em' }}>{formatCurrency(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedItem.notes && (
            <div className="detail-field" style={{ marginTop: '1.5rem' }}>
              <label>Notes</label>
              <span>{selectedItem.notes}</span>
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
        <h1><DollarSign size={28} /> Billing</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={openCreateModal}>
            <Plus size={18} /> New Invoice
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by patient, owner, status, or method..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Owner</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Date</th>
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
                  {searchTerm ? 'No invoices match your search.' : 'No invoices found.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.patient_name || '—'}</td>
                  <td>{item.owner_name || '—'}</td>
                  <td>{formatCurrency(item.total_amount)}</td>
                  <td>
                    <span className={`status-badge ${statusClass(item.payment_status)}`}>
                      {item.payment_status || '—'}
                    </span>
                  </td>
                  <td>{item.payment_method ? item.payment_method.replace(/_/g, ' ') : '—'}</td>
                  <td>{formatDate(item.created_at)}</td>
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
            <h2>{editingItem ? 'Edit Invoice' : 'New Invoice'}</h2>

            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Patient *</label>
                <select
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.owner_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Services</label>
                {formServices.map((s, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Service name"
                      value={s.service}
                      onChange={(e) => handleServiceChange(index, 'service', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={s.amount}
                      onChange={(e) => handleServiceChange(index, 'amount', e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeServiceRow(index)}
                      disabled={formServices.length <= 1}
                      title="Remove service"
                    >
                      <MinusCircle size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addServiceRow}>
                  <PlusCircle size={16} /> Add Service
                </button>
              </div>

              <div className="form-group">
                <label>Total Amount (auto-calculated)</label>
                <input
                  type="text"
                  value={formatCurrency(totalAmount)}
                  readOnly
                  style={{ background: '#f0f0f0' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tax</label>
                  <input
                    type="number"
                    name="tax"
                    value={formData.tax}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Discount</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Status *</label>
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="payment_plan">Payment Plan</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
