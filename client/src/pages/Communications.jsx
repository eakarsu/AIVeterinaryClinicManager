import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Edit, Trash2, Sparkles, Send } from 'lucide-react';
import { api } from '../services/api.js';
import AIResponse from '../components/AIResponse.jsx';

const emptyForm = {
  patient_id: '',
  type: 'email',
  subject: '',
  message: '',
  recipient_email: '',
  recipient_phone: '',
  status: 'draft',
};

export default function Communications() {
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
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [composeContext, setComposeContext] = useState('');
  const [composeTone, setComposeTone] = useState('Professional and warm');
  const [showAiCompose, setShowAiCompose] = useState(false);

  useEffect(() => {
    loadItems();
    loadPatients();
  }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.getCommunications();
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load communications: ' + err.message);
    } finally {
      setLoading(false);
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
      const full = await api.getCommunication(item.id);
      setSelectedItem(full);
      setView('detail');
      setError('');
    } catch (err) {
      setError('Failed to load communication details: ' + err.message);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedItem(null);
    setError('');
    setSuccess('');
  };

  const openNewModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setAiResult('');
    setShowAiCompose(false);
    setComposeContext('');
    setComposeTone('Professional and warm');
    setShowModal(true);
    setError('');
  };

  const openEditModal = () => {
    setEditingItem(selectedItem);
    setForm({
      patient_id: selectedItem.patient_id || '',
      type: selectedItem.type || 'email',
      subject: selectedItem.subject || '',
      message: selectedItem.message || '',
      recipient_email: selectedItem.recipient_email || '',
      recipient_phone: selectedItem.recipient_phone || '',
      status: selectedItem.status || 'draft',
    });
    setAiResult('');
    setShowAiCompose(false);
    setComposeContext('');
    setComposeTone('Professional and warm');
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm(emptyForm);
    setAiResult('');
    setShowAiCompose(false);
    setComposeContext('');
    setComposeTone('Professional and warm');
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'patient_id' && value) {
      const patient = patients.find((p) => String(p.id) === String(value));
      if (patient) {
        setForm((prev) => ({
          ...prev,
          patient_id: value,
          recipient_email: patient.owner_email || prev.recipient_email,
          recipient_phone: patient.owner_phone || prev.recipient_phone,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingItem) {
        const updated = await api.updateCommunication(editingItem.id, form);
        setSelectedItem(updated);
        setSuccess('Communication updated successfully.');
      } else {
        await api.createCommunication(form);
        setSuccess('Communication created successfully.');
      }
      closeModal();
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to save communication');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm('Are you sure you want to delete this communication? This action cannot be undone.')) return;
    try {
      await api.deleteCommunication(selectedItem.id);
      setSuccess('Communication deleted successfully.');
      setSelectedItem(null);
      setView('list');
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to delete communication');
    }
  };

  const handleAiCompose = async () => {
    if (!composeContext) return;
    setAiLoading(true);
    setAiResult('');
    setError('');
    try {
      const patient = patients.find((p) => String(p.id) === String(form.patient_id));
      const payload = {
        type: form.type,
        context: composeContext,
        owner_name: patient?.owner_name || '',
        patient_name: patient?.name || '',
        tone: composeTone,
      };
      const result = await api.aiCompose(payload);
      const composed = result.result || result.message || result.content || JSON.stringify(result);
      setAiResult(composed);
      setForm((prev) => ({ ...prev, message: composed }));
    } catch (err) {
      setError(err.message || 'AI compose failed');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.patient_name || '').toLowerCase().includes(term) ||
      (item.owner_name || '').toLowerCase().includes(term) ||
      (item.type || '').toLowerCase().includes(term) ||
      (item.subject || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  const truncate = (str, len = 60) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'sent': return 'status-badge status-sent';
      case 'draft': return 'status-badge status-draft';
      case 'delivered': return 'status-badge status-delivered';
      case 'failed': return 'status-badge status-failed';
      default: return 'status-badge';
    }
  };

  // Detail View
  if (view === 'detail' && selectedItem) {
    return (
      <div>
        <a className="back-link" onClick={backToList} href="#!">
          <ArrowLeft size={16} /> Back to Communications
        </a>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="detail-panel">
          <div className="detail-header">
            <h2>{selectedItem.subject || 'Communication'}</h2>
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
              <label>Type</label>
              <span>{selectedItem.type || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Status</label>
              <span className={getStatusClass(selectedItem.status)}>
                {selectedItem.status || '—'}
              </span>
            </div>
            <div className="detail-field">
              <label>Subject</label>
              <span>{selectedItem.subject || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Recipient Email</label>
              <span>{selectedItem.recipient_email || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Recipient Phone</label>
              <span>{selectedItem.recipient_phone || '—'}</span>
            </div>
            <div className="detail-field">
              <label>Created</label>
              <span>{formatDate(selectedItem.created_at)}</span>
            </div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <label>Message</label>
              <span style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.message || '—'}</span>
            </div>
          </div>
        </div>

        {showModal && renderModal()}
      </div>
    );
  }

  // Modal
  function renderModal() {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>{editingItem ? 'Edit Communication' : 'New Communication'}</h2>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Patient *</label>
                <select name="patient_id" value={form.patient_id} onChange={handleChange} required>
                  <option value="">Select a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.owner_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select name="type" value={form.type} onChange={handleChange} required>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="letter">Letter</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Communication subject..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Recipient Email</label>
                <input
                  type="email"
                  name="recipient_email"
                  value={form.recipient_email}
                  onChange={handleChange}
                  placeholder="recipient@example.com"
                />
              </div>
              <div className="form-group">
                <label>Recipient Phone</label>
                <input
                  type="tel"
                  name="recipient_phone"
                  value={form.recipient_phone}
                  onChange={handleChange}
                  placeholder="+1 555-0123"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={6}
                placeholder="Write your message here or use AI Compose..."
                required
              />
            </div>

            {/* AI Compose Section */}
            <button
              type="button"
              className="btn btn-ai"
              onClick={() => setShowAiCompose((prev) => !prev)}
              style={{ marginBottom: '1rem', width: '100%' }}
            >
              <Sparkles size={16} /> {showAiCompose ? 'Hide AI Compose' : 'AI Compose'}
            </button>

            {showAiCompose && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', background: '#f8fafc' }}>
                <div className="form-group">
                  <label>Context *</label>
                  <textarea
                    value={composeContext}
                    onChange={(e) => setComposeContext(e.target.value)}
                    rows={3}
                    placeholder="Describe what the message is about (e.g., appointment reminder, vaccination follow-up, test results)..."
                  />
                </div>
                <div className="form-group">
                  <label>Tone</label>
                  <select value={composeTone} onChange={(e) => setComposeTone(e.target.value)}>
                    <option value="Professional and warm">Professional and warm</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Casual">Casual</option>
                    <option value="Sympathetic">Sympathetic</option>
                    <option value="Formal">Formal</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-ai"
                  onClick={handleAiCompose}
                  disabled={aiLoading || !composeContext}
                  style={{ width: '100%' }}
                >
                  <Sparkles size={16} /> {aiLoading ? 'Composing...' : 'Generate Message'}
                </button>
                <AIResponse title="AI Composed Message" content={aiResult} loading={aiLoading} />
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Send size={16} /> {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div>
      <div className="page-header">
        <h1>Communications</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={openNewModal}>
            <Plus size={16} /> New Communication
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by patient, owner, type, subject, or status..."
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
              <th>Type</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>Loading...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>
                  {searchTerm ? 'No communications match your search.' : 'No communications found.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td>{item.patient_name || '—'}</td>
                  <td>{item.owner_name || '—'}</td>
                  <td>{item.type || '—'}</td>
                  <td>{truncate(item.subject)}</td>
                  <td>
                    <span className={getStatusClass(item.status)}>
                      {item.status || '—'}
                    </span>
                  </td>
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
