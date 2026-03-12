import { Store, Phone, User, DollarSign, TrendingUp } from 'lucide-react';
import { vendors } from '../data/mockData';

const fmt = (n) => 'N$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusBadge = (status) => {
  const map = {
    Active: { cls: 'badge-success', label: 'Active' },
    'Low Balance': { cls: 'badge-warning', label: 'Low Balance' },
    Suspended: { cls: 'badge-danger', label: 'Suspended' },
  };
  const cfg = map[status] || { cls: 'badge-muted', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

const commissionData = vendors.map((v) => ({
  name: v.name,
  rate: v.commissionRate,
  gross: v.totalSales,
  commission: v.totalSales * (v.commissionRate / 100),
  net: v.totalSales - v.totalSales * (v.commissionRate / 100),
}));

const totals = commissionData.reduce(
  (acc, r) => ({
    gross: acc.gross + r.gross,
    commission: acc.commission + r.commission,
    net: acc.net + r.net,
  }),
  { gross: 0, commission: 0, net: 0 }
);

export default function Vendors() {
  return (
    <div className="page-vendors">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Vendor Management</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Manage vending channels, commissions, and sales batches
        </p>
      </div>

      {/* Vendor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 32 }}>
        {vendors.map((v) => (
          <div key={v.id} className="card" style={{ padding: 20 }}>
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Store size={18} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3 }}>{v.name}</div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{v.location}</div>
                </div>
              </div>
              {statusBadge(v.status)}
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--content-bg)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <DollarSign size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Sales</span>
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{fmt(v.totalSales)}</div>
              </div>
              <div style={{ background: 'var(--content-bg)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <TrendingUp size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transactions</span>
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{v.transactions.toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--content-bg)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Balance</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', color: v.balance < 3000 && v.status !== 'Suspended' ? 'var(--warning)' : 'var(--text-primary)' }}>{fmt(v.balance)}</div>
              </div>
              <div style={{ background: 'var(--content-bg)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Commission</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{v.commissionRate}%</div>
              </div>
            </div>

            {/* Operator Info */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 14, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={13} /> {v.operator}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={13} /> {v.phone}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.775rem', padding: '5px 8px' }}>View Details</button>
              <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.775rem', padding: '5px 8px' }}>Open Batch</button>
              <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.775rem', padding: '5px 8px' }}>Close Batch</button>
            </div>
          </div>
        ))}
      </div>

      {/* Commission Summary Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Commission Summary — Current Month</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.855rem' }}>
          <thead>
            <tr style={{ background: 'var(--content-bg)' }}>
              {['VENDOR', 'RATE', 'GROSS SALES', 'COMMISSION', 'NET TO NAMPOWER'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: h === 'VENDOR' ? 'left' : 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commissionData.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '11px 16px', fontWeight: 500 }}>{row.name}</td>
                <td className="mono" style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.rate}%</td>
                <td className="mono" style={{ padding: '11px 16px', textAlign: 'right' }}>{fmt(row.gross)}</td>
                <td className="mono" style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--warning)' }}>{fmt(row.commission)}</td>
                <td className="mono" style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>{fmt(row.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--content-bg)', fontWeight: 700 }}>
              <td style={{ padding: '11px 16px' }}>TOTAL</td>
              <td style={{ padding: '11px 16px' }}></td>
              <td className="mono" style={{ padding: '11px 16px', textAlign: 'right' }}>{fmt(totals.gross)}</td>
              <td className="mono" style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--warning)' }}>{fmt(totals.commission)}</td>
              <td className="mono" style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--success)' }}>{fmt(totals.net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
