import { useState } from 'react';
import { Gauge, Plus, Save, History } from 'lucide-react';
import { tariffGroups, systemConfig } from '../data/mockData';

const blockColors = {
  R1: ['#0d9488', '#2563eb', '#7c3aed'],
  R2: ['#16a34a', '#059669', '#0d9488'],
  C1: ['#d97706'],
};

const tariffLog = [
  { date: '2026-02-01', desc: 'R1 Block 2 rate increased from N$1.48 to N$1.56', ref: 'TCC-2026-014' },
  { date: '2026-01-15', desc: 'REL Levy updated from N$2.00 to N$2.40 per transaction', ref: 'TCC-2026-007' },
  { date: '2025-11-01', desc: 'C1 Commercial rate adjusted from N$1.82 to N$1.95', ref: 'TCC-2025-089' },
  { date: '2025-07-01', desc: 'VAT confirmed at 15.0% — no change', ref: 'TCC-2025-041' },
];

export default function Tariffs() {
  const [cfg, setCfg] = useState({ ...systemConfig });

  const handleChange = (field, value) => setCfg((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="page-tariffs">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Tariff Management</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Configure step tariffs, levies, and billing parameters
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* LEFT — Tariff Groups */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Gauge size={16} color="var(--accent)" />
                  <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Tariff Groups</h3>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Step tariff configuration per IEC 62055-41
                </p>
              </div>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <Plus size={14} /> Add Group
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {tariffGroups.map((grp) => {
                const colors = blockColors[grp.id] || ['#6b7280'];
                return (
                  <div key={grp.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    {/* Group header */}
                    <div style={{ padding: '12px 16px', background: 'var(--content-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{grp.id} — {grp.name}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          SGC: <span className="mono">{grp.sgc}</span> &nbsp;·&nbsp; {grp.meterCount.toLocaleString()} meters
                        </div>
                      </div>
                      <span className="badge badge-success">Active</span>
                    </div>

                    {/* Step blocks */}
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {grp.blocks.map((blk, i) => (
                        <div key={i} style={{
                          borderLeft: `4px solid ${colors[i] || colors[0]}`,
                          borderRadius: '0 6px 6px 0',
                          background: `${colors[i] || colors[0]}12`,
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.825rem', color: colors[i] || colors[0] }}>{blk.name}</div>
                            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 1 }}>{blk.range}</div>
                          </div>
                          <div>
                            <span className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              N${blk.rate.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>/ kWh</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — Fixed Charges & Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Fixed Charges panel */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.9375rem' }}>Fixed Charges &amp; Levies</h3>

            {[
              { label: 'VAT Rate', field: 'vatRate', suffix: '%' },
              { label: 'Fixed Monthly Charge', field: 'fixedCharge', prefix: 'N$' },
              { label: 'REL Levy', field: 'relLevy', prefix: 'N$', suffix: '/transaction' },
              { label: 'Min Purchase Amount', field: 'minPurchase', prefix: 'N$' },
            ].map(({ label, field, prefix, suffix }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)' }}>{label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {prefix && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{prefix}</span>}
                  <input
                    type="number"
                    className="form-input mono"
                    value={cfg[field]}
                    onChange={(e) => handleChange(field, parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                    step="0.01"
                  />
                  {suffix && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{suffix}</span>}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)' }}>Arrears Collection Mode</label>
              <select className="form-input" value={cfg.arrearsMode} onChange={(e) => handleChange('arrearsMode', e.target.value)}>
                <option>Auto-deduct on vend</option>
                <option>Manual collection</option>
                <option>Disabled</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)' }}>Arrears Threshold</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>N$</span>
                <input
                  type="number"
                  className="form-input mono"
                  value={cfg.arrearsThreshold}
                  onChange={(e) => handleChange('arrearsThreshold', parseFloat(e.target.value))}
                  step="10"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Save size={14} /> Save Changes
              </button>
              <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '8px 14px' }}>
                <History size={14} /> Tariff History
              </button>
            </div>
          </div>

          {/* Tariff Change Log */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.9375rem' }}>Tariff Change Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {tariffLog.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < tariffLog.length - 1 ? 16 : 0, marginBottom: i < tariffLog.length - 1 ? 0 : 0, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />
                    {i < tariffLog.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < tariffLog.length - 1 ? 16 : 0 }}>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{entry.date}</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', marginBottom: 2 }}>{entry.desc}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Ref: {entry.ref}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
