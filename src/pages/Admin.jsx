import { useState, useEffect } from 'react';
import { Settings, Shield, Users, Plus, Edit, Activity } from 'lucide-react';
import { adminService } from '../services/api';

const roleBadge = (role) => {
  const map = {
    ADMIN: { bg: '#0d9488', color: '#fff' },
    OPERATOR: { bg: '#2563eb', color: '#fff' },
    SUPERVISOR: { bg: '#7c3aed', color: '#fff' },
    VIEWER: { bg: '#64748b', color: '#fff' },
  };
  const s = map[role] || { bg: '#e2e8f0', color: '#374151' };
  return <span style={{ background: s.bg, color: s.color, borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>{role}</span>;
};

const statusBadge = (status) => {
  const map = {
    Online: { color: 'var(--success)', dot: '#22c55e' },
    Offline: { color: 'var(--text-muted)', dot: '#94a3b8' },
    Suspended: { color: 'var(--danger)', dot: '#ef4444' },
  };
  const s = map[status] || { color: 'var(--text-muted)', dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: s.color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
};

const permissions = [
  { label: 'Vend Tokens',          ADMIN: true,  SUPERVISOR: true,  OPERATOR: true,  VIEWER: false },
  { label: 'View Transactions',    ADMIN: true,  SUPERVISOR: true,  OPERATOR: true,  VIEWER: true  },
  { label: 'Reverse Transactions', ADMIN: true,  SUPERVISOR: true,  OPERATOR: false, VIEWER: false },
  { label: 'Customer Management',  ADMIN: true,  SUPERVISOR: true,  OPERATOR: true,  VIEWER: false },
  { label: 'Vendor Management',    ADMIN: true,  SUPERVISOR: true,  OPERATOR: true,  VIEWER: false },
  { label: 'Tariff Configuration', ADMIN: true,  SUPERVISOR: false, OPERATOR: false, VIEWER: false },
  { label: 'Reports Access',       ADMIN: true,  SUPERVISOR: true,  OPERATOR: true,  VIEWER: true  },
  { label: 'System Admin',         ADMIN: true,  SUPERVISOR: false, OPERATOR: false, VIEWER: false },
  { label: 'API Access',           ADMIN: true,  SUPERVISOR: false, OPERATOR: false, VIEWER: false },
];

const auditTypeStyles = {
  vend:   { bg: '#0d948815', border: '#0d9488', label: 'VEND' },
  login:  { bg: '#2563eb15', border: '#2563eb', label: 'LOGIN' },
  create: { bg: '#16a34a15', border: '#16a34a', label: 'CREATE' },
  update: { bg: '#d9770615', border: '#d97706', label: 'UPDATE' },
  delete: { bg: '#ef444415', border: '#ef4444', label: 'DELETE' },
};

export default function Admin() {
  const [operators, setOperators] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminService.getOperators(),
      adminService.getAuditLog(),
    ])
      .then(([operatorsRes, auditRes]) => {
        setOperators(operatorsRes.data);
        setAuditLog(auditRes.data);
      })
      .catch(err => console.error('Failed to load admin data:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-admin">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>System Administration</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Manage operators, roles, permissions, and system configuration
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Operator Management */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="var(--accent)" />
                  <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Operator Management</h3>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>Role-based access control</p>
              </div>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <Plus size={14} /> Add Operator
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--content-bg)' }}>
                  {['NAME', 'USERNAME', 'ROLE', 'LAST LOGIN', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => (
                  <tr key={op.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{op.name}</td>
                    <td className="mono" style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{op.username}</td>
                    <td style={{ padding: '10px 14px' }}>{roleBadge(op.role)}</td>
                    <td className="mono" style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{op.lastLogin}</td>
                    <td style={{ padding: '10px 14px' }}>{statusBadge(op.status)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.77rem', padding: '4px 10px' }}>
                        <Edit size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* System Settings */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Settings size={16} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>System Settings</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'STS Gateway Host', value: 'sts-gw.nampower.com.na', mono: true },
                { label: 'Encryption Standard', value: 'AES-128', mono: true },
                { label: 'API Port (ISO 8583)', value: '9898', mono: true },
                { label: 'Session Timeout (min)', value: '30', mono: true },
                { label: 'Auto-backup', value: 'Enabled — 02:00 daily', mono: false },
                { label: 'Retention Period', value: '7 years', mono: false },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</label>
                  <input className={`form-input${mono ? ' mono' : ''}`} defaultValue={value} style={{ width: '100%' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Settings size={14} /> Save System Settings
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Permissions Matrix */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Role Permissions Matrix</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem' }}>
              <thead>
                <tr style={{ background: 'var(--content-bg)' }}>
                  <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>PERMISSION</th>
                  {['ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'].map((r) => (
                    <th key={r} style={{ padding: '9px 10px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{perm.label}</td>
                    {['ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'].map((role) => (
                      <td key={role} style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {perm[role]
                          ? <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1rem' }}>✓</span>
                          : <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '1rem' }}>✗</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Log */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Audit Log</h3>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {auditLog.map((entry, i) => {
                const s = auditTypeStyles[entry.type] || auditTypeStyles.update;
                return (
                  <div key={i} style={{
                    background: s.bg,
                    borderLeft: `3px solid ${s.border}`,
                    borderRadius: '0 6px 6px 0',
                    padding: '9px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.border, letterSpacing: '0.05em' }}>{s.label}</span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.time}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)' }}>{entry.event}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{entry.detail}</div>
                    <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>User: {entry.user}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
