import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, DollarSign, Calendar, Users, Package, Syringe } from 'lucide-react';
import { api } from '../services/api.js';

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [appointmentsByType, setAppointmentsByType] = useState([]);
  const [speciesDistribution, setSpeciesDistribution] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [overdueVaccinations, setOverdueVaccinations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [ov, rev, appt, species, stock, vacc, activity] = await Promise.all([
        api.getReportOverview(),
        api.getRevenueByMonth(),
        api.getAppointmentsByType(),
        api.getSpeciesDistribution(),
        api.getLowStock(),
        api.getOverdueVaccinations(),
        api.getRecentActivity(),
      ]);
      setOverview(ov);
      setRevenueByMonth(rev);
      setAppointmentsByType(appt);
      setSpeciesDistribution(species);
      setLowStock(stock);
      setOverdueVaccinations(vacc);
      setRecentActivity(activity);
      setError('');
    } catch (err) {
      setError('Failed to load reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Reports & Analytics</h1></div>
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading reports...</div>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueByMonth.map(r => Number(r.revenue)), 1);
  const maxApptCount = Math.max(...appointmentsByType.map(a => Number(a.count)), 1);
  const maxSpeciesCount = Math.max(...speciesDistribution.map(s => Number(s.count)), 1);

  const barColors = ['#3b82f6', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#be185d', '#4f46e5', '#f59e0b', '#6366f1', '#14b8a6', '#f43f5e'];

  return (
    <div>
      <div className="page-header">
        <h1><BarChart3 size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Reports & Analytics</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI Cards */}
      {overview && (
        <div className="dashboard-cards" style={{ marginBottom: 32 }}>
          <div className="dashboard-card" style={{ cursor: 'default' }}>
            <div className="card-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><Users size={28} /></div>
            <h3>Total Patients</h3>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#3b82f6', margin: '8px 0' }}>{overview.patients.total}</p>
          </div>
          <div className="dashboard-card" style={{ cursor: 'default' }}>
            <div className="card-icon" style={{ background: '#d1fae5', color: '#059669' }}><DollarSign size={28} /></div>
            <h3>Total Revenue</h3>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#059669', margin: '8px 0' }}>${Number(overview.revenue.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Collected: ${Number(overview.revenue.collected).toLocaleString('en-US', { minimumFractionDigits: 2 })} | Outstanding: ${Number(overview.revenue.outstanding).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="dashboard-card" style={{ cursor: 'default' }}>
            <div className="card-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Calendar size={28} /></div>
            <h3>Appointments Today</h3>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#d97706', margin: '8px 0' }}>{overview.appointments.today}</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Upcoming: {overview.appointments.upcoming} | Completed: {overview.appointments.completed}
            </p>
          </div>
          <div className="dashboard-card" style={{ cursor: 'default', borderColor: overview.inventory.low_stock > 0 ? '#fecaca' : '#e2e8f0' }}>
            <div className="card-icon" style={{ background: overview.inventory.low_stock > 0 ? '#fee2e2' : '#cffafe', color: overview.inventory.low_stock > 0 ? '#dc2626' : '#0891b2' }}>
              <Package size={28} />
            </div>
            <h3>Low Stock Alerts</h3>
            <p style={{ fontSize: 32, fontWeight: 800, color: overview.inventory.low_stock > 0 ? '#dc2626' : '#059669', margin: '8px 0' }}>{overview.inventory.low_stock}</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>items below reorder level</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Revenue by Month */}
        <div className="detail-panel">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} color="#059669" /> Revenue by Month
          </h3>
          {revenueByMonth.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No revenue data available.</p>
          ) : (
            <div>
              {revenueByMonth.map((r, i) => (
                <div key={r.month} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 70, fontSize: 13, color: '#64748b', flexShrink: 0 }}>{r.month}</span>
                  <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 28, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(Number(r.revenue) / maxRevenue) * 100}%`,
                      background: `linear-gradient(90deg, #059669, #10b981)`,
                      height: '100%', borderRadius: 6, minWidth: 2,
                      display: 'flex', alignItems: 'center', paddingLeft: 8,
                    }}>
                      <span style={{ color: 'white', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        ${Number(r.revenue).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 60, textAlign: 'right' }}>{r.invoice_count} inv.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointments by Type */}
        <div className="detail-panel">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={20} color="#d97706" /> Appointments by Type
          </h3>
          {appointmentsByType.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No appointment data available.</p>
          ) : (
            <div>
              {appointmentsByType.map((a, i) => (
                <div key={a.type} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 130, fontSize: 13, color: '#64748b', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.type}</span>
                  <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 24, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(Number(a.count) / maxApptCount) * 100}%`,
                      background: barColors[i % barColors.length],
                      height: '100%', borderRadius: 6, minWidth: 2,
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', width: 30, textAlign: 'right' }}>{a.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Species Distribution */}
        <div className="detail-panel">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="#3b82f6" /> Patients by Species
          </h3>
          {speciesDistribution.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No patient data available.</p>
          ) : (
            <div>
              {speciesDistribution.map((s, i) => (
                <div key={s.species} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ width: 80, fontSize: 14, fontWeight: 600, color: '#334155' }}>{s.species}</span>
                  <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 28, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(Number(s.count) / maxSpeciesCount) * 100}%`,
                      background: barColors[i % barColors.length],
                      height: '100%', borderRadius: 6, minWidth: 2,
                      display: 'flex', alignItems: 'center', paddingLeft: 8,
                    }}>
                      <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{s.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="detail-panel">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} color="#7c3aed" /> Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No recent activity.</p>
          ) : (
            <div>
              {recentActivity.map((a, i) => (
                <div key={`${a.type}-${a.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span className={`status-badge ${a.type === 'appointment' ? 'status-scheduled' : a.type === 'diagnostic' ? 'status-pending' : 'status-paid'}`} style={{ fontSize: 11, textTransform: 'capitalize' }}>
                    {a.type}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: '#334155' }}>
                    {a.patient_name || 'Unknown'} — {a.detail || '—'}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Low Stock */}
        <div className="detail-panel" style={{ borderColor: lowStock.length > 0 ? '#fecaca' : '#e2e8f0' }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: lowStock.length > 0 ? '#dc2626' : '#334155' }}>
            <AlertTriangle size={20} color={lowStock.length > 0 ? '#dc2626' : '#94a3b8'} /> Low Stock Items ({lowStock.length})
          </h3>
          {lowStock.length === 0 ? (
            <p style={{ color: '#059669', fontWeight: 500 }}>All inventory items are above reorder levels.</p>
          ) : (
            <div className="data-table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Reorder At</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item.id} style={{ cursor: 'default' }}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{item.category || '—'}</td>
                      <td>
                        <span className="low-stock">{item.quantity} {item.unit}</span>
                      </td>
                      <td>{item.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Overdue Vaccinations */}
        <div className="detail-panel" style={{ borderColor: overdueVaccinations.length > 0 ? '#fecaca' : '#e2e8f0' }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: overdueVaccinations.length > 0 ? '#dc2626' : '#334155' }}>
            <Syringe size={20} color={overdueVaccinations.length > 0 ? '#dc2626' : '#94a3b8'} /> Overdue Vaccinations ({overdueVaccinations.length})
          </h3>
          {overdueVaccinations.length === 0 ? (
            <p style={{ color: '#059669', fontWeight: 500 }}>All vaccinations are up to date.</p>
          ) : (
            <div className="data-table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Vaccine</th>
                    <th>Due Date</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueVaccinations.map((v) => (
                    <tr key={v.id} style={{ cursor: 'default' }}>
                      <td style={{ fontWeight: 600 }}>{v.patient_name} ({v.patient_species})</td>
                      <td>{v.vaccine_name}</td>
                      <td style={{ color: '#dc2626', fontWeight: 600 }}>
                        {v.next_due_date ? new Date(v.next_due_date).toLocaleDateString() : '—'}
                      </td>
                      <td>{v.owner_name} {v.owner_phone ? `(${v.owner_phone})` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
