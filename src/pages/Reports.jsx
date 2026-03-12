import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';
import { reportService } from '../services/api';

const fmt = (n) => 'N$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const reportTypes = [
  { id: 'daily', label: '📊 Daily Sales' },
  { id: 'monthly', label: '📈 Monthly Revenue' },
  { id: 'vendor', label: '🏪 Vendor Performance' },
  { id: 'consumption', label: '💡 Customer Consumption' },
  { id: 'arrears', label: '⚠️ Arrears Collection' },
  { id: 'audit', label: '🔒 System Audit' },
];

export default function Reports() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('daily');
  const [dateFrom, setDateFrom] = useState('2026-03-12');
  const [dateTo, setDateTo] = useState('2026-03-12');
  const [vendor, setVendor] = useState('all');

  useEffect(() => {
    setLoading(true);
    reportService.generate('vendor')
      .then(res => {
        setReportData(res.breakdown);
        setSummary(res.summary);
      })
      .catch(err => console.error('Failed to load report data:', err))
      .finally(() => setLoading(false));
  }, []);

  const summaryTiles = useMemo(() => [
    { label: 'Total Transactions', value: '247', sub: (summary.tokensGenerated || 0) + ' tokens generated', accent: 'var(--accent)' },
    { label: 'Total Sales Revenue', value: fmt(summary.todaySales || 0), sub: '↑ 12.4% vs yesterday', accent: 'var(--success)' },
    { label: 'Energy Dispensed', value: '11,842 kWh', sub: 'Avg 47.9 kWh per txn', accent: '#8b5cf6' },
    { label: 'Arrears Collected', value: 'N$1,248', sub: 'From 14 accounts', accent: 'var(--warning)' },
    { label: 'VAT Collected', value: 'N$2,441', sub: '@ 15%', accent: 'var(--info)' },
    { label: 'Failed Transactions', value: '3', sub: '1.2% failure rate', accent: 'var(--danger)' },
  ], [summary]);

  const totals = useMemo(() => reportData.reduce(
    (acc, r) => ({
      transactions: acc.transactions + r.transactions,
      grossSales: acc.grossSales + r.grossSales,
      arrears: acc.arrears + r.arrears,
      vat: acc.vat + r.vat,
      commission: acc.commission + r.commission,
      netRevenue: acc.netRevenue + r.netRevenue,
      kwh: acc.kwh + r.kwh,
    }),
    { transactions: 0, grossSales: 0, arrears: 0, vat: 0, commission: 0, netRevenue: 0, kwh: 0 }
  ), [reportData]);

  return (
    <div className="page-reports">
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Reports</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Generate and export operational reports
        </p>
      </div>

      {/* Report Type Selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {reportTypes.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelected(rt.id)}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              border: selected === rt.id ? '2px solid var(--accent)' : '2px solid var(--border)',
              background: selected === rt.id ? 'var(--accent-glow)' : 'var(--card-bg)',
              color: selected === rt.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: selected === rt.id ? 600 : 400,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {rt.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>REPORT TYPE</label>
          <input className="form-input" readOnly value={reportTypes.find((r) => r.id === selected)?.label || ''} style={{ width: 170, background: 'var(--content-bg)', cursor: 'default' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>DATE FROM</label>
          <input type="date" className="form-input mono" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 150 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>DATE TO</label>
          <input type="date" className="form-input mono" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 150 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>VENDOR</label>
          <select className="form-input" value={vendor} onChange={(e) => setVendor(e.target.value)} style={{ width: 170 }}>
            <option value="all">All Vendors</option>
            <option value="V001">Head Office</option>
            <option value="V002">Grunau Post</option>
            <option value="V003">Noordoewer</option>
            <option value="V004">Groot Aub</option>
            <option value="V005">Dordabis</option>
            <option value="V006">Stampriet</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <BarChart3 size={14} /> Generate Report
        </button>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <FileText size={14} /> Export PDF
        </button>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Summary Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {summaryTiles.map((tile, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px', borderLeft: `4px solid ${tile.accent}` }}>
            <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{tile.label}</div>
            <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{tile.value}</div>
            <div style={{ fontSize: '0.775rem', color: tile.label === 'Total Sales Revenue' ? 'var(--success)' : 'var(--text-muted)' }}>
              <TrendingUp size={11} style={{ marginRight: 3, verticalAlign: 'middle', display: tile.label === 'Total Sales Revenue' ? 'inline' : 'none' }} />
              {tile.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Daily Sales Report — 12 March 2026</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>Breakdown by vendor channel</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--content-bg)' }}>
                {['VENDOR', 'TRANSACTIONS', 'GROSS SALES', 'ARREARS COLLECTED', 'VAT', 'COMMISSION', 'NET REVENUE', 'ENERGY (kWh)'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'VENDOR' ? 'left' : 'right', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{row.vendor}</td>
                  <td className="mono" style={{ padding: '10px 14px', textAlign: 'right' }}>{row.transactions}</td>
                  <td className="mono" style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(row.grossSales)}</td>
                  <td className="mono" style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--warning)' }}>{fmt(row.arrears)}</td>
                  <td className="mono" style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(row.vat)}</td>
                  <td className="mono" style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(row.commission)}</td>
                  <td className="mono" style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>{fmt(row.netRevenue)}</td>
                  <td className="mono" style={{ padding: '10px 14px', textAlign: 'right' }}>{row.kwh.toLocaleString('en-US', { minimumFractionDigits: 1 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--content-bg)', fontWeight: 700 }}>
                <td style={{ padding: '11px 14px' }}>TOTAL</td>
                <td className="mono" style={{ padding: '11px 14px', textAlign: 'right' }}>{totals.transactions}</td>
                <td className="mono" style={{ padding: '11px 14px', textAlign: 'right' }}>{fmt(totals.grossSales)}</td>
                <td className="mono" style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--warning)' }}>{fmt(totals.arrears)}</td>
                <td className="mono" style={{ padding: '11px 14px', textAlign: 'right' }}>{fmt(totals.vat)}</td>
                <td className="mono" style={{ padding: '11px 14px', textAlign: 'right' }}>{fmt(totals.commission)}</td>
                <td className="mono" style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--success)' }}>{fmt(totals.netRevenue)}</td>
                <td className="mono" style={{ padding: '11px 14px', textAlign: 'right' }}>{totals.kwh.toLocaleString('en-US', { minimumFractionDigits: 1 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
